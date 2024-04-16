import { ItemCountShortDTO } from './item-count-short.dto';
import { ItemCountDTO } from './item-count.dto';
import { UpdateInfoDTO } from './update-info.dto';

export interface BagDTO {
    idBag: number;
    items: ItemCountDTO[];
    lastUpdateInfo: UpdateInfoDTO;
}

export interface BagShortDTO {
    idBag: number;
    items: ItemCountShortDTO[];
    lastUpdateInfo: UpdateInfoDTO;
}
