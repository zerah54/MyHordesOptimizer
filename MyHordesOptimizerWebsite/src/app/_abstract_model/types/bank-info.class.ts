import { BankItem } from 'src/app/_abstract_model/types/bank-item.class';
import { DictionaryUtils } from 'src/app/shared/utilities/dictionary.util';
import { BankInfoDTO } from '../dto/bank-info.dto';
import { BankItemDTO } from '../dto/bank-item.dto';
import { UpdateInfo } from './update-info.class';
import { CommonModel, dtoToModelArray, modelArrayToDictionnary } from './_common.class';

export class BankInfo extends CommonModel<BankInfoDTO> {
    bank_items: BankItem[] = [];
    update_info!: UpdateInfo;

    constructor(dto?: BankInfoDTO | null) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): BankInfoDTO {
        return {
            bank: modelArrayToDictionnary(this.bank_items, 'item.xml_name'),
            lastUpdateInfo: this.update_info.modelToDto()
        }
    };

    protected dtoToModel(dto?: BankInfoDTO | null): void {
        if (dto) {
            this.bank_items = dtoToModelArray(BankItem, <BankItemDTO[]>DictionaryUtils.getValues(dto.bank));
            this.update_info = new UpdateInfo(dto.lastUpdateInfo);
        }
    };
}
