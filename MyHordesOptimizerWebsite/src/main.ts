// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="@angular/localize" />

import '@angular/localize/init';
import 'zone.js';

import { registerLocaleData } from '@angular/common';
import localeDE from '@angular/common/locales/de';
import localeEN from '@angular/common/locales/en';
import localeES from '@angular/common/locales/es';
import localeFR from '@angular/common/locales/fr';

import 'moment/dist/locale/de';
import 'moment/dist/locale/en-gb';
import 'moment/dist/locale/es';
import 'moment/dist/locale/fr';
import { enableProdMode } from '@angular/core';
import { loadTranslations } from '@angular/localize';
import { bootstrapApplication } from '@angular/platform-browser';

import * as Sentry from '@sentry/angular';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';
import { xliffToJson } from './xliff-to-json';

Sentry.init({
    dsn: 'https://61d309773a068eb1aeaaae0e3fe39f23@o4506962035539968.ingest.us.sentry.io/4506962042224640',
    integrations: [],
});

registerLocaleData(localeDE);
registerLocaleData(localeEN);
registerLocaleData(localeES);
registerLocaleData(localeFR);

if (environment.production) {
    enableProdMode();
}

const lang: string = localStorage.getItem('mho-locale') ?? 'fr';

initLanguage(lang)
    .then(() => import('./app/app.component'))
    .then(() => bootstrapApplication(AppComponent, appConfig))
    .catch((err: unknown) => console.error(err));

async function initLanguage(locale: string): Promise<void> {
    if (locale === 'fr') {
        return;
    }

    const json: Record<string, string> = await fetch(`i18n/xlf-files/messages.${locale}.xlf`)
        .then((response: Response) => response.text())
        .then((file_content: string) => xliffToJson(file_content));

    loadTranslations(json);
    $localize.locale = locale;
}
