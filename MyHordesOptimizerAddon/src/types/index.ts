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
    label: I18nLabel;
    description?: I18nLabel;
    category?: { id: string; label: I18nLabel };
    properties?: MhoItemProperty[];
    actions?: MhoItemProperty[];
    recipes?: any[];
    drops?: MhoDrop[];
    deco?: number;
    isHeaver?: boolean;
    isCum?: boolean;
    isProtected?: boolean;

    [key: string]: any;
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
    home?: { level?: number };
    ban?: boolean;
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
    depot: number;
    priority: number;
    zone_x_pa: number;
    isWorkshop: boolean;

    [key: string]: any;
}

export interface ApiWishlist {
    wishList?: WishlistItem[];
    lastUpdateInfo?: { updateTime: string; userName: string };

    [key: string]: any;
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
export interface ExpeditionPart {
    citizen?: ApiCitizen;
    orders?: string;
    position?: number;

    [key: string]: any;
}

export interface ApiExpedition {
    id?: number;
    parts?: ExpeditionPart[];

    [key: string]: any;
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
    tooltips_observer: MutationObserver | undefined;
    loading_area_observer: MutationObserver | undefined;
    bank_observer: MutationObserver | undefined;
    anti_abuse_controller: AbortController | undefined;
    advanced_tooltips_observer: MutationObserver | undefined;
    is_refresh_wishlist: boolean | undefined;
    has_new_changelog: boolean;
    is_error: boolean;
    mh_notifications: any[];
}
