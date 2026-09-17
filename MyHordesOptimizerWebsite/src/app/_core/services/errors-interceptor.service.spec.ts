import { HttpClient, provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import type { MockedObject } from 'vitest';

import { AuthenticationService } from '../../_abstract_model/services/authentication.service';
import { errorInterceptor } from './errors-interceptor.service';
import { SnackbarService } from './snackbar.service';

describe('errorInterceptor', (): void => {
    let http_client: HttpClient;
    let http_mock: HttpTestingController;
    let authentication_service_spy: MockedObject<AuthenticationService>;
    let snackbar_spy: MockedObject<SnackbarService>;

    beforeEach((): void => {
        authentication_service_spy = {
            getMe: vi.fn().mockName('AuthenticationService.getMe')
        } as unknown as MockedObject<AuthenticationService>;
        snackbar_spy = {
            errorSnackbar: vi.fn().mockName('SnackbarService.errorSnackbar')
        } as unknown as MockedObject<SnackbarService>;

        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withXhr(), withInterceptors([errorInterceptor])),
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
        authentication_service_spy.getMe.mockReturnValue(of(null));

        http_client.get('/test').subscribe({ error: (): void => { } });

        const req: TestRequest = http_mock.expectOne('/test');
        req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

        expect(authentication_service_spy.getMe).toHaveBeenCalled();
        expect(snackbar_spy.errorSnackbar).not.toHaveBeenCalled();
    });

    it('sur 500, affiche un snackbar et ne déclenche pas de réauthentification', (): void => {
        http_client.get('/test').subscribe({ error: (): void => { } });

        const req: TestRequest = http_mock.expectOne('/test');
        req.flush('boom', { status: 500, statusText: 'Internal Server Error' });

        expect(authentication_service_spy.getMe).not.toHaveBeenCalled();
        expect(snackbar_spy.errorSnackbar).toHaveBeenCalled();
    });
});
