import { JobEnum } from '../../../_abstract_model/enum/job.enum';
import { Cell } from '../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenExpedition } from '../../../_abstract_model/types/citizen-expedition.class';
import { ExpeditionOrder } from '../../../_abstract_model/types/expedition-order.class';
import { ExpeditionPart } from '../../../_abstract_model/types/expedition-part.class';
import { canExcavate, cellOrdersOf, generalOrders, isScavengerPlace, OwnedExpeditionOrder, withCellOrders } from './expedition-orders.util';

function order(text: string, position: number, cell?: [number, number]): ExpeditionOrder {
    return new ExpeditionOrder({ id: position + 1, type: 'text', text, isDone: false, position, x: cell?.[0] ?? null, y: cell?.[1] ?? null });
}

describe('expedition-orders.util', (): void => {
    it('reads the cell of an order only when both coordinates are set', (): void => {
        expect(order('a', 0, [3, 4]).hasCell()).toBe(true);
        expect(new ExpeditionOrder({ type: 'text', text: '', isDone: false, position: 0, x: 3 }).hasCell()).toBe(false);
    });

    it('collects the cell orders of the part and of its citizens', (): void => {
        const part: ExpeditionPart = new ExpeditionPart();
        part.orders = [order('général', 0), order('case', 1, [3, 4])];
        const citizen: CitizenExpedition = new CitizenExpedition();
        citizen.orders = [order('perso', 0, [5, 6])];
        part.citizens = [citizen];

        const owned: OwnedExpeditionOrder[] = cellOrdersOf(part);

        expect(owned.map((item: OwnedExpeditionOrder): string => `${item.order.text}:${item.owner.kind}`)).toEqual(['case:part', 'perso:citizen']);
    });

    it('keeps the cell orders after the general ones, renumbered, without touching the originals', (): void => {
        const all: ExpeditionOrder[] = [order('case', 0, [3, 4]), order('ancien', 1)];
        const edited: ExpeditionOrder[] = [order('nouveau', 0)];

        const saved: ExpeditionOrder[] = withCellOrders(edited, all);

        expect(generalOrders(all).map((item: ExpeditionOrder): string => item.text)).toEqual(['ancien']);
        expect(saved.map((item: ExpeditionOrder): string => `${item.text}@${item.position}`)).toEqual(['nouveau@0', 'case@1']);
        expect(saved[1].x).toBe(3);
        expect(all[0].position).toBe(0);
    });

    describe('isScavengerPlace', (): void => {
        const citizens: Citizen[] = [
            Object.assign(new Citizen(), { id: 1, job: JobEnum.SCAVENGER }),
            Object.assign(new Citizen(), { id: 2, job: JobEnum.GUARDIAN }),
            Object.assign(new Citizen(), { id: 3 })
        ];

        function place(extra: Partial<CitizenExpedition>): CitizenExpedition {
            return Object.assign(new CitizenExpedition(), extra);
        }

        it('follows the job of the citizen placed', (): void => {
            expect(isScavengerPlace(place({ citizen_id: 1 }), citizens)).toBe(true);
            expect(isScavengerPlace(place({ citizen_id: 2 }), citizens)).toBe(false);
        });

        it('lets the job of the citizen win over the pre-registered one', (): void => {
            expect(isScavengerPlace(place({ citizen_id: 2, preinscrit_job: JobEnum.SCAVENGER.key }), citizens)).toBe(false);
        });

        it('falls back to the pre-registered job when the citizen job is unknown or nobody is placed', (): void => {
            expect(isScavengerPlace(place({ citizen_id: 3, preinscrit_job: JobEnum.SCAVENGER.key }), citizens)).toBe(true);
            expect(isScavengerPlace(place({ preinscrit_job: JobEnum.SCAVENGER.key }), citizens)).toBe(true);
            expect(isScavengerPlace(place({ preinscrit_job: JobEnum.GUARDIAN.key }), citizens)).toBe(false);
            expect(isScavengerPlace(place({}), citizens)).toBe(false);
        });
    });

    describe('canExcavate', (): void => {
        it('refuses only a cell known as already excavated', (): void => {
            expect(canExcavate(Object.assign(new Cell(), { is_excavated: true }))).toBe(false);
            expect(canExcavate(Object.assign(new Cell(), { is_excavated: false }))).toBe(true);
            expect(canExcavate(Object.assign(new Cell(), { is_excavated: null }))).toBe(true);
            expect(canExcavate(undefined)).toBe(true);
        });
    });
});
