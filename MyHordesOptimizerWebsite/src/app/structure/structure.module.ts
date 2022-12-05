import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { FooterModule } from './footer/footer.module';
import { HeaderModule } from './header/header.module';
import { MenuModule } from './menu/menu.module';


const modules = [HeaderModule, FooterModule, MenuModule];


@NgModule({
  imports: [SharedModule, ...modules],
  exports: [...modules],
})
export class StructureModule { }
