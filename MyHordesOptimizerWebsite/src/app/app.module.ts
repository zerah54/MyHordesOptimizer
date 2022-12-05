import { registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { LOCALE_ID, NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ScriptModule } from './script/script.module';
import { LoadingInterceptor } from './shared/services/loading-interceptor.service';
import { SharedModule } from './shared/shared.module';
import { ThanksModule } from './thanks/thanks.module';
import { ToolsModule } from './tools/tools.module';
import { WikiModule } from './wiki/wiki.module';

import localeDE from '@angular/common/locales/de';
import localeEN from '@angular/common/locales/en';
import localeES from '@angular/common/locales/es';
import localeFR from '@angular/common/locales/fr';
import { StructureModule } from './structure/structure.module';

registerLocaleData(localeDE);
registerLocaleData(localeEN);
registerLocaleData(localeES);
registerLocaleData(localeFR);

let app_modules: any[] = [ScriptModule, StructureModule, WikiModule, ThanksModule, ToolsModule];
@NgModule({
    declarations: [AppComponent],
    imports: [
        SharedModule,
        AppRoutingModule,
        ...app_modules
    ],
    providers: [
        { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },
        {
            provide: LOCALE_ID,
            useFactory: () => localStorage.getItem('mho-locale') || 'fr'
        },
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
