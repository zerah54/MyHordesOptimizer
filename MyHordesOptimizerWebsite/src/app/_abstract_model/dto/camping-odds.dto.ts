import { I18nLabels } from '../types/_types';

export interface CampingOddsDTO {
    probability: number;
    boundedProbability: number;
    label: I18nLabels;
    /** Contribution de chaque facteur au pourcentage brut. Absent d'une API antérieure au détail. */
    details?: Record<string, number>;
}
