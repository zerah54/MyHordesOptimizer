import { I18nLabels } from '../types/_types';
import { RuinItemDTO } from './ruin-item.dto';

export interface RuinDTO {
    id: number | string;
    camping: number;
    chance: number;
    label: I18nLabels;
    description: I18nLabels;
    explorable: boolean;
    img: string;
    minDist: number;
    maxDist: number;
    drops: RuinItemDTO[];
    capacity?: number;
}
