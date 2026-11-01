import { inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { catchError, distinctUntilChanged, filter, map, merge, Observable, of, switchMap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { DailyProgramFactsDTO } from '../../_abstract_model/dto/daily-program-facts.dto';
import { BuiltBuildingsService } from '../../_abstract_model/services/built-buildings.service';
import { DailyProgramService } from '../../_abstract_model/services/daily-program.service';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { getTown, town } from '../../_core/utilities/localstorage.util';
import { scoutsLairBuilt } from '../expeditions/expedition-resources.util';
import { isProgramMenuVisible } from './program-menu.util';

/** Indique si l'entrée de menu « Mon programme » doit apparaître pour la ville et le jour courants. */
@Injectable({ providedIn: 'root' })
export class ProgramMenuService {
    private readonly program_service: DailyProgramService = inject(DailyProgramService);
    private readonly built_buildings: BuiltBuildingsService = inject(BuiltBuildingsService);
    private readonly visible_state: WritableSignal<boolean> = signal(false);

    public readonly visible: Signal<boolean> = this.visible_state.asReadonly();

    public constructor() {
        // ponytail: relu au changement de ville/jour et à chaque navigation, abonnement au hub si l'entrée doit apparaître sans eux
        merge(
            toObservable(town).pipe(distinctUntilChanged((previous: TownDetails | null, current: TownDetails | null): boolean =>
                previous?.town_id === current?.town_id && previous?.day === current?.day)),
            inject(Router).events.pipe(filter((event: unknown): boolean => event instanceof NavigationEnd))
        ).pipe(
            switchMap((): Observable<boolean> => this.load(getTown())),
            takeUntilDestroyed()
        ).subscribe((visible: boolean): void => this.visible_state.set(visible));
    }

    /** Visibilité pour une ville ; caché sans ville, sans jour, en production ou sur erreur. */
    private load(current: TownDetails | null): Observable<boolean> {
        if (environment.production || current === null || current.day === undefined || current.day === null) {
            return of(false);
        }
        const day: number = current.day;
        return this.program_service.getFacts(current.town_id, day).pipe(
            switchMap((facts: DailyProgramFactsDTO): Observable<boolean> =>
                (needsBuiltBuildings(facts) ? this.built_buildings.builtUids() : of(null)).pipe(
                    map((built: ReadonlySet<string> | null): boolean => isProgramMenuVisible(facts, day, scoutsLairBuilt(built))))),
            catchError((): Observable<boolean> => of(false))
        );
    }
}

/** Les chantiers construits ne servent qu'à juger une place libre, quand rien d'autre ne décide. */
function needsBuiltBuildings(facts: DailyProgramFactsDTO): boolean {
    return facts.isCitizen && !facts.hasEffectivePlan && !facts.isPlaced && facts.openPlaces.length > 0;
}
