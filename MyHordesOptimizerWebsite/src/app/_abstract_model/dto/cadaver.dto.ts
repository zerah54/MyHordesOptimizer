import { CauseOfDeathDTO } from './cause-of-death.dto';
import { CleanUpDTO } from './clean-up.dto';

export interface CadaverDTO {
    avatar?: string;
    causeOfDeath?: CauseOfDeathDTO;
    cleanUp?: CleanUpDTO;
    id: number;
    name: string;
    score: number;
    survival: number;
    msg?: string;
    townMsg?: string;
}
