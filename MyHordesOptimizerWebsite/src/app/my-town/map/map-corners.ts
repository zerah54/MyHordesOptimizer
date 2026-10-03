/** Type de carte : chacun colore les cases selon sa propre échelle. */
export type MapType = 'digs' | 'danger' | 'trash' | 'scout';

/** Emplacement d'une information dans une case de la carte. */
export type CornerPosition = 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';

/** Information qu'un coin de case peut afficher. */
export type CornerInfo =
    'none'
    | 'note'
    | 'citizens'
    | 'control_points'
    | 'zombies'
    | 'zombies_killed'
    | 'digs_remaining'
    | 'digs_success'
    | 'excavated'
    | 'items'
    | 'distance_km'
    | 'distance_pa'
    | 'update_age'
    | 'trash';

export type CornerLayout = Record<CornerPosition, CornerInfo>;
export type CornerLayouts = Record<MapType, CornerLayout>;

export interface CornerInfoOption {
    value: CornerInfo;
    label: string;
    /** Exemple de valeur, pour une information sans icône : le coin n'y montre qu'un nombre ou une durée. */
    sample?: string;
}

/** Choix tel que le panneau Affichage le présente : libellé, et icône du jeu ou exemple de valeur. */
export interface CornerInfoView extends CornerInfoOption {
    /** Relative à HORDES_IMG_REPO, `null` pour une information sans icône. */
    icon: string | null;
}

export const MAP_TYPES: readonly MapType[] = ['digs', 'danger', 'scout', 'trash'];

/** Ordre de lecture : il sert aussi d'ordre de rendu, donc d'ordre dans le DOM. */
export const CORNER_POSITIONS: readonly CornerPosition[] = ['top_left', 'top_right', 'bottom_left', 'bottom_right'];

/** Choix proposés dans le panneau Affichage, dans l'ordre de la liste. */
export const CORNER_INFO_OPTIONS: readonly CornerInfoOption[] = [
    { value: 'none', label: $localize`Rien` },
    { value: 'note', label: $localize`Note` },
    { value: 'citizens', label: $localize`Citoyens présents` },
    { value: 'control_points', label: $localize`Points de contrôle` },
    { value: 'zombies', label: $localize`Zombies` },
    { value: 'zombies_killed', label: $localize`Zombies tués` },
    { value: 'digs_remaining', label: $localize`Fouilles restantes`, sample: '7' },
    { value: 'digs_success', label: $localize`Fouilles réussies enregistrées` },
    { value: 'excavated', label: $localize`Zone excavée` },
    { value: 'items', label: $localize`Objets au sol` },
    { value: 'distance_km', label: $localize`Distance (km)` },
    { value: 'distance_pa', label: $localize`Distance (PA)` },
    // Même message que l'ancienneté affichée dans les cases (map-cell) : même traduction.
    { value: 'update_age', label: $localize`Ancienneté de la mise à jour`, sample: $localize`${5}:hours:h` },
    { value: 'trash', label: $localize`Valeur de la décharge`, sample: '15' }
];

/** Icône du jeu de chaque information de coin, relative à HORDES_IMG_REPO. Absente : valeur seule. */
const CORNER_ICONS: Readonly<Partial<Record<CornerInfo, string>>> = {
    note: 'icons/small_talk.gif',
    citizens: 'log/citizen.gif',
    control_points: 'emotes/human.gif',
    zombies: 'icons/small_zombie.gif',
    zombies_killed: 'icons/map/map_icon_splatter.png',
    digs_success: 'icons/small_gather.gif',
    excavated: 'professions/dig.gif',
    items: 'emotes/bag.gif',
    distance_km: 'emotes/explo.gif'
};

/** Icône d'une information de coin, `null` sans icône. Celle des PA porte la lettre de la langue (pas de suffixe en allemand). */
export function cornerIcon(info: CornerInfo, locale: string): string | null {
    if (info === 'distance_pa') {
        return 'icons/ap_small' + (locale === 'de' ? '' : '_' + locale) + '.gif';
    }
    return CORNER_ICONS[info] ?? null;
}

/** Les choix du panneau, indexés par information, avec leur icône pour la langue donnée. */
export function cornerInfoViews(locale: string): Readonly<Record<CornerInfo, CornerInfoView>> {
    const views: Partial<Record<CornerInfo, CornerInfoView>> = {};
    for (const option of CORNER_INFO_OPTIONS) {
        views[option.value] = { ...option, icon: cornerIcon(option.value, locale) };
    }
    return <Record<CornerInfo, CornerInfoView>>views;
}

/**
 * Disposition par défaut : celle d'avant le réglage.
 * - En haut à droite, la case affichait l'icône de citoyen avec `nb_hero`… qui n'est pas un
 *   nombre de citoyens : c'est le champ `h` de MyHordes, la somme des points de contrôle des
 *   citoyens présents (`JSONv1Controller::getDetailsData`), le plus souvent inconnue (0). On y
 *   lisait « 0 » sur des cases occupées. Le coin montre désormais le nombre de citoyens, sous la
 *   même icône ; les points de contrôle restent proposés, sous leur vrai nom.
 * - Le nombre de tas d'un bâtiment enseveli n'est pas une information de coin : il est toujours
 *   posé sur le carré du bâtiment, comme l'icône de ruine (map-cell). Une disposition enregistrée
 *   qui le plaçait dans un coin (`ruin_digs`, retiré) reprend le défaut de ce coin.
 */
export const DEFAULT_CORNERS: Readonly<CornerLayouts> = {
    digs: { top_left: 'note', top_right: 'citizens', bottom_left: 'none', bottom_right: 'digs_remaining' },
    danger: { top_left: 'note', top_right: 'citizens', bottom_left: 'zombies_killed', bottom_right: 'zombies' },
    // Les zombies, remplacés par l'estimation d'un éclaireur quand elle est plus récente : ce que
    // l'éclaireur voit au radar. Le coin restait vide jusqu'à la version 2 des dispositions.
    scout: { top_left: 'note', top_right: 'citizens', bottom_left: 'none', bottom_right: 'zombies' },
    trash: { top_left: 'note', top_right: 'citizens', bottom_left: 'none', bottom_right: 'trash' }
};

/**
 * Version des dispositions par défaut, enregistrée avec les options. Une disposition enregistrée
 * sous une version antérieure, et restée à l'ancien défaut de son type, passe au nouveau.
 */
export const CORNERS_VERSION: number = 2;

/**
 * Défauts remplacés, par version qui les a changés, tels qu'ils sortent du nettoyage : l'ancien
 * défaut d'exploration avait `ruin_digs` en bas à gauche, devenu `none` (information retirée).
 */
const LEGACY_DEFAULTS: readonly { version: number; type: MapType; layout: CornerLayout }[] = [
    { version: 2, type: 'scout', layout: { top_left: 'note', top_right: 'citizens', bottom_left: 'none', bottom_right: 'none' } }
];

const KNOWN_INFOS: ReadonlySet<string> = new Set(CORNER_INFO_OPTIONS.map((option: CornerInfoOption): string => option.value));

function isSameLayout(a: CornerLayout, b: CornerLayout): boolean {
    return CORNER_POSITIONS.every((position: CornerPosition): boolean => a[position] === b[position]);
}

/**
 * Recompose une disposition lue dans le stockage local : un type ou un coin absent (réglage
 * antérieur à l'option) ou une valeur inconnue (réglage corrompu, information retirée) reprend
 * sa valeur par défaut, sans perdre le reste. Une disposition restée à un défaut remplacé depuis
 * `stored_version` prend le nouveau : sans version enregistrée, c'est la 1.
 */
export function sanitizeCorners(stored: unknown, stored_version: number = CORNERS_VERSION): CornerLayouts {
    const source: Partial<Record<MapType, Partial<Record<CornerPosition, unknown>>>> =
        stored !== null && typeof stored === 'object' ? <Partial<Record<MapType, Partial<Record<CornerPosition, unknown>>>>>stored : {};
    const layouts: Partial<CornerLayouts> = {};
    for (const type of MAP_TYPES) {
        const stored_layout: Partial<Record<CornerPosition, unknown>> = source[type] ?? {};
        const layout: Partial<CornerLayout> = {};
        for (const position of CORNER_POSITIONS) {
            const value: unknown = stored_layout[position];
            layout[position] = typeof value === 'string' && KNOWN_INFOS.has(value) ? <CornerInfo>value : DEFAULT_CORNERS[type][position];
        }
        layouts[type] = <CornerLayout>layout;
    }
    for (const legacy of LEGACY_DEFAULTS) {
        const layout: CornerLayout | undefined = layouts[legacy.type];
        if (stored_version < legacy.version && layout && isSameLayout(layout, legacy.layout)) {
            layouts[legacy.type] = { ...DEFAULT_CORNERS[legacy.type] };
        }
    }
    return <CornerLayouts>layouts;
}
