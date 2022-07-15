import { ItemDTO } from './item.dto';

export interface WishlistItemDTO {
    count: number;
    bankCount: number;
    item: ItemDTO;
    priority: number;
    depot: number;
}
