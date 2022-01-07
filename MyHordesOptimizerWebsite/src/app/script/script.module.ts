import { ScriptRoutingModule } from './script.routing.module';
import { SharedModule } from './../shared/shared.module';
import { NgModule } from '@angular/core';
import { ScriptComponent } from './script.component';

let components: any[] = [ScriptComponent];

@NgModule({
    imports: [SharedModule, ScriptRoutingModule],
    declarations: [
        ...components
    ],
    exports: [...components]
})

export class ScriptModule {
}

