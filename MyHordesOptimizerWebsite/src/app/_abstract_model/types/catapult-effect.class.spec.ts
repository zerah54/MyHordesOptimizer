import { CatapultEffectDTO } from '../dto/catapult-effect.dto';
import { CatapultEffect } from './catapult-effect.class';

describe('CatapultEffect', () => {
    it('convertit un DTO transformé avec objet obtenu', () => {
        const dto: CatapultEffectDTO = {
            fate: 'Transformed',
            morphTarget: { uid: 'metal_bad_#00', img: 'item/item_metal_bad.gif', imgBroken: null, label: { fr: 'Mauvais métal' } as never },
            killMin: 4,
            killMax: 10,
            repelSeconds: null,
            radius: 'Cross'
        };

        const model = new CatapultEffect(dto);

        expect(model.fate).toBe('Transformed');
        expect(model.morph_target?.uid).toBe('metal_bad_#00');
        expect(model.kill_min).toBe(4);
        expect(model.kill_max).toBe(10);
        expect(model.radius).toBe('Cross');
    });

    it('convertit un DTO sans objet obtenu (fate Intact)', () => {
        const dto: CatapultEffectDTO = { fate: 'Intact', morphTarget: null, killMin: null, killMax: null, repelSeconds: null, radius: null };

        const model = new CatapultEffect(dto);

        expect(model.fate).toBe('Intact');
        expect(model.morph_target).toBeNull();
    });

    it('reconvertit le modèle en DTO', () => {
        const dto: CatapultEffectDTO = { fate: 'Broken', morphTarget: null, killMin: 0, killMax: 3, repelSeconds: null, radius: 'Target' };
        const model = new CatapultEffect(dto);

        expect(model.modelToDto()).toEqual(dto);
    });
});
