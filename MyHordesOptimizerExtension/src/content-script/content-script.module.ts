import { DOCUMENT } from '@angular/common';
import { ApplicationRef, Inject, NgModule } from '@angular/core';
import { ApplicationButtonComponent } from './application-button/application-button.component';
import { ContentScriptComponent } from './content-script.component';
import { MHO_PREFIX, MH_HEADER_ID } from './shared/const';
import { SharedModule } from './shared/shared.module';

const mho_modules: any[] = [SharedModule];
const mho_components: any[] = [ContentScriptComponent, ApplicationButtonComponent];
@NgModule({
    declarations: [
        ...mho_components
    ],
    imports: [
        ...mho_modules
    ]
})
export class ContentScriptModule {

    ngDoBootstrap(appRef: ApplicationRef) {
        const header_zone: HTMLElement | null = this.document.getElementById(MH_HEADER_ID);
        const div_id: string = MHO_PREFIX + 'main'
        let div: HTMLDivElement | null = document.querySelector(`#${div_id}`);
        if (!div) {
            div = document.createElement('div');
            div.id = div_id;
        }
        header_zone?.appendChild(div);
        /** On injecte le composant dans une div, elle-même injectée dans le body */
        appRef.bootstrap(ContentScriptComponent, div);
    }


    constructor(@Inject(DOCUMENT) private document: Document) {

    }
}
