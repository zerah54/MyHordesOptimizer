import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { CitizenStateTraceDTO } from '../dto/citizen-state-trace.dto';
import { CitizenState } from '../types/citizen-state.class';
import { CitizenStateStep } from '../types/citizen-state-step.class';
import { CitizenStateTrace } from '../types/citizen-state-trace.class';
import { RankedOrder } from '../types/ranked-order.class';
import { CitizenDayStateService } from './citizen-day-state.service';

describe('CitizenDayStateService', (): void => {
    let service: CitizenDayStateService;
    let httpMock: HttpTestingController;

    beforeEach((): void => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });
        service = TestBed.inject(CitizenDayStateService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach((): void => {
        httpMock.verify();
    });

    it('simulate POST /CitizenState/CitizenDay avec le corps attendu', (): void => {
        const starting_state: CitizenState = new CitizenState({
            ap: 6, sp: 0, wounded: false, isEclaireur: false, hasBike: false, hasShoes: false,
            walkingDistance: 0, isDead: false, statuses: []
        });
        const steps: CitizenStateStep[] = [CitizenStateStep.move(true)];
        let result: CitizenStateTrace | undefined;

        service.simulate(starting_state, steps).subscribe((trace: CitizenStateTrace) => (result = trace));

        const req = httpMock.expectOne(`${environment.api_url}/CitizenState/CitizenDay`);
        expect(req.request.method).toBe('POST');
        expect(JSON.parse(req.request.body)).toEqual({
            startingState: {
                ap: 6, sp: 0, wounded: false, isEclaireur: false, hasBike: false, hasShoes: false, walkingDistance: 0, isDead: false, statuses: [],
                hasShield: false, hasDefenceCpItem: false, isGuide: false, zoneCitizenCount: 0,
                hasCleanPdcPerk: false, hasHydratedPdcPerk: false, hasSoberPdcPerk: false, hasBaseZoneControlPerk: false, isRoleGhoul: false
            },
            steps: [{ type: 'move', isNearZone: true }]
        });

        const response_dto: CitizenStateTraceDTO = {
            startingState: { ap: 6, sp: 0, wounded: false, isEclaireur: false, hasBike: false, hasShoes: false, walkingDistance: 0, isDead: false, statuses: [] },
            steps: [{ description: 'Déplacement (zone proche)', stateAfter: { ap: 5, sp: 0, wounded: false, isEclaireur: false, hasBike: false, hasShoes: false, walkingDistance: 1, isDead: false, statuses: [] } }]
        };
        req.flush(response_dto);

        expect(result?.steps[0]?.state_after.ap).toBe(5);
    });

    it('simulate complète l\'observable après la réponse', (): void => {
        const starting_state: CitizenState = new CitizenState({
            ap: 6, sp: 0, wounded: false, isEclaireur: false, hasBike: false, hasShoes: false,
            walkingDistance: 0, isDead: false, statuses: []
        });
        let completed: boolean = false;

        service.simulate(starting_state, []).subscribe({ complete: (): boolean => (completed = true) });

        const req = httpMock.expectOne(`${environment.api_url}/CitizenState/CitizenDay`);
        req.flush({
            startingState: { ap: 6, sp: 0, wounded: false, isEclaireur: false, hasBike: false, hasShoes: false, walkingDistance: 0, isDead: false, statuses: [] },
            steps: []
        });

        expect(completed).toBeTrue();
    });

    it('getItemsWithStateImpact GET /CitizenState/ItemsWithStateImpact et renvoie les uids', (): void => {
        let result: string[] | undefined;

        service.getItemsWithStateImpact().subscribe((uids: string[]) => (result = uids));

        const req = httpMock.expectOne(`${environment.api_url}/CitizenState/ItemsWithStateImpact`);
        expect(req.request.method).toBe('GET');
        req.flush(['bandage_#00', 'eat_6ap_#00']);

        expect(result).toEqual(['bandage_#00', 'eat_6ap_#00']);
    });

    it('rankOrders POST /CitizenState/RankOrders avec le corps attendu et convertit chaque entrée en RankedOrder', (): void => {
        const starting_state: CitizenState = new CitizenState({
            ap: 6, sp: 0, wounded: false, isEclaireur: false, hasBike: false, hasShoes: false,
            walkingDistance: 0, isDead: false, statuses: ['thirst1']
        });
        let result: RankedOrder[] | undefined;
        let completed: boolean = false;

        service.rankOrders(starting_state, [2, 1]).subscribe({
            next: (orders: RankedOrder[]) => (result = orders),
            complete: (): boolean => (completed = true)
        });

        const req = httpMock.expectOne(`${environment.api_url}/CitizenState/RankOrders`);
        expect(req.request.method).toBe('POST');
        expect(JSON.parse(req.request.body)).toEqual({
            startingState: {
                ap: 6, sp: 0, wounded: false, isEclaireur: false, hasBike: false, hasShoes: false, walkingDistance: 0, isDead: false, statuses: ['thirst1'],
                hasShield: false, hasDefenceCpItem: false, isGuide: false, zoneCitizenCount: 0,
                hasCleanPdcPerk: false, hasHydratedPdcPerk: false, hasSoberPdcPerk: false, hasBaseZoneControlPerk: false, isRoleGhoul: false
            },
            bagItemIds: [2, 1]
        });

        req.flush([
            {
                order: [2, 1], tier: 'none', tierReachedAtDistance: null, totalDistance: 6,
                finalState: { ap: 6, sp: 0, wounded: false, isEclaireur: false, hasBike: false, hasShoes: false, walkingDistance: 0, isDead: false, statuses: [] }
            },
            {
                order: [1, 2], tier: 'thirsty', tierReachedAtDistance: 11, totalDistance: 11,
                finalState: { ap: 6, sp: 0, wounded: false, isEclaireur: false, hasBike: false, hasShoes: false, walkingDistance: 0, isDead: false, statuses: ['thirst1'] }
            }
        ]);

        expect(result?.length).toBe(2);
        expect(result?.[0]?.tier).toBe('none');
        expect(result?.[1]?.tier).toBe('thirsty');
        expect(result?.[1]?.tier_reached_at_distance).toBe(11);
        expect(result?.[1]?.total_distance).toBe(11);
        expect(result?.[1]?.final_state.ap).toBe(6);
        expect(completed).toBeTrue();
    });
});
