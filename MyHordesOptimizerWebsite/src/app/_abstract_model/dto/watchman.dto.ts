import { CitizenDTO } from './citizen.dto';

export interface WatchmanDTO {
    id?: number; // Identifiant du veilleur, pas lié à celui de MHO
    citizen?: CitizenDTO;
}
