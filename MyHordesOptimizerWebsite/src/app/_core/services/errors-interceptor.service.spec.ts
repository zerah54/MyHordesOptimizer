import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuthenticationService } from '../../_abstract_model/services/authentication.service';
import { errorInterceptor } from './errors-interceptor.service';
import { SnackbarService } from './snackbar.service';

describe('errorInterceptor', (): void => {
    let http_client: HttpClient;
    let http_mock: HttpTestingController;
    let authentication_service_spy: jasmine.SpyObj<AuthenticationService>;
    let snackbar_spy: jasmine.SpyObj<SnackbarService>;

    beforeEach((): void => {
        authentication_service_spy = jasmine.createSpyObj('AuthenticationService', ['getMe']);
        snackbar_spy = jasmine.createSpyObj('SnackbarService', ['errorSnackbar']);

        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([errorInterceptor])),
                provideHttpClientTesting(),
                { provide: AuthenticationService, useValue: authentication_service_spy },
                { provide: SnackbarService, useValue: snackbar_spy }
            ]
        });

        http_client = TestBed.inject(HttpClient);
        http_mock = TestBed.inject(HttpTestingController);
    });

    afterEach((): void => {
        http_mock.verify();
    });

    it('sur 401, déclenche une réauthentification en tâche de fond sans appeler retry', (): void => {
        authentication_service_spy.getMe.and.returnValue(of(null));

        http_client.get('/test').subscribe({ error: (): void => { /** ignoré : hors périmètre du test */ } });

        const req: TestRequest = http_mock.expectOne('/test');
        req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

        expect(authentication_service_spy.getMe).toHaveBeenCalled();
        expect(snackbar_spy.errorSnackbar).not.toHaveBeenCalled();
    });

    it('sur 500, affiche un snackbar et ne déclenche pas de réauthentification', (): void => {
        http_client.get('/test').subscribe({ error: (): void => { /** ignoré : hors périmètre du test */ } });

        const req: TestRequest = http_mock.expectOne('/test');
        req.flush('boom', { status: 500, statusText: 'Internal Server Error' });

        expect(authentication_service_spy.getMe).not.toHaveBeenCalled();
        expect(snackbar_spy.errorSnackbar).toHaveBeenCalled();
    });
});
