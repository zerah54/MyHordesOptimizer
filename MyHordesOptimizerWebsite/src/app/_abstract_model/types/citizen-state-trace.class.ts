import { CitizenStateStepResultDTO, CitizenStateTraceDTO } from '../dto/citizen-state-trace.dto';
import { CommonModel } from './_common.class';
import { CitizenState } from './citizen-state.class';

export class CitizenStateStepResult extends CommonModel<CitizenStateStepResultDTO> {
    public description: string = '';
    public state_after!: CitizenState;

    public constructor(dto?: CitizenStateStepResultDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): CitizenStateStepResultDTO {
        return { description: this.description, stateAfter: this.state_after.modelToDto() };
    }

    protected dtoToModel(dto?: CitizenStateStepResultDTO): void {
        if (dto) {
            this.description = dto.description;
            this.state_after = new CitizenState(dto.stateAfter);
        }
    }
}

export class CitizenStateTrace extends CommonModel<CitizenStateTraceDTO> {
    public starting_state!: CitizenState;
    public steps: CitizenStateStepResult[] = [];

    public constructor(dto?: CitizenStateTraceDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): CitizenStateTraceDTO {
        return {
            startingState: this.starting_state.modelToDto(),
            steps: this.steps.map((step: CitizenStateStepResult) => step.modelToDto()),
        };
    }

    protected dtoToModel(dto?: CitizenStateTraceDTO): void {
        if (dto) {
            this.starting_state = new CitizenState(dto.startingState);
            this.steps = (dto.steps ?? []).map((step: CitizenStateStepResultDTO) => new CitizenStateStepResult(step));
        }
    }
}
