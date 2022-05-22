import { RuinsComponent } from './ruins/ruins.component';
import { RecipesComponent } from './recipes/recipes.component';
import { ItemsComponent } from './items/items.component';
import { HeroSkillsComponent } from './hero-skills/hero-skills.component';
import { WikiRoutingModule } from './wiki.routing.module';
import { SharedModule } from '../shared/shared.module';
import { NgModule } from '@angular/core';
import { WikiComponent } from './wiki.component';

let components: any[] = [WikiComponent, HeroSkillsComponent, ItemsComponent, RecipesComponent, RuinsComponent];

@NgModule({
    imports: [SharedModule, WikiRoutingModule],
    declarations: [
        ...components
    ],
    exports: [...components]
})

export class WikiModule {
}

