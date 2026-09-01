import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuTrigger } from '@angular/material/menu';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ClipboardService } from '../../../_core/services/clipboard.service';
import { TutoScriptDisplayComponent } from './tuto-script-display.component';

describe('TutoScriptDisplayComponent', (): void => {
    let fixture: ComponentFixture<TutoScriptDisplayComponent>;
    let clipboard: jasmine.SpyObj<ClipboardService>;

    beforeEach(async (): Promise<void> => {
        clipboard = jasmine.createSpyObj<ClipboardService>('ClipboardService', ['copy']);

        await TestBed.configureTestingModule({
            imports: [TutoScriptDisplayComponent],
            providers: [{ provide: ClipboardService, useValue: clipboard }, provideNoopAnimations()]
        }).compileComponents();
        fixture = TestBed.createComponent(TutoScriptDisplayComponent);
        fixture.detectChanges();
    });

    function headerTexts(): string[] {
        return fixture.debugElement.queryAll(By.css('.mho-accordion-item-header'))
            .map((debugEl: DebugElement): string => (debugEl.nativeElement.childNodes[0].textContent as string).trim());
    }

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
        expect((titleEl.childNodes[0].textContent as string).trim()).toBe('Affichage');
    });

    it('renders one accordion item per display option, in order', (): void => {
        expect(headerTexts()).toEqual([
            'Affichage des tooltips détaillés',
            'Navigation rapide vers le chantier recommandé',
            'Champs de recherches supplémentaires',
            'Affichage de la liste de courses dans la page',
            'Affichage du nombre de zombies tués sur la case',
            'Affichage de l\'outil de traduction',
            'Afficher les PA manquants pour réparer les chantiers',
            'Prédictions de camping dans les informations du secteur',
            'Informations diverses issues de MyHordes Optimizer',
            'Affiche les estimations enregistrées sur la page de la tour de guet',
            'Ajoute un bouton permettant de copier le contenu du registre',
            'Affiche un compteur pour gérer l\'anti-abus',
            'Ouvre automatiquement le menu "Utiliser un objet de mon sac"',
            'Définir des options d\'escorte par défaut'
        ]);
    });

    it('copies the current page URL when "Copier l\'URL" is clicked', (): void => {
        clickMenuItem('Copier l\'URL');

        expect(clipboard.copy).toHaveBeenCalledOnceWith(document.location.href, 'Le lien a bien été copié');
    });

    it('copies a forum-formatted summary converting double <br /> into a newline when "Copier au format forum" is clicked', (): void => {
        clickMenuItem('Copier au format forum');

        expect(clipboard.copy).toHaveBeenCalledTimes(1);
        const text: string = clipboard.copy.calls.mostRecent().args[0] as string;

        expect(text.startsWith('[b][big]Affichage[/big][/b]')).toBe(true);
        expect(Array.from(text.matchAll(/\[collapse=(.*?)]/g)).map((m: RegExpMatchArray): string => m[1])).toEqual(headerTexts());
        expect(text).not.toContain('<br');
        expect(text).toContain(
            '[collapse=Affichage de la liste de courses dans la page]En cochant cette option, la liste de courses apparaitra lorsque vous vous trouverez dans le desert ou dans l\'atelier.\n'
            + '        Cette liste contient des informations de priorité, de quantité en banque, de quantité dans les sacs, de quantité totale requise, et de quantité manquante.\n'
        );
    });
});
