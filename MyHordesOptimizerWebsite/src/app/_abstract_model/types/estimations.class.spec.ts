import { Estimations } from './estimations.class';

describe('Estimations', (): void => {
    it('reads the souls and SPA levels and sends them back with the estimations', (): void => {
        const estimations: Estimations = new Estimations({ day: 16, estim: {}, planif: {}, estimSouls: { '33': 2 }, planifSouls: {}, estimSpaLevel: 2, planifSpaLevel: 0 });

        expect(estimations.estim_souls).toEqual({ '33': 2 });
        expect(estimations.estim_spa_level).toBe(2);
        expect(estimations.modelToDto()).toEqual(expect.objectContaining({ estimSouls: { '33': 2 }, planifSouls: {}, estimSpaLevel: 2, planifSpaLevel: 0 }));
    });

    it('defaults to no soul and SPA level 0 without data', (): void => {
        const estimations: Estimations = new Estimations();

        expect(estimations.estim_souls).toEqual({});
        expect(estimations.planif_spa_level).toBe(0);
    });
});
