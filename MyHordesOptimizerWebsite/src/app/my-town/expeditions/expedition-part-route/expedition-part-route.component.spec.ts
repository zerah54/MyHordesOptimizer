import { ANIMATION_MODULE_TYPE, Signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { Observable, of } from 'rxjs';

import { MapRouteDTO, MapRouteLinkedPartDTO } from '../../../_abstract_model/dto/map-route.dto';
import { ExpeditionOrder } from '../../../_abstract_model/types/expedition-order.class';
import { ExpeditionPart, ExpeditionPartRoute } from '../../../_abstract_model/types/expedition-part.class';
import { MapRoute } from '../../../_abstract_model/types/map-route.class';
import { ExpeditionPartRouteComponent } from './expedition-part-route.component';

interface RouteOption {
    readonly id: number;
    readonly label: string;
    readonly is_private: boolean;
    readonly disabled: boolean;
}

/** Accès aux membres protégés du composant. */
interface TestablePartRoute {
    readonly options: Signal<readonly RouteOption[]>;
    readonly new_route: number;
    select(change: MatSelectChange): void;
}

interface SelectChangeStub {
    readonly value: number | null;
    readonly source: { writeValue: ReturnType<typeof vi.fn> };
}

function route(id: number, label: string, overrides: Partial<MapRouteDTO> = {}): MapRoute {
    return new MapRoute({
        id, label, color: 'violet', authorId: 1, authorName: 'Zerah', isPrivate: false, isEditableByAll: true, sharedUserIds: [],
        cells: [{ x: 2, y: 2 }, { x: 2, y: 1 }], stops: [], length: 1, version: 0, canEdit: true, linkedParts: [],
        lastUpdateInfo: null, ...overrides
    });
}

function linked(day: number | null): MapRouteLinkedPartDTO {
    return { expeditionId: 3, partId: 8, day, expeditionLabel: 'Expé', partPosition: 0 };
}

function part(map_route: ExpeditionPartRoute | null = null): ExpeditionPart {
    return Object.assign(new ExpeditionPart(), { id: 8, position: 0, orders: [], citizens: [], map_route_id: map_route?.id ?? null, map_route });
}

const LINKED: ExpeditionPartRoute = { id: 9, label: 'Boucle sud', color: 'blue', cells: [{ x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 2 }], length: 2, version: 4 };

describe('ExpeditionPartRouteComponent', (): void => {
    let fixture: ComponentFixture<ExpeditionPartRouteComponent>;
    let component: TestablePartRoute;
    let emitted: (number | null)[];
    let confirm: boolean | undefined;
    let dialog: { open: ReturnType<typeof vi.fn> };

    beforeEach((): void => {
        confirm = undefined;
        dialog = { open: vi.fn((): { afterClosed: () => Observable<boolean | undefined> } => ({ afterClosed: () => of(confirm) })) };
        TestBed.configureTestingModule({
            imports: [ExpeditionPartRouteComponent],
            providers: [
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                provideRouter([]),
                { provide: MatDialog, useValue: dialog }
            ]
        });
    });

    function render(value: ExpeditionPart, inputs: Record<string, unknown> = {}): void {
        fixture = TestBed.createComponent(ExpeditionPartRouteComponent);
        component = fixture.componentInstance as unknown as TestablePartRoute;
        emitted = [];
        fixture.componentInstance.routeChange.subscribe((id: number | null): void => {
            emitted.push(id);
        });
        fixture.componentRef.setInput('part', value);
        fixture.componentRef.setInput('day', 5);
        Object.entries(inputs).forEach(([name, input]: [string, unknown]): void => fixture.componentRef.setInput(name, input));
        fixture.detectChanges();
    }

    function change(value: number | null): SelectChangeStub {
        return { value, source: { writeValue: vi.fn() } };
    }

    function select(stub: SelectChangeStub): void {
        component.select(<MatSelectChange><unknown>stub);
    }

    it('offers the routes free for the day, sorted by label, and locks the private ones the user cannot publish', (): void => {
        render(part(), {
            routes: [
                route(1, 'Zone est'),
                route(2, 'Autre jour', { linkedParts: [linked(4)] }),
                route(3, 'Même jour', { linkedParts: [linked(5)] }),
                route(4, 'Sans jour', { linkedParts: [linked(null)] }),
                route(5, 'Privé à moi', { isPrivate: true, canEdit: true }),
                route(6, 'Privé d\'un autre', { isPrivate: true, canEdit: false })
            ]
        });

        expect(component.options().map((option: RouteOption): string => `${option.label}${option.disabled ? ' (verrouillé)' : ''}`))
            .toEqual(['Même jour', 'Privé à moi', 'Privé d\'un autre (verrouillé)', 'Sans jour', 'Zone est']);
    });

    it('keeps the linked route among the options, even linked to the day or not loaded yet', (): void => {
        render(part(LINKED), { routes: [route(1, 'Zone est')] });
        expect(component.options().map((option: RouteOption): number => option.id)).toEqual([LINKED.id, 1]);

        render(part(LINKED), { routes: [route(LINKED.id, LINKED.label, { linkedParts: [linked(4)] })] });
        expect(component.options().map((option: RouteOption): number => option.id)).toEqual([LINKED.id]);
    });

    it('emits a public route or none, the list staying on the linked route until the part comes back', (): void => {
        render(part(LINKED), { routes: [route(1, 'Zone est')], editable: true });
        const public_change: SelectChangeStub = change(1);
        const none_change: SelectChangeStub = change(null);

        select(public_change);
        select(none_change);

        expect(emitted).toEqual([1, null]);
        expect(public_change.source.writeValue).toHaveBeenCalledWith(LINKED.id);
        expect(none_change.source.writeValue).toHaveBeenCalledWith(LINKED.id);
        expect(dialog.open).not.toHaveBeenCalled();
    });

    it('asks before linking a private route, which becomes public', (): void => {
        render(part(), { routes: [route(5, 'Privé à moi', { isPrivate: true, canEdit: true })], editable: true });

        confirm = false;
        select(change(5));
        expect(emitted).toEqual([]);

        confirm = true;
        const confirmed: SelectChangeStub = change(5);
        select(confirmed);
        expect(emitted).toEqual([5]);
        expect(confirmed.source.writeValue).toHaveBeenCalledWith(null);
        expect(dialog.open).toHaveBeenCalledTimes(2);
        expect(dialog.open.mock.calls[0][1].data.text).toContain('Privé à moi');
    });

    it('opens the map to draw a new route, without changing the part', (): void => {
        render(part(LINKED), { editable: true, canCreate: true });
        const router: Router = TestBed.inject(Router);
        const navigate: ReturnType<typeof vi.spyOn> = vi.spyOn(router, 'navigate').mockResolvedValue(true);
        const new_change: SelectChangeStub = change(component.new_route);

        select(new_change);

        expect(emitted).toEqual([]);
        expect(new_change.source.writeValue).toHaveBeenCalledWith(LINKED.id);
        expect(navigate).toHaveBeenCalledWith(['../map'], { relativeTo: TestBed.inject(ActivatedRoute), queryParams: { route: 'new' } });
    });

    it('shows the linked route and a link to it on the map when read only', (): void => {
        render(part(LINKED));

        expect(fixture.nativeElement.querySelector('mat-select')).toBeNull();
        expect(fixture.nativeElement.querySelector('.readonly .label').textContent).toBe('Boucle sud');
        expect(fixture.nativeElement.querySelector('.readonly .ap').textContent).toContain('2');
        expect(fixture.nativeElement.querySelector('a.see-on-map').getAttribute('href')).toContain('route=9');
    });

    it('shows the total cost of the part with its detail when a ruin is visited', (): void => {
        const with_visit: ExpeditionPart = part(LINKED);
        with_visit.orders = [new ExpeditionOrder({ type: 'checkbox', text: '', isDone: false, position: 0, kind: 'explore', x: 2, y: 3 })];

        render(with_visit);

        expect(fixture.nativeElement.querySelector('.readonly .ap').textContent.trim()).toBe('3 PA (2 + 1)');
    });

    it('shows nothing read only without linked route, and the list in edition', (): void => {
        render(part());
        expect(fixture.nativeElement.querySelector('.route')).toBeNull();
        expect(fixture.nativeElement.querySelector('a.see-on-map')).toBeNull();

        render(part(), { editable: true });
        expect(fixture.nativeElement.querySelector('mat-select')).not.toBeNull();
    });
});
