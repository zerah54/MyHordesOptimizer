import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuTrigger } from '@angular/material/menu';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ClipboardService } from '../../../_core/services/clipboard.service';
import { TutoDiscordBotInstallationComponent } from './tuto-discord-bot-installation.component';

describe('TutoDiscordBotInstallationComponent', (): void => {
    let fixture: ComponentFixture<TutoDiscordBotInstallationComponent>;
    let clipboard: jasmine.SpyObj<ClipboardService>;

    beforeEach(async (): Promise<void> => {
        clipboard = jasmine.createSpyObj<ClipboardService>('ClipboardService', ['copy']);

        await TestBed.configureTestingModule({
            imports: [TutoDiscordBotInstallationComponent],
            providers: [{ provide: ClipboardService, useValue: clipboard }, provideNoopAnimations()]
        }).compileComponents();
        fixture = TestBed.createComponent(TutoDiscordBotInstallationComponent);
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
        expect((titleEl.childNodes[0].textContent as string).trim()).toBe('Installation du Bot Discord');
    });

    it('renders one accordion item per installation method, in order', (): void => {
        expect(headerTexts()).toEqual(['En tant qu\'application (Recommandé)', 'Sur un serveur']);
    });

    it('copies the current page URL when "Copier l\'URL" is clicked', (): void => {
        clickMenuItem('Copier l\'URL');

        expect(clipboard.copy).toHaveBeenCalledOnceWith(document.location.href, 'Le lien a bien été copié');
    });

    it('copies a forum-formatted summary converting the accordion HTML to BBCode when "Copier au format forum" is clicked', (): void => {
        clickMenuItem('Copier au format forum');

        expect(clipboard.copy).toHaveBeenCalledTimes(1);
        const text: string = clipboard.copy.calls.mostRecent().args[0] as string;

        expect(text.startsWith('[b][big]Installation du Bot Discord[/big][/b]')).toBe(true);
        expect(Array.from(text.matchAll(/\[collapse=(.*?)]/g)).map((m: RegExpMatchArray): string => m[1])).toEqual(headerTexts());
        expect(text).not.toContain('<br>');
        expect(text).not.toContain('<strong>');
        expect(text).toContain('[b]Ajouter à mes applications[/b]');
        // Le lien reste en HTML brut : la regex de conversion attend un attribut avant href, absent ici (href est le premier attribut).
        expect(text).toContain('<a href="https://discord.com/oauth2/authorize?client_id=1140035117746765914" target="_blank">lien d\'installation du bot</a>');
    });
});
