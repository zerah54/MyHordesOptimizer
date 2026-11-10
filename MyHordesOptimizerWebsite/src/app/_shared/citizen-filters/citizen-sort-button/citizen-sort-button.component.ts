import { ChangeDetectionStrategy, Component, computed, inject, input, InputSignal, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { DailyActionEnum } from '../../../_abstract_model/enum/daily-action.enum';
import { Imports } from '../../../_abstract_model/types/_types';
import { HERO_SKILL_LETTERS, HeroSkillFamily } from '../../../_abstract_model/types/hero-skill-levels';
import { CitizenFilterSortStore } from '../citizen-filter-sort.store';
import { CitizenSortField, citizenSortFields } from '../citizen-filter-sort.util';

const material_modules: Imports = [MatButtonModule, MatIconModule, MatMenuModule];

/** Bouton « Trier par » des citoyens : un menu des champs triables ; le champ actif tourne croissant → décroissant → sans tri. */
@Component({
    selector: 'mho-citizen-sort-button',
    templateUrl: './citizen-sort-button.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...material_modules]
})
export class CitizenSortButtonComponent {

    /** Actions quotidiennes affichables (chantier construit). */
    public readonly daily_actions: InputSignal<readonly DailyActionEnum[]> = input.required<readonly DailyActionEnum[]>();
    /** Nom de chaque groupe de compétences ; sa lettre par défaut. */
    public readonly hero_skill_names: InputSignal<Readonly<Record<HeroSkillFamily, string>>> = input<Readonly<Record<HeroSkillFamily, string>>>(HERO_SKILL_LETTERS);

    protected readonly store: CitizenFilterSortStore = inject(CitizenFilterSortStore);

    /** Champs proposés. */
    protected readonly fields: Signal<CitizenSortField[]> = computed((): CitizenSortField[] => citizenSortFields(this.daily_actions(), this.hero_skill_names()));

    /** Libellé du champ actif, nul sans tri. */
    protected readonly active_label: Signal<string | null> = computed((): string | null => {
        const field: string = this.store.sort_field();
        return field === '' ? null : (this.fields().find((candidate: CitizenSortField): boolean => candidate.id === field)?.label ?? null);
    });
}
