import { CommonModule } from '@angular/common';
import { Component, input, InputSignal, output, OutputEmitterRef, Signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { Imports } from '../../../_abstract_model/types/_types';
import { SelectComponent } from '../../select/select.component';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [SelectComponent];
const pipes: Imports = [];
const material_modules: Imports = [MatFormFieldModule, MatIconModule, MatTooltipModule];

@Component({
    selector: 'mho-header-with-select-filter',
    templateUrl: './header-with-select-filter.component.html',
    styleUrls: ['./header-with-select-filter.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class HeaderWithSelectFilterComponent<T> {

    private readonly filter: Signal<SelectComponent<T>> = viewChild.required<SelectComponent<T>>('filter');

    /** En-tête texte (par défaut). Ignoré si `headerImg` ou `headerIconName` est fourni. */
    public header: InputSignal<string> = input('');
    /** En-tête sous forme de sprite de jeu (chemin relatif à HORDES_IMG_REPO). */
    public headerImg: InputSignal<string | undefined> = input<string | undefined>(undefined);
    /** En-tête sous forme d'icône Material (nom du glyphe). */
    public headerIconName: InputSignal<string | undefined> = input<string | undefined>(undefined);
    /** Tooltip de l'en-tête (utile quand l'en-tête est une icône). */
    public headerTooltip: InputSignal<string | undefined> = input<string | undefined>(undefined);
    public textAlign: InputSignal<string> = input('left');

    public options: InputSignal<T[]> = input<T[]>([]);
    public bindLabel: InputSignal<string> = input('label');
    /** Chemin de l'icône des options (transmis au select) — ex sac/états. */
    public bindIcon: InputSignal<string | undefined> = input<string | undefined>(undefined);

    public filterValue: InputSignal<T[]> = input.required();
    public filterValueChange: OutputEmitterRef<T[]> = output();

    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;

    public visible: boolean = false;

    /** Affiche le filtre */
    public displayFilter(): void {
        this.visible = true;
        setTimeout(() => {
            this.filter().select()?.open();
        });
    }

    /** Vérifie si le filtre doit toujours être affiché */
    public checkVisibility(): void {
        setTimeout(() => {
            if (this.filter().select()?.panelOpen) {
                this.visible = true;
            } else {
                this.visible = this.filterValue() !== null && this.filterValue() !== undefined && this.filterValue().length > 0;
            }
        });
    }

}
