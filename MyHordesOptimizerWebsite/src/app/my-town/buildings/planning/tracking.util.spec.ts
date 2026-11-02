import { JobEnum } from '../../../_abstract_model/enum/job.enum';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { DailyAction } from '../../../_abstract_model/types/daily-action.class';
import { BuildingPlanContentDTO, emptyPlanContent } from './plan.types';
import { FAKE_CITIZENS, FAKE_HOMES, fakeFullCitizens } from './planning.store.fake';
import { filterTrackingRows, taskFilterKey, TrackingFilters, TrackingRow, trackingRows, trackingSummary, trackingTaskOptions } from './tracking.util';

const DAY: number = 10;

/**
 * Consignes : Alice deux actions (une faite), Bob une consigne libre, Chloé rien.
 * @returns {BuildingPlanContentDTO} Contenu.
 */
function content(): BuildingPlanContentDTO {
    return {
        ...emptyPlanContent(),
        citizens: [
            { userId: 1, tasks: [{ id: 'a', kind: 'action', ref: 'home_scavenge', pa: 1 }, { id: 'b', kind: 'action', ref: 'home_crows', pa: 1 }] },
            { userId: 2, tasks: [{ id: 'c', kind: 'free', label: 'Veiller', pa: 0 }] }
        ]
    };
}

/**
 * Citoyens de test, Alice ayant fait ses galeries et Bob coché sa consigne.
 * @returns {Citizen[]} Citoyens.
 */
function citizens(): Citizen[] {
    const list: Citizen[] = fakeFullCitizens();
    list[0].daily_actions = [Object.assign(new DailyAction(), { day: DAY, action_key: 'home_scavenge' })];
    list[1].daily_actions = [Object.assign(new DailyAction(), { day: DAY, action_key: 'task_c' })];
    return list;
}

const ALL: TrackingFilters = { citizen_match: (): boolean => true, task: null, state: 'all', pool: 'all' };

describe('trackingRows', (): void => {
    it('une ligne par citoyen : consignes, état et avancement', (): void => {
        const rows: TrackingRow[] = trackingRows(citizens(), FAKE_CITIZENS, content(), DAY, FAKE_HOMES);

        expect(rows.map((row: TrackingRow): string => `${row.citizen.name}:${row.state}:${row.done_count}/${row.tasks.length}`))
            .toEqual(['Alice:todo:1/2', 'Bob:done:1/1', 'Chloé:none:0/0']);
        expect(rows[0].tasks[0].label).toBe('Creuser dans les galeries');
        expect(rows[1].pool).toBe('banned');
    });
});

describe('filterTrackingRows', (): void => {
    const rows: TrackingRow[] = trackingRows(citizens(), FAKE_CITIZENS, content(), DAY, FAKE_HOMES);

    /**
     * Noms des lignes retenues.
     * @param {Partial<TrackingFilters>} filters Filtres.
     * @returns {string[]} Noms.
     */
    function names(filters: Partial<TrackingFilters>): string[] {
        return filterTrackingRows(rows, { ...ALL, ...filters }).map((row: TrackingRow): string => row.citizen.name);
    }

    it('par critère du citoyen (ici le métier)', (): void => {
        const jobs: string[] = [JobEnum.SCOUT.key, JobEnum.TECHNICIAN.key];
        expect(names({ citizen_match: (citizen: Citizen): boolean => jobs.includes(citizen.job?.key ?? '') })).toEqual(['Bob', 'Chloé']);
    });

    it('par consigne', (): void => {
        expect(names({ task: 'action:home_crows' })).toEqual(['Alice']);
        expect(names({ task: 'free' })).toEqual(['Bob']);
    });

    it('consigne choisie : l\'état porte sur cette consigne, pas sur tout le programme', (): void => {
        expect(names({ task: 'action:home_scavenge', state: 'todo' })).toEqual([]);
        expect(names({ task: 'action:home_scavenge', state: 'done' })).toEqual(['Alice']);
        expect(names({ task: 'action:home_crows', state: 'todo' })).toEqual(['Alice']);
    });

    it('compteur : selon les filtres, et sur la consigne choisie', (): void => {
        expect(trackingSummary(rows, ALL)).toEqual({ done: 1, total: 2 });
        expect(trackingSummary(rows, { ...ALL, task: 'action:home_scavenge', state: 'todo' })).toEqual({ done: 1, total: 1 });
        expect(trackingSummary(rows, { ...ALL, pool: 'regular' })).toEqual({ done: 0, total: 1 });
    });

    it('par état et par poche', (): void => {
        expect(names({ state: 'todo' })).toEqual(['Alice']);
        expect(names({ state: 'done' })).toEqual(['Bob']);
        expect(names({ state: 'none' })).toEqual(['Chloé']);
        expect(names({ pool: 'banned' })).toEqual(['Bob']);
    });
});

describe('trackingTaskOptions', (): void => {
    it('les types et actions présents dans les consignes, sans doublon', (): void => {
        const rows: TrackingRow[] = trackingRows(citizens(), FAKE_CITIZENS, content(), DAY, FAKE_HOMES);

        expect(trackingTaskOptions(rows).map((option: { key: string }): string => option.key)).toEqual(['action:home_scavenge', 'action:home_crows', 'free']);
        expect(taskFilterKey({ kind: 'home', level: 2, pa: 4 })).toBe('home');
    });
});
