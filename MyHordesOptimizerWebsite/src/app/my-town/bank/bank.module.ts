import { NgModule } from '@angular/core';
import { Components } from '../../_abstract_model/types/_types';
import { SharedModule } from '../../shared/shared.module';
import { BankComponent } from './bank.component';

const components: Components = [BankComponent];

@NgModule({
    imports: [SharedModule, ...components],
    exports: [...components]
})

export class BankModule {
}

