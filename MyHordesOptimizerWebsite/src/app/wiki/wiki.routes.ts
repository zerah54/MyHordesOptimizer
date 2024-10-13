import { Route } from '@angular/router';
import { HeroSkillsComponent } from './hero-skills/hero-skills.component';
import { ItemsComponent } from './items/items.component';
import { MiscellaneousInfoComponent } from './miscellaneous-info/miscellaneous-info.component';
import { PrivateTownsComponent } from './private-towns/private-towns.component';
import { RecipesComponent } from './recipes/recipes.component';
import { RuinsComponent } from './ruins/ruins.component';

export default [
    { path: '', redirectTo: 'items', pathMatch: 'full' },
    {
        path: 'miscellaneous-info',
        component: MiscellaneousInfoComponent,
        title: 'MyHordes Optimizer' + ' - ' + $localize`Wiki` + ' - ' + $localize`Informations diverses`
    },
    { path: 'hero-skills', component: HeroSkillsComponent, title: 'MyHordes Optimizer' + ' - ' + $localize`Wiki` + ' - ' + $localize`Pouvoirs` },
    { path: 'items', component: ItemsComponent, title: 'MyHordes Optimizer' + ' - ' + $localize`Wiki` + ' - ' + $localize`Objets` },
    { path: 'recipes', component: RecipesComponent, title: 'MyHordes Optimizer' + ' - ' + $localize`Wiki` + ' - ' + $localize`Recettes` },
    { path: 'ruins', component: RuinsComponent, title: 'MyHordes Optimizer' + ' - ' + $localize`Wiki` + ' - ' + $localize`Bâtiments` },
    { path: 'private-towns', component: PrivateTownsComponent, title: 'MyHordes Optimizer' + ' - ' + $localize`Wiki` + ' - ' + $localize`Villes privées` },
] satisfies Route[];

