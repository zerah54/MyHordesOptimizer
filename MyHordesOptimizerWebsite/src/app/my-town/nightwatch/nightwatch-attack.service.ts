import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, switchMap } from 'rxjs';

import { PlanningDataService, PlanningDay, PlanningStatic } from '../../_abstract_model/services/planning-data.service';
import { BuildingPlanDTO } from '../buildings/planning/plan.types';

/** Attaque estimée d'un jour, lue comme le plan de chantiers : surcharge du plan de chantiers effectif, sinon estimation du site. */
@Injectable({ providedIn: 'root' })
export class NightwatchAttackService {

    private readonly data_service: PlanningDataService = inject(PlanningDataService);

    /**
     * Attaque estimée d'un jour.
     * @param {number} day Jour de la veille.
     * @returns {Observable<number | null>} Émet une fois ; `null` si ni surcharge ni estimation n'existe, ou en cas d'échec.
     */
    public attackOfDay(day: number): Observable<number | null> {
        return this.data_service.loadStatic().pipe(
            switchMap((data: PlanningStatic): Observable<number | null> => {
                const override: number | null | undefined = data.plans.plans
                    .find((plan: BuildingPlanDTO): boolean => plan.day === day && plan.isEffective)?.content.attackOverride;
                return override !== null && override !== undefined
                    ? of(override)
                    : this.data_service.loadDay(day).pipe(map((loaded: PlanningDay): number | null => loaded.attack));
            }),
            catchError((): Observable<number | null> => of(null))
        );
    }
}
