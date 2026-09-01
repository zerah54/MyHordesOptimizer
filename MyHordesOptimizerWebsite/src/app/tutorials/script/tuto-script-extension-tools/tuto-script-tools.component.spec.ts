import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuTrigger } from '@angular/material/menu';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ClipboardService } from '../../../_core/services/clipboard.service';
import { TutoScriptToolsComponent } from './tuto-script-tools.component';

describe('TutoScriptToolsComponent', (): void => {
    let fixture: ComponentFixture<TutoScriptToolsComponent>;
    let clipboard: jasmine.SpyObj<ClipboardService>;

    beforeEach(async (): Promise<void> => {
        clipboard = jasmine.createSpyObj<ClipboardService>('ClipboardService', ['copy']);

        await TestBed.configureTestingModule({
            imports: [TutoScriptToolsComponent],
            providers: [{ provide: ClipboardService, useValue: clipboard }, provideNoopAnimations()]
        }).compileComponents();
        fixture = TestBed.createComponent(TutoScriptToolsComponent);
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
        expect((titleEl.childNodes[0].textContent as string).trim()).toBe('Outils');
    });

    it('renders one accordion item per tool, in order', (): void => {
        expect(headerTexts()).toEqual(['Banque', 'Camping']);
    });

    it('copies the current page URL when "Copier l\'URL" is clicked', (): void => {
        clickMenuItem('Copier l\'URL');

        expect(clipboard.copy).toHaveBeenCalledOnceWith(document.location.href, 'Le lien a bien été copié');
    });

    it('copies a forum-formatted summary converting double <br /> into a newline when "Copier au format forum" is clicked', (): void => {
        clickMenuItem('Copier au format forum');

        expect(clipboard.copy).toHaveBeenCalledTimes(1);
        const text: string = clipboard.copy.calls.mostRecent().args[0] as string;

        expect(text.startsWith('[b][big]Outils[/big][/b]')).toBe(true);
        expect(Array.from(text.matchAll(/\[collapse=(.*?)]/g)).map((m: RegExpMatchArray): string => m[1])).toEqual(['Banque', 'Camping']);
        expect(text).not.toContain('<br');
        expect(text).toContain(
            '[collapse=Banque]Affiche la liste des objets de la banque et leur quantité.\n\n'
            + '                Si vous êtes incarnés, les objets qui ne sont pas dans la liste de courses sont suivis d\'un bouton présentant un caddie.'
        );
    });
});
