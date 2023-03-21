import { DictionaryUtils } from 'src/app/shared/utilities/dictionary.util';
import { BankInfoDTO } from '../dto/bank-info.dto';
import { BankItemDTO } from '../dto/bank-item.dto';
import { Item } from './item.class';
import { UpdateInfo } from './update-info.class';
import { CommonModel, modelArrayToDictionnary } from './_common.class';

export class BankInfo extends CommonModel<BankInfoDTO> {
    public items: Item[] = [];
    public update_info!: UpdateInfo;

    constructor(dto?: BankInfoDTO | null) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): BankInfoDTO {
        return {
            bank: modelArrayToDictionnary([], 'item.id'),
            lastUpdateInfo: this.update_info?.modelToDto()
        };
    }

    protected dtoToModel(dto?: BankInfoDTO | null): void {
        if (dto) {
            this.items = [];
            (<BankItemDTO[]>DictionaryUtils.getValues(dto.bank)).forEach((bank_item: BankItemDTO) => {
                const item: Item = new Item(bank_item.item);
                item.is_broken = bank_item.isBroken;
                this.items.push(item);
            });
            this.update_info = new UpdateInfo(dto.lastUpdateInfo);
        }
    }
}
