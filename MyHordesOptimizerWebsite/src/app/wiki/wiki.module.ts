import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { DespairDeathsComponent } from './despair-deaths/despair-deaths.component';
import { DespairDeathsPipe } from './despair-deaths/despair-deaths.pipe';
import { HeroSkillsComponent } from './hero-skills/hero-skills.component';
import { ItemsComponent } from './items/items.component';
import { RecipesComponent } from './recipes/recipes.component';
import { RuinsComponent } from './ruins/ruins.component';
import { WikiComponent } from './wiki.component';
import { WikiRoutingModule } from './wiki.routing.module';

let components: any[] = [WikiComponent, HeroSkillsComponent, ItemsComponent, RecipesComponent, RuinsComponent, DespairDeathsComponent];
let local_components: any[] = [DespairDeathsPipe];

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

