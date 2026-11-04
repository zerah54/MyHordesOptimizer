import { HomeEnum } from '../../../_abstract_model/enum/home.enum';
import { JobEnum } from '../../../_abstract_model/enum/job.enum';
import { Property } from '../../../_abstract_model/enum/property.enum';
import { Building, BuildingResource } from '../../../_abstract_model/types/building.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenExpedition } from '../../../_abstract_model/types/citizen-expedition.class';
import { Expedition } from '../../../_abstract_model/types/expedition.class';
import { ExpeditionPart } from '../../../_abstract_model/types/expedition-part.class';
import { HomeWithValue } from '../../../_abstract_model/types/home.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { buildingCost } from '../../../_core/utilities/building-cost.util';
import { ExpeditionPartPa } from './budget.util';
import { BuildingProgress, initialProgress } from './building-progress.util';
import { homeDefenseFactor, TownDefenseFactors } from './defense-gain.util';
import { CIRCULAR_QUARTERS_UID } from './defense-rules.const';
import { HomeReferentialDTO, HomeResourceDTO, HomeUpgradeLevelDTO } from './home-referential.types';
import { UPGRADE_KEY_BY_NAME } from './home-upgrades.util';
import { TownBuildingResourceDTO, TownBuildingStateDTO, TownDefenseStateDTO } from './plan.types';
import { BuildingRef, CitizenRef, HomeLevelRef, SLAVERY_UID, WORKSHOP_UID } from './plan-evaluation.util';
import { ResourceCount } from './resources.util';

/** Niveau de plan estimé d'un chantier (nombre de plans lus en Pandémonium). */
export type PlanTier = 0 | 1 | 2;

/**
 * État synchronisé d'un chantier.
 * @param {TownBuildingStateDTO[]} states États synchronisés.
 * @param {number} building_id Identifiant du chantier.
 * @returns {TownBuildingStateDTO | undefined} État, absent si le chantier n'est pas dans la ville.
 */
function stateOf(states: TownBuildingStateDTO[], building_id: number): TownBuildingStateDTO | undefined {
    return states.find((state: TownBuildingStateDTO): boolean => state.buildingId === building_id);
}

/**
 * Coût en PA retenu pour un chantier : état synchronisé, sinon niveau de plan estimé du référentiel.
 * @param {Building} building Chantier du référentiel.
 * @param {TownBuildingStateDTO | undefined} state État synchronisé.
 * @param {boolean} hard_mode Vrai en Pandémonium.
 * @param {PlanTier} tier Niveau de plan estimé.
 * @returns {number} Coût en PA.
 */
function paOf(building: Building, state: TownBuildingStateDTO | undefined, hard_mode: boolean, tier: PlanTier): number {
    return state?.paCurrent ?? buildingCost(building, hard_mode, tier).ap ?? building.pa;
}

/**
 * Chantiers du référentiel avec le coût retenu pour la ville.
 * @param {Building[]} buildings Référentiel des chantiers.
 * @param {TownBuildingStateDTO[]} states États synchronisés.
 * @param {boolean} hard_mode Vrai en Pandémonium.
 * @param {string} locale Langue des libellés.
 * @param {ReadonlyMap<number, PlanTier>} tiers Niveaux de plan estimés (absent = 0).
 * @returns {Map<number, BuildingRef>} Chantiers indexés par identifiant.
 */
export function buildingRefs(
    buildings: Building[],
    states: TownBuildingStateDTO[],
    hard_mode: boolean,
    locale: string,
    tiers: ReadonlyMap<number, PlanTier> = new Map<number, PlanTier>()
): Map<number, BuildingRef> {
    const refs: Map<number, BuildingRef> = new Map<number, BuildingRef>();
    for (const building of buildings) {
        const tier: PlanTier = tiers.get(building.id) ?? 0;
        const state: TownBuildingStateDTO | undefined = stateOf(states, building.id);
        const synced: ResourceCount[] = (state?.resources ?? []).map((resource: TownBuildingResourceDTO): ResourceCount => ({ itemId: resource.itemId, count: resource.count }));
        const reference: ResourceCount[] = buildingCost(building, hard_mode, tier).resources
            .map((resource: BuildingResource): ResourceCount => ({ itemId: resource.item_id, count: resource.count }));
        refs.set(building.id, {
            id: building.id,
            uid: building.uid,
            label: building.label?.[locale] ?? building.uid,
            pa: paOf(building, state, hard_mode, tier),
            defence: building.defence,
            maxLife: building.max_life,
            temporary: building.temporary,
            breakable: building.breakable,
            parentId: building.parent_id,
            resources: synced.length > 0 ? synced : reference
        });
    }
    return refs;
}

/**
 * Avancement de chaque chantier au début de la journée ; un chantier sans état n'a rien d'investi.
 * @param {Building[]} buildings Référentiel des chantiers.
 * @param {TownBuildingStateDTO[]} states États synchronisés.
 * @param {boolean} hard_mode Vrai en Pandémonium.
 * @param {ReadonlyMap<number, PlanTier>} tiers Niveaux de plan estimés (absent = 0).
 * @returns {Map<number, BuildingProgress>} Avancement par identifiant de chantier.
 */
export function buildingProgressMap(
    buildings: Building[],
    states: TownBuildingStateDTO[],
    hard_mode: boolean,
    tiers: ReadonlyMap<number, PlanTier> = new Map<number, PlanTier>()
): Map<number, BuildingProgress> {
    const progress: Map<number, BuildingProgress> = new Map<number, BuildingProgress>();
    for (const building of buildings) {
        const state: TownBuildingStateDTO | undefined = stateOf(states, building.id);
        progress.set(building.id, initialProgress({
            buildingId: building.id,
            paCurrent: paOf(building, state, hard_mode, tiers.get(building.id) ?? 0),
            apRemaining: state?.apRemaining ?? null,
            isBuilt: state?.isBuilt ?? false,
            life: state?.life ?? null,
            maxLife: state?.maxLife ?? building.max_life,
            def: state?.def ?? null,
            defMax: building.defence
        }));
    }
    return progress;
}

/**
 * Niveau de l'atelier : celui de l'état synchronisé s'il est construit, 0 sinon.
 * @param {Building[]} buildings Référentiel des chantiers.
 * @param {TownBuildingStateDTO[]} states États synchronisés.
 * @returns {number} Niveau (≥ 0).
 */
export function workshopLevelOf(buildings: Building[], states: TownBuildingStateDTO[]): number {
    const workshop: Building | undefined = buildings.find((building: Building): boolean => building.uid === WORKSHOP_UID);
    const state: TownBuildingStateDTO | undefined = workshop === undefined ? undefined : stateOf(states, workshop.id);
    return state?.isBuilt === true ? (state.level ?? 0) : 0;
}

/**
 * Présence du Bureau des esclavagistes construit.
 * @param {Building[]} buildings Référentiel des chantiers.
 * @param {TownBuildingStateDTO[]} states États synchronisés.
 * @returns {boolean} Vrai si le bureau est construit.
 */
export function hasSlaveryOf(buildings: Building[], states: TownBuildingStateDTO[]): boolean {
    const slavery: Building | undefined = buildings.find((building: Building): boolean => building.uid === SLAVERY_UID);
    return slavery !== undefined && stateOf(states, slavery.id)?.isBuilt === true;
}

/**
 * Uids des chantiers construits d'après l'état synchronisé.
 * @param {Building[]} buildings Référentiel des chantiers.
 * @param {TownBuildingStateDTO[]} states États synchronisés.
 * @returns {Set<string>} Uids construits.
 */
export function builtUidsOf(buildings: Building[], states: TownBuildingStateDTO[]): Set<string> {
    const built_ids: Set<number> = new Set<number>(states.filter((state: TownBuildingStateDTO): boolean => state.isBuilt).map((state: TownBuildingStateDTO): number => state.buildingId));
    return new Set<string>(buildings.filter((building: Building): boolean => built_ids.has(building.id)).map((building: Building): string => building.uid));
}

/**
 * Niveau d'évolution des chantiers construits, d'après l'état synchronisé (0 quand il est inconnu).
 * @param {Building[]} buildings Référentiel des chantiers.
 * @param {TownBuildingStateDTO[]} states États synchronisés.
 * @returns {Map<string, number>} Niveau par uid.
 */
export function buildingLevelsOf(buildings: Building[], states: TownBuildingStateDTO[]): Map<string, number> {
    const uids: Map<number, string> = new Map<number, string>(buildings.map((building: Building): [number, string] => [building.id, building.uid]));
    const levels: Map<string, number> = new Map<string, number>();
    for (const state of states) {
        const uid: string | undefined = uids.get(state.buildingId);
        if (state.isBuilt && uid !== undefined) {
            levels.set(uid, state.level ?? 0);
        }
    }
    return levels;
}

/**
 * Objets qui comptent comme objets de défense (propriété `defence`).
 * @param {readonly Item[]} items Objets du référentiel.
 * @returns {Set<number>} Identifiants.
 */
export function defenseItemIdsOf(items: readonly Item[]): Set<number> {
    return new Set<number>(items
        .filter((item: Item): boolean => item.properties.some((property: Property): boolean => property?.key === Property.DEFENCE.key))
        .map((item: Item): number => item.id));
}

/**
 * Composantes de la défense de la ville tirées de la dernière mise à jour : objets de défense en banque et leur multiplicateur,
 * défense brute des maisons (déduite de la part comptée par la ville), citoyens vivants et morts, échelle globale (1 − bonus).
 * @param {TownDefenseStateDTO | null} defense Défense synchronisée.
 * @param {readonly Citizen[]} citizens Citoyens de la ville, morts compris.
 * @param {ReadonlySet<string>} built_uids Uids des chantiers construits.
 * @returns {TownDefenseFactors} Composantes.
 */
export function townDefenseFactors(defense: TownDefenseStateDTO | null, citizens: readonly Citizen[], built_uids: ReadonlySet<string>): TownDefenseFactors {
    const dead: number = citizens.filter((citizen: Citizen): boolean => citizen.is_dead === true).length;
    return {
        defenseItems: defense?.items ?? 0,
        itemFactor: defense?.itemsMul ?? 1,
        homeRaw: (defense?.citizenHomes ?? 0) / homeDefenseFactor(built_uids.has(CIRCULAR_QUARTERS_UID)),
        alive: citizens.length - dead,
        dead,
        scale: 1 - (defense?.bonus ?? 0)
    };
}

/**
 * Citoyens vivants de la ville, avec leur statut de banni, leur métier et leur niveau de maison connu.
 * @param {Citizen[]} citizens Citoyens de la ville.
 * @returns {CitizenRef[]} Citoyens pris en compte dans le budget.
 */
export function citizenRefs(citizens: Citizen[]): CitizenRef[] {
    return citizens
        .filter((citizen: Citizen): boolean => citizen.is_dead !== true)
        .map((citizen: Citizen): CitizenRef => {
            const house: HomeWithValue | undefined = citizen.home?.content?.find((entry: HomeWithValue): boolean => entry.element.key === HomeEnum.HOUSE_LEVEL.key);
            return {
                userId: citizen.id,
                name: citizen.name,
                banned: citizen.is_shunned === true,
                technician: citizen.job?.key === JobEnum.TECHNICIAN.key,
                homeLevel: typeof house?.value === 'number' ? house.value : null
            };
        });
}

/**
 * Parties d'expédition avec la longueur de leur tracé et les citoyens inscrits.
 * @param {Expedition[]} expeditions Expéditions du jour.
 * @returns {ExpeditionPartPa[]} Parties à compter dans le budget.
 */
export function expeditionParts(expeditions: Expedition[]): ExpeditionPartPa[] {
    return expeditions.flatMap((expedition: Expedition): ExpeditionPartPa[] => expedition.parts.map((part: ExpeditionPart): ExpeditionPartPa => ({
        routeLength: part.map_route?.length ?? null,
        citizenIds: part.citizens
            .map((citizen: CitizenExpedition): number | undefined => citizen.citizen_id)
            .filter((id: number | undefined): id is number => id !== undefined)
    })));
}

/**
 * Stock de la banque par objet ; les objets cassés ne comptent pas.
 * @param {Item[]} items Objets de la banque.
 * @returns {Map<number, number>} Quantité par identifiant d'objet.
 */
export function bankMap(items: Item[]): Map<number, number> {
    const bank: Map<number, number> = new Map<number, number>();
    for (const item of items) {
        if (item.is_broken !== true) {
            bank.set(item.id, (bank.get(item.id) ?? 0) + (item.bank_count ?? 0));
        }
    }
    return bank;
}

/**
 * Valeurs en PA des objets, indexées par identifiant numérique ; les clés invalides sont ignorées.
 * @param {Record<string, number>} values Valeurs telles que l'API les renvoie.
 * @returns {Map<number, number>} Valeur par identifiant d'objet.
 */
export function itemValueMap(values: Record<string, number>): Map<number, number> {
    const map: Map<number, number> = new Map<number, number>();
    for (const [key, value] of Object.entries(values)) {
        const id: number = Number(key);
        if (Number.isInteger(id)) {
            map.set(id, value);
        }
    }
    return map;
}

/**
 * Niveaux de plan estimés d'une proposition, indexés par identifiant numérique ; clés ou niveaux invalides ignorés.
 * @param {Record<string, number> | null | undefined} tiers Niveaux tels que l'API les renvoie ; absents d'un contenu antérieur.
 * @returns {Map<number, PlanTier>} Niveau par chantier.
 */
export function planTierMap(tiers: Record<string, number> | null | undefined): Map<number, PlanTier> {
    const map: Map<number, PlanTier> = new Map<number, PlanTier>();
    for (const [key, value] of Object.entries(tiers ?? {})) {
        const id: number = Number(key);
        if (Number.isInteger(id) && (value === 0 || value === 1 || value === 2)) {
            map.set(id, value);
        }
    }
    return map;
}

/**
 * Niveaux de maison indexés par niveau, ressources résolues en identifiants d'objets (uid inconnus ignorés).
 * @param {HomeReferentialDTO} referential Référentiel de l'API.
 * @param {ReadonlyMap<string, number>} item_id_by_uid Identifiant d'objet par uid.
 * @param {string} locale Langue des libellés (repli sur le libellé du référentiel).
 * @returns {Map<number, HomeLevelRef>} Niveaux de maison.
 */
export function homeLevelRefs(referential: HomeReferentialDTO, item_id_by_uid: ReadonlyMap<string, number>, locale: string): Map<number, HomeLevelRef> {
    const refs: Map<number, HomeLevelRef> = new Map<number, HomeLevelRef>();
    for (const level of referential.levels) {
        refs.set(level.level, {
            level: level.level,
            label: HomeEnum.HOUSE_LEVEL.value.house_options?.[level.level]?.[locale] ?? level.label,
            def: level.def,
            ap: level.ap,
            apUrbanism: level.apUrbanism,
            resources: homeResources(level.resources, item_id_by_uid),
            resourcesUrbanism: homeResources(level.resourcesUrbanism, item_id_by_uid)
        });
    }
    return refs;
}

/**
 * Ressources de chaque niveau des améliorations de maison connues du site, par clé `HomeEnum`.
 * @param {HomeReferentialDTO} referential Référentiel des maisons.
 * @param {ReadonlyMap<string, number>} item_id_by_uid Identifiant d'objet par uid.
 * @returns {Map<string, ReadonlyMap<number, ResourceCount[]>>} Ressources résolues, indexées par clé puis par niveau.
 */
export function homeUpgradeResources(referential: HomeReferentialDTO, item_id_by_uid: ReadonlyMap<string, number>): Map<string, ReadonlyMap<number, ResourceCount[]>> {
    const refs: Map<string, ReadonlyMap<number, ResourceCount[]>> = new Map<string, ReadonlyMap<number, ResourceCount[]>>();
    for (const upgrade of referential.upgrades) {
        const key: string | undefined = UPGRADE_KEY_BY_NAME[upgrade.name];
        if (key !== undefined) {
            refs.set(key, new Map<number, ResourceCount[]>(upgrade.levels.map((level: HomeUpgradeLevelDTO): [number, ResourceCount[]] =>
                [level.level, homeResources(level.resources, item_id_by_uid)])));
        }
    }
    return refs;
}

/**
 * Ressources de maison dont l'uid est connu.
 * @param {HomeResourceDTO[]} resources Ressources du référentiel.
 * @param {ReadonlyMap<string, number>} item_id_by_uid Identifiant d'objet par uid.
 * @returns {ResourceCount[]} Ressources résolues.
 */
function homeResources(resources: HomeResourceDTO[], item_id_by_uid: ReadonlyMap<string, number>): ResourceCount[] {
    const resolved: ResourceCount[] = [];
    for (const resource of resources) {
        const item_id: number | undefined = item_id_by_uid.get(resource.itemUid);
        if (item_id !== undefined) {
            resolved.push({ itemId: item_id, count: resource.count });
        }
    }
    return resolved;
}
