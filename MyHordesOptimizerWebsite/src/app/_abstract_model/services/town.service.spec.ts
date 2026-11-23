import 'moment-timezone';

import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { SILENT_ERROR_STATUS } from '../../_core/services/http-context-tokens';
import { setObservedTown, setTown } from '../../_core/utilities/localstorage.util';
import { BankInfo } from '../types/bank-info.class';
import { BankVersion } from '../types/bank-version.class';
import { TownDetails } from '../types/town-details.class';
import { TownService } from './town.service';

const OWN_TOWN_ID: number = 8323;
const OBSERVED_TOWN_ID: number = 8292;
const USER_ID: number = 6042;

/**
 * Construit le détail d'une ville réduit à son identifiant.
 * @param {number} town_id Identifiant de la ville.
 * @returns {TownDetails} Détail de la ville.
 */
function townWithId(town_id: number): TownDetails {
    const town: TownDetails = new TownDetails();
    town.town_id = town_id;
    return town;
}

describe('TownService', (): void => {
    let service: TownService;
    let http_mock: HttpTestingController;

    beforeEach((): void => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(withXhr()), provideHttpClientTesting()]
        });
        service = TestBed.inject(TownService);
        http_mock = TestBed.inject(HttpTestingController);
        setTown(townWithId(OWN_TOWN_ID));
    });

    afterEach((): void => {
        http_mock.verify();
        setTown(null);
        setObservedTown(null);
    });

    describe('getCitizen', (): void => {
        it('lit le citoyen dans la ville du joueur', (): void => {
            service.getCitizen(USER_ID).subscribe();

            const request: TestRequest = http_mock.expectOne((candidate: { url: string }): boolean => candidate.url.endsWith(`/town/${OWN_TOWN_ID}/user/${USER_ID}`));
            request.flush({});
        });

        it('reste sur la ville du joueur quand il en observe une autre', (): void => {
            setObservedTown(townWithId(OBSERVED_TOWN_ID));

            service.getCitizen(USER_ID).subscribe();

            const request: TestRequest = http_mock.expectOne((candidate: { url: string }): boolean => candidate.url.endsWith(`/town/${OWN_TOWN_ID}/user/${USER_ID}`));
            request.flush({});
        });
    });

    describe('versions de la banque', (): void => {
        it('getBankVersions appelle la route des versions et construit les BankVersion', (): void => {
            let versions: BankVersion[] = [];
            service.getBankVersions(7772).subscribe((result: BankVersion[]): void => { versions = result; });

            http_mock.expectOne((candidate: { url: string }): boolean => candidate.url.includes('/Fetcher/bank/versions?townId=7772'))
                .flush([{ day: 3, lastUpdateId: 10, updateTime: '2026-11-21T15:47:00', userName: 'Zerah' }]);

            expect(versions.length).toBe(1);
            expect(versions[0].day).toBe(3);
            expect(versions[0].last_update_id).toBe(10);
            expect(versions[0].user_name).toBe('Zerah');
            expect(versions[0].update_time.tz('Europe/Paris').format('HH:mm')).toBe('16:47');
        });

        it('getBankVersion demande la version et ne touche pas au cache de la banque', (): void => {
            const set_item_spy: ReturnType<typeof vi.spyOn> = vi.spyOn(Storage.prototype, 'setItem');
            let bank: BankInfo | undefined;
            service.getBankVersion(7772, 10).subscribe((result: BankInfo): void => { bank = result; });

            http_mock.expectOne((candidate: { url: string }): boolean => candidate.url.includes('/Fetcher/bank?townId=7772&lastUpdateId=10'))
                .flush({ bank: {}, lastUpdateInfo: { username: 'Zerah', updateTime: '2026-11-21T15:47:00' } });

            expect(bank).toBeInstanceOf(BankInfo);
            expect(set_item_spy).not.toHaveBeenCalled();
            set_item_spy.mockRestore();
        });

        it('getBankVersion : la 404 attendue (repli) est silencieuse', (): void => {
            service.getBankVersion(7772, 10).subscribe({ error: (): void => undefined });

            const request: TestRequest = http_mock.expectOne((candidate: { url: string }): boolean => candidate.url.includes('/Fetcher/bank?townId=7772&lastUpdateId=10'));
            expect(request.request.context.get(SILENT_ERROR_STATUS)).toBe(404);
            request.flush(null, { status: 404, statusText: 'Not Found' });
        });
    });

    describe('updateExternalTools', (): void => {
        afterEach((): void => {
            vi.useRealTimers();
        });

        it('interroge l\'avancement du lancement démarré, par son jobId', async (): Promise<void> => {
            vi.useFakeTimers();
            const job_id: string = 'b6f1c0de-0000-4000-8000-000000000001';

            service.updateExternalTools().subscribe();
            http_mock.expectOne((candidate: { url: string }): boolean => candidate.url.includes('/ExternalTools/Update/Start'))
                .flush({ jobId: job_id, isRunning: true, startedAt: null, finishedAt: null, tools: [] });
            await vi.advanceTimersByTimeAsync(800);

            http_mock.expectOne((candidate: { url: string }): boolean => candidate.url.includes('/ExternalTools/Update/Status') && candidate.url.includes(`jobId=${job_id}`))
                .flush({ jobId: job_id, isRunning: false, startedAt: null, finishedAt: null, tools: [] });
        });
    });
});
