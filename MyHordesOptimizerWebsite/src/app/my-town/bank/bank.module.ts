import { NgModule } from '@angular/core';
import { BankComponent } from './bank.component';
import { SharedModule } from '../../shared/shared.module';
import { Components } from '../../_abstract_model/types/_types';

const components: Components = [BankComponent];

@NgModule({
    imports: [SharedModule],
    declarations: [...components],
    exports: [...components]
})

export class BankModule {
}

