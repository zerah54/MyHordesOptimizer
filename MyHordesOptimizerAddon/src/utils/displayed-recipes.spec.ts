import { describe, expect, it } from 'vitest';

import type { MhoItem, MhoRecipe } from '../types';
import { getDisplayedRecipes } from './displayed-recipes';

/** Construit un objet de recette. */
function recipeItem(uid: string): MhoItem {
    return { id: 0, uid: uid, img: `item/item_${uid}.gif`, label: { fr: uid, en: uid, de: uid, es: uid } };
}

/** Construit une recette. */
function makeRecipe(name: string, type: string, components: string[], results: string[]): MhoRecipe {
    return {
        name: name,
        type: { id: type, label: { fr: type, en: type, de: type, es: type } },
        components: components.map((uid: string): MhoItem => recipeItem(uid)),
        result: results.map((uid: string): { item: MhoItem; probability: number } => ({ item: recipeItem(uid), probability: 1 / results.length }))
    };
}

describe('getDisplayedRecipes', () => {
    it('masque une recette de l\'Établi des Techniciens déjà donnée par l\'Atelier', () => {
        const recipes: MhoRecipe[] = [
            makeRecipe('ws011', 'Recipe::WorkshopType', ['electro_box_#00'], ['pile_#00', 'deto_#00']),
            makeRecipe('ws011_ta_0', 'Recipe::WorkshopTypeTechSpecific', ['electro_box_#00'], ['pile_#00']),
            makeRecipe('ws011_ta_5', 'Recipe::WorkshopTypeTechSpecific', ['electro_box_#00'], ['deto_#00'])
        ];

        expect(getDisplayedRecipes(recipes).map((recipe: MhoRecipe): string => recipe.name)).toEqual(['ws011']);
    });

    it('garde une recette de l\'Établi des Techniciens que l\'Atelier ne donne pas', () => {
        const recipes: MhoRecipe[] = [
            makeRecipe('ws011', 'Recipe::WorkshopType', ['electro_box_#00'], ['pile_#00']),
            makeRecipe('ws011_ta_9', 'Recipe::WorkshopTypeTechSpecific', ['electro_box_#00'], ['tagger_#00']),
            makeRecipe('ws099_ta_0', 'Recipe::WorkshopTypeTechSpecific', ['wood_bad_#00'], ['pile_#00'])
        ];

        expect(getDisplayedRecipes(recipes).map((recipe: MhoRecipe): string => recipe.name)).toEqual(['ws011', 'ws011_ta_9', 'ws099_ta_0']);
    });
});
