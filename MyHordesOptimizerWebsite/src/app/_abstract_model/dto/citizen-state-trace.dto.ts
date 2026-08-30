import { CitizenStateDTO } from './citizen-state.dto';
import { CitizenStateStepDTO } from './citizen-state-step.dto';

export interface CitizenStateStepResultDTO {
    description: string;
    stateAfter: CitizenStateDTO;
}

export interface CitizenStateTraceDTO {
    startingState: CitizenStateDTO;
    steps: CitizenStateStepResultDTO[];
}

export interface CitizenDayStateRequestDTO {
    startingState: CitizenStateDTO;
    steps: CitizenStateStepDTO[];
}
