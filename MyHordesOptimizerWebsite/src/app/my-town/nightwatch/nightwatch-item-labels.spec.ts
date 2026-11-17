import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ApiService } from '../../_abstract_model/services/api.service';
import { Item } from '../../_abstract_model/types/item.class';
import { injectItemLabeler } from './nightwatch-item-labels';

describe('injectItemLabeler', (): void => {
    afterEach((): void => {
        TestBed.resetTestingModule();
    });

    function labeler(items$: unknown): (item_id: number) => string {
        TestBed.configureTestingModule({ providers: [{ provide: ApiService, useValue: { getItems: (): unknown => items$ } }] });
        return runInInjectionContext(TestBed.inject(Injector), (): ((item_id: number) => string) => injectItemLabeler());
    }

    it('libellé d\'un objet connu', (): void => {
        const wood: Item = Object.assign(new Item(), { id: 5, uid: 'wood', label: { fr: 'Bois', en: 'Bois', de: 'Bois', es: 'Bois' } });

        expect(labeler(of([wood]))(5)).toBe('Bois');
    });

    it('échec du catalogue : libellé de repli, sans exception', (): void => {
        const label: (item_id: number) => string = labeler(throwError((): Error => new Error('api')));

        expect(label(5)).toBe('#5');
    });
});
