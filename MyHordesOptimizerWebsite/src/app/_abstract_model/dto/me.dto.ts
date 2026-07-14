import { TownDetailsDTO } from './town-details.dto';

export interface MeDTO {
    id: number;
    userName: string;
    avatar: string | null;
    townDetails: TownDetailsDTO;
}
