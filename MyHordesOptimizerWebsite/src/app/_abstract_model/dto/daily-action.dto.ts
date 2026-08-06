import { UpdateInfoDTO } from './update-info.dto';

export interface DailyActionDTO {
    day: number;
    actionKey: string;
    lastUpdateInfo: UpdateInfoDTO;
}
