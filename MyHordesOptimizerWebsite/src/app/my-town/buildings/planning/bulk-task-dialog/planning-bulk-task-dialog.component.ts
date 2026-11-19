import { ChangeDetectionStrategy, Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { dailyActionAp, dailyActionDefaultUses, DailyActionEnum, dailyActionMaxUses } from '../../../../_abstract_model/enum/daily-action.enum';
import { Imports } from '../../../../_abstract_model/types/_types';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { HeroSkillLevels } from '../../../../_abstract_model/types/hero-skill-levels';
import { IconApComponent } from '../../../../_shared/icon-ap/icon-ap.component';
import { bulkAddTask, BulkTaskTemplate } from '../bulk-task.util';
import { cascadeAp, HomeUpgradeRef, upgradesAllowed } from '../home-upgrades.util';
import { BuildingPlanContentDTO, PlanCitizenDTO, PlanTaskDTO, PlanTaskKind } from '../plan.types';
import { CitizenRef, currentHomeLevel, HomeLevelRef } from '../plan-evaluation.util';
import { PlanningStore } from '../planning.store';
import { toNonNegativeInt } from '../planning-input.util';
import { plannableActions, upgradeAp } from '../task-edit.util';

const material_modules: Imports = [MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule];

/** Citoyens à qui donner la consigne (ceux cochés à l'ouverture). */
export interface PlanningBulkTaskDialogData {
    user_ids: number[];
}

/** Fenêtre « Ajouter une consigne » aux citoyens cochés, mêmes champs que l'édition en ligne ; se ferme sur le nombre de citoyens servis. */
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

    /** Actions proposables ce jour, comme dans l'édition en ligne. */
    protected readonly action_options: Signal<DailyActionEnum[]> = computed((): DailyActionEnum[] => plannableActions(this.store.displayable_actions()));

    /** Niveaux de maison proposés, triés. */
    protected readonly home_levels: Signal<HomeLevelRef[]> = computed((): HomeLevelRef[] => Array.from(this.store.homes().values())
        .filter((home: HomeLevelRef): boolean => home.level >= 1)
        .sort((a: HomeLevelRef, b: HomeLevelRef): number => a.level - b.level));

    protected readonly kind: WritableSignal<PlanTaskKind> = signal<PlanTaskKind>(this.action_options().length > 0 ? 'action' : 'free');
    protected readonly action_key: WritableSignal<string | null> = signal<string | null>(this.action_options()[0]?.key ?? null);
    protected readonly upgrade_key: WritableSignal<string | null> = signal<string | null>(this.store.home_upgrades()[0]?.key ?? null);
    /** Niveau visé (maison ou amélioration) ; nul pour une amélioration = niveau suivant de chacun. */
    protected readonly level: WritableSignal<number | null> = signal<number | null>(null);
    protected readonly label: WritableSignal<string> = signal('');
    /** Utilisations de l'action, bornées aux possibilités de chacun ; nulles = celles proposées à chacun. */
    protected readonly uses: WritableSignal<number | null> = signal<number | null>(null);
    /** PA imposés à tous ; nuls = calculés pour chacun (0 pour une consigne libre). */
    protected readonly pa: WritableSignal<number | null> = signal<number | null>(null);

    protected readonly upgrade: Signal<HomeUpgradeRef | undefined> = computed((): HomeUpgradeRef | undefined =>
        this.store.home_upgrades().find((candidate: HomeUpgradeRef): boolean => candidate.key === this.upgrade_key()));

    /** Utilisations possibles au plus parmi les citoyens visés, pour l'action choisie. */
    protected readonly max_uses: Signal<number> = computed((): number => {
        const action: DailyActionEnum | undefined = DailyActionEnum.getByKey<DailyActionEnum>(this.action_key() ?? '');
        return action === undefined ? 1 : Math.max(1, ...this.data.user_ids.map((user_id: number): number => dailyActionMaxUses(action, this.jobKey(user_id), this.heroSkills(user_id))));
    });

    /** Choix proposés pour le nombre d'utilisations. */
    protected readonly use_options: Signal<number[]> = computed((): number[] =>
        Array.from({ length: this.max_uses() }, (_: unknown, index: number): number => index + 1));

    /** Formulaire complet et écriture permise. */
    protected readonly valid: Signal<boolean> = computed((): boolean => {
        if (!this.store.can_edit() || this.data.user_ids.length === 0) {
            return false;
        }
        switch (this.kind()) {
            case 'action':
                return this.action_key() !== null;
            case 'homeUpgrade':
                return this.upgrade() !== undefined;
            case 'home':
                return this.level() !== null || !this.store.unlimited_home_levels();
            default:
                return this.label().trim() !== '';
        }
    });

    /**
     * Change le type de consigne ; niveau et utilisations sont à rechoisir.
     * @param {PlanTaskKind} kind Type.
     */
    protected setKind(kind: PlanTaskKind): void {
        this.kind.set(kind);
        this.level.set(null);
        this.uses.set(null);
    }

    /**
     * Change l'action ; utilisations à rechoisir.
     * @param {string} key Clé de l'action.
     */
    protected setAction(key: string): void {
        this.action_key.set(key);
        this.uses.set(null);
    }

    /**
     * Change l'amélioration ; niveau à rechoisir.
     * @param {string} key Clé de l'amélioration.
     */
    protected setUpgrade(key: string): void {
        this.upgrade_key.set(key);
        this.level.set(null);
    }

    /**
     * Retient les PA saisis ; vide = PA calculés pour chacun.
     * @param {unknown} value Valeur saisie.
     */
    protected onPa(value: unknown): void {
        this.pa.set(value === '' || value === null || value === undefined ? null : toNonNegativeInt(value));
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
     * Utilisations prévues d'une action pour un citoyen : celles choisies dans la limite de ses possibilités, sinon celles proposées.
     * @returns {((user_id: number) => number) | undefined} Calcul des utilisations, absent hors action.
     */
    private countOf(): ((user_id: number) => number) | undefined {
        const action: DailyActionEnum | undefined = this.kind() === 'action' ? DailyActionEnum.getByKey<DailyActionEnum>(this.action_key() ?? '') : undefined;
        if (action === undefined) {
            return undefined;
        }
        const uses: number | null = this.uses();
        return (user_id: number): number => {
            const job_key: string | null = this.jobKey(user_id);
            const hero_skills: HeroSkillLevels | null = this.heroSkills(user_id);
            return uses === null ? dailyActionDefaultUses(action, job_key, hero_skills) : Math.min(uses, dailyActionMaxUses(action, job_key, hero_skills));
        };
    }

    /**
     * Niveau visé de chaque citoyen pour un travail de maison : le suivant du sien pour un agrandissement hors chaos et Pandémonium
     * ou une amélioration sans niveau choisi, sinon le niveau choisi ; nul pour qui l'a déjà atteint, dont le niveau suivant est
     * inconnu, ou sans habitation pour une amélioration (comme dans l'édition en ligne).
     * @returns {((user_id: number) => number | null) | undefined} Calcul du niveau, absent hors travaux de maison.
     */
    private levelOf(): ((user_id: number) => number | null) | undefined {
        const kind: PlanTaskKind = this.kind();
        if (kind !== 'home' && kind !== 'homeUpgrade') {
            return undefined;
        }
        const upgrade: HomeUpgradeRef | undefined = kind === 'homeUpgrade' ? this.upgrade() : undefined;
        const upgrade_key: string | null = upgrade?.key ?? null;
        const target: number | null = this.level();
        const homes: ReadonlyMap<number, HomeLevelRef> = this.store.homes();
        const next_only: boolean = kind === 'home' && !this.store.unlimited_home_levels();
        return (user_id: number): number | null => {
            const current: number | null = currentHomeLevel(this.citizenRef(user_id), upgrade_key);
            if (next_only) {
                return current !== null && homes.has(current + 1) ? current + 1 : null;
            }
            if (upgrade !== undefined && !upgradesAllowed(this.draftTasks(user_id), currentHomeLevel(this.citizenRef(user_id), null))) {
                return null;
            }
            const level: number | null = target ?? (upgrade === undefined ? null : Math.min((current ?? 0) + 1, upgrade.max_level));
            return level === null || (current !== null && current >= level) ? null : level;
        };
    }

    /**
     * PA de la consigne pour un citoyen : ceux saisis s'il y en a, sinon selon son métier et ses utilisations pour une action, des
     * niveaux manquants au référentiel pour la maison et les améliorations.
     * @returns {(user_id: number) => number} Calcul des PA.
     */
    private paOf(): (user_id: number) => number {
        const imposed: number | null = this.pa();
        if (imposed !== null) {
            return (): number => imposed;
        }
        const level_of: ((user_id: number) => number | null) | undefined = this.levelOf();
        switch (this.kind()) {
            case 'action': {
                const action: DailyActionEnum | undefined = DailyActionEnum.getByKey<DailyActionEnum>(this.action_key() ?? '');
                const count_of: ((user_id: number) => number) | undefined = this.countOf();
                return (user_id: number): number =>
                    (action === undefined ? 0 : dailyActionAp(action, this.jobKey(user_id), count_of?.(user_id) ?? null, this.heroSkills(user_id)));
            }
            case 'homeUpgrade': {
                const upgrade: HomeUpgradeRef | undefined = this.upgrade();
                return (user_id: number): number => (upgrade === undefined ? 0
                    : cascadeAp((value: number): number => upgradeAp(upgrade, value), currentHomeLevel(this.citizenRef(user_id), upgrade.key), level_of?.(user_id) ?? 0));
            }
            case 'home': {
                const homes: ReadonlyMap<number, HomeLevelRef> = this.store.homes();
                return (user_id: number): number =>
                    cascadeAp((value: number): number => homes.get(value)?.ap ?? 0, currentHomeLevel(this.citizenRef(user_id), null), level_of?.(user_id) ?? 0);
            }
            default:
                return (): number => 0;
        }
    }

    /**
     * Citoyen complet (métier, compétences).
     * @param {number} user_id Identifiant du citoyen.
     * @returns {Citizen | undefined} Citoyen, absent s'il est inconnu.
     */
    private fullCitizen(user_id: number): Citizen | undefined {
        return this.store.citizens_full().find((citizen: Citizen): boolean => citizen.id === user_id);
    }

    /**
     * Clé du métier d'un citoyen.
     * @param {number} user_id Identifiant du citoyen.
     * @returns {string | null} Clé `JobEnum`, nulle si inconnue.
     */
    private jobKey(user_id: number): string | null {
        return this.fullCitizen(user_id)?.job?.key ?? null;
    }

    /**
     * Compétences héroïques d'un citoyen.
     * @param {number} user_id Identifiant du citoyen.
     * @returns {HeroSkillLevels | null} Niveaux, nuls si inconnus.
     */
    private heroSkills(user_id: number): HeroSkillLevels | null {
        return this.fullCitizen(user_id)?.hero_skills ?? null;
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
     * Consignes actuelles d'un citoyen.
     * @param {number} user_id Identifiant du citoyen.
     * @returns {PlanTaskDTO[]} Consignes.
     */
    private draftTasks(user_id: number): PlanTaskDTO[] {
        return this.store.draft()?.citizens.find((entry: PlanCitizenDTO): boolean => entry.userId === user_id)?.tasks ?? [];
    }
}
