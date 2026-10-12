import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import moment from 'moment';
import { firstValueFrom } from 'rxjs';

import { BURIED_RUIN_ID } from '../../../_abstract_model/const';
import { RealtimeExpeditionsService } from '../../../_abstract_model/realtime-services/realtime-expeditions.service';
import { Cell } from '../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenExpedition } from '../../../_abstract_model/types/citizen-expedition.class';
import { ExpeditionOrder } from '../../../_abstract_model/types/expedition-order.class';
import { ExpeditionPart, ExpeditionPartRoute } from '../../../_abstract_model/types/expedition-part.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { MapRoutePoint } from '../../../_abstract_model/types/map-route.class';
import { Ruin } from '../../../_abstract_model/types/ruin.class';
import { Town } from '../../../_abstract_model/types/town.class';
import { SnackbarService } from '../../../_core/services/snackbar.service';
import { MapRouteContext } from '../../map/map-routes/map-route-detail';
import {
    ExpeditionOrderFormCell,
    ExpeditionOrderFormComponent,
    ExpeditionOrderFormData,
    ExpeditionOrderFormMember,
    ExpeditionOrderFormResult
} from '../expedition-order-form/expedition-order-form.component';
import { canExcavate, cellKey, cloneOrder, ExpeditionOrderOwner, isScavengerPlace, OwnedExpeditionOrder } from './expedition-orders.util';
import { cellTitle, memberLabel } from './order-labels';

/** Ce que le formulaire d'une consigne doit savoir de la carte. */
export interface ExpeditionOrderMapContext {
    readonly map: Town | undefined;
    /** Cases de la carte par coordonnées (`cellsByCoordinates`). */
    readonly cells: ReadonlyMap<string, Cell>;
    readonly ruins: readonly Ruin[];
    readonly citizens: readonly Citizen[];
    readonly items: readonly Item[];
}

/**
 * Ajout, modification, déplacement et suppression d'une consigne par case, partagés par la feuille de route et la
 * carte : formulaire, puis enregistrement par le hub. Les consignes d'une partie ou d'un citoyen s'enregistrent
 * toujours en liste complète ; les listes affichées changent au retour du hub.
 */
@Injectable({ providedIn: 'root' })
export class ExpeditionOrderEditorService {
    private readonly dialog: MatDialog = inject(MatDialog);
    private readonly realtime_expeditions_service: RealtimeExpeditionsService = inject(RealtimeExpeditionsService);
    private readonly snackbar: SnackbarService = inject(SnackbarService);
    private readonly locale: string = moment.locale();

    /**
     * Formulaire d'une consigne sur une case d'une partie (`existing` : `null` pour en ajouter une), puis
     * enregistrement. Se termine une fois enregistré ou abandonné ; un échec est signalé à l'utilisateur.
     */
    public async edit(part: ExpeditionPart, cell: MapRoutePoint, existing: OwnedExpeditionOrder | null, context: ExpeditionOrderMapContext): Promise<void> {
        const result: ExpeditionOrderFormResult | undefined = await firstValueFrom(this.dialog
            .open<ExpeditionOrderFormComponent, ExpeditionOrderFormData, ExpeditionOrderFormResult>(ExpeditionOrderFormComponent, {
                data: this.formData(part, cell, existing, context),
                width: '640px'
            })
            .afterClosed(), { defaultValue: undefined });
        if (!result) return;
        try {
            await this.apply(part, result, existing);
        } catch {
            this.snackbar.errorSnackbar($localize`La consigne n'a pas pu être enregistrée.`);
        }
    }

    /** Coche ou décoche une consigne (sur une copie : la liste affichée change au retour du hub). */
    public async toggleDone(order: ExpeditionOrder, done: boolean): Promise<void> {
        const copy: ExpeditionOrder = cloneOrder(order);
        copy.is_done = done;
        try {
            await this.realtime_expeditions_service.updateExpeditionOrder(copy);
        } catch {
            this.snackbar.errorSnackbar($localize`La consigne n'a pas pu être cochée.`);
        }
    }

    private formData(part: ExpeditionPart, cell: MapRoutePoint, existing: OwnedExpeditionOrder | null, context: ExpeditionOrderMapContext): ExpeditionOrderFormData {
        const map_cell: Cell | undefined = context.cells.get(cellKey(cell));
        return {
            cell,
            cell_label: cellTitle(cell, context.cells, this.routeContext(context)),
            can_clear: map_cell?.ruin_id === BURIED_RUIN_ID && map_cell.nb_ruin_dig > 0,
            can_explore: !!map_cell?.ruin_id && context.ruins.some((ruin: Ruin): boolean => ruin.id === map_cell.ruin_id && ruin.explorable),
            can_excavate: canExcavate(map_cell),
            move_targets: existing ? this.moveTargets(part.map_route, cell, context) : [],
            members: this.members(part, context.citizens),
            items: context.items,
            order: existing?.order ?? null,
            owner_id: existing?.owner.kind === 'citizen' ? existing.owner.citizen.id ?? null : null
        };
    }

    /**
     * Enregistre le résultat du formulaire. Changer de destinataire retire la consigne d'une liste et l'ajoute,
     * comme nouvelle, à l'autre.
     */
    private async apply(part: ExpeditionPart, result: ExpeditionOrderFormResult, existing: OwnedExpeditionOrder | null): Promise<void> {
        if (result.action === 'delete') {
            if (existing) await this.saveOwnerOrders(existing.owner, this.ordersOf(existing.owner).filter((order: ExpeditionOrder): boolean => order.id !== existing.order.id));
            return;
        }
        const owner: ExpeditionOrderOwner | null = this.ownerOf(part, result.owner_id);
        if (!owner) return;
        if (existing && this.sameOwner(existing.owner, owner)) {
            await this.saveOwnerOrders(owner, this.ordersOf(owner).map((order: ExpeditionOrder): ExpeditionOrder => order.id === existing.order.id ? result.order : order));
            return;
        }
        if (existing) {
            await this.saveOwnerOrders(existing.owner, this.ordersOf(existing.owner).filter((order: ExpeditionOrder): boolean => order.id !== existing.order.id));
        }
        const order: ExpeditionOrder = result.order;
        order.id = undefined;
        await this.saveOwnerOrders(owner, [...this.ordersOf(owner), order]);
    }

    private async saveOwnerOrders(owner: ExpeditionOrderOwner, orders: readonly ExpeditionOrder[]): Promise<void> {
        const numbered: ExpeditionOrder[] = orders.map((order: ExpeditionOrder, position: number): ExpeditionOrder => {
            const copy: ExpeditionOrder = cloneOrder(order);
            copy.position = position;
            return copy;
        });
        if (owner.kind === 'part') {
            await this.realtime_expeditions_service.updateExpeditionPartOrders(owner.part, numbered);
        } else {
            await this.realtime_expeditions_service.updateExpeditionCitizenOrders(owner.citizen, numbered);
        }
    }

    private ordersOf(owner: ExpeditionOrderOwner): ExpeditionOrder[] {
        return owner.kind === 'part' ? [...(owner.part.orders ?? [])] : [...(owner.citizen.orders ?? [])];
    }

    private ownerOf(part: ExpeditionPart, owner_id: number | null): ExpeditionOrderOwner | null {
        if (owner_id === null) return { kind: 'part', part };
        const citizen: CitizenExpedition | undefined = part.citizens.find((candidate: CitizenExpedition): boolean => candidate.id === owner_id);
        return citizen ? { kind: 'citizen', citizen } : null;
    }

    private sameOwner(a: ExpeditionOrderOwner, b: ExpeditionOrderOwner): boolean {
        if (a.kind === 'part' && b.kind === 'part') return a.part.id === b.part.id;
        return a.kind === 'citizen' && b.kind === 'citizen' && a.citizen.id === b.citizen.id;
    }

    /** Places de la partie qui peuvent porter une consigne (enregistrées). */
    private members(part: ExpeditionPart, citizens: readonly Citizen[]): ExpeditionOrderFormMember[] {
        return part.citizens
            .map((citizen: CitizenExpedition, index: number): ExpeditionOrderFormMember | null => citizen.id === undefined ? null : {
                id: citizen.id,
                user_id: citizen.citizen_id ?? null,
                label: memberLabel(citizen, index, citizens),
                is_scavenger: isScavengerPlace(citizen, citizens)
            })
            .filter((member: ExpeditionOrderFormMember | null): member is ExpeditionOrderFormMember => member !== null);
    }

    /** Cases du tracé où déplacer une consigne, dans l'ordre du tracé, sans doublon ni la case actuelle. */
    private moveTargets(route: ExpeditionPartRoute | null, current: MapRoutePoint, context: ExpeditionOrderMapContext): ExpeditionOrderFormCell[] {
        if (!route) return [];
        const route_context: MapRouteContext = this.routeContext(context);
        const seen: Set<string> = new Set<string>([cellKey(current)]);
        const targets: ExpeditionOrderFormCell[] = [];
        route.cells.forEach((cell: MapRoutePoint, ap: number): void => {
            const key: string = cellKey(cell);
            if (seen.has(key)) return;
            seen.add(key);
            targets.push({ cell, label: `${cellTitle(cell, context.cells, route_context)} · ${$localize`${ap}:ap: PA`}` });
        });
        return targets;
    }

    private routeContext(context: ExpeditionOrderMapContext): MapRouteContext {
        return { town: context.map, ruins: context.ruins, citizens: context.citizens, locale: this.locale };
    }
}
