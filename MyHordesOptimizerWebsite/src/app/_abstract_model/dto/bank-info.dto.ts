import { Dictionary } from '../types/_types';
import { BankItemDTO } from './bank-item.dto';
import { UpdateInfoDTO } from './update-info.dto';

export interface BankInfoDTO {
    bank: Dictionary<BankItemDTO>;
    lastUpdateInfo: UpdateInfoDTO;
}
