import { ChangeDetectionStrategy, Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { dailyActionAp, DailyActionEnum } from '../../../../_abstract_model/enum/daily-action.enum';
import { Imports } from '../../../../_abstract_model/types/_types';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { bulkAddTask, BulkTaskTemplate } from '../bulk-task.util';
import { HomeUpgradeRef } from '../home-upgrades.util';
import { BuildingPlanContentDTO, PlanTaskKind } from '../plan.types';
import { HomeLevelRef } from '../plan-evaluation.util';
import { PlanningStore } from '../planning.store';
import { toNonNegativeInt } from '../planning-input.util';

const material_modules: Imports = [MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule];

/** Citoyens à qui donner la consigne (ceux cochés à l'ouverture). */
export interface PlanningBulkTaskDialogData {
    user_ids: number[];
}

/** Fenêtre « Ajouter une consigne » aux citoyens cochés ; se ferme sur le nombre de citoyens servis. */
@Component({
    selector: 'mho-planning-bulk-task-dialog',
    templateUrl: './planning-bulk-task-dialog.component.html',
    styleUrls: ['./planning-bulk-task-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...material_modules]
})
export class PlanningBulkTaskDialogComponent {

    protected readonly store: PlanningStore = inject(PlanningStore);
    protected readonly data: PlanningBulkTaskDialogData = inject<PlanningBulkTaskDialogData>(MAT_DIALOG_DATA);
    private readonly dialog_ref: MatDialogRef<PlanningBulkTaskDialogComponent, number> = inject<MatDialogRef<PlanningBulkTaskDialogComponent, number>>(MatDialogRef);

    /** Actions de chantier proposables ce jour (chantier construit ou terminé par le programme). */
    protected readonly action_options: Signal<DailyActionEnum[]> = computed((): DailyActionEnum[] =>
        this.store.displayable_actions().filter((action: DailyActionEnum): boolean => action.value.building !== undefined));

    /** Niveaux de maison proposés, triés. */
    protected readonly home_levels: Signal<HomeLevelRef[]> = computed((): HomeLevelRef[] => Array.from(this.store.homes().values())
        .filter((home: HomeLevelRef): boolean => home.level >= 1)
        .sort((a: HomeLevelRef, b: HomeLevelRef): number => a.level - b.level));

    protected readonly kind: WritableSignal<PlanTaskKind> = signal<PlanTaskKind>(this.action_options().length > 0 ? 'action' : 'free');
    protected readonly action_key: WritableSignal<string | null> = signal<string | null>(this.action_options()[0]?.key ?? null);
    protected readonly upgrade_key: WritableSignal<string | null> = signal<string | null>(this.store.home_upgrades()[0]?.key ?? null);
    /** Niveau visé (maison ou amélioration). */
    protected readonly level: WritableSignal<number | null> = signal<number | null>(null);
    protected readonly label: WritableSignal<string> = signal('');
    /** PA d'une consigne libre (les autres types ont des PA calculés). */
    protected readonly pa: WritableSignal<number> = signal(0);

    protected readonly upgrade: Signal<HomeUpgradeRef | undefined> = computed((): HomeUpgradeRef | undefined =>
        this.store.home_upgrades().find((candidate: HomeUpgradeRef): boolean => candidate.key === this.upgrade_key()));

    /** Formulaire complet et écriture permise. */
    protected readonly valid: Signal<boolean> = computed((): boolean => {
        if (!this.store.can_edit() || this.data.user_ids.length === 0) {
            return false;
        }
        switch (this.kind()) {
            case 'action':
                return this.action_key() !== null;
            case 'homeUpgrade':
                return this.upgrade() !== undefined && this.level() !== null;
            case 'home':
                return this.level() !== null;
            default:
                return this.label().trim() !== '';
        }
    });

    /**
     * Change le type de consigne ; le niveau visé est à rechoisir.
     * @param {PlanTaskKind} kind Type.
     */
    protected setKind(kind: PlanTaskKind): void {
        this.kind.set(kind);
        this.level.set(null);
    }

    /**
     * Retient les PA saisis d'une consigne libre.
     * @param {unknown} value Valeur saisie.
     */
    protected onPa(value: unknown): void {
        this.pa.set(toNonNegativeInt(value));
    }

    /** Ajoute la consigne aux citoyens visés et ferme la fenêtre sur le nombre de citoyens servis. */
    protected confirm(): void {
        if (!this.valid()) {
            return;
        }
        const template: BulkTaskTemplate = this.template();
        const pa_of: (user_id: number) => number = this.paOf();
        let added: number = 0;
        this.store.updateDraft((content: BuildingPlanContentDTO): void => {
            added = bulkAddTask(content, this.data.user_ids, template, pa_of);
        });
        this.dialog_ref.close(added);
    }

    /**
     * Consigne décrite par le formulaire.
     * @returns {BulkTaskTemplate} Consigne sans PA.
     */
    private template(): BulkTaskTemplate {
        switch (this.kind()) {
            case 'action':
                return { kind: 'action', ref: this.action_key() };
            case 'homeUpgrade':
                return { kind: 'homeUpgrade', ref: this.upgrade_key(), level: this.level() };
            case 'home':
                return { kind: 'home', level: this.level() };
            default:
                return { kind: 'free', label: this.label() };
        }
    }

    /**
     * PA de la consigne pour un citoyen : selon son métier pour une action, du référentiel pour la maison et les améliorations.
     * @returns {(user_id: number) => number} Calcul des PA.
     */
    private paOf(): (user_id: number) => number {
        const level: number = this.level() ?? 0;
        switch (this.kind()) {
            case 'action': {
                const action: DailyActionEnum | undefined = DailyActionEnum.getByKey<DailyActionEnum>(this.action_key() ?? '');
                const jobs: Map<number, string | null> = new Map<number, string | null>(this.store.citizens_full()
                    .map((citizen: Citizen): [number, string | null] => [citizen.id, citizen.job?.key ?? null]));
                return (user_id: number): number => (action === undefined ? 0 : dailyActionAp(action, jobs.get(user_id) ?? null));
            }
            case 'homeUpgrade': {
                const ap: number = this.upgrade()?.levels.find((candidate: { level: number; ap: number }): boolean => candidate.level === level)?.ap ?? 0;
                return (): number => ap;
            }
            case 'home': {
                const ap: number = this.store.homes().get(level)?.ap ?? 0;
                return (): number => ap;
            }
            default: {
                const pa: number = this.pa();
                return (): number => pa;
            }
        }
    }
}
