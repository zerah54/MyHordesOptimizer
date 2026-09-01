import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuTrigger } from '@angular/material/menu';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ClipboardService } from '../../../_core/services/clipboard.service';
import { TutoScriptWikiComponent } from './tuto-script-wiki.component';

describe('TutoScriptWikiComponent', (): void => {
    let fixture: ComponentFixture<TutoScriptWikiComponent>;
    let clipboard: jasmine.SpyObj<ClipboardService>;

    beforeEach(async (): Promise<void> => {
        clipboard = jasmine.createSpyObj<ClipboardService>('ClipboardService', ['copy']);

        await TestBed.configureTestingModule({
            imports: [TutoScriptWikiComponent],
            providers: [{ provide: ClipboardService, useValue: clipboard }, provideNoopAnimations()]
        }).compileComponents();
        fixture = TestBed.createComponent(TutoScriptWikiComponent);
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
        expect((titleEl.childNodes[0].textContent as string).trim()).toBe('Wiki');
    });

    it('renders one accordion item per wiki section, in order', (): void => {
        expect(headerTexts()).toEqual(['Objets', 'Recettes', 'Pouvoirs', 'Bâtiments']);
    });

    it('copies the current page URL when "Copier l\'URL" is clicked', (): void => {
        clickMenuItem('Copier l\'URL');

        expect(clipboard.copy).toHaveBeenCalledOnceWith(document.location.href, 'Le lien a bien été copié');
    });

    it('copies a forum-formatted summary converting double <br /> into a newline when "Copier au format forum" is clicked', (): void => {
        clickMenuItem('Copier au format forum');

        expect(clipboard.copy).toHaveBeenCalledTimes(1);
        const text: string = clipboard.copy.calls.mostRecent().args[0] as string;

        expect(text.startsWith('[b][big]Wiki[/big][/b]')).toBe(true);
        expect(Array.from(text.matchAll(/\[collapse=(.*?)]/g)).map((m: RegExpMatchArray): string => m[1])).toEqual(['Objets', 'Recettes', 'Pouvoirs', 'Bâtiments']);
        expect(text).not.toContain('<br');
        expect(text).toContain(
            '[collapse=Objets]Affiche la liste de tous les objets existant dans MyHordes (ainsi que des informations complémentaires à leur sujet).\n\n'
            + '                Si vous êtes incarné, les objets qui ne sont pas dans la liste de courses sont suivis d\'un bouton présentant un caddie.'
        );
    });
});
