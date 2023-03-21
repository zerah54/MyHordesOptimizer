import { Dictionary } from '../types/_types';
import { MinMax } from '../interfaces';

export interface EstimationsDTO {
    estim?: Dictionary<MinMax>;
    planif?: Dictionary<MinMax>;
    day: number;
}
