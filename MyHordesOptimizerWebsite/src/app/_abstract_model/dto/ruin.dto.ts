import { Ruin } from '../types/ruin.class';
import { I18nLabels } from './../types/_types';
import { RuinItemDTO, RuinItemDtoTransform } from './ruin-item.dto';

export class RuinDtoTransform {

    public static transformDtoArray(array: RuinDTO[] | null): Ruin[] {
        return array ? array.map((dto: RuinDTO) => this.dtoToClass(dto)) : [];
    }

    public static dtoToClass(dto: RuinDTO): Ruin {
        return {
            id: dto.id,
            camping: dto.camping,
            chance: dto.chance,
            label: dto.label,
            description: dto.description,
            explorable: dto.explorable,
            img: dto.img,
            minDist: dto.minDist,
            maxDist: dto.maxDist,
            drops: RuinItemDtoTransform.transformDtoArray(dto.drops)
        };
    }

}

export interface RuinDTO {
    id: number;
    camping: number;
    chance: number;
    label: I18nLabels;
    description: I18nLabels;
    explorable: boolean;
    img: string;
    minDist: number;
    maxDist: number;
    drops: RuinItemDTO[];
}
