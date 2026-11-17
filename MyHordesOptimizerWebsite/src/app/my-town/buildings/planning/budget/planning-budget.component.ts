import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';

import { DailyActionEnum } from '../../../../_abstract_model/enum/daily-action.enum';
import { HomeEnum } from '../../../../_abstract_model/enum/home.enum';
import { Imports } from '../../../../_abstract_model/types/_types';
import { IconApComponent } from '../../../../_shared/icon-ap/icon-ap.component';
import { IconCpComponent } from '../../../../_shared/icon-cp/icon-cp.component';
import { budgetBreakdown, BudgetCategory, BudgetRow } from '../budget-breakdown.util';
import { budgetModeOf, BuildingPlanContentDTO, PlanPool, PlanTownLineDTO } from '../plan.types';
import { DayEvaluation } from '../plan-evaluation.util';
import { PlanningStore } from '../planning.store';
import { toInt } from '../planning-input.util';

const angular_common: Imports = [FormsModule];
const material_modules: Imports = [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatSelectModule, MatTooltipModule];

/** Modèle de ligne ville proposé en mode simple. */
export type LinePreset = 'guitar' | 'dice' | 'cs';

/** Carte « Budget » : d'où viennent les PA de la journée et où ils partent, par poche ; lignes de la ville. */
@Component({
    selector: 'mho-planning-budget',
    templateUrl: './planning-budget.component.html',
    styleUrls: ['./planning-budget.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...material_modules, IconApComponent, IconCpComponent]
})
export class PlanningBudgetComponent {

    protected readonly store: PlanningStore = inject(PlanningStore);

    /** Ventilation de la journée, vide sans évaluation. */
    protected readonly rows: Signal<BudgetRow[]> = computed((): BudgetRow[] => {
        const draft: BuildingPlanContentDTO | null = this.store.draft();
        const evaluation: DayEvaluation | null = this.store.evaluation();
        return draft === null || evaluation === null ? [] : budgetBreakdown(draft, this.store.citizens(), evaluation);
    });

    /** Mode simple : les modèles de lignes (guitare, dés / cartes, CS) sont proposés. */
    protected readonly simple: Signal<boolean> = computed((): boolean => {
        const draft: BuildingPlanContentDTO | null = this.store.draft();
        return draft !== null && budgetModeOf(draft) === 'simple';
    });

    /** Date de validation du budget, mise en forme selon la langue du site ; nulle sans validation. */
    protected readonly validated_at: Signal<string | null> = computed((): string | null => {
        const validated_at: string | undefined = this.store.draft()?.validatedBudget?.validatedAt;
        return validated_at === undefined ? null : moment(validated_at).format('L LT');
    });

    /** Fige le budget actuel comme budget validé. */
    protected validateBudget(): void {
        this.store.validateBudget();
    }

    /**
     * Valeur avec son signe, « + » pour un écart positif.
     * @param {number} value Valeur.
     * @returns {string} Valeur signée.
     */
    protected signed(value: number): string {
        return value > 0 ? `+${value}` : `${value}`;
    }

    /**
     * Libellé d'un chantier du référentiel.
     * @param {number} building_id Identifiant du chantier.
     * @returns {string} Nom, ou `#id` s'il est inconnu.
     */
    protected buildingLabel(building_id: number): string {
        return this.store.buildings().get(building_id)?.label ?? `#${building_id}`;
    }

    /**
     * Libellé texte d'une ligne de la ventilation ; le gabarit affiche « PA de base » et « PC du technicien » avec leur icône.
     * @param {BudgetCategory} category Catégorie.
     * @returns {string} Libellé.
     */
    protected categoryLabel(category: BudgetCategory): string {
        if (category.startsWith('action:')) {
            const key: string = category.slice('action:'.length);
            return DailyActionEnum.getByKey<DailyActionEnum>(key)?.getLabel() ?? key;
        }
        switch (category) {
            case 'basePa':
                return $localize`PA de base`;
            case 'ghouls':
                return $localize`Goules`;
            case 'expeditionRab':
                return $localize`Rab d'expé`;
            case 'expeditions':
                return $localize`Expéditions`;
            case 'technicianCp':
                return $localize`PC du technicien`;
            case 'program':
                return $localize`Chantiers du programme`;
            case 'home':
                return $localize`Agrandissements`;
            case 'homeUpgrade':
                return $localize`Améliorations de maison`;
            case 'free':
                return $localize`Consignes libres`;
            case 'townLines':
                return $localize`Lignes de la ville`;
            default:
                return $localize`Dépassements individuels`;
        }
    }

    /** Ajoute une ligne ville vide, côté non-bannis. */
    protected addLine(): void {
        this.store.updateDraft((content: BuildingPlanContentDTO): void => {
            content.townLines.push({ label: '', pool: 'regular', pa: 0 });
        });
    }

    /**
     * Libellé officiel du coin sieste.
     * @returns {string} Libellé dans la langue du site.
     */
    protected restLabel(): string {
        return HomeEnum.REST_LEVEL.getLabel();
    }

    /**
     * Ajoute une ligne ville à 0 PA nommée d'après un modèle (guitare artisanale, dés / cartes, coin sieste), côté non-bannis.
     * @param {LinePreset} preset Modèle.
     */
    protected addPreset(preset: LinePreset): void {
        const labels: Record<LinePreset, string> = {
            guitar: $localize`Guitare artisanale`,
            dice: $localize`Dés / Cartes`,
            cs: this.restLabel()
        };
        this.store.updateDraft((content: BuildingPlanContentDTO): void => {
            content.townLines.push({ label: labels[preset], pool: 'regular', pa: 0 });
        });
    }

    /**
     * Supprime une ligne ville.
     * @param {number} index Rang de la ligne.
     */
    protected removeLine(index: number): void {
        this.store.flushEdits();
        this.store.updateDraft((content: BuildingPlanContentDTO): void => {
            content.townLines.splice(index, 1);
        });
    }

    /**
     * Change la poche d'une ligne ville.
     * @param {number} index Rang de la ligne.
     * @param {PlanPool} pool Poche.
     */
    protected setLinePool(index: number, pool: PlanPool): void {
        this.store.updateDraft((content: BuildingPlanContentDTO): void => {
            content.townLines[index].pool = pool;
        });
    }

    /**
     * Applique le libellé d'une ligne ville après un court délai.
     * @param {number} index Rang de la ligne.
     * @param {string} value Libellé saisi.
     */
    protected onLineLabel(index: number, value: string): void {
        this.store.deferEdit(`line-label:${index}`, (content: BuildingPlanContentDTO): void => {
            const line: PlanTownLineDTO | undefined = content.townLines[index];
            if (line !== undefined) {
                line.label = value;
            }
        });
    }

    /**
     * Applique les PA d'une ligne ville (négatifs permis) après un court délai.
     * @param {number} index Rang de la ligne.
     * @param {unknown} value Valeur saisie.
     */
    protected onLinePa(index: number, value: unknown): void {
        const pa: number = toInt(value);
        this.store.deferEdit(`line-pa:${index}`, (content: BuildingPlanContentDTO): void => {
            const line: PlanTownLineDTO | undefined = content.townLines[index];
            if (line !== undefined) {
                line.pa = pa;
            }
        });
    }
}
