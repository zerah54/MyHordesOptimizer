import { RuinItem } from '../types/ruin-item.class';
import { ItemDTO, ItemDtoTransform } from './item.dto';

export class RuinItemDtoTransform {

    public static transformDtoArray(array: RuinItemDTO[] | null): RuinItem[] {
        return array ? array.map((dto: RuinItemDTO) => this.dtoToClass(dto)) : [];
    }

    public static dtoToClass(dto: RuinItemDTO): RuinItem {
        return {
            probability: dto.probability,
            weight: dto.weight,
            item: ItemDtoTransform.dtoToClass(dto.item)
        };
    }

}

export interface RuinItemDTO {
    probability: number;
    weight: number;
    item: ItemDTO;
}
