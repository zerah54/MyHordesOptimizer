import { CitizenDTO } from './citizen.dto';

export interface CleanUpTypeDTO {
    id: number;
    name?: string;
    myHordesApiName?: string;
}

export interface CleanUpDTO {
    idCleanUp: number;
    citizenCleanUp?: CitizenDTO;
    type?: CleanUpTypeDTO;
}
