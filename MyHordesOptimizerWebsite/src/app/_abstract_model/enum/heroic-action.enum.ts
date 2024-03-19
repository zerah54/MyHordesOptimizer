import { CommonEnum, CommonEnumData } from './_common.enum';


const HAS_RESCUE_KEY: string = 'hasRescue';
const APAG_CHARGES_KEY: string = 'apagCharges';
const HAS_UPPERCUT_KEY: string = 'hasUppercut';
const HAS_SECONDWIND_KEY: string = 'hasSecondWind';
const HAS_LUCKYFIND_KEY: string = 'hasLuckyFind';
const HAS_CHEATDEATH_KEY: string = 'hasCheatDeath';
const HAS_HEROICRETURN_KEY: string = 'hasHeroicReturn';
const HAS_BREAKTHROUGH_KEY: string = 'hasBreakThrough';
const HAS_BROTHERSINARM_KEY: string = 'hasBrotherInArms';

const HAS_RESCUE_LABEL: string = $localize`Sauvetage`;
const APAG_CHARGES_LABEL: string = $localize`Appareil Photo d'Avant-Guerre`;
const HAS_UPPERCUT_LABEL: string = $localize`Uppercut Sauvage`;
const HAS_SECONDWIND_LABEL: string = $localize`Second Souffle`;
const HAS_LUCKYFIND_LABEL: string = $localize`Trouvaille`;
const HAS_CHEATDEATH_LABEL: string = $localize`Vaincre la Mort`;
const HAS_HEROICRETURN_LABEL: string = $localize`Retour du Héros`;
const HAS_BREAKTHROUGH_LABEL: string = $localize`Passage en Force`;
const HAS_BROTHERSINARM_LABEL: string = $localize`Camaraderie`;

const HAS_RESCUE_DATA: HeroicActionEnumData = { label: HAS_RESCUE_LABEL, max_lvl: 1, img: 'emotes/gate.gif' };
const APAG_CHARGES_DATA: HeroicActionEnumData = {
    label: APAG_CHARGES_LABEL,
    max_lvl: 3,
    img: 'heroskill/f_cam.gif',
    options: Array.from({ length: 4 }, (_: unknown, i: number) => i)
};
const HAS_UPPERCUT_DATA: HeroicActionEnumData = { label: HAS_UPPERCUT_LABEL, max_lvl: 1, img: 'icons/map/map_icon_splatter.png' };
const HAS_SECONDWIND_DATA: HeroicActionEnumData = { label: HAS_SECONDWIND_LABEL, max_lvl: 1, img: 'heroskill/small_pa.gif' };
const HAS_LUCKYFIND_DATA: HeroicActionEnumData = { label: HAS_LUCKYFIND_LABEL, max_lvl: 1, img: 'heroskill/item_chest_hero.gif' };
const HAS_CHEATDEATH_DATA: HeroicActionEnumData = { label: HAS_CHEATDEATH_LABEL, max_lvl: 1, img: 'heroskill/small_wrestle.gif' };
const HAS_HEROICRETURN_DATA: HeroicActionEnumData = { label: HAS_HEROICRETURN_LABEL, max_lvl: 1, img: 'emotes/hero.gif' };
const HAS_BREAKTHROUGH_DATA: HeroicActionEnumData = { label: HAS_BREAKTHROUGH_LABEL, max_lvl: 1, img: 'icons/small_arma.gif' };
const HAS_BROTHERSINARM_DATA: HeroicActionEnumData = { label: HAS_BROTHERSINARM_LABEL, max_lvl: 1, img: 'heroskill/r_share.gif' };


/** Type de champs de propriétés existants */
export class HeroicActionEnum extends CommonEnum {
    static HAS_RESCUE: HeroicActionEnum = new HeroicActionEnum(HAS_RESCUE_KEY, HAS_RESCUE_DATA);
    static APAG_CHARGE: HeroicActionEnum = new HeroicActionEnum(APAG_CHARGES_KEY, APAG_CHARGES_DATA);
    static HAS_UPPERCUT: HeroicActionEnum = new HeroicActionEnum(HAS_UPPERCUT_KEY, HAS_UPPERCUT_DATA);
    static HAS_SECONDWIND: HeroicActionEnum = new HeroicActionEnum(HAS_SECONDWIND_KEY, HAS_SECONDWIND_DATA);
    static HAS_LUCKYFIND: HeroicActionEnum = new HeroicActionEnum(HAS_LUCKYFIND_KEY, HAS_LUCKYFIND_DATA);
    static HAS_CHEATDEATH: HeroicActionEnum = new HeroicActionEnum(HAS_CHEATDEATH_KEY, HAS_CHEATDEATH_DATA);
    static HAS_HEROICRETURN: HeroicActionEnum = new HeroicActionEnum(HAS_HEROICRETURN_KEY, HAS_HEROICRETURN_DATA);
    static HAS_BREAKTHROUGH: HeroicActionEnum = new HeroicActionEnum(HAS_BREAKTHROUGH_KEY, HAS_BREAKTHROUGH_DATA);
    static HAS_BROTHERSINARM: HeroicActionEnum = new HeroicActionEnum(HAS_BROTHERSINARM_KEY, HAS_BROTHERSINARM_DATA);

    /**
     * Le constructeur privé empêche la création d'autres instances de cette classe.
     *
     * @param {string} key
     * @param {StatusEnumData} value
     */
    protected constructor(public override key: string, public override value: HeroicActionEnumData) {
        super(key, value);
    }

    public getLabel(): string {
        return this.value.label;
    }

}

interface HeroicActionEnumData extends CommonEnumData {
    label: string;
    max_lvl: number;
    img: string;
    options?: number[];
}
