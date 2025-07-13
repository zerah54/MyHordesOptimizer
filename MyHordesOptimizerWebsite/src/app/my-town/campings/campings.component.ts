import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Imports } from '../../_abstract_model/types/_types';

const angular_common: Imports = [];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatCardModule];

@Component({
    selector: 'mho-campings',
    templateUrl: './campings.component.html',
    styleUrls: ['./campings.component.scss'],
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class CampingsComponent {
}
