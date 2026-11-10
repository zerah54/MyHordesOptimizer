import { clearTranslations, loadTranslations, ɵcomputeMsgId } from '@angular/localize';

import { Property } from './property.enum';

describe('Property', () => {
    afterEach((): void => clearTranslations());

    it('traduit le libellé après le chargement des traductions', () => {
        loadTranslations({ [ɵcomputeMsgId('Peut être cuisiné')]: 'Can be cooked' });

        expect(Property.CAN_COOK.value.label).toBe('Can be cooked');
    });

    it('connaît les 38 propriétés du jeu', () => {
        const keys: string[] = [
            'esc_fixed', 'lock', 'found_poisoned', 'prevent_terror', 'hero_find_lucky', 'hero_find', 'impoundable', 'prevent_night',
            'is_water', 'camp_bonus', 'nw_armory', 'nw_ikea', 'nw_trebuchet', 'nw_shooting', 'can_poison', 'can_cook', 'food', 'drug',
            'weapon', 'ressource', 'defence', 'pet', 'deco',
            'single_use', 'lure', 'hero_find_lucky2', 'hero_find_lucky3', 'hero_dog_fetch', 'no_post', 'nosteal', 'inedible',
            'haunting_soul', 'angry_soul', 'defence_cp', 'nw_impact_cumul', 'box_opener', 'can_opener', 'parcel_opener'
        ];

        expect(keys.length).toBe(38);
        expect(keys.filter((key: string): boolean => Property.getByKey(key) === undefined)).toEqual([]);
    });
});
