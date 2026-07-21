import { Dictionary } from '../types/_types';
import { CitizenDTO } from './citizen.dto';
import { UpdateInfoDTO } from './update-info.dto';

export interface CitizenInfoDTO {
    citizens: Dictionary<CitizenDTO>;
    lastUpdateInfo: UpdateInfoDTO;
}
