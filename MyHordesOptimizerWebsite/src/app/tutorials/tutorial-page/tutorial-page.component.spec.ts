import { ANIMATION_MODULE_TYPE, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuTrigger } from '@angular/material/menu';
import { By } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import type { MockedObject } from 'vitest';

import { ClipboardService } from '../../_core/services/clipboard.service';
import { TUTORIAL_ROUTE_DATA_KEY, TutorialPage } from '../_model/tutorial.model';
import { TutorialPageComponent } from './tutorial-page.component';

const PAGE: TutorialPage = {
    title: 'Titre du tutoriel',
    lead: 'Introduction',
    sections: [
        { title: 'Premier groupe', items: [{ title: 'Un', content: '<p>Contenu <strong>un</strong></p>' }, { title: 'Deux', content: 'Contenu deux' }] },
        { items: [{ title: 'Trois', content: 'Contenu trois' }], outro: 'Conclusion' }
    ]
};

describe('TutorialPageComponent', (): void => {
    let fixture: ComponentFixture<TutorialPageComponent>;
    let clipboard: MockedObject<ClipboardService>;

    beforeEach(async (): Promise<void> => {
        clipboard = { copy: vi.fn().mockName('ClipboardService.copy') } as unknown as MockedObject<ClipboardService>;
        await TestBed.configureTestingModule({
            imports: [TutorialPageComponent],
            providers: [
                { provide: ClipboardService, useValue: clipboard },
                { provide: ActivatedRoute, useValue: { snapshot: { data: { [TUTORIAL_ROUTE_DATA_KEY]: PAGE } } } },
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(TutorialPageComponent);
        fixture.detectChanges();
    });

    function clickMenuItem(label: string): void {
        fixture.debugElement.query(By.directive(MatMenuTrigger)).injector.get(MatMenuTrigger).openMenu();
        fixture.detectChanges();
        Array.from(document.querySelectorAll<HTMLElement>('.mat-mdc-menu-panel [mat-menu-item]'))
            .find((element: HTMLElement): boolean => element.textContent?.trim() === label)
            ?.click();
    }

    it('renders the title, the lead, the section titles and the outro', (): void => {
        const element: HTMLElement = fixture.nativeElement;
        expect(element.querySelector('mat-card-title')?.childNodes[0].textContent?.trim()).toBe('Titre du tutoriel');
        expect(element.querySelector('.lead')?.textContent).toBe('Introduction');
        expect(Array.from(element.querySelectorAll('h2')).map((h2: Element): string => h2.textContent ?? '')).toEqual(['Premier groupe']);
        expect(element.querySelector('.outro')?.textContent).toBe('Conclusion');
    });

    it('renders one accordion item per entry, in order', (): void => {
        const headers: string[] = fixture.debugElement.queryAll(By.css('.mho-accordion-item-header'))
            .map((header: DebugElement): string => (header.nativeElement.childNodes[0].textContent as string).trim());
        expect(headers).toEqual(['Un', 'Deux', 'Trois']);
    });

    it('copies the page URL', (): void => {
        clickMenuItem('Copier l\'URL');
        expect(clipboard.copy).toHaveBeenCalledWith(document.location.href, 'Le lien a bien été copié');
    });

    it('copies the page in the forum format', (): void => {
        clickMenuItem('Copier au format forum');
        const text: string = clipboard.copy.mock.calls[0][0] as string;
        expect(text.startsWith('[b][big]Titre du tutoriel[/big][/b]')).toBe(true);
        expect(text).toContain('[collapse=Un]Contenu [b]un[/b][/collapse]');
        expect(text).toContain('{hr}');
    });
});
