import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { ApiService } from '../../../_abstract_model/services/api.service';
import { TownService } from '../../../_abstract_model/services/town.service';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenInfo } from '../../../_abstract_model/types/citizen-info.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { RegistryComponent } from './registry.component';
import { WellRegistryComponent } from './well/well-registry.component';

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

function typeIntoTextarea(fixture: ComponentFixture<RegistryComponent>, text: string): void {
    const textarea: HTMLTextAreaElement = fixture.debugElement.query(By.css('textarea')).nativeElement;
    textarea.value = text;
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
}

describe('RegistryComponent', (): void => {
    let fixture: ComponentFixture<RegistryComponent>;
    let townService: jasmine.SpyObj<TownService>;
    let apiService: jasmine.SpyObj<ApiService>;

    beforeEach(async (): Promise<void> => {
        townService = jasmine.createSpyObj<TownService>('TownService', ['getCitizens']);
        apiService = jasmine.createSpyObj<ApiService>('ApiService', ['getItems']);
        townService.getCitizens.and.returnValue(of(citizenInfo([newCitizen('Bob', 1)])));
        apiService.getItems.and.returnValue(of([new Item()]));

        await TestBed.configureTestingModule({
            imports: [RegistryComponent],
            providers: [
                provideHttpClient(), provideHttpClientTesting(),
                { provide: TownService, useValue: townService },
                { provide: ApiService, useValue: apiService }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(RegistryComponent);
        fixture.detectChanges();
    });

    it('hides the mode buttons and result area while the registry field is empty', (): void => {
        expect(fixture.debugElement.query(By.css('.actions'))).toBeNull();
        expect(fixture.debugElement.query(By.css('mho-registry-well'))).toBeNull();
    });

    it('shows the mode buttons once registry content has been pasted', (): void => {
        typeIntoTextarea(fixture, '10:00 [X] Bob a pris une ration');

        expect(fixture.debugElement.query(By.css('.actions'))).not.toBeNull();
    });

    it('parses pasted lines into hour/entry pairs and passes them to the selected mode component', (): void => {
        typeIntoTextarea(fixture, '10:00 [X] Bob a pris une ration\n11:15 Alice a donné un objet');

        const wellButton: HTMLElement = fixture.debugElement.queryAll(By.css('.actions button'))[2].nativeElement;
        wellButton.click();
        fixture.detectChanges();

        const well: WellRegistryComponent = fixture.debugElement.query(By.directive(WellRegistryComponent)).componentInstance;
        expect(well.registry()).toEqual([
            { hour: '10:00', entry: 'Bob a pris une ration' },
            { hour: '11:15', entry: ' Alice a donné un objet' }
        ]);
        expect(well.completeCitizenList().citizens[0].name).toBe('Bob');
    });

    it('highlights the active mode button and switches result component on click', (): void => {
        typeIntoTextarea(fixture, '10:00 [X] Bob a pris une ration');
        const buttons: HTMLElement[] = fixture.debugElement.queryAll(By.css('.actions button')).map((debugEl: DebugElement) => debugEl.nativeElement);
        const wellButton: HTMLElement = buttons[2];

        wellButton.click();
        fixture.detectChanges();

        expect(wellButton.classList).toContain('active');
        expect(fixture.debugElement.query(By.css('mho-registry-well'))).not.toBeNull();
    });

    it('clears the registry, entries and result area when the trash button is clicked', async (): Promise<void> => {
        typeIntoTextarea(fixture, '10:00 [X] Bob a pris une ration');
        const wellButton: HTMLElement = fixture.debugElement.queryAll(By.css('.actions button'))[2].nativeElement;
        wellButton.click();
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css('mho-registry-well'))).not.toBeNull();

        const trashButton: HTMLElement = fixture.debugElement.query(By.css('.end button')).nativeElement;
        trashButton.click();
        fixture.detectChanges();
        // NgModel écrit sur le contrôle via une microtâche (resolvedPromise.then dans _updateValue) :
        // il faut la laisser s'écouler avant de lire la valeur DOM du textarea.
        await fixture.whenStable();
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('textarea')).nativeElement.value).toBe('');
        expect(fixture.debugElement.query(By.css('.actions'))).toBeNull();
        expect(fixture.debugElement.query(By.css('mho-registry-well'))).toBeNull();
    });
});
