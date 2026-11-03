import { HttpClient, HttpContext, HttpErrorResponse, provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import type { MockedObject } from 'vitest';

import { AuthenticationService } from '../../_abstract_model/services/authentication.service';
import { errorInterceptor } from './errors-interceptor.service';
import { SILENT_ERROR_STATUS } from './http-context-tokens';
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

    it('transmet l\'HttpErrorResponse à l\'abonné après la snackbar', (): void => {
        let received: unknown;
        http_client.get('/test').subscribe({
            error: (error: unknown): void => {
                received = error;
            }
        });

        http_mock.expectOne('/test').flush('conflit', { status: 409, statusText: 'Conflict' });

        expect(received).toBeInstanceOf(HttpErrorResponse);
        expect((received as HttpErrorResponse).status).toBe(409);
        expect(snackbar_spy.errorSnackbar).toHaveBeenCalledTimes(1);
    });

    it('transmet aussi l\'HttpErrorResponse sur un 401, sans snackbar', (): void => {
        authentication_service_spy.getMe.mockReturnValue(of(null));
        let received: unknown;
        http_client.get('/test').subscribe({
            error: (error: unknown): void => {
                received = error;
            }
        });

        http_mock.expectOne('/test').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

        expect((received as HttpErrorResponse).status).toBe(401);
        expect(snackbar_spy.errorSnackbar).not.toHaveBeenCalled();
    });

    it('sur le statut silencieux, transmet l\'erreur sans snackbar', (): void => {
        let received: unknown;
        http_client.get('/test', { context: new HttpContext().set(SILENT_ERROR_STATUS, 409) }).subscribe({
            error: (error: unknown): void => {
                received = error;
            }
        });

        http_mock.expectOne('/test').flush('conflit', { status: 409, statusText: 'Conflict' });

        expect((received as HttpErrorResponse).status).toBe(409);
        expect(snackbar_spy.errorSnackbar).not.toHaveBeenCalled();
    });

    it('sur un statut présent dans la liste silencieuse, transmet l\'erreur sans snackbar', (): void => {
        let received: unknown;
        http_client.get('/test', { context: new HttpContext().set(SILENT_ERROR_STATUS, [409, 423]) }).subscribe({
            error: (error: unknown): void => {
                received = error;
            }
        });

        http_mock.expectOne('/test').flush('verrou', { status: 423, statusText: 'Locked' });

        expect((received as HttpErrorResponse).status).toBe(423);
        expect(snackbar_spy.errorSnackbar).not.toHaveBeenCalled();
    });

    it('sur un statut absent de la liste silencieuse, garde la snackbar', (): void => {
        http_client.get('/test', { context: new HttpContext().set(SILENT_ERROR_STATUS, [409, 423]) }).subscribe({ error: (): void => { } });

        http_mock.expectOne('/test').flush('interdit', { status: 403, statusText: 'Forbidden' });

        expect(snackbar_spy.errorSnackbar).toHaveBeenCalledTimes(1);
    });

    it('sur un autre statut que le statut silencieux, garde la snackbar', (): void => {
        http_client.get('/test', { context: new HttpContext().set(SILENT_ERROR_STATUS, 409) }).subscribe({ error: (): void => { } });

        http_mock.expectOne('/test').flush('interdit', { status: 403, statusText: 'Forbidden' });

        expect(snackbar_spy.errorSnackbar).toHaveBeenCalledTimes(1);
    });

    it('sur un 401 avec statut silencieux, garde la réauthentification', (): void => {
        authentication_service_spy.getMe.mockReturnValue(of(null));
        http_client.get('/test', { context: new HttpContext().set(SILENT_ERROR_STATUS, 409) }).subscribe({ error: (): void => { } });

        http_mock.expectOne('/test').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

        expect(authentication_service_spy.getMe).toHaveBeenCalled();
    });
});
