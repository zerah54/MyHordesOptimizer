import { ChangeDetectionStrategy, Component, computed, inject, LOCALE_ID, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, Observable, of } from 'rxjs';

import { ApiService } from '../../../_abstract_model/services/api.service';
import { Imports, ListForAddRemove } from '../../../_abstract_model/types/_types';
import { Item } from '../../../_abstract_model/types/item.class';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../_shared/confirm-dialog/confirm-dialog.component';
import { ListElementAddRemoveComponent } from '../../../_shared/list-elements-add-remove/list-element-add-remove.component';
import { NightwatchStore, SimulationDayView, SimulationWatcherView } from '../nightwatch.store';
import { NightwatchCitizenStateDTO, NightwatchSimulationDTO } from '../nightwatch.types';
import { bagItems } from '../nightwatch-bag.util';
import { NightwatchSimulationDayComponent } from './day/nightwatch-simulation-day.component';
import {
    NightwatchSimulationDialogComponent,
    NightwatchSimulationDialogData,
    NightwatchSimulationDialogResult
} from './nightwatch-simulation-dialog.component';

const material_modules: Imports = [MatButtonModule, MatDialogModule, MatExpansionModule, MatIconModule, MatMenuModule, MatTooltipModule];

/** Ligne du tableau « Veilleurs par jour » : un citoyen et son risque par jour (nul s'il ne veille pas). */
interface SimulationCitizenRow {
    user_id: number;
    name: string;
    risks: (number | null)[];
}

/** Onglet Simulations : simulations en puces, stock de départ replié, frise des jours, détail du jour et veilleurs par jour. */
@Component({
    selector: 'mho-nightwatch-simulations-tab',
    templateUrl: './nightwatch-simulations-tab.component.html',
    styleUrls: ['./nightwatch-simulations-tab.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NightwatchSimulationDayComponent, ListElementAddRemoveComponent, ...material_modules]
})
export class NightwatchSimulationsTabComponent {

    protected readonly store: NightwatchStore = inject(NightwatchStore);

    /** Simulation ouverte. */
    protected readonly selected: Signal<NightwatchSimulationDTO | null> = computed((): NightwatchSimulationDTO | null =>
        this.store.simulations().find((simulation: NightwatchSimulationDTO): boolean => simulation.id === this.store.selected_simulation_id()) ?? null);

    /** Objets du jeu. */
    private readonly items: Signal<readonly Item[]> = toSignal(inject(ApiService).getItems().pipe(catchError((): Observable<Item[]> => of([]))),
                                                               { initialValue: [] as Item[] });

    /** Stock de départ de la simulation ouverte. */
    private readonly stock: Signal<Record<number, number>> = computed((): Record<number, number> => this.selected()?.stock ?? {});

    /** Nombre d'objets du stock de départ. */
    protected readonly stock_count: Signal<number> = computed((): number =>
        Object.values(this.stock()).reduce((sum: number, quantity: number): number => sum + quantity, 0));

    /** Stock de départ pour le composant de sac : un objet par exemplaire, objets hors catalogue omis. */
    protected readonly stock_bag: Signal<Item[]> = computed((): Item[] => bagItems(this.stock(), this.items(), false));

    /** Onglets d'ajout au stock de départ : objets en banque (avec leur quantité) et tous. */
    protected readonly stock_lists: Signal<ListForAddRemove[]> = computed((): ListForAddRemove[] => {
        const bank: Record<number, number> = this.store.state()?.bank ?? {};
        const bank_counts: ReadonlyMap<number, number> = new Map<number, number>(Object.entries(bank)
            .map(([item_id, count]: [string, number]): [number, number] => [Number(item_id), count]));
        return [
            { label: $localize`Banque`, list: this.items().filter((item: Item): boolean => (bank[item.id] ?? 0) > 0), counts: bank_counts },
            { label: $localize`Tous`, list: [...this.items()] }
        ];
    });

    /** Citoyens qui veillent au moins un jour, par ordre alphabétique, avec leur risque pour chaque jour de la simulation. */
    protected readonly rows: Signal<SimulationCitizenRow[]> = computed((): SimulationCitizenRow[] => {
        const days: SimulationDayView[] = this.store.simulation_days();
        return (this.store.state()?.citizens ?? [])
            .map((citizen: NightwatchCitizenStateDTO): SimulationCitizenRow => ({
                user_id: citizen.userId,
                name: citizen.name,
                risks: days.map((day: SimulationDayView): number | null =>
                    day.watchers.find((watcher: SimulationWatcherView): boolean => watcher.user_id === citizen.userId)?.risk ?? null)
            }))
            .filter((row: SimulationCitizenRow): boolean => row.risks.some((risk: number | null): boolean => risk !== null))
            .sort((a: SimulationCitizenRow, b: SimulationCitizenRow): number => a.name.localeCompare(b.name, this.locale, { sensitivity: 'base' }));
    });

    /** Jour de la simulation affiché en détail, nul s'il n'en fait pas partie. */
    protected readonly selected_day_view: Signal<SimulationDayView | null> = computed((): SimulationDayView | null =>
        this.store.simulation_days().find((day: SimulationDayView): boolean => day.day === this.store.selected_day()) ?? null);

    private readonly dialog: MatDialog = inject(MatDialog);
    private readonly locale: string = inject(LOCALE_ID);

    /**
     * Risque en pourcentage, au centième.
     * @param {number} risk Risque entre 0 et 1.
     * @returns {number} Pourcentage arrondi.
     */
    protected percent(risk: number): number {
        return Math.round(risk * 10000) / 100;
    }

    /**
     * Ouvre une simulation, ou la quitte si elle est déjà ouverte.
     * @param {number} simulation_id Simulation choisie.
     */
    protected toggle(simulation_id: number): void {
        this.store.selectSimulation(simulation_id === this.store.selected_simulation_id() ? null : simulation_id);
    }

    /**
     * Affiche un jour de la simulation (sa proposition du jour est sélectionnée par le store).
     * @param {number} day Jour choisi.
     */
    protected selectDay(day: number): void {
        if (day !== this.store.selected_day()) {
            this.store.selectDay(day);
        }
    }

    /** Crée une simulation : nom et dernier jour à défendre. */
    protected newSimulation(): void {
        this.ask({ title: $localize`Nouvelle simulation`, name: '', last_day: this.store.current_day, min_day: this.store.current_day },
                 (result: NightwatchSimulationDialogResult): void => this.store.createSimulation(result.name ?? '', result.last_day ?? this.store.current_day));
    }

    /** Renomme la simulation ouverte. */
    protected rename(): void {
        const simulation: NightwatchSimulationDTO | null = this.selected();
        if (simulation !== null) {
            this.ask({ title: $localize`Renommer la simulation`, name: simulation.name, last_day: null, min_day: this.store.current_day },
                     (result: NightwatchSimulationDialogResult): void => this.store.renameSimulation(result.name ?? simulation.name));
        }
    }

    /** Change le dernier jour à défendre de la simulation ouverte ; raccourcir (propositions supprimées) demande confirmation. */
    protected changeLastDay(): void {
        const simulation: NightwatchSimulationDTO | null = this.selected();
        if (simulation === null) {
            return;
        }
        this.ask({ title: $localize`Changer le dernier jour`, name: null, last_day: simulation.lastDay, min_day: this.store.current_day },
                 (result: NightwatchSimulationDialogResult): void => {
                     const last_day: number = result.last_day ?? simulation.lastDay;
                     if (last_day >= simulation.lastDay) {
                         this.store.setSimulationLastDay(last_day);
                         return;
                     }
                     this.confirm({ title: $localize`Raccourcir la simulation`, text: $localize`Les propositions de la simulation après le jour ${last_day}:day: seront supprimées.` },
                                  (): void => this.store.setSimulationLastDay(last_day));
                 });
    }

    /**
     * Ajoute ou retire un exemplaire au stock de départ.
     * @param {number} item_id Objet.
     * @param {number} delta +1 ou -1.
     */
    protected changeStock(item_id: number, delta: number): void {
        this.store.setSimulationStock(item_id, Math.max(0, (this.stock()[item_id] ?? 0) + delta));
    }

    /** Duplique la simulation ouverte (avec ses propositions) sous un nouveau nom. */
    protected duplicate(): void {
        const simulation: NightwatchSimulationDTO | null = this.selected();
        if (simulation !== null) {
            this.ask({ title: $localize`Dupliquer la simulation`, name: $localize`${simulation.name}:name: (copie)`, last_day: null, min_day: this.store.current_day },
                     (result: NightwatchSimulationDialogResult): void => this.store.duplicateSimulation(result.name ?? simulation.name));
        }
    }

    /** Supprime la simulation ouverte après confirmation (elle est partagée par toute la ville). */
    protected remove(): void {
        const simulation: NightwatchSimulationDTO | null = this.selected();
        if (simulation === null) {
            return;
        }
        this.confirm({ title: $localize`Supprimer la simulation`, text: $localize`La simulation « ${simulation.name}:name: » sera supprimée pour toute la ville.` },
                     (): void => this.store.deleteSimulation());
    }

    /**
     * Demande confirmation puis applique l'action.
     * @param {ConfirmDialogData} data Titre et texte.
     * @param {() => void} apply Action confirmée.
     */
    private confirm(data: ConfirmDialogData, apply: () => void): void {
        this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, { data })
            .afterClosed()
            .subscribe((confirmed: boolean | undefined): void => {
                if (confirmed === true) {
                    apply();
                }
            });
    }

    /**
     * Ouvre la boîte de saisie puis applique l'action ; une boîte annulée ne fait rien.
     * @param {NightwatchSimulationDialogData} data Paramètres de la boîte.
     * @param {(result: NightwatchSimulationDialogResult) => void} apply Action à appliquer.
     */
    private ask(data: NightwatchSimulationDialogData, apply: (result: NightwatchSimulationDialogResult) => void): void {
        this.dialog.open<NightwatchSimulationDialogComponent, NightwatchSimulationDialogData, NightwatchSimulationDialogResult>(
            NightwatchSimulationDialogComponent, { data, width: '24rem', maxWidth: '95vw' })
            .afterClosed()
            .subscribe((result: NightwatchSimulationDialogResult | undefined): void => {
                if (result !== undefined) {
                    apply(result);
                }
            });
    }
}
