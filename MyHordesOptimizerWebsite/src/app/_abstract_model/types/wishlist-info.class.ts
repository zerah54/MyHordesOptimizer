import { DictionaryUtils } from 'src/app/shared/utilities/dictionary.util';
import { WishlistItemDTO } from '../dto/wishlist-item.dto';
import { WishlistInfoDTO } from './../dto/wishlist-info.dto';
import { UpdateInfo } from './update-info.class';
import { WishlistItem } from './wishlist-item.class';
import { CommonModel, modelArrayToDictionnary } from './_common.class';

export class WishlistInfo extends CommonModel<WishlistInfoDTO> {
    public wishlist_items!: WishlistItem[];
    public update_info!: UpdateInfo;

    constructor(dto?: WishlistInfoDTO | null) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): WishlistInfoDTO {
        return {
            wishList: modelArrayToDictionnary(this.wishlist_items, 'item.xml_name'),
            lastUpdateInfo: this.update_info?.modelToDto()
        };
    };

    protected dtoToModel(dto?: WishlistInfoDTO | null): void {
        if (dto) {
            this.wishlist_items = (<WishlistItemDTO[]>DictionaryUtils.getValues(dto?.wishList)).map((item_dto: WishlistItemDTO) => new WishlistItem(item_dto));
            this.update_info = new UpdateInfo(dto.lastUpdateInfo)
        }
    };

}
