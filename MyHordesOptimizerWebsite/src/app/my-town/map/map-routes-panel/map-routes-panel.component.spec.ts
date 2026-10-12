import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MapRouteDTO, MapRouteLinkedPartDTO } from '../../../_abstract_model/dto/map-route.dto';
import { Cell } from '../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { MapRoute } from '../../../_abstract_model/types/map-route.class';
import { MapRouteGame } from '../../../_abstract_model/types/map-route-game.class';
import { MapRouteAccess } from '../../../_abstract_model/types/map-routes.class';
import { Town } from '../../../_abstract_model/types/town.class';
import { buildRouteViews, MapRouteView } from '../map-routes/map-route-views';
import { MapRoutesStatus } from '../map-routes/map-routes.store';
import { DEFAULT_ROUTES_DISPLAY, MapRouteKey, MapRoutesDisplay } from '../map-routes/map-routes-display';
import { MapRouteCommonColor, MapRoutePersonalColor, MapRoutesPanelComponent } from './map-routes-panel.component';

const CITIZEN: MapRouteAccess = { is_citizen: true, is_current_town: true, can_create: true };

function route(id: number, label: string, overrides: Partial<MapRouteDTO> = {}): MapRoute {
    return new MapRoute({
        id, label, color: 'violet', authorId: 1, authorName: 'Zerah', isPrivate: false, isEditableByAll: true, sharedUserIds: [],
        cells: [{ x: 2, y: 2 }, { x: 2, y: 1 }, { x: 2, y: 2 }], stops: [], length: 2, version: 0, canEdit: true, linkedParts: [],
        lastUpdateInfo: null, ...overrides
    });
}

function part(day: number): MapRouteLinkedPartDTO {
    return { expeditionId: 3, partId: 8, day, expeditionLabel: 'Expé Nord', partPosition: 1 };
}

function citizen(id: number, name: string): Citizen {
    const result: Citizen = new Citizen();
    result.id = id;
    result.name = name;
    return result;
}

function town(): Town {
    const result: Town = new Town();
    result.town_x = 2;
    result.town_y = 2;
    result.map_width = 5;
    result.map_height = 5;
    result.day = 5;
    const town_cell: Cell = new Cell();
    town_cell.x = 2;
    town_cell.y = 2;
    town_cell.displayed_x = 0;
    town_cell.displayed_y = 0;
    town_cell.is_town = true;
    result.cells = [town_cell];
    return result;
}

describe('MapRoutesPanelComponent', (): void => {
    let fixture: ComponentFixture<MapRoutesPanelComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [MapRoutesPanelComponent],
            providers: [provideRouter([]), { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' }]
        }).compileComponents();
    });

    function render(routes: MapRoute[], options: {
        game?: MapRouteGame[];
        status?: MapRoutesStatus;
        access?: MapRouteAccess | null;
        selected?: MapRouteKey | null;
        display?: MapRoutesDisplay;
    } = {}): HTMLElement {
        const display: MapRoutesDisplay = options.display ?? DEFAULT_ROUTES_DISPLAY;
        const views: MapRouteView[] = buildRouteViews(routes, options.game ?? [], 5, display);
        fixture = TestBed.createComponent(MapRoutesPanelComponent);
        fixture.componentRef.setInput('views', views);
        fixture.componentRef.setInput('status', options.status ?? 'loaded');
        fixture.componentRef.setInput('access', options.access === undefined ? CITIZEN : options.access);
        fixture.componentRef.setInput('selectedKey', options.selected ?? null);
        fixture.componentRef.setInput('showPreviousDays', display.show_previous_days);
        fixture.componentRef.setInput('map', town());
        fixture.componentRef.setInput('allRuins', []);
        fixture.componentRef.setInput('allCitizens', [citizen(1, 'Zerah'), citizen(4, 'Silex'), citizen(6, 'Morvax')]);
        fixture.detectChanges();
        return fixture.nativeElement;
    }

    /** « Intitulé (nombre) » de chaque groupe. */
    function sectionTitles(element: HTMLElement): string[] {
        return Array.from(element.querySelectorAll('.routes-section')).map((title: Element): string => {
            const count: string = title.querySelector('.count')?.textContent?.trim() ?? '';
            const label: string = (title.textContent ?? '').replace(/\s+/g, ' ').trim();
            return `${label.slice(0, label.length - count.length).trim()} (${count})`;
        });
    }

    it('says routes are for citizens only to an observer', (): void => {
        const element: HTMLElement = render([], { access: { is_citizen: false, is_current_town: false, can_create: false } });

        expect(element.textContent).toContain('réservés aux citoyens');
        expect(element.querySelector('.routes-list')).toBeNull();
    });

    it('shows the loading and error states', (): void => {
        expect(render([], { status: 'loading', access: null }).textContent).toContain('Chargement des tracés');
        expect(render([], { status: 'error', access: null }).textContent).toContain('n\'ont pas pu être chargés');
    });

    it('groups routes: today, without expedition, MyHordes; previous days behind a toggle', (): void => {
        const game: MapRouteGame = new MapRouteGame({ id: 2, authorId: 6, label: 'Lac', length: 2, stops: [{ x: 2, y: 2 }, { x: 2, y: 0 }] });
        const element: HTMLElement = render([
            route(1, 'Libre'),
            route(2, 'Du jour', { linkedParts: [part(5)] }),
            route(3, 'Hier', { linkedParts: [part(4)] })
        ], { game: [game] });

        expect(sectionTitles(element)).toEqual(['Expéditions du jour (1)', 'Sans expédition (1)', 'Créés dans MyHordes (1)']);
        expect(element.querySelector('.toggle-previous')?.textContent).toContain('(1)');

        let shown: boolean | undefined;
        fixture.componentInstance.showPreviousDaysChange.subscribe((value: boolean): void => {
            shown = value;
        });
        (element.querySelector('.toggle-previous') as HTMLButtonElement).click();
        expect(shown).toBe(true);
    });

    it('describes each route: author, linked part, one-way, AP, private shares', (): void => {
        const element: HTMLElement = render([
            route(2, 'Du jour', { linkedParts: [part(5)], isPrivate: true, sharedUserIds: [4] }),
            route(1, 'Aller', { cells: [{ x: 2, y: 2 }, { x: 2, y: 1 }], length: 1, canEdit: false })
        ]);

        const items: HTMLElement[] = Array.from(element.querySelectorAll('.route-item'));
        const today: HTMLElement = items.find((item: HTMLElement): boolean => !!item.textContent?.includes('Du jour')) as HTMLElement;
        const one_way: HTMLElement = items.find((item: HTMLElement): boolean => !!item.textContent?.includes('Aller')) as HTMLElement;
        expect(today.querySelector('.route-sub')?.textContent).toContain('Zerah');
        expect(today.querySelector('.route-sub')?.textContent).toContain('Expé Nord · partie 2 · J5');
        expect(today.querySelector('.route-flag')?.textContent).toContain('1');
        expect(today.querySelector('.route-ap')?.textContent).toContain('2');
        expect(one_way.querySelector('.route-sub')?.textContent).toContain('Aller simple · non lié');
        expect(one_way.textContent).toContain('edit_off');
    });

    it('emits the eye toggle, the selection and "show all"', (): void => {
        const element: HTMLElement = render([route(1, 'Libre')], { display: { ...DEFAULT_ROUTES_DISPLAY, hidden: ['mho-1'] } });
        const toggled: MapRouteKey[] = [];
        const selected: (MapRouteKey | null)[] = [];
        let show_all: number = 0;
        fixture.componentInstance.visibilityToggled.subscribe((key: MapRouteKey): void => {
            toggled.push(key);
        });
        fixture.componentInstance.selectedKeyChange.subscribe((key: MapRouteKey | null): void => {
            selected.push(key);
        });
        fixture.componentInstance.showAllRequested.subscribe((): void => {
            show_all++;
        });

        expect(element.querySelector('.route-item')?.classList).toContain('off');
        expect(element.querySelector('.eye')?.getAttribute('aria-label')).toBe('Afficher Libre');
        (element.querySelector('.eye') as HTMLButtonElement).click();
        (element.querySelector('.route-main') as HTMLButtonElement).click();
        (element.querySelector('.show-all') as HTMLButtonElement).click();

        expect(toggled).toEqual(['mho-1']);
        expect(selected).toEqual(['mho-1']);
        expect(show_all).toBe(1);
    });

    it('a second click on the selected route deselects it', (): void => {
        const element: HTMLElement = render([route(1, 'Libre')], { selected: 'mho-1' });
        const selected: (MapRouteKey | null)[] = [];
        fixture.componentInstance.selectedKeyChange.subscribe((key: MapRouteKey | null): void => {
            selected.push(key);
        });

        (element.querySelector('.route-main') as HTMLButtonElement).click();

        expect(selected).toEqual([null]);
    });

    it('shows the card of the selected route', (): void => {
        const element: HTMLElement = render([
            route(1, 'Aller', {
                cells: [{ x: 2, y: 2 }, { x: 2, y: 1 }, { x: 3, y: 1 }], length: 2, isPrivate: true, sharedUserIds: [4], isEditableByAll: false,
                linkedParts: [part(5)]
            })
        ], { selected: 'mho-1' });

        const card: string = element.querySelector('.route-detail')?.textContent?.replace(/\s+/g, ' ') ?? '';
        expect(card).toContain('[0 ; 0]');
        expect(card).toContain('Ville');
        expect(card).toContain('[1 ; 1]');
        expect(card).toContain('aller simple · retour +2 PA');
        expect(card).toContain('Privé · Silex');
        expect(card).toContain('Zerah seulement');
        expect(card).toContain('Expé Nord · partie 2 · J5');
        expect(card).not.toContain('Consignes');
    });

    it('copies a game route into MHO from its card, for those who may create routes', (): void => {
        const game: MapRouteGame = new MapRouteGame({ id: 2, authorId: 6, label: 'Lac', length: 2, stops: [{ x: 2, y: 2 }, { x: 2, y: 0 }] });
        const element: HTMLElement = render([], { game: [game], selected: 'game-2' });
        const copies: MapRouteGame[] = [];
        fixture.componentInstance.copyRequested.subscribe((copied: MapRouteGame): void => {
            copies.push(copied);
        });

        const copy: HTMLButtonElement | undefined = Array.from(element.querySelectorAll<HTMLButtonElement>('.detail-actions button'))
            .find((button: HTMLButtonElement): boolean => !!button.textContent?.includes('Copier dans MHO'));
        copy?.click();

        expect(copies).toEqual([game]);

        const observer: HTMLElement = render([], { game: [game], selected: 'game-2', access: { is_citizen: true, is_current_town: false, can_create: false } });
        expect(observer.querySelector('.detail-actions')).toBeNull();
    });

    it('counts the orders of the day on the selected route', (): void => {
        const element: HTMLElement = render([route(1, 'Aller', { linkedParts: [part(5)] })], { selected: 'mho-1' });
        fixture.componentRef.setInput('orderCounts', new Map([[1, { orders: 3, cells: 2 }]]));
        fixture.detectChanges();

        const card: string = element.querySelector('.route-detail')?.textContent?.replace(/\s+/g, ' ') ?? '';
        const fields: string[] = Array.from(element.querySelectorAll('.detail-fields > *')).map((field: Element): string => field.textContent?.trim() ?? '');
        expect(fields.slice(-2)).toEqual(['Consignes', '3 consigne(s) sur 2 case(s)']);
        expect(card).toContain('Consignes');
    });

    it('picks a personal colour from the menu, or goes back to the common one', async (): Promise<void> => {
        const element: HTMLElement = render([route(1, 'Libre')], { selected: 'mho-1' });
        const changes: MapRoutePersonalColor[] = [];
        fixture.componentInstance.personalColorChange.subscribe((change: MapRoutePersonalColor): void => {
            changes.push(change);
        });

        (element.querySelector('.color-field button') as HTMLButtonElement).click();
        fixture.detectChanges();
        await fixture.whenStable();
        const options: HTMLButtonElement[] = Array.from(document.querySelectorAll('.color-option'));
        (options.find((option: HTMLButtonElement): boolean => !!option.textContent?.includes('Prune')) as HTMLButtonElement).click();
        (element.querySelector('.color-field button') as HTMLButtonElement).click();
        fixture.detectChanges();
        await fixture.whenStable();
        (Array.from(document.querySelectorAll('.color-option'))[0] as HTMLButtonElement).click();

        expect(changes).toEqual([{ key: 'mho-1', color: 'plum' }, { key: 'mho-1', color: null }]);
    });

    function buttonWithText(root: ParentNode, label: string): HTMLButtonElement | undefined {
        return Array.from(root.querySelectorAll('button')).find((button: HTMLButtonElement): boolean => !!button.textContent?.includes(label));
    }

    it('offers a new route to a citizen who can create one, even in an empty town', (): void => {
        const element: HTMLElement = render([]);
        let requested: number = 0;
        fixture.componentInstance.createRequested.subscribe((): void => {
            requested++;
        });

        (buttonWithText(element, 'Nouveau tracé') as HTMLButtonElement).click();

        expect(requested).toBe(1);
        expect(element.textContent).toContain('Aucun tracé');
        expect(buttonWithText(render([], { access: { ...CITIZEN, can_create: false } }), 'Nouveau tracé')).toBeUndefined();
    });

    it('offers to edit or delete the selected route only when it can be edited', (): void => {
        const editable: MapRoute = route(1, 'Libre');
        const element: HTMLElement = render([editable], { selected: 'mho-1' });
        const edited: MapRoute[] = [];
        const deleted: MapRoute[] = [];
        fixture.componentInstance.editRequested.subscribe((value: MapRoute): void => {
            edited.push(value);
        });
        fixture.componentInstance.deleteRequested.subscribe((value: MapRoute): void => {
            deleted.push(value);
        });

        (buttonWithText(element.querySelector('.detail-actions') as HTMLElement, 'Modifier') as HTMLButtonElement).click();
        (buttonWithText(element.querySelector('.detail-actions') as HTMLElement, 'Supprimer') as HTMLButtonElement).click();

        expect(edited).toEqual([editable]);
        expect(deleted).toEqual([editable]);
        const read_only: HTMLElement = render([route(1, 'Libre', { canEdit: false })], { selected: 'mho-1' });
        expect(read_only.querySelector('.detail-actions')).toBeNull();
        expect(buttonWithText(read_only, 'Changer pour tous')).toBeUndefined();
    });

    it('changes the common colour for everybody', async (): Promise<void> => {
        const editable: MapRoute = route(1, 'Libre');
        const element: HTMLElement = render([editable], { selected: 'mho-1' });
        const changes: MapRouteCommonColor[] = [];
        fixture.componentInstance.commonColorChange.subscribe((change: MapRouteCommonColor): void => {
            changes.push(change);
        });

        (buttonWithText(element, 'Changer pour tous') as HTMLButtonElement).click();
        fixture.detectChanges();
        await fixture.whenStable();
        const options: HTMLButtonElement[] = Array.from(document.querySelectorAll('.color-option'));
        (options.find((option: HTMLButtonElement): boolean => !!option.textContent?.includes('Cyan')) as HTMLButtonElement).click();

        expect(changes).toEqual([{ route: editable, color: 'cyan' }]);
    });
});
