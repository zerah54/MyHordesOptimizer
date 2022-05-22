import { Common } from "./_common.class";
import { I18nLabels } from "./_types";

export interface HeroSkill extends Common {
    name: string;
    description: I18nLabels;
    icon: string;
    label: I18nLabels;
    nb_uses: number;
    days_needed: number;
}
