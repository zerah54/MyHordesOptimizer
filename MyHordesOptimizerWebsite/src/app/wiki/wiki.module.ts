import { WikiRoutingModule } from './wiki.routing.module';
import { SharedModule } from '../shared/shared.module';
import { NgModule } from '@angular/core';
import { WikiComponent } from './wiki.component';

let components: any[] = [WikiComponent];

@NgModule({
    imports: [SharedModule, WikiRoutingModule],
    declarations: [
        ...components
    ],
    exports: [...components]
})

export class WikiModule {
}

