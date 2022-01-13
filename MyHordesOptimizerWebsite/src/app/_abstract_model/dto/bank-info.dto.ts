import { BankInfo } from './../types/bank-info.class';
import { BankItemDTO, BankItemDtoTransform } from './bank-item.dto';
import { UpdateInfoDTO, UpdateInfoDtoTransform } from './update-info.dto';

export class BankInfoDtoTransform {

    public static dtoToClass(dto: BankInfoDTO): BankInfo {
        return {
            bank_items: BankItemDtoTransform.transformDtoArray(dto.bank),
            update_info: UpdateInfoDtoTransform.dtoToClass(dto.lastUpdateInfo)
        };
    }
}

export interface BankInfoDTO {
    bank: BankItemDTO[];
    lastUpdateInfo: UpdateInfoDTO;
}
