import { JobEnum } from '../../_abstract_model/enum/job.enum';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { CitizenExpedition } from '../../_abstract_model/types/citizen-expedition.class';
import { Expedition } from '../../_abstract_model/types/expedition.class';
import { ExpeditionOrder } from '../../_abstract_model/types/expedition-order.class';
import { ExpeditionPart } from '../../_abstract_model/types/expedition-part.class';
import { spRequirementLabel } from '../expeditions/expedition-resources.util';
import { MyExpedition, myExpeditionsOf, OpenExpedition, openExpeditionsFor } from './my-expeditions.util';

const ME: number = 7;

function order(is_done: boolean): ExpeditionOrder {
    return Object.assign(new ExpeditionOrder(), { is_done, x: null, y: null });
}

function place(extra: Partial<CitizenExpedition> = {}): CitizenExpedition {
    return Object.assign(new CitizenExpedition(), { orders: [], ...extra });
}

function part(position: number, citizens: CitizenExpedition[], orders: ExpeditionOrder[] = []): ExpeditionPart {
    return Object.assign(new ExpeditionPart(), { position, citizens, orders });
}

function expedition(parts: ExpeditionPart[], state: 'ready' | 'stop' = 'ready'): Expedition {
    return Object.assign(new Expedition(), { id: 1, state, parts });
}

function me(extra: Partial<Citizen> = {}): Citizen {
    return Object.assign(new Citizen(), { id: ME, is_dead: false, daily_actions: [] }, extra);
}

describe('my-expeditions.util', (): void => {
    describe('myExpeditionsOf', (): void => {
        it('ne renvoie rien si je ne suis placé nulle part', (): void => {
            const result: MyExpedition[] = myExpeditionsOf([expedition([part(0, [place({ citizen_id: 1 })])])], ME);
            expect(result).toEqual([]);
        });

        it('regroupe mes parties d\'une expédition, prévu de départ pris sur la partie 0', (): void => {
            const first: CitizenExpedition = place({ citizen_id: ME });
            const second: CitizenExpedition = place({ citizen_id: ME });
            const result: MyExpedition[] = myExpeditionsOf([expedition([part(1, [second]), part(0, [first])])], ME);
            expect(result.length).toBe(1);
            expect(result[0].departure).toBe(first);
            expect(result[0].parts.length).toBe(2);
        });

        it('prend la première place trouvée si je ne suis qu\'en partie 1', (): void => {
            const mine: CitizenExpedition = place({ citizen_id: ME });
            const result: MyExpedition[] = myExpeditionsOf([expedition([part(0, [place({ citizen_id: 1 })]), part(1, [mine])])], ME);
            expect(result[0].departure).toBe(mine);
        });

        it('signale une expédition en préparation', (): void => {
            const result: MyExpedition[] = myExpeditionsOf([expedition([part(0, [place({ citizen_id: ME })])], 'stop')], ME);
            expect(result[0].ready).toBe(false);
        });

        it('compte mes seules consignes, toutes parties', (): void => {
            const result: MyExpedition[] = myExpeditionsOf([expedition([
                part(0, [place({ citizen_id: ME, orders: [order(true), order(false)] }), place({ citizen_id: 1, orders: [order(true)] })], [order(true)]),
                part(1, [place({ citizen_id: ME, orders: [order(false)] })])
            ])], ME);
            expect(result[0].done).toBe(1);
            expect(result[0].total).toBe(3);
        });
    });

    describe('openExpeditionsFor', (): void => {
        it('compte une place libre une fois par rang', (): void => {
            const result: OpenExpedition[] = openExpeditionsFor(
                [expedition([part(0, [place(), place()]), part(1, [place(), place()])])], me(), 5, 5, true
            );
            expect(result.length).toBe(1);
            expect(result[0].places).toBe(2);
        });

        it('ignore les expéditions en préparation et les places que je ne peux pas prendre', (): void => {
            const stopped: Expedition = expedition([part(0, [place()])], 'stop');
            const other_job: Expedition = expedition([part(0, [place({ preinscrit_job: JobEnum.SCOUT.key })])]);
            expect(openExpeditionsFor([stopped, other_job], me(), 5, 5, true)).toEqual([]);
        });

        it('ne propose rien sans citoyen connu', (): void => {
            expect(openExpeditionsFor([expedition([part(0, [place()])])], undefined, 5, 5, true)).toEqual([]);
        });
    });

    describe('spRequirementLabel', (): void => {
        it('formate l\'exigence de PE', (): void => {
            expect(spRequirementLabel(place({ required_sp: 2, required_sp_operator: 'max' }))).toBe('≤ 2');
            expect(spRequirementLabel(place({ required_sp: 2 }))).toBe('≥ 2');
            expect(spRequirementLabel(place())).toBeNull();
        });
    });
});
