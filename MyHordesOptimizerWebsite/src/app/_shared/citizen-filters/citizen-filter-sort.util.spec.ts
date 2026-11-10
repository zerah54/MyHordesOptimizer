import { DailyActionEnum } from '../../_abstract_model/enum/daily-action.enum';
import { HomeEnum } from '../../_abstract_model/enum/home.enum';
import { JobEnum } from '../../_abstract_model/enum/job.enum';
import { StatusEnum } from '../../_abstract_model/enum/status.enum';
import { Bag } from '../../_abstract_model/types/bag.class';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { DailyAction } from '../../_abstract_model/types/daily-action.class';
import { HERO_SKILL_LETTERS } from '../../_abstract_model/types/hero-skill-levels';
import { Home } from '../../_abstract_model/types/home.class';
import { Item } from '../../_abstract_model/types/item.class';
import { Status } from '../../_abstract_model/types/status.class';
import { UpdateInfo } from '../../_abstract_model/types/update-info.class';
import {
    activeCitizenFilterCount,
    CitizenFilterCriteria,
    citizenSortFields,
    citizenSortValue,
    citizenValueOptions,
    emptyCitizenFilter,
    HOUSE_DEFENSE_ID,
    matchesCitizenFilter,
    sortByCitizen
} from './citizen-filter-sort.util';

const DAY: number = 5;

/**
 * Citoyen de test.
 * @param {number} id Identifiant.
 * @param {string} name Pseudo.
 * @param {JobEnum} job Métier.
 * @param {number} house_level Niveau d'habitation.
 * @param {number} base_defense Défense de base de la maison.
 * @returns {Citizen} Citoyen.
 */
function citizen(id: number, name: string, job: JobEnum, house_level: number, base_defense: number): Citizen {
    return Object.assign(new Citizen(), {
        id,
        name,
        job,
        house_defense: base_defense,
        daily_actions: [] as DailyAction[],
        home: Object.assign(new Home(), { content: [{ element: HomeEnum.HOUSE_LEVEL, value: house_level }, { element: HomeEnum.HAS_ALARM, value: false }] })
    });
}

describe('citizen-filter-sort.util', (): void => {
    const alice: Citizen = citizen(1, 'Alice', JobEnum.SCAVENGER, 0, 0);
    const bob: Citizen = citizen(2, 'bob', JobEnum.CITIZEN, 2, 3);
    const chloe: Citizen = citizen(3, 'Chloé', JobEnum.GUARDIAN, 1, 1);

    beforeAll((): void => {
        const pool: DailyAction = Object.assign(new DailyAction(), { day: DAY, action_key: 'home_pool', update_info: new UpdateInfo() });
        bob.daily_actions = [pool];
        bob.bag = Object.assign(new Bag(), { items: [Object.assign(new Item(), { id: 42 })] });
        chloe.status = Object.assign(new Status(), { icons: [StatusEnum.getAllValues<StatusEnum>()[0]] });
    });

    function shown(criteria: Partial<CitizenFilterCriteria>): number[] {
        return [alice, bob, chloe].filter((candidate: Citizen): boolean => matchesCitizenFilter(candidate, { ...emptyCitizenFilter(), ...criteria }, DAY))
            .map((candidate: Citizen): number => candidate.id);
    }

    it('sans critère, personne n\'est écarté', (): void => {
        expect(shown({})).toEqual([1, 2, 3]);
    });

    it('filtre par nom, métier, sac et état', (): void => {
        expect(shown({ names: [1, 3] })).toEqual([1, 3]);
        expect(shown({ jobs: [JobEnum.GUARDIAN.key] })).toEqual([3]);
        expect(shown({ bag_ids: [42] })).toEqual([2]);
        expect(shown({ status_keys: [StatusEnum.getAllValues<StatusEnum>()[0].key] })).toEqual([3]);
    });

    it('filtre par niveau de maison (« en tente », « taudis »…)', (): void => {
        expect(shown({ values: { ['home_' + HomeEnum.HOUSE_LEVEL.key]: [0] } })).toEqual([1]);
        expect(shown({ values: { ['home_' + HomeEnum.HOUSE_LEVEL.key]: [0, 1] } })).toEqual([1, 3]);
    });

    it('filtre oui / non sur une action quotidienne du jour et une amélioration', (): void => {
        expect(shown({ bools: { daily_home_pool: true } })).toEqual([2]);
        expect(shown({ bools: { daily_home_pool: false } })).toEqual([1, 3]);
        expect(shown({ bools: { ['home_' + HomeEnum.HAS_ALARM.key]: false } })).toEqual([1, 2, 3]);
    });

    it('compte les critères actifs', (): void => {
        expect(activeCitizenFilterCount(emptyCitizenFilter())).toBe(0);
        expect(activeCitizenFilterCount({ ...emptyCitizenFilter(), names: [1], bools: { immune: true }, values: { a: [1], b: [] } })).toBe(3);
    });

    it('options de valeurs : seulement celles présentes chez les citoyens', (): void => {
        expect(citizenValueOptions([alice, bob, chloe])['home_' + HomeEnum.HOUSE_LEVEL.key]).toEqual([0, 1, 2]);
    });

    it('tri par défense de la maison : base, métier héroïque et améliorations', (): void => {
        expect(citizenSortValue(alice, HOUSE_DEFENSE_ID, DAY)).toBe(2);
        expect(citizenSortValue(bob, HOUSE_DEFENSE_ID, DAY)).toBe(3);
        expect(citizenSortValue(chloe, HOUSE_DEFENSE_ID, DAY)).toBe(4);
        expect(citizenSortFields([DailyActionEnum.HOME_POOL], HERO_SKILL_LETTERS).map((field: { id: string }): string => field.id)).toContain(HOUSE_DEFENSE_ID);
    });

    it('sortByCitizen : croissant, décroissant, sans tri et tri stable', (): void => {
        const names = (list: Citizen[]): string[] => list.map((entry: Citizen): string => entry.name);
        const identity = (entry: Citizen): Citizen => entry;

        expect(names(sortByCitizen([alice, bob, chloe], identity, 'avatar_name', 'asc', DAY))).toEqual(['Alice', 'bob', 'Chloé']);
        expect(names(sortByCitizen([alice, bob, chloe], identity, HOUSE_DEFENSE_ID, 'desc', DAY))).toEqual(['Chloé', 'bob', 'Alice']);
        expect(names(sortByCitizen([chloe, alice, bob], identity, '', '', DAY))).toEqual(['Chloé', 'Alice', 'bob']);
        expect(names(sortByCitizen([chloe, alice, bob], identity, 'daily_home_pool', 'asc', DAY))).toEqual(['Chloé', 'Alice', 'bob']);
    });
});
