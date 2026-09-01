import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuTrigger } from '@angular/material/menu';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ClipboardService } from '../../../_core/services/clipboard.service';
import { TutoScriptInstallationComponent } from './tuto-script-installation.component';

describe('TutoScriptInstallationComponent', (): void => {
    let fixture: ComponentFixture<TutoScriptInstallationComponent>;
    let clipboard: jasmine.SpyObj<ClipboardService>;

    beforeEach(async (): Promise<void> => {
        clipboard = jasmine.createSpyObj<ClipboardService>('ClipboardService', ['copy']);

        await TestBed.configureTestingModule({
            imports: [TutoScriptInstallationComponent],
            providers: [{ provide: ClipboardService, useValue: clipboard }, provideNoopAnimations()]
        }).compileComponents();
        fixture = TestBed.createComponent(TutoScriptInstallationComponent);
        fixture.detectChanges();
    });

    function headerTexts(): string[] {
        return fixture.debugElement.queryAll(By.css('.mho-accordion-item-header'))
            .map((debugEl: DebugElement): string => (debugEl.nativeElement.childNodes[0].textContent as string).trim());
    }

    function sectionTitles(): string[] {
        return fixture.debugElement.queryAll(By.css('h3')).map((debugEl: DebugElement): string => (debugEl.nativeElement.textContent as string).trim());
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
        expect((titleEl.childNodes[0].textContent as string).trim()).toBe('Script / Extension');
    });

    it('renders the extension section before the script section, each with its own accordion and closing paragraph', (): void => {
        expect(sectionTitles()).toEqual(['Installation de l\'extension de navigateur', 'Installation du script']);
        expect(headerTexts()).toEqual(['Firefox', 'Chrome', 'Ordinateur', 'Android', 'iOS']);

        const paragraphs: string[] = fixture.debugElement.queryAll(By.css('mat-card-content p'))
            .map((debugEl: DebugElement): string => (debugEl.nativeElement.textContent as string).trim());
        expect(paragraphs[0]).toContain('Une fois l\'extension installée, il faudra rafraîchir la page du jeu');
        expect(paragraphs[1]).toContain('Une fois le script installé, il faudra rafraîchir la page du jeu');
    });

    it('copies the current page URL when "Copier l\'URL" is clicked', (): void => {
        clickMenuItem('Copier l\'URL');

        expect(clipboard.copy).toHaveBeenCalledOnceWith(document.location.href, 'Le lien a bien été copié');
    });

    it('copies a forum-formatted summary with extension items first, then the script items, separated by {hr}', (): void => {
        clickMenuItem('Copier au format forum');

        expect(clipboard.copy).toHaveBeenCalledTimes(1);
        const text: string = clipboard.copy.calls.mostRecent().args[0] as string;

        expect(text.startsWith('[b][big]Script / Extension[/big][/b]{hr}')).toBe(true);
        expect((text.match(/{hr}/g) ?? []).length).toBe(2);
        expect(Array.from(text.matchAll(/\[collapse=(.*?)]/g)).map((m: RegExpMatchArray): string => m[1]))
            .toEqual(['Firefox', 'Chrome', 'Ordinateur', 'Android', 'iOS']);

        const firstHr: number = text.indexOf('{hr}');
        const secondHr: number = text.indexOf('{hr}', firstHr + 1);
        expect(text.indexOf('Une fois l\'extension installée')).toBeGreaterThan(firstHr);
        expect(text.indexOf('Une fois l\'extension installée')).toBeLessThan(secondHr);
        expect(text.indexOf('Une fois le script installé')).toBeGreaterThan(secondHr);

        expect(text).not.toContain('<ul>');
        expect(text).not.toContain('<li>');
        expect(text).toContain('[0]Installer un navigateur acceptant les extensions');
        // La regex de conversion <a ... href="..." ...>texte</a> -> [link=href]texte[/link] exige un attribut avant href ;
        // ici href est toujours le premier attribut, donc aucun lien n'est jamais converti (même limite que discord-bot-installation).
        expect(text).toContain('<a href="https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/my_hordes_optimizer.user.js" target="_blank">lien de téléchargement du script</a>');
        expect(text).toContain('<a href="https://addons.mozilla.org/fr/firefox/addon/mho-addon" target="_blank">page de l\'extension</a>');
    });
});
