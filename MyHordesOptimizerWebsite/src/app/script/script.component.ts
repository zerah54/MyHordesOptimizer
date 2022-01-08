import { AfterViewInit, Component, OnChanges, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'mho-script',
    templateUrl: './script.component.html',
    styleUrls: ['./script.component.scss']
})
export class ScriptComponent implements AfterViewInit {

    /** Le sommaire de la page */
    public titles: Title[] = [];

    ngAfterViewInit(): void {
        this.getAllTitles();
    }

    /**
     * Scroll vers l'élément dans une même page
     *
     * @param {string} id  L'identifiant de notre anchor'
     */
    public scrollToTitle(id: string) {
        let title_to_scroll: HTMLElement | null = document.getElementById(id);
        if (title_to_scroll) {
            title_to_scroll.scrollIntoView();
        }
    }

    /** Récupère la liste des titres de la page et la transforme en objet pour faire un sommaire cliquable */
    private getAllTitles(): void {
        this.titles = (<HTMLHeadingElement[]>Array.from(document.querySelectorAll('h1,h2,h3,h4,h5')))
            .map((title: HTMLHeadingElement) => {
                return {
                    id: title.id,
                    level: +title.tagName.replace('H', ''),
                    label: title.innerText
                }
            });
    }
}

interface Title {
    id: string;
    level: number;
    label: string;
}
