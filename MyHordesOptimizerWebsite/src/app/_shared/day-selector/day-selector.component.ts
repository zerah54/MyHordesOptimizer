import { ChangeDetectionStrategy, Component, computed, input, InputSignal, output, OutputEmitterRef, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Imports } from '../../_abstract_model/types/_types';

const material_modules: Imports = [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule];

/** Navigation entre les jours : jour voisin par les chevrons, n'importe quel jour par le menu du libellé. */
@Component({
    selector: 'mho-day-selector',
    templateUrl: './day-selector.component.html',
    styleUrls: ['./day-selector.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...material_modules]
})
export class DaySelectorComponent {
    /** Jours accessibles, croissants ; la liste peut avoir des trous. */
    public readonly days: InputSignal<number[]> = input.required<number[]>();
    public readonly value: InputSignal<number> = input.required<number>();
    /** Jour courant de la ville, signalé dans le libellé et le menu. */
    public readonly today: InputSignal<number> = input.required<number>();

    public readonly valueChange: OutputEmitterRef<number> = output<number>();

    protected readonly previous_day: Signal<number | null> = computed((): number | null => {
        const before: number[] = this.days().filter((day: number): boolean => day < this.value());
        return before.length > 0 ? before[before.length - 1] : null;
    });

    protected readonly next_day: Signal<number | null> = computed((): number | null =>
        this.days().find((day: number): boolean => day > this.value()) ?? null);

    /**
     * Sélectionne un jour.
     * @param {number | null} day Jour visé ; nul = rien.
     */
    protected select(day: number | null): void {
        if (day !== null) {
            this.valueChange.emit(day);
        }
    }
}
