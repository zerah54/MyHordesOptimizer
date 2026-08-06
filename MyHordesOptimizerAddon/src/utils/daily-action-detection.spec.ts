import { afterEach, describe, expect, it } from 'vitest';

import { detectDailyActionDone } from './daily-action-detection';

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
