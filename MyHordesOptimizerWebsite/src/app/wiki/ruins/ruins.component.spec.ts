import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import moment from 'moment';
import { Subject } from 'rxjs';

import { ApiService } from '../../_abstract_model/services/api.service';
import { TownService } from '../../_abstract_model/services/town.service';
import { Item } from '../../_abstract_model/types/item.class';
import { Ruin } from '../../_abstract_model/types/ruin.class';
import { RuinItem } from '../../_abstract_model/types/ruin-item.class';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { setTown } from '../../_core/utilities/localstorage.util';
import { RuinsComponent } from './ruins.component';

describe('RuinsComponent', (): void => {
    let fixture: ComponentFixture<RuinsComponent>;
    let component: RuinsComponent;
    let ruins_subject: Subject<Ruin[]>;
    let town_ruins_subject: Subject<Ruin[]>;

    function makeItem(id: number, label: string): Item {
        const item: Item = new Item();
        item.id = id;
        item.label = { [moment.locale()]: label };
        item.img = 'item.gif';
        return item;
    }

    function makeRuin(id: number, label: string, min_dist: number = 1, max_dist: number = 5): Ruin {
        const ruin: Ruin = new Ruin();
        ruin.id = id;
        ruin.label = { [moment.locale()]: label };
        ruin.description = { [moment.locale()]: '' };
        ruin.formatted_img = 'ruin.gif';
        ruin.min_dist = min_dist;
        ruin.max_dist = max_dist;
        ruin.camping = 0;
        ruin.drops = [];
        return ruin;
    }

    function createComponent(): void {
        fixture = TestBed.createComponent(RuinsComponent);
        component = fixture.componentInstance;
    }

    beforeEach(async (): Promise<void> => {
        setTown(null);
        ruins_subject = new Subject<Ruin[]>();
        town_ruins_subject = new Subject<Ruin[]>();
        await TestBed.configureTestingModule({
            imports: [RuinsComponent],
            providers: [
                provideNoopAnimations(),
                { provide: ApiService, useValue: { getRuins: (): unknown => ruins_subject.asObservable() } },
                { provide: TownService, useValue: { getTownRuins: (): unknown => town_ruins_subject.asObservable() } }
            ]
        }).compileComponents();
    });

    afterEach((): void => setTown(null));

    it('renders nothing until the ruins have arrived', (): void => {
        createComponent();
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('table'))).toBeNull();
    });

    it('renders one row per ruin once the API responds', fakeAsync((): void => {
        createComponent();
        fixture.detectChanges();

        ruins_subject.next([makeRuin(1, 'Cimetière'), makeRuin(2, 'Usine')]);
        fixture.detectChanges();
        tick();

        const rows = fixture.debugElement.queryAll(By.css('tr[mat-row]'));
        expect(rows.length).toBe(2);
    }));

    it('deduplicates dropped items across ruins into `items`', fakeAsync((): void => {
        createComponent();
        fixture.detectChanges();

        const shared_item: RuinItem = Object.assign(new RuinItem(), { item: makeItem(1, 'Clou'), probability: 0.5 });
        const shared_item_dup: RuinItem = Object.assign(new RuinItem(), { item: makeItem(1, 'Clou'), probability: 0.2 });
        const other_item: RuinItem = Object.assign(new RuinItem(), { item: makeItem(2, 'Planche'), probability: 0.3 });
        const ruin_a: Ruin = makeRuin(1, 'Cimetière');
        ruin_a.drops = [shared_item];
        const ruin_b: Ruin = makeRuin(2, 'Usine');
        ruin_b.drops = [shared_item_dup, other_item];

        ruins_subject.next([ruin_a, ruin_b]);
        fixture.detectChanges();
        tick();

        expect(component['items']().length).toBe(2);
    }));

    it('resolves matSort onto the datasource shortly after the ruins arrive', fakeAsync((): void => {
        createComponent();
        fixture.detectChanges();

        ruins_subject.next([makeRuin(1, 'Cimetière')]);
        fixture.detectChanges();
        tick();

        expect(component['datasource']().sort).toBeTruthy();
    }));

    it('customFilter matches a ruin by label, distance bounds, or dropped object', (): void => {
        createComponent();
        fixture.detectChanges();

        const ruin: Ruin = makeRuin(1, 'Cimetière', 2, 8);
        ruin.drops = [Object.assign(new RuinItem(), { item: makeItem(1, 'Clou'), probability: 1 })];

        const no_filter: string = JSON.stringify({ label: '', min_dist: '', max_dist: '', objects: [] });
        expect(component['customFilter'](ruin, no_filter)).toBe(true);

        const matching_label: string = JSON.stringify({ label: 'cime', min_dist: '', max_dist: '', objects: [] });
        expect(component['customFilter'](ruin, matching_label)).toBe(true);

        const other_label: string = JSON.stringify({ label: 'usine', min_dist: '', max_dist: '', objects: [] });
        expect(component['customFilter'](ruin, other_label)).toBe(false);
    });

    describe('with an active town', (): void => {
        beforeEach((): void => {
            setTown(Object.assign(new TownDetails(), { town_id: 1, town_type: 'RNE' }));
        });

        it('switches the table between game ruins and the town ruins on toggle', fakeAsync((): void => {
            createComponent();
            fixture.detectChanges();

            const game_ruin: Ruin = makeRuin(1, 'Cimetière');
            const town_ruin: Ruin = makeRuin(2, 'Usine de la ville');
            ruins_subject.next([game_ruin]);
            fixture.detectChanges();
            tick();
            town_ruins_subject.next([town_ruin]);
            fixture.detectChanges();

            expect(component['datasource']().data).toEqual([game_ruin]);

            component['ruins_filters'].inside_town = true;
            component['applyInsideTownFilter']();

            expect(component['datasource']().data).toEqual([town_ruin]);
        }));

        it('renders the "Dans ma ville" toggle only when a town is active', (): void => {
            createComponent();
            fixture.detectChanges();

            expect(fixture.debugElement.query(By.css('mat-slide-toggle'))).not.toBeNull();
        });
    });
});
