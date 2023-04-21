import { ItemCountDTO } from './item-count.dto';
import { UpdateInfoDTO } from './update-info.dto';

export interface BagDTO {
    idBag: number;
    items: ItemCountDTO[];
    lastUpdateInfo: UpdateInfoDTO;
}
