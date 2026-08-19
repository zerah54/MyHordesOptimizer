import { HomeEnum } from '../enum/home.enum';
import { JobEnum } from '../enum/job.enum';
import { Property } from '../enum/property.enum';
import { Bag } from '../types/bag.class';
import { Citizen } from '../types/citizen.class';
import { HomeWithValue } from '../types/home.class';
import { Item } from '../types/item.class';
import { computeReconstructedHomeDefense } from './citizen-home-defense.util';

describe('computeReconstructedHomeDefense', (): void => {
    function citizenWith(overrides: {
        house_defense?: number;
        job?: JobEnum;
        renfort_level?: number;
        has_fence?: boolean;
        chest_items?: Item[];
    }): Citizen {
        const citizen: Citizen = new Citizen();
        citizen.house_defense = overrides.house_defense;
        citizen.job = overrides.job ?? JobEnum.SCAVENGER;
        const content: HomeWithValue[] = [];
        if (overrides.renfort_level !== undefined) {
            content.push({ element: HomeEnum.HOUSE_DEFENSE, value: overrides.renfort_level });
        }
        if (overrides.has_fence !== undefined) {
            content.push({ element: HomeEnum.HAS_FENCE, value: overrides.has_fence });
        }
        (citizen as unknown as { home: { content: HomeWithValue[] } }).home = { content };
        if (overrides.chest_items) {
            const chest: Bag = new Bag();
            chest.items = overrides.chest_items;
            citizen.chest = chest;
        }
        return citizen;
    }

    function defenceItem(is_broken: boolean = false): Item {
        const item: Item = new Item();
        item.properties = [Property.DEFENCE];
        item.is_broken = is_broken;
        return item;
    }

    function soulItem(uid: string, is_broken: boolean = false): Item {
        const item: Item = new Item();
        item.uid = uid;
        item.properties = [];
        item.is_broken = is_broken;
        return item;
    }

    it('returns just baseDef when there is no chest, no renfort, non-heroic job', (): void => {
        const citizen: Citizen = citizenWith({ house_defense: 10, job: JobEnum.CITIZEN });

        expect(computeReconstructedHomeDefense(citizen)).toBe(10);
    });

    it('ignores renfort/fence for a non-heroic (basic) job even when present', (): void => {
        const citizen: Citizen = citizenWith({ house_defense: 5, job: JobEnum.CITIZEN, renfort_level: 8, has_fence: true });

        expect(computeReconstructedHomeDefense(citizen)).toBe(5);
    });

    it('applies renfort level directly up to 6 for a heroic job', (): void => {
        const citizen: Citizen = citizenWith({ house_defense: 0, job: JobEnum.SCAVENGER, renfort_level: 6 });

        // +2 bonus de métier héroïque (TownHandler::calculate_home_def), en plus du renfort.
        expect(computeReconstructedHomeDefense(citizen)).toBe(2 + 6);
    });

    it('applies the 6 + 2*(level-6) scaling above renfort level 6 for a heroic job', (): void => {
        const citizen: Citizen = citizenWith({ house_defense: 0, job: JobEnum.SCAVENGER, renfort_level: 10 });

        expect(computeReconstructedHomeDefense(citizen)).toBe(2 + 6 + 2 * (10 - 6));
    });

    it('adds 3 for the fence bonus when heroic', (): void => {
        const citizen: Citizen = citizenWith({ house_defense: 0, job: JobEnum.SCAVENGER, has_fence: true });

        expect(computeReconstructedHomeDefense(citizen)).toBe(2 + 3);
    });

    it('counts one point per non-broken defence-tagged chest item', (): void => {
        const citizen: Citizen = citizenWith({ house_defense: 0, chest_items: [defenceItem(), defenceItem(), defenceItem(true)] });

        expect(computeReconstructedHomeDefense(citizen)).toBe(2 + 2);
    });

    it('counts two points per non-broken soul item (blue/red)', (): void => {
        const citizen: Citizen = citizenWith({
            house_defense: 0,
            chest_items: [soulItem('soul_blue_#00'), soulItem('soul_blue_#01'), soulItem('soul_red_#00'), soulItem('soul_red_#00', true)]
        });

        expect(computeReconstructedHomeDefense(citizen)).toBe(2 + 2 + 2 + 2);
    });

    it('sums all known components together', (): void => {
        const citizen: Citizen = citizenWith({
            house_defense: 20,
            job: JobEnum.GUARDIAN,
            renfort_level: 6,
            has_fence: true,
            chest_items: [defenceItem(), soulItem('soul_red_#00')]
        });

        // +2 métier héroïque, +1 supplémentaire réservé au Gardien.
        expect(computeReconstructedHomeDefense(citizen)).toBe(20 + (2 + 1) + 6 + 3 + 1 + 2);
    });

    it('treats an unknown renfort level (-1) as contributing 0, not -1, for a heroic job', (): void => {
        const citizen: Citizen = citizenWith({ house_defense: 10, job: JobEnum.SCAVENGER, renfort_level: -1 });

        expect(computeReconstructedHomeDefense(citizen)).toBe(2 + 10);
    });

    it('treats a missing house_defense as 0, not NaN', (): void => {
        const citizen: Citizen = citizenWith({ job: JobEnum.CITIZEN });

        expect(computeReconstructedHomeDefense(citizen)).toBe(0);
    });
});
