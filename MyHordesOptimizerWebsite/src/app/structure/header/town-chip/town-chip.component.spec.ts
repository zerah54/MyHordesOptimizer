import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TownDetails } from '../../../_abstract_model/types/town-details.class';
import { setTown } from '../../../_core/utilities/localstorage.util';
import { TownChipComponent } from './town-chip.component';

interface TestableComponent {
    summary(): string;
}

function makeTown(overrides: Partial<TownDetails>): TownDetails {
    return Object.assign(new TownDetails(), { town_id: 42, day: 12, town_type: 'RE', is_chaos: false, is_devaste: false }, overrides);
}

describe('TownChipComponent', (): void => {
    let fixture: ComponentFixture<TownChipComponent>;

    beforeEach(async (): Promise<void> => {
        setTown(null);
        await TestBed.configureTestingModule({ imports: [TownChipComponent] }).compileComponents();
        fixture = TestBed.createComponent(TownChipComponent);
    });

    afterEach((): void => {
        setTown(null);
    });

    it('n\'affiche rien hors d\'une ville', (): void => {
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.chip')).toBeNull();
    });

    it('affiche le nom, le jour, le type et les états, et les réunit en infobulle', (): void => {
        setTown(makeTown({ town_name: 'Fort des Lapins', is_chaos: true }));
        fixture.detectChanges();
        const element: HTMLElement = fixture.nativeElement;

        expect(element.querySelector('.town-name')?.textContent).toBe('Fort des Lapins');
        expect(element.querySelector('.day')?.textContent).toContain('12');
        expect(element.querySelector('.dim.type')?.textContent).toBe('Région éloignée');
        expect(element.querySelector('.town-flag.chaos')).not.toBeNull();
        expect(element.querySelector('.town-flag.devastated')).toBeNull();
        expect(element.querySelector('.town-flag.observed')).toBeNull();
        expect((fixture.componentInstance as unknown as TestableComponent).summary()).toBe('Fort des Lapins · Région éloignée');
    });

    it('n\'affiche que « Dévastée » pour une ville dévastée, toujours en chaos', (): void => {
        setTown(makeTown({ is_chaos: true, is_devaste: true }));
        fixture.detectChanges();
        const element: HTMLElement = fixture.nativeElement;

        expect(element.querySelector('.town-flag.devastated')).not.toBeNull();
        expect(element.querySelector('.town-flag.chaos')).toBeNull();
    });

    it('prend les couleurs du menu quand il y est placé', (): void => {
        setTown(makeTown({}));
        fixture.componentRef.setInput('placement', 'menu');
        fixture.detectChanges();

        expect(fixture.nativeElement.classList).toContain('in-menu');
    });
});
