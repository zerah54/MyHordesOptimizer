import { ValueProvider } from '@angular/core';
import { MAT_ICON_DEFAULT_OPTIONS, MatIconDefaultOptions } from '@angular/material/icon';

import { appConfig } from './app.config';

describe('appConfig', (): void => {
    it('defaults mat-icon to material-symbols-outlined, the only icon font loaded by the app', (): void => {
        const provider: ValueProvider | undefined = appConfig.providers
            .find((p): p is ValueProvider => typeof p === 'object' && p !== null && 'provide' in p && p.provide === MAT_ICON_DEFAULT_OPTIONS) as ValueProvider | undefined;

        expect((provider?.useValue as MatIconDefaultOptions | undefined)?.fontSet).toBe('material-symbols-outlined');
    });
});
