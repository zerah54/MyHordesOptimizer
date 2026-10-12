import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapRouteDrawing } from '../../map-routes/map-route-views';
import { MapRoutesLayerComponent } from './map-routes-layer.component';

function drawing(overrides: Partial<MapRouteDrawing> = {}): MapRouteDrawing {
    return {
        key: 'mho-1',
        color: 'teal',
        cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0 }],
        lane: 0,
        dashed: false,
        emphasized: false,
        dimmed: false,
        end: null,
        label: null,
        ...overrides
    };
}

describe('MapRoutesLayerComponent', (): void => {
    let fixture: ComponentFixture<MapRoutesLayerComponent>;

    function render(drawings: MapRouteDrawing[]): HTMLElement {
        fixture = TestBed.createComponent(MapRoutesLayerComponent);
        fixture.componentRef.setInput('width', 25);
        fixture.componentRef.setInput('height', 20);
        fixture.componentRef.setInput('drawings', drawings);
        fixture.detectChanges();
        return fixture.nativeElement;
    }

    it('sizes the SVG in cell units and exposes the map size to the CSS', (): void => {
        const element: HTMLElement = render([]);

        expect(element.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 25 20');
        expect(element.style.getPropertyValue('--mho-routes-columns')).toBe('25');
        expect(element.style.getPropertyValue('--mho-routes-rows')).toBe('20');
    });

    it('draws casing, line and chevrons with the route colour', (): void => {
        const element: HTMLElement = render([drawing()]);

        const group: SVGGElement = element.querySelector('g.route') as SVGGElement;
        expect(group.style.getPropertyValue('--mho-route-color')).toBe('var(--mho-route-teal)');
        expect(group.querySelector('.line')?.getAttribute('d')).toBe('M0.5 0.5L1.5 0.5L0.5 0.5');
        expect(group.querySelector('.line')?.getAttribute('stroke-width')).toBe('0.16');
        expect(group.querySelector('.line')?.hasAttribute('stroke-dasharray')).toBe(false);
        expect(Number(group.querySelector('.casing')?.getAttribute('stroke-width'))).toBeCloseTo(0.26);
        expect(group.querySelector('.chevrons')?.getAttribute('d')).not.toBe('');
    });

    it('marks the start of a loop with a circle, not of a one-way route', (): void => {
        const element: HTMLElement = render([
            drawing(),
            drawing({ key: 'mho-2', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }], end: { x: 1, y: 0 } })
        ]);

        const groups: SVGGElement[] = Array.from(element.querySelectorAll('g.route'));
        expect(groups[0].querySelector('.loop-mark')?.getAttribute('d')).toBe('M0.34 0.5a0.16 0.16 0 1 0 0.32 0a0.16 0.16 0 1 0 -0.32 0');
        expect(groups[1].querySelector('.loop-mark')).toBeNull();
    });

    it('thickens the selected route, dims the others and dashes game routes', (): void => {
        const element: HTMLElement = render([
            drawing({ key: 'mho-1', dimmed: true }),
            drawing({ key: 'game-2', dashed: true }),
            drawing({ key: 'mho-3', emphasized: true })
        ]);

        const groups: SVGGElement[] = Array.from(element.querySelectorAll('g.route'));
        expect(groups[0].style.opacity).toBe('0.4');
        expect(groups[1].querySelector('.line')?.getAttribute('stroke-dasharray')).toBe('0.3 0.2');
        expect(groups[2].querySelector('.line')?.getAttribute('stroke-width')).toBe('0.19');
    });

    it('marks the end of one-way routes only', (): void => {
        const element: HTMLElement = render([drawing(), drawing({ key: 'mho-2', end: { x: 4, y: 2 }, lane: -0.2 })]);

        const pins: HTMLElement[] = Array.from(element.querySelectorAll('.end-pin'));
        expect(pins.length).toBe(1);
        expect(pins[0].style.left).toContain('* var(--mho-cell)');
    });

    it('labels the last cell of a drawing that has a label', (): void => {
        const element: HTMLElement = render([drawing(), drawing({ key: 'preview', cells: [{ x: 1, y: 1 }, { x: 3, y: 1 }], label: '+2 PA' })]);

        const labels: HTMLElement[] = Array.from(element.querySelectorAll('.label-pin'));
        expect(labels.map((label: HTMLElement): string => label.textContent?.trim() ?? '')).toEqual(['+2 PA']);
        expect(labels[0].style.left).toBe('calc(4 * var(--mho-cell))');
    });

    it('puts the order badges at the bottom of their cell, side by side by lane, neutral without route', (): void => {
        render([]);
        fixture.componentRef.setInput('badges', [
            { key: 'a', cell: { x: 3, y: 4 }, lane: -0.2, color: 'teal', count: 2, dimmed: false },
            { key: 'b', cell: { x: 3, y: 4 }, lane: 0.2, color: 'blue', count: 1, dimmed: true },
            { key: 'c', cell: { x: 3, y: 4 }, lane: 0, color: null, count: 5, dimmed: false }
        ]);
        fixture.detectChanges();

        const badges: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.order-badge'));
        expect(badges.map((badge: HTMLElement): string => badge.textContent?.trim() ?? '')).toEqual(['2', '1', '5']);
        expect(badges[0].style.left).toBe('calc(3.2 * var(--mho-cell))');
        expect(badges[1].style.left).toBe('calc(3.7 * var(--mho-cell))');
        expect(badges[0].style.top).toBe('calc(4.81 * var(--mho-cell))');
        expect(badges[0].style.getPropertyValue('--mho-route-color')).toBe('var(--mho-route-teal)');
        expect(badges[1].style.opacity).toBe('0.4');
        expect(badges[2].classList).toContain('neutral');
    });
});
