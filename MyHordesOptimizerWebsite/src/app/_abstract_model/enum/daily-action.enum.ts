import { CommonEnum, CommonEnumData } from './_common.enum';
import { JobEnum } from './job.enum';

const HOME_POOL_DATA: DailyActionEnumData = { label: $localize`Prendre un bain`, img: 'building/small_pool.gif', building: 'small_pool_#00' };
const HOME_SHOWER_DATA: DailyActionEnumData = { label: $localize`Se doucher`, img: 'building/small_shower.gif', building: 'small_shower_#00' };
const HOME_CLEAN_DATA: DailyActionEnumData = { label: $localize`Ranger mon habitat`, img: 'building/small_trashclean.gif' };
const HOME_REST_DATA: DailyActionEnumData = { label: $localize`Faire une sieste`, img: 'home/rest.gif' };
const HOME_DEFBUFF_DATA: DailyActionEnumData = {
    label: $localize`Organiser les défenses`, img: 'building/small_watchmen.gif', building: 'small_watchmen_#00', ap: 2, job_ap: { job: JobEnum.GUARDIAN.key, ap: 1 }
};
const HOME_CROWS_DATA: DailyActionEnumData = { label: $localize`Cartographier le désert`, img: 'building/small_lair.gif', building: 'small_watchmen_#01', ap: 1 };
const HOME_SURVIVALIST_DATA: DailyActionEnumData = { label: $localize`Trouver de l’eau`, img: 'building/small_survarea.gif', building: 'small_survarea_#00', ap: 3 };
const HOME_CONTEMPLATE_DATA: DailyActionEnumData = { label: $localize`Se recueillir`, img: 'building/small_spa4souls.gif', building: 'small_spa4souls_#01', ap: 2 };
const HOME_SCAVENGE_DATA: DailyActionEnumData = {
    label: $localize`Creuser dans les galeries`, img: 'building/small_gallery.gif', building: 'small_gallery_#00', ap: 2, job_ap: { job: JobEnum.SCAVENGER.key, ap: 1, max_uses: 3 }
};

/** Actions faisables une fois par jour depuis sa maison, dont celles qu'apporte un chantier construit. */
export class DailyActionEnum extends CommonEnum {
    public static HOME_POOL: DailyActionEnum = new DailyActionEnum('home_pool', HOME_POOL_DATA);
    public static HOME_SHOWER: DailyActionEnum = new DailyActionEnum('home_shower', HOME_SHOWER_DATA);
    public static HOME_CLEAN: DailyActionEnum = new DailyActionEnum('home_clean', HOME_CLEAN_DATA);
    public static HOME_REST: DailyActionEnum = new DailyActionEnum('home_rest', HOME_REST_DATA);
    public static HOME_DEFBUFF: DailyActionEnum = new DailyActionEnum('home_defbuff', HOME_DEFBUFF_DATA);
    public static HOME_CROWS: DailyActionEnum = new DailyActionEnum('home_crows', HOME_CROWS_DATA);
    public static HOME_SURVIVALIST: DailyActionEnum = new DailyActionEnum('home_survivalist', HOME_SURVIVALIST_DATA);
    public static HOME_CONTEMPLATE: DailyActionEnum = new DailyActionEnum('home_contemplate', HOME_CONTEMPLATE_DATA);
    public static HOME_SCAVENGE: DailyActionEnum = new DailyActionEnum('home_scavenge', HOME_SCAVENGE_DATA);

    public constructor(public override key: string, public override value: DailyActionEnumData) {
        super(key, value);
    }

    /**
     * Libellé officiel de l'action.
     * @returns {string} Libellé traduit.
     */
    public getLabel(): string {
        return this.value.label;
    }
}

interface DailyActionEnumData extends CommonEnumData {
    label: string;
    img: string;
    /** Uid du chantier sans lequel l'action n'existe pas. */
    building?: string;
    /** PA dépensés par utilisation (0 si absent) ; une seule utilisation par jour. */
    ap?: number;
    /**
     * Règle propre à un métier (clé de `JobEnum`) : PA par utilisation et nombre d'utilisations par jour (1 si absent).
     * 1 PA pour le Gardien ; jusqu'à 3 fouilles à 1 PA pour le Fouineur.
     */
    job_ap?: { job: string; ap: number; max_uses?: number };
}

/**
 * Nombre d'utilisations par jour d'une action pour un citoyen, selon son métier.
 * @param {DailyActionEnum} action Action.
 * @param {string | null} job_key Clé `JobEnum` du métier, nulle si inconnu.
 * @returns {number} Utilisations possibles (au moins 1).
 */
export function dailyActionMaxUses(action: DailyActionEnum, job_key: string | null): number {
    return action.value.job_ap !== undefined && action.value.job_ap.job === job_key ? Math.max(1, action.value.job_ap.max_uses ?? 1) : 1;
}

/**
 * PA d'une action pour un citoyen, selon son métier et le nombre d'utilisations prévues.
 * @param {DailyActionEnum} action Action.
 * @param {string | null} job_key Clé `JobEnum` du métier, nulle si inconnu.
 * @param {number | null} [uses] Utilisations prévues, ramenées entre 1 et le maximum ; toutes celles possibles si absent.
 * @returns {number} PA.
 */
export function dailyActionAp(action: DailyActionEnum, job_key: string | null, uses: number | null = null): number {
    const max_uses: number = dailyActionMaxUses(action, job_key);
    const count: number = uses === null ? max_uses : Math.min(max_uses, Math.max(1, Math.trunc(uses)));
    const per_use: number = action.value.job_ap !== undefined && action.value.job_ap.job === job_key ? action.value.job_ap.ap : (action.value.ap ?? 0);
    return per_use * count;
}

/**
 * Actions à afficher : celles sans chantier, et celles dont le chantier est construit.
 * @param {ReadonlySet<string> | null} built_uids Uids des chantiers construits ; nul si inconnu (supposés non construits).
 * @returns {DailyActionEnum[]} Actions, dans l'ordre du référentiel.
 */
export function displayableDailyActions(built_uids: ReadonlySet<string> | null): DailyActionEnum[] {
    return DailyActionEnum.getAllValues<DailyActionEnum>()
        .filter((action: DailyActionEnum): boolean => action.value.building === undefined || (built_uids?.has(action.value.building) ?? false));
}
