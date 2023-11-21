import { registerLocaleData } from '@angular/common';

import localeDE from '@angular/common/locales/de';
import localeEN from '@angular/common/locales/en';
import localeES from '@angular/common/locales/es';
import localeFR from '@angular/common/locales/fr';
import { Inject, LOCALE_ID } from '@angular/core';
import * as moment from 'moment';

registerLocaleData(localeDE);
registerLocaleData(localeEN);
registerLocaleData(localeES);
registerLocaleData(localeFR);

export class AppModule {
    constructor(@Inject(LOCALE_ID) private locale_id: string) {
        moment.locale(this.locale_id);
    }
}
