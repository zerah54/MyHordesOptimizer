import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { ApplicationConfig, ErrorHandler, importProvidersFrom, inject, LOCALE_ID, provideAppInitializer, provideZonelessChangeDetection, } from '@angular/core';
import { MAT_ICON_DEFAULT_OPTIONS, MatIconDefaultOptions } from '@angular/material/icon';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { BrowserModule } from '@angular/platform-browser';
import { provideRouter, Router, withRouterConfig } from '@angular/router';
import * as Sentry from '@sentry/angular';
import { initializeApp } from 'firebase/app';

import { environment } from '../environments/environment';
import { Modules } from './_abstract_model/types/_types';
import { MhoPaginatorIntl } from './_core/intl/mho-paginator.intl';
import { AnalyticsService } from './_core/services/analytics.service';
import { errorInterceptor } from './_core/services/errors-interceptor.service';
import { headersInterceptor } from './_core/services/headers-interceptor.service';
import { loadingInterceptor } from './_core/services/loading-interceptor.service';
import { ROUTES, ROUTES_OPTIONS } from './routes';

const angular_modules: Modules = [BrowserModule];

export const appConfig: ApplicationConfig = {
    providers: [
        provideZonelessChangeDetection(),
        provideRouter(
            ROUTES,
            withRouterConfig(ROUTES_OPTIONS),
        ),
        importProvidersFrom(...angular_modules),
        provideAppInitializer(() => inject(AnalyticsService).init(initializeApp(environment.firebase_config))),
        provideHttpClient(withXhr(), withInterceptors([headersInterceptor, loadingInterceptor, errorInterceptor])),
        provideMomentDateAdapter(),
        {
            provide: LOCALE_ID,
            useFactory: (): string | null => localStorage.getItem('mho-locale') || 'fr'
        },
        provideAppInitializer(() => {inject(Sentry.TraceService);}),
        {
            provide: ErrorHandler,
            useValue: Sentry.createErrorHandler(),
        },
        {
            provide: Sentry.TraceService,
            deps: [Router],
        },
        { provide: MatPaginatorIntl, useClass: MhoPaginatorIntl },
        {
            provide: MAT_ICON_DEFAULT_OPTIONS,
            useValue: { fontSet: 'material-symbols-outlined' } as MatIconDefaultOptions
        },

    ]

};
