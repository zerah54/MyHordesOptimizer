import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, EMPTY, finalize, first, Observable, switchMap, tap, timer } from 'rxjs';

import { ImportJobKey, ImportJobStateDTO } from '../../_abstract_model/dto/import-job-state.dto';
import { SeasonDTO } from '../../_abstract_model/dto/season.dto';
import { AdminService } from '../../_abstract_model/services/admin.service';
import { TownService } from '../../_abstract_model/services/town.service';
import { Imports } from '../../_abstract_model/types/_types';

interface ImportAction {
    key: string;
    label: string;
    icon: string;
    fn: () => Observable<void>;
}

/** Intervalle d'interrogation de l'état des imports en tâche de fond */
const IMPORT_POLLING_INTERVAL_MS: number = 3000;

/** Libellés d'avancement qui ne correspondent à aucun import individuel */
const PROGRESS_LABELS: Record<string, string> = {
    'towns': $localize`Villes`,
    'user-stats': $localize`Statistiques des joueurs`
};

const angular_common: Imports = [CommonModule, ReactiveFormsModule];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatDividerModule, MatFormFieldModule, MatSelectModule, MatTooltipModule
];

@Component({
    selector: 'mho-data-import',
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './data-import.component.html',
    styleUrl: './data-import.component.scss',
})
export class DataImportComponent implements OnInit {
    protected readonly seasons: WritableSignal<SeasonDTO[]> = signal<SeasonDTO[]>([]);
    protected readonly seasonControl: FormControl<number | null> = new FormControl<number | null>(null);
    private readonly adminService: AdminService = inject(AdminService);
    protected readonly importActions: ImportAction[] = [
        { key: 'jobs', label: $localize`Jobs`, icon: 'work', fn: () => this.adminService.importJobs() },
        { key: 'hero-skills', label: $localize`Compétences héros`, icon: 'military_tech', fn: () => this.adminService.importHeroSkills() },
        { key: 'categories', label: $localize`Catégories`, icon: 'category', fn: () => this.adminService.importCategories() },
        { key: 'items', label: $localize`Objets`, icon: 'inventory_2', fn: () => this.adminService.importItems() },
        { key: 'ruins', label: $localize`Ruines`, icon: 'domain', fn: () => this.adminService.importRuins() },
        { key: 'pictos', label: $localize`Pictos`, icon: 'emoji_events', fn: () => this.adminService.importPictos() },
        { key: 'buildings', label: $localize`Bâtiments`, icon: 'apartment', fn: () => this.adminService.importBuildings() },
        { key: 'causes-of-death', label: $localize`Causes de mort`, icon: 'skull', fn: () => this.adminService.importCausesOfDeath() },
        { key: 'cleanup-types', label: $localize`Types de nettoyage`, icon: 'cleaning_services', fn: () => this.adminService.importCleanupTypes() },
        { key: 'wishlist-categories', label: $localize`Catégories de liste de souhaits`, icon: 'checklist', fn: () => this.adminService.importWishlistCategories() },
        { key: 'default-wishlists', label: $localize`Listes de souhaits par défaut`, icon: 'playlist_add', fn: () => this.adminService.importDefaultWishlists() },
    ];
    private readonly townService: TownService = inject(TownService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);
    /** État des imports exécutés en tâche de fond côté serveur, indexé par {@link ImportJobKey} */
    private readonly importStates: WritableSignal<Record<string, ImportJobStateDTO>> = signal({});
    private readonly loadingJobs: WritableSignal<Record<string, boolean>> = signal({});
    private readonly resultJobs: WritableSignal<Record<string, 'success' | 'error' | null>> = signal({});
    private readonly loadingMap: WritableSignal<Record<string, boolean>> = signal({});
    private readonly resultMap: WritableSignal<Record<string, 'success' | 'error' | null>> = signal({});
    private readonly loadingFinish: WritableSignal<Record<number, boolean>> = signal({});
    private readonly resultFinish: WritableSignal<Record<number, 'success' | 'error' | null>> = signal({});

    public ngOnInit(): void {
        this.townService.getSeasons()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((seasons: SeasonDTO[]) => {
                this.seasons.set(seasons);
                if (seasons.length > 0) {
                    this.seasonControl.setValue(seasons[0].id);
                }
            });
        this.watchRunningImport('all');
        this.watchRunningImport('towns');
    }

    /**
     * L'import global dure plusieurs minutes : le serveur le lance en tâche de fond et répond
     * immédiatement. L'avancement et l'issue sont ensuite obtenus par interrogation périodique.
     */
    protected importAll(): void {
        this.startBackgroundImport('all', this.adminService.importAll());
    }

    /** Même mécanique que {@link importAll} : l'import tourne côté serveur, on en suit l'avancement */
    protected importTowns(): void {
        const season: number | null = this.seasonControl.value;
        this.startBackgroundImport('towns', this.adminService.importTowns(season ?? undefined));
    }

    protected importState(job: ImportJobKey): ImportJobStateDTO | null {
        return this.importStates()[job] ?? null;
    }

    /** Libellé de l'étape en cours, ou de l'unité comptée pour les imports qui n'ont pas d'étapes */
    protected currentStepLabel(job: ImportJobKey): string | null {
        const step: string | null = this.importState(job)?.currentStep ?? null;
        if (step === null) {
            return null;
        }
        return this.importActions.find((action: ImportAction) => action.key === step)?.label
            ?? PROGRESS_LABELS[step]
            ?? step;
    }

    protected isImportLoading(job: ImportJobKey): boolean {
        return this.loadingJobs()[job] ?? false;
    }

    protected getImportResult(job: ImportJobKey): 'success' | 'error' | null {
        return this.resultJobs()[job] ?? null;
    }

    protected runImport(action: ImportAction): void {
        this.loadingMap.update((m: Record<number, boolean>) => ({ ...m, [action.key]: true }));
        this.resultMap.update((m) => ({ ...m, [action.key]: null }));
        action.fn()
            .pipe(
                finalize(() => this.loadingMap.update((m: Record<number, boolean>) => ({ ...m, [action.key]: false }))),
                catchError(() => {
                    this.resultMap.update((m) => ({ ...m, [action.key]: 'error' }));
                    return EMPTY;
                }),
                takeUntilDestroyed(this.destroy_ref)
            )
            .subscribe(() => this.resultMap.update((m) => ({ ...m, [action.key]: 'success' })));
    }

    protected toggleSeasonFinished(seasonId: number, currentlyFinished: boolean): void {
        this.loadingFinish.update((m: Record<number, boolean>) => ({ ...m, [seasonId]: true }));
        this.resultFinish.update((m) => ({ ...m, [seasonId]: null }));
        const nextFinished: boolean = !currentlyFinished;
        const request$: Observable<void> = nextFinished
            ? this.adminService.finishSeason(seasonId)
            : this.adminService.unfinishSeason(seasonId);
        request$
            .pipe(
                finalize(() => this.loadingFinish.update((m: Record<number, boolean>) => ({ ...m, [seasonId]: false }))),
                catchError(() => {
                    this.resultFinish.update((m) => ({ ...m, [seasonId]: 'error' }));
                    return EMPTY;
                }),
                takeUntilDestroyed(this.destroy_ref)
            )
            .subscribe(() => {
                this.resultFinish.update((m) => ({ ...m, [seasonId]: 'success' }));
                this.seasons.update((list: SeasonDTO[]) => list.map((s: SeasonDTO) => s.id === seasonId ? { ...s, isFinished: nextFinished } : s));
            });
    }

    protected isLoading(key: string): boolean {
        return this.loadingMap()[key] ?? false;
    }

    protected getResult(key: string): 'success' | 'error' | null {
        return this.resultMap()[key] ?? null;
    }

    protected isFinishLoading(seasonId: number): boolean {
        return this.loadingFinish()[seasonId] ?? false;
    }

    protected getFinishResult(seasonId: number): 'success' | 'error' | null {
        return this.resultFinish()[seasonId] ?? null;
    }

    private startBackgroundImport(job: ImportJobKey, start$: Observable<ImportJobStateDTO>): void {
        this.loadingJobs.update((jobs: Record<string, boolean>) => ({ ...jobs, [job]: true }));
        this.resultJobs.update((results: Record<string, 'success' | 'error' | null>) => ({ ...results, [job]: null }));
        start$
            .pipe(
                tap((state: ImportJobStateDTO) => this.setImportState(job, state)),
                switchMap(() => this.waitForImportEnd(job)),
                takeUntilDestroyed(this.destroy_ref)
            )
            .subscribe({
                next: (state: ImportJobStateDTO) => this.applyImportEnd(job, state),
                error: () => {
                    this.loadingJobs.update((jobs: Record<string, boolean>) => ({ ...jobs, [job]: false }));
                    this.resultJobs.update((results: Record<string, 'success' | 'error' | null>) => ({ ...results, [job]: 'error' }));
                }
            });
    }

    /** Reprend le suivi d'un import déclenché ailleurs (autre onglet, page rechargée) */
    private watchRunningImport(job: ImportJobKey): void {
        this.adminService.getImportStatus(job)
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((state: ImportJobStateDTO) => {
                this.setImportState(job, state);
                if (!state.isRunning) {
                    return;
                }
                this.loadingJobs.update((jobs: Record<string, boolean>) => ({ ...jobs, [job]: true }));
                this.waitForImportEnd(job)
                    .pipe(takeUntilDestroyed(this.destroy_ref))
                    .subscribe((final_state: ImportJobStateDTO) => this.applyImportEnd(job, final_state));
            });
    }

    /** Émet une seule fois, quand l'import n'est plus en cours */
    private waitForImportEnd(job: ImportJobKey): Observable<ImportJobStateDTO> {
        return timer(IMPORT_POLLING_INTERVAL_MS, IMPORT_POLLING_INTERVAL_MS)
            .pipe(
                // Une interrogation en échec (coupure réseau, redémarrage de l'API) est ignorée :
                // l'import continue côté serveur, la suivante reprendra le suivi.
                switchMap(() => this.adminService.getImportStatus(job).pipe(catchError(() => EMPTY))),
                tap((state: ImportJobStateDTO) => this.setImportState(job, state)),
                first((state: ImportJobStateDTO) => !state.isRunning)
            );
    }

    private applyImportEnd(job: ImportJobKey, state: ImportJobStateDTO): void {
        this.loadingJobs.update((jobs: Record<string, boolean>) => ({ ...jobs, [job]: false }));
        this.resultJobs.update((results: Record<string, 'success' | 'error' | null>) => ({
            ...results,
            [job]: state.lastRunSucceeded ? 'success' : 'error'
        }));
    }

    private setImportState(job: ImportJobKey, state: ImportJobStateDTO): void {
        this.importStates.update((states: Record<string, ImportJobStateDTO>) => ({ ...states, [job]: state }));
    }
}
