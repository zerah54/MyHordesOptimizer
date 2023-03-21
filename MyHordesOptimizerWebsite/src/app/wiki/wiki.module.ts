import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { Components } from '../_abstract_model/types/_types';
import { HeroSkillsComponent } from './hero-skills/hero-skills.component';
import { ItemsComponent } from './items/items.component';
import { MiscellaneousInfoComponent } from './miscellaneous-info/miscellaneous-info.component';
import { DespairDeathsPipe } from './miscellaneous-info/miscellaneous-info.pipe';
import { RecipesComponent } from './recipes/recipes.component';
import { RuinsComponent } from './ruins/ruins.component';
import { WikiRoutingModule } from './wiki.routing.module';

const components: Components = [HeroSkillsComponent, ItemsComponent, RecipesComponent, RuinsComponent, MiscellaneousInfoComponent];
const local_components: Components = [DespairDeathsPipe];

@NgModule({
    imports: [SharedModule, WikiRoutingModule],
    declarations: [
        ...components,
        ...local_components
    ],
    exports: [...components]
})

export class WikiModule {
}

