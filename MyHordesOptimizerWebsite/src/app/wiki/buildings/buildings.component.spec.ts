import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatCheckbox } from '@angular/material/checkbox';
import { By } from '@angular/platform-browser';
import moment from 'moment';
import { of, Subject } from 'rxjs';

import { ApiService } from '../../_abstract_model/services/api.service';
import { Building, BuildingResource } from '../../_abstract_model/types/building.class';
import { BuildingsComponent } from './buildings.component';

describe('BuildingsComponent', (): void => {
    let fixture: ComponentFixture<BuildingsComponent>;
    let component: BuildingsComponent;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [BuildingsComponent],
            providers: [{ provide: ApiService, useValue: { getBuildings: (): unknown => of([]) } }]
        }).compileComponents();

        fixture = TestBed.createComponent(BuildingsComponent);
        component = fixture.componentInstance;
    });

    it('resolves the tier0 (Hard) cost when hard_mode is on', (): void => {
        component['hard_mode'] = true;
        const building: Building = new Building();
        building.has_hard_mode = true;
        building.tier0_ap = 25;
        building.tier1_ap = 20;
        building.tier2_ap = 13;

        expect(component['costFor'](building, 0).ap).toBe(25);
    });

    it('resolves availability against PANDE when hard_mode is on, regardless of the active town', (): void => {
        component['hard_mode'] = true;
        const building: Building = new Building();
        building.availability = { PANDE: 'Disabled', RNE: 'Initial' };

        expect(component['availabilityStatus'](building)).toBe('Disabled');
    });

    it('returns null availability when hard_mode is off and no town is active', (): void => {
        component['hard_mode'] = false;
        component['town'] = null;
        const building: Building = new Building();
        building.availability = { RNE: 'Disabled' };

        expect(component['availabilityStatus'](building)).toBeNull();
    });

    it('defaults plansLusFor to 0 for a building never touched', (): void => {
        const building: Building = new Building();
        building.id = 42;

        expect(component['plansLusFor'](building)).toBe(0);
    });

    it('remembers the tier selected via setPlansLus, per building', (): void => {
        const building_a: Building = new Building();
        building_a.id = 1;
        const building_b: Building = new Building();
        building_b.id = 2;

        component['setPlansLus'](building_a, 2);

        expect(component['plansLusFor'](building_a)).toBe(2);
        expect(component['plansLusFor'](building_b)).toBe(0);
    });

    it('costFor combined with plansLusFor resolves the tier the stepper last selected', (): void => {
        component['hard_mode'] = true;
        const building: Building = new Building();
        building.id = 1;
        building.has_hard_mode = true;
        building.tier0_ap = 25;
        building.tier1_ap = 20;
        building.tier2_ap = 13;

        component['setPlansLus'](building, 2);

        expect(component['costFor'](building, component['plansLusFor'](building)).ap).toBe(13);
    });

    it('stepperIcon uses hardBlueprintLevel\'s icon when the building is named-overridden', (): void => {
        const building: Building = new Building();
        building.rarity = 0;
        building.hard_blueprint_level = 2;

        expect(component['stepperIcon'](building)).toBe('item/item_bplan_u.gif');
    });

    it('stepperIcon falls back to the base rarity\'s icon when there is no named override', (): void => {
        const building: Building = new Building();
        building.rarity = 3;
        building.hard_blueprint_level = null;

        expect(component['stepperIcon'](building)).toBe('item/item_bplan_r.gif');
    });

    it('stepperIcon returns no icon for rarity 0 (constructible sans plan), even with no named override', (): void => {
        const building: Building = new Building();
        building.rarity = 0;
        building.hard_blueprint_level = null;

        expect(component['stepperIcon'](building)).toBe('');
    });

    it('stepperIcon falls back to the generic plan icon only when the level is genuinely unknown', (): void => {
        const building: Building = new Building();
        building.rarity = 99;
        building.hard_blueprint_level = null;

        expect(component['stepperIcon'](building)).toBe('item/item_bplan_c.gif');
    });

    it('usefulPlanReadings is 0 outside hard mode support', (): void => {
        const building: Building = new Building();
        building.has_hard_mode = false;

        expect(component['usefulPlanReadings'](building)).toBe(0);
    });

    it('usefulPlanReadings is 0 when tier0 and tier1 are strictly identical (muraille standard)', (): void => {
        const building: Building = new Building();
        building.has_hard_mode = true;
        building.tier0_ap = 25;
        building.tier1_ap = 25;
        building.tier2_ap = 25;
        const resource: BuildingResource = new BuildingResource();
        resource.item_id = 1;
        resource.count = 5;
        building.tier0_resources = [resource];
        building.tier1_resources = [resource];

        expect(component['usefulPlanReadings'](building)).toBe(0);
    });

    it('usefulPlanReadings is 1 when only the first reading changes the resources (portail)', (): void => {
        const building: Building = new Building();
        building.has_hard_mode = true;
        building.tier0_ap = 15;
        building.tier1_ap = 15;
        building.tier2_ap = 15;
        const metal: BuildingResource = new BuildingResource();
        metal.item_id = 1;
        metal.count = 2;
        const plate: BuildingResource = new BuildingResource();
        plate.item_id = 2;
        plate.count = 1;
        building.tier0_resources = [metal, plate];
        building.tier1_resources = [metal];

        expect(component['usefulPlanReadings'](building)).toBe(1);
    });

    it('usefulPlanReadings is 2 when the second reading further reduces the AP (muraille évolutive)', (): void => {
        const building: Building = new Building();
        building.has_hard_mode = true;
        building.tier0_ap = 40;
        building.tier1_ap = 40;
        building.tier2_ap = 28;
        const hard: BuildingResource = new BuildingResource();
        hard.item_id = 1;
        hard.count = 6;
        const easy: BuildingResource = new BuildingResource();
        easy.item_id = 1;
        easy.count = 1;
        building.tier0_resources = [hard];
        building.tier1_resources = [easy];

        expect(component['usefulPlanReadings'](building)).toBe(2);
    });

    it('hasReachablePlanLevel is false for a rarity-0 building with no named override (Portail)', (): void => {
        const building: Building = new Building();
        building.rarity = 0;
        building.hard_blueprint_level = null;

        expect(component['hasReachablePlanLevel'](building)).toBe(false);
    });

    it('hasReachablePlanLevel is true for a rarity-0 building with a named override', (): void => {
        const building: Building = new Building();
        building.rarity = 0;
        building.hard_blueprint_level = 1;

        expect(component['hasReachablePlanLevel'](building)).toBe(true);
    });

    it('hasReachablePlanLevel is true for a building whose base rarity is already non-zero', (): void => {
        const building: Building = new Building();
        building.rarity = 3;
        building.hard_blueprint_level = null;

        expect(component['hasReachablePlanLevel'](building)).toBe(true);
    });

    it('showsBreakableFlag is false outside Pandémonium for an ordinary breakable building', (): void => {
        component['hard_mode'] = false;
        const building: Building = new Building();
        building.uid = 'small_watchtower_#00';
        building.breakable = true;

        expect(component['showsBreakableFlag'](building)).toBe(false);
    });

    it('showsBreakableFlag is true in Pandémonium for an ordinary breakable building', (): void => {
        component['hard_mode'] = true;
        const building: Building = new Building();
        building.uid = 'small_watchtower_#00';
        building.breakable = true;

        expect(component['showsBreakableFlag'](building)).toBe(true);
    });

    it('showsBreakableFlag is true outside Pandémonium for the reactor and the fireworks', (): void => {
        component['hard_mode'] = false;
        const reactor: Building = new Building();
        reactor.uid = 'small_arma_#00';
        reactor.breakable = true;
        const fireworks: Building = new Building();
        fireworks.uid = 'small_fireworks_#00';
        fireworks.breakable = true;

        expect(component['showsBreakableFlag'](reactor)).toBe(true);
        expect(component['showsBreakableFlag'](fireworks)).toBe(true);
    });

    it('showsBreakableFlag is false when an ordinary building is not breakable (impervious)', (): void => {
        component['hard_mode'] = true;
        const building: Building = new Building();
        building.uid = 'small_watchtower_#00';
        building.breakable = false;

        expect(component['showsBreakableFlag'](building)).toBe(false);
    });

    it('showsBreakableFlag stays true for the reactor even though the game marks it impervious (breakable=false)', (): void => {
        // Constaté le 2026-08-06 : AdminTownBuildingsController force explicitement impervious=false
        // pour small_arma_#00 sur l'endpoint de triche HP, preuve que son impervious réel est true.
        // Sa destructibilité vient d'une mécanique dédiée (dégâts à l'amélioration), indépendante du
        // flag "breakable" (= !impervious) que l'API expose pour la mécanique générale d'attaque.
        component['hard_mode'] = false;
        const building: Building = new Building();
        building.uid = 'small_arma_#00';
        building.breakable = false;

        expect(component['showsBreakableFlag'](building)).toBe(true);
    });

    it('showsBreakableFlag is false in Pandémonium for a temporary ordinary building', (): void => {
        component['hard_mode'] = true;
        const building: Building = new Building();
        building.uid = 'small_watchtower_#00';
        building.breakable = true;
        building.temporary = true;

        expect(component['showsBreakableFlag'](building)).toBe(false);
    });

    it('showsBreakableFlag stays true for the reactor and the fireworks even if marked temporary', (): void => {
        component['hard_mode'] = false;
        const reactor: Building = new Building();
        reactor.uid = 'small_arma_#00';
        reactor.breakable = true;
        reactor.temporary = true;

        expect(component['showsBreakableFlag'](reactor)).toBe(true);
    });

    it('hides a building disabled in the current mode from the table rows entirely', (): void => {
        component['hard_mode'] = true;
        const visible: Building = new Building();
        visible.id = 1;
        const hidden: Building = new Building();
        hidden.id = 2;
        hidden.availability = { PANDE: 'Disabled' };

        component['roots'] = [visible, hidden];
        component['refresh']();

        expect(component['rows']()).toEqual([visible]);
    });

    it('isSelected is false for a building never toggled', (): void => {
        const building: Building = new Building();
        building.id = 1;

        expect(component['isSelected'](building)).toBe(false);
    });

    it('toggleSelected selects then deselects a leaf building with no relatives', (): void => {
        const building: Building = new Building();
        building.id = 1;
        building.parent_id = null;
        building.children = [];
        component['by_id'] = new Map([[1, building]]);

        component['toggleSelected'](building);
        expect(component['isSelected'](building)).toBe(true);

        component['toggleSelected'](building);
        expect(component['isSelected'](building)).toBe(false);
    });

    it('selecting a building also selects its ancestors up to the root', (): void => {
        const root: Building = new Building();
        root.id = 1;
        root.parent_id = null;
        const middle: Building = new Building();
        middle.id = 2;
        middle.parent_id = 1;
        const leaf: Building = new Building();
        leaf.id = 3;
        leaf.parent_id = 2;
        root.children = [middle];
        middle.children = [leaf];
        leaf.children = [];
        component['by_id'] = new Map([[1, root], [2, middle], [3, leaf]]);

        component['toggleSelected'](leaf);

        expect(component['isSelected'](leaf)).toBe(true);
        expect(component['isSelected'](middle)).toBe(true);
        expect(component['isSelected'](root)).toBe(true);
    });

    it('selecting a building does not select its descendants', (): void => {
        const root: Building = new Building();
        root.id = 1;
        root.parent_id = null;
        const child: Building = new Building();
        child.id = 2;
        child.parent_id = 1;
        child.children = [];
        root.children = [child];
        component['by_id'] = new Map([[1, root], [2, child]]);

        component['toggleSelected'](root);

        expect(component['isSelected'](root)).toBe(true);
        expect(component['isSelected'](child)).toBe(false);
    });

    it('deselecting a building also deselects its descendants', (): void => {
        const root: Building = new Building();
        root.id = 1;
        root.parent_id = null;
        const child: Building = new Building();
        child.id = 2;
        child.parent_id = 1;
        child.children = [];
        root.children = [child];
        component['by_id'] = new Map([[1, root], [2, child]]);

        component['toggleSelected'](child);
        expect(component['isSelected'](root)).toBe(true);
        expect(component['isSelected'](child)).toBe(true);

        component['toggleSelected'](root);

        expect(component['isSelected'](root)).toBe(false);
        expect(component['isSelected'](child)).toBe(false);
    });

    it('deselecting a leaf building does not affect its ancestors', (): void => {
        const root: Building = new Building();
        root.id = 1;
        root.parent_id = null;
        const child: Building = new Building();
        child.id = 2;
        child.parent_id = 1;
        child.children = [];
        root.children = [child];
        component['by_id'] = new Map([[1, root], [2, child]]);

        component['toggleSelected'](child);
        component['toggleSelected'](child);

        expect(component['isSelected'](child)).toBe(false);
        expect(component['isSelected'](root)).toBe(true);
    });

    it('hasSelection reflects whether anything is currently selected', (): void => {
        const building: Building = new Building();
        building.id = 1;
        building.parent_id = null;
        building.children = [];
        component['by_id'] = new Map([[1, building]]);

        expect(component['hasSelection']()).toBe(false);

        component['toggleSelected'](building);

        expect(component['hasSelection']()).toBe(true);
    });

    it('isAllSelected is false when nothing is selected', (): void => {
        const a: Building = new Building();
        a.id = 1;
        a.parent_id = null;
        a.children = [];
        component['by_id'] = new Map([[1, a]]);

        expect(component['isAllSelected']()).toBe(false);
    });

    it('isAllSelected is false with an empty referential (nothing to select)', (): void => {
        component['by_id'] = new Map();

        expect(component['isAllSelected']()).toBe(false);
    });

    it('isAllSelected is true once every available building is selected, collapsed ones included', (): void => {
        const a: Building = new Building();
        a.id = 1;
        a.parent_id = null;
        a.children = [];
        const b: Building = new Building();
        b.id = 2;
        b.parent_id = null;
        b.children = [];
        component['by_id'] = new Map([[1, a], [2, b]]);

        component['toggleSelected'](a);
        expect(component['isAllSelected']()).toBe(false);

        component['toggleSelected'](b);
        expect(component['isAllSelected']()).toBe(true);
    });

    it('isAllSelected ignores buildings disabled in the current mode', (): void => {
        component['hard_mode'] = true;
        const available: Building = new Building();
        available.id = 1;
        available.parent_id = null;
        available.children = [];
        const disabled: Building = new Building();
        disabled.id = 2;
        disabled.parent_id = null;
        disabled.children = [];
        disabled.availability = { PANDE: 'Disabled' };
        component['by_id'] = new Map([[1, available], [2, disabled]]);

        component['toggleSelected'](available);

        expect(component['isAllSelected']()).toBe(true);
    });

    it('isSomeSelected is true only strictly between none and all selected', (): void => {
        const a: Building = new Building();
        a.id = 1;
        a.parent_id = null;
        a.children = [];
        const b: Building = new Building();
        b.id = 2;
        b.parent_id = null;
        b.children = [];
        component['by_id'] = new Map([[1, a], [2, b]]);

        expect(component['isSomeSelected']()).toBe(false);

        component['toggleSelected'](a);
        expect(component['isSomeSelected']()).toBe(true);

        component['toggleSelected'](b);
        expect(component['isSomeSelected']()).toBe(false);
    });

    it('toggleSelectAll selects every available building, disabled-in-mode ones excluded, when not all are selected', (): void => {
        component['hard_mode'] = true;
        const available: Building = new Building();
        available.id = 1;
        available.parent_id = null;
        available.children = [];
        const disabled: Building = new Building();
        disabled.id = 2;
        disabled.parent_id = null;
        disabled.children = [];
        disabled.availability = { PANDE: 'Disabled' };
        component['by_id'] = new Map([[1, available], [2, disabled]]);

        component['toggleSelectAll']();

        expect(component['isSelected'](available)).toBe(true);
        expect(component['isSelected'](disabled)).toBe(false);
    });

    it('toggleSelectAll clears the selection when everything available is already selected', (): void => {
        const a: Building = new Building();
        a.id = 1;
        a.parent_id = null;
        a.children = [];
        const b: Building = new Building();
        b.id = 2;
        b.parent_id = null;
        b.children = [];
        component['by_id'] = new Map([[1, a], [2, b]]);
        component['toggleSelectAll']();
        expect(component['isAllSelected']()).toBe(true);

        component['toggleSelectAll']();

        expect(component['hasSelection']()).toBe(false);
    });

    it('pruneSelectionForAvailability removes selected buildings disabled in the current mode', (): void => {
        component['hard_mode'] = true;
        const kept: Building = new Building();
        kept.id = 1;
        kept.parent_id = null;
        kept.children = [];
        const removed: Building = new Building();
        removed.id = 2;
        removed.parent_id = null;
        removed.children = [];
        removed.availability = { PANDE: 'Disabled' };
        component['by_id'] = new Map([[1, kept], [2, removed]]);
        component['toggleSelected'](kept);
        component['toggleSelected'](removed);

        component['pruneSelectionForAvailability']();

        expect(component['isSelected'](kept)).toBe(true);
        expect(component['isSelected'](removed)).toBe(false);
    });

    it('selectedTotals aggregates AP and merges resources by item across selected buildings, each at its own chosen tier', (): void => {
        component['hard_mode'] = true;
        const a: Building = new Building();
        a.id = 1;
        a.parent_id = null;
        a.children = [];
        a.has_hard_mode = true;
        a.tier0_ap = 25;
        a.tier1_ap = 20;
        a.tier2_ap = 13;
        const metal: BuildingResource = new BuildingResource();
        metal.item_id = 1;
        metal.count = 5;
        const plate: BuildingResource = new BuildingResource();
        plate.item_id = 2;
        plate.count = 1;
        a.tier0_resources = [metal, plate];
        a.tier1_resources = [metal];

        const b: Building = new Building();
        b.id = 2;
        b.parent_id = null;
        b.children = [];
        b.pa = 10;
        const metal_b: BuildingResource = new BuildingResource();
        metal_b.item_id = 1;
        metal_b.count = 3;
        b.resources = [metal_b];

        component['by_id'] = new Map([[1, a], [2, b]]);
        component['toggleSelected'](a);
        component['toggleSelected'](b);
        component['setPlansLus'](a, 2);

        const totals: { count: number; ap: number; resources: BuildingResource[] } = component['selectedTotals']();

        expect(totals.count).toBe(2);
        expect(totals.ap).toBe(13 + 10);
        expect(totals.resources.find((r: BuildingResource): boolean => r.item_id === 1)?.count).toBe(8);
        expect(totals.resources.find((r: BuildingResource): boolean => r.item_id === 2)).toBeUndefined();
    });

    it('onModeChange switches the mode and prunes selected buildings disabled in the new mode', (): void => {
        const kept: Building = new Building();
        kept.id = 1;
        kept.parent_id = null;
        kept.children = [];
        const removed: Building = new Building();
        removed.id = 2;
        removed.parent_id = null;
        removed.children = [];
        removed.availability = { PANDE: 'Disabled' };
        component['by_id'] = new Map([[1, kept], [2, removed]]);
        component['roots'] = [kept, removed];
        component['toggleSelected'](kept);
        component['toggleSelected'](removed);

        component['onModeChange'](true);

        expect(component['hard_mode']).toBe(true);
        expect(component['isSelected'](kept)).toBe(true);
        expect(component['isSelected'](removed)).toBe(false);
    });
});

describe('BuildingsComponent - ngOnInit wiring', (): void => {
    let fixture: ComponentFixture<BuildingsComponent>;
    let component: BuildingsComponent;
    let buildings_subject: Subject<Building[]>;

    function makeBuilding(id: number, parent_id: number | null, label: string, display_order: number): Building {
        const building: Building = new Building();
        building.id = id;
        building.uid = `b${id}`;
        building.parent_id = parent_id;
        building.label = { [moment.locale()]: label };
        building.description = { [moment.locale()]: '' };
        building.img = 'building.gif';
        building.display_order = display_order;
        return building;
    }

    beforeEach(async (): Promise<void> => {
        buildings_subject = new Subject<Building[]>();
        await TestBed.configureTestingModule({
            imports: [BuildingsComponent],
            providers: [{ provide: ApiService, useValue: { getBuildings: (): unknown => buildings_subject.asObservable() } }]
        }).compileComponents();

        fixture = TestBed.createComponent(BuildingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('builds the tree from the flat API response and populates rows depth-first', (): void => {
        const root_a: Building = makeBuilding(1, null, 'Chantier A', 1);
        const child_a1: Building = makeBuilding(2, 1, 'Évolution A1', 1);
        const root_b: Building = makeBuilding(3, null, 'Chantier B', 2);
        buildings_subject.next([root_b, child_a1, root_a]);
        fixture.detectChanges();

        expect(component['rows']().map((b: Building): number => b.id)).toEqual([1, 2, 3]);
    });

    it('toggle collapses a branch out of rows, and expands it back', (): void => {
        const root_a: Building = makeBuilding(1, null, 'Chantier A', 1);
        const child_a1: Building = makeBuilding(2, 1, 'Évolution A1', 1);
        buildings_subject.next([root_a, child_a1]);
        fixture.detectChanges();
        expect(component['rows']().map((b: Building): number => b.id)).toEqual([1, 2]);

        component['toggle'](root_a);
        expect(component['rows']().map((b: Building): number => b.id)).toEqual([1]);

        component['toggle'](root_a);
        expect(component['rows']().map((b: Building): number => b.id)).toEqual([1, 2]);
    });

    it('debounces the label filter by 200ms before narrowing rows', fakeAsync((): void => {
        const root_a: Building = makeBuilding(1, null, 'Chantier A', 1);
        const root_b: Building = makeBuilding(2, null, 'Chantier B', 2);
        buildings_subject.next([root_a, root_b]);
        fixture.detectChanges();
        expect(component['rows']().length).toBe(2);

        component['filters'].label = 'chantier a';
        component['filters_change'].next();
        expect(component['rows']().length).toBe(2);

        tick(199);
        expect(component['rows']().length).toBe(2);

        tick(1);
        expect(component['rows']().map((b: Building): number => b.id)).toEqual([1]);
    }));

    it('re-renders the table rows once the API responds', (): void => {
        const root_a: Building = makeBuilding(1, null, 'Chantier A', 1);
        buildings_subject.next([root_a]);
        fixture.detectChanges();

        const rendered_rows: DebugElement[] = fixture.debugElement.queryAll(By.css('tr[mat-row]'));
        expect(rendered_rows.length).toBe(1);
        expect(fixture.debugElement.nativeElement.textContent).toContain('Chantier A');
    });

    it('shows a dash in Pandémonium for a hard-mode building whose plan level is never reachable in game (Portail)', (): void => {
        component['hard_mode'] = true;
        const root_a: Building = makeBuilding(1, null, 'Portail', 1);
        root_a.has_hard_mode = true;
        root_a.rarity = 0;
        root_a.hard_blueprint_level = null;
        root_a.tier0_ap = 15;
        root_a.tier1_ap = 15;
        root_a.tier2_ap = 15;
        const hard: BuildingResource = new BuildingResource();
        hard.item_id = 1;
        hard.count = 2;
        hard.label = { [moment.locale()]: 'Métal' };
        const plate: BuildingResource = new BuildingResource();
        plate.item_id = 2;
        plate.count = 1;
        plate.label = { [moment.locale()]: 'Plaque' };
        root_a.tier0_resources = [hard, plate];
        root_a.tier1_resources = [hard];
        buildings_subject.next([root_a]);
        fixture.detectChanges();

        const rarity_cell: DebugElement = fixture.debugElement.queryAll(By.css('td[mat-cell]'))[5];
        expect(rarity_cell.nativeElement.textContent.trim()).toBe('—');
        expect(rarity_cell.query(By.css('mho-compact-stepper'))).toBeNull();
    });

    it('shows a dash in Pandémonium for a building without a hard-mode plan mechanic, never the base-game blueprint icon', (): void => {
        component['hard_mode'] = true;
        const root_a: Building = makeBuilding(1, null, 'Chantier A', 1);
        root_a.has_hard_mode = false;
        root_a.rarity = 3;
        buildings_subject.next([root_a]);
        fixture.detectChanges();

        const rarity_cell: DebugElement = fixture.debugElement.queryAll(By.css('td[mat-cell]'))[5];
        expect(rarity_cell.nativeElement.textContent.trim()).toBe('—');
        expect(rarity_cell.query(By.css('img'))).toBeNull();
        expect(rarity_cell.query(By.css('mho-compact-stepper'))).toBeNull();
    });

    it('the selection summary is absent from the DOM until at least one chantier is selected', (): void => {
        const root_a: Building = makeBuilding(1, null, 'Chantier A', 1);
        buildings_subject.next([root_a]);
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('.selection-summary'))).toBeNull();

        const select_control: DebugElement = fixture.debugElement.query(By.css('td .select-control'));
        select_control.nativeElement.click();
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('.selection-summary'))).not.toBeNull();
    });

    it('the selection summary is not nested inside the table, so it never inherits a column width', (): void => {
        const root_a: Building = makeBuilding(1, null, 'Chantier A', 1);
        buildings_subject.next([root_a]);
        fixture.detectChanges();

        const select_control: DebugElement = fixture.debugElement.query(By.css('td .select-control'));
        select_control.nativeElement.click();
        fixture.detectChanges();

        const summary: DebugElement = fixture.debugElement.query(By.css('.selection-summary'));
        expect(summary.query(By.css('table'))).toBeNull();
        expect(summary.nativeElement.closest('table')).toBeNull();
    });

    it('the selection summary shows the count, total AP and merged resources for selected chantiers', (): void => {
        const root_a: Building = makeBuilding(1, null, 'Chantier A', 1);
        root_a.pa = 42;
        const metal: BuildingResource = new BuildingResource();
        metal.item_id = 1;
        metal.count = 7;
        metal.label = { [moment.locale()]: 'Métal' };
        metal.img = 'metal.gif';
        root_a.resources = [metal];
        buildings_subject.next([root_a]);
        fixture.detectChanges();

        const select_control: DebugElement = fixture.debugElement.query(By.css('td .select-control'));
        select_control.nativeElement.click();
        fixture.detectChanges();

        const summary: DebugElement = fixture.debugElement.query(By.css('.selection-summary'));
        expect(summary.nativeElement.textContent).toContain('1');
        expect(summary.nativeElement.textContent).toContain('42');
        expect(summary.nativeElement.textContent).toContain('7');
        expect(summary.query(By.css('.resources img'))?.nativeElement.getAttribute('src')).toContain('metal.gif');
    });

    it('unchecking the only selected chantier removes the selection summary again', (): void => {
        const root_a: Building = makeBuilding(1, null, 'Chantier A', 1);
        buildings_subject.next([root_a]);
        fixture.detectChanges();

        const select_control: DebugElement = fixture.debugElement.query(By.css('td .select-control'));
        select_control.nativeElement.click();
        fixture.detectChanges();
        select_control.nativeElement.click();
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('.selection-summary'))).toBeNull();
    });

    it('the header select-all checkbox selects every building, including ones collapsed out of view', (): void => {
        const root_a: Building = makeBuilding(1, null, 'Chantier A', 1);
        const child_a1: Building = makeBuilding(2, 1, 'Évolution A1', 1);
        buildings_subject.next([root_a, child_a1]);
        fixture.detectChanges();

        component['toggle'](root_a);
        fixture.detectChanges();
        expect(component['rows']().map((b: Building): number => b.id)).toEqual([1]);

        const header_select_control: DebugElement = fixture.debugElement.query(By.css('th .select-control'));
        header_select_control.nativeElement.click();
        fixture.detectChanges();

        expect(component['isSelected'](root_a)).toBe(true);
        expect(component['isSelected'](child_a1)).toBe(true);

        const header_checkbox: DebugElement = fixture.debugElement.query(By.css('th')).query(By.directive(MatCheckbox));
        expect((header_checkbox.componentInstance as MatCheckbox).checked).toBe(true);
    });

    it('the header select-all checkbox deselects everything when everything is already selected', (): void => {
        const root_a: Building = makeBuilding(1, null, 'Chantier A', 1);
        buildings_subject.next([root_a]);
        fixture.detectChanges();

        const header_select_control: DebugElement = fixture.debugElement.query(By.css('th .select-control'));
        header_select_control.nativeElement.click();
        fixture.detectChanges();
        expect(component['isSelected'](root_a)).toBe(true);

        header_select_control.nativeElement.click();
        fixture.detectChanges();

        expect(component['isSelected'](root_a)).toBe(false);
    });
});
