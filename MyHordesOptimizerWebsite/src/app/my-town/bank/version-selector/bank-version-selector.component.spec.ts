import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BankVersion } from '../../../_abstract_model/types/bank-version.class';
import { BankVersionSelectorComponent } from './bank-version-selector.component';

describe('BankVersionSelectorComponent', (): void => {
    let fixture: ComponentFixture<BankVersionSelectorComponent>;

    function version(id: number, time: string, user: string | null): BankVersion {
        return new BankVersion({ day: 3, lastUpdateId: id, updateTime: time, userName: user });
    }

    const versions: BankVersion[] = [
        version(10, '2026-01-15T15:47:00', 'Zerah'),
        version(20, '2026-01-15T17:05:00', null),
        version(30, '2026-01-15T18:30:00', 'Autre')
    ];

    async function render(value: number): Promise<void> {
        await TestBed.configureTestingModule({
            imports: [BankVersionSelectorComponent],
            providers: [{ provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' }]
        }).compileComponents();
        fixture = TestBed.createComponent(BankVersionSelectorComponent);
        fixture.componentRef.setInput('versions', versions);
        fixture.componentRef.setInput('value', value);
        fixture.detectChanges();
    }

    function button(action: string): HTMLButtonElement {
        return (fixture.nativeElement as HTMLElement).querySelector(`button[data-action="${action}"]`) as HTMLButtonElement;
    }

    function menuItems(): HTMLButtonElement[] {
        return Array.from(document.querySelectorAll<HTMLButtonElement>('.mat-mdc-menu-panel button[data-action="select-version"]'));
    }

    it('affiche l\'heure de Paris et l\'auteur de la version choisie', async (): Promise<void> => {
        await render(10);

        expect(button('pick-version').textContent).toContain('16:47 · Zerah');
    });

    it('omet l\'auteur quand il est nul', async (): Promise<void> => {
        await render(20);

        expect(button('pick-version').textContent).toContain('18:05');
        expect(button('pick-version').textContent).not.toContain('·');
    });

    it('précédente / suivante change la valeur et se désactivent aux extrémités', async (): Promise<void> => {
        await render(20);

        button('previous-version').click();
        expect(fixture.componentInstance.value()).toBe(10);
        fixture.detectChanges();
        expect(button('previous-version').disabled).toBe(true);
        expect(button('next-version').disabled).toBe(false);

        button('next-version').click();
        button('next-version').click();
        fixture.detectChanges();
        expect(fixture.componentInstance.value()).toBe(30);
        expect(button('next-version').disabled).toBe(true);
        expect(button('previous-version').getAttribute('aria-label')).toBe('Version précédente');
        expect(button('next-version').getAttribute('aria-label')).toBe('Version suivante');
    });

    it('marque la dernière version dans la liste et émet la version choisie', async (): Promise<void> => {
        await render(20);

        button('pick-version').click();
        fixture.detectChanges();

        const items: HTMLButtonElement[] = menuItems();
        expect(items.length).toBe(3);
        expect(items[1].classList.contains('selected')).toBe(true);
        expect(items[0].querySelector('.latest')).toBeNull();
        expect(items[2].querySelector('.latest')).not.toBeNull();

        items[0].click();
        expect(fixture.componentInstance.value()).toBe(10);
    });
});
