import { Dictionary } from '../types/_types';
import { CommonEnum, CommonEnumData } from './_common.enum';

const NORTH_KEY: string = 'Norden';
const NORTHEAST_KEY: string = 'Nordosten';
const EAST_KEY: string = 'Osten';
const SOUTHEAST_KEY: string = 'Südosten';
const SOUTH_KEY: string = 'Süden';
const SOUTHWEST_KEY: string = 'Südwesten';
const WEST_KEY: string = 'Westen';
const NORTHWEST_KEY: string = 'Nordwesten';

const NORTH_DATA: DirectionData = {label: $localize`Nord`, class: 'north', diag: false, order_by: 1, accessible: true};
const NORTHEAST_DATA: DirectionData = {label: $localize`Nord-Est`, class: 'north-east', diag: true, order_by: 2, accessible: false};
const EAST_DATA: DirectionData = {label: $localize`Est`, class: 'east', diag: false, order_by: 3, accessible: true};
const SOUTHEAST_DATA: DirectionData = {label: $localize`Sud-Est`, class: 'south-east', diag: true, order_by: 4, accessible: false};
const SOUTH_DATA: DirectionData = {label: $localize`Sud`, class: 'south', diag: false, order_by: 5, accessible: true};
const SOUTHWEST_DATA: DirectionData = {label: $localize`Sud-Ouest`, class: 'south-west', diag: true, order_by: 6, accessible: false};
const WEST_DATA: DirectionData = {label: $localize`Ouest`, class: 'west', diag: false, order_by: 7, accessible: true};
const NORTHWEST_DATA: DirectionData = {label: $localize`Nord-Ouest`, class: 'north-west', diag: true, order_by: 8, accessible: false};


/** Type de champs de propriétés existants */
export class Direction extends CommonEnum {
    static NORTH: Direction = new Direction(NORTH_KEY, NORTH_DATA);
    static NORTHEAST: Direction = new Direction(NORTHEAST_KEY, NORTHEAST_DATA);
    static EAST: Direction = new Direction(EAST_KEY, EAST_DATA);
    static SOUTHEAST: Direction = new Direction(SOUTHEAST_KEY, SOUTHEAST_DATA);
    static SOUTH: Direction = new Direction(SOUTH_KEY, SOUTH_DATA);
    static SOUTHWEST: Direction = new Direction(SOUTHWEST_KEY, SOUTHWEST_DATA);
    static WEST: Direction = new Direction(WEST_KEY, WEST_DATA);
    static NORTHWEST: Direction = new Direction(NORTHWEST_KEY, NORTHWEST_DATA);

    /**
     * Le constructeur privé empêche la création d'autres instances de cette classe.
     *
     * @param {string} key
     * @param {DirectionData} value
     */
    protected constructor(public override key: string, public override value: DirectionData) {
        super(key, value);
    }

    public getLabel(): string {
        return this.value.label;
    }

    public static getSelectedDirections(directions: Dictionary<boolean>): string[] {
        return Object.keys(directions);
    }

}

interface DirectionData extends CommonEnumData {
    label: string;
    class: string;
    diag: boolean;
    order_by: number;
    accessible: boolean;
}
