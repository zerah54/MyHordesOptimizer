import { CommonModule } from '@angular/common';
import {
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
    InputSignal,
    InputSignalWithTransform,
    output,
    OutputEmitterRef,
    Signal
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { Imports } from '../../_abstract_model/types/_types';

const angular_common: Imports = [CommonModule];
const material_modules: Imports = [MatIconModule, MatTooltipModule];

/**
 * Compteur compact façon calculateur de camping : une icône (sans label, le libellé passe en tooltip),
 * un bouton `-`, la valeur, un bouton `+`. Borné par `min`/`max` ; les boutons se désactivent aux bornes.
 */
@Component({
    selector: 'mho-compact-stepper',
    templateUrl: './compact-stepper.component.html',
    styleUrls: ['./compact-stepper.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...material_modules]
})
export class CompactStepperComponent {
    /** Chemin de l'icône relatif à HORDES_IMG_REPO (peut dépendre de la valeur, ex habitation). */
    public readonly icon: InputSignal<string> = input.required<string>();
    /** Libellé affiché en tooltip au survol. */
    public readonly label: InputSignal<string> = input.required<string>();
    /** Valeur courante. */
    public readonly value: InputSignal<number> = input.required<number>();
    /** Borne basse (incluse). */
    public readonly min: InputSignal<number> = input<number>(0);
    /** Borne haute (incluse). `undefined` = pas de borne haute (ex : potions bues). */
    public readonly max: InputSignal<number | undefined> = input<number | undefined>(undefined);
    /** Désactive l'interaction (mode observateur / lecture seule). */
    public readonly disabled: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /** Émet la nouvelle valeur lors d'un `-`/`+`. */
    public readonly valueChange: OutputEmitterRef<number> = output<number>();

    protected readonly src: Signal<string> = computed((): string => HORDES_IMG_REPO + this.icon());
    /** Valeur affichée : `?` quand la valeur est négative (-1 = non définie), sinon le nombre. */
    protected readonly display: Signal<string> = computed((): string => this.value() < 0 ? '?' : String(this.value()));
    protected readonly canDecrement: Signal<boolean> = computed((): boolean => !this.disabled() && this.value() > this.min());
    protected readonly canIncrement: Signal<boolean> = computed((): boolean => {
        const max: number | undefined = this.max();
        return !this.disabled() && (max === undefined || this.value() < max);
    });

    protected decrement(): void {
        if (!this.canDecrement()) return;
        this.valueChange.emit(this.value() - 1);
    }

    protected increment(): void {
        if (!this.canIncrement()) return;
        this.valueChange.emit(this.value() + 1);
    }
}
