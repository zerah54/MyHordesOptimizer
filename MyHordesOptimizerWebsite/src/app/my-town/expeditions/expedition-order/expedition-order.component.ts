import { ChangeDetectionStrategy, Component, computed, input, InputSignal, output, OutputEmitterRef, Signal } from '@angular/core';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import moment from 'moment';

import { Imports } from '../../../_abstract_model/types/_types';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { Expedition } from '../../../_abstract_model/types/expedition.class';
import { ExpeditionOrder } from '../../../_abstract_model/types/expedition-order.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { MapRoutePoint } from '../../../_abstract_model/types/map-route.class';
import { describeOrder, ExpeditionOrderDescription } from '../expedition-orders/order-labels';

const material_modules: Imports = [MatCheckboxModule, MatIconModule];

/**
 * Une consigne d'expédition, partagée par la feuille de route, les consignes personnelles et la carte : case,
 * case à cocher ou puce, icône de l'objet ou pictogramme, verbe, paramètres et à qui elle s'adresse.
 */
@Component({
    selector: 'mho-expedition-order',
    templateUrl: './expedition-order.component.html',
    styleUrls: ['./expedition-order.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...material_modules]
})
export class ExpeditionOrderComponent {
    public readonly order: InputSignal<ExpeditionOrder> = input.required();
    public readonly items: InputSignal<readonly Item[]> = input<readonly Item[]>([]);
    /** Citoyens de la ville, pour le nom du citoyen à attendre. */
    public readonly citizens: InputSignal<readonly Citizen[]> = input<readonly Citizen[]>([]);
    /** Expéditions du jour, pour le nom de l'expédition à attendre. */
    public readonly expeditions: InputSignal<readonly Expedition[]> = input<readonly Expedition[]>([]);
    /** Position de la ville : avec elle, la case de la consigne s'affiche en coordonnées relatives. */
    public readonly town: InputSignal<MapRoutePoint | null> = input<MapRoutePoint | null>(null);
    /** À qui s'adresse la consigne (« N'importe qui », un nom) ; rien sinon. */
    public readonly scope: InputSignal<string | null> = input<string | null>(null);
    public readonly scopeIsMe: InputSignal<boolean> = input<boolean>(false);
    /** La case à cocher est-elle active (jour modifiable, utilisateur citoyen) ? */
    public readonly checkable: InputSignal<boolean> = input<boolean>(false);

    public readonly doneChange: OutputEmitterRef<boolean> = output();

    private readonly locale: string = moment.locale();

    protected readonly cell_label: Signal<string | null> = computed((): string | null => {
        const order: ExpeditionOrder = this.order();
        const town: MapRoutePoint | null = this.town();
        if (!town || order.x === null || order.y === null) return null;
        return `[${order.x - town.x} ; ${town.y - order.y}]`;
    });

    protected readonly view: Signal<ExpeditionOrderDescription> = computed((): ExpeditionOrderDescription => {
        return describeOrder(this.order(), this.items(), this.citizens(), this.locale, this.expeditions());
    });

    protected onDoneChange(change: MatCheckboxChange): void {
        this.doneChange.emit(change.checked);
    }
}
