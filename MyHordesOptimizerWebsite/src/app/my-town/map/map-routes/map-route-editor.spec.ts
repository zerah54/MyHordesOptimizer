import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { MapRouteDTO, MapRouteRequestDTO } from '../../../_abstract_model/dto/map-route.dto';
import { Cell } from '../../../_abstract_model/types/cell.class';
import { MAP_ROUTE_COLORS, MapRoute, MapRoutePoint } from '../../../_abstract_model/types/map-route.class';
import { Town } from '../../../_abstract_model/types/town.class';
import { MapRouteEditor } from './map-route-editor';
import { MapRouteDrawing } from './map-route-views';
import { MapRoutesStatus, MapRoutesStore } from './map-routes.store';

const CONFLICT: Error = new Error('An unexpected error occurred invoking \'SaveMapRoute\' on the server. HubException: Conflict: version 1');

class MapRoutesStoreStub {
    public readonly status: WritableSignal<MapRoutesStatus> = signal('loaded');
    public readonly routes: WritableSignal<readonly MapRoute[]> = signal([]);
    public saveRoute: (request: MapRouteRequestDTO) => Promise<MapRoute> = vi.fn((request: MapRouteRequestDTO): Promise<MapRoute> => {
        return Promise.resolve(route(request.id ?? 99, (request.version ?? -1) + 1, request.cells));
    });
    public reloadRoute: (route_id: number) => Promise<MapRoute | null> = vi.fn((): Promise<MapRoute | null> => Promise.resolve(null));
}

function route(id: number, version: number, cells: MapRoutePoint[], overrides: Partial<MapRouteDTO> = {}): MapRoute {
    const dto: MapRouteDTO = {
        id, label: `Tracé ${id}`, color: 'violet', authorId: 3, authorName: 'Auteur', isPrivate: false, isEditableByAll: false, sharedUserIds: [],
        cells, stops: [{ ...cells[cells.length - 1], mode: 'best' }], length: cells.length - 1, version, canEdit: true, linkedParts: [],
        lastUpdateInfo: null, ...overrides
    };
    return new MapRoute(dto);
}

/** Ville 5 × 5, ville en (2, 2). Potentiel : (3, 2) 6 fouilles, (2, 1) jamais visitée, le reste épuisé. */
function town(): Town {
    const result: Town = new Town();
    result.town_x = 2;
    result.town_y = 2;
    result.map_width = 5;
    result.map_height = 5;
    result.cells = [];
    for (let x: number = 0; x < 5; x++) {
        for (let y: number = 0; y < 5; y++) {
            const cell: Cell = new Cell();
            cell.x = x;
            cell.y = y;
            cell.is_town = x === 2 && y === 2;
            cell.is_never_visited = x === 2 && y === 1;
            cell.max_potential_remaining_dig = x === 3 && y === 2 ? 6 : 0;
            result.cells.push(cell);
        }
    }
    return result;
}

function keys(points: readonly MapRoutePoint[]): string {
    return points.map((point: MapRoutePoint): string => `${point.x},${point.y}`).join(' ');
}

describe('MapRouteEditor', (): void => {
    let editor: MapRouteEditor;
    let store: MapRoutesStoreStub;

    beforeEach((): void => {
        store = new MapRoutesStoreStub();
        TestBed.configureTestingModule({
            providers: [MapRouteEditor, { provide: MapRoutesStore, useValue: store }]
        });
        editor = TestBed.inject(MapRouteEditor);
        editor.setMap(town());
    });

    it('starts a new route from the town, visible and editable by the whole town', (): void => {
        editor.startNew();

        expect(editor.editing()).toBe(true);
        expect(editor.editing_key()).toBeNull();
        expect(keys(editor.cells())).toBe('2,2');
        expect(MAP_ROUTE_COLORS).toContain(editor.draft()?.color);
        expect(editor.draft()?.is_private).toBe(false);
        expect(editor.draft()?.is_editable_by_all).toBe(true);
        expect(editor.can_save()).toBe(false);
    });

    it('reaches each clicked cell through the best potential, then counts AP and fresh cells', (): void => {
        editor.startNew();

        editor.pick({ x: 3, y: 1 }, false);

        // (2,1) jamais visitée l'emporte sur les 6 fouilles de (3,2).
        expect(keys(editor.cells())).toBe('2,2 2,1 3,1');
        expect(editor.length()).toBe(2);
        expect(editor.fresh()).toBe(1);
        expect(editor.return_ap()).toBe(2);
    });

    it('goes straight in L mode', (): void => {
        editor.startNew();
        editor.setMode('l');

        editor.pick({ x: 3, y: 1 }, false);

        expect(keys(editor.cells())).toBe('2,2 3,2 3,1');
    });

    it('previews the next segment under the mouse and labels it', (): void => {
        editor.startNew();

        editor.hover({ x: 3, y: 1 });

        expect(keys(editor.preview()?.cells ?? [])).toBe('2,2 2,1 3,1');
        expect(editor.preview()?.ap).toBe(2);
        expect(editor.preview()?.fresh).toBe(1);
        const preview: MapRouteDrawing | undefined = editor.drawings().find((drawing: MapRouteDrawing): boolean => drawing.key === 'preview');
        expect(preview?.dashed).toBe(true);
        expect(preview?.label).toContain('+2');
    });

    it('needs a second touch on the same cell to add it', (): void => {
        editor.startNew();

        editor.pick({ x: 3, y: 1 }, true);
        expect(editor.length()).toBe(0);
        expect(editor.preview()?.target).toEqual({ x: 3, y: 1 });

        editor.pick({ x: 4, y: 1 }, true);
        expect(editor.length()).toBe(0);

        editor.pick({ x: 4, y: 1 }, true);
        expect(editor.length()).toBe(3);
    });

    it('undoes, clears and returns to town', (): void => {
        editor.startNew();
        editor.pick({ x: 3, y: 1 }, false);
        editor.pick({ x: 3, y: 0 }, false);

        editor.undo();
        expect(keys(editor.cells())).toBe('2,2 2,1 3,1');

        editor.returnToTown();
        expect(keys(editor.cells())).toBe('2,2 2,1 3,1 3,2 2,2');
        expect(editor.return_ap()).toBe(0);

        editor.clear();
        expect(editor.length()).toBe(0);
    });

    it('edits a saved route without recomputing it, and recalculates on demand', (): void => {
        const saved: MapRoute = route(5, 2, [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 3, y: 1 }]);
        editor.startEdit(saved);

        expect(editor.editing_key()).toBe('mho-5');
        expect(keys(editor.cells())).toBe('2,2 3,2 3,1');
        expect(editor.is_dirty()).toBe(false);

        editor.recalculate();

        expect(keys(editor.cells())).toBe('2,2 2,1 3,1');
        expect(editor.is_dirty()).toBe(true);
    });

    it('keeps a route linked to an expedition public', (): void => {
        editor.startEdit(route(5, 0, [{ x: 2, y: 2 }, { x: 2, y: 1 }], {
            linkedParts: [{ expeditionId: 1, partId: 2, day: 3, expeditionLabel: null, partPosition: 0 }]
        }));

        editor.setPrivate(true);

        expect(editor.draft()?.is_private).toBe(false);
    });

    it('shares a private route with citizens, never with its author', (): void => {
        editor.startEdit(route(5, 0, [{ x: 2, y: 2 }, { x: 2, y: 1 }]));
        editor.setPrivate(true);

        editor.addShare(8);
        editor.addShare(8);
        editor.addShare(3);
        editor.addShare(9);
        editor.removeShare(9);

        expect(editor.draft()?.shared_user_ids).toEqual([8]);
    });

    it('saves the route and leaves the editor', async (): Promise<void> => {
        editor.startNew();
        editor.setLabel('  Nord  ');
        editor.pick({ x: 3, y: 1 }, false);

        const saved: MapRoute | null = await editor.save();

        expect(saved?.id).toBe(99);
        expect(store.saveRoute).toHaveBeenCalledWith(expect.objectContaining({
            id: null, version: null, label: 'Nord', isPrivate: false, sharedUserIds: [],
            cells: [{ x: 2, y: 2 }, { x: 2, y: 1 }, { x: 3, y: 1 }], stops: [{ x: 3, y: 1, mode: 'best' }]
        }));
        expect(editor.editing()).toBe(false);
    });

    it('does not save without a name or a destination', async (): Promise<void> => {
        editor.startNew();
        editor.pick({ x: 3, y: 1 }, false);

        expect(await editor.save()).toBeNull();
        expect(store.saveRoute).not.toHaveBeenCalled();
    });

    it('stays in the editor on a failure', async (): Promise<void> => {
        vi.mocked(store.saveRoute).mockRejectedValue(new Error('500'));
        editor.startNew();
        editor.setLabel('Nord');
        editor.pick({ x: 3, y: 1 }, false);

        expect(await editor.save()).toBeNull();

        expect(editor.status()).toBe('error');
        expect(editor.editing()).toBe(true);
    });

    describe('concurrent edits', (): void => {
        const cells: MapRoutePoint[] = [{ x: 2, y: 2 }, { x: 2, y: 1 }];

        beforeEach((): void => {
            store.routes.set([route(5, 1, cells)]);
            editor.startEdit(route(5, 1, cells));
            editor.setLabel('Le mien');
        });

        it('rereads the route after a stale version, then keeps mine on demand', async (): Promise<void> => {
            vi.mocked(store.saveRoute).mockRejectedValueOnce(CONFLICT);
            vi.mocked(store.reloadRoute).mockImplementation((): Promise<MapRoute | null> => {
                store.routes.set([route(5, 4, cells)]);
                return Promise.resolve(store.routes()[0]);
            });

            expect(await editor.save()).toBeNull();
            expect(store.reloadRoute).toHaveBeenCalledWith(5);
            expect(editor.remote_state()).toBe('changed');
            expect(editor.status()).toBe('idle');

            await editor.keepMine();

            expect(store.saveRoute).toHaveBeenLastCalledWith(expect.objectContaining({ id: 5, version: 4, label: 'Le mien' }));
            expect(editor.editing()).toBe(false);
        });

        it('takes their version', (): void => {
            store.routes.set([route(5, 2, cells, { label: 'Le leur' })]);

            expect(editor.remote_state()).toBe('changed');
            editor.takeTheirs();

            expect(editor.draft()?.label).toBe('Le leur');
            expect(editor.draft()?.version).toBe(2);
            expect(editor.remote_state()).toBe('same');
        });

        it('recreates a route deleted in the meantime', async (): Promise<void> => {
            store.routes.set([]);

            expect(editor.remote_state()).toBe('gone');
            await editor.save();

            expect(store.saveRoute).toHaveBeenCalledWith(expect.objectContaining({ id: null, version: null }));
        });
    });

    describe('cutting and undoing', (): void => {
        beforeEach((): void => {
            editor.startNew();
            editor.setMode('l');
        });

        it('cuts inside a segment: the cell becomes the end, with the mode of that segment', (): void => {
            editor.pick({ x: 4, y: 2 }, false);
            editor.pick({ x: 4, y: 0 }, false);
            editor.pick({ x: 2, y: 0 }, false);

            editor.cutAt({ x: 4, y: 1 });

            expect(keys(editor.cells())).toBe('2,2 3,2 4,2 4,1');
            expect(editor.draft()?.segments[1].stop).toEqual({ x: 4, y: 1, mode: 'l' });
            expect(editor.cell_keys().has('4,0')).toBe(false);
        });

        it('cuts at the first passage, dropping everything after it, a later passage included', (): void => {
            editor.pick({ x: 4, y: 2 }, false);
            editor.returnToTown();
            editor.pick({ x: 2, y: 0 }, false);
            expect(keys(editor.cells())).toBe('2,2 3,2 4,2 3,2 2,2 2,1 2,0');

            editor.cutAt({ x: 3, y: 2 });

            expect(keys(editor.cells())).toBe('2,2 3,2');
        });

        it('clears everything from the start, and ignores the end or a cell off the route', (): void => {
            editor.pick({ x: 4, y: 2 }, false);

            editor.cutAt({ x: 4, y: 2 });
            editor.cutAt({ x: 0, y: 0 });
            expect(keys(editor.cells())).toBe('2,2 3,2 4,2');
            expect(editor.can_undo()).toBe(true);

            editor.cutAt({ x: 2, y: 2 });
            expect(editor.length()).toBe(0);
        });

        it('undoes the last change of the path: a cut, a clear, then an added destination', (): void => {
            expect(editor.can_undo()).toBe(false);
            editor.pick({ x: 4, y: 2 }, false);
            editor.pick({ x: 4, y: 0 }, false);
            editor.cutAt({ x: 3, y: 2 });
            editor.clear();

            editor.undo();
            expect(keys(editor.cells())).toBe('2,2 3,2');
            editor.undo();
            expect(keys(editor.cells())).toBe('2,2 3,2 4,2 4,1 4,0');
            editor.undo();
            expect(keys(editor.cells())).toBe('2,2 3,2 4,2');
            editor.undo();
            expect(editor.length()).toBe(0);
            expect(editor.can_undo()).toBe(false);
        });

        it('never undoes the name, and forgets the history with a new input', (): void => {
            editor.pick({ x: 4, y: 2 }, false);
            editor.setLabel('Nord');

            editor.undo();

            expect(editor.draft()?.label).toBe('Nord');
            editor.pick({ x: 4, y: 2 }, false);
            editor.startNew();
            expect(editor.can_undo()).toBe(false);
        });
    });
});
