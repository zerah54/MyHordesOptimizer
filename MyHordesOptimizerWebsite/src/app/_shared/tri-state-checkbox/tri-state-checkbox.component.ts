import { ChangeDetectionStrategy, Component, input, InputSignal, output, OutputEmitterRef } from '@angular/core';
import { MAT_CHECKBOX_DEFAULT_OPTIONS, MatCheckbox } from '@angular/material/checkbox';

/**
 * Case à trois états : indéterminé (`null`/`undefined`) → décoché (`false`) → coché (`true`) → indéterminé.
 * Le clic ne bascule pas l'état interne de Material (`noop`) : la case reflète uniquement `value`,
 * sinon son basculement au clic « rebat » le binding quand la nouvelle valeur égale l'ancienne.
 */
@Component({
    selector: 'mho-tri-state-checkbox',
    template: `
        <mat-checkbox [checked]="value() === true"
                      [indeterminate]="value() === null || value() === undefined"
                      (click)="valueChange.emit(next())"/>`,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatCheckbox],
    providers: [{ provide: MAT_CHECKBOX_DEFAULT_OPTIONS, useValue: { clickAction: 'noop' } }]
})
export class TriStateCheckboxComponent {
    /** Valeur courante : `true` coché, `false` décoché, `null`/`undefined` indéterminé. */
    public readonly value: InputSignal<boolean | null | undefined> = input<boolean | null | undefined>(undefined);

    /** Émet la valeur suivante du cycle (`undefined` pour revenir à l'état indéterminé). */
    public readonly valueChange: OutputEmitterRef<boolean | undefined> = output<boolean | undefined>();

    protected next():boolean | undefined {
        const value: boolean | null | undefined = this.value();
        if (value === null || value === undefined) return false;
        return value ? undefined : true;
    }
}
