import { RuinItem } from './ruin-item.class';
import { Common } from './_common.class';
import { I18nLabels } from "./_types";

export interface Ruin extends Common {
    id: number;
    camping: number;
    chance: number;
    label: I18nLabels;
    description: I18nLabels;
    explorable: boolean;
    img: string;
    minDist: number;
    maxDist: number;
    drops: RuinItem[];
}
