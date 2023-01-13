import { CommonEnum, CommonEnumData } from "./_common.enum";

const HAS_RESCUE_KEY: string = 'hasRescue';
const APAG_CHARGES_KEY: string = 'apagCharges';
const HAS_UPPERCUT_KEY: string = 'hasUppercut';
const HAS_SECONDWIND_KEY: string = 'hasSecondWind';
const HAS_LUCKYFIND_KEY: string = 'hasLuckyFind';
const HAS_CHEATDEATH_KEY: string = 'hasCheatDeath';
const HAS_HEROICRETURN_KEY: string = 'hasHeroicReturn';
const HAS_BREAKTHROUGH_KEY: string = 'hasBreakThrough';
const HAS_BROTHERSINARM_KEY: string = 'hasBrotherInArms';

const HAS_RESCUE_DATA: HeroicActionEnumData = { label: $localize`Sauvetage`, max_lvl: 1 };
const APAG_CHARGES_DATA: HeroicActionEnumData = { label: $localize`Appareil Photo d'Avant-Guerre`, max_lvl: 3 };
const HAS_UPPERCUT_DATA: HeroicActionEnumData = { label: $localize`Uppercut Sauvage`, max_lvl: 1 };
const HAS_SECONDWIND_DATA: HeroicActionEnumData = { label: $localize`Second Souffle`, max_lvl: 1 };
const HAS_LUCKYFIND_DATA: HeroicActionEnumData = { label: $localize`Trouvaille`, max_lvl: 1 };
const HAS_CHEATDEATH_DATA: HeroicActionEnumData = { label: $localize`Vaincre la Mort`, max_lvl: 1 };
const HAS_HEROICRETURN_DATA: HeroicActionEnumData = { label: $localize`Retour du Héro`, max_lvl: 1 };
const HAS_BREAKTHROUGH_DATA: HeroicActionEnumData = { label: $localize`Passage en Force`, max_lvl: 1 };
const HAS_BROTHERSINARM_DATA: HeroicActionEnumData = { label: $localize`Camaraderie`, max_lvl: 1 };


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
    // static HAS_BROTHERSINARM: HeroicActionEnum = new HeroicActionEnum(HAS_BROTHERSINARM_KEY, HAS_BROTHERSINARM_DATA);

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
}
