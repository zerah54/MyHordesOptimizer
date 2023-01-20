import { UpdateInfoDTO } from './update-info.dto';

export interface DigDTO {
    cellId?: number;
    diggerId: number;
    diggerName: string;
    x: number;
    y: number;
    day: number;
    nbSucces: number;
    nbTotalDig: number;
    lastUpdateInfo?: UpdateInfoDTO;
}
