import { ItemDTO } from './item.dto';

export interface WishlistItemDTO {
    count: number;
    bankCount: number;
    bagCount: number;
    item: ItemDTO;
    priority: number;
    depot: number;
    shouldSignal: boolean;
    zoneXPa: number;
}
