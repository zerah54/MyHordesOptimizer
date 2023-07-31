import { TownType } from '../../_abstract_model/types/_types';

function getMinRatio(day: number, town_type: TownType): number {
    if (day <= 3 || town_type === 'RNE') {
        return 0.66;
    } else {
        return town_type === 'RE' ? 1 : 3;
    }
}

function getMaxRatio(day: number, town_type: TownType): number {
    if (day <= 1) {
        return 0.4;
    } else if (town_type === 'RNE') {
        return 0.66;
    } else {
        return town_type === 'RE' ? 1 : 3;
    }
}

export function getMinAttack(day: number, town_type: TownType): number {
    town_type;
    return Math.floor(getMinRatio(day, 'RE') * Math.pow(Math.max(1, day - 1) * 0.75 + 2.5, 3));
}

export function getMaxAttack(day: number, town_type: TownType): number {
    town_type;
    return Math.ceil(getMaxRatio(day, 'RE') * Math.pow(day * 0.75 + 3.5, 3));
}
