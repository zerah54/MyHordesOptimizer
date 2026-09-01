import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuTrigger } from '@angular/material/menu';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ClipboardService } from '../../../_core/services/clipboard.service';
import { TutoScriptAlertsComponent } from './tuto-script-alerts.component';

describe('TutoScriptAlertsComponent', (): void => {
    let fixture: ComponentFixture<TutoScriptAlertsComponent>;
    let clipboard: jasmine.SpyObj<ClipboardService>;

    beforeEach(async (): Promise<void> => {
        clipboard = jasmine.createSpyObj<ClipboardService>('ClipboardService', ['copy']);

        await TestBed.configureTestingModule({
            imports: [TutoScriptAlertsComponent],
            providers: [{ provide: ClipboardService, useValue: clipboard }, provideNoopAnimations()]
        }).compileComponents();
        fixture = TestBed.createComponent(TutoScriptAlertsComponent);
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
        expect((titleEl.childNodes[0].textContent as string).trim()).toBe('Notifications');
    });

    it('renders one accordion item per notification setting, in order', (): void => {
        expect(headerTexts()).toEqual([
            'Avertissement en cas de fermeture de la page',
            'Avertissement en cas d\'inactivité',
            'Notification à la fin de la fouille',
            'Notification de nouveau message'
        ]);
    });

    it('copies the current page URL when "Copier l\'URL" is clicked', (): void => {
        clickMenuItem('Copier l\'URL');

        // Ce fichier lit window.location.href directement (pas de DOCUMENT injecté, contrairement aux 7 autres du lot) ;
        // indiscernable de document.location.href en environnement navigateur, cette divergence n'est donc caractérisable qu'en lisant le code source.
        expect(clipboard.copy).toHaveBeenCalledOnceWith(window.location.href, 'Le lien a bien été copié');
    });

    it('copies a forum-formatted summary of every setting, unescaped, when "Copier au format forum" is clicked', (): void => {
        clickMenuItem('Copier au format forum');

        expect(clipboard.copy).toHaveBeenCalledTimes(1);
        const text: string = clipboard.copy.calls.mostRecent().args[0] as string;

        expect(text.startsWith('[b][big]Notifications[/big][/b]')).toBe(true);
        expect(Array.from(text.matchAll(/\[collapse=(.*?)]/g)).map((m: RegExpMatchArray): string => m[1])).toEqual(headerTexts());
        // Ce composant n'applique aucune transformation HTML->BBCode : le contenu est copié tel quel.
        expect(text).toContain('[collapse=Notification de nouveau message]Si vous cochez l\'option "Me notifier si je reçois un nouveau message"');
    });
});
