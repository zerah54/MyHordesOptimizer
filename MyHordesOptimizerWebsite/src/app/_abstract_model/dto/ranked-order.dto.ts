import { CitizenStateDTO } from './citizen-state.dto';

export interface RankedOrderDTO {
    order: number[];
    tier: string;
    tierReachedAtDistance: number | null;
    totalDistance: number;
    finalState: CitizenStateDTO;
}
