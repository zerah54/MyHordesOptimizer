import { DictionaryUtils } from './../../shared/utilities/dictionary.util';
import { Dictionary } from './../types/_types';
import { BankItem } from '../types/bank-item.class';
import { ItemDTO, ItemDtoTransform } from './item.dto';

export class BankItemDtoTransform {

    public static transformDtoDictionary(dictionary: Dictionary<BankItemDTO>): BankItem[] {
        return (<BankItemDTO[]>DictionaryUtils.getValues(dictionary)).map((dto: BankItemDTO) => this.dtoToClass(dto));
    }

    public static dtoToClass(dto: BankItemDTO): BankItem {
        return {
            count: dto.count,
            wishlist_count: dto.wishListCount,
            item: ItemDtoTransform.dtoToClass(dto.item)
        };
    }

}

export interface BankItemDTO {
    count: number;
    wishListCount: number;
    item: ItemDTO;
}
