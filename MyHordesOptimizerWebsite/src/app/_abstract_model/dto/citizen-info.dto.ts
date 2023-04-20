import { UpdateInfoDTO } from './update-info.dto';
import { CitizenDTO } from './citizen.dto';
import { Dictionary } from '../types/_types';

export interface CitizenInfoDTO {
    citizens: Dictionary<CitizenDTO>;
    lastUpdateInfo: UpdateInfoDTO;
}
