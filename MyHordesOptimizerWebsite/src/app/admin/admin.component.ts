import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Imports } from '../_abstract_model/types/_types';
import { LogViewerComponent } from './log-viewer/log-viewer.component';

const angular_common: Imports = [];
const components: Imports = [LogViewerComponent];
const pipes: Imports = [];
const material_modules: Imports = [MatCardModule];

@Component({
    selector: 'mho-admin',
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class AdminComponent {

}

