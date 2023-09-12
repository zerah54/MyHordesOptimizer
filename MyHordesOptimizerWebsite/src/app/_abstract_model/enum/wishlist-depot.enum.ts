import { CommonEnum, CommonEnumData } from './_common.enum';

const NONE_KEY: string = 'NONE';
const BANK_KEY: string = 'BANK';
const TELEPORT_KEY: string = 'TELEPORT';

const NONE_DATA: WishlistDepotData = { count: -1, label: $localize`Non défini` };
const BANK_DATA: WishlistDepotData = { count: 0, label: $localize`Banque` };
const TELEPORT_DATA: WishlistDepotData = { count: 1, label: $localize`Zone de rapatriement` };

/** Type de champs de propriétés existants */
export class WishlistDepot extends CommonEnum {
    static NONE: WishlistDepot = new WishlistDepot(NONE_KEY, NONE_DATA);
    static BANK: WishlistDepot = new WishlistDepot(BANK_KEY, BANK_DATA);
    static TELEPORT: WishlistDepot = new WishlistDepot(TELEPORT_KEY, TELEPORT_DATA);

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

    public static getDepotFromCount(count: number): WishlistDepot {
        return (<WishlistDepot[]>WishlistDepot.getAllValues()).find((depot: WishlistDepot) => depot.value.count === count) || WishlistDepot.BANK;
    }
}

interface WishlistDepotData extends CommonEnumData {
    count: number;
    label: string;
}
