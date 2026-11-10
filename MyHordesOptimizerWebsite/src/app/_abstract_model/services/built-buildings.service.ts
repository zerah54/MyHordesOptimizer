import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, shareReplay, take } from 'rxjs';

import { getTown } from '../../_core/utilities/localstorage.util';
import { BuildingPlanStateDTO } from '../../my-town/buildings/planning/plan.types';
import { buildingLevelsOf } from '../../my-town/buildings/planning/planning-data.util';
import { Building } from '../types/building.class';
import { ApiService } from './api.service';
import { BuildingPlanService } from './building-plan.service';

/** Durée de validité du résultat : un chantier construit dans la journée apparaît au plus tard après ce délai. */
const CACHE_MS: number = 5 * 60 * 1000;

/** Chantiers construits de la ville affichée, d'après le dernier état synchronisé. */
@Injectable({ providedIn: 'root' })
export class BuiltBuildingsService {

    private readonly plan_service: BuildingPlanService = inject(BuildingPlanService);
    private readonly api: ApiService = inject(ApiService);
    private cache: { town_id: number; at: number; levels: Observable<ReadonlyMap<string, number> | null> } | null = null;

    /**
     * Uids des chantiers construits ; nul si l'état est indisponible (droits, API non à jour), sans message d'erreur.
     * @returns {Observable<ReadonlySet<string> | null>} Uids, émis une fois.
     */
    public builtUids(): Observable<ReadonlySet<string> | null> {
        return this.builtLevels().pipe(map((levels: ReadonlyMap<string, number> | null): ReadonlySet<string> | null => levels === null ? null : new Set<string>(levels.keys())));
    }

    /**
     * Niveau d'évolution par uid des chantiers construits (0 s'il est inconnu) ; nul si l'état est indisponible, sans message d'erreur.
     * @returns {Observable<ReadonlyMap<string, number> | null>} Niveaux, émis une fois.
     */
    public builtLevels(): Observable<ReadonlyMap<string, number> | null> {
        const town_id: number | undefined = getTown()?.town_id;
        if (town_id === undefined) {
            return of(null);
        }
        if (this.cache === null || this.cache.town_id !== town_id || Date.now() - this.cache.at > CACHE_MS) {
            this.cache = { town_id, at: Date.now(), levels: this.load() };
        }
        return this.cache.levels;
    }

    /**
     * Charge l'état synchronisé et le référentiel, puis en déduit les niveaux des chantiers construits.
     * @returns {Observable<ReadonlyMap<string, number> | null>} Niveaux partagés entre abonnés.
     */
    private load(): Observable<ReadonlyMap<string, number> | null> {
        // take(1) : ces services n'appellent pas complete(), ce qui bloquerait forkJoin.
        return forkJoin({
            state: this.plan_service.getState(true).pipe(take(1)),
            buildings: this.api.getBuildings().pipe(take(1))
        }).pipe(
            map(({ state, buildings }: { state: BuildingPlanStateDTO; buildings: Building[] }): ReadonlyMap<string, number> | null => {
                // Aucun chantier synchronisé : ville jamais mise à jour ou lecteur sans droit, donc inconnu (et non « rien de construit »).
                if (state.buildings.length === 0) {
                    return null;
                }
                return buildingLevelsOf(buildings, state.buildings);
            }),
            catchError((): Observable<null> => of(null)),
            shareReplay(1)
        );
    }
}
