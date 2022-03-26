import { NgModule } from '@angular/core';
import { SharedModule } from './../shared/shared.module';
import { FooterComponent } from './footer.component';

let components: any[] = [FooterComponent];

@NgModule({
    imports: [SharedModule],
    declarations: [...components],
    exports: [...components]
})

export class FooterModule {
}

