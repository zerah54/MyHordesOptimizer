import { DailyAction } from '../../_abstract_model/types/daily-action.class';
import { UpdateInfo } from '../../_abstract_model/types/update-info.class';
import { DailyActionForDayPipe } from './daily-action-for-day.pipe';

describe('DailyActionForDayPipe', (): void => {
    let pipe: DailyActionForDayPipe;

    beforeEach((): void => {
        pipe = new DailyActionForDayPipe();
    });

    it('returns undefined when the list is empty', (): void => {
        expect(pipe.transform([], 5, 'home_shower')).toBeUndefined();
    });

    it('returns the matching action for the given day and key', (): void => {
        const shower: DailyAction = new DailyAction();
        shower.day = 5;
        shower.action_key = 'home_shower';
        shower.update_info = new UpdateInfo();
        const pool: DailyAction = new DailyAction();
        pool.day = 5;
        pool.action_key = 'home_pool';
        pool.update_info = new UpdateInfo();

        expect(pipe.transform([shower, pool], 5, 'home_shower')).toBe(shower);
    });

    it('returns undefined when the day matches but the key does not', (): void => {
        const pool: DailyAction = new DailyAction();
        pool.day = 5;
        pool.action_key = 'home_pool';
        pool.update_info = new UpdateInfo();

        expect(pipe.transform([pool], 5, 'home_shower')).toBeUndefined();
    });
});
