import { inject, Injectable } from '@angular/core';
import moment from 'moment';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';

import { PlanningDataService, PlanningDay, PlanningStatic } from '../../../_abstract_model/services/planning-data.service';
import { getTown } from '../../../_core/utilities/localstorage.util';
import { DayEvaluation, DayInput, evaluateDays } from '../../buildings/planning/plan-evaluation.util';
import { buildDayInputs } from '../../buildings/planning/plan-inputs.util';
import { BuildingPlanContentDTO, BuildingPlanDTO, emptyPlanContent } from '../../buildings/planning/plan.types';
import { ResourceCount } from '../../buildings/planning/resources.util';

/** Objets requis par les chantiers du plan effectif d'un jour ; `unavailable` : pas de plan effectif lisible. */
export interface BuildingNeeds {
    status: 'loading' | 'unavailable' | 'ready';
    needs: ResourceCount[];
}

const UNAVAILABLE: BuildingNeeds = { status: 'unavailable', needs: [] };

/** Lit les besoins des chantiers du plan effectif d'un jour avec l'évaluation de la page de planification des chantiers. */
@Injectable({ providedIn: 'root' })
export class NightwatchBuildingNeedsService {

    private readonly data_service: PlanningDataService = inject(PlanningDataService);

    /**
     * Objets requis par les chantiers terminés et les maisons du plan de chantiers effectif d'un jour.
     * @param {number} day Jour de la veille.
     * @param {number} current_day Jour courant de la ville (une évaluation chaîne depuis ce jour).
     * @returns {Observable<BuildingNeeds>} Émet une fois ; `unavailable` pour un jour passé, sans plan effectif ou en cas d'échec.
     */
    public needsOfDay(day: number, current_day: number): Observable<BuildingNeeds> {
        if (day < current_day) {
            return of(UNAVAILABLE);
        }
        return this.data_service.loadStatic().pipe(
            switchMap((data: PlanningStatic): Observable<BuildingNeeds> => {
                const effective: (current: number) => BuildingPlanDTO | undefined =
                    (current: number): BuildingPlanDTO | undefined => data.plans.plans.find((plan: BuildingPlanDTO): boolean => plan.day === current && plan.isEffective);
                if (effective(day) === undefined) {
                    return of(UNAVAILABLE);
                }
                const days: number[] = Array.from({ length: day - current_day + 1 }, (_: unknown, index: number): number => current_day + index);
                return forkJoin(days.map((current: number): Observable<PlanningDay> => this.data_service.loadDay(current).pipe(
                    catchError((): Observable<PlanningDay> => of({ expeditions: [], attack: null }))
                ))).pipe(map((loaded: PlanningDay[]): BuildingNeeds => {
                    const contents: BuildingPlanContentDTO[] = days.map((current: number): BuildingPlanContentDTO => effective(current)?.content ?? emptyPlanContent());
                    const inputs: DayInput[] = buildDayInputs(
                        { data, days: new Map<number, PlanningDay>(days.map((current: number, index: number): [number, PlanningDay] => [current, loaded[index]])), hard_mode: getTown()?.town_type === 'PANDE', locale: moment.locale() },
                        current_day,
                        contents
                    );
                    const evaluations: DayEvaluation[] = evaluateDays(inputs);
                    const needs: ReadonlyMap<number, number> = evaluations[evaluations.length - 1].needs;
                    return { status: 'ready', needs: Array.from(needs, ([itemId, count]: [number, number]): ResourceCount => ({ itemId, count })).sort((a: ResourceCount, b: ResourceCount): number => a.itemId - b.itemId) };
                }));
            }),
            catchError((): Observable<BuildingNeeds> => of(UNAVAILABLE))
        );
    }
}
