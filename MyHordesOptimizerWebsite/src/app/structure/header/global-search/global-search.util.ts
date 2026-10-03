import { DirectorySearchPlayerDTO, DirectorySearchTownDTO, GlossaryEntryDTO } from '../../../_abstract_model/dto/search.dto';
import { TownTypeId } from '../../../_abstract_model/types/_types';
import { Building } from '../../../_abstract_model/types/building.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { Ruin } from '../../../_abstract_model/types/ruin.class';
import { DEEP_LINK_PARAMS } from '../../../_core/utilities/deep-link.util';
import { localizedLabel, normalizeString } from '../../../_core/utilities/string.utils';
import { SidenavLinks } from '../../menu/sidenav-links';

/** Groupes de résultats, dans leur ordre d'affichage. */
export type GlobalSearchGroupId = 'pages' | 'items' | 'buildings' | 'ruins' | 'citizens' | 'players' | 'towns';

/**
 * Groupes cherchés dans l'index en mémoire. Les groupes de l'annuaire (joueurs, villes) sont
 * cherchés par l'API et affichés après eux : leurs réponses arrivent plus tard, elles s'ajoutent
 * sous des résultats déjà lus au lieu de les déplacer.
 */
export const GLOBAL_SEARCH_GROUPS: readonly GlobalSearchGroupId[] = ['pages', 'items', 'buildings', 'ruins', 'citizens'];

/** Groupes de l'annuaire, cherchés côté serveur. */
export const GLOBAL_SEARCH_DIRECTORY_GROUPS: readonly GlobalSearchGroupId[] = ['players', 'towns'];

/** Résultats montrés par groupe tant qu'il n'est pas déplié. */
export const GLOBAL_SEARCH_GROUP_LIMIT: number = 5;

/** Résultats d'un groupe de l'annuaire déplié : au-delà, on précise la saisie. */
export const GLOBAL_SEARCH_DIRECTORY_EXPANDED_LIMIT: number = 50;

/** Longueur minimale de la saisie pour interroger l'annuaire (même seuil que l'API). */
export const GLOBAL_SEARCH_DIRECTORY_MIN_LENGTH: number = 2;

/** Destination d'un résultat : un chemin du routeur (sans « / » initial) et ses paramètres de lien profond. */
export interface GlobalSearchLink {
    readonly path: string;
    readonly query_params: Readonly<Record<string, number>> | null;
}

/** Une entrée de l'index : ce qu'on affiche, ce qu'on compare, où l'on va. */
export interface GlobalSearchEntry {
    readonly group: GlobalSearchGroupId;
    /** Unique dans son groupe. */
    readonly key: string;
    readonly label: string;
    /** Libellé plié (minuscules, sans accents ni ligatures) : c'est lui qu'on compare. */
    readonly folded: string;
    /** Précision affichée sous le libellé (catégorie, chantier parent, rubrique du menu…), ou `''`. */
    readonly context: string;
    /** Icône du jeu, relative à `HORDES_IMG_REPO`, ou `null`. */
    readonly img: string | null;
    /** Avatar MyHordes d'un joueur (chemin ou URL, voir `mho-avatar`), ou `null`. */
    readonly avatar: string | null;
    /** Icône Material Symbols quand il n'y a pas d'icône du jeu. */
    readonly symbol: string;
    readonly link: GlobalSearchLink;
}

export interface GlobalSearchGroup {
    readonly id: GlobalSearchGroupId;
    /** Les meilleurs résultats : au plus {@link GLOBAL_SEARCH_GROUP_LIMIT} tant que le groupe n'est pas déplié. */
    readonly entries: readonly GlobalSearchEntry[];
    /** Nombre total de correspondances du groupe. */
    readonly total: number;
    /** Résultats que le groupe montrerait une fois déplié (l'annuaire en limite le nombre). */
    readonly available: number;
}

/** Réglages d'une recherche dans l'index. */
export interface GlobalSearchOptions {
    /** Nombre de résultats montrés pour un groupe ({@link GLOBAL_SEARCH_GROUP_LIMIT} par défaut). */
    readonly limit?: (group: GlobalSearchGroupId) => number;
    /**
     * Autres formes de la saisie, cherchées en plus d'elle : définitions d'un sigle du glossaire
     * (« gcem » → « Gros coffre en métal »). À qualité égale, la saisie elle-même passe devant.
     */
    readonly aliases?: readonly string[];
}

/** Définition d'un sigle du glossaire. */
export interface GlossaryDefinition {
    readonly word: string;
    readonly definition: string;
}

/** Glossaire indexé par sigle plié (un sigle peut avoir plusieurs définitions). */
export type GlossaryIndex = ReadonlyMap<string, readonly GlossaryDefinition[]>;

export type GlobalSearchIndex = ReadonlyMap<GlobalSearchGroupId, readonly GlobalSearchEntry[]>;

/** Qualité d'une correspondance : plus c'est petit, mieux c'est classé. */
export enum MatchRank {
    /** Le libellé commence par la saisie. */
    Prefix = 0,
    /** Un mot du libellé commence par la saisie. */
    WordStart = 1,
    /** La saisie apparaît au milieu d'un mot. */
    Inside = 2,
    None = -1
}

/** Lettre ou chiffre, quel que soit l'alphabet : tout le reste sépare deux mots. */
const WORD_CHARACTER: RegExp = /[\p{L}\p{N}]/u;

/**
 * Plie un texte pour la comparaison : `normalizeString` (minuscules, sans accents), puis les
 * ligatures que la décomposition Unicode laisse intactes (« œ » d'« Œil », « ß »), et les blancs
 * réduits à une espace.
 */
export function foldForSearch(text: string | null | undefined): string {
    return normalizeString(text)
        .replace(/œ/g, 'oe')
        .replace(/æ/g, 'ae')
        .replace(/ß/g, 'ss')
        .replace(/\s+/g, ' ')
        .trim();
}

/** Classe `haystack` (déjà plié) pour la saisie `needle` (déjà pliée, non vide). */
export function matchRank(haystack: string, needle: string): MatchRank {
    let index: number = haystack.indexOf(needle);
    if (index === -1) {
        return MatchRank.None;
    }
    if (index === 0) {
        return MatchRank.Prefix;
    }
    // Une même saisie peut apparaître au milieu d'un mot PUIS en début d'un autre (« ar » dans
    // « Barre d'armes ») : c'est la meilleure occurrence qui compte.
    while (index !== -1) {
        if (!WORD_CHARACTER.test(haystack.charAt(index - 1))) {
            return MatchRank.WordStart;
        }
        index = haystack.indexOf(needle, index + 1);
    }
    return MatchRank.Inside;
}

/** Une correspondance et son score : plus il est petit, mieux elle est classée. */
interface ScoredEntry {
    readonly entry: GlobalSearchEntry;
    readonly score: number;
}

/**
 * Score d'une entrée pour la saisie et ses autres formes : qualité de la meilleure correspondance,
 * une forme dérivée (sigle développé) passant juste après la saisie de même qualité. `-1` sans
 * correspondance.
 */
function scoreEntry(folded: string, needles: readonly string[]): number {
    let best: number = -1;
    needles.forEach((needle: string, position: number): void => {
        const rank: MatchRank = matchRank(folded, needle);
        if (rank === MatchRank.None) {
            return;
        }
        const score: number = rank * 2 + (position === 0 ? 0 : 1);
        if (best === -1 || score < best) {
            best = score;
        }
    });
    return best;
}

/**
 * Cherche dans l'index, groupe par groupe.
 *
 * Classement : qualité de la correspondance, puis libellé le plus court (« Eau » avant « Eau
 * croupie » pour « eau »), puis ordre alphabétique pour rester stable. Les groupes sans résultat
 * sont omis. Aucun appel serveur : tout se joue sur l'index en mémoire, quelques centaines
 * d'entrées.
 */
export function searchIndex(index: GlobalSearchIndex, query: string, options: GlobalSearchOptions = {}): GlobalSearchGroup[] {
    const needle: string = foldForSearch(query);
    if (needle === '') {
        return [];
    }
    const needles: string[] = [needle];
    (options.aliases ?? []).forEach((alias: string): void => {
        const folded: string = foldForSearch(alias);
        if (folded !== '' && !needles.includes(folded)) {
            needles.push(folded);
        }
    });
    const groups: GlobalSearchGroup[] = [];
    GLOBAL_SEARCH_GROUPS.forEach((group_id: GlobalSearchGroupId): void => {
        const matches: ScoredEntry[] = [];
        (index.get(group_id) ?? []).forEach((entry: GlobalSearchEntry): void => {
            const score: number = scoreEntry(entry.folded, needles);
            if (score !== -1) {
                matches.push({ entry, score });
            }
        });
        if (matches.length === 0) {
            return;
        }
        matches.sort((a: ScoredEntry, b: ScoredEntry): number =>
            a.score - b.score
            || a.entry.folded.length - b.entry.folded.length
            || a.entry.folded.localeCompare(b.entry.folded));
        const limit: number = options.limit ? options.limit(group_id) : GLOBAL_SEARCH_GROUP_LIMIT;
        groups.push({
            id: group_id,
            entries: matches.slice(0, limit).map((match: ScoredEntry): GlobalSearchEntry => match.entry),
            total: matches.length,
            available: matches.length
        });
    });
    return groups;
}

/** Indexe le glossaire par sigle plié, en gardant toutes les définitions d'un même sigle. */
export function buildGlossaryIndex(entries: readonly GlossaryEntryDTO[]): GlossaryIndex {
    const index: Map<string, GlossaryDefinition[]> = new Map<string, GlossaryDefinition[]>();
    entries.forEach((entry: GlossaryEntryDTO): void => {
        const key: string = foldForSearch(entry.word);
        const definition: string = entry.definition?.trim() ?? '';
        if (key === '' || definition === '') {
            return;
        }
        const definitions: GlossaryDefinition[] = index.get(key) ?? [];
        if (!definitions.some((known: GlossaryDefinition): boolean => foldForSearch(known.definition) === foldForSearch(definition))) {
            definitions.push({ word: entry.word.trim(), definition });
        }
        index.set(key, definitions);
    });
    return index;
}

/**
 * Définitions d'un sigle saisi en entier (« GCEM », « gcem »). Un début de sigle ne développe rien :
 * « gc » n'a pas à inonder la liste de tout ce qui commence par « g… c… ».
 */
export function glossaryMatches(glossary: GlossaryIndex, query: string): readonly GlossaryDefinition[] {
    return glossary.get(foldForSearch(query)) ?? [];
}

function createEntry(group: GlobalSearchGroupId, key: string, label: string, context: string, img: string | null, symbol: string,
                     link: GlobalSearchLink, avatar: string | null = null): GlobalSearchEntry {
    return { group, key, label, folded: foldForSearch(label), context, img: img || null, avatar: avatar || null, symbol, link };
}

/** Objets du jeu → fiche du wiki. */
export function itemEntries(items: readonly Item[], locale: string): GlobalSearchEntry[] {
    return items
        .map((item: Item): GlobalSearchEntry => createEntry(
            'items',
            String(item.id),
            localizedLabel(item.label, locale),
            localizedLabel(item.category?.label, locale),
            item.img,
            'inventory_2',
            { path: 'wiki/items', query_params: { [DEEP_LINK_PARAMS.item]: item.id } }
        ))
        .filter((entry: GlobalSearchEntry): boolean => entry.folded !== '');
}

/** Chantiers de ville → arbre du wiki. Le chantier parent précise de quoi une évolution dépend. */
export function buildingEntries(buildings: readonly Building[], locale: string): GlobalSearchEntry[] {
    const labels: Map<number, string> = new Map(buildings.map((building: Building): [number, string] => [building.id, localizedLabel(building.label, locale)]));
    return buildings
        .map((building: Building): GlobalSearchEntry => createEntry(
            'buildings',
            String(building.id),
            localizedLabel(building.label, locale),
            building.parent_id === null ? '' : (labels.get(building.parent_id) ?? ''),
            building.img,
            'construction',
            { path: 'wiki/buildings', query_params: { [DEEP_LINK_PARAMS.building]: building.id } }
        ))
        .filter((entry: GlobalSearchEntry): boolean => entry.folded !== '');
}

/**
 * Bâtiments du désert → table du wiki. Leur illustration est un grand visuel, pas une icône : le
 * résultat porte un symbole et la plage de distance en précision.
 */
export function ruinEntries(ruins: readonly Ruin[], locale: string): GlobalSearchEntry[] {
    return ruins
        .map((ruin: Ruin): GlobalSearchEntry => createEntry(
            'ruins',
            String(ruin.id),
            localizedLabel(ruin.label, locale),
            ruin.min_dist !== undefined && ruin.max_dist !== undefined ? `${ruin.min_dist}–${ruin.max_dist} km` : '',
            null,
            'landscape',
            { path: 'wiki/ruins', query_params: { [DEEP_LINK_PARAMS.ruin]: ruin.id } }
        ))
        .filter((entry: GlobalSearchEntry): boolean => entry.folded !== '');
}

/** Citoyens de la ville active → liste des citoyens de cette ville (`my-town` ou `town/<id>`). */
export function citizenEntries(citizens: readonly Citizen[], town_base_path: string): GlobalSearchEntry[] {
    return citizens
        .map((citizen: Citizen): GlobalSearchEntry => {
            const job: string = citizen.job?.value.label ?? '';
            const context: string = citizen.is_dead ? [job, $localize`Mort`].filter((part: string): boolean => part !== '').join(' · ') : job;
            return createEntry(
                'citizens',
                String(citizen.id),
                citizen.name ?? '',
                context,
                citizen.job?.value.img ?? null,
                'person',
                { path: `${town_base_path}/citizens/list`, query_params: { [DEEP_LINK_PARAMS.citizen]: citizen.id } }
            );
        })
        .filter((entry: GlobalSearchEntry): boolean => entry.folded !== '');
}

/**
 * Pages du menu latéral : les feuilles autorisées, avec leur rubrique en précision (« Wiki »,
 * « Tutoriels › Site »). Une entrée n'est retenue que si elle ET ses rubriques sont autorisées,
 * exactement comme dans le menu.
 */
export function pageEntries(routes: readonly SidenavLinks[],
                            resolvePath: (route: SidenavLinks) => string | undefined,
                            resolveLabel: (route: SidenavLinks) => string): GlobalSearchEntry[] {
    const entries: GlobalSearchEntry[] = [];
    const visit = (route: SidenavLinks, trail: readonly string[]): void => {
        if (!route.authorized()) {
            return;
        }
        const label: string = resolveLabel(route);
        if (route.children && route.children.length > 0) {
            route.children.forEach((child: SidenavLinks): void => visit(child, [...trail, label]));
            return;
        }
        const path: string | undefined = resolvePath(route);
        if (!path) {
            return;
        }
        entries.push(createEntry('pages', path, label, trail.join(' › '), null, 'article', { path, query_params: null }));
    };
    routes.forEach((route: SidenavLinks): void => visit(route, []));
    return entries.filter((entry: GlobalSearchEntry): boolean => entry.folded !== '');
}

/** Icône du type de ville, relative à `HORDES_IMG_REPO` (mêmes icônes que l'annuaire). */
const TOWN_TYPE_IMG: Readonly<Record<TownTypeId, string>> = {
    RNE: 'building/small_falsecity.gif',
    PANDE: 'icons/small_arma.gif',
    CUSTOM: 'item/item_chair.gif',
    RE: 'icons/item_map.gif'
};

/** Joueurs de l'annuaire → profil public. */
export function playerEntries(players: readonly DirectorySearchPlayerDTO[]): GlobalSearchEntry[] {
    return players
        .map((player: DirectorySearchPlayerDTO): GlobalSearchEntry => createEntry(
            'players',
            String(player.id),
            player.name ?? '',
            '',
            null,
            'account_circle',
            { path: `profile/${player.id}`, query_params: null },
            // « False » : valeur de l'API MyHordes pour un joueur sans avatar
            player.avatar && player.avatar !== 'False' ? player.avatar : null
        ))
        .filter((entry: GlobalSearchEntry): boolean => entry.folded !== '');
}

/** État affiché d'une ville : une ville terminée n'est que « Terminée », comme dans l'annuaire. */
function townStateLabel(town: DirectorySearchTownDTO): string {
    if (town.isFinished) {
        return $localize`Terminée`;
    }
    if (town.isDevasted) {
        return $localize`Dévastée`;
    }
    return town.isChaos ? $localize`Chaos` : '';
}

/**
 * Villes de l'annuaire → sa propre ville courante en mode normal, toute autre en observation (même
 * règle que l'annuaire). Les homonymes se distinguent par la saison, le type, la langue et l'état.
 */
export function townEntries(towns: readonly DirectorySearchTownDTO[], own_map_id: number | null): GlobalSearchEntry[] {
    return towns
        .map((town: DirectorySearchTownDTO): GlobalSearchEntry => {
            const context: string = [
                town.season !== null && town.season !== undefined ? $localize`Saison ${town.season}:season:` : '',
                town.townType ?? '',
                town.language ? town.language.toUpperCase() : '',
                townStateLabel(town)
            ].filter((part: string): boolean => part !== '').join(' · ');
            return createEntry(
                'towns',
                String(town.id),
                town.name ?? '',
                context,
                town.townType ? TOWN_TYPE_IMG[town.townType] : null,
                'location_city',
                own_map_id !== null && town.mapId === own_map_id
                    ? { path: 'my-town', query_params: null }
                    : { path: `town/${town.mapId}/citizens/list`, query_params: null }
            );
        })
        .filter((entry: GlobalSearchEntry): boolean => entry.folded !== '');
}
