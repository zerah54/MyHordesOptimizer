import { ChangeDetectionStrategy, Component, computed, inject, input, InputSignal, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';

import { Imports } from '../../../../_abstract_model/types/_types';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { CitizenExpedition } from '../../../../_abstract_model/types/citizen-expedition.class';
import { Expedition } from '../../../../_abstract_model/types/expedition.class';
import { ExpeditionPart } from '../../../../_abstract_model/types/expedition-part.class';
import { Item } from '../../../../_abstract_model/types/item.class';
import { mapRouteColorVar, MapRoutePoint } from '../../../../_abstract_model/types/map-route.class';
import { Ruin } from '../../../../_abstract_model/types/ruin.class';
import { Town } from '../../../../_abstract_model/types/town.class';
import { getUserId } from '../../../../_core/utilities/localstorage.util';
import { ExpeditionOrderComponent } from '../../../expeditions/expedition-order/expedition-order.component';
import { ExpeditionOrderEditorService, ExpeditionOrderMapContext } from '../../../expeditions/expedition-orders/expedition-order-editor.service';
import { cellKey } from '../../../expeditions/expedition-orders/expedition-orders.util';
import { partLabel } from '../../../expeditions/expedition-orders/order-labels';
import { cellsByCoordinates } from '../../map-routes/map-route-detail';
import { DayExpeditionsStore } from '../day-expeditions.store';
import { buildCellOrdersView, CellOrderEntry, cellOrdersAt, CellOrdersView } from '../map-cell-orders';

const material_modules: Imports = [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule];

export type MapCellOrdersMode = 'tooltip' | 'detail';

/** Partie où ajouter une consigne sur la case. */
interface PartChoice {
    readonly key: string;
    readonly part: ExpeditionPart;
    readonly label: string;
    readonly color: string | null;
}

/**
 * Consignes des expéditions du jour sur une case. Dans l'infobulle : celles qui s'adressent à l'utilisateur, puis
 * les autres résumées sur une ligne. Dans le détail de la zone : les siennes, à cocher, les autres, et l'ajout d'une
 * consigne sur la case (parties dont le tracé passe par la case en tête).
 */
@Component({
    selector: 'mho-map-cell-orders',
    templateUrl: './map-cell-orders.component.html',
    styleUrls: ['./map-cell-orders.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ExpeditionOrderComponent, ...material_modules]
})
export class MapCellOrdersComponent {
    /** Case, en coordonnées absolues. */
    public readonly cell: InputSignal<MapRoutePoint> = input.required();
    public readonly mode: InputSignal<MapCellOrdersMode> = input<MapCellOrdersMode>('tooltip');
    public readonly items: InputSignal<readonly Item[]> = input<readonly Item[]>([]);
    public readonly citizens: InputSignal<readonly Citizen[]> = input<readonly Citizen[]>([]);
    /** Détail : carte et bâtiments, pour le formulaire d'une consigne. */
    public readonly map: InputSignal<Town | undefined> = input<Town | undefined>(undefined);
    public readonly ruins: InputSignal<readonly Ruin[]> = input<readonly Ruin[]>([]);
    /** Détail : cocher, ajouter et modifier des consignes (citoyen de la ville). */
    public readonly editable: InputSignal<boolean> = input<boolean>(false);

    protected readonly edit_label: string = $localize`Modifier la consigne`;

    private readonly store: DayExpeditionsStore = inject(DayExpeditionsStore);
    private readonly order_editor: ExpeditionOrderEditorService = inject(ExpeditionOrderEditorService);
    private readonly locale: string = moment.locale();

    private readonly entries: Signal<readonly CellOrderEntry[]> = computed((): readonly CellOrderEntry[] => cellOrdersAt(this.store.cell_orders(), this.cell()));

    protected readonly view: Signal<CellOrdersView> = computed((): CellOrdersView => buildCellOrdersView(this.entries(), {
        user_id: getUserId(),
        citizens: this.citizens(),
        items: this.items(),
        locale: this.locale
    }));

    /** Qui porte les autres consignes, sur une ligne. */
    protected readonly others_names: Signal<string> = computed((): string => this.view().others_names.join(', '));

    /** Parties du jour où ajouter une consigne : celles dont le tracé passe par la case, puis les siennes, puis les autres. */
    protected readonly choices: Signal<readonly PartChoice[]> = computed((): readonly PartChoice[] => {
        if (this.mode() !== 'detail' || !this.editable()) return [];
        const key: string = cellKey(this.cell());
        const user_id: number | null = getUserId();
        const ranked: { choice: PartChoice; rank: number; order: number }[] = [];
        this.store.expeditions().forEach((expedition: Expedition): void => {
            for (const part of expedition.parts) {
                if (part.id === undefined) continue;
                const on_route: boolean = !!part.map_route?.cells.some((point: MapRoutePoint): boolean => cellKey(point) === key);
                const mine: boolean = user_id !== null && part.citizens.some((member: CitizenExpedition): boolean => member.citizen_id === user_id);
                ranked.push({
                    choice: {
                        key: `p${part.id}`,
                        part,
                        label: partLabel(expedition, part, true),
                        color: part.map_route ? mapRouteColorVar(part.map_route.color) : null
                    },
                    rank: on_route ? 0 : mine ? 1 : 2,
                    order: ranked.length
                });
            }
        });
        return ranked
            .sort((a: { rank: number; order: number }, b: { rank: number; order: number }): number => a.rank - b.rank || a.order - b.order)
            .map(({ choice }: { choice: PartChoice }): PartChoice => choice);
    });

    private readonly form_context: Signal<ExpeditionOrderMapContext> = computed((): ExpeditionOrderMapContext => ({
        map: this.map(),
        cells: cellsByCoordinates(this.map()),
        ruins: this.ruins(),
        citizens: this.citizens(),
        items: this.items()
    }));

    protected toggleDone(entry: CellOrderEntry, done: boolean): Promise<void> {
        return this.order_editor.toggleDone(entry.order, done);
    }

    protected add(part: ExpeditionPart): void {
        void this.order_editor.edit(part, this.cell(), null, this.form_context());
    }

    protected edit(entry: CellOrderEntry): void {
        if (!this.editable()) return;
        void this.order_editor.edit(entry.part, this.cell(), entry, this.form_context());
    }
}
