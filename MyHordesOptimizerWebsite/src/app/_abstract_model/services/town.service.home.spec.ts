import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { setTown } from '../../_core/utilities/localstorage.util';
import { Citizen } from '../types/citizen.class';
import { TownService } from './town.service';

describe('TownService — updateHomeFields', (): void => {
    let service: TownService;
    let http_mock: HttpTestingController;

    beforeEach((): void => {
        setTown(null);
        TestBed.configureTestingModule({ providers: [provideHttpClient(withXhr()), provideHttpClientTesting()] });
        service = TestBed.inject(TownService);
        http_mock = TestBed.inject(HttpTestingController);
    });

    afterEach((): void => {
        http_mock.verify();
    });

    it('n\'envoie que les champs donnés (l\'API ignore les champs absents)', (): void => {
        service.updateHomeFields(7, { kitchenLevel: 2 }).subscribe();

        const request: TestRequest = http_mock.expectOne((candidate: { url: string }): boolean => candidate.url.includes('/ExternalTools/home'));
        expect(request.request.method).toBe('POST');
        expect(JSON.parse(request.request.body as string)).toEqual({ userId: 7, home: { kitchenLevel: 2 } });
        request.flush({});
    });

    it('la clé d\'action quotidienne est encodée dans l\'URL', (): void => {
        const citizen: Citizen = Object.assign(new Citizen(), { id: 7 });
        service.addDailyAction(citizen, '../x', 3).subscribe();
        service.removeDailyAction(citizen, '../x', 3).subscribe();

        const requests: TestRequest[] = http_mock.match((candidate: { url: string }): boolean => candidate.url.includes('/dailyAction/'));
        expect(requests.map((request: TestRequest): string => request.request.url.split('/dailyAction/')[1])).toEqual(['..%2Fx?day=3', '..%2Fx?day=3']);
        requests.forEach((request: TestRequest): void => request.flush({}));
    });
});
