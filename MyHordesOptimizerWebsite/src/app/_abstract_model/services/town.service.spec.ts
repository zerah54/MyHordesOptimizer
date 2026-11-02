import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { setObservedTown, setTown } from '../../_core/utilities/localstorage.util';
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
});
