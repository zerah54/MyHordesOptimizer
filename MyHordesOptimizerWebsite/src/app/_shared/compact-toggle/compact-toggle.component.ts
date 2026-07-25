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
import { MatTooltipModule } from '@angular/material/tooltip';

import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { Imports } from '../../_abstract_model/types/_types';

const angular_common: Imports = [CommonModule];
const material_modules: Imports = [MatTooltipModule];

/**
 * Interrupteur compact : une icône de jeu cliquable, sans label (le libellé passe en tooltip).
 * Gère trois états visuels — activé (`true`), désactivé (`false`) et indéterminé (`null`/`undefined`,
 * cas où la donnée n'est pas connue pour ce citoyen). Un clic bascule vers l'état activé/désactivé.
 */
@Component({
    selector: 'mho-compact-toggle',
    templateUrl: './compact-toggle.component.html',
    styleUrls: ['./compact-toggle.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...material_modules]
})
export class CompactToggleComponent {
    /** Chemin de l'icône relatif à HORDES_IMG_REPO (ex : `home/alarm.gif`). */
    public readonly icon: InputSignal<string> = input.required<string>();
    /** Libellé affiché en tooltip au survol (l'icône seule est visible). */
    public readonly label: InputSignal<string> = input.required<string>();
    /** Valeur courante : `true` activé, `false` désactivé, `null`/`undefined` indéterminé. */
    public readonly value: InputSignal<boolean | null | undefined> = input<boolean | null | undefined>(undefined);
    /** Désactive l'interaction (mode observateur / lecture seule). */
    public readonly disabled: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /** Émet la nouvelle valeur booléenne lors d'un clic. */
    public readonly valueChange: OutputEmitterRef<boolean> = output<boolean>();

    protected readonly src: Signal<string> = computed((): string => HORDES_IMG_REPO + this.icon());
    /** État normalisé pour le style : `true` uniquement si strictement vrai, sinon indéterminé/faux. */
    protected readonly state: Signal<'on' | 'off' | 'unknown'> = computed((): 'on' | 'off' | 'unknown' => {
        const value: boolean | null | undefined = this.value();
        if (value === true) return 'on';
        if (value === false) return 'off';
        return 'unknown';
    });

    protected toggle(): void {
        if (this.disabled()) return;
        this.valueChange.emit(this.value() !== true);
    }
}
