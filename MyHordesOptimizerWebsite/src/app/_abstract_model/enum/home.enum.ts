import { I18nLabels } from "../types/_types";
import { CommonEnum, CommonEnumData } from "./_common.enum";

const HOUSE_LEVEL_KEY: string = 'houseLevel';
const HAS_ALARM_KEY: string = 'hasAlarm';
const CHEST_LEVEL_KEY: string = 'chestLevel';
const HAS_CURTAIN_KEY: string = 'hasCurtain';
const HOUSE_DEFENSE_KEY: string = 'renfortLevel';
const KITCHEN_LEVEL_KEY: string = 'kitchenLevel';
const LAB_LEVEL_KEY: string = 'laboLevel';
const REST_LEVEL_KEY: string = 'restLevel';
const HAS_LOCK_KEY: string = 'hasLock';
const HAS_FENCE_KEY: string = 'hasFence';

const HOUSE_LABELS: I18nLabels[] = [
    {
        de: 'Feldbett',
        en: 'Camp Bed',
        es: 'Camastro',
        fr: 'Lit de camp'
    },
    {
        de: 'Zelt',
        en: 'Tent',
        es: 'Tienda',
        fr: 'Tente'
    },
    {
        de: 'Baracke',
        en: 'Hovel',
        es: 'Cuchitril',
        fr: 'Taudis'
    },
    {
        de: 'Hütte',
        en: 'Shack',
        es: 'Barraca',
        fr: 'Baraque'
    },
    {
        de: 'Haus',
        en: 'House',
        es: 'Casa',
        fr: 'Maison'
    },
    {
        de: 'Umzäuntes Haus',
        en: 'Safehouse',
        es: 'Casa enrejada',
        fr: 'Maison clôturée'
    },
    {
        de: 'Befestigte Unterkunft',
        en: 'Stronghold',
        es: 'Fuerte',
        fr: 'Abri fortifié'
    },
    {
        de: 'Bunker',
        en: 'Nuclear Bunker',
        es: 'Bunker nuclear',
        fr: 'Bunker'
    },
    {
        de: '',
        en: 'Palace',
        es: 'Castillo',
        fr: 'Château'
    }
]

const HOUSE_LEVEL_DATA: HomeEnumData = { label: $localize`Habitation`, img: '', max_lvl: 8, options: HOUSE_LABELS };
const HAS_ALARM_DATA: HomeEnumData = { label: $localize`Alarme rudimentaire `, img: 'home/alarm.gif', max_lvl: 1 };
const CHEST_LEVEL_DATA: HomeEnumData = { label: $localize`Rangements`, img: 'home/chest.gif', max_lvl: 13 };
const HAS_CURTAIN_DATA: HomeEnumData = { label: $localize`Gros rideau `, img: 'home/curtain.gif', max_lvl: 1 };
const HOUSE_DEFENSE_DATA: HomeEnumData = { label: $localize`Renforts`, img: 'home/defense.gif', max_lvl: 10 };
const KITCHEN_LEVEL_DATA: HomeEnumData = { label: $localize`Cuisine`, img: 'home/kitchen.gif', max_lvl: 4 };
const LAB_LEVEL_DATA: HomeEnumData = { label: $localize`Cave laboratoire `, img: 'home/lab.gif', max_lvl: 4 };
const REST_LEVEL_DATA: HomeEnumData = { label: $localize`Coin sieste `, img: 'home/rest.gif', max_lvl: 3 };
const HAS_LOCK_DATA: HomeEnumData = { label: $localize`Verrou`, img: 'home/lock.gif', max_lvl: 1 };
const HAS_FENCE_DATA: HomeEnumData = { label: $localize`Clôture`, img: 'home/fence.gif', max_lvl: 1 };


/** Type de champs de propriétés existants */
export class HomeEnum extends CommonEnum {
    static HOUSE_LEVEL: HomeEnum = new HomeEnum(HOUSE_LEVEL_KEY, HOUSE_LEVEL_DATA);
    static HAS_ALARM: HomeEnum = new HomeEnum(HAS_ALARM_KEY, HAS_ALARM_DATA);
    static CHEST_LEVEL: HomeEnum = new HomeEnum(CHEST_LEVEL_KEY, CHEST_LEVEL_DATA);
    static HAS_CURTAIN: HomeEnum = new HomeEnum(HAS_CURTAIN_KEY, HAS_CURTAIN_DATA);
    static HOUSE_DEFENSE: HomeEnum = new HomeEnum(HOUSE_DEFENSE_KEY, HOUSE_DEFENSE_DATA);
    static KITCHEN_LEVEL: HomeEnum = new HomeEnum(KITCHEN_LEVEL_KEY, KITCHEN_LEVEL_DATA);
    static LAB_LEVEL: HomeEnum = new HomeEnum(LAB_LEVEL_KEY, LAB_LEVEL_DATA);
    static REST_LEVEL: HomeEnum = new HomeEnum(REST_LEVEL_KEY, REST_LEVEL_DATA);
    static HAS_LOCK: HomeEnum = new HomeEnum(HAS_LOCK_KEY, HAS_LOCK_DATA);
    static HAS_FENCE: HomeEnum = new HomeEnum(HAS_FENCE_KEY, HAS_FENCE_DATA);

    /**
     * Le constructeur privé empêche la création d'autres instances de cette classe.
     *
     * @param {string} key
     * @param {StatusEnumData} value
     */
    protected constructor(public override key: string, public override value: HomeEnumData) {
        super(key, value);
    }

    public getLabel(): string {
        return this.value.label;
    }

}

interface HomeEnumData extends CommonEnumData {
    label: string;
    max_lvl: number;
    img: string;
    options?: I18nLabels[];
}
