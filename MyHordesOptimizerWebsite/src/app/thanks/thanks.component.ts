import { Component, HostBinding } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Imports } from '../_abstract_model/types/_types';

const angular_common: Imports = [];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatDialogModule, MatIconModule];

@Component({
    selector: 'mho-thanks',
    templateUrl: './thanks.component.html',
    styleUrls: ['./thanks.component.scss'],
    standalone: true,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class ThanksComponent {
    @HostBinding('style.display') display: string = 'contents';

}
