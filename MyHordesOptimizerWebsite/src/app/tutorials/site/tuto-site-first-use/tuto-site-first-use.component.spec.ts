import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuTrigger } from '@angular/material/menu';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ClipboardService } from '../../../_core/services/clipboard.service';
import { TutoSiteFirstUseComponent } from './tuto-site-first-use.component';

describe('TutoSiteFirstUseComponent', (): void => {
    let fixture: ComponentFixture<TutoSiteFirstUseComponent>;
    let clipboard: jasmine.SpyObj<ClipboardService>;

    beforeEach(async (): Promise<void> => {
        clipboard = jasmine.createSpyObj<ClipboardService>('ClipboardService', ['copy']);

        await TestBed.configureTestingModule({
            imports: [TutoSiteFirstUseComponent],
            providers: [{ provide: ClipboardService, useValue: clipboard }, provideNoopAnimations()]
        }).compileComponents();
        fixture = TestBed.createComponent(TutoSiteFirstUseComponent);
        fixture.detectChanges();
    });

    function openShareMenu(): void {
        const trigger: MatMenuTrigger = fixture.debugElement.query(By.directive(MatMenuTrigger)).injector.get(MatMenuTrigger);
        trigger.openMenu();
        fixture.detectChanges();
    }

    function clickMenuItem(label: string): void {
        openShareMenu();
        const item: HTMLElement | undefined = Array.from(document.querySelectorAll<HTMLElement>('.mat-mdc-menu-panel [mat-menu-item]'))
            .find((el: HTMLElement): boolean => el.textContent?.trim() === label);
        item?.click();
        fixture.detectChanges();
    }

    it('shows the page title', (): void => {
        const titleEl: HTMLElement = fixture.debugElement.query(By.css('mat-card-title')).nativeElement;
        expect((titleEl.childNodes[0].textContent as string).trim()).toBe('Première utilisation du site');
    });

    it('renders the two explanation paragraphs, in order', (): void => {
        const paragraphs: DebugElement[] = fixture.debugElement.queryAll(By.css('mat-card-content p'));

        expect(paragraphs.length).toBe(2);
        expect((paragraphs[0].nativeElement.textContent as string).trim()).toBe(
            'Lors de votre première utilisation du site vous n\'aurez pas accès aux pages sous le menu "Ma ville". '
            + 'En effet, il faut au préalable renseigner son identifiant externe pour les applications, en haut à droite de la page.'
        );
        expect((paragraphs[1].nativeElement.textContent as string).trim()).toBe(
            'L\'identifiant externe pour les applications se trouve sur le site de MyHordes, dans la page de votre âme, onglet "Avancé". '
            + 'Une fois copié, il suffit de le coller dans le champ dédié sur le site de MyHordes Optimizer et de valider.'
        );
    });

    it('copies the current page URL when "Copier l\'URL" is clicked', (): void => {
        clickMenuItem('Copier l\'URL');

        expect(clipboard.copy).toHaveBeenCalledOnceWith(document.location.href, 'Le lien a bien été copié');
    });

    it('copies a forum-formatted summary joining the title and both paragraphs when "Copier au format forum" is clicked', (): void => {
        clickMenuItem('Copier au format forum');

        expect(clipboard.copy).toHaveBeenCalledOnceWith(
            '[b][big]Première utilisation du site[/big][/b]\n\n'
            + 'Lors de votre première utilisation du site vous n\'aurez pas accès aux pages sous le menu "Ma ville". '
            + 'En effet, il faut au préalable renseigner son identifiant externe pour les applications, en haut à droite de la page.\n\n'
            + 'L\'identifiant externe pour les applications se trouve sur le site de MyHordes, dans la page de votre âme, onglet "Avancé". '
            + 'Une fois copié, il suffit de le coller dans le champ dédié sur le site de MyHordes Optimizer et de valider.',
            'Le texte a bien été copié'
        );
    });
});
