import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { BackgroundComponent } from './background.component';


@NgModule({
    imports: [
        SharedModule
    ],
    declarations: [
        BackgroundComponent
    ]
})
export class BackgroundModule { }
