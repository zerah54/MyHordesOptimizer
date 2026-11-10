// ==========================================================================
// Shared type definitions for the MyHordes Optimizer addon.
// These types describe: i18n label shapes, API response shapes, the
// shared mutable `state` object, and configuration data shapes.
// ==========================================================================

export type Lang = 'fr' | 'en' | 'de' | 'es';
export type I18nLabel = Record<Lang, string>;

// ---------------------------------------------------------------------
// Items / Ruins / Recipes / Status (API entities)
// ---------------------------------------------------------------------
export interface MhoItem {
    id: number;
    img: string;
    imgBroken?: string | null;
    label: I18nLabel;
    description?: I18nLabel;
    category?: { id: string; label: I18nLabel };
    properties?: string[];
    actions?: string[];
    recipes?: any[];
    drops?: MhoDrop[];
    deco?: number;
    isHeaver?: boolean;
    isCum?: boolean;
    isProtected?: boolean;
    /** Objets permettant d'ouvrir celui-ci. `null` si ce n'est pas un contenant. */
    openedWith?: MhoItemSummary[] | null;
    /** Contenants que cet objet permet d'ouvrir. */
    opens?: MhoItemSummary[];
    /** Coût en PA d'une tentative d'ouverture sans outil, pour un contenant à risque d'échec (ex. coffre-fort). */
    openApCost?: number | null;
    /** Chance de réussite (0..1) associée à `openApCost`. */
    openSuccessRate?: number | null;
    /** Coût en PC de l'alternative réservée au métier Technicien à l'outil requis, si elle existe. */
    technicianOpenCpCost?: number | null;
    /** Effet catapulte réel de l'objet. `null`/absent si l'objet n'est pas catapultable. */
    catapultEffect?: MhoCatapultEffect | null;
    /** Quantité totale dans les sacs des citoyens vivants de la ville. */
    bagCount?: number;
    /** Quantité totale dans les coffres des citoyens vivants de la ville. */
    chestCount?: number;
    /** Quantité posée sur les cases de la carte (toutes cases de la ville confondues). */
    mapCellItemCount?: number;
    /** Effets des actions du jeu liées à l'objet (ouvrir, découper, purifier, attaquer, veille). */
    actionEffects?: MhoItemActionEffects[];
    /** Distribution du nombre de charges à la recharge. */
    reloadCharges?: MhoChargeChance[] | null;
    /** Bonus de survie en veille (0 = aucun). */
    watchImpact?: number;
    /** Places supplémentaires d'inventaire (sac). */
    bagCapacityBonus?: number | null;
    /** Sacs dont un seul peut être porté à la fois. */
    bagExclusiveGroup?: MhoItemSummary[] | null;
    /** Probabilité (0..1) de l'objet par fouille réussie sur une zone épuisée. */
    dropRatePraf?: number;
    /** Probabilité (0..1) de l'objet par fouille réussie sur une zone non épuisée. */
    dropRateNotPraf?: number;

    [key: string]: any;
}

/** Issue possible d'une action. */
export interface MhoActionOutcome {
    kind: 'Consumed' | 'Broken' | 'Transformed' | 'Produced' | 'Kill';
    probability: number;
    item?: MhoItemSummary | null;
    quantity?: number | null;
    killMin?: number | null;
    killMax?: number | null;
}

/** Effets d'une action du jeu liée à un objet. */
export interface MhoItemActionEffects {
    actionName: string;
    kind: 'Open' | 'Slaughter' | 'Purify' | 'Attack' | 'Nightwatch';
    apCost?: number | null;
    buildingCondition?: { buildingUid: string; built: boolean } | null;
    appliesToTown?: boolean | null;
    viaLoadedForm?: MhoItemSummary | null;
    outcomes: MhoActionOutcome[];
}

/** Probabilité d'obtenir un nombre de charges à la recharge. */
export interface MhoChargeChance {
    charges: number;
    probability: number;
}

/** Représentation minimale d'un objet dans une relation objet↔objet (ex. boîtes/ouvre-boîtes). */
export interface MhoItemSummary {
    uid: string;
    img: string;
    imgBroken?: string | null;
    label: I18nLabel;
}

/** Effet catapulte réel d'un objet — remplace l'ancienne propriété booléenne `fragile`. */
export interface MhoCatapultEffect {
    fate: 'Intact' | 'Broken' | 'Transformed' | 'Destroyed';
    /** Renseigné seulement si `fate` vaut `'Transformed'`. */
    morphTarget?: MhoItemSummary | null;
    killMin?: number | null;
    killMax?: number | null;
    /** Renseigné seulement pour une variante de répulsion sans mise à mort. */
    repelSeconds?: number | null;
    /** Renseigné si `killMin` ou `repelSeconds` l'est. */
    radius?: 'Target' | 'Cross' | 'Square' | null;
}

export interface MhoItemProperty {
    id: string;
    label: I18nLabel;
    description?: I18nLabel;
    icon?: string;

    [key: string]: any;
}

export interface MhoDrop {
    item: MhoItem;
    probability: number;

    [key: string]: any;
}

export interface MhoRuin {
    id: number | string;
    img: string;
    label: I18nLabel;
    description: I18nLabel;
    camping: number;
    minDist: number;
    maxDist: number;
    drops: MhoDrop[];
    capacity: number;

    [key: string]: any;
}

export interface MhoRecipe {
    id?: string | number;
    type: { id: string; label: I18nLabel } | string;
    components: MhoItem[];
    result: { item: MhoItem; probability: number }[];
    provoking?: MhoItem;

    [key: string]: any;
}

// ---------------------------------------------------------------------
// API: auth / user / citizens
// ---------------------------------------------------------------------
export interface ApiToken {
    token?: { accessToken?: string; validTo?: string };
    simpleMe?: ApiMhUser;

    [key: string]: any;
}

export interface ApiMhUser {
    id?: number;
    pseudo?: string;
    townDetails?: {
        id?: number;
        townId?: number;
        day?: number;
        type?: string;
        hard_mode?: boolean;
        door_closed?: boolean;
        [key: string]: any;
    };

    [key: string]: any;
}

export interface ApiCitizen {
    id?: number;
    pseudo?: string;
    avatar?: string;
    job?: { id: string; label: I18nLabel };
    heroicActions?: string[];
    dailyActions?: { day: number; actionKey: string }[];
    home?: { content?: Record<string, number | boolean> };
    /** Banni de la ville (`CitizenDto.IsShunned`) */
    isShunned?: boolean;
    out?: boolean;
    dead?: boolean;

    [key: string]: any;
}

// ---------------------------------------------------------------------
// API: wishlist / bank
// ---------------------------------------------------------------------
export interface WishlistItem {
    item: MhoItem;
    count: number;
    bankCount: number;
    bagCount: number;
    /** Quantité totale dans les coffres des citoyens vivants de la ville. */
    chestCount: number;
    /** Pseudos des citoyens vivants dont le coffre contient l'objet. */
    chestCitizens: string[];
    /** Quantité posée sur les cases de la carte (toutes cases de la ville confondues). */
    mapCellItemCount: number;
    depot: number;
    priority: number;
    zoneXPa: number;
    isWorkshop: boolean;
    shouldSignal: boolean;
}

export interface ApiWishlist {
    wishList?: WishlistItem[];
    lastUpdateInfo?: { updateTime: string; userName: string };
}

/** Note privée de l'utilisateur sur une ville, un citoyen (pour une ville) ou un joueur */
export interface NoteDto {
    note?: string;
    updatedAt?: string;
}

export interface BankItem {
    item: MhoItem;
    count: number;
    isBroken: boolean;

    [key: string]: any;
}

// ---------------------------------------------------------------------
// API: map
// ---------------------------------------------------------------------
export interface MapZone {
    x: number;
    y: number;
    type?: string;
    digs?: number;
    danger?: number;
    cells?: any[];

    [key: string]: any;
}

export interface ApiMap {
    townId?: number;
    towns?: any[];
    zones?: MapZone[];
    cells?: any[];

    [key: string]: any;
}

// ---------------------------------------------------------------------
// API: expeditions / estimations / camping
// ---------------------------------------------------------------------
/** Case de la carte en coordonnées absolues (`MapCell.X/Y` côté API : y croît vers le sud). */
export interface ApiMapPoint {
    x: number;
    y: number;
}

/** Consigne typée ; `null` pour un texte libre. */
export type ApiExpeditionOrderKind = 'pick' | 'drop' | 'use' | 'clear' | 'explore' | 'excavate' | 'camp' | 'hero' | 'wait';

/** `GET expeditions/me/{day}` : une consigne, générale ou posée sur une case. */
export interface ApiExpeditionOrder {
    id?: number | null;
    /** `checkbox` (à cocher) ou `text` (information) */
    type?: string | null;
    /** Texte libre mis en forme (HTML de l'éditeur du site) ; vide pour une consigne typée */
    text?: string | null;
    isDone?: boolean | null;
    position?: number | null;
    /** Case visée, en coordonnées absolues ; `null` (avec `y`) pour une consigne générale */
    x?: number | null;
    y?: number | null;
    kind?: ApiExpeditionOrderKind | null;
    itemId?: number | null;
    /** Quantité (Ramasser, Déposer) ou nombre de tas (Déblayer) */
    quantity?: number | null;
    /** Action héroïque (`hero_generic_rescue`, `secondwind`, …) */
    heroSkill?: string | null;
    /** Citoyen à attendre ; `null` avec `wait` : le groupe */
    targetUserId?: number | null;
    /** Autre expédition du jour à attendre, à la place d'un citoyen */
    targetExpeditionId?: number | null;
    /** Nom de l'expédition à attendre ; `null` pour une expédition sans nom */
    targetExpeditionLabel?: string | null;
    /** Précision libre d'une consigne typée, en texte brut */
    note?: string | null;
    /** Passage sur la case, à partir de 1 ; `null` : le premier */
    passage?: number | null;
}

export interface ApiExpeditionBagItem {
    item: MhoItem;
    count?: number;
    isBroken?: boolean;
}

export interface ApiExpeditionCitizen {
    id?: number | null;
    /** Citoyen placé ; `null` pour une place encore libre */
    idUser?: number | null;
    bag?: { items?: ApiExpeditionBagItem[] | null } | null;
    orders?: ApiExpeditionOrder[] | null;
    isThirsty?: boolean | null;
    nombrePaDepart?: number | null;
    /** PE de départ exigés ; `null` pour aucune exigence */
    nombrePeDepart?: number | null;
    /** Sens de l'exigence de PE ; absent ou `null` = « au moins » */
    nombrePeDepartOperator?: 'min' | 'max' | 'exact' | null;
    /** Chaussures : `true` exigées, `false` interdites, `null` indifférent */
    isPreinscritChaussures?: boolean | null;
    preinscritJob?: string | null;
}

/** Tracé lié à une partie d'expédition */
export interface ApiExpeditionPartRoute {
    id: number;
    label: string;
    /** Clé de palette (`blue`, `violet`, …) */
    color: string;
    /** Chemin case par case, en coordonnées absolues */
    cells: ApiMapPoint[];
    /** PA du trajet : nombre de cases - 1 */
    length: number;
    version: number;
}

/** `GET MapRoutes/{mapId}` : un tracé de la ville, et les parties d'expédition qui le suivent. */
export interface ApiMapRoute extends ApiExpeditionPartRoute {
    linkedParts?: unknown[] | null;
}

export interface ApiExpeditionPart {
    id?: number | null;
    /** Consignes de toute la partie */
    orders?: ApiExpeditionOrder[] | null;
    citizens?: ApiExpeditionCitizen[] | null;
    position?: number;
    /** Nom du tracé lié (ancien « Nom du tracé ») */
    path?: string | null;
    label?: string | null;
    direction?: string | null;
    expeditionId?: number;
    mapRouteId?: number | null;
    mapRoute?: ApiExpeditionPartRoute | null;
}

export interface ApiExpedition {
    id?: number | null;
    state?: string | null;
    position?: number;
    label?: string | null;
    minPdc?: number | null;
    parts?: ApiExpeditionPart[] | null;
}

export interface ApiEstimation {
    day?: number;
    defense?: number;
    attack?: number;
    planif?: any[];

    [key: string]: any;
}

// ---------------------------------------------------------------------
// Parameters / configuration data
// ---------------------------------------------------------------------
export interface ParamOption {
    value: any;
    label: I18nLabel;

    [key: string]: any;
}

export interface ParamDefinition {
    id: string;
    label?: I18nLabel;
    type?: string;
    default?: any;
    children?: ParamDefinition[];
    options?: ParamOption[];
    help?: string | I18nLabel;
    short_label?: I18nLabel;

    [key: string]: any;
}

export interface ParamCategory {
    id: string;
    label: I18nLabel;
    params: ParamDefinition[];

    [key: string]: any;
}

export type MhoParameters = Record<string, any>;

// ---------------------------------------------------------------------
// Styles personnalisés des titres de sujets du forum
// ---------------------------------------------------------------------

/** Les propriétés visuelles applicables à un titre de sujet */
export interface ForumThreadStyle {
    /** Couleur du titre, au format `#rrggbb` ; `null` = ne pas modifier */
    color: string | null;
    /** Couleur de fond de la ligne, au format `#rrggbb` ; `null` = ne pas modifier */
    background: string | null;
    /** Couleur de la bordure gauche de la ligne, au format `#rrggbb` ; `null` = pas de bordure */
    border: string | null;
    /** Taille du titre, en pourcentage de la taille d'origine (100 = inchangée) */
    size: number;
    /** Opacité de la ligne, en pourcentage (100 = opaque) */
    opacity: number;
    /** Caractère(s) inséré(s) devant le titre ; chaîne vide = aucun */
    prefix: string;
}

/** Une règle de style : des critères de sélection et le style à appliquer */
export interface ForumThreadStyleRule {
    id: string;
    enabled: boolean;
    /** Noms techniques des tags concernés (`rp`, `help`, ...) ; vide = pas de critère de tag */
    tags: string[];
    /**
     * Mots ou expressions régulières testés sur le titre brut (insensible à la casse, une seule
     * correspondance suffit) ; vide = pas de critère de mot/regex. `(` `)` `[` `]` `{` `}` y sont
     * littéraux (pas d'échappement nécessaire) et `%DAY%` est remplacé par le jour de ville actuel
     * avant compilation, pour des règles qui suivent le jour en cours (ex. `Jour %DAY%`).
     */
    regex: string[];
    style: ForumThreadStyle;
}

/** Un tag de sujet tel que défini côté MyHordes */
export interface ForumThreadTag {
    /** Nom technique, seule valeur stable entre les langues */
    name: string;
    /** Couleur de fond du tag, au format `#rrggbb`, utilisée en dernier recours pour l'identifier */
    color: string | null;
    /** Libellé de secours, affiché dans la modale quand la page ne fournit pas les tags */
    label: I18nLabel;
}

// ---------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------
export interface TabDefinition {
    ordering: number;
    id: string;
    label?: I18nLabel;
    img?: string;

    [key: string]: any;
}

export interface TabsList {
    wiki: TabDefinition[];
    tools: TabDefinition[];

    [key: string]: TabDefinition[];
}

// ---------------------------------------------------------------------
// Informations (wiki help entries)
// ---------------------------------------------------------------------
export interface InformationDefinition {
    id: string;
    label?: I18nLabel;
    detail?: (...args: any[]) => any;
    link?: string;

    [key: string]: any;
}

// ---------------------------------------------------------------------
// Shared mutable application state.
// One single object, imported everywhere it's needed, so that
// reassignments made in one module are visible to every other module
// (plain ES-module `let` bindings cannot be reassigned from outside
// their declaring module — this object sidesteps that restriction).
// ---------------------------------------------------------------------
export interface MhoState {
    website: string;
    api_url: string;
    mho_parameters: MhoParameters | undefined;
    mh_user: ApiMhUser | undefined;
    external_app_id: string | undefined;
    token: ApiToken | undefined;
    items: MhoItem[] | undefined;
    ruins: MhoRuin[] | undefined;
    recipes: MhoRecipe[] | undefined;
    citizens: ApiCitizen[] | undefined;
    hero_skills: any[] | undefined;
    wishlist: ApiWishlist | undefined;
    parameters: any[] | undefined;
    map: ApiMap | undefined;
    current_cell: any | undefined;
    my_expeditions: ApiExpedition[] | undefined;
    /** Ville et jour de `my_expeditions` (`townId:day`), pour les recharger en changeant de jour */
    my_expeditions_key: string | undefined;
    /** Horodatage du chargement de `my_expeditions` */
    my_expeditions_loaded_at: number | undefined;
    /** Notes de ville de l'appelant, indexées par mapId */
    town_notes: Record<number, NoteDto> | undefined;
    /** Notes globales de l'appelant sur des joueurs, indexées par userId */
    user_notes: Record<number, NoteDto> | undefined;
    /** Notes de l'appelant sur les citoyens de la ville actuellement affichée, indexées par userId */
    citizen_notes: Record<number, NoteDto> | undefined;
    /** mapId de la ville couverte par `citizen_notes`, pour invalider le cache en changeant de ville */
    citizen_notes_map_id: number | undefined;
    tooltips_observer: MutationObserver | undefined;
    loading_area_observer: MutationObserver | undefined;
    anti_abuse_controller: AbortController | undefined;
    is_refresh_wishlist: boolean | undefined;
    has_new_changelog: boolean;
    is_error: boolean;
    mh_notifications: any[];
}
