import { AfterViewInit, Component, ElementRef } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';

@Component({
    selector: 'mho-script-documentation',
    templateUrl: './doc.component.html',
    styleUrls: ['./doc.component.scss']
})
export class ScriptDocumentationComponent implements AfterViewInit {
    /** L'état d'ouverture de la sidenav */
    public opened_sidenav: boolean = this.media.isActive('gt-xs');

    /** Le sommaire de la page */
    public titles: Title[] = [];

    constructor(public media: MediaObserver, private element: ElementRef) {
    }

    public ngAfterViewInit(): void {
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
        this.titles = (<HTMLHeadingElement[]>Array.from(this.element.nativeElement.querySelectorAll('h1,h2')))
            .filter((title: HTMLHeadingElement) => title.id)
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
