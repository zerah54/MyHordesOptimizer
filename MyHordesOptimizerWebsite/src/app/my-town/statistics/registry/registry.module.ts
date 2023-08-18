import { NgModule } from '@angular/core';
import { Components } from '../../../_abstract_model/types/_types';
import { SharedModule } from '../../../shared/shared.module';
import { BankDiffRegistryComponent } from './bank-diff/bank-diff-registry.component';
import { BankCleanEntriesPipe, BankDiffPipe } from './bank-diff/bank-gift.pipe';
import { DiceCardsRegistryComponent } from './dice-cards/dice-cards-registry.component';
import { CitizenUseDiceOrCardsPipe } from './dice-cards/dice-cards.pipe';
import { CitizenForDigPipe, CitizenNotInDigListPipe } from './digs/citizen-for-dig.pipe';
import { DigsRegistryComponent } from './digs/digs-registry.component';
import { DoorsRegistryComponent } from './doors/doors-registry.component';
import { RegistryComponent } from './registry.component';
import { WellRegistryComponent } from './well/well-registry.component';
import { WellPipe } from './well/well.pipe';

const components: Components = [RegistryComponent];
const internal_components: Components = [WellRegistryComponent, BankDiffRegistryComponent, DoorsRegistryComponent, DiceCardsRegistryComponent, DigsRegistryComponent];
const pipes: Components = [CitizenUseDiceOrCardsPipe, BankDiffPipe, BankCleanEntriesPipe, WellPipe, CitizenForDigPipe, CitizenNotInDigListPipe];

@NgModule({
    imports: [SharedModule],
    declarations: [...components, ...internal_components, ...pipes],
    exports: [...components]
})

export class RegistryModule {
}

