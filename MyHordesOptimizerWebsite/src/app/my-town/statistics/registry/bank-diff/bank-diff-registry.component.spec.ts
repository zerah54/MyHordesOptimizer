import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import moment from 'moment';

import { Entry } from '../../../../_abstract_model/interfaces';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { CitizenInfo } from '../../../../_abstract_model/types/citizen-info.class';
import { Item } from '../../../../_abstract_model/types/item.class';
import { BankDiffRegistryComponent } from './bank-diff-registry.component';

function newCitizen(name: string, id: number): Citizen {
    const citizen: Citizen = new Citizen();
    citizen.id = id;
    citizen.name = name;
    return citizen;
}

function newItem(label: string): Item {
    const item: Item = new Item();
    item.label = { fr: label };
    item.img = 'item/item_test.gif';
    return item;
}

function citizenInfo(citizens: Citizen[]): CitizenInfo {
    const info: CitizenInfo = new CitizenInfo();
    info.citizens = citizens;
    return info;
}

describe('BankDiffRegistryComponent', (): void => {
    let fixture: ComponentFixture<BankDiffRegistryComponent>;
    let originalLocale: string;

    beforeEach(async (): Promise<void> => {
        originalLocale = moment.locale();
        moment.locale('fr');
        await TestBed.configureTestingModule({
            imports: [BankDiffRegistryComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(BankDiffRegistryComponent);
        fixture.componentRef.setInput('completeCitizenList', citizenInfo([newCitizen('Bob', 1)]));
        fixture.componentRef.setInput('completeItemsList', [newItem('Chausson')]);
        fixture.componentRef.setInput('displayPseudo', 'simple');
    });

    afterEach((): void => {
        moment.locale(originalLocale);
    });

    it('classifies a matching "give" entry as gifted, with the citizen and item shown', (): void => {
        const entries: Entry[] = [{ hour: '10:00', entry: 'Bob a donné Chausson ici' }];
        fixture.componentRef.setInput('registry', entries);
        fixture.detectChanges();

        const gifted: HTMLElement = fixture.debugElement.query(By.css('.gifted')).nativeElement;
        expect(gifted.textContent).toContain('Bob');
        expect(gifted.textContent).toContain('Chausson');
        expect(gifted.textContent).toContain('(1)');
        expect(fixture.debugElement.query(By.css('.taken')).nativeElement.textContent).toContain('(0)');
    });

    it('classifies a matching "take" entry as taken', (): void => {
        const entries: Entry[] = [{ hour: '11:00', entry: 'Bob a pris Chausson la' }];
        fixture.componentRef.setInput('registry', entries);
        fixture.detectChanges();

        const taken: HTMLElement = fixture.debugElement.query(By.css('.taken')).nativeElement;
        expect(taken.textContent).toContain('Bob');
        expect(taken.textContent).toContain('(1)');
    });

    it('excludes entries matching neither the give nor the take keywords, even when they mention a known item and citizen', (): void => {
        const entries: Entry[] = [
            { hour: '11:00', entry: 'Bob a pris Chausson la' },
            { hour: '12:00', entry: 'Bob a vu Chausson ici' }
        ];
        fixture.componentRef.setInput('registry', entries);
        fixture.detectChanges();

        const takenEntries: DebugElement[] = fixture.debugElement.queryAll(By.css('.taken .entry'));
        expect(takenEntries.length).toBe(1);
    });

    it('shows no entries when registry is undefined', (): void => {
        fixture.componentRef.setInput('registry', undefined);
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('.taken')).nativeElement.textContent).toContain('(0)');
        expect(fixture.debugElement.query(By.css('.gifted')).nativeElement.textContent).toContain('(0)');
    });

    it('updates the rendered entries reactively when the registry input changes', (): void => {
        fixture.componentRef.setInput('registry', []);
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css('.taken')).nativeElement.textContent).toContain('(0)');

        fixture.componentRef.setInput('registry', [{ hour: '09:00', entry: 'Bob a pris Chausson la' }] as Entry[]);
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('.taken')).nativeElement.textContent).toContain('(1)');
    });
});
