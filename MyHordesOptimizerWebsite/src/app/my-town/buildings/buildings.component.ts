import { CdkScrollable } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, Injector, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';

import { RealtimeBuildingPlansService } from '../../_abstract_model/realtime-services/realtime-building-plans.service';
import { Imports } from '../../_abstract_model/types/_types';
import { TownContextService } from '../../_core/services/town-context.service';
import { ActiveCitizensComponent } from '../../_shared/active-citizens/active-citizens.component';
import { CitizenFilterSortStore } from '../../_shared/citizen-filters/citizen-filter-sort.store';
import { PlanningBudgetComponent } from './planning/budget/planning-budget.component';
import { PlanningCard, PlanningCardsComponent } from './planning/cards/planning-cards.component';
import { CitizenFiltersStore } from './planning/citizen-filters.store';
import { PlanningDefenseComponent } from './planning/defense/planning-defense.component';
import { PlanningHeaderComponent } from './planning/header/planning-header.component';
import { PlanningItemValuesDialogComponent } from './planning/item-values-dialog/planning-item-values-dialog.component';
import { PlanningKpisComponent } from './planning/kpis/planning-kpis.component';
import { PlanPool } from './planning/plan.types';
import { alertAnchor, alertCard, PlanAlert } from './planning/plan-alerts.util';
import { CitizenRef } from './planning/plan-evaluation.util';
import { PlanningStore } from './planning/planning.store';
import { PlanningProgramComponent } from './planning/program/planning-program.component';
import { PlanningResourcesComponent } from './planning/resources/planning-resources.component';
import { PlanningShareComponent } from './planning/share/planning-share.component';
import { PlanningTrackingComponent } from './planning/tracking/planning-tracking.component';
import { PlanningTreeDrawerComponent, PlanningTreeDrawerData } from './planning/tree-drawer/planning-tree-drawer.component';
import { confirmDiscardChanges } from './planning/unsaved-changes.util';

const components: Imports = [
    ActiveCitizensComponent, PlanningBudgetComponent, PlanningCardsComponent, PlanningDefenseComponent, PlanningHeaderComponent, PlanningKpisComponent, PlanningProgramComponent,
    PlanningResourcesComponent, PlanningShareComponent, PlanningTrackingComponent
];
const cdk_modules: Imports = [CdkScrollable];
const material_modules: Imports = [MatButtonModule, MatCardModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule];

/** Largeur d'écran sous laquelle le tiroir occupe toute la largeur. */
const NARROW_SCREEN: number = 600;

/** Page de planification des chantiers : en-tête, chiffres épinglés, cartes des sujets avec le contenu du sujet choisi, et tiroir de choix. */
@Component({
    selector: 'mho-buildings',
    templateUrl: './buildings.component.html',
    styleUrls: ['./buildings.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '(window:beforeunload)': 'onBeforeUnload($event)'
    },
    providers: [PlanningStore, CitizenFilterSortStore, CitizenFiltersStore],
    imports: [...components, ...cdk_modules, ...material_modules]
})
export class BuildingsComponent implements OnInit {

    protected readonly store: PlanningStore = inject(PlanningStore);
    /** Sujet affiché sous les cartes. */
    protected readonly card: WritableSignal<PlanningCard> = signal<PlanningCard>('program');
    /** Alertes du sujet affiché. */
    protected readonly card_alerts: Signal<PlanAlert[]> = computed((): PlanAlert[] => this.store.alerts().filter((alert: PlanAlert): boolean => alertCard(alert) === this.card()));
    protected readonly anchor: (alert: PlanAlert) => string | null = alertAnchor;

    private readonly dialog: MatDialog = inject(MatDialog);
    private readonly injector: Injector = inject(Injector);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);
    private readonly realtime: RealtimeBuildingPlansService = inject(RealtimeBuildingPlansService);
    private readonly town_context: TownContextService = inject(TownContextService);

    /** Identifiants des citoyens présents sur la page. */
    protected readonly present_citizens: WritableSignal<number[]> = signal<number[]>([]);

    public ngOnInit(): void {
        this.store.load();
        this.declarePresence();
    }

    /**
     * Sortie de la page (garde de route) : ce qui attend est enregistré, confirmation seulement si l'enregistrement échoue.
     * @returns {Observable<boolean>} Vrai si la navigation peut continuer.
     */
    public canLeave(): Observable<boolean> {
        return confirmDiscardChanges(this.store, this.dialog);
    }

    /**
     * Fermeture ou rechargement de l'onglet : le navigateur demande confirmation s'il reste des modifications non enregistrées.
     * @param {BeforeUnloadEvent} event Événement du navigateur.
     */
    protected onBeforeUnload(event: BeforeUnloadEvent): void {
        this.store.flushEdits();
        if (this.store.dirty()) {
            event.preventDefault();
        }
    }

    /**
     * Pseudo d'un citoyen de la ville.
     * @param {number} user_id Citoyen.
     * @returns {string} Pseudo, `?` s'il est inconnu.
     */
    protected citizenName(user_id: number): string {
        return this.store.citizens().find((citizen: CitizenRef): boolean => citizen.userId === user_id)?.name ?? '?';
    }

    /** Ouvre la boîte des valeurs des objets (réglage de la ville). */
    protected openItemValues(): void {
        this.dialog.open(PlanningItemValuesDialogComponent, { injector: this.injector, width: '32rem', maxWidth: '95vw' });
    }

    /**
     * Ouvre le tiroir de choix des chantiers pour une section, à droite (pleine largeur sur petit écran).
     * @param {PlanPool} pool Section.
     */
    protected openDrawer(pool: PlanPool): void {
        const narrow: boolean = typeof window !== 'undefined' && window.innerWidth < NARROW_SCREEN;
        this.dialog.open<PlanningTreeDrawerComponent, PlanningTreeDrawerData>(PlanningTreeDrawerComponent, {
            data: { pool },
            injector: this.injector,
            position: { right: '0', top: '0' },
            height: '100dvh',
            width: narrow ? '100vw' : 'min(72vw, 1200px)',
            maxWidth: '100vw',
            panelClass: 'mho-side-sheet',
            backdropClass: 'cdk-overlay-transparent-backdrop'
        });
    }

    /** Présent sur la page tant qu'elle est ouverte ; une ville observée n'a pas de présence (le hub suit la ville du jeton). */
    private declarePresence(): void {
        if (this.town_context.isReadonly() || this.destroy_ref.destroyed) {
            return;
        }
        this.realtime.users$.pipe(takeUntilDestroyed(this.destroy_ref)).subscribe((user_ids: number[]): void => this.present_citizens.set([...user_ids]));
        const joined: Promise<unknown> = this.realtime.joinPresence().catch((error: unknown): void => console.warn('JoinPresence', error));
        // Le retrait attend la déclaration : sinon une déclaration tardive laisserait une présence fantôme.
        this.destroy_ref.onDestroy((): void => {
            void joined.then((): Promise<void> => this.realtime.leavePresence()).catch((error: unknown): void => console.warn('LeavePresence', error));
        });
    }

    /**
     * Amène à un élément du programme.
     * @param {string} id Identifiant de l'élément.
     */
    protected scrollTo(id: string): void {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}
