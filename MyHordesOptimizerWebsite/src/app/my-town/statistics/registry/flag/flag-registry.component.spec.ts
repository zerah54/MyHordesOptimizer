import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { Entry } from '../../../../_abstract_model/interfaces';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { CitizenInfo } from '../../../../_abstract_model/types/citizen-info.class';
import { Item } from '../../../../_abstract_model/types/item.class';
import { FlagRegistryComponent } from './flag-registry.component';

function newCitizen(name: string, id: number): Citizen {
    const citizen: Citizen = new Citizen();
    citizen.id = id;
    citizen.name = name;
    return citizen;
}

function flagItem(): Item {
    const item: Item = new Item();
    item.label = { fr: 'Drapeau' };
    item.img = 'item/item_flag.gif';
    return item;
}

function citizenInfo(citizens: Citizen[]): CitizenInfo {
    const info: CitizenInfo = new CitizenInfo();
    info.citizens = citizens;
    return info;
}

describe('FlagRegistryComponent', (): void => {
    let fixture: ComponentFixture<FlagRegistryComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [FlagRegistryComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(FlagRegistryComponent);
        fixture.componentRef.setInput('completeCitizenList', citizenInfo([newCitizen('Bob', 1), newCitizen('Alice', 2)]));
        fixture.componentRef.setInput('completeItemsList', [flagItem()]);
        fixture.componentRef.setInput('displayPseudo', 'simple');
    });

    it('lists a citizen mentioned in an entry that references the flag as having taken it', (): void => {
        const entries: Entry[] = [{ hour: '10:00', entry: 'Bob a pris le Drapeau du camp' }];
        fixture.componentRef.setInput('registry', entries);
        fixture.detectChanges();

        const taken: HTMLElement = fixture.debugElement.query(By.css('.taken')).nativeElement;
        expect(taken.textContent).toContain('Bob');
        const notTaken: HTMLElement = fixture.debugElement.query(By.css('.not-taken')).nativeElement;
        expect(notTaken.textContent).not.toContain('Bob');
    });

    it('ignores entries that do not mention the flag, even if they mention a known citizen', (): void => {
        const entries: Entry[] = [
            { hour: '10:00', entry: 'Bob a pris le Drapeau du camp' },
            { hour: '11:00', entry: 'Alice a mangé une pomme' }
        ];
        fixture.componentRef.setInput('registry', entries);
        fixture.detectChanges();

        const taken: HTMLElement = fixture.debugElement.query(By.css('.taken')).nativeElement;
        const notTaken: HTMLElement = fixture.debugElement.query(By.css('.not-taken')).nativeElement;
        expect(taken.textContent).not.toContain('Alice');
        expect(notTaken.textContent).toContain('Alice');
    });

    it('shows no one as having taken the flag when registry is undefined', (): void => {
        fixture.componentRef.setInput('registry', undefined);
        fixture.detectChanges();

        const taken: DebugElement[] = fixture.debugElement.queryAll(By.css('.taken mho-citizen-info'));
        expect(taken.length).toBe(0);
        const notTaken: DebugElement[] = fixture.debugElement.queryAll(By.css('.not-taken mho-citizen-info'));
        expect(notTaken.length).toBe(2);
    });

    it('updates reactively when the registry input changes', (): void => {
        fixture.componentRef.setInput('registry', []);
        fixture.detectChanges();
        expect(fixture.debugElement.queryAll(By.css('.taken mho-citizen-info')).length).toBe(0);

        fixture.componentRef.setInput('registry', [{ hour: '10:00', entry: 'Bob a pris le Drapeau du camp' }] as Entry[]);
        fixture.detectChanges();

        expect(fixture.debugElement.queryAll(By.css('.taken mho-citizen-info')).length).toBe(1);
    });

    it('does not react to an isolated change of completeItemsList, matching the legacy setter behavior', (): void => {
        fixture.componentRef.setInput('registry', [{ hour: '10:00', entry: 'Bob a pris le Drapeau du camp' }] as Entry[]);
        fixture.detectChanges();
        expect(fixture.debugElement.queryAll(By.css('.taken mho-citizen-info')).length).toBe(1);

        const otherItem: Item = new Item();
        otherItem.label = { fr: 'Banniere' };
        otherItem.img = 'item/item_flag.gif';
        fixture.componentRef.setInput('completeItemsList', [otherItem]);
        fixture.detectChanges();

        expect(fixture.debugElement.queryAll(By.css('.taken mho-citizen-info')).length).toBe(1);
    });
});
