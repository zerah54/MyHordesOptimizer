import { ANIMATION_MODULE_TYPE, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import type { Mock } from 'vitest';

import { MapRouteDTO, MapRouteRequestDTO } from '../../../_abstract_model/dto/map-route.dto';
import { Cell } from '../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { Expedition } from '../../../_abstract_model/types/expedition.class';
import { ExpeditionOrder } from '../../../_abstract_model/types/expedition-order.class';
import { ExpeditionPart } from '../../../_abstract_model/types/expedition-part.class';
import { MapRoute } from '../../../_abstract_model/types/map-route.class';
import { Town } from '../../../_abstract_model/types/town.class';
import { ConfirmDialogComponent } from '../../../_shared/confirm-dialog/confirm-dialog.component';
import { DayExpeditionsStore } from '../map-orders/day-expeditions.store';
import { MapRouteEditor } from '../map-routes/map-route-editor';
import { MapRoutesStatus, MapRoutesStore } from '../map-routes/map-routes.store';
import { MapRouteKey } from '../map-routes/map-routes-display';
import { MapRouteEditorComponent } from './map-route-editor.component';

class MapRoutesStoreStub {
    public readonly status: WritableSignal<MapRoutesStatus> = signal('loaded');
    public readonly routes: WritableSignal<readonly MapRoute[]> = signal([]);
    public saveRoute: (request: MapRouteRequestDTO) => Promise<MapRoute> = vi.fn((request: MapRouteRequestDTO): Promise<MapRoute> => {
        return Promise.resolve(route(request.id ?? 12));
    });
    public reloadRoute: (route_id: number) => Promise<MapRoute | null> = vi.fn((): Promise<MapRoute | null> => Promise.resolve(null));
}

/** Remplace DayExpeditionsStore : pas de hub ni d'appel HTTP. */
class DayExpeditionsStoreStub {
    public readonly expeditions: WritableSignal<readonly Expedition[]> = signal([]);
}

function route(id: number, overrides: Partial<MapRouteDTO> = {}): MapRoute {
    return new MapRoute({
        id, label: 'Nord', color: 'teal', authorId: 1, authorName: 'Zerah', isPrivate: false, isEditableByAll: false, sharedUserIds: [],
        cells: [{ x: 2, y: 2 }, { x: 2, y: 1 }], stops: [{ x: 2, y: 1, mode: 'best' }], length: 1, version: 3, canEdit: true,
        linkedParts: [], lastUpdateInfo: null, ...overrides
    });
}

function citizen(id: number, name: string): Citizen {
    const result: Citizen = new Citizen();
    result.id = id;
    result.name = name;
    return result;
}

/** Ville 5 × 5, ville en (2, 2), sans potentiel connu. */
function town(): Town {
    const result: Town = new Town();
    result.town_x = 2;
    result.town_y = 2;
    result.map_width = 5;
    result.map_height = 5;
    const town_cell: Cell = new Cell();
    town_cell.x = 2;
    town_cell.y = 2;
    town_cell.displayed_x = 0;
    town_cell.displayed_y = 0;
    town_cell.is_town = true;
    result.cells = [town_cell];
    return result;
}

/** Laisse se terminer les promesses en cours (enregistrement). */
function flush(): Promise<void> {
    return new Promise<void>((resolve: () => void): void => {
        setTimeout(resolve, 0);
    });
}

describe('MapRouteEditorComponent', (): void => {
    let fixture: ComponentFixture<MapRouteEditorComponent>;
    let editor: MapRouteEditor;
    let store: MapRoutesStoreStub;
    let day_store: DayExpeditionsStoreStub;
    let closed: (MapRouteKey | null)[];

    beforeEach(async (): Promise<void> => {
        store = new MapRoutesStoreStub();
        day_store = new DayExpeditionsStoreStub();
        await TestBed.configureTestingModule({
            imports: [MapRouteEditorComponent],
            providers: [
                MapRouteEditor,
                { provide: MapRoutesStore, useValue: store },
                { provide: DayExpeditionsStore, useValue: day_store },
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' }
            ]
        }).compileComponents();
        editor = TestBed.inject(MapRouteEditor);
        editor.setMap(town());
    });

    /** Nouveau tracé dont le départ est posé sur la ville. */
    function startFromTown(): void {
        editor.startNew();
        editor.pick({ x: 2, y: 2 }, false);
    }

    function render(): HTMLElement {
        fixture = TestBed.createComponent(MapRouteEditorComponent);
        fixture.componentRef.setInput('map', town());
        fixture.componentRef.setInput('allRuins', []);
        fixture.componentRef.setInput('allCitizens', [citizen(1, 'Zerah'), citizen(4, 'Silex'), citizen(6, 'Morvax')]);
        closed = [];
        fixture.componentInstance.closed.subscribe((key: MapRouteKey | null): void => {
            closed.push(key);
        });
        fixture.detectChanges();
        return fixture.nativeElement;
    }

    function button(root: ParentNode, label: string): HTMLButtonElement | undefined {
        return Array.from(root.querySelectorAll('button')).find((candidate: HTMLButtonElement): boolean => !!candidate.textContent?.includes(label));
    }

    function text(element: Element | null): string {
        return (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
    }

    it('renders nothing outside of route input', (): void => {
        expect(render().querySelector('.route-editor')).toBeNull();
    });

    it('lists only the start and the end, not the intermediate clicks', (): void => {
        startFromTown();
        editor.pick({ x: 4, y: 2 }, false);
        editor.pick({ x: 4, y: 0 }, false);
        const element: HTMLElement = render();

        expect(text(element.querySelector('.editor-title'))).toBe('Nouveau tracé');
        expect(text(element.querySelector('.summary'))).toContain('4 PA');
        expect(text(element.querySelector('.summary'))).toContain('Retour en ville : +4 PA');
        const steps: string[] = Array.from(element.querySelectorAll('.step')).map((step: Element): string => {
            return ['.node', '.coordinates', '.place', '.ap'].map((selector: string): string => text(step.querySelector(selector))).join('|');
        });
        expect(steps).toEqual(['D|[0 ; 0]|Ville|0PA', 'A|[2 ; 2]||4PA']);
    });

    it('lists the cells with orders of the expeditions that follow the route, and those it left', (): void => {
        const orders: ExpeditionOrder[] = [[2, 1], [2, 1], [4, 4]].map(([x, y]: number[], position: number): ExpeditionOrder => {
            return new ExpeditionOrder({ id: position + 1, type: 'checkbox', text: '', isDone: false, position, x, y });
        });
        const linked: ExpeditionPart = Object.assign(new ExpeditionPart(), { id: 8, orders, citizens: [], map_route_id: 5, map_route: null });
        const unlinked: ExpeditionPart = Object.assign(new ExpeditionPart(), {
            id: 9, citizens: [], map_route_id: null, map_route: null,
            orders: [new ExpeditionOrder({ id: 9, type: 'checkbox', text: '', isDone: false, position: 0, x: 2, y: 1 })]
        });
        day_store.expeditions.set([Object.assign(new Expedition(), { id: 1, parts: [linked, unlinked] })]);
        editor.startEdit(route(5, { cells: [{ x: 2, y: 2 }, { x: 2, y: 1 }, { x: 2, y: 0 }], stops: [{ x: 2, y: 0, mode: 'best' }], length: 2 }));
        const element: HTMLElement = render();

        const steps: string[] = Array.from(element.querySelectorAll('.step')).map((step: Element): string => {
            return ['.node', '.coordinates', '.orders', '.ap', '.off-pill'].map((selector: string): string => text(step.querySelector(selector))).join('|');
        });
        expect(steps).toEqual(['D|[0 ; 0]||0PA|', '1|[0 ; 1]|2 consignes|1PA|', 'A|[0 ; 2]||2PA|', '!|[2 ; -2]|1 consigne||Hors tracé']);
    });

    it('lists the start alone before any destination', (): void => {
        startFromTown();
        const element: HTMLElement = render();

        expect(Array.from(element.querySelectorAll('.step .node')).map(text)).toEqual(['D']);
    });

    it('asks for the start of a new route, listing no step yet', (): void => {
        editor.startNew();
        const element: HTMLElement = render();

        expect(text(element.querySelector('.step-hint'))).toContain('case de départ');
        expect(element.querySelectorAll('.step').length).toBe(0);
        expect((button(element, 'Effacer') as HTMLButtonElement).disabled).toBe(true);
    });

    it('has no button to return to town: picking the town does it', (): void => {
        startFromTown();
        editor.pick({ x: 2, y: 0 }, false);
        const element: HTMLElement = render();

        expect(button(element, 'Retour en ville')).toBeUndefined();

        editor.pick({ x: 2, y: 2 }, false);
        fixture.detectChanges();

        expect(text(element.querySelector('.summary'))).toContain('Retour en ville compris');
    });

    it('clears the start too, so that it can be chosen again', (): void => {
        startFromTown();
        const element: HTMLElement = render();
        const clear: HTMLButtonElement = button(element, 'Effacer') as HTMLButtonElement;

        expect(text(element.querySelector('.step-hint'))).toContain('pour y aller');
        expect(clear.disabled).toBe(false);

        editor.pick({ x: 2, y: 0 }, false);
        fixture.detectChanges();
        clear.click();
        fixture.detectChanges();

        expect(editor.draft()?.start).toBeNull();
        expect(text(element.querySelector('.step-hint'))).toContain('case de départ');
        expect(clear.disabled).toBe(true);
    });

    it('saves only with a name, then reports the saved route', async (): Promise<void> => {
        startFromTown();
        editor.pick({ x: 2, y: 0 }, false);
        const element: HTMLElement = render();
        const save: HTMLButtonElement = button(element.querySelector('.editor-footer') as HTMLElement, 'Enregistrer') as HTMLButtonElement;
        expect(save.disabled).toBe(true);

        const name: HTMLInputElement = element.querySelector('.name-field input') as HTMLInputElement;
        name.value = 'Vers le nord';
        name.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        expect(save.disabled).toBe(false);

        save.click();
        await flush();

        expect(store.saveRoute).toHaveBeenCalledWith(expect.objectContaining({ label: 'Vers le nord' }));
        expect(closed).toEqual(['mho-12']);
    });

    it('switches the path computation to L mode', (): void => {
        editor.startNew();
        const element: HTMLElement = render();

        (button(element, 'Le plus direct') as HTMLButtonElement).click();
        fixture.detectChanges();

        expect(editor.mode()).toBe('l');
        expect(text(element)).toContain('Horizontal puis vertical');
    });

    it('shares a private route with chosen citizens', async (): Promise<void> => {
        editor.startNew();
        const element: HTMLElement = render();

        (button(element, 'Privé') as HTMLButtonElement).click();
        fixture.detectChanges();
        (button(element.querySelector('.people') as HTMLElement, 'Ajouter') as HTMLButtonElement).click();
        fixture.detectChanges();
        await fixture.whenStable();
        const choices: HTMLButtonElement[] = Array.from(document.querySelectorAll('.mat-mdc-menu-item'));

        expect(choices.map((choice: HTMLButtonElement): string => text(choice))).toEqual(['Morvax', 'Silex', 'Zerah']);

        choices[1].click();
        fixture.detectChanges();

        expect(editor.draft()?.shared_user_ids).toEqual([4]);
        expect(text(element.querySelector('.people'))).toContain('Silex');

        (element.querySelector('.person-remove') as HTMLButtonElement).click();
        fixture.detectChanges();

        expect(editor.draft()?.shared_user_ids).toEqual([]);
    });

    it('keeps a route linked to an expedition public', (): void => {
        store.routes.set([route(5, { linkedParts: [{ expeditionId: 1, partId: 2, day: 3, expeditionLabel: 'Expé Nord', partPosition: 0 }] })]);
        editor.startEdit(store.routes()[0]);
        const element: HTMLElement = render();

        expect(text(element)).toContain('Lié à une expédition');
        expect(text(element)).toContain('Expé Nord · partie 1 · J3');
        expect((button(element, 'Privé') as HTMLButtonElement).disabled).toBe(true);
        expect(text(element)).toContain('Son auteur seul');
    });

    it('offers both versions when the route changed in the meantime', (): void => {
        store.routes.set([route(5)]);
        editor.startEdit(route(5));
        const element: HTMLElement = render();
        expect(element.querySelector('.editor-alert')).toBeNull();

        store.routes.set([route(5, { version: 4, label: 'Leur nom' })]);
        fixture.detectChanges();
        (button(element.querySelector('.editor-alert') as HTMLElement, 'Reprendre sa version') as HTMLButtonElement).click();
        fixture.detectChanges();

        expect(editor.draft()?.label).toBe('Leur nom');
        expect(element.querySelector('.editor-alert')).toBeNull();
    });

    it('leaves at once without changes, after confirmation otherwise', (): void => {
        const ref: Pick<MatDialogRef<ConfirmDialogComponent, boolean>, 'afterClosed'> = { afterClosed: (): Observable<boolean> => of(false) };
        const open: Mock = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(<MatDialogRef<ConfirmDialogComponent, boolean>>ref);
        editor.startNew();
        const element: HTMLElement = render();

        editor.pick({ x: 2, y: 0 }, false);
        fixture.detectChanges();
        (button(element.querySelector('.editor-footer') as HTMLElement, 'Annuler') as HTMLButtonElement).click();

        expect(open).toHaveBeenCalledTimes(1);
        expect(editor.editing()).toBe(true);

        editor.undo();
        editor.clear();
        editor.cancel();
        editor.startNew();
        fixture.detectChanges();
        (button(element.querySelector('.editor-footer') as HTMLElement, 'Annuler') as HTMLButtonElement).click();

        expect(open).toHaveBeenCalledTimes(1);
        expect(editor.editing()).toBe(false);
        expect(closed).toEqual([null]);
    });
});
