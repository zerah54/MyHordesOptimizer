import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { FooterModule } from './footer/footer.module';
import { HeaderModule } from './header/header.module';
import { MenuModule } from './menu/menu.module';
import { Modules } from '../_abstract_model/types/_types';


const modules: Modules = [HeaderModule, FooterModule, MenuModule];


@NgModule({
    imports: [SharedModule, ...modules],
    exports: [...modules],
})
export class StructureModule {
}
