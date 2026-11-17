import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, EMPTY, filter, map, Observable, of, Subject, switchMap, tap } from 'rxjs';

import { PreTownService } from '../../_abstract_model/services/pre-town.service';
import { UserAccountService } from '../../_abstract_model/services/user-account.service';
import { Imports } from '../../_abstract_model/types/_types';
import { CitizenListItem, CitizenListPageResult } from '../../_abstract_model/types/citizen-list-item.model';
import { PreTown, PreTownLinkPreview, PreTownMember } from '../../_abstract_model/types/pre-town.class';
import { ClipboardService } from '../../_core/services/clipboard.service';
import { TownContextService } from '../../_core/services/town-context.service';
import { getUserId } from '../../_core/utilities/localstorage.util';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../_shared/confirm-dialog/confirm-dialog.component';
import {
    PRE_TOWN_ALIAS_MAX_LENGTH,
    PreTownDuplicateDialogComponent,
    PreTownDuplicateDialogData
} from '../pre-town-duplicate-dialog/pre-town-duplicate-dialog.component';
import { MAX_SIMULATED_CITIZENS, MIN_SIMULATED_CITIZENS } from '../simulated-citizens.util';

const SEARCH_PAGE_SIZE: number = 8;

/** Demande de chargement d'une pré-ville ; `initial` = premier chargement de cet identifiant. */
interface LoadRequest {
    id: number;
    initial: boolean;
}

const angular_common: Imports = [FormsModule, ReactiveFormsModule];
const material_modules: Imports = [MatAutocompleteModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule];

/** Détail d'une pré-ville : nom, membres, rôles d'organisateur, lien d'accès. */
@Component({
    selector: 'mho-pre-town-detail',
    imports: [...angular_common, ...material_modules],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './pre-town-detail.component.html',
    styleUrl: './pre-town-detail.component.scss'
})
export class PreTownDetailComponent implements OnInit {
    private readonly pre_town_service: PreTownService = inject(PreTownService);
    private readonly directory_service: UserAccountService = inject(UserAccountService);
    private readonly clipboard_service: ClipboardService = inject(ClipboardService);
    private readonly router: Router = inject(Router);
    private readonly route: ActivatedRoute = inject(ActivatedRoute);
    private readonly document: Document = inject(DOCUMENT);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);
    private readonly dialog: MatDialog = inject(MatDialog);
    private readonly town_context: TownContextService = inject(TownContextService);

    private pre_town_id: number = 0;
    /** Demandes de chargement ; switchMap annule la précédente, une réponse périmée ne peut donc pas gagner. */
    private readonly load_requests: Subject<LoadRequest> = new Subject<LoadRequest>();

    protected readonly my_user_id: number | null = getUserId();
    protected readonly pre_town: WritableSignal<PreTown | null> = signal<PreTown | null>(null);
    protected readonly alias_draft: WritableSignal<string> = signal<string>('');
    protected readonly loading: WritableSignal<boolean> = signal<boolean>(true);
    protected readonly busy: WritableSignal<boolean> = signal<boolean>(false);
    protected readonly search_control: FormControl<string> = new FormControl<string>('', { nonNullable: true });
    private readonly search_results: WritableSignal<CitizenListItem[]> = signal<CitizenListItem[]>([]);

    /** Résultats de recherche hors membres actuels. */
    protected readonly candidates: Signal<CitizenListItem[]> = computed((): CitizenListItem[] => {
        const member_ids: Set<number> = new Set((this.pre_town()?.members ?? []).map((m: PreTownMember): number => m.idUser));
        return this.search_results().filter((c: CitizenListItem): boolean => !member_ids.has(c.id));
    });
    protected readonly simulated_draft: WritableSignal<number | null> = signal<number | null>(null);
    protected readonly min_simulated: number = MIN_SIMULATED_CITIZENS;
    protected readonly max_simulated: number = MAX_SIMULATED_CITIZENS;
    protected readonly can_set_simulated: Signal<boolean> = computed((): boolean => {
        const draft: number | null = this.simulated_draft();
        return draft !== null && Number.isInteger(draft) && draft >= MIN_SIMULATED_CITIZENS && draft <= MAX_SIMULATED_CITIZENS
            && draft !== this.pre_town()?.simulatedCitizens && !this.busy();
    });
    protected readonly can_rename: Signal<boolean> = computed((): boolean => {
        const draft: string = this.alias_draft().trim();
        return draft !== '' && draft !== this.pre_town()?.alias && !this.busy();
    });

    /** Suit l'identifiant de l'URL (rechargement si elle change) et branche la recherche de joueurs. */
    public ngOnInit(): void {
        this.load_requests
            .pipe(
                switchMap((request: LoadRequest): Observable<PreTown> => this.pre_town_service.get(request.id).pipe(
                    tap((pre_town: PreTown): void => {
                        this.loading.set(false);
                        this.pre_town.set(pre_town);
                        if (this.town_context.isPreTown()) {
                            this.town_context.setPreTownEditable(!pre_town.isLinked);
                            this.town_context.setSimulatedCitizens(pre_town.simulatedCitizens);
                        }
                        this.alias_draft.set(pre_town.alias);
                        this.simulated_draft.set(pre_town.simulatedCitizens);
                        if (request.initial) {
                            this.pre_town_service.markSeen(request.id).pipe(takeUntilDestroyed(this.destroy_ref)).subscribe();
                        }
                    }),
                    catchError((): Observable<never> => {
                        this.loading.set(false);
                        if (request.initial) {
                            void this.router.navigate(['/pre-town']);
                        }
                        return EMPTY;
                    })
                )),
                takeUntilDestroyed(this.destroy_ref)
            )
            .subscribe();
        this.route.paramMap
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((params: ParamMap): void => this.openFromParam(params.get('preTownId')));
        this.search_control.valueChanges
            .pipe(
                debounceTime(300),
                distinctUntilChanged(),
                switchMap((term: string): Observable<CitizenListPageResult> => term.trim() === ''
                    ? of({ items: [], totalCount: 0 })
                    : this.directory_service.getCitizensPaged({ page: 1, pageSize: SEARCH_PAGE_SIZE, name: term.trim() }).pipe(
                        catchError((): Observable<CitizenListPageResult> => of({ items: [], totalCount: 0 }))
                    )),
                takeUntilDestroyed(this.destroy_ref)
            )
            .subscribe((result: CitizenListPageResult): void => this.search_results.set(result.items));
    }

    /**
     * Texte affiché dans le champ après un choix : aucun, le champ est vidé par l'ajout.
     * @returns {string} Chaîne vide.
     */
    protected clearDisplay(): string {
        return '';
    }

    /**
     * Ajoute le joueur choisi : le champ et les résultats sont vidés avant l'appel, le contrôle ne contient ainsi jamais autre chose qu'une chaîne.
     * @param {MatAutocompleteSelectedEvent} event Choix d'une option.
     */
    protected onPlayerSelected(event: MatAutocompleteSelectedEvent): void {
        const candidate: CitizenListItem = event.option.value as CitizenListItem;
        this.search_control.setValue('');
        this.search_results.set([]);
        this.addMember(candidate.id);
    }

    /**
     * Ajoute un joueur de l'annuaire comme membre.
     * @param {number} id_user Joueur à ajouter.
     */
    protected addMember(id_user: number): void {
        this.mutate(this.pre_town_service.addMember(this.pre_town_id, id_user));
    }

    /**
     * Retire un membre.
     * @param {number} id_user Membre à retirer.
     */
    protected removeMember(id_user: number): void {
        this.mutate(this.pre_town_service.removeMember(this.pre_town_id, id_user));
    }

    /** Quitte la pré-ville puis retourne à la liste. */
    protected leave(): void {
        if (this.my_user_id === null) return;
        this.busy.set(true);
        this.pre_town_service.removeMember(this.pre_town_id, this.my_user_id)
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (): void => {
                    this.busy.set(false);
                    void this.router.navigate(['/pre-town']);
                },
                error: (): void => this.busy.set(false)
            });
    }

    /**
     * Promeut ou rétrograde un membre.
     * @param {PreTownMember} member Membre concerné.
     * @param {boolean} is_organizer Nouveau statut.
     */
    protected setOrganizer(member: PreTownMember, is_organizer: boolean): void {
        this.mutate(this.pre_town_service.setOrganizer(this.pre_town_id, member.idUser, is_organizer));
    }

    /** Enregistre le nouveau nom. */
    protected rename(): void {
        if (!this.can_rename()) return;
        this.mutate(this.pre_town_service.rename(this.pre_town_id, this.alias_draft().trim()));
    }

    /** Enregistre le nombre de citoyens simulés ; ignoré hors des bornes autorisées. */
    protected setSimulatedCitizens(): void {
        const draft: number | null = this.simulated_draft();
        if (!this.can_set_simulated() || draft === null) return;
        this.mutate(this.pre_town_service.setSimulatedCitizens(this.pre_town_id, draft));
    }

    /** Simule la liaison à la ville actuelle, puis la fait après confirmation (nom de la ville, lignes ajoutées et ignorées). */
    protected link(): void {
        this.busy.set(true);
        this.pre_town_service.previewLink(this.pre_town_id)
            .pipe(
                switchMap((preview: PreTownLinkPreview): Observable<boolean> => this.confirm(
                    $localize`Lier la pré-ville`,
                    $localize`Lier à « ${preview.townName ?? $localize`votre ville actuelle`}:town: » : ${preview.added}:added: ajoutés, ${preview.skipped}:skipped: ignorés. Les notes déjà présentes sont ignorées.`
                )),
                filter((confirmed: boolean): boolean => confirmed),
                switchMap((): Observable<unknown> => this.pre_town_service.link(this.pre_town_id)),
                takeUntilDestroyed(this.destroy_ref)
            )
            .subscribe(this.afterMutation());
    }

    /** Défait la liaison après confirmation : les modifications faites depuis sur les lignes ajoutées sont perdues. */
    protected unlink(): void {
        this.busy.set(true);
        this.confirm($localize`Délier la pré-ville`, $localize`Les modifications faites depuis la liaison sur les lignes ajoutées seront perdues.`)
            .pipe(
                filter((confirmed: boolean): boolean => confirmed),
                switchMap((): Observable<unknown> => this.pre_town_service.unlink(this.pre_town_id)),
                takeUntilDestroyed(this.destroy_ref)
            )
            .subscribe(this.afterMutation());
    }

    /** Demande un alias puis crée la copie et y navigue. */
    protected duplicate(): void {
        this.busy.set(true);
        this.dialog
            .open<PreTownDuplicateDialogComponent, PreTownDuplicateDialogData, string | undefined>(PreTownDuplicateDialogComponent, {
                data: { alias: this.defaultCopyAlias() }
            })
            .afterClosed()
            .pipe(
                filter((alias: string | undefined): alias is string => alias !== undefined && alias !== ''),
                switchMap((alias: string): Observable<PreTown> => this.pre_town_service.duplicate(this.pre_town_id, alias)),
                takeUntilDestroyed(this.destroy_ref)
            )
            .subscribe({
                next: (copy: PreTown): void => {
                    this.busy.set(false);
                    void this.router.navigate(['/pre-town', copy.preTownId]);
                },
                error: (): void => this.busy.set(false),
                complete: (): void => this.busy.set(false)
            });
    }

    /** Alias « {alias} (copie) », l'alias d'origine étant tronqué pour tenir dans la longueur maximale. */
    private defaultCopyAlias(): string {
        const alias: string = this.pre_town()?.alias ?? '';
        const full: string = $localize`${alias}:alias: (copie)`;
        if (full.length <= PRE_TOWN_ALIAS_MAX_LENGTH) {
            return full;
        }
        const kept: string = alias.slice(0, Math.max(0, PRE_TOWN_ALIAS_MAX_LENGTH - (full.length - alias.length))).trimEnd();
        return $localize`${kept}:alias: (copie)`;
    }

    /** Copie l'adresse de la page : le lien d'accès à partager. */
    protected copyLink(): void {
        this.clipboard_service.copy(this.document.location.href, $localize`Lien copié`);
    }

    /**
     * Infobulle du bouton de rôle.
     * @param {PreTownMember} member Membre concerné.
     * @returns {string} Action proposée.
     */
    protected roleTitle(member: PreTownMember): string {
        return member.isOrganizer ? $localize`Retirer le rôle d'organisateur` : $localize`Nommer organisateur`;
    }

    /** Boîte de confirmation ; émet `true` si validée. */
    private confirm(title: string, text: string): Observable<boolean> {
        return this.dialog
            .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, { data: { title, text } })
            .afterClosed()
            .pipe(map((confirmed: boolean | undefined): boolean => confirmed === true));
    }

    /** Observateur d'une liaison/déliaison : le verrou est levé dans next/error/complete, puis la pré-ville est relue. */
    private afterMutation(): { next: () => void; error: () => void; complete: () => void } {
        return {
            next: (): void => {
                this.busy.set(false);
                this.load();
            },
            error: (): void => this.busy.set(false),
            complete: (): void => this.busy.set(false)
        };
    }

    /** Exécute une modification puis recharge la pré-ville ; le verrou est levé dans next/error. */
    private mutate(call: Observable<unknown>): void {
        this.busy.set(true);
        call.pipe(takeUntilDestroyed(this.destroy_ref)).subscribe({
            next: (): void => {
                this.busy.set(false);
                this.load();
            },
            error: (): void => this.busy.set(false)
        });
    }

    /**
     * Charge la pré-ville de l'URL ; un identifiant non numérique ramène à la liste sans requête.
     * @param {string | null} raw_id Paramètre de route brut.
     */
    private openFromParam(raw_id: string | null): void {
        if (raw_id === null || !/^\d+$/.test(raw_id)) {
            this.loading.set(false);
            void this.router.navigate(['/pre-town']);
            return;
        }
        this.pre_town_id = Number(raw_id);
        this.pre_town.set(null);
        this.loading.set(true);
        this.load(true);
    }

    /**
     * Demande le chargement de la pré-ville courante. Au chargement initial, le « vu » n'est enregistré qu'après succès et
     * une erreur (accès refusé, introuvable) ramène à la liste ; le verrou est levé dans next/error.
     * @param {boolean} initial Premier chargement de cet identifiant.
     */
    private load(initial: boolean = false): void {
        this.load_requests.next({ id: this.pre_town_id, initial });
    }
}
