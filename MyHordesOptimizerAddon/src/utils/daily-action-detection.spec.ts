import { afterEach, describe, expect, it } from 'vitest';

import { dailyActionReport, detectDailyActionDone, HOME_DAILY_ACTIONS, reportHomeDailyActions } from './daily-action-detection';

describe('detectDailyActionDone', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('returns undefined when the row is absent (building not built)', () => {
        document.body.innerHTML = '<ul class="special_actions"></ul>';

        expect(detectDailyActionDone('shower')).toBeUndefined();
    });

    it('returns true when the row is present and disabled (already done today)', () => {
        document.body.innerHTML = '<li class="heroic_action" disabled><img src="/build/images/actions/shower.gif"></li>';

        expect(detectDailyActionDone('shower')).toBe(true);
    });

    it('returns false when the row is present and not disabled (not done yet)', () => {
        document.body.innerHTML = '<li class="heroic_action"><img src="/build/images/actions/shower.gif"></li>';

        expect(detectDailyActionDone('shower')).toBe(false);
    });

    it('does not match a different icon', () => {
        document.body.innerHTML = '<li class="heroic_action" disabled><img src="/build/images/actions/pool.gif"></li>';

        expect(detectDailyActionDone('shower')).toBeUndefined();
    });
});

describe('HOME_DAILY_ACTIONS', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('associe chaque action de chantier à l\'icône de son action dans le jeu', () => {
        expect(HOME_DAILY_ACTIONS).toEqual([
            { key: 'home_pool', icon: 'pool' },
            { key: 'home_shower', icon: 'shower' },
            { key: 'home_clean', icon: 'sort' },
            { key: 'home_rest', icon: 'rest' },
            { key: 'home_defbuff', icon: 'watchmen' },
            { key: 'home_crows', icon: 'lair' },
            { key: 'home_survivalist', icon: 'survarea' },
            { key: 'home_contemplate', icon: 'home_contemplate' },
            { key: 'home_scavenge', icon: 'gallery' }
        ]);
    });

    it('détecte une action de chantier barrée sur la page maison', () => {
        document.body.innerHTML = '<ul class="prefix-home special_actions"><li class="heroic_action" disabled><img src="/build/images/actions/lair.1a2b3c.gif"><span><b>Cartographier le désert</b></span></li></ul>';

        expect(detectDailyActionDone('lair')).toBe(true);
        expect(detectDailyActionDone('home_contemplate')).toBeUndefined();
    });
});

describe('dailyActionReport', () => {
    it('envoie l\'état détecté, décochage compris, pour une action à usage unique', () => {
        expect(dailyActionReport('home_crows', true, 'vest')).toBe(true);
        expect(dailyActionReport('home_crows', false, 'vest')).toBe(false);
        expect(dailyActionReport('home_scavenge', false, 'basic')).toBe(false);
    });

    it('ne décoche jamais les galeries d\'un Fouineur', () => {
        expect(dailyActionReport('home_scavenge', false, 'dig')).toBeUndefined();
        expect(dailyActionReport('home_scavenge', true, 'dig')).toBe(true);
    });

    it('métier inconnu (jeton de repli) : les galeries ne sont jamais décochées', () => {
        expect(dailyActionReport('home_scavenge', false, undefined)).toBeUndefined();
        expect(dailyActionReport('home_scavenge', false, '')).toBeUndefined();
        expect(dailyActionReport('home_crows', false, '')).toBe(false);
    });

    it('n\'envoie rien si l\'action est absente de la page', () => {
        expect(dailyActionReport('home_pool', undefined, 'dig')).toBeUndefined();
    });
});

describe('reportHomeDailyActions', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('envoie chaque action présente, même si l\'envoi d\'une autre échoue', async () => {
        document.body.innerHTML = '<li class="heroic_action" disabled><img src="/build/images/actions/pool.gif"></li>'
            + '<li class="heroic_action"><img src="/build/images/actions/lair.gif"></li>';
        const sent: string[] = [];
        const save = (key: string, done: boolean | undefined): Promise<void> | undefined => {
            if (done === undefined) return undefined;
            sent.push(`${key}:${done}`);
            return key === 'home_pool' ? Promise.reject(new Error('500')) : Promise.resolve();
        };

        await expect(reportHomeDailyActions(save, 'vest')).resolves.toBeUndefined();
        expect(sent).toEqual(['home_pool:true', 'home_crows:false']);
    });
});
