import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HeroSkillsComponent } from './hero-skills/hero-skills.component';
import { ItemsComponent } from './items/items.component';
import { RecipesComponent } from './recipes/recipes.component';
import { RuinsComponent } from './ruins/ruins.component';

let routes: Routes = [
    { path: 'wiki', redirectTo: '/wiki/items' },
    {
        path: 'wiki', children: [
            { path: 'hero-skills', component: HeroSkillsComponent },
            { path: 'items', component: ItemsComponent },
            { path: 'recipes', component: RecipesComponent },
            { path: 'ruins', component: RuinsComponent },
        ]
    }
]

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class WikiRoutingModule {
}
