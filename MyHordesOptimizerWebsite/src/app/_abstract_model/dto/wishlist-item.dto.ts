import { ItemDTO } from './item.dto';

export interface WishlistItemDTO {
    count: number;
    bankCount: number;
    bagCount: number;
    bagCitizens: string[];
    /** Quantité totale dans les coffres des citoyens vivants de la ville. */
    chestCount: number;
    /** Pseudos des citoyens vivants dont le coffre contient l'objet. */
    chestCitizens: string[];
    /** Quantité posée sur les cases de la carte (toutes cases de la ville confondues). */
    mapCellItemCount: number;
    item: ItemDTO;
    priority: number;
    depot: number;
    shouldSignal: boolean;
    zoneXPa: number;
}
