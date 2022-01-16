import { AfterViewInit, Component, ElementRef, OnInit, ViewContainerRef } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { skip } from 'rxjs';
import { SidenavService } from './../shared/services/sidenav.service';

@Component({
    selector: 'mho-script',
    templateUrl: './script.component.html',
    styleUrls: ['./script.component.scss']
})
export class ScriptComponent implements OnInit, AfterViewInit {
    /** L'état d'ouverture de la sidenav */
    public opened_sidenav: boolean = this.media.isActive('gt-xs');

    /** Le sommaire de la page */
    public titles: Title[] = [];

    constructor(public media: MediaObserver, private sidenav: SidenavService, private element : ElementRef) { }

    public ngOnInit(): void {
        this.sidenav.toggle_sidenav_obs
            .pipe(skip(1))
            .subscribe(() => {
                this.opened_sidenav = !this.opened_sidenav;
            })
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
        this.titles = (<HTMLHeadingElement[]>Array.from(this.element.nativeElement.querySelectorAll('h1,h2,h3,h4,h5')))
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
