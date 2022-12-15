import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { ScriptTutorialsModule } from './script/script-tutorials.module';
import { SiteTutorialsModule } from './site/script-tutorials.module';
import { TutorialsRoutingModule } from './tutorials.routing.module';


const modules = [ScriptTutorialsModule, SiteTutorialsModule];


@NgModule({
    imports: [SharedModule, TutorialsRoutingModule, ...modules],
    exports: [...modules],
})
export class TutorialsModule { }
