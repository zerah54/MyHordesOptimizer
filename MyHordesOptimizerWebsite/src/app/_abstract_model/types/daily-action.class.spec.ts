import { DailyAction } from './daily-action.class';

describe('DailyAction', (): void => {
    it('reads day and action_key from the DTO', (): void => {
        const daily_action: DailyAction = new DailyAction({
            day: 5, actionKey: 'home_shower',
            lastUpdateInfo: { updateTime: new Date(), userId: '1', userName: 'Zerah', userKey: 'k' }
        });

        expect(daily_action.day).toBe(5);
        expect(daily_action.action_key).toBe('home_shower');
        expect(daily_action.update_info.username).toBe('Zerah');
    });

    it('leaves fields unset when constructed without a DTO', (): void => {
        const daily_action: DailyAction = new DailyAction();

        expect(daily_action.update_info).toBeUndefined();
    });

    it('round-trips through modelToDto', (): void => {
        const daily_action: DailyAction = new DailyAction({
            day: 5, actionKey: 'home_shower',
            lastUpdateInfo: { updateTime: new Date(), userId: '1', userName: 'Zerah', userKey: 'k' }
        });

        const dto: ReturnType<DailyAction['modelToDto']> = daily_action.modelToDto();

        expect(dto.day).toBe(5);
        expect(dto.actionKey).toBe('home_shower');
    });
});
