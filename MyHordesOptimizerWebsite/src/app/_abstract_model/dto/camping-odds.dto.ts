import { I18nLabels } from '../types/_types';

export interface CampingOddsDTO {
    probability: number;
    boundedProbability: number;
    label: I18nLabels;
}
