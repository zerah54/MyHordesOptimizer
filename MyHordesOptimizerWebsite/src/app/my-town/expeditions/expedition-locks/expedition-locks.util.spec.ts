import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenExpedition } from '../../../_abstract_model/types/citizen-expedition.class';
import { Expedition } from '../../../_abstract_model/types/expedition.class';
import { ExpeditionPart } from '../../../_abstract_model/types/expedition-part.class';
import { BlockLockState, holderName, preserveHeldBlocks } from './expedition-locks.util';

function build(pdc: number, label: string): Expedition {
    const citizen: CitizenExpedition = new CitizenExpedition();
    citizen.id = 3;
    citizen.pdc = pdc;
    const part: ExpeditionPart = new ExpeditionPart();
    part.id = 2;
    part.citizens = [citizen];
    const expedition: Expedition = new Expedition();
    expedition.id = 1;
    expedition.label = label;
    expedition.min_pdc = 0;
    expedition.parts = [part];
    return expedition;
}

describe('preserveHeldBlocks', () => {
    it('garde le pdc local d\'un citoyen détenu', () => {
        const result: Expedition = preserveHeldBlocks(build(1, 'in'), build(9, 'cur'), new Set<string>(['citizen:3']));
        expect(result.parts[0].citizens[0].pdc).toBe(9);
        expect(result.label).toBe('in');
    });

    it('prend le pdc entrant d\'un citoyen non détenu', () => {
        const result: Expedition = preserveHeldBlocks(build(1, 'in'), build(9, 'cur'), new Set<string>(['expedition:1']));
        expect(result.parts[0].citizens[0].pdc).toBe(1);
        expect(result.label).toBe('cur');
    });

    it('renvoie l\'objet entrant sans clé détenue', () => {
        const incoming: Expedition = build(1, 'in');
        expect(preserveHeldBlocks(incoming, build(9, 'cur'), new Set<string>())).toBe(incoming);
        expect(preserveHeldBlocks(incoming, undefined, new Set<string>(['citizen:3']))).toBe(incoming);
    });
});

describe('holderName', () => {
    it('renvoie le nom du citoyen détenteur', () => {
        const citizen: Citizen = new Citizen();
        citizen.id = 9;
        citizen.name = 'Bob';
        const other: BlockLockState = { kind: 'other', user_id: 9, same_user: false };
        expect(holderName(other, [citizen])).toBe('Bob');
        expect(holderName({ kind: 'free' }, [citizen])).toBeNull();
        expect(holderName({ kind: 'other', user_id: 1, same_user: false }, [citizen])).toBeNull();
    });
});
