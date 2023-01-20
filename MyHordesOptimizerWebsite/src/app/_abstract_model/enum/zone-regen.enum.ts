import { CommonEnum, CommonEnumData } from "./_common.enum";

const NORTH_KEY: string = 'Norden';
const NORTHEAST_KEY: string = 'Nordosten';
const EAST_KEY: string = 'Osten';
const SOUTHEAST_KEY: string = 'Südosten';
const SOUTH_KEY: string = 'Süden';
const SOUTHWEST_KEY: string = 'Südwesten';
const WEST_KEY: string = 'Westen';
const NORTHWEST_KEY: string = 'Nordwesten';

const NORTH_DATA: ZoneRegenData = { label: $localize`Nord`, class: 'north' };
const NORTHEAST_DATA: ZoneRegenData = { label: $localize`Nord-Est`, class: 'north-east' };
const EAST_DATA: ZoneRegenData = { label: $localize`Est`, class: 'east' };
const SOUTHEAST_DATA: ZoneRegenData = { label: $localize`Sud-Est`, class: 'south-east' };
const SOUTH_DATA: ZoneRegenData = { label: $localize`Sud`, class: 'south' };
const SOUTHWEST_DATA: ZoneRegenData = { label: $localize`Sud-Ouest`, class: 'south-west' };
const WEST_DATA: ZoneRegenData = { label: $localize`Ouest`, class: 'west' };
const NORTHWEST_DATA: ZoneRegenData = { label: $localize`Nord-Ouest`, class: 'north-west' };


/** Type de champs de propriétés existants */
export class ZoneRegen extends CommonEnum {
    static NORTH: ZoneRegen = new ZoneRegen(NORTH_KEY, NORTH_DATA);
    static NORTHEAST: ZoneRegen = new ZoneRegen(NORTHEAST_KEY, NORTHEAST_DATA);
    static EAST: ZoneRegen = new ZoneRegen(EAST_KEY, EAST_DATA);
    static SOUTHEAST: ZoneRegen = new ZoneRegen(SOUTHEAST_KEY, SOUTHEAST_DATA);
    static SOUTH: ZoneRegen = new ZoneRegen(SOUTH_KEY, SOUTH_DATA);
    static SOUTHWEST: ZoneRegen = new ZoneRegen(SOUTHWEST_KEY, SOUTHWEST_DATA);
    static WEST: ZoneRegen = new ZoneRegen(WEST_KEY, WEST_DATA);
    static NORTHWEST: ZoneRegen = new ZoneRegen(NORTHWEST_KEY, NORTHWEST_DATA);

    /**
     * Le constructeur privé empêche la création d'autres instances de cette classe.
     *
     * @param {string} key
     * @param {ZoneRegenData} value
     */
    protected constructor(public override key: string, public override value: ZoneRegenData) {
        super(key, value);
    }

    public getLabel(): string {
        return this.value.label;
    }

}

interface ZoneRegenData extends CommonEnumData {
    label: string;
    class: string;
}
