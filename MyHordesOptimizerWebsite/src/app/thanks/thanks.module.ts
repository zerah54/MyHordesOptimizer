import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { ThanksComponent } from './thanks.component';

let components: any[] = [ThanksComponent];

@NgModule({
    imports: [SharedModule],
    declarations: [
        ...components
    ],
    exports: [...components]
})

export class ThanksModule {
}

