import { HeroSkillFamily, HeroSkillLevels } from '../types/hero-skill-levels';
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
/** `BeyondController::trash_api` : 1 PA, `TrashSearchLimit` 3, +1 Fouineur, +1 avec `super_recluse2` (groupe R, Expert). */
const TRASH_DATA: DailyActionEnumData = {
    label: $localize`Fouiller les déchets`, img: 'icons/small_trash.gif', ap: 1, max_uses: 3, planning_only: true,
    job_ap: { job: JobEnum.SCAVENGER.key, ap: 1, max_uses: 4 }, hero_bonus: { family: 'r', min_level: 3, uses: 1 }
};
/** `home_heal_1` (blessure) et `home_heal_2` / `home_heal_3` (infection) : 5 PA chacune, une fois par jour. */
const HOME_HEAL_DATA: DailyActionEnumData = {
    label: $localize`Se soigner`, img: 'building/small_infirmary.gif', building: 'small_infirmary_#00', ap: 5, max_uses: 2, default_uses: 1, planning_only: true
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
    public static TRASH: DailyActionEnum = new DailyActionEnum('trash', TRASH_DATA);
    public static HOME_HEAL: DailyActionEnum = new DailyActionEnum('home_heal', HOME_HEAL_DATA);

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
    /** PA dépensés par utilisation (0 si absent). */
    ap?: number;
    /** Utilisations par jour (1 si absent). */
    max_uses?: number;
    /** Utilisations proposées pour une nouvelle consigne (toutes si absent). */
    default_uses?: number;
    /** Utilisations en plus à partir d'un niveau d'un groupe de compétences héroïques (niveau inconnu : accordées). */
    hero_bonus?: { family: HeroSkillFamily; min_level: number; uses: number };
    /** Absente des pages Citoyens : seulement proposée comme consigne de l'outil Chantiers. */
    planning_only?: boolean;
    /**
     * Règle propre à un métier (clé de `JobEnum`) : PA par utilisation et nombre d'utilisations par jour (1 si absent).
     * 1 PA pour le Gardien ; jusqu'à 3 fouilles à 1 PA pour le Fouineur.
     */
    job_ap?: { job: string; ap: number; max_uses?: number };
}

/**
 * Nombre d'utilisations par jour d'une action pour un citoyen, selon son métier et ses compétences héroïques.
 * @param {DailyActionEnum} action Action.
 * @param {string | null} job_key Clé `JobEnum` du métier, nulle si inconnu.
 * @param {HeroSkillLevels | null} [hero_skills] Niveaux des compétences héroïques, nuls si inconnus.
 * @returns {number} Utilisations possibles (au moins 1).
 */
export function dailyActionMaxUses(action: DailyActionEnum, job_key: string | null, hero_skills: HeroSkillLevels | null = null): number {
    const job_match: boolean = action.value.job_ap !== undefined && action.value.job_ap.job === job_key;
    const base: number = Math.max(1, (job_match ? action.value.job_ap?.max_uses : action.value.max_uses) ?? 1);
    const bonus: { family: HeroSkillFamily; min_level: number; uses: number } | undefined = action.value.hero_bonus;
    if (bonus === undefined) {
        return base;
    }
    const level: number | null = hero_skills === null ? null : hero_skills[bonus.family];
    return base + (level === null || level >= bonus.min_level ? bonus.uses : 0);
}

/**
 * Utilisations proposées pour une nouvelle consigne d'action.
 * @param {DailyActionEnum} action Action.
 * @param {string | null} job_key Clé `JobEnum` du métier, nulle si inconnu.
 * @param {HeroSkillLevels | null} [hero_skills] Niveaux des compétences héroïques, nuls si inconnus.
 * @returns {number} Utilisations.
 */
export function dailyActionDefaultUses(action: DailyActionEnum, job_key: string | null, hero_skills: HeroSkillLevels | null = null): number {
    const max_uses: number = dailyActionMaxUses(action, job_key, hero_skills);
    return Math.min(action.value.default_uses ?? max_uses, max_uses);
}

/**
 * Action qui peut faire l'objet d'une consigne : elle dépend d'un chantier ou coûte des PA.
 * @param {DailyActionEnum} action Action.
 * @returns {boolean} Vrai si planifiable.
 */
export function isPlannableAction(action: DailyActionEnum): boolean {
    return action.value.building !== undefined || action.value.ap !== undefined;
}

/**
 * PA d'une action pour un citoyen, selon son métier et le nombre d'utilisations prévues.
 * @param {DailyActionEnum} action Action.
 * @param {string | null} job_key Clé `JobEnum` du métier, nulle si inconnu.
 * @param {number | null} [uses] Utilisations prévues, ramenées entre 1 et le maximum ; toutes celles possibles si absent.
 * @param {HeroSkillLevels | null} [hero_skills] Niveaux des compétences héroïques, nuls si inconnus.
 * @returns {number} PA.
 */
export function dailyActionAp(action: DailyActionEnum, job_key: string | null, uses: number | null = null, hero_skills: HeroSkillLevels | null = null): number {
    const max_uses: number = dailyActionMaxUses(action, job_key, hero_skills);
    const count: number = uses === null ? max_uses : Math.min(max_uses, Math.max(1, Math.trunc(uses)));
    const per_use: number = action.value.job_ap !== undefined && action.value.job_ap.job === job_key ? action.value.job_ap.ap : (action.value.ap ?? 0);
    return per_use * count;
}

/**
 * Actions à afficher : celles sans chantier, et celles dont le chantier est construit ; sans celles propres à l'outil Chantiers.
 * @param {ReadonlySet<string> | null} built_uids Uids des chantiers construits ; nul si inconnu (supposés non construits).
 * @returns {DailyActionEnum[]} Actions, dans l'ordre du référentiel.
 */
export function displayableDailyActions(built_uids: ReadonlySet<string> | null): DailyActionEnum[] {
    return planningDailyActions(built_uids).filter((action: DailyActionEnum): boolean => action.value.planning_only !== true);
}

/**
 * Actions de l'outil Chantiers : celles sans chantier, et celles dont le chantier est construit (ou terminé dans la journée).
 * @param {ReadonlySet<string> | null} built_uids Uids des chantiers construits ; nul si inconnu (supposés non construits).
 * @returns {DailyActionEnum[]} Actions, dans l'ordre du référentiel.
 */
export function planningDailyActions(built_uids: ReadonlySet<string> | null): DailyActionEnum[] {
    return DailyActionEnum.getAllValues<DailyActionEnum>()
        .filter((action: DailyActionEnum): boolean => action.value.building === undefined || (built_uids?.has(action.value.building) ?? false));
}
