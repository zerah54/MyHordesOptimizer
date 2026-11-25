import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NightwatchStore } from '../nightwatch.store';
import { createFakeNightwatchStore, FakeNightwatchStore } from '../nightwatch.store.fake';
import { emptyNightwatchContent } from '../nightwatch.types';
import { NightwatchStatusesComponent } from './nightwatch-statuses.component';

describe('NightwatchStatusesComponent', (): void => {
    let fake: FakeNightwatchStore;
    let fixture: ComponentFixture<NightwatchStatusesComponent>;

    /**
     * Rend les statuts du veilleur 1.
     * @param {string[]} statuses Statuts prévus.
     */
    async function render(statuses: string[]): Promise<void> {
        fake = createFakeNightwatchStore({ ...emptyNightwatchContent(), watchers: [{ userId: 1, statuses, items: {}, hasDiscourse: false }] });
        await TestBed.configureTestingModule({
            imports: [NightwatchStatusesComponent],
            providers: [
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                { provide: NightwatchStore, useValue: fake.store }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(NightwatchStatusesComponent);
        fixture.componentRef.setInput('userId', 1);
        fixture.detectChanges();
        await fixture.whenStable();
    }

    /** Racine du composant. */
    function root(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    /**
     * Bouton d'un choix du chien.
     * @param {string} value Valeur du choix (`none`, `dog`, `dogSteak`).
     * @returns {HTMLButtonElement | null} Bouton.
     */
    function dogButton(value: string): HTMLButtonElement | null {
        return root().querySelector<HTMLButtonElement>(`mat-button-toggle[data-dog="${value}"] button`);
    }

    afterEach((): void => {
        TestBed.resetTestingModule();
    });

    it('chien et chien avec steak : un choix exclusif hors des puces', async (): Promise<void> => {
        await render(['dog']);

        const chips: string[] = Array.from(root().querySelectorAll('mat-chip-option')).map((chip: Element): string => chip.getAttribute('data-status') ?? '');
        expect(chips).toEqual(['drugged', 'drunk', 'thirsty', 'immune', 'ghoul']);
        expect(dogButton('dog')?.getAttribute('aria-checked')).toBe('true');
        expect(dogButton('none')?.getAttribute('aria-checked')).toBe('false');
    });

    it('choisir « Chien avec steak » → toggleStatus(dogSteak) ; « Sans chien » retire le chien prévu', async (): Promise<void> => {
        await render(['dog']);

        dogButton('dogSteak')?.click();
        expect(fake.actions.toggleStatus).toHaveBeenCalledWith(1, 'dogSteak');
        dogButton('none')?.click();
        expect(fake.actions.toggleStatus).toHaveBeenLastCalledWith(1, 'dog');
    });

    it('puce cochée par l\'utilisateur → toggleStatus', async (): Promise<void> => {
        await render([]);

        root().querySelector<HTMLButtonElement>('mat-chip-option[data-status="drunk"] button.mdc-evolution-chip__action--primary')?.click();

        expect(fake.actions.toggleStatus).toHaveBeenCalledWith(1, 'drunk');
    });
});
