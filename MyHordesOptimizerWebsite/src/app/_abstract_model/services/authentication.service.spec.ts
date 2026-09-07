import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { setExternalAppId, setTokenWithMeWithExpirationDate, setTown, setUser } from '../../_core/utilities/localstorage.util';
import { TokenWithMeDTO } from '../dto/token-with-me.dto';
import { TokenWithMe } from '../types/token-with-me.class';
import { AuthenticationService } from './authentication.service';

describe('AuthenticationService', (): void => {
    let service: AuthenticationService;
    let httpMock: HttpTestingController;

    // Corps minimal valide pour TokenWithMe.dtoToModel : seul le shape compte ici, pas les valeurs.
    const flushBody: TokenWithMeDTO = {
        token: { accessToken: 'abc', validFrom: new Date(), validTo: new Date() },
        simpleMe: {
            id: 1,
            userName: 'Alice',
            avatar: null,
            townDetails: {
                townId: 1, townX: 0, townY: 0, townMaxX: 40, townMaxY: 40,
                isChaos: false, isDevaste: false, day: 1, townType: 'RNE', hasExternalApi: null
            }
        }
    };

    beforeEach((): void => {
        localStorage.clear();
        setUser(null);
        setTown(null);
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });
        service = TestBed.inject(AuthenticationService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach((): void => {
        httpMock.verify();
        localStorage.clear();
        setUser(null);
        setTown(null);
    });

    describe('getToken', (): void => {
        it('never sends knownUserId (C2 : identité résolue côté serveur depuis le userKey uniquement)', (): void => {
            service.getToken().subscribe();

            const req = httpMock.expectOne((r) => r.url.startsWith(`${environment.api_url}/Authentication/Token`));
            expect(req.request.url).not.toContain('knownUserId');
            req.flush(flushBody);
        });
    });

    describe('getMe', (): void => {
        it('always calls getToken(), never short-circuiting on a cached (non-expired) token', (): void => {
            setExternalAppId('EXTERNAL-ID');
            const cached: TokenWithMe = new TokenWithMe({
                ...flushBody,
                token: { ...flushBody.token, validTo: new Date(Date.now() + 60 * 60 * 1000) }
            });
            setTokenWithMeWithExpirationDate(cached);

            service.getMe().subscribe();

            const req = httpMock.expectOne((r) => r.url.startsWith(`${environment.api_url}/Authentication/Token`));
            expect(req.request.method).toBe('GET');
            req.flush(flushBody);
        });
    });
});
