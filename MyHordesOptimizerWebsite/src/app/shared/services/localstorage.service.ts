import { Injectable } from '@angular/core';
import { AppComponent } from '../../app.component';

/*class LocalStorage implements Storage {
    [name: string]: unknown;

    readonly length!: number;

    clear(): void {
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getItem(_key: string): string | null {
        return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    key(_index: number): string | null {
        return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    removeItem(_key: string): void {
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setItem(_key: string, _value: string): void {
    }
}*/

@Injectable({ providedIn: 'root' })
export class LocalStorageService implements Storage {
    public storage!: Storage;

    constructor() {
        AppComponent.isBrowser.subscribe((is_browser: boolean) => {
            if (is_browser) {
                this.storage = localStorage;
            }
        });
    }

    [name: string]: unknown;

    public length!: number;

    clear(): void {
        this.storage?.clear();
    }

    getItem(key: string): string | null {
        return this.storage?.getItem(key);
    }

    key(index: number): string | null {
        return this.storage?.key(index);
    }

    removeItem(key: string): void {
        return this.storage?.removeItem(key);
    }

    setItem(key: string, value: string): void {
        return this.storage?.setItem(key, value);
    }
}
