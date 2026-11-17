import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { SILENT_ERROR_STATUS } from '../../_core/services/http-context-tokens';
import { setTown } from '../../_core/utilities/localstorage.util';
import {
    emptyNightwatchContent,
    NightwatchPlanDTO,
    NightwatchPlansDTO,
    NightwatchReferentialDTO,
    NightwatchStateDTO
} from '../../my-town/nightwatch/nightwatch.types';
import { TownDetailsDTO } from '../dto/town-details.dto';
import { TownDetails } from '../types/town-details.class';
import { NightwatchPlanService } from './nightwatch-plan.service';

describe('NightwatchPlanService', (): void => {
    let service: NightwatchPlanService;
    let http_mock: HttpTestingController;
    const base: string = `${environment.api_url}/NightwatchPlans/42`;
    const plan: NightwatchPlanDTO = { id: 3, day: 5, name: 'Plan A', isEffective: true, version: 1, authorId: 9, authorName: 'Zerah', content: emptyNightwatchContent() };

    beforeEach((): void => {
        setTown(new TownDetails({ townId: 42 } as TownDetailsDTO));
        TestBed.configureTestingModule({ providers: [provideHttpClient(withXhr()), provideHttpClientTesting()] });
        service = TestBed.inject(NightwatchPlanService);
        http_mock = TestBed.inject(HttpTestingController);
    });

    afterEach((): void => {
        http_mock.verify();
        setTown(null);
    });

    it('getPlans GET /NightwatchPlans/:mapId', (): void => {
        let result: NightwatchPlansDTO | undefined;
        service.getPlans().subscribe((plans: NightwatchPlansDTO): void => {
            result = plans;
        });

        const request: TestRequest = http_mock.expectOne(base);
        expect(request.request.method).toBe('GET');
        request.flush(<NightwatchPlansDTO>{ access: { isCitizen: true, canEdit: true }, plans: [plan] });

        expect(result?.plans[0].name).toBe('Plan A');
    });

    it('getState GET /NightwatchPlans/:mapId/state?day=', (): void => {
        service.getState(5).subscribe();

        const request: TestRequest = http_mock.expectOne(`${base}/state?day=5`);
        expect(request.request.method).toBe('GET');
        request.flush(<NightwatchStateDTO><unknown>{ citizens: [] });
    });

    it('getReferential GET /Fetcher/NightwatchReferential', (): void => {
        service.getReferential().subscribe();

        const request: TestRequest = http_mock.expectOne(`${environment.api_url}/Fetcher/NightwatchReferential`);
        expect(request.request.method).toBe('GET');
        request.flush(<NightwatchReferentialDTO><unknown>{ baseRisk: 0.08 });
    });

    it('savePlan PUT /plans ; création : aucun statut silencieux', (): void => {
        service.savePlan({ day: 5, name: 'Plan A', content: emptyNightwatchContent() }).subscribe();

        const request: TestRequest = http_mock.expectOne(`${base}/plans`);
        expect(request.request.method).toBe('PUT');
        expect(request.request.context.get(SILENT_ERROR_STATUS)).toBeNull();
        request.flush(plan);
    });

    it('savePlan d\'une modification : 409 et 423 silencieux (bannière du store)', (): void => {
        service.savePlan({ id: 3, version: 1, day: 5, name: 'Plan A', content: emptyNightwatchContent() }).subscribe();

        const request: TestRequest = http_mock.expectOne(`${base}/plans`);
        expect(request.request.context.get(SILENT_ERROR_STATUS)).toEqual([409, 423]);
        request.flush(plan);
    });

    it('deletePlan DELETE et setEffective PUT, avec l\'en-tête de connexion quand elle est donnée', (): void => {
        service.deletePlan(3, 'abc').subscribe();
        service.setEffective(3, 'abc').subscribe();
        service.setEffective(3).subscribe();

        const deletion: TestRequest = http_mock.expectOne(`${base}/plans/3`);
        const effectives: TestRequest[] = http_mock.match(`${base}/plans/3/effective`);
        expect(deletion.request.method).toBe('DELETE');
        expect(deletion.request.headers.get('Mho-Hub-Connection')).toBe('abc');
        expect(effectives.map((r: TestRequest): string | null => r.request.headers.get('Mho-Hub-Connection'))).toEqual(['abc', null]);
        deletion.flush(null);
        effectives.forEach((r: TestRequest): void => r.flush(plan));
    });

    describe('ville explicite (contexte changé entre-temps)', (): void => {
        const PSEUDO_MAP_ID: number = 1_000_000_007;
        const pseudo_base: string = `${environment.api_url}/NightwatchPlans/${PSEUDO_MAP_ID}`;

        it('getPlans, getState, deletePlan et setEffective visent la ville donnée, pas celle du contexte', (): void => {
            service.getPlans(PSEUDO_MAP_ID).subscribe();
            service.getState(5, PSEUDO_MAP_ID).subscribe();
            service.deletePlan(3, null, PSEUDO_MAP_ID).subscribe();
            service.setEffective(3, null, PSEUDO_MAP_ID).subscribe();

            const requests: TestRequest[] = [
                http_mock.expectOne(pseudo_base),
                http_mock.expectOne(`${pseudo_base}/state?day=5`),
                http_mock.expectOne(`${pseudo_base}/plans/3`),
                http_mock.expectOne(`${pseudo_base}/plans/3/effective`)
            ];
            requests.forEach((r: TestRequest): void => r.flush(null));
        });

        it('savePlan vise la ville donnée', (): void => {
            service.savePlan({ day: 5, name: 'A', content: emptyNightwatchContent() }, null, PSEUDO_MAP_ID).subscribe();
            http_mock.expectOne(`${pseudo_base}/plans`).flush(plan);
        });
    });
});
