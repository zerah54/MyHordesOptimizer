import { HeroSkillDTO } from '../dto/hero-skill.dto';
import { CommonModel } from './_common.class';
import { Dictionary, I18nLabels } from './_types';

export class HeroSkill extends CommonModel<HeroSkillDTO> {
    private name!: string;
    private description!: I18nLabels;
    private icon!: string;
    private label!: I18nLabels;
    private nb_uses!: number;
    public days_needed!: number;
    public legacy: boolean = false;
    /** Groupe de l'arbre des compétences, `null` hors de l'arbre */
    public group: I18nLabels | null = null;
    public group_sort: number | null = null;
    public level: number | null = null;
    /** Avantages du niveau, par langue */
    public bullets: Dictionary<string[]> = {};

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
            daysNeeded: this.days_needed,
            legacy: this.legacy,
            group: this.group,
            groupSort: this.group_sort,
            level: this.level,
            bullets: this.bullets

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
            this.legacy = !!dto.legacy;
            this.group = dto.group ?? null;
            this.group_sort = dto.groupSort ?? null;
            this.level = dto.level ?? null;
            this.bullets = dto.bullets ?? {};
        }
    }
}
