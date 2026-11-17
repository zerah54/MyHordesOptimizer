import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { PreTownSummary } from '../types/pre-town.class';
import { PreTownService } from './pre-town.service';

describe('PreTownService', (): void => {
    let service: PreTownService;
    let http_mock: HttpTestingController;
    const base: string = `${environment.api_url}/PreTowns`;

    beforeEach((): void => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(withXhr()), provideHttpClientTesting()] });
        service = TestBed.inject(PreTownService);
        http_mock = TestBed.inject(HttpTestingController);
    });

    afterEach((): void => http_mock.verify());

    /** Vérifie verbe, URL et corps de l'unique requête émise, puis la complète. */
    function expectCall(url: string, method: string, body: unknown, response: object | null): void {
        const req: TestRequest = http_mock.expectOne(url);
        expect(req.request.method).toBe(method);
        expect(req.request.body).toEqual(body);
        req.flush(response);
    }

    it('create POST /PreTowns avec l\'alias', (): void => {
        service.create('Ma pré-ville').subscribe();
        expectCall(base, 'POST', { alias: 'Ma pré-ville' }, {});
    });

    it('listMine GET /PreTowns/mine', (): void => {
        service.listMine().subscribe();
        expectCall(`${base}/mine`, 'GET', null, []);
    });

    it('get GET /PreTowns/:id', (): void => {
        service.get(3).subscribe();
        expectCall(`${base}/3`, 'GET', null, {});
    });

    it('addMember PUT /PreTowns/:id/members/:idUser', (): void => {
        service.addMember(3, 9).subscribe();
        expectCall(`${base}/3/members/9`, 'PUT', {}, null);
    });

    it('removeMember DELETE /PreTowns/:id/members/:idUser', (): void => {
        service.removeMember(3, 9).subscribe();
        expectCall(`${base}/3/members/9`, 'DELETE', null, null);
    });

    it('setOrganizer PUT /PreTowns/:id/organizers/:idUser?isOrganizer=', (): void => {
        service.setOrganizer(3, 9, false).subscribe();
        expectCall(`${base}/3/organizers/9?isOrganizer=false`, 'PUT', {}, null);
    });

    it('rename PUT /PreTowns/:id/alias', (): void => {
        service.rename(3, 'Neuf').subscribe();
        expectCall(`${base}/3/alias`, 'PUT', { alias: 'Neuf' }, null);
    });

    it('setSimulatedCitizens PUT /PreTowns/:id/simulated-citizens', (): void => {
        service.setSimulatedCitizens(3, 25).subscribe();
        expectCall(`${base}/3/simulated-citizens`, 'PUT', { simulatedCitizens: 25 }, null);
    });

    it('markSeen PUT /PreTowns/:id/seen', (): void => {
        service.markSeen(3).subscribe();
        expectCall(`${base}/3/seen`, 'PUT', {}, null);
    });

    it('previewLink GET /PreTowns/:id/link/preview', (): void => {
        service.previewLink(3).subscribe();
        expectCall(`${base}/3/link/preview`, 'GET', null, {});
    });

    it('link POST /PreTowns/:id/link', (): void => {
        service.link(3).subscribe();
        expectCall(`${base}/3/link`, 'POST', {}, {});
    });

    it('unlink DELETE /PreTowns/:id/link', (): void => {
        service.unlink(3).subscribe();
        expectCall(`${base}/3/link`, 'DELETE', null, null);
    });

    it('duplicate POST /PreTowns/:id/duplicate avec l\'alias', (): void => {
        service.duplicate(3, 'Copie').subscribe();
        expectCall(`${base}/3/duplicate`, 'POST', { alias: 'Copie' }, {});
    });

    describe('unseenPreTownCount', (): void => {
        /** Résumé minimal d'une pré-ville. */
        function summary(preTownId: number, seen: boolean): PreTownSummary {
            return { preTownId, mapId: preTownId, alias: `p${preTownId}`, isOrganizer: false, seen, isLinked: false, memberCount: 1 };
        }

        /** Charge une liste via `listMine`. */
        function loadList(items: PreTownSummary[]): void {
            service.listMine().subscribe();
            http_mock.expectOne(`${base}/mine`).flush(items);
        }

        /** Complète un `markSeen` réussi. */
        function markSeenOk(id: number): void {
            service.markSeen(id).subscribe();
            http_mock.expectOne(`${base}/${id}/seen`).flush(null);
        }

        it('vaut 0 avant toute liste', (): void => {
            expect(service.unseenPreTownCount()).toBe(0);
        });

        it('compte les pré-villes non vues après listMine', (): void => {
            loadList([summary(1, false), summary(2, false), summary(3, true)]);

            expect(service.unseenPreTownCount()).toBe(2);
        });

        it('décrémente après un markSeen réussi sur une pré-ville non vue', (): void => {
            loadList([summary(1, false), summary(2, false), summary(3, true)]);

            markSeenOk(1);

            expect(service.unseenPreTownCount()).toBe(1);
        });

        it('ne change pas pour une pré-ville déjà vue ou inconnue', (): void => {
            loadList([summary(1, false), summary(3, true)]);

            markSeenOk(3);
            markSeenOk(99);

            expect(service.unseenPreTownCount()).toBe(1);
        });

        it('ne descend jamais sous 0, même si markSeen est répété', (): void => {
            loadList([summary(1, false)]);

            markSeenOk(1);
            markSeenOk(1);

            expect(service.unseenPreTownCount()).toBe(0);
        });

        it('markSeen en échec laisse le compteur intact', (): void => {
            loadList([summary(1, false)]);

            service.markSeen(1).subscribe({ error: (): void => undefined });
            http_mock.expectOne(`${base}/1/seen`).flush(null, { status: 500, statusText: 'KO' });

            expect(service.unseenPreTownCount()).toBe(1);
        });

        it('refreshUnseenCount appelle GET une fois et renseigne le compteur', (): void => {
            service.refreshUnseenCount();
            service.refreshUnseenCount();

            const req: TestRequest = http_mock.expectOne(`${base}/mine`);
            expect(req.request.method).toBe('GET');
            req.flush([summary(1, false), summary(2, true)]);

            expect(service.unseenPreTownCount()).toBe(1);
        });

        it('refreshUnseenCount en échec laisse le compteur intact, sans lever', (): void => {
            service.refreshUnseenCount();

            expect((): void => http_mock.expectOne(`${base}/mine`).flush(null, { status: 500, statusText: 'KO' })).not.toThrow();

            expect(service.unseenPreTownCount()).toBe(0);
        });
    });
});
