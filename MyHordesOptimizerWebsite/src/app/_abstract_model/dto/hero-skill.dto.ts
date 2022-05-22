import { I18nLabels } from './../types/_types';
import { HeroSkill } from '../types/hero-skill.class';

export class HeroSkillDtoTransform {

    public static transformDtoArray(array: HeroSkillDTO[] | null): HeroSkill[] {
        return array ? array.map((dto: HeroSkillDTO) => this.dtoToClass(dto)) : [];
    }

    public static dtoToClass(dto: HeroSkillDTO): HeroSkill {
        return {
            name: dto.name,
            description: dto.description,
            icon: dto.icon,
            label: dto.label,
            nb_uses: dto.nbUses,
            days_needed: dto.daysNeeded

        };
    }
}

export interface HeroSkillDTO {
    name: string;
    description: I18nLabels;
    icon: string;
    label: I18nLabels;
    nbUses: number;
    daysNeeded: number;
};
