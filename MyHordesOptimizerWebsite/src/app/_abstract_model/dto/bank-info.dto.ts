import { BankInfo } from './../types/bank-info.class';
import { Dictionary } from './../types/_types';
import { BankItemDTO, BankItemDtoTransform } from './bank-item.dto';
import { UpdateInfoDTO, UpdateInfoDtoTransform } from './update-info.dto';

export class BankInfoDtoTransform {

    public static dtoToClass(dto: BankInfoDTO | null): BankInfo {
        return {
            bank_items: dto ? BankItemDtoTransform.transformDtoDictionary(dto.bank) : [],
            update_info: dto ? UpdateInfoDtoTransform.dtoToClass(dto.lastUpdateInfo ? dto.lastUpdateInfo : null) : null
        };
    }
}

export interface BankInfoDTO {
    bank: Dictionary<BankItemDTO>;
    lastUpdateInfo: UpdateInfoDTO | null;
}
