import { ItemDTO } from './item.dto';

export interface BankItemDTO {
    count: number;
    wishListCount: number;
    isBroken: boolean;
    item: ItemDTO;
}
