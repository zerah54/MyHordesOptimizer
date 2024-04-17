// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="@angular/localize" />

import '@angular/localize/init';
import 'zone.js';

import { registerLocaleData } from '@angular/common';
import localeDE from '@angular/common/locales/de';
import localeEN from '@angular/common/locales/en';
import localeES from '@angular/common/locales/es';
import localeFR from '@angular/common/locales/fr';

import { enableProdMode } from '@angular/core';
import { loadTranslations } from '@angular/localize';
import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';
import { xliffToJson } from './xliff-to-json';

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

    const json: Record<string, string> = await fetch(`/assets/i18n/xlf-files/messages.${locale}.xlf`)
        .then((response: Response) => response.text())
        .then((file_content: string) => xliffToJson(file_content));

    loadTranslations(json);
    $localize.locale = locale;
}
