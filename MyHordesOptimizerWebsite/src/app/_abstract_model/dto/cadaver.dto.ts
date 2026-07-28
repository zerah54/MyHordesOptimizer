import { CauseOfDeathDTO } from './cause-of-death.dto';
import { CleanUpDTO } from './clean-up.dto';

export interface CadaverDTO {
    avatar?: string;
    causeOfDeath?: CauseOfDeathDTO;
    cleanUp?: CleanUpDTO;
    id: number;
    name: string;
    /** Points d ame du citoyen (et non le score de la ville). */
    soulPoints: number | null;
    survival: number;
    msg?: string;
    townMsg?: string;
}
