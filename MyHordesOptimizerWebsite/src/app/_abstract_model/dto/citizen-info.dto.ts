import { UpdateInfoDTO } from './update-info.dto';
import { Dictionary } from 'src/app/_abstract_model/types/_types';
import { CitizenDTO } from './citizen.dto';

export interface CitizenInfoDTO {
    citizens: Dictionary<CitizenDTO>;
    lastUpdateInfo: UpdateInfoDTO;
};
