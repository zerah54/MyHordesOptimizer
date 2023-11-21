/// <reference types="@angular/localize" />

import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { enableProdMode, importProvidersFrom, LOCALE_ID } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAnalyticsModule } from '@angular/fire/compat/analytics';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withRouterConfig } from '@angular/router';
import { Modules } from './app/_abstract_model/types/_types';
import { AppComponent } from './app/app.component';
import { MyTownModule } from './app/my-town/my-town.module';
import { ROUTES, ROUTES_OPTIONS } from './app/routes';
import { ErrorsInterceptor } from './app/shared/services/errors-interceptor.service';
import { HeadersInterceptor } from './app/shared/services/headers-interceptor.service';
import { LoadingInterceptor } from './app/shared/services/loading-interceptor.service';
import { SnackbarService } from './app/shared/services/snackbar.service';
import { SharedModule } from './app/shared/shared.module';
import { StructureModule } from './app/structure/structure.module';
import { ThanksModule } from './app/thanks/thanks.module';
import { ToolsModule } from './app/tools/tools.module';
import { TutorialsModule } from './app/tutorials/tutorials.module';
import { WikiModule } from './app/wiki/wiki.module';

import { environment } from './environments/environment';

const app_modules: Modules = [StructureModule, WikiModule, ThanksModule, ToolsModule, TutorialsModule, MyTownModule];


if (environment.production) {
    enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
        provideRouter(ROUTES,
            withRouterConfig(ROUTES_OPTIONS),
        ),
        importProvidersFrom(SharedModule, ...app_modules, AngularFireModule.initializeApp(environment.firebase_config), AngularFireAnalyticsModule, provideFirebaseApp(() => initializeApp(environment.firebase_config))),
        AngularFireModule,
        { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: HeadersInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: ErrorsInterceptor, multi: true, deps: [SnackbarService] },
        {
            provide: LOCALE_ID,
            useFactory: (): string | null => localStorage.getItem('mho-locale') || 'fr'
        }
    ]
})
    .catch((err: unknown) => console.error(err));
