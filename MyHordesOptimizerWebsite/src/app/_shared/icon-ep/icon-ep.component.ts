import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, InputSignal } from '@angular/core';
import moment from 'moment';

import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { Imports } from '../../_abstract_model/types/_types';

const angular_common: Imports = [CommonModule];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [];

@Component({
    selector: 'mho-icon-ep',
    templateUrl: './icon-ep.component.html',
    styleUrls: ['./icon-ep.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconEpComponent {

    /** Nombre affiché collé à l'icône, facultatif : dans un gabarit, le formateur de l'IDE le séparerait de la balise. */
    public readonly value: InputSignal<number | string | null> = input<number | string | null>(null);

    /** L'url des images de hordes */
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La langue du site */
    protected readonly locale: string = moment.locale();
}
