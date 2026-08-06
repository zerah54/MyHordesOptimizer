import { DailyActionEnum } from './daily-action.enum';

describe('DailyActionEnum', (): void => {
    it('resolves HOME_SHOWER by key', (): void => {
        expect(DailyActionEnum.getByKey<DailyActionEnum>('home_shower')).toBe(DailyActionEnum.HOME_SHOWER);
    });

    it('returns undefined for an unknown key', (): void => {
        expect(DailyActionEnum.getByKey<DailyActionEnum>('unknown_key')).toBeUndefined();
    });

    it('lists exactly the three lot-1 actions', (): void => {
        const all: DailyActionEnum[] = DailyActionEnum.getAllValues<DailyActionEnum>();

        expect(all.length).toBe(3);
        expect(all).toContain(DailyActionEnum.HOME_POOL);
        expect(all).toContain(DailyActionEnum.HOME_SHOWER);
        expect(all).toContain(DailyActionEnum.HOME_CLEAN);
    });

    it('exposes label and icon for each entry', (): void => {
        expect(DailyActionEnum.HOME_SHOWER.getLabel()).toBeTruthy();
        expect(DailyActionEnum.HOME_SHOWER.value.img).toBe('building/small_shower.gif');
    });
});
