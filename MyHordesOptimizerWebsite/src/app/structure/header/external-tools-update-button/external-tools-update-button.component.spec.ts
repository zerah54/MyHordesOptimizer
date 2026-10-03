import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ExternalToolsUpdateJobStateDTO } from '../../../_abstract_model/dto/external-tools-update-state.dto';
import { TokenWithMeDTO } from '../../../_abstract_model/dto/token-with-me.dto';
import { TownService } from '../../../_abstract_model/services/town.service';
import { PageReloadService } from '../../../_core/services/page-reload.service';
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
            providers: [provideHttpClient(withXhr()), provideHttpClientTesting()]
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
        vi.spyOn(town_service, 'updateExternalTools').mockReturnValue(of(state));
        vi.spyOn(town_service, 'refreshMyCitizen');

        testable.update();

        expect(getUser()?.id).toBe(1);
        expect(getTown()?.town_id).toBe(42);
        expect(getTokenWithMeWithExpirationDate()?.token.access_token).toBe('renewed-jwt');
    });

    it('ne touche pas au token quand aucune dérive n\'est détectée', (): void => {
        const state: ExternalToolsUpdateJobStateDTO = { jobId: 'x', isRunning: false, startedAt: null, finishedAt: null, tools: [] };
        vi.spyOn(town_service, 'updateExternalTools').mockReturnValue(of(state));
        vi.spyOn(town_service, 'refreshMyCitizen');

        testable.update();

        expect(getUser()).toBeNull();
        expect(getTown()).toBeNull();
        expect(getTokenWithMeWithExpirationDate()).toBeNull();
    });

    it('recharge la page affichée une seule fois, dès que MyHordes Optimizer est à jour', (): void => {
        const reload: ReturnType<typeof vi.spyOn> = vi.spyOn(TestBed.inject(PageReloadService), 'reloadCurrentPage').mockResolvedValue(true);
        const pending: ExternalToolsUpdateJobStateDTO = {
            jobId: 'x', isRunning: true, startedAt: null, finishedAt: null,
            tools: [{ tool: 'myHordesOptimizer', status: 'pending', errors: [] }, { tool: 'gestHordes', status: 'pending', errors: [] }]
        };
        const mho_done: ExternalToolsUpdateJobStateDTO = {
            ...pending, tools: [{ tool: 'myHordesOptimizer', status: 'success', errors: [] }, { tool: 'gestHordes', status: 'pending', errors: [] }]
        };
        const all_done: ExternalToolsUpdateJobStateDTO = {
            ...pending, isRunning: false, tools: [{ tool: 'myHordesOptimizer', status: 'success', errors: [] }, { tool: 'gestHordes', status: 'success', errors: [] }]
        };
        vi.spyOn(town_service, 'updateExternalTools').mockReturnValue(of(pending, mho_done, all_done));
        vi.spyOn(town_service, 'refreshMyCitizen');

        testable.update();

        expect(reload).toHaveBeenCalledTimes(1);
    });

    it('ne recharge pas la page si MyHordes Optimizer échoue', (): void => {
        const reload: ReturnType<typeof vi.spyOn> = vi.spyOn(TestBed.inject(PageReloadService), 'reloadCurrentPage').mockResolvedValue(true);
        const failed: ExternalToolsUpdateJobStateDTO = {
            jobId: 'x', isRunning: false, startedAt: null, finishedAt: null,
            tools: [{ tool: 'myHordesOptimizer', status: 'error', errors: [{ unit: 'job', message: 'boom' }] }]
        };
        vi.spyOn(town_service, 'updateExternalTools').mockReturnValue(of(failed));
        vi.spyOn(town_service, 'refreshMyCitizen');

        testable.update();

        expect(reload).not.toHaveBeenCalled();
    });
});
