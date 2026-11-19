import { inject, Injectable } from '@angular/core';
import { catchError, defer, forkJoin, map, Observable, of, switchMap, take } from 'rxjs';

import { TownContextService } from '../../_core/services/town-context.service';
import { BuildingUpgradesDTO } from '../../my-town/buildings/planning/building-upgrades.types';
import { HomeReferentialDTO } from '../../my-town/buildings/planning/home-referential.types';
import { BuildingPlansDTO, BuildingPlanStateDTO } from '../../my-town/buildings/planning/plan.types';
import { simulatedCitizens } from '../../pre-town/simulated-citizens.util';
import { ItemEmotesDTO } from '../dto/item.dto';
import { RefinementViewDTO } from '../dto/refinement.dto';
import { MinMax } from '../interfaces';
import { Dictionary } from '../types/_types';
import { BankInfo } from '../types/bank-info.class';
import { Building } from '../types/building.class';
import { Citizen } from '../types/citizen.class';
import { CitizenInfo } from '../types/citizen-info.class';
import { Estimations } from '../types/estimations.class';
import { EstimationsResult } from '../types/estimations-result.class';
import { Expedition } from '../types/expedition.class';
import { Item } from '../types/item.class';
import { ApiService } from './api.service';
import { BuildingPlanService } from './building-plan.service';
import { ExpeditionService } from './expedition.service';
import { TownService } from './town.service';
import { TownStatisticsService } from './town-statistics.service';

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
    private readonly town_context: TownContextService = inject(TownContextService);

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
            citizens: this.town_service.getCitizens().pipe(take(1), map((info: CitizenInfo): Citizen[] => this.withSimulatedCitizens(info.citizens))),
            bank: this.town_service.getBank().pipe(take(1), map((info: BankInfo): Item[] => info.items)),
            upgrades: this.plan_service.getBuildingUpgrades().pipe(take(1)),
            item_emotes: this.api.getItemEmotes().pipe(take(1))
        });
    }

    /**
     * En pré-ville, remplace les citoyens reçus par les citoyens simulés.
     * @param {Citizen[]} citizens Citoyens reçus.
     * @returns {Citizen[]} Citoyens à utiliser.
     */
    private withSimulatedCitizens(citizens: Citizen[]): Citizen[] {
        const simulated: number | null = this.town_context.isPreTown() ? this.town_context.simulatedCitizens() : null;
        return simulated === null ? citizens : simulatedCitizens(simulated);
    }

    /**
     * Charge les expéditions et l'attaque d'un jour ; une attaque introuvable donne `null` sans faire échouer les expéditions.
     * @param {number} day Jour de la ville.
     * @returns {Observable<PlanningDay>} Données du jour.
     */
    public loadDay(day: number): Observable<PlanningDay> {
        return forkJoin({
            expeditions: this.expedition_service.getExpeditions(day).pipe(take(1)),
            attack: this.attackOf(day)
        });
    }

    /**
     * Attaque du jour, de la source la plus sûre à la moins sûre : max affiné, max calculé, max de l'estimation TDG la plus précise.
     * @param {number} day Jour attaqué.
     * @returns {Observable<number | null>} Attaque, nulle sans aucune source.
     */
    private attackOf(day: number): Observable<number | null> {
        const refined: Observable<number | null> = defer((): Observable<RefinementViewDTO> => this.statistics_service.getRefinement(day)).pipe(
            map((refinement: RefinementViewDTO): number | null => refinement.attackMax ?? refinement.attackMin ?? null)
        );
        const calculated: Observable<number | null> = defer((): Observable<EstimationsResult> => this.statistics_service.getAttackCalculation(day, false, true)).pipe(
            map((calculation: EstimationsResult): number | null => calculation.result?.max ?? null)
        );
        const estimated: Observable<number | null> = defer((): Observable<Estimations> => this.statistics_service.getEstimations(day, true)).pipe(
            map((estimations: Estimations): number | null => lastEstimationMax(estimations.estim))
        );
        return [calculated, estimated].map(orNull).reduce(
            (attack: Observable<number | null>, fallback: Observable<number | null>): Observable<number | null> =>
                attack.pipe(switchMap((value: number | null): Observable<number | null> => value === null ? fallback : of(value))),
            orNull(refined)
        );
    }
}

/**
 * Première valeur du flux, nulle en cas d'erreur.
 * @param {Observable<number | null>} source Flux.
 * @returns {Observable<number | null>} Valeur.
 */
function orNull(source: Observable<number | null>): Observable<number | null> {
    return source.pipe(take(1), catchError((): Observable<null> => of(null)));
}

/**
 * Max de l'estimation TDG la plus précise (palier le plus haut renseigné).
 * @param {Dictionary<MinMax>} estim Estimations par palier (clé = %).
 * @returns {number | null} Max, nul sans estimation.
 */
function lastEstimationMax(estim: Dictionary<MinMax>): number | null {
    const maxima: [number, number][] = Object.entries(estim ?? {})
        .filter(([, value]: [string, MinMax]): boolean => typeof value?.max === 'number')
        .map(([percent, value]: [string, MinMax]): [number, number] => [+percent, value.max as number]);
    return maxima.length === 0 ? null : maxima.reduce((best: [number, number], current: [number, number]): [number, number] => current[0] > best[0] ? current : best)[1];
}
