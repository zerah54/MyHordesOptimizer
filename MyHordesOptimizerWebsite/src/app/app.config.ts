import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom, LOCALE_ID } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAnalyticsModule } from '@angular/fire/compat/analytics';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, withRouterConfig } from '@angular/router';
import { environment } from '../environments/environment';
import { Modules } from './_abstract_model/types/_types';
import { ROUTES, ROUTES_OPTIONS } from './routes';
import { errorInterceptor } from './shared/services/errors-interceptor.service';
import { headersInterceptor } from './shared/services/headers-interceptor.service';
import { loadingInterceptor } from './shared/services/loading-interceptor.service';

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
    ]

};
