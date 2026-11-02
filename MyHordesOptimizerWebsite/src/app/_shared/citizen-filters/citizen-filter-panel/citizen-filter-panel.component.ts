import { ChangeDetectionStrategy, Component, computed, inject, input, InputSignal, output, OutputEmitterRef, Signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';

import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { DailyActionEnum } from '../../../_abstract_model/enum/daily-action.enum';
import { HeroicActionEnum } from '../../../_abstract_model/enum/heroic-action.enum';
import { HomeEnum } from '../../../_abstract_model/enum/home.enum';
import { JobEnum } from '../../../_abstract_model/enum/job.enum';
import { StatusEnum } from '../../../_abstract_model/enum/status.enum';
import { Imports } from '../../../_abstract_model/types/_types';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { HERO_SKILL_FAMILIES, HERO_SKILL_LETTERS, HeroSkillFamily, HeroSkillFamilyInfo } from '../../../_abstract_model/types/hero-skill-levels';
import { Item } from '../../../_abstract_model/types/item.class';
import { SelectComponent } from '../../select/select.component';
import { CitizenFilterSortStore } from '../citizen-filter-sort.store';
import { CAMPING_COUNT_ID, HERO_SKILL_ID_PREFIX, HEROIC_FIELDS, HOME_FIELDS, POTIONS_ID } from '../citizen-filter-sort.util';

const angular_common: Imports = [FormsModule];
const components: Imports = [SelectComponent];
const material_modules: Imports = [MatButtonModule, MatButtonToggleModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatTooltipModule];

/**
 * Panneau de tous les filtres des citoyens : nom, métier, sac, états, chamanique, actions quotidiennes et héroïques, améliorations,
 * compétences et campings. Lit et modifie le `CitizenFilterSortStore` fourni par la page.
 */
@Component({
    selector: 'mho-citizen-filter-panel',
    templateUrl: './citizen-filter-panel.component.html',
    styleUrls: ['./citizen-filter-panel.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...components, ...material_modules]
})
export class CitizenFilterPanelComponent {

    /** Citoyens filtrables (choix par nom). */
    public readonly citizens: InputSignal<readonly Citizen[]> = input.required<readonly Citizen[]>();
    /** Objets proposés au filtre du sac. */
    public readonly items: InputSignal<readonly Item[]> = input.required<readonly Item[]>();
    /** Actions quotidiennes affichables (chantier construit). */
    public readonly daily_actions: InputSignal<readonly DailyActionEnum[]> = input.required<readonly DailyActionEnum[]>();
    /** Valeurs présentes chez les citoyens pour chaque champ à niveau (`citizenValueOptions`). */
    public readonly value_options: InputSignal<Readonly<Record<string, readonly number[]>>> = input.required<Readonly<Record<string, readonly number[]>>>();
    /** Nom de chaque groupe de compétences ; sa lettre par défaut. */
    public readonly hero_skill_names: InputSignal<Readonly<Record<HeroSkillFamily, string>>> = input<Readonly<Record<HeroSkillFamily, string>>>(HERO_SKILL_LETTERS);
    /** Demande de fermeture du panneau. */
    public readonly closed: OutputEmitterRef<void> = output<void>();

    protected readonly store: CitizenFilterSortStore = inject(CitizenFilterSortStore);
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    protected readonly POTIONS_ID: string = POTIONS_ID;
    protected readonly CAMPING_COUNT_ID: string = CAMPING_COUNT_ID;
    protected readonly HERO_SKILL_ID_PREFIX: string = HERO_SKILL_ID_PREFIX;
    protected readonly all_jobs: readonly JobEnum[] = JobEnum.getAllValues<JobEnum>();
    protected readonly all_status: StatusEnum[] = StatusEnum.getAllValues<StatusEnum>();
    protected readonly heroic_fields: readonly HeroicActionEnum[] = HEROIC_FIELDS;
    protected readonly home_fields: readonly HomeEnum[] = HOME_FIELDS;
    protected readonly hero_skill_families: readonly HeroSkillFamilyInfo[] = HERO_SKILL_FAMILIES;
    protected readonly item_bind_label: string = 'label.' + moment.locale();
    protected readonly bool_hint: string = $localize` — coché : oui · décoché : non · indéterminé : tous`;
    protected readonly camping_count_label: string = $localize`Nombre de campings déjà effectués`;

    /** Choix du filtre par nom (copie modifiable attendue par `mho-select`). */
    protected readonly citizen_options: Signal<Citizen[]> = computed((): Citizen[] => [...this.citizens()]);
    /** Choix du filtre du sac. */
    protected readonly item_options: Signal<Item[]> = computed((): Item[] => [...this.items()]);

    /** Citoyens retenus par leur nom. */
    protected readonly selected_citizens: Signal<Citizen[]> = computed((): Citizen[] => {
        const names: readonly number[] = this.store.criteria().names;
        return this.citizens().filter((citizen: Citizen): boolean => names.includes(citizen.id));
    });

    /** Métiers retenus. */
    protected readonly selected_jobs: Signal<JobEnum[]> = computed((): JobEnum[] => {
        const jobs: readonly string[] = this.store.criteria().jobs;
        return this.all_jobs.filter((job: JobEnum): boolean => jobs.includes(job.key));
    });

    /** Objets exigés dans le sac. */
    protected readonly selected_items: Signal<Item[]> = computed((): Item[] => {
        const ids: readonly number[] = this.store.criteria().bag_ids;
        return this.items().filter((item: Item): boolean => ids.includes(item.id));
    });

    /** États exigés. */
    protected readonly selected_status: Signal<StatusEnum[]> = computed((): StatusEnum[] => {
        const keys: readonly string[] = this.store.criteria().status_keys;
        return this.all_status.filter((status: StatusEnum): boolean => keys.includes(status.key));
    });

    /** Une compétence ou un nombre de campings au moins est connu (section affichée). */
    protected readonly has_skills_or_campings: Signal<boolean> = computed((): boolean =>
        [...HERO_SKILL_FAMILIES.map((family: HeroSkillFamilyInfo): string => HERO_SKILL_ID_PREFIX + family.key), CAMPING_COUNT_ID]
            .some((id: string): boolean => (this.value_options()[id] ?? []).length > 0));

    /**
     * Valeurs proposées pour un champ à niveau.
     * @param {string} id Champ.
     * @returns {readonly number[]} Valeurs présentes chez les citoyens.
     */
    protected options(id: string): readonly number[] {
        return this.value_options()[id] ?? [];
    }

    /**
     * Icône d'un champ d'amélioration (habitation : niveau 0 par défaut).
     * @param {HomeEnum} home Champ.
     * @returns {string} Chemin de l'icône sous le dépôt d'images.
     */
    protected homeIcon(home: HomeEnum): string {
        return home.value.img && home.value.img !== '' ? home.value.img : 'home/home_lv0.gif';
    }

    /**
     * Citoyens choisis par nom.
     * @param {Citizen[] | null} citizens Sélection.
     */
    protected onCitizens(citizens: Citizen[] | null): void {
        this.store.setNames((citizens ?? []).map((citizen: Citizen): number => citizen.id));
    }

    /**
     * Métiers choisis.
     * @param {JobEnum[] | null} jobs Sélection.
     */
    protected onJobs(jobs: JobEnum[] | null): void {
        this.store.setJobs((jobs ?? []).map((job: JobEnum): string => job.key));
    }

    /**
     * Objets du sac choisis.
     * @param {Item[] | null} items Sélection.
     */
    protected onItems(items: Item[] | null): void {
        this.store.setBag((items ?? []).map((item: Item): number => item.id));
    }

    /**
     * États choisis.
     * @param {StatusEnum[] | null} status Sélection.
     */
    protected onStatus(status: StatusEnum[] | null): void {
        this.store.setStatus((status ?? []).map((entry: StatusEnum): string => entry.key));
    }
}
