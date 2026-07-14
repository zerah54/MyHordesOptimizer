import { TownPhase } from '../types/_types';

export interface SeasonPhaseDTO {
    season: number;
    phase: TownPhase;
    isFinished: boolean;
}
