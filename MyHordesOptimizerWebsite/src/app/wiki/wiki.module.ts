import { NgModule } from '@angular/core';
import { Components } from '../_abstract_model/types/_types';
import { SharedModule } from '../shared/shared.module';
import { HeroSkillsComponent } from './hero-skills/hero-skills.component';
import { ItemsComponent } from './items/items.component';
import { DespairDeathsCalculatorComponent } from './miscellaneous-info/despair-deaths-calculator/despair-deaths-calculator.component';
import { MiscellaneousInfoComponent } from './miscellaneous-info/miscellaneous-info.component';
import { DespairDeathsPipe } from './miscellaneous-info/miscellaneous-info.pipe';
import { RecipesComponent } from './recipes/recipes.component';
import { RuinsComponent } from './ruins/ruins.component';

const components: Components = [
    HeroSkillsComponent, ItemsComponent, RecipesComponent, RuinsComponent, MiscellaneousInfoComponent, DespairDeathsCalculatorComponent
];
const local_components: Components = [DespairDeathsPipe];

@NgModule({
    imports: [SharedModule, ...components, ...local_components],
    exports: [...components]
})

export class WikiModule {
}

