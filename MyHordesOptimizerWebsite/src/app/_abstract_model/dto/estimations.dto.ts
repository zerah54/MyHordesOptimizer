import { MinMax } from '../interfaces';
import { Dictionary } from '../types/_types';

export interface EstimationsDTO {
    estim?: Dictionary<MinMax>;
    planif?: Dictionary<MinMax>;
    day: number;
    estimSouls?: Dictionary<number>;
    planifSouls?: Dictionary<number>;
    estimSpaLevel?: number;
    planifSpaLevel?: number;
}
