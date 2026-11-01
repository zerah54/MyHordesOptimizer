import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, inject, output, OutputEmitterRef, Signal, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import { Imports } from '../../../../_abstract_model/types/_types';
import { Building } from '../../../../_abstract_model/types/building.class';
import { BuildingProgress, repairLifeAfterPa, repairPaFor, StepIssue, StepResult } from '../building-progress.util';
import { stepIssueLabel } from '../plan-alerts.util';
import { BuildingRef, WORKSHOP_UID } from '../plan-evaluation.util';
import { BuildingPlanContentDTO, isBuildingStep, PlanItemDTO, PlanPool, PlanStepDTO, PlanStepKind, PlanStepMode, stepMode } from '../plan.types';
import { toNonNegativeInt } from '../planning-input.util';
import { PlanningStore } from '../planning.store';
import { addInstruction, ItemPosition, moveItem, removeItem, setInstructions, setInstructionText, setStepMode, setStepNote } from '../program-edit.util';
import { repairHpPerAp } from '../workshop.util';

const angular_common: Imports = [FormsModule];
const cdk_modules: Imports = [DragDropModule];
const material_modules: Imports = [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatSelectModule, MatTooltipModule];

/** Action proposée dans le menu d'une étape : nature et mode, encodés `kind:mode`. */
interface ModeOption {
    value: string;
    label: string;
}

/** PV avant et après une réparation évaluée. */
interface RepairLives {
    before: number;
    after: number;
    max: number;
}

/** Programme du jour : consignes du jour, sections non-bannis et bannis, étapes et consignes réordonnables. */
@Component({
    selector: 'mho-planning-program',
    templateUrl: './planning-program.component.html',
    styleUrls: ['./planning-program.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...cdk_modules, ...material_modules]
})
export class PlanningProgramComponent {

    /** Demande d'ouverture du tiroir de choix des chantiers pour une section. */
    public readonly choose: OutputEmitterRef<PlanPool> = output<PlanPool>();

    protected readonly store: PlanningStore = inject(PlanningStore);
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    protected readonly issueLabel: (issue: StepIssue) => string = stepIssueLabel;

    /** Sections dont le champ « nouvelle consigne » est ouvert. */
    protected readonly adding: WritableSignal<ReadonlySet<PlanPool>> = signal<ReadonlySet<PlanPool>>(new Set<PlanPool>());
    /** Étapes dont le champ de note est ouvert (`pool:index`). */
    protected readonly noting: WritableSignal<ReadonlySet<string>> = signal<ReadonlySet<string>>(new Set<string>());

    /** Icône de chaque chantier du référentiel. */
    private readonly icons: Signal<ReadonlyMap<number, string>> = computed((): ReadonlyMap<number, string> =>
        new Map<number, string>(this.store.catalog().map((building: Building): [number, string] => [building.id, building.img])));



    /**
     * Éléments d'une section (étapes et consignes).
     * @param {PlanPool} pool Section.
     * @returns {PlanItemDTO[]} Éléments dans l'ordre d'exécution.
     */
    protected items(pool: PlanPool): PlanItemDTO[] {
        return this.store.draft()?.programs[pool] ?? [];
    }

    /**
     * Étape de chantier, ou nul pour une consigne.
     * @param {PlanItemDTO} item Élément.
     * @returns {PlanStepDTO | null} Étape.
     */
    protected asStep(item: PlanItemDTO): PlanStepDTO | null {
        return isBuildingStep(item) ? item : null;
    }

    /**
     * Résultat évalué d'une étape.
     * @param {PlanPool} pool Section.
     * @param {number} index Rang dans la section.
     * @returns {StepResult | undefined} Résultat, absent sans évaluation (jour passé).
     */
    protected result(pool: PlanPool, index: number): StepResult | undefined {
        return this.store.evaluation()?.results.find((result: StepResult): boolean => result.pool === pool && result.index === index);
    }

    /**
     * Libellé d'un chantier ; son identifiant s'il est introuvable.
     * @param {number} building_id Chantier.
     * @returns {string} Libellé.
     */
    protected label(building_id: number): string {
        return this.store.buildings().get(building_id)?.label ?? `#${building_id}`;
    }

    /**
     * Icône d'un chantier, vide s'il est inconnu.
     * @param {number} building_id Chantier.
     * @returns {string} Chemin de l'icône.
     */
    protected icon(building_id: number): string {
        const img: string | undefined = this.icons().get(building_id);
        return img === undefined ? '' : HORDES_IMG_REPO + img;
    }

    /**
     * Un chantier sans état synchronisé n'est pas débloqué dans la ville.
     * @param {number} building_id Chantier.
     * @returns {boolean} Vrai s'il n'est pas débloqué.
     */
    protected isLocked(building_id: number): boolean {
        return !this.store.synced_ids().has(building_id);
    }

    /**
     * Actions proposées pour une étape selon l'état du chantier au début du jour (construire s'il ne l'est pas, réparer s'il l'est ;
     * tout sur un jour passé) ; « passer la nuit » seulement pour un chantier qui peut perdre des PV. L'action en cours reste proposée.
     * @param {PlanStepDTO} step Étape.
     * @returns {ModeOption[]} Options du menu.
     */
    protected modeOptions(step: PlanStepDTO): ModeOption[] {
        const current: string = this.modeValue(step);
        const built: boolean | undefined = this.store.evaluation()?.progressBefore.get(step.buildingId)?.built;
        const options: ModeOption[] = [];
        if (built !== true || current.startsWith('build:')) {
            options.push({ value: 'build:finish', label: $localize`Terminer` }, { value: 'build:leave', label: $localize`Laisser à N PA` });
        }
        if (built !== false || current.startsWith('repair:')) {
            options.push({ value: 'repair:finish', label: $localize`Réparer entièrement` });
            if ((this.store.evaluation()?.nightLoss.get(step.buildingId) ?? 0) > 0 || current === 'repair:survive') {
                options.push({ value: 'repair:survive', label: $localize`Réparer pour passer la nuit` });
            }
            options.push({ value: 'repair:leave', label: $localize`Réparer jusqu'à N PV` });
        }
        return options;
    }

    /**
     * Valeur courante du menu d'action.
     * @param {PlanStepDTO} step Étape.
     * @returns {string} `kind:mode`.
     */
    protected modeValue(step: PlanStepDTO): string {
        return `${step.kind}:${stepMode(step)}`;
    }

    /**
     * Vrai si l'étape attend une cible saisie (« laisser à N » ou « réparer jusqu'à N »).
     * @param {PlanStepDTO} step Étape.
     * @returns {boolean} Vrai en mode `leave`.
     */
    protected isLeave(step: PlanStepDTO): boolean {
        return stepMode(step) === 'leave';
    }

    /**
     * Change la nature et le mode d'une étape.
     * @param {PlanPool} pool Section.
     * @param {number} index Rang.
     * @param {string} value `kind:mode` choisi.
     */
    protected setMode(pool: PlanPool, index: number, value: string): void {
        const [kind, mode]: string[] = value.split(':');
        this.store.flushEdits();
        this.store.updateDraft((content: BuildingPlanContentDTO): void => {
            const item: PlanItemDTO | undefined = content.programs[pool][index];
            if (item !== undefined && isBuildingStep(item)) {
                item.kind = kind as PlanStepKind;
                setStepMode(content, { pool, index }, mode as PlanStepMode, 0);
            }
        });
    }

    /**
     * PA restants visés (« laisser à N PA »), appliqués après un court délai.
     * @param {PlanPool} pool Section.
     * @param {number} index Rang.
     * @param {unknown} value Saisie.
     */
    protected onTarget(pool: PlanPool, index: number, value: unknown): void {
        const target: number = toNonNegativeInt(value);
        this.store.deferEdit(`target:${pool}:${index}`, (content: BuildingPlanContentDTO): void => {
            setStepMode(content, { pool, index }, 'leave', target);
        });
    }

    /**
     * PV avant et après une réparation évaluée.
     * @param {PlanStepDTO} step Étape de réparation.
     * @param {StepResult | undefined} result Résultat évalué.
     * @returns {RepairLives | null} PV, nuls sans évaluation.
     */
    protected repairLives(step: PlanStepDTO, result: StepResult | undefined): RepairLives | null {
        const max: number = this.maxLifeOf(step.buildingId);
        if (result === undefined || max <= 0) {
            return null;
        }
        const after: number = max - result.remainingAfter;
        return { before: after - result.points, after, max };
    }

    /**
     * PV max d'un chantier tels que le calcul les utilise : état de la ville au début du jour, sinon référentiel.
     * @param {number} building_id Chantier.
     * @returns {number} PV max.
     */
    protected maxLifeOf(building_id: number): number {
        return this.store.evaluation()?.progressBefore.get(building_id)?.maxLife || (this.store.buildings().get(building_id)?.maxLife ?? 0);
    }

    /**
     * PV visés d'une réparation « jusqu'à N PV ».
     * @param {PlanStepDTO} step Étape.
     * @returns {number} PV visés.
     */
    protected targetLife(step: PlanStepDTO): number {
        const max: number = this.maxLifeOf(step.buildingId);
        return Math.max(0, max - step.targetRemaining);
    }

    /**
     * PA nécessaires pour atteindre les PV visés, selon l'atelier du jour.
     * @param {PlanStepDTO} step Étape.
     * @param {StepResult | undefined} result Résultat évalué.
     * @returns {number | null} PA, nuls sans évaluation.
     */
    protected targetPa(step: PlanStepDTO, result: StepResult | undefined): number | null {
        const lives: RepairLives | null = this.repairLives(step, result);
        if (lives === null) {
            return null;
        }
        return repairPaFor(lives.before, this.targetLife(step), this.store.evaluation()?.workshopLevel ?? 0);
    }

    /**
     * PV visés saisis : cible = PV max − PV visés, appliquée après un court délai.
     * @param {PlanPool} pool Section.
     * @param {number} index Rang.
     * @param {PlanStepDTO} step Étape.
     * @param {unknown} value Saisie.
     */
    protected onTargetLife(pool: PlanPool, index: number, step: PlanStepDTO, value: unknown): void {
        const max: number = this.maxLifeOf(step.buildingId);
        const life: number = Math.min(max, toNonNegativeInt(value));
        this.store.deferEdit(`target:${pool}:${index}`, (content: BuildingPlanContentDTO): void => {
            setStepMode(content, { pool, index }, 'leave', max - life);
        });
    }

    /**
     * PA saisis : PV visés = PV avant + PA × PV/PA (atelier), plafonnés aux PV max ; appliqués après un court délai.
     * @param {PlanPool} pool Section.
     * @param {number} index Rang.
     * @param {PlanStepDTO} step Étape.
     * @param {StepResult | undefined} result Résultat évalué.
     * @param {unknown} value Saisie.
     */
    protected onTargetPa(pool: PlanPool, index: number, step: PlanStepDTO, result: StepResult | undefined, value: unknown): void {
        const lives: RepairLives | null = this.repairLives(step, result);
        if (lives === null) {
            return;
        }
        const life: number = repairLifeAfterPa(lives.before, lives.max, toNonNegativeInt(value), this.store.evaluation()?.workshopLevel ?? 0);
        this.store.deferEdit(`target:${pool}:${index}`, (content: BuildingPlanContentDTO): void => {
            setStepMode(content, { pool, index }, 'leave', lives.max - life);
        });
    }

    /**
     * PV rendus par PA aujourd'hui (atelier compris).
     * @returns {number} PV par PA.
     */
    protected hpPerAp(): number {
        return repairHpPerAp(this.store.evaluation()?.workshopLevel ?? 0);
    }

    /**
     * PA à laisser pour qu'un vote d'atelier termine le chantier gratuitement demain ; nul hors vote d'atelier.
     * @param {number} building_id Chantier.
     * @returns {number | null} Seuil strictement positif, sinon nul.
     */
    protected freeThreshold(building_id: number): number | null {
        const vote_id: number | null = this.store.draft()?.eveningVoteBuildingId ?? null;
        if (vote_id === null || this.store.buildings().get(vote_id)?.uid !== WORKSHOP_UID) {
            return null;
        }
        const threshold: number = this.store.evaluation()?.freeThresholds.get(building_id) ?? 0;
        return threshold > 0 ? threshold : null;
    }

    /** Chantiers votables le soir : à évolution et construits en fin de journée (déjà ou par le programme), plus le chantier déjà voté. */
    protected voteOptions(): BuildingRef[] {
        const progress: ReadonlyMap<number, BuildingProgress> | undefined = this.store.evaluation()?.progressAfter;
        const voted_id: number | null = this.store.draft()?.eveningVoteBuildingId ?? null;
        const upgradable: ReadonlySet<number> = new Set<number>(this.store.catalog().filter((building: Building): boolean => building.has_upgrade).map((building: Building): number => building.id));
        return [...this.store.plannable_buildings()]
            .sort((a: BuildingRef, b: BuildingRef): number => a.label.localeCompare(b.label))
            .filter((building: BuildingRef): boolean => building.id === voted_id
                || (upgradable.has(building.id) && (progress === undefined || progress.get(building.id)?.built === true)));
    }

    /**
     * Choisit le chantier voté le soir.
     * @param {number | null} building_id Chantier, nul pour aucun.
     */
    protected onVote(building_id: number | null): void {
        this.store.updateDraft((content: BuildingPlanContentDTO): void => {
            content.eveningVoteBuildingId = building_id;
        });
    }

    /**
     * Ouvre ou ferme le champ de note d'une étape.
     * @param {PlanPool} pool Section.
     * @param {number} index Rang.
     */
    protected toggleNote(pool: PlanPool, index: number): void {
        const key: string = `${pool}:${index}`;
        const next: Set<string> = new Set<string>(this.noting());
        if (next.has(key)) {
            next.delete(key);
        } else {
            next.add(key);
        }
        this.noting.set(next);
    }

    /**
     * Vrai si le champ de note d'une étape est visible.
     * @param {PlanPool} pool Section.
     * @param {number} index Rang.
     * @param {PlanStepDTO} step Étape.
     * @returns {boolean} Vrai si la note existe ou est en cours de saisie.
     */
    protected showsNote(pool: PlanPool, index: number, step: PlanStepDTO): boolean {
        return (step.note ?? '') !== '' || this.noting().has(`${pool}:${index}`);
    }

    /**
     * Note d'une étape, appliquée après un court délai.
     * @param {PlanPool} pool Section.
     * @param {number} index Rang.
     * @param {string} value Saisie.
     */
    protected onNote(pool: PlanPool, index: number, value: string): void {
        this.store.deferEdit(`note:${pool}:${index}`, (content: BuildingPlanContentDTO): void => {
            setStepNote(content, { pool, index }, value);
        });
    }

    /**
     * Texte d'une consigne, appliqué après un court délai.
     * @param {PlanPool} pool Section.
     * @param {number} index Rang.
     * @param {string} value Saisie.
     */
    protected onInstructionText(pool: PlanPool, index: number, value: string): void {
        this.store.deferEdit(`instruction:${pool}:${index}`, (content: BuildingPlanContentDTO): void => {
            setInstructionText(content, { pool, index }, value);
        });
    }

    /**
     * Consignes du jour, appliquées après un court délai.
     * @param {string} value Saisie.
     */
    protected onInstructions(value: string): void {
        this.store.deferEdit('instructions', (content: BuildingPlanContentDTO): void => {
            setInstructions(content, value);
        });
    }

    /**
     * Ouvre ou ferme le champ « nouvelle consigne » d'une section.
     * @param {PlanPool} pool Section.
     */
    protected toggleAdding(pool: PlanPool): void {
        const next: Set<PlanPool> = new Set<PlanPool>(this.adding());
        if (next.has(pool)) {
            next.delete(pool);
        } else {
            next.add(pool);
        }
        this.adding.set(next);
    }

    /**
     * Ajoute la consigne saisie en fin de section.
     * @param {PlanPool} pool Section.
     * @param {HTMLInputElement} input Champ de saisie.
     */
    protected addInstruction(pool: PlanPool, input: HTMLInputElement): void {
        const text: string = input.value;
        if (text.trim() === '') {
            return;
        }
        this.store.updateDraft((content: BuildingPlanContentDTO): void => addInstruction(content, pool, text));
        input.value = '';
    }

    /**
     * Passe un élément dans l'autre section (en fin de liste).
     * @param {PlanPool} pool Section actuelle.
     * @param {number} index Rang.
     */
    protected switchPool(pool: PlanPool, index: number): void {
        const target: PlanPool = pool === 'regular' ? 'banned' : 'regular';
        this.move({ pool, index }, { pool: target, index: this.items(target).length });
    }

    /**
     * Supprime un élément.
     * @param {PlanPool} pool Section.
     * @param {number} index Rang.
     */
    protected remove(pool: PlanPool, index: number): void {
        this.store.flushEdits();
        this.noting.set(new Set<string>());
        this.store.updateDraft((content: BuildingPlanContentDTO): void => removeItem(content, { pool, index }));
    }

    /**
     * Glisser-déposer d'un élément, dans sa section ou vers l'autre.
     * @param {CdkDragDrop<PlanPool>} event Dépôt.
     */
    protected onDrop(event: CdkDragDrop<PlanPool>): void {
        this.move({ pool: event.previousContainer.data, index: event.previousIndex }, { pool: event.container.data, index: event.currentIndex });
    }

    /**
     * Déplace un élément ; les saisies en attente sont appliquées avant (leurs rangs changent) et les champs de note refermés.
     * @param {ItemPosition} from Position actuelle.
     * @param {ItemPosition} to Position voulue.
     */
    private move(from: ItemPosition, to: ItemPosition): void {
        if (from.pool === to.pool && from.index === to.index) {
            return;
        }
        this.store.flushEdits();
        this.noting.set(new Set<string>());
        this.store.updateDraft((content: BuildingPlanContentDTO): void => moveItem(content, from, to));
    }
}
