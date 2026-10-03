import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import moment from 'moment';

import { Cell } from '../../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { Item } from '../../../../_abstract_model/types/item.class';
import { ItemCountShort } from '../../../../_abstract_model/types/item-count-short.class';
import { Ruin } from '../../../../_abstract_model/types/ruin.class';
import { UpdateInfo } from '../../../../_abstract_model/types/update-info.class';
import { TownContextService } from '../../../../_core/services/town-context.service';
import { MapOptions } from '../../map.component';
import { CornerLayout, CORNERS_VERSION, sanitizeCorners } from '../../map-corners';
import { MapCellComponent, MapCellSelection } from './map-cell.component';

function newCell(overrides: Partial<Cell> = {}): Cell {
    const cell: Cell = new Cell();
    Object.assign(cell, {
        cell_id: 1,
        x: 0,
        y: 0,
        displayed_x: 0,
        displayed_y: 0,
        is_town: false,
        is_never_visited: false,
        is_visited_today: false,
        danger_level: 0,
        ruin_id: 0,
        is_dryed: false,
        nb_zombie: 0,
        nb_zombie_killed: 0,
        nb_hero: 0,
        is_ruin_dryed: false,
        nb_ruin_dig: 0,
        total_success: 0,
        average_potential_remaining_dig: 0,
        max_potential_remaining_dig: 0,
        is_excavated: null,
        items: [],
        citizens: [],
        nb_pa: 0,
        nb_km: 0,
        zone_regen: undefined,
        note: '',
        scav_zone_level: null,
        scout_zone_level: null,
        scout_estimation_zombie: null,
        scout_estimation_min: null,
        scout_estimation_max: null,
        scout_estimation_update_info: null
    });
    Object.assign(cell, overrides);
    return cell;
}

const options: MapOptions = {
    map_type: 'digs',
    dig_mode: 'average',
    trash_mode: 'nb',
    displayed_scrut_zone: {},
    distances: [],
    zoom: 30,
    corners: sanitizeCorners(undefined),
    corners_version: CORNERS_VERSION
};

/** Options dont la disposition des coins du type affiché est remplacée. */
function withCorners(layout: Partial<CornerLayout>, base: MapOptions = options): MapOptions {
    const corners: MapOptions['corners'] = sanitizeCorners(undefined);
    corners[base.map_type] = { ...corners[base.map_type], ...layout };
    return { ...base, corners };
}

describe('MapCellComponent', (): void => {
    let fixture: ComponentFixture<MapCellComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [MapCellComponent],
            providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' }]
        }).compileComponents();
        fixture = TestBed.createComponent(MapCellComponent);
    });

    afterEach((): void => TestBed.inject(TownContextService).clear());

    function setInputs(cell: Cell, opts: MapOptions = options): void {
        fixture.componentRef.setInput('cell', cell);
        fixture.componentRef.setInput('drawedMap', [[cell]]);
        fixture.componentRef.setInput('allRuins', <Ruin[]>[]);
        fixture.componentRef.setInput('allCitizens', <Citizen[]>[]);
        fixture.componentRef.setInput('allItems', <Item[]>[]);
        fixture.componentRef.setInput('options', opts);
    }

    it('applies the "danger" class when the map type is danger', (): void => {
        setInputs(newCell({ danger_level: 3 }), { ...options, map_type: 'danger' });
        fixture.detectChanges();

        const cell_element: HTMLElement = fixture.nativeElement.querySelector('.map-cell');
        expect(cell_element.classList).toContain('alert');
        expect(cell_element.classList).toContain('danger-3');
    });

    it('applies the "digs" class when the map type is digs', (): void => {
        setInputs(newCell(), { ...options, map_type: 'digs' });
        fixture.detectChanges();

        const cell_element: HTMLElement = fixture.nativeElement.querySelector('.map-cell');
        expect(cell_element.classList).toContain('digs');
    });

    it('shows the town marker when the cell is the town', (): void => {
        setInputs(newCell({ is_town: true }));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.town-draw')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('.content')).toBeNull();
    });

    it('lays the exploration icon over the square of an explorable ruin', (): void => {
        const ruin: Ruin = new Ruin();
        ruin.id = 7;
        ruin.explorable = true;
        setInputs(newCell({ ruin_id: 7 }));
        fixture.componentRef.setInput('allRuins', [ruin]);
        fixture.detectChanges();

        const icon: HTMLImageElement = fixture.nativeElement.querySelector('.ruin .ruin-overlay img.ruin-icon');
        expect(icon).not.toBeNull();
        expect(icon.src).toContain('small_exploration');
        expect(fixture.nativeElement.querySelector('.ruin .ruin-square')).not.toBeNull();
    });

    it('lays the dig icon over the square of the "not yet dug" sentinel ruin, and always shows its piles next to the icon', (): void => {
        setInputs(newCell({ ruin_id: -1, nb_ruin_dig: 3 }));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.ruin .ruin-square')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('.ruin .ruin-overlay img.ruin-icon').src).toContain('small_dig');
        // Contre l'icône, quelle que soit la disposition des coins : ce n'est plus une information de coin.
        expect(fixture.nativeElement.querySelector('.ruin .ruin-overlay .ruin-icon-anchor .ruin-digs').textContent.trim()).toBe('3');
        expect(fixture.nativeElement.querySelector('.corner-bottom-left')).toBeNull();

        setInputs(newCell({ ruin_id: -1, nb_ruin_dig: 3 }), { ...options, map_type: 'scout' });
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.ruin .ruin-overlay .ruin-icon-anchor .ruin-digs').textContent.trim()).toBe('3');
    });

    it('shows no pile count once the building is uncovered', (): void => {
        setInputs(newCell({ ruin_id: -1, nb_ruin_dig: 0 }));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.ruin-digs')).toBeNull();
    });

    it('greys an exploration cell whose scout level is unknown, and colours a known one', (): void => {
        setInputs(newCell({}), { ...options, map_type: 'scout' });
        fixture.detectChanges();
        const element: HTMLElement = fixture.nativeElement.querySelector('.map-cell');
        expect(element.classList).toContain('scout-unknown');

        setInputs(newCell({ scout_zone_level: 2 }), { ...options, map_type: 'scout' });
        fixture.detectChanges();
        expect(element.classList).toContain('scout-2');
        expect(element.classList).not.toContain('scout-unknown');
    });

    it('keeps the square under the building illustration at the detail zoom level', (): void => {
        const ruin: Ruin = new Ruin();
        ruin.id = 7;
        ruin.explorable = false;
        ruin.formatted_img = 'ruin/building.gif';
        setInputs(newCell({ ruin_id: 7 }));
        fixture.componentRef.setInput('allRuins', [ruin]);
        fixture.componentRef.setInput('detailed', true);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.ruin .ruin-square')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('.ruin .ruin-overlay img.ruin-illustration').src).toContain('ruin/building.gif');
    });

    it('marks an ordinary building with a square, hollow once emptied', (): void => {
        const ruin: Ruin = new Ruin();
        ruin.id = 7;
        ruin.explorable = false;
        setInputs(newCell({ ruin_id: 7, is_ruin_dryed: true }));
        fixture.componentRef.setInput('allRuins', [ruin]);
        fixture.detectChanges();

        const square: HTMLElement = fixture.nativeElement.querySelector('.ruin .ruin-square');
        expect(square).not.toBeNull();
        expect(square.classList).toContain('empty-ruin');
    });

    it('badges a blueprint still to collect, yellow under 10 km and blue beyond', (): void => {
        const ruin: Ruin = new Ruin();
        ruin.id = 7;
        setInputs(newCell({ ruin_id: 7, nb_km: 4 }));
        fixture.componentRef.setInput('allRuins', [ruin]);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.ruin .blueprint').classList).toContain('uncommon');

        setInputs(newCell({ ruin_id: 7, nb_km: 12 }));
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.ruin .blueprint').classList).toContain('rare');
    });

    it('drops the blueprint badge once the blueprint has been found', (): void => {
        const ruin: Ruin = new Ruin();
        ruin.id = 7;
        const cell: Cell = newCell({ ruin_id: 7, nb_km: 4 });
        // `is_ruin_camped` est privé : il n'est lisible que par l'accesseur `is_blueprint_found`.
        Object.assign(cell, { is_ruin_camped: true });
        setInputs(cell);
        fixture.componentRef.setInput('allRuins', [ruin]);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.ruin .blueprint')).toBeNull();
    });

    describe('corners', (): void => {
        function corner(css_class: string): HTMLElement | null {
            return fixture.nativeElement.querySelector(`.content .${css_class}`);
        }

        it('follows the default layout of the displayed map type', (): void => {
            setInputs(newCell({ note: 'x', nb_hero: 2, citizens: [new Citizen()], nb_zombie: 5, nb_zombie_killed: 3 }), { ...options, map_type: 'danger' });
            fixture.detectChanges();

            expect(corner('corner-top-left')?.querySelector('img')?.src).toContain('small_talk');
            // Nombre de citoyens présents (et non `nb_hero`, leurs points de contrôle).
            expect(corner('corner-top-right')?.textContent?.trim()).toBe('1');
            expect(corner('corner-top-right')?.querySelector('img')?.src).toContain('log/citizen');
            expect(corner('corner-bottom-left')?.textContent?.trim()).toBe('3');
            expect(corner('corner-bottom-right')?.textContent?.trim()).toBe('5');
        });

        it('renders nothing for "none" and for an information the cell does not have', (): void => {
            setInputs(newCell({ note: '' }), withCorners({ top_left: 'note', top_right: 'none', bottom_left: 'items', bottom_right: 'digs_success' }));
            fixture.detectChanges();

            expect(fixture.nativeElement.querySelectorAll('.content .corner').length).toBe(0);
        });

        it('shows the remaining digs kept by the API according to the dig mode, without subtracting the registered successes again', (): void => {
            const cell: Cell = newCell({ average_potential_remaining_dig: 10, max_potential_remaining_dig: 14, total_success: 4 });
            setInputs(cell, withCorners({ bottom_right: 'digs_remaining' }));
            fixture.detectChanges();
            expect(corner('corner-bottom-right')?.textContent?.trim()).toBe('10');

            setInputs(cell, withCorners({ bottom_right: 'digs_remaining' }, { ...options, dig_mode: 'max' }));
            fixture.detectChanges();
            expect(corner('corner-bottom-right')?.textContent?.trim()).toBe('14');
        });

        it('colours the cell with the game thresholds (0, 1-2, 3-6, 7+)', (): void => {
            const expected: [number, string][] = [[0, 'dig-0'], [1, 'dig-1'], [2, 'dig-1'], [3, 'dig-2'], [6, 'dig-2'], [7, 'dig-3']];
            for (const [remaining, css_class] of expected) {
                setInputs(newCell({ average_potential_remaining_dig: remaining }));
                fixture.detectChanges();
                expect(fixture.nativeElement.querySelector('.map-cell').classList, `${remaining}`).toContain(css_class);
            }
        });

        it('no longer lets an old scavenger level override the remaining digs', (): void => {
            setInputs(newCell({ scav_zone_level: 3, average_potential_remaining_dig: 0 }));
            fixture.detectChanges();

            expect(fixture.nativeElement.querySelector('.map-cell').classList).toContain('dig-0');
        });

        it('marks an excavated zone with the scavenger icon only', (): void => {
            setInputs(newCell({ is_excavated: true }), withCorners({ top_left: 'excavated' }));
            fixture.detectChanges();

            const excavated: HTMLElement | null = corner('corner-top-left');
            expect(excavated?.querySelector('img')?.src).toContain('professions/dig');
            expect(excavated?.querySelector('.detail-value')).toBeNull();

            setInputs(newCell({ is_excavated: false }), withCorners({ top_left: 'excavated' }));
            fixture.detectChanges();
            expect(corner('corner-top-left')).toBeNull();
        });

        it('counts the citizens standing on the cell, apart from their control points', (): void => {
            setInputs(newCell({ nb_hero: 6, citizens: [new Citizen(), new Citizen()] }), withCorners({ top_left: 'citizens', top_right: 'control_points' }));
            fixture.detectChanges();

            expect(corner('corner-top-left')?.textContent?.trim()).toBe('2');
            expect(corner('corner-top-right')?.textContent?.trim()).toBe('6');
            expect(corner('corner-top-right')?.querySelector('img')?.src).toContain('emotes/human');
        });

        it('hides unknown control points (0) instead of showing a misleading 0', (): void => {
            setInputs(newCell({ nb_hero: 0, citizens: [new Citizen()] }), withCorners({ top_right: 'control_points' }));
            fixture.detectChanges();

            expect(corner('corner-top-right')).toBeNull();
        });

        it('never shows negative remaining digs, and colours such a zone as depleted', (): void => {
            // Valeur incohérente héritée de l'ancien modèle (potentiel moins fouilles réussies).
            setInputs(newCell({ average_potential_remaining_dig: -5, max_potential_remaining_dig: -5, total_success: 5 }), withCorners({ bottom_right: 'digs_remaining' }));
            fixture.detectChanges();

            expect(corner('corner-bottom-right')?.textContent?.trim()).toBe('0');
            expect(fixture.nativeElement.querySelector('.map-cell').classList).toContain('dig-0');
        });

        it('colours the remaining digs as displayed, rounded', (): void => {
            setInputs(newCell({ average_potential_remaining_dig: 0.4, total_success: 0 }), withCorners({ bottom_right: 'digs_remaining' }));
            fixture.detectChanges();

            expect(corner('corner-bottom-right')?.textContent?.trim()).toBe('0');
            expect(fixture.nativeElement.querySelector('.map-cell').classList).toContain('dig-0');
        });

        it('sums the items lying on the ground', (): void => {
            const items: ItemCountShort[] = [Object.assign(new ItemCountShort(), { count: 2 }), Object.assign(new ItemCountShort(), { count: 5 })];
            setInputs(newCell({ items }), withCorners({ top_left: 'items' }));
            fixture.detectChanges();

            expect(corner('corner-top-left')?.textContent?.trim()).toBe('7');
        });

        it('shows the distance in km and in AP, and the age of the last update', (): void => {
            const update_info: UpdateInfo = new UpdateInfo();
            update_info.update_time = moment().subtract(3, 'hours');
            setInputs(newCell({ nb_km: 4, nb_pa: 6, update_info }),
                      withCorners({ top_left: 'distance_km', top_right: 'distance_pa', bottom_left: 'update_age', bottom_right: 'none' }));
            fixture.detectChanges();

            expect(corner('corner-top-left')?.textContent?.trim()).toBe('4');
            expect(corner('corner-top-right')?.textContent?.trim()).toBe('6');
            expect(corner('corner-top-right')?.querySelector('img')?.src).toContain('icons/ap_small');
            expect(corner('corner-bottom-left')?.textContent?.trim()).toBe('3h');
        });

        it('marks a fresher scout estimation of the zombies as approximate', (): void => {
            const cell_update: UpdateInfo = new UpdateInfo();
            cell_update.update_time = moment().subtract(2, 'hours');
            const estimation_update: UpdateInfo = new UpdateInfo();
            estimation_update.update_time = moment().subtract(1, 'hours');
            setInputs(newCell({ nb_zombie: 1, update_info: cell_update, scout_estimation_zombie: 4, scout_estimation_min: 2,
                                scout_estimation_max: 6, scout_estimation_update_info: estimation_update }),
                      withCorners({ bottom_right: 'zombies' }));
            fixture.detectChanges();

            const value: HTMLElement | null | undefined = corner('corner-bottom-right')?.querySelector('.detail-value');
            expect(value?.textContent?.trim()).toBe('≈4');
            expect(value?.classList).toContain('estimation');
        });
    });

    it('shows the dried marker when the cell is dryed', (): void => {
        setInputs(newCell({ is_dryed: true }));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.dried')).not.toBeNull();
    });

    it('emits currentHoveredCellChange with the cell on mouseenter and undefined on mouseleave', (): void => {
        const cell: Cell = newCell();
        setInputs(cell);
        fixture.detectChanges();

        const emitted: (Cell | undefined)[] = [];
        fixture.componentInstance.currentHoveredCellChange.subscribe((value: Cell | undefined) => emitted.push(value));

        const cell_element: HTMLElement = fixture.nativeElement.querySelector('.map-cell');
        cell_element.dispatchEvent(new MouseEvent('mouseenter'));
        cell_element.dispatchEvent(new MouseEvent('mouseleave'));

        expect(emitted).toEqual([cell, undefined]);
    });

    it('emits cellSelected with the cell and its element on click', (): void => {
        const cell: Cell = newCell();
        setInputs(cell);
        fixture.detectChanges();

        const emitted: MapCellSelection[] = [];
        fixture.componentInstance.cellSelected.subscribe((value: MapCellSelection) => emitted.push(value));

        const cell_element: HTMLElement = fixture.nativeElement.querySelector('.map-cell');
        cell_element.dispatchEvent(new MouseEvent('click'));

        expect(emitted.length).toBe(1);
        expect(emitted[0].cell).toBe(cell);
        expect(emitted[0].element).toBe(cell_element);
    });

    it('marks the selected cell and the cells crossing it', (): void => {
        setInputs(newCell());
        fixture.componentRef.setInput('selected', true);
        fixture.componentRef.setInput('crossed', true);
        fixture.detectChanges();

        const cell_element: HTMLElement = fixture.nativeElement.querySelector('.map-cell');
        expect(cell_element.classList).toContain('selected');
        expect(cell_element.classList).toContain('crossed');
    });
});
