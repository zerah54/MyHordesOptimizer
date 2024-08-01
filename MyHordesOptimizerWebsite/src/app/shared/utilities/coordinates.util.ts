import { TownDetails } from '../../_abstract_model/types/town-details.class';

export function getArrayXFromDisplayedX(displayed_x: number, town: TownDetails | null): number {
    return displayed_x + (town?.town_x || 0);
}

export function getArrayYFromDisplayedY(displayed_y: number, town: TownDetails | null): number {
    return (town?.town_y || 0) - displayed_y;
}

export function getDisplayedXFromArrayX(array_x: number, town: TownDetails | null): number {
    return array_x - (town?.town_x || 0);
}

export function getDisplayedYFromArrayY(array_y: number, town: TownDetails | null): number {
    return (town?.town_y || 0) - array_y;
}
