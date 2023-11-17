import { TownTypeId } from '../../_abstract_model/types/_types';

const const_ratio_base: number = 0.5;
const const_ratio_low: number = 0.75;
const conf_attack_by_mode: Record<TownTypeId, number> = {
    RE: 1.1,
    PANDE: 3.1,
    RNE: const_ratio_low,
};

function getMinRatio(day: number, town_type: TownTypeId): number {
    const max_ratio: number = conf_attack_by_mode[town_type];
    if (day <= 3) {
        return const_ratio_low;
    } else {
        return max_ratio;
    }
}

function getMaxRatio(day: number, town_type: TownTypeId): number {
    const max_ratio: number = conf_attack_by_mode[town_type];
    if (day <= 1) {
        return const_ratio_base;
    } else if (day <= 3) {
        return const_ratio_low;
    } else {
        return max_ratio;
    }
}

export function getMinAttack(day: number, town_type: TownTypeId): number {
    town_type = 'RE';
    return Math.round(getMinRatio(day, town_type) * Math.pow(Math.max(1, day - 1) * 0.75 + 2.5, 3));
}

export function getMaxAttack(day: number, town_type: TownTypeId): number {
    town_type = 'RE';
    return Math.round(getMaxRatio(day, town_type) * Math.pow(day * 0.75 + 3.5, 3));
}
