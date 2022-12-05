import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HeroSkillsComponent } from './hero-skills/hero-skills.component';
import { ItemsComponent } from './items/items.component';
import { MiscellaneousInfoComponent } from './miscellaneous-info/miscellaneous-info.component';
import { RecipesComponent } from './recipes/recipes.component';
import { RuinsComponent } from './ruins/ruins.component';

let routes: Routes = [
    { path: 'wiki', redirectTo: 'wiki/items' },
    {
        path: 'wiki', children: [
            { path: 'miscellaneous-info', component: MiscellaneousInfoComponent },
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
