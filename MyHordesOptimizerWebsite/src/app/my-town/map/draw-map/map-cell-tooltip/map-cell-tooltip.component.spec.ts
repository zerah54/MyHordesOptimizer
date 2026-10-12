// Chargé en premier : c'est l'ordre d'évaluation qui expose un éventuel cycle d'imports autour de MapCellOrdersComponent.
import '../../map-orders/map-cell-orders/map-cell-orders.component';

import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideMapOrdersTesting } from '../../map-orders/map-orders.testing';
import { MapCellTooltipComponent } from './map-cell-tooltip.component';

describe('MapCellTooltipComponent', () => {
    it('se rend même quand map-cell-orders.component est évalué en premier (pas de cycle d\'imports)', () => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), ...provideMapOrdersTesting()]
        });
        const fixture: ComponentFixture<MapCellTooltipComponent> = TestBed.createComponent(MapCellTooltipComponent);

        expect(() => fixture.detectChanges()).not.toThrow();
    });
});
