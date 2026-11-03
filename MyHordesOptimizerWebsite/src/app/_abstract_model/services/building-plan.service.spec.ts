import { HttpErrorResponse, provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { BYPASS_ERROR, BYPASS_LOADING, SILENT_ERROR_STATUS } from '../../_core/services/http-context-tokens';
import { setTown } from '../../_core/utilities/localstorage.util';
import { HomeReferentialDTO } from '../../my-town/buildings/planning/home-referential.types';
import { BuildingPlanDTO, BuildingPlansDTO, BuildingPlanStateDTO, emptyPlanContent } from '../../my-town/buildings/planning/plan.types';
import { TownDetailsDTO } from '../dto/town-details.dto';
import { TownDetails } from '../types/town-details.class';
import { BuildingPlanService } from './building-plan.service';

describe('BuildingPlanService', (): void => {
    let service: BuildingPlanService;
    let http_mock: HttpTestingController;
    const plan: BuildingPlanDTO = {
        id: 3, day: 5, name: 'Plan A', isEffective: true, version: 1, authorId: 9, authorName: 'Zerah', content: emptyPlanContent(), lastUpdateInfo: null
    };

    beforeEach((): void => {
        setTown(new TownDetails({ townId: 42 } as TownDetailsDTO));
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withXhr()),
                provideHttpClientTesting()
            ]
        });
        service = TestBed.inject(BuildingPlanService);
        http_mock = TestBed.inject(HttpTestingController);
    });

    afterEach((): void => {
        http_mock.verify();
        setTown(null);
    });

    it('getPlans GET /BuildingPlans/:mapId', (): void => {
        let result: BuildingPlansDTO | undefined;
        service.getPlans().subscribe((plans: BuildingPlansDTO): void => {
            result = plans;
        });

        const request: TestRequest = http_mock.expectOne(`${environment.api_url}/BuildingPlans/42`);
        expect(request.request.method).toBe('GET');
        request.flush(<BuildingPlansDTO>{ access: { isCitizen: true, canEdit: true }, plans: [plan], itemValues: { '5': 2 }, settingsVersion: 1 });

        expect(result?.plans[0].name).toBe('Plan A');
        expect(result?.itemValues['5']).toBe(2);
    });

    it('getState GET /BuildingPlans/:mapId/state', (): void => {
        service.getState().subscribe();

        const request: TestRequest = http_mock.expectOne(`${environment.api_url}/BuildingPlans/42/state`);
        expect(request.request.method).toBe('GET');
        request.flush(<BuildingPlanStateDTO>{ buildings: [], defense: null });
    });

    it('getState silencieux : ni message d\'erreur ni loader', (): void => {
        service.getState(true).subscribe({ error: (): void => undefined });

        const request: TestRequest = http_mock.expectOne(`${environment.api_url}/BuildingPlans/42/state`);
        expect(request.request.context.get(BYPASS_ERROR)).toBe(true);
        expect(request.request.context.get(BYPASS_LOADING)).toBe(true);
        request.flush(null, { status: 404, statusText: 'Not Found' });
    });

    it('savePlan PUT /BuildingPlans/:mapId/plans avec la requête', (): void => {
        let result: BuildingPlanDTO | undefined;
        service.savePlan({ day: 5, name: 'Plan A', content: emptyPlanContent() }).subscribe((saved: BuildingPlanDTO): void => {
            result = saved;
        });

        const request: TestRequest = http_mock.expectOne(`${environment.api_url}/BuildingPlans/42/plans`);
        expect(request.request.method).toBe('PUT');
        expect(request.request.body.name).toBe('Plan A');
        request.flush(plan);

        expect(result?.id).toBe(3);
    });

    it('savePlan d\'une proposition existante : les 409 et 423 sont laissés au store, sans message', (): void => {
        service.savePlan({ id: 3, version: 1, day: 5, name: 'Plan A', content: emptyPlanContent() }).subscribe();

        const request: TestRequest = http_mock.expectOne(`${environment.api_url}/BuildingPlans/42/plans`);
        expect(request.request.context.get(SILENT_ERROR_STATUS)).toEqual([409, 423]);
        expect(request.request.context.get(BYPASS_ERROR)).toBe(false);
        request.flush(plan);
    });

    it('savePlan d\'une création : aucun statut silencieux, le store n\'affiche pas de bannière', (): void => {
        service.savePlan({ day: 5, name: 'Plan A', content: emptyPlanContent() }).subscribe();

        const request: TestRequest = http_mock.expectOne(`${environment.api_url}/BuildingPlans/42/plans`);
        expect(request.request.context.get(SILENT_ERROR_STATUS)).toBeNull();
        request.flush(plan);
    });

    it('deletePlan DELETE /BuildingPlans/:mapId/plans/:id', (): void => {
        service.deletePlan(3).subscribe();

        const request: TestRequest = http_mock.expectOne(`${environment.api_url}/BuildingPlans/42/plans/3`);
        expect(request.request.method).toBe('DELETE');
        request.flush(null);
    });

    it('les écritures envoient Mho-Hub-Connection quand une connexion est donnée', (): void => {
        service.savePlan({ id: 3, version: 1, day: 5, name: 'Plan A', content: emptyPlanContent() }, 'abc').subscribe();
        service.deletePlan(3, 'abc').subscribe();
        service.setEffective(3, 'abc').subscribe();
        service.saveSettings({ itemValues: {}, version: 1 }, 'abc').subscribe();

        const requests: TestRequest[] = [
            http_mock.expectOne(`${environment.api_url}/BuildingPlans/42/plans`),
            http_mock.expectOne(`${environment.api_url}/BuildingPlans/42/plans/3`),
            http_mock.expectOne(`${environment.api_url}/BuildingPlans/42/plans/3/effective`),
            http_mock.expectOne(`${environment.api_url}/BuildingPlans/42/settings`)
        ];
        expect(requests.map((request: TestRequest): string | null => request.request.headers.get('Mho-Hub-Connection'))).toEqual(['abc', 'abc', 'abc', 'abc']);
        requests.forEach((request: TestRequest): void => request.flush(null));
    });

    it('les écritures sans connexion (absente ou vide) : pas d\'en-tête Mho-Hub-Connection', (): void => {
        service.savePlan({ day: 5, name: 'Plan A', content: emptyPlanContent() }).subscribe();
        service.deletePlan(3, '').subscribe();
        service.setEffective(3, null).subscribe();
        service.saveSettings({ itemValues: {}, version: 1 }).subscribe();

        const requests: TestRequest[] = [
            http_mock.expectOne(`${environment.api_url}/BuildingPlans/42/plans`),
            http_mock.expectOne(`${environment.api_url}/BuildingPlans/42/plans/3`),
            http_mock.expectOne(`${environment.api_url}/BuildingPlans/42/plans/3/effective`),
            http_mock.expectOne(`${environment.api_url}/BuildingPlans/42/settings`)
        ];
        expect(requests.map((request: TestRequest): boolean => request.request.headers.has('Mho-Hub-Connection'))).toEqual([false, false, false, false]);
        requests.forEach((request: TestRequest): void => request.flush(null));
    });

    it('un 423 sur savePlan remonte en HttpErrorResponse de statut 423', (): void => {
        let received: unknown;
        service.savePlan({ id: 3, version: 1, day: 5, name: 'Plan A', content: emptyPlanContent() }).subscribe({
            error: (error: unknown): void => {
                received = error;
            }
        });

        http_mock.expectOne(`${environment.api_url}/BuildingPlans/42/plans`).flush('verrou', { status: 423, statusText: 'Locked' });

        expect(received).toBeInstanceOf(HttpErrorResponse);
        expect((received as HttpErrorResponse).status).toBe(423);
    });

    it('setEffective PUT /BuildingPlans/:mapId/plans/:id/effective', (): void => {
        service.setEffective(3).subscribe();

        const request: TestRequest = http_mock.expectOne(`${environment.api_url}/BuildingPlans/42/plans/3/effective`);
        expect(request.request.method).toBe('PUT');
        request.flush(plan);
    });

    it('saveSettings PUT /BuildingPlans/:mapId/settings avec version et valeurs', (): void => {
        service.saveSettings({ itemValues: { '5': 2 }, version: 1 }).subscribe();

        const request: TestRequest = http_mock.expectOne(`${environment.api_url}/BuildingPlans/42/settings`);
        expect(request.request.method).toBe('PUT');
        expect(request.request.body).toEqual({ itemValues: { '5': 2 }, version: 1 });
        request.flush(<BuildingPlansDTO>{ access: { isCitizen: true, canEdit: true }, plans: [], itemValues: { '5': 2 }, settingsVersion: 2 });
    });

    it('getHomeReferential GET /Fetcher/HomeReferential', (): void => {
        let result: HomeReferentialDTO | undefined;
        service.getHomeReferential().subscribe((referential: HomeReferentialDTO): void => {
            result = referential;
        });

        const request: TestRequest = http_mock.expectOne(`${environment.api_url}/Fetcher/HomeReferential`);
        expect(request.request.method).toBe('GET');
        request.flush(<HomeReferentialDTO>{
            levels: [{ level: 1, label: 'Zelt', icon: 'home_lv1', def: 1, ap: 2, apUrbanism: 2, resources: [], resourcesUrbanism: [], buildingUid: null, allowsUpgrades: true, theft: false }],
            upgrades: []
        });

        expect(result?.levels[0].ap).toBe(2);
    });
});
