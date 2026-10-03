import { ANIMATION_MODULE_TYPE, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuTrigger } from '@angular/material/menu';
import { By } from '@angular/platform-browser';
import type { MockedObject } from 'vitest';

import { ClipboardService } from '../../../_core/services/clipboard.service';
import { TutoSiteFirstUseComponent } from './tuto-site-first-use.component';

describe('TutoSiteFirstUseComponent', (): void => {
    let fixture: ComponentFixture<TutoSiteFirstUseComponent>;
    let clipboard: MockedObject<ClipboardService>;

    beforeEach(async (): Promise<void> => {
        clipboard = {
            copy: vi.fn().mockName('ClipboardService.copy')
        } as unknown as MockedObject<ClipboardService>;

        await TestBed.configureTestingModule({
            imports: [TutoSiteFirstUseComponent],
            providers: [{ provide: ClipboardService, useValue: clipboard }, { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' }]
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

    it('explains the sign-in flow as three ordered steps, between a lead and a closing note', (): void => {
        const lead: HTMLElement = fixture.debugElement.query(By.css('.first-use .lead')).nativeElement;
        const steps: DebugElement[] = fixture.debugElement.queryAll(By.css('.first-use ol.steps > li.step'));
        const note: HTMLElement = fixture.debugElement.query(By.css('.first-use .note')).nativeElement;

        expect((lead.textContent as string).trim()).toBe('Les pages du menu "Ma ville" ne s\'ouvrent qu\'une fois le site relié à votre compte MyHordes. '
            + 'Cela se fait une seule fois, en trois étapes.');
        expect(steps.map((step: DebugElement): string => (step.query(By.css('.step-title')).nativeElement.textContent as string).trim()))
            .toEqual(['Cliquez sur "Se connecter"', 'Autorisez MyHordes Optimizer', 'C\'est prêt']);
        expect(steps.map((step: DebugElement): string => (step.query(By.css('.step-number')).nativeElement.textContent as string).trim()))
            .toEqual(['1', '2', '3']);
        expect((note.textContent as string).trim()).toContain('identifiant externe pour les applications');
    });

    it('no longer describes the manual external-id field as the way in', (): void => {
        const text: string = (fixture.nativeElement as HTMLElement).textContent ?? '';

        expect(text).not.toContain('champ dédié');
        expect(text).toContain('Se connecter');
    });

    it('copies the current page URL when "Copier l\'URL" is clicked', (): void => {
        clickMenuItem('Copier l\'URL');

        expect(clipboard.copy).toHaveBeenCalledTimes(1);

        expect(clipboard.copy).toHaveBeenCalledWith(document.location.href, 'Le lien a bien été copié');
    });

    it('copies a forum-formatted version with the lead, numbered steps and note when "Copier au format forum" is clicked', (): void => {
        clickMenuItem('Copier au format forum');

        expect(clipboard.copy).toHaveBeenCalledTimes(1);

        expect(clipboard.copy).toHaveBeenCalledWith('[b][big]Première utilisation du site[/big][/b]\n\n'
            + 'Les pages du menu "Ma ville" ne s\'ouvrent qu\'une fois le site relié à votre compte MyHordes. '
            + 'Cela se fait une seule fois, en trois étapes.\n\n'
            + '[b]1. Cliquez sur "Se connecter"[/b]\nLe bouton se trouve en haut à droite de la page.\n\n'
            + '[b]2. Autorisez MyHordes Optimizer[/b]\nVous êtes envoyé sur MyHordes, qui vous demande d\'autoriser MyHordes Optimizer à lire vos informations de jeu.\n\n'
            + '[b]3. C\'est prêt[/b]\nVous revenez ici connecté, et le menu "Ma ville" se débloque.\n\n'
            + '[i]Cette autorisation remplace la saisie manuelle de l\'identifiant externe pour les applications, '
            + 'qui se trouvait dans la page de votre âme sur MyHordes, onglet "Avancé".[/i]', 'Le texte a bien été copié');
    });
});
