import { WishlistGroupDTO } from '../dto/wishlist-group.dto';
import { WishlistDepot } from '../enum/wishlist-depot.enum';
import { CommonModel } from './_common.class';

/** Génère l'uid d'un nouveau groupe. */
export function newGroupUid(): string {
    return crypto.randomUUID();
}

export class WishlistGroup extends CommonModel<WishlistGroupDTO> {
    public uid!: string;
    public name!: string;
    public priority!: number;
    public zone_x_pa!: number;
    public depot!: WishlistDepot;
    public count!: number;

    public constructor(dto?: WishlistGroupDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): WishlistGroupDTO {
        return {
            uid: this.uid,
            name: this.name,
            priority: this.priority,
            zoneXPa: this.zone_x_pa,
            depot: this.depot.value.count,
            count: this.count
        };
    }

    protected dtoToModel(dto?: WishlistGroupDTO): void {
        if (dto) {
            this.uid = dto.uid;
            this.name = dto.name;
            this.priority = dto.priority;
            this.zone_x_pa = dto.zoneXPa;
            this.depot = WishlistDepot.getDepotFromCountAndPriority(dto.depot, dto.priority);
            this.count = dto.count;
        }
    }
}
