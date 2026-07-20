import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, OnInit, Signal, signal, ViewChild, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule, SortDirection } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { catchError, debounceTime, EMPTY, finalize, forkJoin, of } from 'rxjs';
import { getTown } from '../../_core/utilities/localstorage.util';
import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { SeasonPhaseDTO } from '../../_abstract_model/dto/season-phase.dto';
import { TownListQuery } from '../../_abstract_model/dto/town-list-page.dto';
import { AdminService } from '../../_abstract_model/services/admin.service';
import { TownService } from '../../_abstract_model/services/town.service';
import { DeferredCellComponent } from '../../_shared/deferred-cell/deferred-cell.component';
import { Imports, TownState, TownTypeId } from '../../_abstract_model/types/_types';
import { TownListItem, TownListPageResult, TownPublicCitizen } from '../../_abstract_model/types/town-list-item.model';

const angular_common: Imports = [CommonModule, ReactiveFormsModule];
const components: Imports = [DeferredCellComponent];
const pipes: Imports = [];
const material_modules: Imports = [
    MatTableModule, MatSortModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule,
    MatTooltipModule, MatCardModule, MatFormFieldModule, MatPaginatorModule,
    MatSelectModule, MatInputModule, MatCheckboxModule
];

@Component({
    selector: 'mho-town-list',
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './town-list.component.html',
    styleUrl: './town-list.component.scss',
})
export class TownListComponent implements OnInit, AfterViewInit {
    private readonly townService: TownService = inject(TownService);
    private readonly adminService: AdminService = inject(AdminService);
    private readonly router: Router = inject(Router);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    public readonly isAdmin = input<boolean>(false);

    // Quand défini, restreint la liste aux villes de ce joueur (utilisé par la page profil).
    public readonly playerId = input<number | undefined>(undefined);

    protected readonly displayedColumns: Signal<string[]> = computed(() => {
        const cols = ['id', 'language', 'name', 'size', 'type', 'score', 'citizens', 'state'];
        return this.isAdmin() ? ['select', ...cols, 'actions'] : cols;
    });

    @ViewChild(MatSort) private matSort!: MatSort;

    protected readonly towns: WritableSignal<TownListItem[]> = signal<TownListItem[]>([]);
    protected readonly totalCount: WritableSignal<number> = signal(0);
    protected readonly pageIndex: WritableSignal<number> = signal(0);
    protected readonly pageSize: WritableSignal<number> = signal(50);
    protected readonly pageSizeOptions: number[] = [25, 50, 100, 200];
    protected readonly loading: WritableSignal<boolean> = signal(false);
    protected readonly seasonPhases: WritableSignal<SeasonPhaseDTO[]> = signal<SeasonPhaseDTO[]>([]);
    // Options de filtres fournies par le backend sur toute la combinaison (pas seulement la page courante)
    protected readonly availableTypes: WritableSignal<TownTypeId[]> = signal<TownTypeId[]>([]);
    protected readonly availableLanguages: WritableSignal<string[]> = signal<string[]>([]);

    // Filtre combiné saison/phase, hors tableau : pilote la récupération des données côté serveur
    protected readonly seasonPhaseControl: FormControl<SeasonPhaseDTO | null> = new FormControl<SeasonPhaseDTO | null>(null);

    protected readonly sortState: WritableSignal<{ active: string; direction: SortDirection }> =
        signal({ active: 'id', direction: 'desc' as SortDirection });

    protected readonly nameFilter: WritableSignal<string> = signal('');
    protected readonly idFilter: WritableSignal<string> = signal('');
    protected readonly typeFilter: WritableSignal<TownTypeId[]> = signal([]);
    protected readonly languageFilter: WritableSignal<string[]> = signal([]);
    protected readonly stateFilter: WritableSignal<TownState[]> = signal([]);

    protected readonly importingIds: WritableSignal<Set<number>> = signal(new Set<number>());
    protected readonly importResults: WritableSignal<Record<number, 'success' | 'error' | null>> = signal({});
    protected readonly deletingIds: WritableSignal<Set<number>> = signal(new Set<number>());
    protected readonly selectedIds: WritableSignal<Set<number>> = signal(new Set<number>());
    protected readonly bulkDeleting: WritableSignal<boolean> = signal(false);

    // La sélection « tout » ne porte que sur la page courante (pagination serveur)
    protected readonly allSelected: Signal<boolean> = computed(() => {
        const visible: TownListItem[] = this.towns();
        return visible.length > 0 && visible.every((t: TownListItem) => this.selectedIds().has(t.id));
    });
    protected readonly someSelected: Signal<boolean> = computed(() =>
        this.towns().some((t: TownListItem) => this.selectedIds().has(t.id)) && !this.allSelected()
    );

    protected readonly filtersForm: FormGroup = new FormGroup({
        name: new FormControl<string>(''),
        id: new FormControl<string>(''),
        type: new FormControl<TownTypeId[]>([]),
        language: new FormControl<string[]>([]),
        state: new FormControl<TownState[]>([]),
    });

    protected readonly townStates: TownState[] = ['NORMAL', 'CHAOS', 'DEVASTED', 'FINISHED'];

    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;

    protected readonly typeImgMap: Record<string, string> = {
        RNE: 'building/small_falsecity.gif',
        PANDE: 'icons/small_arma.gif',
        CUSTOM: 'item/item_chair.gif',
        RE: 'icons/item_map.gif',
    };

    protected readonly stateImgMap: Record<string, string> = {
        NORMAL: 'icons/home.gif',
        CHAOS: 'professions/death.gif',
        DEVASTED: 'item/item_out_def_broken.gif',
        FINISHED: 'item/item_lock.gif',
    };

    protected readonly stateLabelMap: Record<string, string> = {
        NORMAL: 'Normal',
        CHAOS: 'Chaos',
        DEVASTED: 'Dévasté',
        FINISHED: 'Terminée',
    };

    protected readonly languageFlagMap: Record<string, string> = {
        fr: '🇫🇷',
        en: '🇬🇧',
        de: '🇩🇪',
        es: '🇪🇸',
        multi: '🌍',
    };

    public ngOnInit(): void {
        this.townService.getSeasonPhases()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((seasonPhases: SeasonPhaseDTO[]) => {
                this.seasonPhases.set(seasonPhases);
                const defaultCombo: SeasonPhaseDTO | null = seasonPhases.length > 0 ? seasonPhases[0] : null;
                this.seasonPhaseControl.setValue(defaultCombo, { emitEvent: false });
                this.reload();
            });

        // Changement de combinaison : on repart page 1
        this.seasonPhaseControl.valueChanges
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe(() => this.resetAndReload());

        this.filtersForm.controls['name'].valueChanges
            .pipe(debounceTime(300), takeUntilDestroyed(this.destroy_ref))
            .subscribe((v: string | null) => { this.nameFilter.set(v ?? ''); this.resetAndReload(); });

        this.filtersForm.controls['id'].valueChanges
            .pipe(debounceTime(300), takeUntilDestroyed(this.destroy_ref))
            .subscribe((v: string | null) => { this.idFilter.set(v ?? ''); this.resetAndReload(); });

        this.filtersForm.controls['type'].valueChanges
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((v: TownTypeId[] | null) => { this.typeFilter.set(v ?? []); this.resetAndReload(); });

        this.filtersForm.controls['language'].valueChanges
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((v: string[] | null) => { this.languageFilter.set(v ?? []); this.resetAndReload(); });

        this.filtersForm.controls['state'].valueChanges
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((v: TownState[] | null) => { this.stateFilter.set(v ?? []); this.resetAndReload(); });
    }

    public ngAfterViewInit(): void {
        this.matSort.sortChange
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe(change => {
                this.sortState.set({ active: change.active, direction: change.direction });
                this.resetAndReload();
            });
    }

    protected onPageChange(event: PageEvent): void {
        this.pageIndex.set(event.pageIndex);
        this.pageSize.set(event.pageSize);
        this.reload();
    }

    protected toggleSelection(id: number): void {
        this.selectedIds.update((s: Set<number>) => {
            const next: Set<number> = new Set(s);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    protected toggleAll(): void {
        if (this.allSelected()) {
            this.selectedIds.set(new Set());
        } else {
            this.selectedIds.set(new Set(this.towns().map((t: TownListItem) => t.id)));
        }
    }

    protected bulkDelete(): void {
        const ids: number[] = [...this.selectedIds()];
        if (ids.length === 0) return;
        this.bulkDeleting.set(true);
        forkJoin(ids.map((id: number) => this.adminService.deleteTown(id).pipe(catchError(() => of(null)))))
            .pipe(
                finalize(() => this.bulkDeleting.set(false)),
                takeUntilDestroyed(this.destroy_ref)
            )
            .subscribe(() => {
                this.selectedIds.set(new Set());
                this.reload();
            });
    }

    protected deleteTown(townId: number): void {
        this.deletingIds.update(s => new Set([...s, townId]));
        this.adminService.deleteTown(townId)
            .pipe(
                finalize(() => this.deletingIds.update(s => {
                    const next = new Set(s);
                    next.delete(townId);
                    return next;
                })),
                catchError(() => EMPTY),
                takeUntilDestroyed(this.destroy_ref)
            )
            .subscribe(() => this.reload());
    }

    protected importTown(townId: number): void {
        this.importingIds.update(s => new Set([...s, townId]));
        this.importResults.update(r => ({ ...r, [townId]: null }));
        this.adminService.importTown(townId)
            .pipe(
                // On retire l'id de importingIds dans les handlers next/error (qui s'exécutent de façon
                // certaine à la fin de la requête) plutôt que via finalize : en pratique, le nettoyage
                // par finalize ne se reflétait pas dans le rendu du mat-table (spinner du bouton bloqué
                // malgré la réponse 200 et l'affichage du check).
                catchError(() => {
                    this.stopImporting(townId);
                    this.importResults.update(r => ({ ...r, [townId]: 'error' }));
                    return EMPTY;
                }),
                takeUntilDestroyed(this.destroy_ref)
            )
            .subscribe(() => {
                this.stopImporting(townId);
                this.importResults.update(r => ({ ...r, [townId]: 'success' }));
                this.reload();
            });
    }

    /** Retire la ville de l'ensemble des imports en cours (masque le spinner du bouton). */
    private stopImporting(townId: number): void {
        this.importingIds.update(s => {
            const next = new Set(s);
            next.delete(townId);
            return next;
        });
    }

    protected getCitizensTooltip(citizens: TownPublicCitizen[]): string {
        const alive: string[] = citizens.filter(c => c.deathTypeId == null).map(c => c.name ?? '?');
        const dead: string[] = citizens.filter(c => c.deathTypeId != null).map(c => c.name ?? '?');
        const parts: string[] = [];
        if (alive.length > 0) parts.push('Vivants :\n' + alive.join('\n'));
        if (dead.length > 0) parts.push('Morts :\n' + dead.join('\n'));
        return parts.join('\n\n') || '—';
    }

    /** Repart page 1 puis recharge (changement de filtre/tri/combinaison). */
    private resetAndReload(): void {
        this.pageIndex.set(0);
        this.reload();
    }

    /** Recharge la page courante depuis le serveur avec l'ensemble filtres/tri/pagination. */
    private reload(): void {
        const combo: SeasonPhaseDTO | null = this.seasonPhaseControl.value;
        const sort: { active: string; direction: SortDirection } = this.sortState();
        const query: TownListQuery = {
            season: combo?.season,
            phase: combo?.phase,
            playerId: this.playerId(),
            page: this.pageIndex() + 1,
            pageSize: this.pageSize(),
            sortColumn: sort.active || undefined,
            sortDirection: sort.direction || undefined,
            name: this.nameFilter() || undefined,
            id: this.idFilter() || undefined,
            types: this.typeFilter().length > 0 ? this.typeFilter() : undefined,
            languages: this.languageFilter().length > 0 ? this.languageFilter() : undefined,
            states: this.stateFilter().length > 0 ? this.stateFilter() : undefined,
        };
        this.loading.set(true);
        this.townService.getTownsPaged(query)
            .pipe(
                catchError(() => {
                    this.loading.set(false);
                    return EMPTY;
                }),
                takeUntilDestroyed(this.destroy_ref)
            )
            .subscribe((result: TownListPageResult) => {
                this.towns.set(result.items);
                this.totalCount.set(result.totalCount);
                this.availableTypes.set(result.availableTypes);
                this.availableLanguages.set(result.availableLanguages);
                this.loading.set(false);
            });
    }

    protected getTownState(town: TownListItem): TownState {
        // Ville terminée : le chaos/dévastation figé au dernier passage n'est plus significatif,
        // on n'affiche que le cadenas
        if (town.isFinished) return 'FINISHED';
        if (town.isDevasted) return 'DEVASTED';
        if (town.isChaos) return 'CHAOS';
        return 'NORMAL';
    }

    /** Libellé d'une combinaison saison/phase : « SX-phase » (phase en minuscules), « SX » seul si native. */
    protected getComboLabel(combo: SeasonPhaseDTO): string {
        const season: string = 'S' + combo.season;
        return combo.phase && combo.phase !== 'NATIVE'
            ? season + '-' + combo.phase.toLowerCase()
            : season;
    }

    /** Comparateur pour le mat-select : les combos sont réidentifiés par saison + phase. */
    protected compareCombo(a: SeasonPhaseDTO | null, b: SeasonPhaseDTO | null): boolean {
        return a?.season === b?.season && a?.phase === b?.phase;
    }

    protected getLanguageFlag(lang: string | null): string {
        return lang ? (this.languageFlagMap[lang] ?? lang) : '—';
    }

    protected trackById(_index: number, town: TownListItem): number {
        return town.id;
    }

    /** Une ligne n'est ouvrable en observateur que si la ville a un mapId (identifiant public MyHordes). */
    protected isRowClickable(town: TownListItem): boolean {
        return town.mapId != null;
    }

    /** Ouvre la ville : sa propre ville courante en mode normal, toute autre ville en mode observateur. */
    protected onRowClick(town: TownListItem): void {
        if (town.mapId == null) {
            return;
        }
        const currentTownId: number | undefined = getTown()?.town_id;
        if (currentTownId != null && town.mapId === currentTownId) {
            this.router.navigate(['/my-town']);
        } else {
            this.router.navigate(['/town', town.mapId, 'citizens', 'list']);
        }
    }
}
