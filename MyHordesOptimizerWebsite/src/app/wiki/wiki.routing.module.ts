import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ItemComponent } from './../shared/elements/item/item.component';
import { HeroSkillsComponent } from './hero-skills/hero-skills.component';
import { RecipesComponent } from './recipes/recipes.component';
import { WikiComponent } from './wiki.component';

let routes: Routes = [
    {
        path: 'wiki', component: WikiComponent, children: [
            { path: 'hero-skills', component: HeroSkillsComponent },
            { path: 'items', component: ItemComponent },
            { path: 'recipes', component: RecipesComponent },
        ]
    }
]

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class WikiRoutingModule {
}
