import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, take } from 'rxjs';

import { BuildingUpgradesDTO } from '../../my-town/buildings/planning/building-upgrades.types';
import { HomeReferentialDTO } from '../../my-town/buildings/planning/home-referential.types';
import { BuildingPlansDTO, BuildingPlanStateDTO } from '../../my-town/buildings/planning/plan.types';
import { ItemEmotesDTO } from '../dto/item.dto';
import { RefinementViewDTO } from '../dto/refinement.dto';
import { BankInfo } from '../types/bank-info.class';
import { Building } from '../types/building.class';
import { CitizenInfo } from '../types/citizen-info.class';
import { Citizen } from '../types/citizen.class';
import { Expedition } from '../types/expedition.class';
import { Item } from '../types/item.class';
import { ApiService } from './api.service';
import { BuildingPlanService } from './building-plan.service';
import { ExpeditionService } from './expedition.service';
import { TownStatisticsService } from './town-statistics.service';
import { TownService } from './town.service';

/** Données de la ville qui ne dépendent pas du jour affiché. */
export interface PlanningStatic {
    plans: BuildingPlansDTO;
    state: BuildingPlanStateDTO;
    buildings: Building[];
    items: Item[];
    homes: HomeReferentialDTO;
    citizens: Citizen[];
    bank: Item[];
    /** Évolutions des chantiers ; vide si l'API ne les fournit pas. */
    upgrades: BuildingUpgradesDTO;
    /** Balises forum des objets ; vide si l'API ne les fournit pas. */
    item_emotes: ItemEmotesDTO;
}

/** Données propres à un jour : expéditions et attaque connue (nulle si aucun affinage n'existe). */
export interface PlanningDay {
    expeditions: Expedition[];
    attack: number | null;
}

/** Charge les données nécessaires à la planification des chantiers, en agrégeant les services existants. */
@Injectable({ providedIn: 'root' })
export class PlanningDataService {

    private readonly plan_service: BuildingPlanService = inject(BuildingPlanService);
    private readonly api: ApiService = inject(ApiService);
    private readonly town_service: TownService = inject(TownService);
    private readonly expedition_service: ExpeditionService = inject(ExpeditionService);
    private readonly statistics_service: TownStatisticsService = inject(TownStatisticsService);

    /**
     * Charge les données indépendantes du jour : plans, état synchronisé, référentiels, citoyens et banque.
     * @returns {Observable<PlanningStatic>} Données regroupées, émises une fois toutes les sources reçues.
     */
    public loadStatic(): Observable<PlanningStatic> {
        // take(1) : ces services n'appellent pas complete(), ce qui bloquerait forkJoin.
        return forkJoin({
            plans: this.plan_service.getPlans().pipe(take(1)),
            state: this.plan_service.getState().pipe(take(1)),
            buildings: this.api.getBuildings().pipe(take(1)),
            items: this.api.getItems().pipe(take(1)),
            homes: this.plan_service.getHomeReferential().pipe(take(1)),
            citizens: this.town_service.getCitizens().pipe(take(1), map((info: CitizenInfo): Citizen[] => info.citizens)),
            bank: this.town_service.getBank().pipe(take(1), map((info: BankInfo): Item[] => info.items)),
            upgrades: this.plan_service.getBuildingUpgrades().pipe(take(1)),
            item_emotes: this.api.getItemEmotes().pipe(take(1))
        });
    }

    /**
     * Charge les expéditions et l'attaque d'un jour ; une attaque introuvable donne `null` sans faire échouer les expéditions.
     * @param {number} day Jour de la ville.
     * @returns {Observable<PlanningDay>} Données du jour.
     */
    public loadDay(day: number): Observable<PlanningDay> {
        return forkJoin({
            expeditions: this.expedition_service.getExpeditions(day).pipe(take(1)),
            attack: this.statistics_service.getRefinement(day).pipe(
                take(1),
                map((refinement: RefinementViewDTO): number | null => refinement.attackMax ?? refinement.attackMin ?? null),
                catchError((): Observable<null> => of(null))
            )
        });
    }
}
