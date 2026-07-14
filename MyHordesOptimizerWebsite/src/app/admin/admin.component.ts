import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { Imports } from '../_abstract_model/types/_types';
import { AdminTownsComponent } from './admin-towns/admin-towns.component';
import { DataImportComponent } from './data-import/data-import.component';
import { LogViewerComponent } from './log-viewer/log-viewer.component';

const angular_common: Imports = [];
const components: Imports = [LogViewerComponent, DataImportComponent, AdminTownsComponent];
const pipes: Imports = [];
const material_modules: Imports = [MatCardModule, MatTabsModule];

@Component({
    selector: 'mho-admin',
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class AdminComponent {

}

