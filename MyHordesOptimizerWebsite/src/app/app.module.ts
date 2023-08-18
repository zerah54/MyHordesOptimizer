import { registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import localeDE from '@angular/common/locales/de';
import localeEN from '@angular/common/locales/en';
import localeES from '@angular/common/locales/es';
import localeFR from '@angular/common/locales/fr';
import { Inject, LOCALE_ID, NgModule } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { AngularFireModule } from '@angular/fire/compat';
import * as moment from 'moment';
import { environment } from '../environments/environment';
import { Modules } from './_abstract_model/types/_types';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MyTownModule } from './my-town/my-town.module';
import { LoadingInterceptor } from './shared/services/loading-interceptor.service';
import { SharedModule } from './shared/shared.module';
import { StructureModule } from './structure/structure.module';
import { ThanksModule } from './thanks/thanks.module';
import { ToolsModule } from './tools/tools.module';
import { TutorialsModule } from './tutorials/tutorials.module';
import { WikiModule } from './wiki/wiki.module';

registerLocaleData(localeDE);
registerLocaleData(localeEN);
registerLocaleData(localeES);
registerLocaleData(localeFR);

const app_modules: Modules = [StructureModule, WikiModule, ThanksModule, ToolsModule, TutorialsModule, MyTownModule];

@NgModule({
    declarations: [AppComponent],
    imports: [
        SharedModule,
        ...app_modules,
        AppRoutingModule,
        provideFirebaseApp(() => initializeApp(environment.firebase_config)),
    ],
    providers: [
        AngularFireModule,
        { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },
        {
            provide: LOCALE_ID,
            useFactory: (): string | null => localStorage.getItem('mho-locale') || 'fr'
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
    constructor(@Inject(LOCALE_ID) private locale_id: string) {
        moment.locale(this.locale_id);
    }
}
