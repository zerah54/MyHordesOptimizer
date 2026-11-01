import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DaySelectorComponent } from './day-selector.component';
import { DaysUpToPipe } from './days-up-to.pipe';

describe('DaySelectorComponent', (): void => {
    let fixture: ComponentFixture<DaySelectorComponent>;
    let emitted: number[];

    async function render(days: number[], value: number, today: number): Promise<void> {
        await TestBed.configureTestingModule({
            imports: [DaySelectorComponent],
            providers: [{ provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' }]
        }).compileComponents();
        fixture = TestBed.createComponent(DaySelectorComponent);
        fixture.componentRef.setInput('days', days);
        fixture.componentRef.setInput('value', value);
        fixture.componentRef.setInput('today', today);
        emitted = [];
        fixture.componentInstance.valueChange.subscribe((day: number): void => {
            emitted.push(day);
        });
        fixture.detectChanges();
    }

    function button(action: string): HTMLButtonElement {
        return (fixture.nativeElement as HTMLElement).querySelector(`button[data-action="${action}"]`) as HTMLButtonElement;
    }

    function menuItems(): HTMLButtonElement[] {
        return Array.from(document.querySelectorAll<HTMLButtonElement>('.mat-mdc-menu-panel button[data-action="select-day"]'));
    }

    it('affiche le jour sélectionné', async (): Promise<void> => {
        await render([1, 2, 3], 2, 3);

        expect((fixture.nativeElement as HTMLElement).querySelector('.day')?.textContent).toContain('J2');
    });

    it('signale aujourd\'hui uniquement sur le jour courant', async (): Promise<void> => {
        await render([1, 2, 3], 2, 3);
        expect((fixture.nativeElement as HTMLElement).querySelector('.day .today')).toBeNull();

        fixture.componentRef.setInput('value', 3);
        fixture.detectChanges();

        expect((fixture.nativeElement as HTMLElement).querySelector('.day .today')).not.toBeNull();
    });

    it('passe au jour voisin de la liste en sautant les jours absents', async (): Promise<void> => {
        await render([7, 10, 15], 10, 10);

        button('previous-day').click();
        button('next-day').click();

        expect(emitted).toEqual([7, 15]);
    });

    it('bloque le précédent sur le premier jour', async (): Promise<void> => {
        await render([1, 2], 1, 2);

        expect(button('previous-day').disabled).toBe(true);
        expect(button('next-day').disabled).toBe(false);
    });

    it('bloque le suivant sur le dernier jour', async (): Promise<void> => {
        await render([1, 2], 2, 2);

        expect(button('previous-day').disabled).toBe(false);
        expect(button('next-day').disabled).toBe(true);
    });

    it('nomme les boutons icônes pour les lecteurs d\'écran', async (): Promise<void> => {
        await render([1, 2, 3], 2, 3);

        expect(button('previous-day').getAttribute('aria-label')).toBe('Jour précédent');
        expect(button('next-day').getAttribute('aria-label')).toBe('Jour suivant');
    });

    it('propose tous les jours dans le menu et émet le jour choisi', async (): Promise<void> => {
        await render([1, 2, 3], 2, 3);

        button('pick-day').click();
        fixture.detectChanges();

        const items: HTMLButtonElement[] = menuItems();
        expect(items.length).toBe(3);
        expect(items[0].textContent).toContain('J1');
        expect(items[1].classList.contains('selected')).toBe(true);
        expect(items[2].querySelector('.today')).not.toBeNull();

        items[0].click();

        expect(emitted).toEqual([1]);
    });

    it('n\'ouvre pas le menu quand il n\'y a qu\'un seul jour', async (): Promise<void> => {
        await render([1], 1, 1);

        expect(button('pick-day').disabled).toBe(true);
    });
});

describe('DaysUpToPipe', (): void => {
    it('liste les jours de J1 au dernier jour inclus', (): void => {
        expect(new DaysUpToPipe().transform(3)).toEqual([1, 2, 3]);
    });
});
