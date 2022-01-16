import { Component } from '@angular/core';
import { SidenavLinks } from '../_abstract_model/types/_types';
import { HeroSkillsComponent } from './hero-skills/hero-skills.component';
import { ItemsComponent } from './items/items.component';
import { RecipesComponent } from './recipes/recipes.component';

@Component({
    selector: 'mho-wiki',
    templateUrl: './wiki.component.html',
    styleUrls: ['./wiki.component.scss']
})
export class WikiComponent {
    /** La liste des pages du wiki */
    public wiki_list: SidenavLinks[] = [
        { label: 'Objets', id: 'items', component: ItemsComponent, selected: true },
        { label: 'Recettes', id: 'recipes', component: RecipesComponent, selected: false },
        { label: 'Pouvoirs', id: 'hero-skills', component: HeroSkillsComponent, selected: false }
    ]

    /**
     * Change l'outil affiché
     *
     * @param {SidenavLinks} selected_wiki
     */
    public changeSelected(selected_wiki: SidenavLinks): void {
        this.wiki_list.forEach((wiki: SidenavLinks) => wiki.selected = selected_wiki.id === wiki.id);
    }
}
