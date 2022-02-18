import { PageWithSidenav } from './../shared/page-with-sidenav/page-with-sidenav.component';
import { Component, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { skip } from 'rxjs';
import { SidenavLinks } from '../_abstract_model/types/_types';
import { SidenavService } from './../shared/services/sidenav.service';
import { HeroSkillsComponent } from './hero-skills/hero-skills.component';
import { ItemsComponent } from './items/items.component';
import { RecipesComponent } from './recipes/recipes.component';

@Component({
    selector: 'mho-wiki',
    templateUrl: './wiki.component.html',
    styleUrls: ['./wiki.component.scss']
})
export class WikiComponent extends PageWithSidenav implements OnInit {
    /** L'état d'ouverture de la sidenav */
    public opened_sidenav: boolean = true;

    /** La liste des pages du wiki */
    public wiki_list: SidenavLinks[] = [
        { label: 'Objets', id: 'items', component: ItemsComponent, selected: true },
        { label: 'Recettes', id: 'recipes', component: RecipesComponent, selected: false },
        { label: 'Pouvoirs', id: 'hero-skills', component: HeroSkillsComponent, selected: false }
    ]

    constructor(public media: MediaObserver, private sidenav: SidenavService) {
        super();
    }

    public ngOnInit(): void {
        this.sidenav.toggle_sidenav_obs
            .pipe(skip(1))
            .subscribe(() => {
                this.opened_sidenav = !this.opened_sidenav;
            })
    }

    /**
     * Change l'outil affiché
     *
     * @param {SidenavLinks} selected_wiki
     */
    public changeSelected(selected_wiki: SidenavLinks): void {
        this.wiki_list.forEach((wiki: SidenavLinks) => wiki.selected = selected_wiki.id === wiki.id);
    }
}
