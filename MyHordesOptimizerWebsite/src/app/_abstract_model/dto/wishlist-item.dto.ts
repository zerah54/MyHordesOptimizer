import { ItemDTO } from './item.dto';

export interface WishlistItemDTO {
    count: number;
    bankCount: number;
    bagCount: number;
    bagCitizens: string[];
    item: ItemDTO;
    priority: number;
    depot: number;
    shouldSignal: boolean;
    zoneXPa: number;
}
