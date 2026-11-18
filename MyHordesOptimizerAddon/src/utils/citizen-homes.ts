import { normalizeString } from './notifications';

export type HomeColumnBlock = 'home' | 'heroic';
export type HomeColumnKind = 'level' | 'flag' | 'charges';

export interface HomeColumn {
    key: string;
    block: HomeColumnBlock;
    kind: HomeColumnKind;
    /** Clé de `i18n/texts.ts` */
    label: string;
    /** Icône du jeu, relative à `repo_img_hordes_url` */
    icon: string;
}

export interface HomeUpdate {
    userName: string;
    updateTime: Date;
}

export type HomeCellValue = number | boolean | null;

export interface CitizenHomeRow {
    id: number;
    name: string;
    home: Record<string, HomeCellValue>;
    heroic: Record<string, HomeCellValue>;
    homeUpdate: HomeUpdate | null;
    heroicUpdate: HomeUpdate | null;
}

export interface HomeCell {
    text: string;
    empty: boolean;
}

/** `name`, `homeUpdate`, `heroicUpdate` ou la clé d'une colonne */
export type HomeSortKey = string;
export type SortDirection = 'asc' | 'desc';

const DAY_MS: number = 24 * 60 * 60 * 1000;

/** Construit une colonne. */
function column(key: string, block: HomeColumnBlock, kind: HomeColumnKind, label: string, icon: string): HomeColumn {
    return { key, block, kind, label, icon };
}

export const HOME_COLUMNS: readonly HomeColumn[] = [
    column('houseLevel', 'home', 'level', 'homes_col_house', 'home/home_lv1.gif'),
    column('kitchenLevel', 'home', 'level', 'homes_col_kitchen', 'home/kitchen.gif'),
    column('laboLevel', 'home', 'level', 'homes_col_labo', 'home/lab.gif'),
    column('chestLevel', 'home', 'level', 'homes_col_chest', 'home/chest.gif'),
    column('renfortLevel', 'home', 'level', 'homes_col_renfort', 'home/defense.gif'),
    column('restLevel', 'home', 'level', 'homes_col_rest', 'home/rest.gif'),
    column('hasAlarm', 'home', 'flag', 'homes_col_alarm', 'home/alarm.gif'),
    column('hasCurtain', 'home', 'flag', 'homes_col_curtain', 'home/curtain.gif'),
    column('hasLock', 'home', 'flag', 'homes_col_lock', 'home/lock.gif'),
    column('hasFence', 'home', 'flag', 'homes_col_fence', 'home/fence.gif'),
    column('hasRescue', 'heroic', 'flag', 'homes_col_rescue', 'emotes/gate.gif'),
    column('hasUppercut', 'heroic', 'flag', 'homes_col_uppercut', 'icons/map/map_icon_splatter.png'),
    column('hasSecondWind', 'heroic', 'flag', 'homes_col_second_wind', 'heroskill/small_pa.gif'),
    column('hasLuckyFind', 'heroic', 'flag', 'homes_col_lucky_find', 'heroskill/item_chest_hero.gif'),
    column('hasCheatDeath', 'heroic', 'flag', 'homes_col_cheat_death', 'heroskill/small_wrestle.gif'),
    column('hasHeroicReturn', 'heroic', 'flag', 'homes_col_heroic_return', 'emotes/hero.gif'),
    column('hasBreakThrough', 'heroic', 'flag', 'homes_col_break_through', 'icons/small_arma.gif'),
    column('hasBrotherInArms', 'heroic', 'flag', 'homes_col_brother_in_arms', 'heroskill/r_share.gif'),
    column('apagCharges', 'heroic', 'charges', 'homes_col_apag', 'heroskill/f_cam.gif'),
];

/** Objet non nul sous forme de dictionnaire, sinon `null`. */
function asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null;
}

/** Valeurs nombre/booléen des colonnes données, `null` sinon (dont -1, qui signifie inconnu) ; `{}` sans bloc `content`. */
function readValues(block: unknown, columns: readonly HomeColumn[]): Record<string, HomeCellValue> {
    const content: Record<string, unknown> | null = asRecord(asRecord(block)?.['content']);
    if (content === null) {
        return {};
    }
    const values: Record<string, HomeCellValue> = {};
    for (const col of columns) {
        const raw: unknown = content[col.key];
        values[col.key] = (typeof raw === 'number' && raw >= 0) || typeof raw === 'boolean' ? raw : null;
    }
    return values;
}

/** Dernière mise à jour du bloc, `null` si absente ou date invalide. */
function readUpdate(block: unknown): HomeUpdate | null {
    const info: Record<string, unknown> | null = asRecord(asRecord(block)?.['lastUpdateInfo']);
    if (info === null || typeof info['updateTime'] !== 'string') {
        return null;
    }
    const updateTime: Date = new Date(info['updateTime']);
    if (!Number.isFinite(updateTime.getTime())) {
        return null;
    }
    return { userName: typeof info['userName'] === 'string' ? info['userName'] : '', updateTime };
}

/** Lecture défensive de `{ citizens: [...] }` : les entrées sans id/nom valides ou mortes sont ignorées */
export function readCitizenHomeRows(body: unknown): CitizenHomeRow[] {
    const citizens: unknown = asRecord(body)?.['citizens'];
    if (!Array.isArray(citizens)) {
        return [];
    }
    return citizens.flatMap((entry: unknown): CitizenHomeRow[] => {
        const citizen: Record<string, unknown> | null = asRecord(entry);
        if (citizen === null || typeof citizen['id'] !== 'number' || typeof citizen['name'] !== 'string' || citizen['dead'] === true) {
            return [];
        }
        return [{
            id: citizen['id'],
            name: citizen['name'],
            home: readValues(citizen['home'], HOME_COLUMNS.filter((c: HomeColumn): boolean => c.block === 'home')),
            heroic: readValues(citizen['actionsHeroic'], HOME_COLUMNS.filter((c: HomeColumn): boolean => c.block === 'heroic')),
            homeUpdate: readUpdate(citizen['home']),
            heroicUpdate: readUpdate(citizen['actionsHeroic']),
        }];
    });
}

/** Texte d'une cellule : nombre, `✓`/`✗`, ou `—` (vide) si inconnue */
export function homeCellText(col: HomeColumn, value: HomeCellValue | undefined): HomeCell {
    if (value === null || value === undefined) {
        return { text: '—', empty: true };
    }
    if (col.kind === 'flag') {
        return { text: value === true ? '✓' : '✗', empty: false };
    }
    return { text: String(value), empty: false };
}

/** Vrai si la mise à jour date de plus de `maxDays` jours ; `null` donne faux */
export function isStale(update: HomeUpdate | null, now: Date, maxDays: number = 5): boolean {
    return update !== null && now.getTime() - update.updateTime.getTime() > maxDays * DAY_MS;
}

/** Valeur comparable d'une ligne pour la clé de tri, `null` si vide. */
function sortValue(row: CitizenHomeRow, key: HomeSortKey): number | string | null {
    if (key === 'name') {
        return normalizeString(row.name);
    }
    if (key === 'homeUpdate' || key === 'heroicUpdate') {
        return row[key]?.updateTime.getTime() ?? null;
    }
    const col: HomeColumn | undefined = HOME_COLUMNS.find((c: HomeColumn): boolean => c.key === key);
    const value: HomeCellValue | undefined = col?.block === 'heroic' ? row.heroic[key] : row.home[key];
    if (value === null || value === undefined) {
        return null;
    }
    return typeof value === 'boolean' ? (value ? 0 : 1) : value;
}

/** Nouveau tableau trié ; `true` avant `false` en croissant, cellules vides toujours en dernier */
export function sortHomeRows(rows: readonly CitizenHomeRow[], key: HomeSortKey, direction: SortDirection): CitizenHomeRow[] {
    const sign: number = direction === 'asc' ? 1 : -1;
    return [...rows].sort((a: CitizenHomeRow, b: CitizenHomeRow): number => {
        const va: number | string | null = sortValue(a, key);
        const vb: number | string | null = sortValue(b, key);
        if (va === null || vb === null) {
            return va === vb ? 0 : va === null ? 1 : -1;
        }
        if (typeof va === 'string' || typeof vb === 'string') {
            return sign * String(va).localeCompare(String(vb));
        }
        return sign * (va - vb);
    });
}

/** Lignes dont le nom contient la saisie, sans accent ni casse */
export function filterHomeRows(rows: readonly CitizenHomeRow[], search: string): CitizenHomeRow[] {
    const needle: string = normalizeString(search);
    return rows.filter((r: CitizenHomeRow): boolean => normalizeString(r.name).includes(needle));
}

/** Filtre d'une colonne : `all`/`yes`/`no` pour un oui/non, niveaux cochés (aucun = tous) sinon ; l'inconnu ne passe qu'un filtre vide */
export function passesHomeFilter(col: HomeColumn, value: HomeCellValue | undefined, filter: string | readonly string[]): boolean {
    if (col.kind === 'flag') {
        return filter === 'all' || (typeof value === 'boolean' && value === (filter === 'yes'));
    }
    return filter.length === 0 || (typeof value === 'number' && filter.includes(String(value)));
}

/** Ancienneté d'une date au format « il y a » abrégé, en minutes, heures ou jours selon l'écart */
export function relativeUpdate(date: Date, now: Date, locale: string): string {
    const minutes: number = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60000));
    const format: Intl.RelativeTimeFormat = new Intl.RelativeTimeFormat(locale, { style: 'short', numeric: 'always' });
    if (minutes < 60) {
        return format.format(-minutes, 'minute');
    }
    if (minutes < 24 * 60) {
        return format.format(-Math.floor(minutes / 60), 'hour');
    }
    return format.format(-Math.floor(minutes / (24 * 60)), 'day');
}
