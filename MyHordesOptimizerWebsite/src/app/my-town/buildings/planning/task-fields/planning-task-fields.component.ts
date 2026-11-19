import { ChangeDetectionStrategy, Component, computed, input, InputSignal, output, OutputEmitterRef, Signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { DailyActionEnum } from '../../../../_abstract_model/enum/daily-action.enum';
import { Imports } from '../../../../_abstract_model/types/_types';
import { IconApComponent } from '../../../../_shared/icon-ap/icon-ap.component';
import { HomeUpgradeRef } from '../home-upgrades.util';
import { PlanTaskKind } from '../plan.types';

const material_modules: Imports = [MatFormFieldModule, MatInputModule, MatSelectModule];

/** Niveau de maison proposé, avec son coût. */
export interface TaskFieldsHomeLevel {
    level: number;
    label: string;
    ap: number;
}

/** Champs d'une consigne individuelle, communs à l'édition en ligne et à l'ajout groupé ; les calculs restent chez l'appelant. */
@Component({
    selector: 'mho-planning-task-fields',
    templateUrl: './planning-task-fields.component.html',
    styleUrls: ['./planning-task-fields.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IconApComponent, ...material_modules]
})
export class PlanningTaskFieldsComponent {

    public readonly kind: InputSignal<PlanTaskKind> = input.required<PlanTaskKind>();
    public readonly disabled: InputSignal<boolean> = input<boolean>(false);
    public readonly actionOptions: InputSignal<DailyActionEnum[]> = input<DailyActionEnum[]>([]);
    public readonly actionRef: InputSignal<string | null> = input<string | null>(null);
    /** Utilisations proposées ; le choix n'apparaît qu'à partir de deux. */
    public readonly useOptions: InputSignal<number[]> = input<number[]>([]);
    public readonly uses: InputSignal<number | null> = input<number | null>(null);
    /** Libellé du choix « utilisations par défaut » (valeur nulle) ; absent = pas de tel choix. */
    public readonly usesDefaultLabel: InputSignal<string | null> = input<string | null>(null);
    public readonly upgradeAllowed: InputSignal<boolean> = input<boolean>(true);
    public readonly upgrades: InputSignal<HomeUpgradeRef[]> = input<HomeUpgradeRef[]>([]);
    public readonly upgradeRef: InputSignal<string | null> = input<string | null>(null);
    public readonly upgradeLevel: InputSignal<number | null> = input<number | null>(null);
    public readonly homeLevels: InputSignal<TaskFieldsHomeLevel[]> = input<TaskFieldsHomeLevel[]>([]);
    public readonly homeLevel: InputSignal<number | null> = input<number | null>(null);
    /** Libellé du choix « niveau par défaut » (valeur nulle) pour la maison et les améliorations ; absent = pas de tel choix. */
    public readonly levelDefaultLabel: InputSignal<string | null> = input<string | null>(null);
    public readonly label: InputSignal<string> = input<string>('');
    /** PA affichés ; nuls = champ vide. */
    public readonly pa: InputSignal<number | null> = input<number | null>(null);

    public readonly kindChange: OutputEmitterRef<PlanTaskKind> = output<PlanTaskKind>();
    public readonly actionChange: OutputEmitterRef<string> = output<string>();
    public readonly usesChange: OutputEmitterRef<number | null> = output<number | null>();
    public readonly upgradeChange: OutputEmitterRef<string> = output<string>();
    public readonly upgradeLevelChange: OutputEmitterRef<number | null> = output<number | null>();
    public readonly homeLevelChange: OutputEmitterRef<number | null> = output<number | null>();
    public readonly labelChange: OutputEmitterRef<string> = output<string>();
    /** Saisie brute des PA (à convertir par l'appelant). */
    public readonly paChange: OutputEmitterRef<unknown> = output<unknown>();

    /** Amélioration choisie, absente au format libre. */
    protected readonly upgrade: Signal<HomeUpgradeRef | undefined> = computed((): HomeUpgradeRef | undefined =>
        this.upgrades().find((candidate: HomeUpgradeRef): boolean => candidate.key === this.upgradeRef()));
}
