import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ApiService } from '../../_abstract_model/services/api.service';
import { Building } from '../../_abstract_model/types/building.class';
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

    it('stepperIcon falls back to the generic plan icon when neither yields an image', (): void => {
        const building: Building = new Building();
        building.rarity = 0;
        building.hard_blueprint_level = null;

        expect(component['stepperIcon'](building)).toBe('item/item_bplan_c.gif');
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

        expect(component['datasource'].data).toEqual([visible]);
    });
});
