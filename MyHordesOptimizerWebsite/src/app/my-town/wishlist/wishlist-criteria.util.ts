import { Item } from '../../_abstract_model/types/item.class';
import { ActionOutcome, ItemActionEffects } from '../../_abstract_model/types/item-action-effects.class';

/**
 * Critère d'appartenance : OU entre les valeurs d'un même critère.
 * `or_opens_into` : l'action retient aussi les contenants qui ne donnent, à l'ouverture, que des objets portant l'action.
 */
export type WishlistCriterion =
    | { kind: 'action'; keys: string[]; or_opens_into?: boolean }
    | { kind: 'property'; keys: string[] }
    | { kind: 'category'; ids: number[] }
    | { kind: 'heavy'; value: boolean };

/** Groupe du jeu : définition par critères, l'appartenance est toujours dérivée. */
export interface GameWishlistGroup {
    key: string;
    label: string;
    criteria: WishlistCriterion[];
}

/** Vrai si l'une des clés connues figure dans le critère ; `Item` garde `undefined` pour une clé inconnue des enums du site. */
function hasKnownKey(entries: readonly ({ key: string } | undefined)[], keys: readonly string[]): boolean {
    return entries.some((entry: { key: string } | undefined): boolean => entry !== undefined && keys.includes(entry.key));
}

/** Vrai si l'ouverture de l'objet donne au moins un objet, et uniquement des objets du catalogue portant l'une des actions. */
function opensOnlyInto(item: Item, keys: readonly string[], catalog: ReadonlyMap<string, Item>): boolean {
    const given: string[] = (item.action_effects ?? [])
        .filter((effects: ItemActionEffects): boolean => effects.kind === 'Open')
        .flatMap((effects: ItemActionEffects): ActionOutcome[] => effects.outcomes)
        .filter((outcome: ActionOutcome): boolean => (outcome.kind === 'Produced' || outcome.kind === 'Transformed') && outcome.item !== null)
        .map((outcome: ActionOutcome): string => outcome.item!.uid);
    return given.length > 0 && given.every((uid: string): boolean => {
        const given_item: Item | undefined = catalog.get(uid);
        return given_item !== undefined && hasKnownKey(given_item.actions, keys);
    });
}

/** Vrai si l'objet satisfait un critère ; le catalogue (par uid) sert à connaître ce que donnent les contenants. */
function matchesCriterion(item: Item, criterion: WishlistCriterion, catalog: ReadonlyMap<string, Item>): boolean {
    switch (criterion.kind) {
        case 'action':
            return hasKnownKey(item.actions, criterion.keys)
                || (criterion.or_opens_into === true && opensOnlyInto(item, criterion.keys, catalog));
        case 'property':
            return hasKnownKey(item.properties, criterion.keys);
        case 'category':
            return criterion.ids.includes(item.category?.id_category);
        case 'heavy':
            return item.is_heaver === criterion.value;
    }
}

/** ET entre les critères ; une liste vide ne correspond à rien. */
export function matchesCriteria(item: Item, criteria: readonly WishlistCriterion[], catalog: ReadonlyMap<string, Item> = new Map()): boolean {
    return criteria.length > 0 && criteria.every((criterion: WishlistCriterion): boolean => matchesCriterion(item, criterion, catalog));
}

/** Catalogue des objets par uid. */
export function itemCatalog(items: readonly Item[]): ReadonlyMap<string, Item> {
    return new Map(items.map((item: Item): [string, Item] => [item.uid, item]));
}

/** (correspondants ∪ ajoutés) − exclus. */
export function selectGroupItems(
    items: readonly Item[],
    criteria: readonly WishlistCriterion[],
    added_ids: ReadonlySet<number>,
    excluded_ids: ReadonlySet<number>
): Item[] {
    const catalog: ReadonlyMap<string, Item> = itemCatalog(items);
    return items.filter((item: Item): boolean =>
        !excluded_ids.has(item.id) && (added_ids.has(item.id) || matchesCriteria(item, criteria, catalog)));
}

/** Les 11 groupes du jeu ; libellés évalués à l'appel pour passer par `$localize` à l'exécution. */
export function gameWishlistGroups(): GameWishlistGroup[] {
    return [
        { key: 'b6', label: $localize`B6`, criteria: [{ kind: 'action', keys: ['eat_6ap'], or_opens_into: true }] },
        { key: 'b7', label: $localize`B7`, criteria: [{ kind: 'action', keys: ['eat_7ap'], or_opens_into: true }] },
        { key: 'alcohol', label: $localize`Alcools`, criteria: [{ kind: 'action', keys: ['alcohol', 'alcohol_dx'] }] },
        { key: 'coffee', label: $localize`Café`, criteria: [{ kind: 'action', keys: ['coffee'] }] },
        { key: 'food', label: $localize`Provisions`, criteria: [{ kind: 'property', keys: ['food'] }] },
        { key: 'drug', label: $localize`Pharmacie`, criteria: [{ kind: 'property', keys: ['drug'] }] },
        { key: 'weapon', label: $localize`Armes`, criteria: [{ kind: 'property', keys: ['weapon'] }] },
        { key: 'defence', label: $localize`Objets de défense`, criteria: [{ kind: 'property', keys: ['defence'] }] },
        { key: 'pet_heavy', label: $localize`Animaux encombrants`, criteria: [{ kind: 'property', keys: ['pet'] }, { kind: 'heavy', value: true }] },
        { key: 'pet_light', label: $localize`Animaux non encombrants`, criteria: [{ kind: 'property', keys: ['pet'] }, { kind: 'heavy', value: false }] },
        { key: 'water', label: $localize`Eau`, criteria: [{ kind: 'property', keys: ['is_water'] }] }
    ];
}
