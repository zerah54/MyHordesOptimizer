import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ExternalToolsUpdateJobStateDTO } from '../../../_abstract_model/dto/external-tools-update-state.dto';
import { TokenWithMeDTO } from '../../../_abstract_model/dto/token-with-me.dto';
import { TownService } from '../../../_abstract_model/services/town.service';
import { getTokenWithMeWithExpirationDate, getTown, getUser, setTown, setUser } from '../../../_core/utilities/localstorage.util';
import { ExternalToolsUpdateButtonComponent } from './external-tools-update-button.component';

interface TestableComponent {
    update(): void;
}

describe('ExternalToolsUpdateButtonComponent', (): void => {
    let component: ExternalToolsUpdateButtonComponent;
    let fixture: ComponentFixture<ExternalToolsUpdateButtonComponent>;
    let testable: TestableComponent;
    let town_service: TownService;

    beforeEach(async (): Promise<void> => {
        localStorage.clear();
        setUser(null);
        setTown(null);

        await TestBed.configureTestingModule({
            imports: [ExternalToolsUpdateButtonComponent],
            providers: [provideHttpClient(), provideHttpClientTesting()]
        }).compileComponents();

        fixture = TestBed.createComponent(ExternalToolsUpdateButtonComponent);
        component = fixture.componentInstance;
        testable = component as unknown as TestableComponent;
        town_service = TestBed.inject(TownService);
    });

    it('range le token renouvelé reçu du job quand la ville a dérivé', (): void => {
        const renewed_token: TokenWithMeDTO = {
            token: { accessToken: 'renewed-jwt', validFrom: new Date(), validTo: new Date(Date.now() + 3600000) },
            simpleMe: { id: 1, userName: 'Alice', avatar: null, townDetails: { townId: 42, townX: 0, townY: 0, townMaxX: 40, townMaxY: 40, isChaos: false, isDevaste: false, townType: 'RE', day: 3, hasExternalApi: null } }
        };
        const state: ExternalToolsUpdateJobStateDTO = { jobId: 'x', isRunning: false, startedAt: null, finishedAt: null, tools: [], renewedToken: renewed_token };
        spyOn(town_service, 'updateExternalTools').and.returnValue(of(state));
        spyOn(town_service, 'refreshMyCitizen');

        testable.update();

        expect(getUser()?.id).toBe(1);
        expect(getTown()?.town_id).toBe(42);
        expect(getTokenWithMeWithExpirationDate()?.token.access_token).toBe('renewed-jwt');
    });

    it('ne touche pas au token quand aucune dérive n\'est détectée', (): void => {
        const state: ExternalToolsUpdateJobStateDTO = { jobId: 'x', isRunning: false, startedAt: null, finishedAt: null, tools: [] };
        spyOn(town_service, 'updateExternalTools').and.returnValue(of(state));
        spyOn(town_service, 'refreshMyCitizen');

        testable.update();

        expect(getUser()).toBeNull();
        expect(getTown()).toBeNull();
        expect(getTokenWithMeWithExpirationDate()).toBeNull();
    });
});
