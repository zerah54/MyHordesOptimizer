import { ItemDTO } from "./item.dto";

export interface ItemCountDTO {
    count: number;
    isBroken: boolean;
    item: ItemDTO;
}
