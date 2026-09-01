import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { Entry } from '../../../../_abstract_model/interfaces';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { CitizenInfo } from '../../../../_abstract_model/types/citizen-info.class';
import { WellRegistryComponent } from './well-registry.component';

function newCitizen(name: string, id: number): Citizen {
    const citizen: Citizen = new Citizen();
    citizen.id = id;
    citizen.name = name;
    return citizen;
}

function citizenInfo(citizens: Citizen[]): CitizenInfo {
    const info: CitizenInfo = new CitizenInfo();
    info.citizens = citizens;
    return info;
}

describe('WellRegistryComponent', (): void => {
    let fixture: ComponentFixture<WellRegistryComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [WellRegistryComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(WellRegistryComponent);
        fixture.componentRef.setInput('completeCitizenList', citizenInfo([newCitizen('Bob', 1), newCitizen('Alice', 2)]));
        fixture.componentRef.setInput('displayPseudo', 'simple');
    });

    it('groups citizens by the number of matching water-ration entries', (): void => {
        const entries: Entry[] = [
            { hour: '10:00', entry: 'Bob a pris une ration d\'eau' },
            { hour: '11:00', entry: 'Alice a pris une ration d\'eau' }
        ];
        fixture.componentRef.setInput('registry', entries);
        fixture.detectChanges();

        const groups: HTMLElement[] = fixture.debugElement.queryAll(By.css('.well')).map((debugEl: DebugElement) => debugEl.nativeElement);
        expect(groups.length).toBe(1);
        expect(groups[0].textContent).toContain('Bob');
        expect(groups[0].textContent).toContain('Alice');
        expect(groups[0].textContent).toContain('(2)');
    });

    it('excludes entries that mention a citizen but do not match a water-ration keyword', (): void => {
        const entries: Entry[] = [
            { hour: '10:00', entry: 'Bob a pris une ration d\'eau' },
            { hour: '11:00', entry: 'Bob a bu de l\'eau' },
            { hour: '12:00', entry: 'Alice a pris une ration d\'eau' }
        ];
        fixture.componentRef.setInput('registry', entries);
        fixture.detectChanges();

        const groups: HTMLElement[] = fixture.debugElement.queryAll(By.css('.well')).map((debugEl: DebugElement) => debugEl.nativeElement);
        // Sans le filtre, Bob aurait 2 rations et Alice 1, formant deux groupes distincts.
        expect(groups.length).toBe(1);
        expect(groups[0].textContent).toContain('(2)');
    });

    it('shows every citizen with 0 rations when registry is undefined', (): void => {
        fixture.componentRef.setInput('registry', undefined);
        fixture.detectChanges();

        const groups: HTMLElement[] = fixture.debugElement.queryAll(By.css('.well')).map((debugEl: DebugElement) => debugEl.nativeElement);
        expect(groups.length).toBe(1);
        expect(groups[0].textContent).toContain('(2)');
        expect(fixture.debugElement.query(By.css('.rations')).nativeElement.textContent).toContain('0');
    });

    it('updates reactively when the registry input changes', (): void => {
        fixture.componentRef.setInput('registry', []);
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css('.rations')).nativeElement.textContent).toContain('0');

        fixture.componentRef.setInput('registry', [{ hour: '10:00', entry: 'Bob a pris une ration d\'eau' }] as Entry[]);
        fixture.detectChanges();

        const groups: HTMLElement[] = fixture.debugElement.queryAll(By.css('.well')).map((debugEl: DebugElement) => debugEl.nativeElement);
        expect(groups.length).toBe(2);
    });
});
