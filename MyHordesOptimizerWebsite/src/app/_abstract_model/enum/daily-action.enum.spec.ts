import { DailyActionEnum } from './daily-action.enum';

describe('DailyActionEnum', (): void => {
    it('resolves HOME_SHOWER by key', (): void => {
        expect(DailyActionEnum.getByKey<DailyActionEnum>('home_shower')).toBe(DailyActionEnum.HOME_SHOWER);
    });

    it('returns undefined for an unknown key', (): void => {
        expect(DailyActionEnum.getByKey<DailyActionEnum>('unknown_key')).toBeUndefined();
    });

    it('lists exactly the four wired actions', (): void => {
        const all: DailyActionEnum[] = DailyActionEnum.getAllValues<DailyActionEnum>();

        expect(all.length).toBe(4);
        expect(all).toContain(DailyActionEnum.HOME_POOL);
        expect(all).toContain(DailyActionEnum.HOME_SHOWER);
        expect(all).toContain(DailyActionEnum.HOME_CLEAN);
        expect(all).toContain(DailyActionEnum.HOME_REST);
    });

    it('exposes label and icon for each entry', (): void => {
        expect(DailyActionEnum.HOME_SHOWER.getLabel()).toBeTruthy();
        expect(DailyActionEnum.HOME_SHOWER.value.img).toBe('building/small_shower.gif');
    });

    it('resolves HOME_REST by key', (): void => {
        expect(DailyActionEnum.getByKey<DailyActionEnum>('home_rest')).toBe(DailyActionEnum.HOME_REST);
    });

    it('exposes label and icon for HOME_REST', (): void => {
        expect(DailyActionEnum.HOME_REST.getLabel()).toBeTruthy();
        expect(DailyActionEnum.HOME_REST.value.img).toBe('home/rest.gif');
    });
});
