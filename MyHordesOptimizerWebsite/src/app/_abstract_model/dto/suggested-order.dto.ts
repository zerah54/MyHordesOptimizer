import { CitizenStateDTO } from './citizen-state.dto';

export interface SuggestedOrderDTO {
    label: string;
    order: number[];
    finalState: CitizenStateDTO;
}
