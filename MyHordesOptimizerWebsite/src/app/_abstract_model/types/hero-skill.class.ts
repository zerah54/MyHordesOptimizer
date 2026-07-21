import { HeroSkillDTO } from '../dto/hero-skill.dto';
import { CommonModel } from './_common.class';
import { I18nLabels } from './_types';

export class HeroSkill extends CommonModel<HeroSkillDTO> {
    private name!: string;
    private description!: I18nLabels;
    private icon!: string;
    private label!: I18nLabels;
    private nb_uses!: number;
    public days_needed!: number;

    public constructor(dto?: HeroSkillDTO) {
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
            this.icon = dto.icon ? `heroskill/${dto.icon}.gif` : '';
            this.label = dto.label;
            this.nb_uses = dto.nbUses;
            this.days_needed = dto.daysNeeded;
        }
    }
}
