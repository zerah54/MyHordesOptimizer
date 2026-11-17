import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { catchError, EMPTY, map, Observable, switchMap, tap } from 'rxjs';

import { PreTownService } from '../../_abstract_model/services/pre-town.service';
import { Imports } from '../../_abstract_model/types/_types';
import { PreTown } from '../../_abstract_model/types/pre-town.class';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { TownContextService } from '../../_core/services/town-context.service';

const angular_common: Imports = [RouterOutlet, RouterLink, RouterLinkActive];
const material_modules: Imports = [MatIconModule, MatProgressSpinnerModule];

/** Jour posé sur le contexte d'une pré-ville : elle n'a pas de calendrier, les plans partent du jour 1. */
const PRE_TOWN_DAY: number = 1;

/**
 * Enveloppe des pages d'une pré-ville (`/pre-town/:preTownId/**`) : pose le contexte de ville sur le pseudo-mapId de la
 * pré-ville pour que les pages Chantiers, Veilles et Liste de courses s'y branchent. Modifiable tant que la pré-ville
 * n'est pas liée, gelée ensuite.
 */
@Component({
    selector: 'mho-pre-town-shell',
    templateUrl: './pre-town-shell.component.html',
    styleUrl: './pre-town-shell.component.scss',
    imports: [...angular_common, ...material_modules],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreTownShellComponent implements OnInit {

    private readonly route: ActivatedRoute = inject(ActivatedRoute);
    private readonly router: Router = inject(Router);
    private readonly pre_town_service: PreTownService = inject(PreTownService);
    private readonly town_context: TownContextService = inject(TownContextService);
    private readonly title_service: Title = inject(Title);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    /** Le contenu n'est rendu qu'une fois le contexte posé : chaque page lit alors la bonne ville. */
    protected readonly context_ready: WritableSignal<boolean> = signal<boolean>(false);
    protected readonly loading: WritableSignal<boolean> = signal<boolean>(true);
    protected readonly pre_town: WritableSignal<PreTown | null> = signal<PreTown | null>(null);
    /** Lu sur le contexte : une liaison/déliaison faite depuis la page de détail le met à jour sans rechargement du shell. */
    protected readonly frozen: Signal<boolean> = computed((): boolean => this.town_context.isPreTown() && this.town_context.isReadonly());

    /** Suit l'identifiant de l'URL ; switchMap annule le chargement précédent, une réponse périmée ne peut pas gagner. */
    public ngOnInit(): void {
        this.destroy_ref.onDestroy((): void => this.town_context.clear());
        this.route.paramMap
            .pipe(
                map((params: ParamMap): number | null => {
                    const raw_id: string | null = params.get('preTownId');
                    return raw_id !== null && /^\d+$/.test(raw_id) ? Number(raw_id) : null;
                }),
                tap((): void => {
                    this.context_ready.set(false);
                    this.loading.set(true);
                }),
                switchMap((id: number | null): Observable<PreTown> => {
                    if (id === null) {
                        this.backToList();
                        return EMPTY;
                    }
                    return this.pre_town_service.get(id).pipe(
                        catchError((): Observable<never> => {
                            this.backToList();
                            return EMPTY;
                        })
                    );
                }),
                takeUntilDestroyed(this.destroy_ref)
            )
            .subscribe((pre_town: PreTown): void => this.applyPreTown(pre_town));
    }

    /**
     * Pose le contexte de ville de la pré-ville chargée.
     * @param {PreTown} pre_town Pré-ville chargée.
     */
    private applyPreTown(pre_town: PreTown): void {
        const details: TownDetails = new TownDetails();
        details.town_id = pre_town.mapId;
        details.day = PRE_TOWN_DAY;
        this.town_context.setObservedTown(details, pre_town.alias);
        this.town_context.setPreTownEditable(!pre_town.isLinked);
        this.town_context.setSimulatedCitizens(pre_town.simulatedCitizens);
        this.pre_town.set(pre_town);
        this.title_service.setTitle('MyHordes Optimizer' + ' - ' + $localize`Pré-ville` + ' - ' + pre_town.alias);
        this.context_ready.set(true);
    }

    /** Accès refusé, pré-ville introuvable ou identifiant invalide : retour à la liste. */
    private backToList(): void {
        this.loading.set(false);
        this.town_context.clear();
        void this.router.navigate(['/pre-town']);
    }
}
