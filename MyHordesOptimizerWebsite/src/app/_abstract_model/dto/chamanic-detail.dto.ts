import { UpdateInfoDTO } from './update-info.dto';

export interface ChamanicDetailDTO {
    nbPotionChaman: number;
    isImmuneToSoul: boolean;
    lastUpdateInfo?: UpdateInfoDTO;
}
