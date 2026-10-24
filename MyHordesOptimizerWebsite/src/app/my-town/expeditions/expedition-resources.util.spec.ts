import { DailyActionEnum } from '../../_abstract_model/enum/daily-action.enum';
import { JobEnum } from '../../_abstract_model/enum/job.enum';
import { SpRequirementOperator } from '../../_abstract_model/types/_types';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { CitizenExpedition } from '../../_abstract_model/types/citizen-expedition.class';
import { DailyAction } from '../../_abstract_model/types/daily-action.class';
import { MapRoutePoint } from '../../_abstract_model/types/map-route.class';
import { ApCheck, apCheck, ApLeg, ApResources, meetsRequirements, scoutsLairBuilt, startingSp } from './expedition-resources.util';

function citizenWith(extra: Partial<Citizen>, ...actions: [day: number, key: string][]): Citizen {
    const daily_actions: DailyAction[] = actions.map(
        ([day, key]: [number, string]): DailyAction => Object.assign(new DailyAction(), { day, action_key: key })
    );
    return Object.assign(new Citizen(), { is_dead: false, daily_actions }, extra);
}

describe('expedition-resources.util', (): void => {
    describe('scoutsLairBuilt', (): void => {
        it('knows the Scouts Lair only once it is listed as built', (): void => {
            expect(scoutsLairBuilt(new Set<string>(['small_watchmen_#01']))).toBe(true);
            expect(scoutsLairBuilt(new Set<string>(['small_watchmen_#00']))).toBe(false);
        });

        it('assumes nothing is built while the buildings are unknown', (): void => {
            expect(scoutsLairBuilt(null)).toBe(false);
        });
    });

    describe('startingSp', (): void => {
        const crows: [number, string] = [4, DailyActionEnum.HOME_CROWS.key];

        it('gives nothing to a citizen without scout job, shoes or mapping', (): void => {
            expect(startingSp(citizenWith({}), 5, 5, true)).toBe(0);
        });

        it('gives 2 to a scout', (): void => {
            expect(startingSp(citizenWith({ job: JobEnum.SCOUT }), 5, 5, true)).toBe(2);
        });

        it('gives 1 for equipped shoes', (): void => {
            expect(startingSp(citizenWith({ shoes_equipped: true }), 5, 5, true)).toBe(1);
        });

        it('gives 2 for a mapping done the day before the expedition', (): void => {
            expect(startingSp(citizenWith({}, crows), 5, 5, true)).toBe(2);
        });

        it('gives 4 for the mapping of a scout, on top of the 2 of the job', (): void => {
            expect(startingSp(citizenWith({ job: JobEnum.SCOUT }, crows), 5, 5, true)).toBe(6);
        });

        it('counts a mapping recorded the day before, whether the Scouts Lair is known as built or not', (): void => {
            expect(startingSp(citizenWith({}, crows), 5, 5, false)).toBe(2);
            expect(startingSp(citizenWith({}, [5, DailyActionEnum.HOME_CROWS.key]), 6, 5, false)).toBe(2);
            expect(startingSp(citizenWith({}, [5, DailyActionEnum.HOME_CROWS.key]), 6, 5, true)).toBe(2);
        });

        it('ignores a mapping done two days before', (): void => {
            expect(startingSp(citizenWith({}, [3, DailyActionEnum.HOME_CROWS.key]), 5, 5, true)).toBe(0);
        });

        it('ignores another daily action done the day before', (): void => {
            expect(startingSp(citizenWith({}, [4, DailyActionEnum.HOME_REST.key]), 5, 5, true)).toBe(0);
        });

        it('assumes the mapping is done for a future expedition when the Scouts Lair is built', (): void => {
            expect(startingSp(citizenWith({}), 6, 5, true)).toBe(2);
            expect(startingSp(citizenWith({ job: JobEnum.SCOUT }), 6, 5, true)).toBe(6);
        });

        it('does not assume the mapping for a future expedition without the Scouts Lair', (): void => {
            expect(startingSp(citizenWith({}), 6, 5, false)).toBe(0);
            expect(startingSp(citizenWith({ job: JobEnum.SCOUT }), 6, 5, false)).toBe(2);
        });

        it('does not assume the mapping for an expedition of the current day, nor count one done on that very day', (): void => {
            expect(startingSp(citizenWith({}), 5, 5, true)).toBe(0);
            expect(startingSp(citizenWith({}, [5, DailyActionEnum.HOME_CROWS.key]), 5, 5, true)).toBe(0);
        });
    });

    describe('meetsRequirements', (): void => {
        function place(extra: Partial<CitizenExpedition>): CitizenExpedition {
            return Object.assign(new CitizenExpedition(), extra);
        }

        function meets(citizen: Citizen, extra: Partial<CitizenExpedition>): boolean {
            return meetsRequirements(citizen, place(extra), 5, 5, true);
        }

        it('lets any living citizen in a place without requirement', (): void => {
            expect(meets(citizenWith({}), {})).toBe(true);
        });

        it('refuses a dead citizen', (): void => {
            expect(meets(citizenWith({ is_dead: true }), {})).toBe(false);
        });

        it('requires at least the SP by default, and for the min operator', (): void => {
            const three_sp: Citizen = citizenWith({ shoes_equipped: true }, [4, DailyActionEnum.HOME_CROWS.key]);
            const two_sp: Citizen = citizenWith({}, [4, DailyActionEnum.HOME_CROWS.key]);
            const one_sp: Citizen = citizenWith({ shoes_equipped: true });
            expect(meets(two_sp, { required_sp: 2, required_sp_operator: 'min' })).toBe(true);
            expect(meets(three_sp, { required_sp: 2, required_sp_operator: 'min' })).toBe(true);
            expect(meets(one_sp, { required_sp: 2, required_sp_operator: 'min' })).toBe(false);
            expect(meets(two_sp, { required_sp: 2 })).toBe(true);
            expect(meets(three_sp, { required_sp: 2 })).toBe(true);
            expect(meets(one_sp, { required_sp: 2 })).toBe(false);
        });

        it('treats an unexpected operator as min', (): void => {
            const weird: SpRequirementOperator = <SpRequirementOperator><unknown>'weird';
            const three_sp: Citizen = citizenWith({ shoes_equipped: true }, [4, DailyActionEnum.HOME_CROWS.key]);
            const one_sp: Citizen = citizenWith({ shoes_equipped: true });
            expect(meets(one_sp, { required_sp: 2, required_sp_operator: weird })).toBe(false);
            expect(meets(one_sp, { required_sp: 1, required_sp_operator: weird })).toBe(true);
            expect(meets(three_sp, { required_sp: 2, required_sp_operator: weird })).toBe(true);
        });

        it('caps the SP with the max operator', (): void => {
            const three_sp: Citizen = citizenWith({ shoes_equipped: true }, [4, DailyActionEnum.HOME_CROWS.key]);
            const two_sp: Citizen = citizenWith({}, [4, DailyActionEnum.HOME_CROWS.key]);
            expect(meets(three_sp, { required_sp: 2, required_sp_operator: 'max' })).toBe(false);
            expect(meets(two_sp, { required_sp: 2, required_sp_operator: 'max' })).toBe(true);
        });

        it('requires exactly the SP with the exact operator', (): void => {
            const three_sp: Citizen = citizenWith({ shoes_equipped: true }, [4, DailyActionEnum.HOME_CROWS.key]);
            const two_sp: Citizen = citizenWith({}, [4, DailyActionEnum.HOME_CROWS.key]);
            const one_sp: Citizen = citizenWith({ shoes_equipped: true });
            expect(meets(two_sp, { required_sp: 2, required_sp_operator: 'exact' })).toBe(true);
            expect(meets(three_sp, { required_sp: 2, required_sp_operator: 'exact' })).toBe(false);
            expect(meets(one_sp, { required_sp: 2, required_sp_operator: 'exact' })).toBe(false);
        });

        it('requires equipped shoes when requires_shoes is true', (): void => {
            expect(meets(citizenWith({ shoes_equipped: true }), { requires_shoes: true })).toBe(true);
            expect(meets(citizenWith({ shoes_equipped: false }), { requires_shoes: true })).toBe(false);
        });

        it('forbids equipped shoes when requires_shoes is false', (): void => {
            expect(meets(citizenWith({ shoes_equipped: true }), { requires_shoes: false })).toBe(false);
            expect(meets(citizenWith({ shoes_equipped: false }), { requires_shoes: false })).toBe(true);
        });

        it('is indifferent to shoes when requires_shoes is not set', (): void => {
            expect(meets(citizenWith({ shoes_equipped: true }), {})).toBe(true);
            expect(meets(citizenWith({ shoes_equipped: false }), {})).toBe(true);
        });

        it('grants the assumed mapping of a future expedition only when the Scouts Lair is built', (): void => {
            expect(meetsRequirements(citizenWith({}), place({ required_sp: 2 }), 6, 5, true)).toBe(true);
            expect(meetsRequirements(citizenWith({}), place({ required_sp: 2 }), 6, 5, false)).toBe(false);
        });

        it('refuses a citizen whose job differs from the pre-registered one', (): void => {
            expect(meets(citizenWith({ job: JobEnum.SCAVENGER }), { preinscrit_job: JobEnum.SCAVENGER.key })).toBe(true);
            expect(meets(citizenWith({ job: JobEnum.GUARDIAN }), { preinscrit_job: JobEnum.SCAVENGER.key })).toBe(false);
            expect(meets(citizenWith({}), { preinscrit_job: JobEnum.SCAVENGER.key })).toBe(false);
        });
    });

    describe('apCheck', (): void => {
        const town: MapRoutePoint = { x: 10, y: 10 };
        const round_trip: readonly MapRoutePoint[] = [
            { x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }, { x: 10, y: 13 }, { x: 10, y: 12 }, { x: 10, y: 11 }, { x: 10, y: 10 }
        ];

        function resources(sp: number, base_ap: number = 6, bag_ap: number = 0): ApResources {
            return { base_ap, bag_ap, sp };
        }

        it('pays in SP only the steps leaving a cell 3 km or more from the town', (): void => {
            const leg: ApLeg = { route: round_trip, ruin_visits: 0 };
            expect(apCheck([leg], resources(0), town).needed).toBe(6);
            expect(apCheck([leg], resources(1), town).needed).toBe(5);
        });

        it('caps the SP used to the number of steps leaving a cell 3 km or more away', (): void => {
            expect(apCheck([{ route: round_trip, ruin_visits: 0 }], resources(3), town).needed).toBe(5);
        });

        it('measures the distance in km with rounding, diagonals included', (): void => {
            const diagonal: ApLeg = { route: [{ x: 12, y: 12 }, { x: 12, y: 13 }], ruin_visits: 0 };
            const near: ApLeg = { route: [{ x: 12, y: 11 }, { x: 13, y: 11 }], ruin_visits: 0 };
            expect(apCheck([diagonal], resources(0), town).needed).toBe(1);
            expect(apCheck([diagonal], resources(1), town).needed).toBe(0);
            expect(apCheck([near], resources(0), town).needed).toBe(1);
            expect(apCheck([near], resources(1), town).needed).toBe(1);
        });

        it('adds the ruin visits to the needed AP', (): void => {
            expect(apCheck([{ route: round_trip, ruin_visits: 2 }], resources(1), town).needed).toBe(7);
        });

        it('adds the AP and ruin visits of several legs and shares the SP between them', (): void => {
            const legs: ApLeg[] = [
                { route: round_trip, ruin_visits: 1 },
                { route: round_trip, ruin_visits: 1 }
            ];
            expect(apCheck(legs, resources(0), town).needed).toBe(14);
            expect(apCheck(legs, resources(1), town).needed).toBe(13);
            expect(apCheck(legs, resources(2), town).needed).toBe(12);
            expect(apCheck(legs, resources(5), town).needed).toBe(12);
        });

        it('needs nothing without route nor ruin visit', (): void => {
            expect(apCheck([], resources(0), town).needed).toBe(0);
            expect(apCheck([{ route: [{ x: 10, y: 13 }], ruin_visits: 0 }], resources(0), town).needed).toBe(0);
        });

        it('sums the base AP and the AP of the bag as available', (): void => {
            expect(apCheck([], resources(0, 6, 4), town).available).toBe(10);
        });

        it('is short exactly when the available AP are below the needed AP', (): void => {
            const leg: ApLeg = { route: round_trip, ruin_visits: 0 };
            const exact: ApCheck = apCheck([leg], resources(0, 6, 0), town);
            const below: ApCheck = apCheck([leg], resources(0, 5, 0), town);
            const above: ApCheck = apCheck([leg], resources(0, 5, 2), town);
            expect(exact).toEqual({ needed: 6, available: 6, short: false });
            expect(below).toEqual({ needed: 6, available: 5, short: true });
            expect(above).toEqual({ needed: 6, available: 7, short: false });
        });
    });
});
