import { HttpRequest, provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { setObservedTown, setTown } from '../../_core/utilities/localstorage.util';
import { RefinementInputDTO } from '../dto/refinement.dto';
import { TownDetails } from '../types/town-details.class';
import { TownStatisticsService } from './town-statistics.service';

describe('TownStatisticsService', (): void => {
    let service: TownStatisticsService;
    let http_mock: HttpTestingController;

    beforeEach((): void => {
        setObservedTown(null);
        setTown(Object.assign(new TownDetails(), { town_id: 123 }));
        TestBed.configureTestingModule({ providers: [provideHttpClient(withXhr()), provideHttpClientTesting()] });
        service = TestBed.inject(TownStatisticsService);
        http_mock = TestBed.inject(HttpTestingController);
    });

    afterEach((): void => {
        http_mock.verify();
        setTown(null);
    });

    it('requests the attack calculation without any soul parameter', (): void => {
        service.getAttackCalculation(16, false).subscribe();

        const request: TestRequest = http_mock.expectOne((candidate: HttpRequest<unknown>): boolean => candidate.url.includes('/AttackCalculation'));
        expect(request.request.url).toContain('?day=16&townId=123');
        expect(request.request.url).not.toContain('Souls');
    });

    it('puts the attack settings of a day', (): void => {
        service.saveAttackSettings(17, { souls: 2, spaLevel: null, fireworks: true }).subscribe();

        const request: TestRequest = http_mock.expectOne((candidate: HttpRequest<unknown>): boolean => candidate.url.includes('/AttaqueEstimation/AttackSettings/17?townId=123'));
        expect(request.request.method).toBe('PUT');
        expect(request.request.body).toEqual({ souls: 2, spaLevel: null, fireworks: true });
    });

    it('posts the candidates as little-endian uint32 base64 with the received input', (): void => {
        const input: RefinementInputDTO = { observed: [], observedPlanif: null, params: {} as RefinementInputDTO['params'] };
        service.postRefinement(16, input, [1, 256]).subscribe();

        const request: TestRequest = http_mock.expectOne((candidate: HttpRequest<unknown>): boolean => candidate.url.includes('/AttaqueEstimation/Refinement/16'));
        expect(request.request.method).toBe('POST');
        expect(JSON.parse(request.request.body as string)).toEqual({ input, candidates: 'AQAAAAABAAA=' });
    });

    it('reads the shared refinement of a day', (): void => {
        service.getRefinement(17).subscribe();

        const request: TestRequest = http_mock.expectOne((candidate: HttpRequest<unknown>): boolean => candidate.url.includes('/AttaqueEstimation/Refinement/17?townId=123'));
        expect(request.request.method).toBe('GET');
    });
});
