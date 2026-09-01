import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { CitizenInfo } from '../../../../_abstract_model/types/citizen-info.class';
import { Dig } from '../../../../_abstract_model/types/dig.class';
import { TownDetails } from '../../../../_abstract_model/types/town-details.class';
import { setTown } from '../../../../_core/utilities/localstorage.util';
import { DigsRegistryComponent } from './digs-registry.component';

interface TestableComponent {
    digs: { (): Dig[] };
    current_day: { (): number };
    addCitizen(citizen: Citizen): void;
}

describe('DigsRegistryComponent', (): void => {
    let fixture: ComponentFixture<DigsRegistryComponent>;

    function makeCitizen(id: number, name: string): Citizen {
        return Object.assign(new Citizen(), { id, name });
    }

    function makeCitizenList(citizens: Citizen[]): CitizenInfo {
        const list: CitizenInfo = new CitizenInfo();
        list.citizens = citizens;
        return list;
    }

    beforeEach(async (): Promise<void> => {
        setTown(Object.assign(new TownDetails(), { day: 12 }));

        await TestBed.configureTestingModule({
            imports: [DigsRegistryComponent],
            providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()]
        }).compileComponents();

        fixture = TestBed.createComponent(DigsRegistryComponent);
        fixture.componentRef.setInput('completeCitizenList', makeCitizenList([makeCitizen(1, 'Alice'), makeCitizen(2, 'Bob')]));
        fixture.componentRef.setInput('displayPseudo', 'simple');
    });

    afterEach((): void => setTown(null));

    /** Options actuellement proposées par le `mho-select` (candidats "pas encore en fouille"). */
    function selectOptions(): Citizen[] {
        return fixture.debugElement.query(By.css('mho-select')).componentInstance.options() as Citizen[];
    }

    it('reads current_day from getTown() when registry becomes available', (): void => {
        fixture.componentRef.setInput('registry', [{ hour: '8:00', entry: 'Alice est arrivé depuis le Nord.' }]);
        fixture.detectChanges();

        expect((fixture.componentInstance as unknown as TestableComponent).current_day()).toBe(12);
    });

    it('builds one dig per citizen mentioned in the registry entries', (): void => {
        fixture.componentRef.setInput('registry', [{ hour: '8:00', entry: 'Alice est arrivé depuis le Nord.' }]);
        fixture.detectChanges();

        const digs: Dig[] = (fixture.componentInstance as unknown as TestableComponent).digs();
        expect(digs.length).toBe(1);
        expect(digs[0].digger_name).toBe('Alice');
        expect(digs[0].day).toBe(12);
    });

    it('clears digs when registry becomes undefined', (): void => {
        fixture.componentRef.setInput('registry', [{ hour: '8:00', entry: 'Alice est arrivé depuis le Nord.' }]);
        fixture.detectChanges();
        expect((fixture.componentInstance as unknown as TestableComponent).digs().length).toBe(1);

        fixture.componentRef.setInput('registry', undefined);
        fixture.detectChanges();

        expect((fixture.componentInstance as unknown as TestableComponent).digs().length).toBe(0);
    });

    it('renders one mho-dig row per entry in digs()', (): void => {
        fixture.componentRef.setInput('registry', [{ hour: '8:00', entry: 'Alice est arrivé depuis le Nord.' }]);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelectorAll('mho-dig').length).toBe(1);
    });

    it('addCitizen appends a fresh 1-dig entry for a citizen not already in the list, and removes them from the select options', (): void => {
        fixture.componentRef.setInput('registry', [{ hour: '8:00', entry: 'Alice est arrivé depuis le Nord.' }]);
        fixture.detectChanges();
        expect(selectOptions().map((citizen: Citizen): string => citizen.name)).toEqual(['Bob']);

        (fixture.componentInstance as unknown as TestableComponent).addCitizen(makeCitizen(2, 'Bob'));
        fixture.detectChanges();

        const digs: Dig[] = (fixture.componentInstance as unknown as TestableComponent).digs();
        expect(digs.length).toBe(2);
        expect(digs[1].digger_name).toBe('Bob');
        expect(digs[1].nb_total_dig).toBe(1);
        expect(digs[1].nb_success).toBe(0);
        expect(fixture.nativeElement.querySelectorAll('mho-dig').length).toBe(2);
        // Comportement corrigé par la migration (réassignation immuable de `digs`, leçon 6) :
        // le pipe pur `citizenNotInDigList` recalcule désormais sur la nouvelle référence, Bob
        // disparaît immédiatement des options — avant migration, `.push()` gardait la même
        // référence et le pipe restait mémoïsé sur la liste périmée (bug préexistant, non lié à
        // OnPush). Delta accepté par le contrôleur (task-13-report.md, section Doutes).
        expect(selectOptions()).toEqual([]);
    });
});
