import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { TOWN_KEY } from '../const';
import { Citizen } from '../types/citizen.class';
import { TownService } from './town.service';

describe('TownService — updateChest', (): void => {
    let service: TownService;
    let httpMock: HttpTestingController;

    beforeEach((): void => {
        localStorage.removeItem(TOWN_KEY);
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });
        service = TestBed.inject(TownService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach((): void => {
        httpMock.verify();
    });

    it('updateChest POSTs to /ExternalTools/Chest with the citizen chest DTO', (): void => {
        const citizen: Citizen = new Citizen();
        citizen.id = 7;

        service.updateChest(citizen).subscribe();

        const req = httpMock.expectOne((request) => request.url.includes('/ExternalTools/Chest'));
        expect(req.request.method).toBe('POST');
        // updateChest POSTs a JSON.stringify'd body (like updateBag), so the mock receives a raw string.
        expect(JSON.parse(req.request.body as string)).toEqual(citizen.toCitizenChestDto());
        req.flush({});
    });
});
