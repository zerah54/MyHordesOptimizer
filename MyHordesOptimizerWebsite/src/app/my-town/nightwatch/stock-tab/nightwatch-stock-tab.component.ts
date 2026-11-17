import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import moment from 'moment';
import { catchError, Observable, of, switchMap } from 'rxjs';

import { ApiService } from '../../../_abstract_model/services/api.service';
import { Imports } from '../../../_abstract_model/types/_types';
import { Item } from '../../../_abstract_model/types/item.class';
import { IconApComponent } from '../../../_shared/icon-ap/icon-ap.component';
import { itemIcon, itemLabel } from '../../buildings/planning/planning-labels.util';
import { ResourceCount } from '../../buildings/planning/resources.util';
import { NightwatchStore } from '../nightwatch.store';
import { StockLine } from '../nightwatch-stock.util';
import { BuildingNeeds, NightwatchBuildingNeedsService } from './building-needs.service';

const components: Imports = [IconApComponent];
const material_modules: Imports = [MatChipsModule, MatFormFieldModule, MatInputModule, MatTableModule];

/** Objet affiché : libellé et icône (vide si inconnu). */
interface ItemView {
    label: string;
    icon: string;
}

/** Ligne du bilan avec l'objet affiché. */
interface StockRow {
    line: StockLine;
    item: ItemView;
}

/** Ligne de la consommation des chantiers. */
interface BuildingRow {
    item_id: number;
    count: number;
    item: ItemView;
}

/** Onglet Bilan : besoin des veilleurs contre stock par source, reste à trouver, coût et consommation des chantiers. Lit le store de la page. */
@Component({
    selector: 'mho-nightwatch-stock-tab',
    templateUrl: './nightwatch-stock-tab.component.html',
    styleUrls: ['./nightwatch-stock-tab.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...components, ...material_modules]
})
export class NightwatchStockTabComponent {

    protected readonly store: NightwatchStore = inject(NightwatchStore);
    protected readonly stock_columns: readonly string[] = ['item', 'need', 'in_bag', 'in_chests', 'in_bank', 'in_desert', 'manual', 'remaining', 'broken'];
    protected readonly building_columns: readonly string[] = ['item', 'need'];

    private readonly items: Signal<readonly Item[]> = toSignal(inject(ApiService).getItems().pipe(catchError((): Observable<Item[]> => of([]))), { initialValue: [] as Item[] });
    private readonly locale: string = moment.locale();
    private readonly needs_service: NightwatchBuildingNeedsService = inject(NightwatchBuildingNeedsService);

    /** Besoins des chantiers du plan effectif du jour affiché ; recalculés à chaque changement de jour. */
    protected readonly building_needs: Signal<BuildingNeeds> = toSignal(
        toObservable(this.store.selected_day).pipe(
            switchMap((day: number): Observable<BuildingNeeds> => this.needs_service.needsOfDay(day, this.store.current_day))
        ),
        { initialValue: { status: 'loading', needs: [] } as BuildingNeeds }
    );

    /** Lignes du bilan, avec libellé et icône. */
    protected readonly rows: Signal<StockRow[]> = computed((): StockRow[] =>
        this.store.stock_lines().map((line: StockLine): StockRow => ({ line, item: this.view(line.item_id) })));

    /** Lignes de consommation des chantiers, avec libellé et icône. */
    protected readonly building_rows: Signal<BuildingRow[]> = computed((): BuildingRow[] =>
        this.building_needs().needs.map((need: ResourceCount): BuildingRow => ({ item_id: need.itemId, count: need.count, item: this.view(need.itemId) })));

    /**
     * Identité d'une ligne du bilan : l'objet, pour conserver le focus pendant la saisie.
     * @param {number} _index Position de la ligne.
     * @param {StockRow} row Ligne.
     * @returns {number} Identifiant de l'objet.
     */
    protected trackRow(_index: number, row: StockRow): number {
        return row.line.item_id;
    }

    /**
     * Fixe le stock saisi à la main pour un objet et réécrit la valeur normalisée dans le champ.
     * @param {number} item_id Objet.
     * @param {HTMLInputElement} input Champ saisi ; une valeur invalide ou négative vaut 0, une décimale est arrondie à l'entier inférieur.
     */
    protected setManual(item_id: number, input: HTMLInputElement): void {
        const quantity: number = Math.max(0, Math.floor(Number(input.value)) || 0);
        this.store.setManualStock(item_id, quantity);
        input.value = String(quantity);
    }

    /**
     * Date et âge de la mise à jour d'un coffre.
     * @param {string} updated_at Date ISO.
     * @returns {string} Date locale suivie de l'âge relatif.
     */
    protected chestDate(updated_at: string): string {
        const date: moment.Moment = moment(updated_at);
        return `${date.format('L LT')} (${date.fromNow()})`;
    }

    /**
     * Nom accessible du champ de saisie d'un objet.
     * @param {string} label Libellé de l'objet.
     * @returns {string} Texte de l'étiquette.
     */
    protected manualLabel(label: string): string {
        return `${$localize`Stock saisi à la main`} — ${label}`;
    }

    /**
     * Libellé et icône d'un objet.
     * @param {number} item_id Objet.
     * @returns {ItemView} Affichage de l'objet.
     */
    private view(item_id: number): ItemView {
        return { label: itemLabel(this.items(), item_id, this.locale), icon: itemIcon(this.items(), item_id) };
    }
}
