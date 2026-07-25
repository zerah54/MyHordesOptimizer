import { CommonModule } from '@angular/common';
import { Component, input, InputSignal, output, OutputEmitterRef } from '@angular/core';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { Imports } from '../../../_abstract_model/types/_types';

const angular_common: Imports = [CommonModule];
const material_modules: Imports = [MatButtonToggleModule, MatIconModule, MatTooltipModule];

/**
 * En-tête de colonne avec filtre booléen à trois états : Tous (`null`, pas de filtre) / Oui (`true`) / Non (`false`).
 * Même ergonomie que `mho-header-with-select-filter` : l'en-tête (texte ou icône) porte une icône de filtre ;
 * au clic, le contrôle Tous/Oui/Non s'affiche inline. Il reste affiché tant qu'un filtre est actif.
 */
@Component({
    selector: 'mho-header-with-toggle',
    templateUrl: './header-with-toggle.component.html',
    styleUrls: ['./header-with-toggle.component.scss'],
    imports: [...angular_common, ...material_modules]
})
export class HeaderWithToggleComponent {

    /** En-tête texte (par défaut). Ignoré si `headerImg` ou `headerIconName` est fourni. */
    public header: InputSignal<string> = input('');
    /** En-tête sous forme de sprite de jeu (chemin relatif à HORDES_IMG_REPO). */
    public headerImg: InputSignal<string | undefined> = input<string | undefined>(undefined);
    /** En-tête sous forme d'icône Material (nom du glyphe). */
    public headerIconName: InputSignal<string | undefined> = input<string | undefined>(undefined);
    /** Tooltip de l'en-tête (utile quand l'en-tête est une icône). */
    public headerTooltip: InputSignal<string | undefined> = input<string | undefined>(undefined);
    public textAlign: InputSignal<string> = input('left');

    /** Valeur du filtre : `null` = tous, `true` = oui, `false` = non. */
    public filterValue: InputSignal<boolean | null> = input.required<boolean | null>();
    public filterValueChange: OutputEmitterRef<boolean | null> = output<boolean | null>();

    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;

    public visible: boolean = false;

    /** Affiche le contrôle de filtre. */
    public displayFilter(): void {
        this.visible = true;
    }

    /** Applique la valeur choisie ; se replie quand on revient à « Tous ». */
    protected setValue(event: MatButtonToggleChange): void {
        const value: boolean | null = event.value as boolean | null;
        this.filterValueChange.emit(value);
        this.visible = value !== null;
    }

}
