import { I18nLabels } from '../types/_types';

export interface HeroSkillDTO {
    name: string;
    description: I18nLabels;
    icon: string;
    label: I18nLabels;
    nbUses: number;
    daysNeeded: number;
}
