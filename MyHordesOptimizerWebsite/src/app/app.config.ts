import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig, ErrorHandler, importProvidersFrom, LOCALE_ID } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAnalyticsModule } from '@angular/fire/compat/analytics';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router, withRouterConfig } from '@angular/router';
import * as Sentry from '@sentry/angular';
import { environment } from '../environments/environment';
import { Modules } from './_abstract_model/types/_types';
import { errorInterceptor } from './_core/services/errors-interceptor.service';
import { headersInterceptor } from './_core/services/headers-interceptor.service';
import { loadingInterceptor } from './_core/services/loading-interceptor.service';
import { ROUTES, ROUTES_OPTIONS } from './routes';

const angular_modules: Modules = [BrowserModule, BrowserAnimationsModule];

export const appConfig: ApplicationConfig = {
    providers: [
        AngularFireModule,
        provideRouter(
            ROUTES,
            withRouterConfig(ROUTES_OPTIONS),
        ),
        importProvidersFrom(
            ...angular_modules,
            AngularFireModule.initializeApp(environment.firebase_config),
            AngularFireAnalyticsModule,
        ),
        provideFirebaseApp(() => initializeApp(environment.firebase_config)),
        provideHttpClient(withInterceptors([headersInterceptor, loadingInterceptor, errorInterceptor])),
        {
            provide: LOCALE_ID,
            useFactory: (): string | null => localStorage.getItem('mho-locale') || 'fr'
        },
        {
            provide: ErrorHandler,
            useValue: Sentry.createErrorHandler(),
        },
        {
            provide: Sentry.TraceService,
            deps: [Router],
        },
        {
            provide: APP_INITIALIZER,
            useFactory: () => () => {
            },
            deps: [Sentry.TraceService],
            multi: true,
        }
    ]

};
