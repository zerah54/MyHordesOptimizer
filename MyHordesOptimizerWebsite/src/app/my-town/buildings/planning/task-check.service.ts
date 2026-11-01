import { inject, Injectable } from '@angular/core';
import { map, Observable, of, switchMap, take, throwError } from 'rxjs';

import { DailyActionEnum } from '../../../_abstract_model/enum/daily-action.enum';
import { HomeEnum } from '../../../_abstract_model/enum/home.enum';
import { TownService } from '../../../_abstract_model/services/town.service';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { DailyAction } from '../../../_abstract_model/types/daily-action.class';
import { Home, HomeWithValue } from '../../../_abstract_model/types/home.class';
import { isHouseLevelEditable } from '../../../_abstract_model/types/town-details.class';
import { UpdateInfo } from '../../../_abstract_model/types/update-info.class';
import { getTown, getUser, getUserId } from '../../../_core/utilities/localstorage.util';
import { PlanTaskDTO } from './plan.types';
import { homeLevelOf, taskCheckKey, taskUpgrade } from './task-status.util';

/**
 * Coche « fait » d'une consigne : écrit la donnée d'origine (action quotidienne, niveau d'amélioration) ou, à défaut,
 * la coche propre à la consigne ; le citoyen passé est mis à jour une fois l'écriture acceptée.
 */
@Injectable({ providedIn: 'root' })
export class TaskCheckService {

    private readonly town_service: TownService = inject(TownService);

    /**
     * Marque une consigne faite ou non.
     * @param {Citizen} citizen Citoyen concerné (modifié en place après succès).
     * @param {PlanTaskDTO} task Consigne.
     * @param {boolean} done Nouvel état.
     * @param {number} day Jour de la consigne.
     * @returns {Observable<void>} Émet une fois l'écriture acceptée.
     */
    public setDone(citizen: Citizen, task: PlanTaskDTO, done: boolean, day: number): Observable<void> {
        if (task.kind === 'action') {
            // Seule une action connue du site est écrite : la clé finit dans l'URL.
            const action: DailyActionEnum | undefined = DailyActionEnum.getByKey<DailyActionEnum>(task.ref ?? '');
            return action === undefined ? throwError((): Error => new Error('Action inconnue')) : this.toggleDailyAction(citizen, action.key, done, day);
        }
        const upgrade: HomeEnum | undefined = taskUpgrade(task);
        if (upgrade !== undefined) {
            return this.writeUpgrade(citizen, upgrade, task.level ?? 1, done);
        }
        if (task.kind === 'home' && typeof task.level === 'number' && isHouseLevelEditable(getTown())) {
            // Ville sans API externe : le niveau de maison se saisit à la main, la case l'écrit.
            return this.writeUpgrade(citizen, HomeEnum.HOUSE_LEVEL, task.level, done);
        }
        const check: string | null = taskCheckKey(task);
        return check === null ? throwError((): Error => new Error('Consigne sans identifiant')) : this.toggleDailyAction(citizen, check, done, day);
    }

    /**
     * Ajoute ou retire une action quotidienne (ou une coche de consigne) pour un jour.
     * @param {Citizen} citizen Citoyen.
     * @param {string} key Clé de l'action.
     * @param {boolean} done Ajouter (vrai) ou retirer.
     * @param {number} day Jour.
     * @returns {Observable<void>} Émet après succès.
     */
    private toggleDailyAction(citizen: Citizen, key: string, done: boolean, day: number): Observable<void> {
        const others: (action: DailyAction) => boolean = (action: DailyAction): boolean => !(action.day === day && action.action_key === key);
        if (done) {
            return this.town_service.addDailyAction(citizen, key, day).pipe(take(1), map((info: UpdateInfo): void => {
                info.username = info.username ?? getUser()?.username;
                citizen.daily_actions = [...(citizen.daily_actions ?? []).filter(others), Object.assign(new DailyAction(), { day, action_key: key, update_info: info })];
                this.publish(citizen);
            }));
        }
        return this.town_service.removeDailyAction(citizen, key, day).pipe(take(1), map((): void => {
            citizen.daily_actions = (citizen.daily_actions ?? []).filter(others);
            this.publish(citizen);
        }));
    }

    /**
     * Écrit le seul niveau de l'amélioration visée, d'après la maison relue sur le serveur (jamais une donnée périmée) :
     * cocher = au moins le niveau visé (rien à écrire s'il est atteint), décocher = juste en dessous.
     * @param {Citizen} citizen Citoyen (sa maison est remplacée par celle relue).
     * @param {HomeEnum} upgrade Amélioration.
     * @param {number} level Niveau visé.
     * @param {boolean} done Nouvel état.
     * @returns {Observable<void>} Émet après succès.
     */
    private writeUpgrade(citizen: Citizen, upgrade: HomeEnum, level: number, done: boolean): Observable<void> {
        return this.town_service.getCitizen(citizen.id).pipe(take(1), switchMap((fresh: Citizen): Observable<void> => {
            const home: Home = fresh.home ?? Object.assign(new Home(), { content: [] as HomeWithValue[] });
            citizen.home = home;
            const current: number = homeLevelOf(fresh, upgrade.key);
            const target: number = done ? Math.max(current, level) : Math.min(current, level - 1);
            if (target === current) {
                this.publish(citizen);
                return of(undefined);
            }
            const value: number | boolean = upgrade.value.max_lvl === 1 ? target >= 1 : target;
            return this.town_service.updateHomeFields(citizen.id, { [upgrade.key]: value }).pipe(take(1), map((info: UpdateInfo): void => {
                const entry: HomeWithValue | undefined = home.content.find((candidate: HomeWithValue): boolean => candidate.element?.key === upgrade.key);
                if (entry === undefined) {
                    home.content = [...home.content, { element: upgrade, value }];
                } else {
                    entry.value = value;
                }
                home.update_info = info;
                this.publish(citizen);
            }));
        }));
    }

    /**
     * Republie le citoyen du joueur pour que l'en-tête reflète la coche.
     * @param {Citizen} citizen Citoyen modifié.
     */
    private publish(citizen: Citizen): void {
        if (citizen.id === getUserId()) {
            this.town_service.publishMyCitizen(citizen);
        }
    }
}
