import { FIREWORKS_UID, minimumSafeLife, NightExposure, nightLifeLoss, REACTOR_UID } from './night-survival.util';

function building(overrides: Partial<NightExposure> = {}): NightExposure {
    return { uid: 'wall', maxLife: 30, temporary: false, breakable: true, ...overrides };
}

describe('night-survival.util', (): void => {
    describe('nightLifeLoss', (): void => {
        it('hors Pandémonium, un chantier ordinaire ne perd rien', (): void => {
            expect(nightLifeLoss(building(), false)).toBe(0);
        });

        it('en Pandémonium, l\'attaque retire au plus 70 % des PV max, arrondi au-dessus', (): void => {
            expect(nightLifeLoss(building({ maxLife: 30 }), true)).toBe(21);
            expect(nightLifeLoss(building({ maxLife: 70 }), true)).toBe(49);
            expect(nightLifeLoss(building({ maxLife: 3 }), true)).toBe(3);
        });

        it('en Pandémonium, un chantier temporaire, incassable ou sans PV ne perd rien', (): void => {
            expect(nightLifeLoss(building({ temporary: true }), true)).toBe(0);
            expect(nightLifeLoss(building({ breakable: false }), true)).toBe(0);
            expect(nightLifeLoss(building({ maxLife: 0 }), true)).toBe(0);
        });

        it('le réacteur perd 125 PV dans tous les modes, jamais à l\'attaque', (): void => {
            expect(nightLifeLoss(building({ uid: REACTOR_UID, maxLife: 250, breakable: false }), false)).toBe(125);
            expect(nightLifeLoss(building({ uid: REACTOR_UID, maxLife: 250, breakable: true }), true)).toBe(125);
        });

        it('les feux d\'artifice perdent 20 PV, plus l\'attaque en Pandémonium', (): void => {
            expect(nightLifeLoss(building({ uid: FIREWORKS_UID, maxLife: 90 }), false)).toBe(20);
            expect(nightLifeLoss(building({ uid: FIREWORKS_UID, maxLife: 90 }), true)).toBe(83);
        });
    });

    describe('minimumSafeLife', (): void => {
        it('perte + 1, plafonné aux PV max', (): void => {
            expect(minimumSafeLife(30, 21)).toBe(22);
            expect(minimumSafeLife(250, 125)).toBe(126);
            expect(minimumSafeLife(100, 200)).toBe(100);
            expect(minimumSafeLife(30, 0)).toBe(1);
        });
    });
});
