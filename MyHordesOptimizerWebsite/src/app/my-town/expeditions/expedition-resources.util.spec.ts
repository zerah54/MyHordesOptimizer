import { JobEnum } from '../../_abstract_model/enum/job.enum';
import { SpRequirementOperator } from '../../_abstract_model/types/_types';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { CitizenExpedition } from '../../_abstract_model/types/citizen-expedition.class';
import { MapRoutePoint } from '../../_abstract_model/types/map-route.class';
import { ApCheck, apCheck, ApLeg, ApResources, meetsRequirements, startingSp } from './expedition-resources.util';

function citizenWith(extra: Partial<Citizen>): Citizen {
    return Object.assign(new Citizen(), { is_dead: false }, extra);
}

describe('expedition-resources.util', (): void => {
    describe('startingSp', (): void => {
        it('gives nothing to a citizen without scout job nor shoes', (): void => {
            expect(startingSp(citizenWith({}))).toBe(0);
        });

        it('gives 2 to a scout', (): void => {
            expect(startingSp(citizenWith({ job: JobEnum.SCOUT }))).toBe(2);
        });

        it('gives 1 for equipped shoes', (): void => {
            expect(startingSp(citizenWith({ shoes_equipped: true }))).toBe(1);
        });
    });

    describe('meetsRequirements', (): void => {
        function place(extra: Partial<CitizenExpedition>): CitizenExpedition {
            return Object.assign(new CitizenExpedition(), extra);
        }

        function meets(citizen: Citizen, extra: Partial<CitizenExpedition>): boolean {
            return meetsRequirements(citizen, place(extra));
        }

        it('lets any living citizen in a place without requirement', (): void => {
            expect(meets(citizenWith({}), {})).toBe(true);
        });

        it('refuses a dead citizen', (): void => {
            expect(meets(citizenWith({ is_dead: true }), {})).toBe(false);
        });

        it('requires at least the SP by default, and for the min operator', (): void => {
            const three_sp: Citizen = citizenWith({ job: JobEnum.SCOUT, shoes_equipped: true });
            const two_sp: Citizen = citizenWith({ job: JobEnum.SCOUT });
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
            const three_sp: Citizen = citizenWith({ job: JobEnum.SCOUT, shoes_equipped: true });
            const one_sp: Citizen = citizenWith({ shoes_equipped: true });
            expect(meets(one_sp, { required_sp: 2, required_sp_operator: weird })).toBe(false);
            expect(meets(one_sp, { required_sp: 1, required_sp_operator: weird })).toBe(true);
            expect(meets(three_sp, { required_sp: 2, required_sp_operator: weird })).toBe(true);
        });

        it('caps the SP with the max operator', (): void => {
            const three_sp: Citizen = citizenWith({ job: JobEnum.SCOUT, shoes_equipped: true });
            const two_sp: Citizen = citizenWith({ job: JobEnum.SCOUT });
            expect(meets(three_sp, { required_sp: 2, required_sp_operator: 'max' })).toBe(false);
            expect(meets(two_sp, { required_sp: 2, required_sp_operator: 'max' })).toBe(true);
        });

        it('requires exactly the SP with the exact operator', (): void => {
            const three_sp: Citizen = citizenWith({ job: JobEnum.SCOUT, shoes_equipped: true });
            const two_sp: Citizen = citizenWith({ job: JobEnum.SCOUT });
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
