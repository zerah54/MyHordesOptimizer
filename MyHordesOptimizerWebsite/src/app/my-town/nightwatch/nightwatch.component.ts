import { Clipboard } from '@angular/cdk/clipboard';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';

import { RealtimeNightwatchPlansService } from '../../_abstract_model/realtime-services/realtime-nightwatch-plans.service';
import { Imports } from '../../_abstract_model/types/_types';
import { SnackbarService } from '../../_core/services/snackbar.service';
import { TownContextService } from '../../_core/services/town-context.service';
import { PageTitleComponent } from '../../_shared/page-title/page-title.component';
import { NightwatchEveningTabComponent } from './evening-tab/nightwatch-evening-tab.component';
import { NightwatchHeaderComponent } from './header/nightwatch-header.component';
import { buildForumInput } from './nightwatch-forum-input.util';
import { buildForumLabels } from './nightwatch-forum-labels';
import { buildForumPost } from './nightwatch-forum-post.util';
import { injectItemLabeler } from './nightwatch-item-labels';
import { statusLabel } from './nightwatch-status-labels';
import { NightwatchStore, NightwatchTotals } from './nightwatch.store';
import { NightwatchPlanContentDTO } from './nightwatch.types';
import { NightwatchPlanTabComponent } from './plan-tab/nightwatch-plan-tab.component';
import { NightwatchStockTabComponent } from './stock-tab/nightwatch-stock-tab.component';

const angular_common: Imports = [];
const components: Imports = [NightwatchEveningTabComponent, NightwatchHeaderComponent, NightwatchPlanTabComponent, NightwatchStockTabComponent, PageTitleComponent];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, MatTabsModule];

/** Page des plans de veille : en-tête (jour, propositions), bannières de lecture seule, de main et de conflit, puis onglets. */
@Component({
    selector: 'mho-nightwatch',
    templateUrl: './nightwatch.component.html',
    styleUrls: ['./nightwatch.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [NightwatchStore],
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class NightwatchComponent implements OnInit {

    protected readonly store: NightwatchStore = inject(NightwatchStore);

    private readonly itemLabel: (item_id: number) => string = injectItemLabeler();
    private readonly clipboard: Clipboard = inject(Clipboard);
    private readonly snackbar: SnackbarService = inject(SnackbarService);
    private readonly realtime: RealtimeNightwatchPlansService = inject(RealtimeNightwatchPlansService);
    private readonly town_context: TownContextService = inject(TownContextService);

    /** La ville affichée est observée : aucune modification possible. */
    protected readonly is_readonly: boolean = this.town_context.isReadonly();
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    /** Le brouillon compte au moins un veilleur : le message forum est utile. */
    protected readonly can_copy: Signal<boolean> = computed((): boolean => (this.store.draft()?.watchers.length ?? 0) > 0);

    /** Ouvre la page : charge les plans et déclare la présence. */
    public ngOnInit(): void {
        this.store.load();
        this.declarePresence();
    }

    /** Copie dans le presse-papiers le message forum de la proposition affichée. */
    protected copyForumPost(): void {
        const draft: NightwatchPlanContentDTO | null = this.store.draft();
        const totals: NightwatchTotals | null = this.store.totals();
        if (draft === null || totals === null || draft.watchers.length === 0) {
            return;
        }
        const text: string = buildForumPost(buildForumInput({
            draft,
            rows: this.store.watcher_rows(),
            citizens: this.store.state()?.citizens ?? [],
            stock_lines: this.store.stock_lines(),
            referential: this.store.referential(),
            total_defense: totals.defense,
            cost: totals.cost,
            itemLabel: this.itemLabel,
            statusLabel
        }), buildForumLabels());
        if (this.clipboard.copy(text)) {
            this.snackbar.successSnackbar($localize`Le message a bien été copié au format forum`);
        } else {
            this.snackbar.errorSnackbar($localize`Copie impossible : le presse-papiers est inaccessible. Réessayez.`);
        }
    }


    /** Présent sur la page tant qu'elle est ouverte ; une ville observée n'a pas de présence (le hub suit la ville du jeton). */
    private declarePresence(): void {
        if (this.town_context.isReadonly() || this.destroy_ref.destroyed) {
            return;
        }
        const joined: Promise<unknown> = this.realtime.joinPresence().catch((error: unknown): void => console.warn('JoinPresence', error));
        // Le retrait attend la déclaration : sinon une déclaration tardive laisserait une présence fantôme.
        this.destroy_ref.onDestroy((): void => {
            void joined.then((): Promise<void> => this.realtime.leavePresence()).catch((error: unknown): void => console.warn('LeavePresence', error));
        });
    }
}
