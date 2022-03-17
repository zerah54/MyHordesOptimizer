import { ExternalAppIdComponent } from './external-app-id/external-app-id.component';
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { ToolboxComponent } from './toolbox.component';


@NgModule({
    imports: [
        SharedModule
    ],
    declarations: [
        ToolboxComponent, ExternalAppIdComponent
    ]
})
export class ToolboxModule { }
