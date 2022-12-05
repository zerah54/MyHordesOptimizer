import { ItemCountDTO } from "./item-count.dto";

export interface BagDTO {
    idBag: number;
    items: ItemCountDTO[];
    lastUpdateUserName: string;
    lastUpdateDateUpdate: Date;
}
