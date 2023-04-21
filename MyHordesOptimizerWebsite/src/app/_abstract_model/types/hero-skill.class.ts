import { HeroSkillDTO } from '../dto/hero-skill.dto';
import { I18nLabels } from './_types';
import { CommonModel } from './_common.class';

export class HeroSkill extends CommonModel<HeroSkillDTO> {
    public name!: string;
    public description!: I18nLabels;
    public icon!: string;
    public label!: I18nLabels;
    public nb_uses!: number;
    public days_needed!: number;

    constructor(dto?: HeroSkillDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): HeroSkillDTO {
        return {
            name: this.name,
            description: this.description,
            icon: this.icon,
            label: this.label,
            nbUses: this.nb_uses,
            daysNeeded: this.days_needed

        };
    }

    protected dtoToModel(dto?: HeroSkillDTO): void {
        if (dto) {
            this.name = dto.name;
            this.description = dto.description;
            this.icon = dto.icon;
            this.label = dto.label;
            this.nb_uses = dto.nbUses;
            this.days_needed = dto.daysNeeded;
        }
    }
}
