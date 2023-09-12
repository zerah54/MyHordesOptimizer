import { CommonEnum, CommonEnumData } from './_common.enum';

const DONT_WANT_KEY: string = 'DONT_WANT';
const NONE_KEY: string = 'NONE';
const BAD_KEY: string = 'BAD';
const MEDIUM_KEY: string = 'MEDIUM';
const GOOD_KEY: string = 'GOOD';

const DONT_WANT_DATA: WishlistPriorityData = { count: -1, label: $localize`Ne pas ramener` };
const NONE_DATA: WishlistPriorityData = { count: 0, label: $localize`Non définie` };
const BAD_DATA: WishlistPriorityData = { count: 1, label: $localize`Basse` };
const MEDIUM_DATA: WishlistPriorityData = { count: 2, label: $localize`Moyenne` };
const GOOD_DATA: WishlistPriorityData = { count: 3, label: $localize`Haute` };

/** Type de champs de propriétés existants */
export class WishlistPriority extends CommonEnum {
    static DONT_WANT: WishlistPriority = new WishlistPriority(DONT_WANT_KEY, DONT_WANT_DATA);
    static NONE: WishlistPriority = new WishlistPriority(NONE_KEY, NONE_DATA);
    static BAD: WishlistPriority = new WishlistPriority(BAD_KEY, BAD_DATA);
    static MEDIUM: WishlistPriority = new WishlistPriority(MEDIUM_KEY, MEDIUM_DATA);
    static GOOD: WishlistPriority = new WishlistPriority(GOOD_KEY, GOOD_DATA);

    /**
     * Le constructeur privé empêche la création d'autres instances de cette classe.
     *
     * @param {string} key
     * @param {ZoneRegenData} value
     */
    protected constructor(public override key: string, public override value: WishlistPriorityData) {
        super(key, value);
    }

    public getLabel(): string {
        return this.value.label;
    }

    public static getPriorityFromCount(count: number): WishlistPriority {
        return (<WishlistPriority[]>WishlistPriority.getAllValues()).find((priority: WishlistPriority) => priority.value.count === count) || WishlistPriority.NONE;
    }

    public static getPriorityMainFromPriority(priority: number): WishlistPriority {
        if (priority < 0) {
            return WishlistPriority.DONT_WANT;
        } else if (priority < 1000) {
            return WishlistPriority.NONE;
        } else if (priority < 2000) {
            return WishlistPriority.BAD;
        } else if (priority < 3000) {
            return WishlistPriority.MEDIUM;
        } else {
            return WishlistPriority.GOOD;
        }
    }
}

interface WishlistPriorityData extends CommonEnumData {
    count: number;
    label: string;
}
