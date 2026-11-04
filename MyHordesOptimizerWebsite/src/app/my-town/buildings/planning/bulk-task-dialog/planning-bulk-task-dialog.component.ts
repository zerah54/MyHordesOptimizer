import { ChangeDetectionStrategy, Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { dailyActionAp, DailyActionEnum, dailyActionMaxUses } from '../../../../_abstract_model/enum/daily-action.enum';
import { Imports } from '../../../../_abstract_model/types/_types';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { IconApComponent } from '../../../../_shared/icon-ap/icon-ap.component';
import { bulkAddTask, BulkTaskTemplate } from '../bulk-task.util';
import { cascadeAp, HomeUpgradeRef } from '../home-upgrades.util';
import { BuildingPlanContentDTO, PlanTaskKind } from '../plan.types';
import { CitizenRef, currentHomeLevel, HomeLevelRef } from '../plan-evaluation.util';
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
    imports: [IconApComponent, ...material_modules]
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
                return this.level() !== null || !this.store.unlimited_home_levels();
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
        const count_of: ((user_id: number) => number) | undefined = this.countOf();
        const level_of: ((user_id: number) => number | null) | undefined = this.levelOf();
        let added: number = 0;
        this.store.updateDraft((content: BuildingPlanContentDTO): void => {
            added = bulkAddTask(content, this.data.user_ids, template, pa_of, count_of, level_of);
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
     * Utilisations prévues d'une action pour un citoyen : toutes celles que permet son métier (fouilles des galeries du Fouineur).
     * @returns {((user_id: number) => number) | undefined} Calcul des utilisations, absent hors action.
     */
    private countOf(): ((user_id: number) => number) | undefined {
        const action: DailyActionEnum | undefined = this.kind() === 'action' ? DailyActionEnum.getByKey<DailyActionEnum>(this.action_key() ?? '') : undefined;
        if (action === undefined) {
            return undefined;
        }
        const jobs: Map<number, string | null> = this.jobsByUser();
        return (user_id: number): number => dailyActionMaxUses(action, jobs.get(user_id) ?? null);
    }

    /**
     * Métier de chaque citoyen vivant.
     * @returns {Map<number, string | null>} Clé `JobEnum` par identifiant de joueur.
     */
    private jobsByUser(): Map<number, string | null> {
        return new Map<number, string | null>(this.store.citizens_full().map((citizen: Citizen): [number, string | null] => [citizen.id, citizen.job?.key ?? null]));
    }

    /**
     * Niveau visé de chaque citoyen pour un travail de maison : le suivant du sien pour un agrandissement hors chaos et Pandémonium,
     * sinon le niveau choisi ; nul pour qui l'a déjà atteint ou dont le niveau suivant est inconnu.
     * @returns {((user_id: number) => number | null) | undefined} Calcul du niveau, absent hors travaux de maison.
     */
    private levelOf(): ((user_id: number) => number | null) | undefined {
        const kind: PlanTaskKind = this.kind();
        if (kind !== 'home' && kind !== 'homeUpgrade') {
            return undefined;
        }
        const upgrade_key: string | null = kind === 'home' ? null : this.upgrade_key();
        const target: number | null = this.level();
        const homes: ReadonlyMap<number, HomeLevelRef> = this.store.homes();
        const next_only: boolean = kind === 'home' && !this.store.unlimited_home_levels();
        return (user_id: number): number | null => {
            const current: number | null = currentHomeLevel(this.citizenRef(user_id), upgrade_key);
            if (next_only) {
                return current !== null && homes.has(current + 1) ? current + 1 : null;
            }
            return target === null || (current !== null && current >= target) ? null : target;
        };
    }

    /**
     * Citoyen retenu dans le budget.
     * @param {number} user_id Identifiant du citoyen.
     * @returns {CitizenRef | undefined} Citoyen, absent s'il est inconnu.
     */
    private citizenRef(user_id: number): CitizenRef | undefined {
        return this.store.citizens().find((citizen: CitizenRef): boolean => citizen.userId === user_id);
    }

    /**
     * PA de la consigne pour un citoyen : selon son métier pour une action, des niveaux manquants au référentiel pour la maison et les améliorations.
     * @returns {(user_id: number) => number} Calcul des PA.
     */
    private paOf(): (user_id: number) => number {
        const level_of: ((user_id: number) => number | null) | undefined = this.levelOf();
        switch (this.kind()) {
            case 'action': {
                const action: DailyActionEnum | undefined = DailyActionEnum.getByKey<DailyActionEnum>(this.action_key() ?? '');
                const jobs: Map<number, string | null> = this.jobsByUser();
                return (user_id: number): number => (action === undefined ? 0 : dailyActionAp(action, jobs.get(user_id) ?? null));
            }
            case 'homeUpgrade': {
                const upgrade: HomeUpgradeRef | undefined = this.upgrade();
                const ap_of: (value: number) => number = (value: number): number => upgrade?.levels.find((candidate: { level: number; ap: number }): boolean => candidate.level === value)?.ap ?? 0;
                return (user_id: number): number =>
                    cascadeAp(ap_of, currentHomeLevel(this.citizenRef(user_id), upgrade?.key ?? null), level_of?.(user_id) ?? 0);
            }
            case 'home': {
                const homes: ReadonlyMap<number, HomeLevelRef> = this.store.homes();
                return (user_id: number): number =>
                    cascadeAp((value: number): number => homes.get(value)?.ap ?? 0, currentHomeLevel(this.citizenRef(user_id), null), level_of?.(user_id) ?? 0);
            }
            default: {
                const pa: number = this.pa();
                return (): number => pa;
            }
        }
    }
}
