/// <reference types="@angular/localize" />

import { registerLocaleData } from '@angular/common';

import localeDE from '@angular/common/locales/de';
import localeEN from '@angular/common/locales/en';
import localeES from '@angular/common/locales/es';
import localeFR from '@angular/common/locales/fr';
import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

import { environment } from './environments/environment';

if (environment.production) {
    enableProdMode();
}

registerLocaleData(localeDE);
registerLocaleData(localeEN);
registerLocaleData(localeES);
registerLocaleData(localeFR);


bootstrapApplication(AppComponent, appConfig)
    .catch((err: unknown) => console.error(err));
