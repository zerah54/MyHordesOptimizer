import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';

import { DespairDeathsCalculatorComponent } from './despair-deaths-calculator.component';

describe('DespairDeathsCalculatorComponent', (): void => {
    let fixture: ComponentFixture<DespairDeathsCalculatorComponent>;
    let component: DespairDeathsCalculatorComponent;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [DespairDeathsCalculatorComponent],
            providers: [{ provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } }]
        }).compileComponents();

        fixture = TestBed.createComponent(DespairDeathsCalculatorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('starts with a single day, all fields empty', (): void => {
        expect(component['days'].length).toBe(1);
        expect(component['days'][0].nb_zombies).toBeNull();
        expect(component['days'][0].nb_killed_zombies).toBeNull();
        expect(component['days'][0].nb_night_dead_zombies).toBeNull();
    });

    it('renders one .day block per entry in days', (): void => {
        const blocks = fixture.debugElement.queryAll(By.css('.day'));
        expect(blocks.length).toBe(1);
    });

    it('rebuildElements derives the next day from the current one, then stops once no zombie dies at night', (): void => {
        component['days'][0].nb_zombies = 10;
        component['days'][0].nb_killed_zombies = 5;

        component['rebuildElements']();

        const days = component['days'];
        expect(days.length).toBe(3);
        // floor(max(0, (5 + 0 - 1) / 2)) = 2
        expect(days[1].nb_night_dead_zombies).toBe(2);
        expect(days[1].nb_zombies).toBe(8);
        // floor(max(0, (0 + 2 - 1) / 2)) = 0 -> loop stops
        expect(days[2].nb_night_dead_zombies).toBe(0);
        expect(days[2].nb_zombies).toBe(8);
    });

    it('re-rendering updates the DOM with the newly computed days', (): void => {
        component['days'][0].nb_zombies = 10;
        component['days'][0].nb_killed_zombies = 5;

        component['rebuildElements']();
        fixture.detectChanges();

        const blocks = fixture.debugElement.queryAll(By.css('.day'));
        expect(blocks.length).toBe(3);
    });

    it('preserves a manually entered nb_killed_zombies for a later day across a recompute', (): void => {
        component['days'][0].nb_zombies = 10;
        component['days'][0].nb_killed_zombies = 5;
        component['rebuildElements']();

        // Le joueur saisit manuellement les zombies tués le jour J+1.
        component['days'][1].nb_killed_zombies = 3;
        component['rebuildElements']();

        expect(component['days'][1].nb_killed_zombies).toBe(3);
        // floor(max(0, (3 + 2 - 1) / 2)) = 2, recalculé à partir de la valeur saisie
        expect(component['days'][2].nb_night_dead_zombies).toBe(2);
    });
});
