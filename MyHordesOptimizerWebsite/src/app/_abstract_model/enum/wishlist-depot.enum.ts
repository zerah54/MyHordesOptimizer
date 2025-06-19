import { CommonEnum, CommonEnumData } from './_common.enum';

const NONE_KEY: string = 'NONE';
const BANK_KEY: string = 'BANK';
const TELEPORT_KEY: string = 'TELEPORT';
const DO_NOT_BRING_BACK_KEY: string = 'DO_NOT_BRING_BACK';

const DO_NOT_BRING_BACK_DATA: WishlistDepotData = { count: -1000, label: $localize`Ne pas ramener` };
const NONE_DATA: WishlistDepotData = { count: -1, label: $localize`Non défini` };
const BANK_DATA: WishlistDepotData = { count: 0, label: $localize`Banque` };
const TELEPORT_DATA: WishlistDepotData = { count: 1, label: $localize`Zone de rapatriement` };

/** Type de champs de propriétés existants */
export class WishlistDepot extends CommonEnum {
    static NONE: WishlistDepot = new WishlistDepot(NONE_KEY, NONE_DATA);
    static BANK: WishlistDepot = new WishlistDepot(BANK_KEY, BANK_DATA);
    static TELEPORT: WishlistDepot = new WishlistDepot(TELEPORT_KEY, TELEPORT_DATA);
    static DO_NOT_BRING_BACK: WishlistDepot = new WishlistDepot(DO_NOT_BRING_BACK_KEY, DO_NOT_BRING_BACK_DATA);

    /**
     * Le constructeur privé empêche la création d'autres instances de cette classe.
     *
     * @param {string} key
     * @param {ZoneRegenData} value
     */
    protected constructor(public override key: string, public override value: WishlistDepotData) {
        super(key, value);
    }

    public getLabel(): string {
        return this.value.label;
    }

    public static getDepotFromCountAndPriority(count: number, priority: number): WishlistDepot {
        if (priority < 0) {
            return WishlistDepot.DO_NOT_BRING_BACK;
        }
        return (<WishlistDepot[]>WishlistDepot.getAllValues()).find((depot: WishlistDepot) => depot.value.count === count) || WishlistDepot.NONE;
    }
}

interface WishlistDepotData extends CommonEnumData {
    count: number;
    label: string;
}
