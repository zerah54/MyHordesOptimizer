/// <reference types="@angular/localize" />

import { NgOptimizedImage, registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

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
import { errorInterceptor } from './app/shared/services/errors-interceptor.service';
import { headersInterceptor } from './app/shared/services/headers-interceptor.service';
import { loadingInterceptor } from './app/shared/services/loading-interceptor.service';

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
        AngularFireModule,
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
        provideHttpClient(withInterceptors([headersInterceptor, loadingInterceptor, errorInterceptor])),
        {
            provide: LOCALE_ID,
            useFactory: (): string | null => localStorage.getItem('mho-locale') || 'fr'
        },
    ]
})
    .catch((err: unknown) => console.error(err));
