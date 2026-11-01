import { BuildingAvailabilityStatusDTO } from '../../_abstract_model/dto/building.dto';
import { BlueprintEnum } from '../../_abstract_model/enum/blueprint.enum';
import { TownTypeId } from '../../_abstract_model/types/_types';
import { Building, BuildingResource } from '../../_abstract_model/types/building.class';
import { normalizeString } from './string.utils';

/**
 * Icône du plan par défaut : repli uniquement quand le niveau de rareté est authentiquement inconnu (absent de
 * BlueprintEnum). Une rareté 0 (« constructible sans plan ») n'y retombe pas.
 */
const DEFAULT_PLAN_ICON: string = 'item/item_bplan_c.gif';

/** Options d'aplatissement de l'arbre. */
export interface FlattenOptions {
    /** Chantiers repliés. */
    collapsed: ReadonlySet<number>;
    /** Recherche saisie (normalisée ici). */
    filter: string;
    locale: string;
    /** Faux pour omettre une ligne ; ses évolutions restent parcourues. */
    isShown: (building: Building) => boolean;
}

/**
 * Nom affiché d'un chantier.
 * @param {Building} building Chantier.
 * @param {string} locale Langue.
 * @returns {string} Libellé, sinon uid.
 */
export function buildingName(building: Building, locale: string): string {
    return building.label?.[locale] ?? building.uid ?? '';
}

/**
 * Reconstruit l'arbre depuis la liste plate. Tri par rang d'affichage du jeu puis par nom (le rang n'est pas unique).
 * Un parent absent laisse son enfant à la racine plutôt que de le faire disparaître.
 * @param {Building[]} buildings Chantiers du référentiel (leurs `children` et `depth` sont remplis).
 * @param {string} locale Langue du tri.
 * @returns {{ roots: Building[]; by_id: Map<number, Building> }} Racines et index par identifiant.
 */
export function buildBuildingTree(buildings: Building[], locale: string): { roots: Building[]; by_id: Map<number, Building> } {
    const by_id: Map<number, Building> = new Map(buildings.map((building: Building): [number, Building] => [building.id, building]));
    const roots: Building[] = [];
    buildings.forEach((building: Building): void => {
        building.children = [];
    });
    buildings.forEach((building: Building): void => {
        const parent: Building | undefined = building.parent_id === null ? undefined : by_id.get(building.parent_id);
        if (parent) {
            parent.children.push(building);
        } else {
            roots.push(building);
        }
    });
    const sort = (list: Building[], depth: number): void => {
        list.sort((a: Building, b: Building): number =>
            (a.display_order ?? 0) - (b.display_order ?? 0)
            || buildingName(a, locale).localeCompare(buildingName(b, locale)));
        list.forEach((building: Building): void => {
            building.depth = depth;
            sort(building.children, depth + 1);
        });
    };
    sort(roots, 0);
    return { roots, by_id };
}

/**
 * Aplatit l'arbre en lignes, replis et recherche compris. Quand la recherche retient une évolution, toute sa branche
 * ascendante est conservée ; une recherche en cours ignore les replis.
 * @param {Building[]} roots Racines.
 * @param {FlattenOptions} options Replis, recherche, langue et filtre d'affichage.
 * @returns {Building[]} Lignes dans l'ordre de l'arbre.
 */
export function flattenBuildingTree(roots: Building[], options: FlattenOptions): Building[] {
    const needle: string = normalizeString(options.filter ?? '').trim();
    const flattened: Building[] = [];
    const flatten = (list: Building[]): void => {
        list.forEach((building: Building): void => {
            if (!matchesBranch(building, needle, options.locale)) {
                return;
            }
            if (options.isShown(building)) {
                flattened.push(building);
            }
            if (needle.length > 0 || !options.collapsed.has(building.id)) {
                flatten(building.children);
            }
        });
    };
    flatten(roots);
    return flattened;
}

/**
 * Le chantier ou l'une de ses évolutions correspond-il à la recherche ?
 * @param {Building} building Chantier.
 * @param {string} needle Recherche déjà normalisée.
 * @param {string} locale Langue.
 * @returns {boolean} Vrai si la branche correspond.
 */
export function matchesBranch(building: Building, needle: string, locale: string): boolean {
    if (needle.length === 0) {
        return true;
    }
    if (normalizeString(buildingName(building, locale)).includes(needle)) {
        return true;
    }
    return building.children.some((child: Building): boolean => matchesBranch(child, needle, locale));
}

/**
 * Disponibilité d'un chantier pour un type de ville.
 * @param {Building} building Chantier.
 * @param {TownTypeId | null} town_type Type de ville, nul hors ville.
 * @returns {BuildingAvailabilityStatusDTO | null} Statut, nul si inconnu.
 */
export function availabilityIn(building: Building, town_type: TownTypeId | null): BuildingAvailabilityStatusDTO | null {
    if (!town_type) {
        return null;
    }
    return building.availability[town_type] ?? null;
}

/**
 * Nombre de lectures de plan qui changent réellement quelque chose en Pandémonium (0 à 2). Les ressources du palier 2
 * sont toujours celles du palier 1 : seul le PA peut encore varier à la 2e lecture.
 * @param {Building} building Chantier.
 * @returns {0 | 1 | 2} Lectures utiles.
 */
export function usefulPlanReadings(building: Building): 0 | 1 | 2 {
    if (!building.has_hard_mode) {
        return 0;
    }
    const first_reading_helps: boolean = building.tier0_ap !== building.tier1_ap
        || !sameResources(building.tier0_resources, building.tier1_resources);
    if (!first_reading_helps) {
        return 0;
    }
    return building.tier1_ap !== building.tier2_ap ? 2 : 1;
}

/**
 * Un chantier de rareté 0 sans niveau nommé n'a pas de vrai niveau de plan en Pandémonium (palier jamais atteignable).
 * @param {Building} building Chantier.
 * @returns {boolean} Vrai si un plan peut faire progresser son palier.
 */
export function hasReachablePlanLevel(building: Building): boolean {
    return building.hard_blueprint_level !== null || building.rarity > 0;
}

/**
 * Icône du stepper de niveau de plan : la rareté nommée (rules.yml) prime sur la rareté de base ; rien pour la rareté 0.
 * @param {Building} building Chantier.
 * @returns {string} Chemin de l'icône, vide pour la rareté 0.
 */
export function planStepperIcon(building: Building): string {
    const effective_rarity: number = building.hard_blueprint_level ?? building.rarity;
    const blueprint: BlueprintEnum | undefined = BlueprintEnum.fromRarity(effective_rarity);
    return blueprint ? (blueprint.value.img ?? '') : DEFAULT_PLAN_ICON;
}

/**
 * Deux jeux de ressources sont égaux si mêmes objets aux mêmes quantités, ordre indifférent.
 * @param {BuildingResource[]} a Premier jeu.
 * @param {BuildingResource[]} b Second jeu.
 * @returns {boolean} Vrai si identiques.
 */
function sameResources(a: BuildingResource[], b: BuildingResource[]): boolean {
    if (a.length !== b.length) {
        return false;
    }
    const countsOf = (resources: BuildingResource[]): Map<number, number> =>
        new Map(resources.map((resource: BuildingResource): [number, number] => [resource.item_id, resource.count]));
    const counts_a: Map<number, number> = countsOf(a);
    const counts_b: Map<number, number> = countsOf(b);
    return counts_a.size === counts_b.size
        && Array.from(counts_a.entries()).every(([item_id, count]: [number, number]): boolean => counts_b.get(item_id) === count);
}
