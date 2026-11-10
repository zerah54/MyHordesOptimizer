import type { MhoItem, MhoRecipe } from '../types';

/** Identifiant du type d'une recette, qu'il soit déjà résolu en objet ou encore brut. */
function recipeTypeId(recipe: MhoRecipe): string {
    return typeof recipe.type === 'string' ? recipe.type : recipe.type?.id;
}

/** Clé des objets consommés par une recette, indépendante de leur ordre. */
function componentsKey(recipe: MhoRecipe): string {
    return recipe.components.map((item: MhoItem): string => item.uid).sort().join('|');
}

/** Recettes à afficher : sans celles de l'Établi des Techniciens que l'Atelier donne déjà. */
export function getDisplayedRecipes(recipes: MhoRecipe[]): MhoRecipe[] {
    const workshop: MhoRecipe[] = recipes.filter((recipe: MhoRecipe): boolean => recipeTypeId(recipe) === 'Recipe::WorkshopType');
    return recipes.filter((recipe: MhoRecipe): boolean => recipeTypeId(recipe) !== 'Recipe::WorkshopTypeTechSpecific'
        || !workshop.some((other: MhoRecipe): boolean => componentsKey(other) === componentsKey(recipe)
            && recipe.result.every((result: { item: MhoItem }): boolean =>
                other.result.some((other_result: { item: MhoItem }): boolean => other_result.item?.uid === result.item?.uid))));
}
