import { getTown } from './localstorage.util';

export function getArrayXFromDisplayedX(displayed_x: number): number {
    return displayed_x + (getTown()?.town_x || 0);
}

export function getArrayYFromDisplayedY(displayed_y: number): number {
    return (getTown()?.town_y || 0) - displayed_y;
}

export function getDisplayedXFromArrayX(array_x: number): number {
    return array_x - (getTown()?.town_x || 0);
}

export function getDisplayedYFromArrayY(array_y: number): number {
    return (getTown()?.town_y || 0) - array_y;
}
