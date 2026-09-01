import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuTrigger } from '@angular/material/menu';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ClipboardService } from '../../../_core/services/clipboard.service';
import { TutoScriptExternalToolsComponent } from './tuto-script-external-tools.component';

describe('TutoScriptExternalToolsComponent', (): void => {
    let fixture: ComponentFixture<TutoScriptExternalToolsComponent>;
    let clipboard: jasmine.SpyObj<ClipboardService>;

    beforeEach(async (): Promise<void> => {
        clipboard = jasmine.createSpyObj<ClipboardService>('ClipboardService', ['copy']);

        await TestBed.configureTestingModule({
            imports: [TutoScriptExternalToolsComponent],
            providers: [{ provide: ClipboardService, useValue: clipboard }, provideNoopAnimations()]
        }).compileComponents();
        fixture = TestBed.createComponent(TutoScriptExternalToolsComponent);
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
        expect((titleEl.childNodes[0].textContent as string).trim()).toBe('Outils externes');
    });

    it('renders one accordion item per external tool, in order', (): void => {
        expect(headerTexts()).toEqual([
            'MyHordes Optimizer',
            'Gest\'Hordes',
            'BigBroth\'Hordes',
            'Fata Morgana',
            'Affichage des cartes issues des outils externes'
        ]);
    });

    it('copies the current page URL when "Copier l\'URL" is clicked', (): void => {
        clickMenuItem('Copier l\'URL');

        expect(clipboard.copy).toHaveBeenCalledOnceWith(document.location.href, 'Le lien a bien été copié');
    });

    it('copies a forum-formatted summary (header + items) converting lists/bold/double-br to BBCode when "Copier au format forum" is clicked', (): void => {
        clickMenuItem('Copier au format forum');

        expect(clipboard.copy).toHaveBeenCalledTimes(1);
        const text: string = clipboard.copy.calls.mostRecent().args[0] as string;

        expect(text.startsWith('[b][big]Outils externes[/big][/b]')).toBe(true);
        // Le paragraphe d'introduction (header) est inclus avant les collapse.
        expect(text).toContain('Une des fonctionnalités du script est de permettre la mise à jour de plusieurs outils externes en un seul clic');
        expect(text.indexOf('Une des fonctionnalités')).toBeLessThan(text.indexOf('[collapse='));
        expect(Array.from(text.matchAll(/\[collapse=(.*?)]/g)).map((m: RegExpMatchArray): string => m[1])).toEqual(headerTexts());
        expect(text).not.toContain('<ul>');
        expect(text).not.toContain('<li>');
        expect(text).not.toContain('<strong>');
        expect(text).not.toContain('<br');
        expect(text).toContain('[0][b]Nombre de zombies tués :[/b] Enregistre le nombre de zombies tués sur la case');
    });
});
