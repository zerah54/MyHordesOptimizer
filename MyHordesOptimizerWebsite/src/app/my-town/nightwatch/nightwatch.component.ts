import { Component, HostBinding } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Imports } from '../../_abstract_model/types/_types';

const angular_common: Imports = [];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatCardModule];

@Component({
    selector: 'mho-nightwatch',
    templateUrl: './nightwatch.component.html',
    styleUrls: ['./nightwatch.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class NightwatchComponent {
    @HostBinding('style.display') display: string = 'contents';
}
