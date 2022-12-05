import { SharedModule } from '../../shared/shared.module';
import { NgModule } from '@angular/core';
import { HeaderComponent } from './header.component';

let components: any[] = [HeaderComponent];

@NgModule({
    imports: [SharedModule],
    declarations: [
        ...components
    ],
    exports: [...components]
})

export class HeaderModule {
}

