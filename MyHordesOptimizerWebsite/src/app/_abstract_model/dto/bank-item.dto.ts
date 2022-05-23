import { ItemDTO } from './item.dto';

export interface BankItemDTO {
    count: number;
    wishListCount: number;
    item: ItemDTO;
}
