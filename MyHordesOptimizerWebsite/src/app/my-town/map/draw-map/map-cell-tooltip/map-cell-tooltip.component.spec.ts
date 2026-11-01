// Chargé en premier : c'est l'ordre d'évaluation qui expose un éventuel cycle d'imports autour de MapCellOrdersComponent.
import '../../map-orders/map-cell-orders/map-cell-orders.component';

import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cell } from '../../../../_abstract_model/types/cell.class';
import { Item } from '../../../../_abstract_model/types/item.class';
import { ItemCountShort } from '../../../../_abstract_model/types/item-count-short.class';
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

    it('met les objets repérés en tête de la liste et les surligne', () => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), ...provideMapOrdersTesting()]
        });
        const fixture: ComponentFixture<MapCellTooltipComponent> = TestBed.createComponent(MapCellTooltipComponent);
        const cell: Cell = new Cell();
        cell.is_town = false;
        cell.citizens = [];
        cell.items = [41, 42, 43].map((id: number): ItemCountShort => Object.assign(new ItemCountShort(), { item_id: id, count: id - 40, is_broken: false }));
        fixture.componentInstance.cell.set(cell);
        fixture.componentInstance.allItems.set([41, 42, 43].map((id: number): Item => Object.assign(new Item(), { id, img: `item${id}.gif` })));
        fixture.componentInstance.spottedItems.set(new Set<number>([42, 43]));
        fixture.detectChanges();

        const entries: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.items > div'));
        expect(entries.map((entry: HTMLElement): string | undefined => entry.querySelector('.item-quantity')?.textContent?.trim())).toEqual(['2', '3', '1']);
        expect(entries.map((entry: HTMLElement): boolean => entry.classList.contains('spotted'))).toEqual([true, true, false]);
    });
});
