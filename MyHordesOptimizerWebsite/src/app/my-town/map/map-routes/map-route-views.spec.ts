import { MapRouteDTO, MapRouteLinkedPartDTO } from '../../../_abstract_model/dto/map-route.dto';
import { MapRoute } from '../../../_abstract_model/types/map-route.class';
import { MapRouteGame } from '../../../_abstract_model/types/map-route-game.class';
import { buildRouteDrawings, buildRouteViews, MapRouteDrawing, MapRouteView } from './map-route-views';
import { DEFAULT_ROUTES_DISPLAY, MapRoutesDisplay } from './map-routes-display';

const TOWN_DAY: number = 5;

function part(day: number | null): MapRouteLinkedPartDTO {
    return { expeditionId: 1, partId: 1, day, expeditionLabel: 'Expé', partPosition: 0 };
}

function route(id: number, label: string, linked: MapRouteLinkedPartDTO[] = [], loop: boolean = true): MapRoute {
    const dto: MapRouteDTO = {
        id, label, color: 'violet', authorId: 1, authorName: 'A', isPrivate: false, isEditableByAll: false, sharedUserIds: [],
        cells: loop ? [{ x: 3, y: 3 }, { x: 3, y: 2 }, { x: 3, y: 3 }] : [{ x: 3, y: 3 }, { x: 3, y: 2 }],
        stops: [], length: loop ? 2 : 1, version: 0, canEdit: true, linkedParts: linked, lastUpdateInfo: null
    };
    return new MapRoute(dto);
}

function gameRoute(id: number, label: string): MapRouteGame {
    return new MapRouteGame({ id, authorId: null, label, length: 2, stops: [{ x: 3, y: 3 }, { x: 3, y: 1 }] });
}

function viewByLabel(views: MapRouteView[], label: string): MapRouteView {
    return views.find((view: MapRouteView): boolean => view.label === label) as MapRouteView;
}

describe('buildRouteViews', (): void => {
    const routes: MapRoute[] = [
        route(1, 'Libre'),
        route(2, 'Du jour', [part(TOWN_DAY)]),
        route(3, 'Hier', [part(TOWN_DAY - 1)]),
        route(4, 'Sans jour', [part(null)]),
        route(5, 'Demain et hier', [part(TOWN_DAY - 1), part(TOWN_DAY + 1)])
    ];

    it('groups routes by their latest linked day, game routes apart', (): void => {
        const views: MapRouteView[] = buildRouteViews(routes, [gameRoute(9, 'Lac')], TOWN_DAY, DEFAULT_ROUTES_DISPLAY);

        expect(viewByLabel(views, 'Libre').group).toBe('free');
        expect(viewByLabel(views, 'Du jour').group).toBe('today');
        expect(viewByLabel(views, 'Hier').group).toBe('previous');
        expect(viewByLabel(views, 'Sans jour').group).toBe('today');
        expect(viewByLabel(views, 'Demain et hier').group).toBe('today');
        expect(viewByLabel(views, 'Lac').group).toBe('game');
    });

    it('sorts MHO routes then game routes alphabetically', (): void => {
        const views: MapRouteView[] = buildRouteViews(routes, [gameRoute(9, 'Abri')], TOWN_DAY, DEFAULT_ROUTES_DISPLAY);

        expect(views.map((view: MapRouteView): string => view.label)).toEqual(['Demain et hier', 'Du jour', 'Hier', 'Libre', 'Sans jour', 'Abri']);
    });

    it('draws previous days only on demand, and never a hidden route', (): void => {
        const hidden: MapRoutesDisplay = { ...DEFAULT_ROUTES_DISPLAY, hidden: ['mho-1'] };

        expect(viewByLabel(buildRouteViews(routes, [], TOWN_DAY, hidden), 'Hier').drawn).toBe(false);
        expect(viewByLabel(buildRouteViews(routes, [], TOWN_DAY, { ...hidden, show_previous_days: true }), 'Hier').drawn).toBe(true);
        expect(viewByLabel(buildRouteViews(routes, [], TOWN_DAY, hidden), 'Libre')).toEqual(expect.objectContaining({ hidden: true, drawn: false }));
    });

    it('applies a personal colour over the common one', (): void => {
        const display: MapRoutesDisplay = { ...DEFAULT_ROUTES_DISPLAY, colors: { 'mho-1': 'cyan' } };

        const view: MapRouteView = viewByLabel(buildRouteViews(routes, [], TOWN_DAY, display), 'Libre');

        expect(view).toEqual(expect.objectContaining({ color: 'cyan', common_color: 'violet', has_personal_color: true }));
    });

    it('expands game route stops into cells', (): void => {
        const view: MapRouteView = buildRouteViews([], [gameRoute(9, 'Lac')], TOWN_DAY, DEFAULT_ROUTES_DISPLAY)[0];

        expect(view.cells).toEqual([{ x: 3, y: 3 }, { x: 3, y: 2 }, { x: 3, y: 1 }]);
        expect(view.is_loop).toBe(false);
    });
});

describe('buildRouteDrawings', (): void => {
    const views: MapRouteView[] = buildRouteViews(
        [route(1, 'Boucle'), route(2, 'Aller', [], false)], [gameRoute(9, 'Lac')], TOWN_DAY, DEFAULT_ROUTES_DISPLAY
    );

    it('assigns lanes by id and marks the end of one-way routes only', (): void => {
        const drawings: MapRouteDrawing[] = buildRouteDrawings(views, null);

        expect(drawings.map((drawing: MapRouteDrawing): string => drawing.key)).toEqual(['mho-1', 'mho-2', 'game-9']);
        expect(drawings.map((drawing: MapRouteDrawing): number => drawing.lane)).toEqual([0, -0.2, 0.2]);
        expect(drawings[0].end).toBeNull();
        expect(drawings[1].end).toEqual({ x: 3, y: 2 });
        expect(drawings[2].dashed).toBe(true);
        expect(drawings.some((drawing: MapRouteDrawing): boolean => drawing.dimmed)).toBe(false);
    });

    it('puts the selected route on top, dims the others, and keeps the lanes', (): void => {
        const drawings: MapRouteDrawing[] = buildRouteDrawings(views, 'mho-1');

        expect(drawings.map((drawing: MapRouteDrawing): string => drawing.key)).toEqual(['mho-2', 'game-9', 'mho-1']);
        expect(drawings[2]).toEqual(expect.objectContaining({ emphasized: true, dimmed: false, lane: 0 }));
        expect(drawings[0].dimmed).toBe(true);
    });

    it('ignores a selection that is not drawn', (): void => {
        const hidden_views: MapRouteView[] = buildRouteViews(
            [route(1, 'Boucle'), route(2, 'Aller')], [], TOWN_DAY, { ...DEFAULT_ROUTES_DISPLAY, hidden: ['mho-1'] }
        );

        const drawings: MapRouteDrawing[] = buildRouteDrawings(hidden_views, 'mho-1');

        expect(drawings.map((drawing: MapRouteDrawing): string => drawing.key)).toEqual(['mho-2']);
        expect(drawings[0].dimmed).toBe(false);
    });
});
