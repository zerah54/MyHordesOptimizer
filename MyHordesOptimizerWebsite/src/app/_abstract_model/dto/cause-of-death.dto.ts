import { Dictionary } from '../types/_types';

export interface CauseOfDeathDTO {
    dtype: number;
    ref?: string;
    icon?: string;
    label?: Dictionary<string>;
    description?: Dictionary<string>;
}
