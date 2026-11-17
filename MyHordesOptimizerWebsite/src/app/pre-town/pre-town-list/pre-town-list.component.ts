import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';

import { PreTownService } from '../../_abstract_model/services/pre-town.service';
import { Imports } from '../../_abstract_model/types/_types';
import { PreTown, PreTownSummary } from '../../_abstract_model/types/pre-town.class';
import { PageTitleComponent } from '../../_shared/page-title/page-title.component';

const angular_common: Imports = [FormsModule];
const components: Imports = [PageTitleComponent];
const material_modules: Imports = [MatCardModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule];

/** Liste « Mes pré-villes » et création d'une pré-ville. */
@Component({
    selector: 'mho-pre-town-list',
    imports: [...angular_common, ...components, ...material_modules],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './pre-town-list.component.html',
    styleUrl: './pre-town-list.component.scss'
})
export class PreTownListComponent implements OnInit {
    private readonly pre_town_service: PreTownService = inject(PreTownService);
    private readonly router: Router = inject(Router);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    protected readonly pre_towns: WritableSignal<PreTownSummary[]> = signal<PreTownSummary[]>([]);
    protected readonly list_loading: WritableSignal<boolean> = signal<boolean>(true);
    protected readonly list_failed: WritableSignal<boolean> = signal<boolean>(false);
    protected readonly alias: WritableSignal<string> = signal<string>('');
    protected readonly creating: WritableSignal<boolean> = signal<boolean>(false);
    protected readonly can_create: Signal<boolean> = computed((): boolean => this.alias().trim() !== '' && !this.creating());

    /** Charge les pré-villes de l'utilisateur ; le spinner est levé à la réponse comme à l'erreur. */
    public ngOnInit(): void {
        this.pre_town_service.listMine()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (items: PreTownSummary[]): void => {
                    this.pre_towns.set(items);
                    this.list_loading.set(false);
                },
                error: (): void => {
                    this.list_failed.set(true);
                    this.list_loading.set(false);
                }
            });
    }

    /** Crée la pré-ville puis ouvre son détail ; le loader reste jusqu'à la réponse ou l'erreur. */
    protected create(): void {
        if (!this.can_create()) return;
        this.creating.set(true);
        this.pre_town_service.create(this.alias().trim())
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (created: PreTown): void => {
                    this.creating.set(false);
                    this.alias.set('');
                    void this.router.navigate(['/pre-town', created.preTownId]);
                },
                error: (): void => this.creating.set(false)
            });
    }

    /**
     * Ouvre une pré-ville ; le badge « nouveau » est retiré tout de suite, le détail enregistre le « vu ».
     * @param {PreTownSummary} item Ligne ouverte.
     */
    protected open(item: PreTownSummary): void {
        this.pre_towns.update((items: PreTownSummary[]): PreTownSummary[] =>
            items.map((i: PreTownSummary): PreTownSummary => i.preTownId === item.preTownId ? { ...i, seen: true } : i));
        void this.router.navigate(['/pre-town', item.preTownId]);
    }
}
