import { ApplicationRef, NgModule } from '@angular/core';
import { ContentScriptComponent } from './content-script.component';
import { SharedModule } from './shared/shared.module';
import {MHO_PREFIX} from './shared/const'

@NgModule({
    declarations: [
        ContentScriptComponent
    ],
    imports: [
        SharedModule
    ]
})
export class ContentScriptModule {
    ngDoBootstrap(appRef: ApplicationRef) {
        const body = document.querySelector('body');
        let div = document.querySelector('#div');
        if (!div) {
            div = document.createElement('div');
            div.id = MHO_PREFIX;
        }
        body?.appendChild(div);
        /** On injecte le composant dans une div, elle-même injectée dans le body */
        appRef.bootstrap(ContentScriptComponent, div);
    }
}
