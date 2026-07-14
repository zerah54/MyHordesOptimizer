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
import { catchError, EMPTY, finalize, Observable } from 'rxjs';
import { AdminService } from '../../_abstract_model/services/admin.service';
import { TownService } from '../../_abstract_model/services/town.service';
import { SeasonDTO } from '../../_abstract_model/dto/season.dto';
import { Imports } from '../../_abstract_model/types/_types';

interface ImportAction {
    key: string;
    label: string;
    icon: string;
    fn: () => Observable<void>;
}

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
    private readonly adminService: AdminService = inject(AdminService);
    private readonly townService: TownService = inject(TownService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    protected readonly seasons: WritableSignal<SeasonDTO[]> = signal<SeasonDTO[]>([]);
    protected readonly seasonControl: FormControl<number | null> = new FormControl<number | null>(null);

    protected readonly loadingAll: WritableSignal<boolean> = signal(false);
    protected readonly resultAll: WritableSignal<'success' | 'error' | null> = signal(null);

    protected readonly loadingTowns: WritableSignal<boolean> = signal(false);
    protected readonly resultTowns: WritableSignal<'success' | 'error' | null> = signal(null);

    protected readonly loadingMap: WritableSignal<Record<string, boolean>> = signal({});
    protected readonly resultMap: WritableSignal<Record<string, 'success' | 'error' | null>> = signal({});

    protected readonly loadingFinish: WritableSignal<Record<number, boolean>> = signal({});
    protected readonly resultFinish: WritableSignal<Record<number, 'success' | 'error' | null>> = signal({});

    protected readonly importActions: ImportAction[] = [
        { key: 'jobs', label: $localize`Jobs`, icon: 'work', fn: () => this.adminService.importJobs() },
        { key: 'hero-skills', label: $localize`Compétences héros`, icon: 'military_tech', fn: () => this.adminService.importHeroSkills() },
        { key: 'categories', label: $localize`Catégories`, icon: 'category', fn: () => this.adminService.importCategories() },
        { key: 'items', label: $localize`Objets`, icon: 'inventory_2', fn: () => this.adminService.importItems() },
        { key: 'ruins', label: $localize`Ruines`, icon: 'domain', fn: () => this.adminService.importRuins() },
        { key: 'buildings', label: $localize`Bâtiments`, icon: 'apartment', fn: () => this.adminService.importBuildings() },
        { key: 'causes-of-death', label: $localize`Causes de mort`, icon: 'skull', fn: () => this.adminService.importCausesOfDeath() },
        { key: 'cleanup-types', label: $localize`Types de nettoyage`, icon: 'cleaning_services', fn: () => this.adminService.importCleanupTypes() },
        { key: 'wishlist-categories', label: $localize`Catégories de liste de souhaits`, icon: 'checklist', fn: () => this.adminService.importWishlistCategories() },
        { key: 'default-wishlists', label: $localize`Listes de souhaits par défaut`, icon: 'playlist_add', fn: () => this.adminService.importDefaultWishlists() },
    ];

    public ngOnInit(): void {
        this.townService.getSeasons()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((seasons: SeasonDTO[]) => {
                this.seasons.set(seasons);
                if (seasons.length > 0) {
                    this.seasonControl.setValue(seasons[0].id);
                }
            });
    }

    protected importAll(): void {
        this.loadingAll.set(true);
        this.resultAll.set(null);
        this.adminService.importAll()
            .pipe(
                finalize(() => this.loadingAll.set(false)),
                catchError(() => {
                    this.resultAll.set('error');
                    return EMPTY;
                }),
                takeUntilDestroyed(this.destroy_ref)
            )
            .subscribe(() => this.resultAll.set('success'));
    }

    protected runImport(action: ImportAction): void {
        this.loadingMap.update(m => ({ ...m, [action.key]: true }));
        this.resultMap.update(m => ({ ...m, [action.key]: null }));
        action.fn()
            .pipe(
                finalize(() => this.loadingMap.update(m => ({ ...m, [action.key]: false }))),
                catchError(() => {
                    this.resultMap.update(m => ({ ...m, [action.key]: 'error' }));
                    return EMPTY;
                }),
                takeUntilDestroyed(this.destroy_ref)
            )
            .subscribe(() => this.resultMap.update(m => ({ ...m, [action.key]: 'success' })));
    }

    protected importTowns(): void {
        this.loadingTowns.set(true);
        this.resultTowns.set(null);
        const season: number | null = this.seasonControl.value;
        this.adminService.importTowns(season ?? undefined)
            .pipe(
                finalize(() => this.loadingTowns.set(false)),
                catchError(() => {
                    this.resultTowns.set('error');
                    return EMPTY;
                }),
                takeUntilDestroyed(this.destroy_ref)
            )
            .subscribe(() => this.resultTowns.set('success'));
    }

    protected toggleSeasonFinished(seasonId: number, currentlyFinished: boolean): void {
        this.loadingFinish.update(m => ({ ...m, [seasonId]: true }));
        this.resultFinish.update(m => ({ ...m, [seasonId]: null }));
        const nextFinished: boolean = !currentlyFinished;
        const request$: Observable<void> = nextFinished
            ? this.adminService.finishSeason(seasonId)
            : this.adminService.unfinishSeason(seasonId);
        request$
            .pipe(
                finalize(() => this.loadingFinish.update(m => ({ ...m, [seasonId]: false }))),
                catchError(() => {
                    this.resultFinish.update(m => ({ ...m, [seasonId]: 'error' }));
                    return EMPTY;
                }),
                takeUntilDestroyed(this.destroy_ref)
            )
            .subscribe(() => {
                this.resultFinish.update(m => ({ ...m, [seasonId]: 'success' }));
                this.seasons.update(list => list.map(s => s.id === seasonId ? { ...s, isFinished: nextFinished } : s));
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
}
