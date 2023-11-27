/// <reference types="@angular/localize" />

import { NgOptimizedImage, registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS, provideHttpClient } from '@angular/common/http';

import localeDE from '@angular/common/locales/de';
import localeEN from '@angular/common/locales/en';
import localeES from '@angular/common/locales/es';
import localeFR from '@angular/common/locales/fr';
import { enableProdMode, importProvidersFrom, LOCALE_ID } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAnalyticsModule } from '@angular/fire/compat/analytics';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication, BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, withRouterConfig } from '@angular/router';
import { Modules } from './app/_abstract_model/types/_types';
import { AppComponent } from './app/app.component';
import { ROUTES, ROUTES_OPTIONS } from './app/routes';
import { ErrorsInterceptor } from './app/shared/services/errors-interceptor.service';
import { HeadersInterceptor } from './app/shared/services/headers-interceptor.service';
import { LoadingInterceptor } from './app/shared/services/loading-interceptor.service';
import { SnackbarService } from './app/shared/services/snackbar.service';

import { environment } from './environments/environment';

if (environment.production) {
    enableProdMode();
}

registerLocaleData(localeDE);
registerLocaleData(localeEN);
registerLocaleData(localeES);
registerLocaleData(localeFR);

const angular_modules: Modules = [BrowserModule, BrowserAnimationsModule, FormsModule, ReactiveFormsModule, NgOptimizedImage];

bootstrapApplication(AppComponent, {
    providers: [
        provideRouter(
            ROUTES,
            withRouterConfig(ROUTES_OPTIONS),
        ),
        importProvidersFrom(
            ...angular_modules,
            AngularFireModule.initializeApp(environment.firebase_config),
            AngularFireAnalyticsModule,
            provideFirebaseApp(() => initializeApp(environment.firebase_config))
        ),
        provideHttpClient(),
        AngularFireModule,
        { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: HeadersInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: ErrorsInterceptor, multi: true, deps: [SnackbarService] },
        {
            provide: LOCALE_ID,
            useFactory: (): string | null => localStorage.getItem('mho-locale') || 'fr'
        },
    ]
})
    .catch((err: unknown) => console.error(err));
