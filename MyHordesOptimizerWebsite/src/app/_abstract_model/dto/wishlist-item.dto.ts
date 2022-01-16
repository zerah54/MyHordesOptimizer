import { DictionaryUtils } from './../../shared/utilities/dictionary.util';
import { WishlistItem } from './../types/wishlist-item.class';
import { Dictionary } from './../types/_types';
import { ItemDTO, ItemDtoTransform } from './item.dto';

export class WishlistItemDtoTransform {

    public static transformDtoDictionary(dictionary: Dictionary<WishlistItemDTO>): WishlistItem[] {
        return (<WishlistItemDTO[]>DictionaryUtils.getValues(dictionary)).map((dto: WishlistItemDTO) => this.dtoToClass(dto));
    }

    public static dtoToClass(dto: WishlistItemDTO): WishlistItem {
        return {
            count: dto.count,
            bank_count: dto.bankCount,
            item: ItemDtoTransform.dtoToClass(dto.item),
            priority: dto.priority
        };
    }

}

export interface WishlistItemDTO {
    count: number;
    bankCount: number;
    item: ItemDTO;
    priority: number;
}
