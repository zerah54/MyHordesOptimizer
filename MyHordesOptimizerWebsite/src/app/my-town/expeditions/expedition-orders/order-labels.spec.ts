import moment from 'moment';

import { BURIED_RUIN_ID, HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { JobEnum } from '../../../_abstract_model/enum/job.enum';
import { Cell } from '../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenExpedition } from '../../../_abstract_model/types/citizen-expedition.class';
import { Expedition } from '../../../_abstract_model/types/expedition.class';
import { ExpeditionOrder } from '../../../_abstract_model/types/expedition-order.class';
import { ExpeditionPart } from '../../../_abstract_model/types/expedition-part.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { Town } from '../../../_abstract_model/types/town.class';
import { cellPlaceLabel, cellTitle, describeOrder, memberLabel, orderCountLabel, partLabel, plainText } from './order-labels';

describe('order-labels', (): void => {
    it('describes a typed order with its verb and parameters', (): void => {
        const plank: Item = Object.assign(new Item(), { id: 7, img: 'plank.gif', label: { [moment.locale()]: 'Planche' } });
        const order: ExpeditionOrder = new ExpeditionOrder({ type: 'checkbox', text: '', isDone: false, position: 0, kind: 'drop', itemId: 7, quantity: 3 });

        expect(describeOrder(order, [plank], [], moment.locale())).toEqual(expect.objectContaining({
            verb: 'Déposer', rest: '×3 Planche', text: 'Déposer ×3 Planche', html: null, icon: null
        }));
    });

    it('describes excavating with the scavenger image and no parameter', (): void => {
        const order: ExpeditionOrder = new ExpeditionOrder({ type: 'checkbox', text: '', isDone: false, position: 0, kind: 'excavate' });

        expect(describeOrder(order, [], [], moment.locale())).toEqual(expect.objectContaining({
            verb: 'Excaver la zone', rest: '', text: 'Excaver la zone', html: null, img: HORDES_IMG_REPO + JobEnum.SCAVENGER.value.img, icon: null
        }));
    });

    it('describes a free text order as plain text', (): void => {
        const order: ExpeditionOrder = new ExpeditionOrder({ type: 'text', text: '<p>Rentrer <b>tôt</b></p>', isDone: false, position: 0 });

        expect(describeOrder(order, [], [], 'fr')).toEqual(expect.objectContaining({ verb: null, html: '<p>Rentrer <b>tôt</b></p>', text: 'Rentrer tôt' }));
        expect(plainText(null)).toBe('');
    });

    it('names a place by its citizen, else by its rank and job', (): void => {
        const citizens: Citizen[] = [Object.assign(new Citizen(), { id: 7, name: 'Zerah' })];

        expect(memberLabel(Object.assign(new CitizenExpedition(), { citizen_id: 7 }), 0, citizens)).toBe('Zerah');
        expect(memberLabel(new CitizenExpedition(), 2, citizens)).toBe('Place 3');
    });

    it('names a part by its expedition, its route and its rank among several', (): void => {
        const first: ExpeditionPart = Object.assign(new ExpeditionPart(), { id: 1 });
        const second: ExpeditionPart = Object.assign(new ExpeditionPart(), {
            id: 2, map_route: { id: 5, label: 'Nord', color: 'blue', cells: [], length: 0, version: 0 }
        });
        const single: Expedition = Object.assign(new Expedition(), { label: ' ', parts: [first] });
        const double: Expedition = Object.assign(new Expedition(), { label: 'Expé 1', parts: [first, second] });

        expect(partLabel(single, first)).toBe('Expédition');
        expect(partLabel(double, second)).toBe('Expé 1 · partie 2');
        expect(partLabel(double, second, true)).toBe('Expé 1 « Nord » · partie 2');
    });

    it('names the place of a cell', (): void => {
        const town: Town = Object.assign(new Town(), { town_x: 5, town_y: 5, cells: [] });
        const buried: Cell = Object.assign(new Cell(), { x: 6, y: 5, ruin_id: BURIED_RUIN_ID });
        const desert: Cell = Object.assign(new Cell(), { x: 5, y: 4, ruin_id: 0 });
        const cells: Map<string, Cell> = new Map<string, Cell>([['6,5', buried], ['5,4', desert]]);
        const context: { town: Town; ruins: []; citizens: []; locale: string } = { town, ruins: [], citizens: [], locale: 'fr' };

        expect(cellTitle({ x: 6, y: 5 }, cells, context)).toBe('[1 ; 0] · Bâtiment enseveli');
        expect(cellTitle({ x: 5, y: 4 }, cells, context)).toBe('[0 ; 1] · Désert');
        expect(cellTitle({ x: 9, y: 9 }, cells, context)).toBe('[4 ; -4]');
        expect(cellPlaceLabel({ x: 6, y: 5 }, { coordinates: '', place: 'Hôpital' }, cells)).toBe('Hôpital');
    });

    it('counts orders and cells', (): void => {
        expect(orderCountLabel(0, 0)).toBe('aucune consigne sur une case');
        expect(orderCountLabel(3, 2)).toBe('3 consigne(s) sur 2 case(s)');
    });
});
