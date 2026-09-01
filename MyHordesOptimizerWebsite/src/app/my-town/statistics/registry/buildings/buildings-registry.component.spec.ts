import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { Entry } from '../../../../_abstract_model/interfaces';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { CitizenInfo } from '../../../../_abstract_model/types/citizen-info.class';
import { BuildingsRegistryComponent } from './buildings-registry.component';

interface TestableComponent {
    entries_by_type: { (): Entry[] };
    changeBuildingTab(event: MatTabChangeEvent): void;
}

describe('BuildingsRegistryComponent', (): void => {
    let fixture: ComponentFixture<BuildingsRegistryComponent>;

    function makeCitizen(id: number, name: string): Citizen {
        return Object.assign(new Citizen(), { id, name });
    }

    function makeCitizenList(citizens: Citizen[]): CitizenInfo {
        const list: CitizenInfo = new CitizenInfo();
        list.citizens = citizens;
        return list;
    }

    function makeTabEvent(labelClass: string): MatTabChangeEvent {
        return { index: 0, tab: { labelClass } } as unknown as MatTabChangeEvent;
    }

    const registry: Entry[] = [
        { hour: '8:00', entry: 'Alice a jeté un objet à la décharge.' },
        { hour: '9:00', entry: 'Bob a attiré un zombie en ville.' }
    ];

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [BuildingsRegistryComponent],
            providers: [provideNoopAnimations()]
        }).compileComponents();

        fixture = TestBed.createComponent(BuildingsRegistryComponent);
        fixture.componentRef.setInput('completeCitizenList', makeCitizenList([makeCitizen(1, 'Alice'), makeCitizen(2, 'Bob')]));
        fixture.componentRef.setInput('displayPseudo', 'simple');
        fixture.componentRef.setInput('registry', registry);
    });

    it('filters by the "vet" keywords by default (no tab selected yet)', (): void => {
        fixture.detectChanges();

        const entries: Entry[] = (fixture.componentInstance as unknown as TestableComponent).entries_by_type();
        expect(entries.length).toBe(1);
        expect(entries[0].entry).toContain('attiré');
    });

    it('switches to the "dump" keywords when the dump tab is selected', fakeAsync((): void => {
        fixture.detectChanges();

        (fixture.componentInstance as unknown as TestableComponent).changeBuildingTab(makeTabEvent('dump'));
        tick();

        const entries: Entry[] = (fixture.componentInstance as unknown as TestableComponent).entries_by_type();
        expect(entries.length).toBe(1);
        expect(entries[0].entry).toContain('décharge');
    }));

    it('switches back to the "vet" keywords when the vet tab is selected', fakeAsync((): void => {
        fixture.detectChanges();
        (fixture.componentInstance as unknown as TestableComponent).changeBuildingTab(makeTabEvent('dump'));
        tick();

        (fixture.componentInstance as unknown as TestableComponent).changeBuildingTab(makeTabEvent('vet'));
        tick();

        const entries: Entry[] = (fixture.componentInstance as unknown as TestableComponent).entries_by_type();
        expect(entries.length).toBe(1);
        expect(entries[0].entry).toContain('attiré');
    }));

    it('renders the active tab contribution split (Alice = did not contribute to vet-filtered entries)', (): void => {
        fixture.detectChanges();

        const headers: NodeListOf<Element> = fixture.nativeElement.querySelectorAll('h4');
        expect(headers.length).toBeGreaterThan(0);
        const citizen_infos: NodeListOf<Element> = fixture.nativeElement.querySelectorAll('mho-citizen-info');
        // Bob a contribué (1), Alice n'a pas contribué (1) = 2 rendus au total pour l'onglet actif.
        expect(citizen_infos.length).toBe(2);
    });
});
