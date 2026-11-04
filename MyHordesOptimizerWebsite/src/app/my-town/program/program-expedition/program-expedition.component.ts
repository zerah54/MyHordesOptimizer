import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, InputSignal, Signal, signal, WritableSignal } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import moment from 'moment';

import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { HeroicActionEnum } from '../../../_abstract_model/enum/heroic-action.enum';
import { JobEnum } from '../../../_abstract_model/enum/job.enum';
import { Imports } from '../../../_abstract_model/types/_types';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenExpedition } from '../../../_abstract_model/types/citizen-expedition.class';
import { Expedition } from '../../../_abstract_model/types/expedition.class';
import { ExpeditionOrder } from '../../../_abstract_model/types/expedition-order.class';
import { ExpeditionPart } from '../../../_abstract_model/types/expedition-part.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { MapRoutePoint } from '../../../_abstract_model/types/map-route.class';
import { Ruin } from '../../../_abstract_model/types/ruin.class';
import { Town } from '../../../_abstract_model/types/town.class';
import { ItemImgPipe } from '../../../_core/pipes/item-img.pipe';
import { localizedLabel } from '../../../_core/utilities/string.utils';
import { CitizenChipComponent } from '../../../_shared/citizen-chip/citizen-chip.component';
import { IconApComponent } from '../../../_shared/icon-ap/icon-ap.component';
import { IconEpComponent } from '../../../_shared/icon-ep/icon-ep.component';
import { ExpeditionOrderComponent } from '../../expeditions/expedition-order/expedition-order.component';
import { ExpeditionOrderEditorService } from '../../expeditions/expedition-orders/expedition-order-editor.service';
import { generalOrders, sortOrdersByRoute } from '../../expeditions/expedition-orders/expedition-orders.util';
import { expeditionLabel, memberLabel } from '../../expeditions/expedition-orders/order-labels';
import { spRequirementLabel } from '../../expeditions/expedition-resources.util';
import { ExpeditionRoadbookComponent } from '../../expeditions/expedition-roadbook/expedition-roadbook.component';
import { MyExpedition, MyExpeditionPart } from '../my-expeditions.util';

const imports_list: Imports = [NgTemplateOutlet, MatButtonToggleModule, CitizenChipComponent, ExpeditionOrderComponent, ExpeditionRoadbookComponent, ItemImgPipe];

/** Objet du sac prévu, dans un état (cassé ou non), et sa quantité. */
interface BagLine {
    readonly key: string;
    readonly item: Item;
    readonly broken: boolean;
    readonly count: number;
}

/** Personne placée : sa fiche si elle est connue, sinon son nom de repli. */
interface Member {
    readonly citizen: Citizen | undefined;
    readonly label: string;
}

/** Coéquipier de la vue Moi. */
interface Mate extends Member {
    readonly id: number;
}

/** Ligne de la vue équipe : la place de la première partie, la personne et son prévu de départ. */
interface TeamRow extends Member {
    readonly place: CitizenExpedition;
    readonly departure: CitizenExpedition;
    /** Consignes de ses places (sur case et générales), toutes parties. */
    readonly orders: ExpeditionOrder[];
}

/** Bloc d'une expédition où je suis placé : ce qui est prévu pour moi, ou pour toute l'équipe. */
@Component({
    selector: 'mho-program-expedition',
    templateUrl: './program-expedition.component.html',
    styleUrls: ['./program-expedition.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...imports_list, IconApComponent, IconEpComponent]
})
export class ProgramExpeditionComponent {
    public readonly expedition: InputSignal<MyExpedition> = input.required();
    public readonly map: InputSignal<Town | undefined> = input<Town | undefined>(undefined);
    public readonly ruins: InputSignal<readonly Ruin[]> = input<readonly Ruin[]>([]);
    public readonly items: InputSignal<readonly Item[]> = input<readonly Item[]>([]);
    public readonly citizens: InputSignal<readonly Citizen[]> = input<readonly Citizen[]>([]);
    public readonly expeditions: InputSignal<readonly Expedition[]> = input<readonly Expedition[]>([]);
    public readonly checkable: InputSignal<boolean> = input<boolean>(false);
    public readonly me: InputSignal<number> = input.required();
    /** Jour des actions quotidiennes affichées sur la fiche des citoyens. */
    public readonly day: InputSignal<number> = input.required();

    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    protected readonly spRequirementLabel: (place: CitizenExpedition) => string | null = spRequirementLabel;
    protected readonly view: WritableSignal<'me' | 'team'> = signal<'me' | 'team'>('me');

    private readonly editor: ExpeditionOrderEditorService = inject(ExpeditionOrderEditorService);
    private readonly locale: string = moment.locale();

    protected readonly label: Signal<string> = computed((): string => {
        const expedition: Expedition = this.expedition().expedition;
        return expeditionLabel(expedition, Math.max(0, this.expeditions().indexOf(expedition)));
    });

    /** Position de la ville : coordonnées relatives des consignes sur case. */
    protected readonly town_position: Signal<MapRoutePoint | null> = computed((): MapRoutePoint | null => {
        const map: Town | undefined = this.map();
        return map ? { x: map.town_x, y: map.town_y } : null;
    });

    protected readonly shoe_icon: Signal<string> = computed((): string => this.items().find((item: Item): boolean => item.uid === 'shoe_#00')?.img ?? '');

    /** Toutes les parties de l'expédition, dans l'ordre. */
    protected readonly all_parts: Signal<ExpeditionPart[]> = computed((): ExpeditionPart[] =>
        [...this.expedition().expedition.parts].sort((a: ExpeditionPart, b: ExpeditionPart): number => a.position - b.position)
    );

    /** Consignes générales de mes parties et de mes places. */
    protected readonly my_general_orders: Signal<ExpeditionOrder[]> = computed((): ExpeditionOrder[] =>
        this.expedition().parts.flatMap((mine: MyExpeditionPart): ExpeditionOrder[] => [...generalOrders(mine.part.orders), ...generalOrders(mine.place.orders)])
    );

    /** Coéquipiers : personnes placées sur mes parties, hors moi, une fois chacune. */
    protected readonly mates: Signal<Mate[]> = computed((): Mate[] => {
        const mates: Map<number, Mate> = new Map<number, Mate>();
        for (const mine of this.expedition().parts) {
            (mine.part.citizens ?? []).forEach((place: CitizenExpedition, index: number): void => {
                if (place.citizen_id && place.citizen_id !== this.me() && !mates.has(place.citizen_id)) {
                    mates.set(place.citizen_id, { id: place.citizen_id, ...this.memberOf(place, index) });
                }
            });
        }
        return [...mates.values()];
    });

    /** Une ligne par place de ma première partie. */
    protected readonly team_rows: Signal<TeamRow[]> = computed((): TeamRow[] =>
        (this.expedition().parts[0].part.citizens ?? []).map((place: CitizenExpedition, index: number): TeamRow => ({
            place,
            ...this.memberOf(place, index),
            departure: this.firstPlaceOf(place),
            orders: this.ordersInRouteOrder(place)
        }))
    );

    /** Consignes générales de toutes les parties (vue équipe). */
    protected readonly part_general_orders: Signal<ExpeditionOrder[]> = computed((): ExpeditionOrder[] =>
        this.all_parts().flatMap((part: ExpeditionPart): ExpeditionOrder[] => generalOrders(part.orders))
    );

    /** Sac prévu regroupé par objet et état cassé. */
    protected bagOf(place: CitizenExpedition): BagLine[] {
        const lines: Map<string, BagLine> = new Map<string, BagLine>();
        for (const item of place.bag?.items ?? []) {
            const broken: boolean = item.is_broken === true;
            const key: string = `${item.id}-${broken}`;
            lines.set(key, { key, item, broken, count: (lines.get(key)?.count ?? 0) + 1 });
        }
        return [...lines.values()];
    }

    /** Nom de l'objet dans la langue courante, sinon dans une autre. */
    protected itemLabel(item: Item): string {
        return localizedLabel(item.label, this.locale);
    }

    /** Action héroïque préinscrite de la place ; rien si la clé est inconnue. */
    protected skill(place: CitizenExpedition): HeroicActionEnum | undefined {
        return place.preinscrit_heroic_skill ? HeroicActionEnum.getByAction(place.preinscrit_heroic_skill) : undefined;
    }

    /** Métier préinscrit de la place. */
    protected job(place: CitizenExpedition): JobEnum | undefined {
        return place.preinscrit_job ? JobEnum.getByKey<JobEnum>(place.preinscrit_job) : undefined;
    }

    /** Coche ou décoche une consigne ; la liste affichée change au retour du hub. */
    protected async toggleDone(order: ExpeditionOrder, done: boolean): Promise<void> {
        await this.editor.toggleDone(order, done);
    }

    /** Fiche de la personne placée, et son nom ou son nom de repli (« Place n »). */
    private memberOf(place: CitizenExpedition, index: number): Member {
        return {
            citizen: place.citizen_id ? this.citizens().find((citizen: Citizen): boolean => citizen.id === place.citizen_id) : undefined,
            label: memberLabel(place, index, this.citizens())
        };
    }

    /** Consignes de la personne, partie après partie, chaque place rangée selon le tracé de sa partie. */
    private ordersInRouteOrder(place: CitizenExpedition): ExpeditionOrder[] {
        if (!place.citizen_id) return place.orders ?? [];
        return this.all_parts().flatMap((part: ExpeditionPart): ExpeditionOrder[] => {
            const own: CitizenExpedition | undefined = (part.citizens ?? []).find((candidate: CitizenExpedition): boolean => candidate.citizen_id === place.citizen_id);
            return own ? sortOrdersByRoute(own.orders ?? [], part.map_route?.cells ?? null) : [];
        });
    }

    /** Première place de la personne dans l'ordre des parties ; la place donnée si elle est libre. */
    private firstPlaceOf(place: CitizenExpedition): CitizenExpedition {
        return this.placesOf(place)[0];
    }

    /** Places de la personne dans l'ordre des parties ; la place donnée seule si elle est libre. */
    private placesOf(place: CitizenExpedition): CitizenExpedition[] {
        if (!place.citizen_id) return [place];
        const found: CitizenExpedition[] = [];
        for (const part of this.all_parts()) {
            const own: CitizenExpedition | undefined = (part.citizens ?? []).find((candidate: CitizenExpedition): boolean => candidate.citizen_id === place.citizen_id);
            if (own) found.push(own);
        }
        return found.length > 0 ? found : [place];
    }
}
