import { CitizenDTO } from './citizen.dto';
import { CitizenExpeditionDTO } from './citizen-expedition.dto';

/** Faits du jour qui décident de l'affichage de « Mon programme ». */
export interface DailyProgramFactsDTO {
    isCitizen: boolean;
    hasEffectivePlan: boolean;
    isPlaced: boolean;
    openPlaces: CitizenExpeditionDTO[];
    me: CitizenDTO | null;
}
