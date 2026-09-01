import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ApiService } from '../../_abstract_model/services/api.service';
import { CampingService } from '../../_abstract_model/services/camping.service';
import { CampingBonus } from '../../_abstract_model/types/camping-bonus.class';
import { CampingOdds } from '../../_abstract_model/types/camping-odds.class';
import { Ruin } from '../../_abstract_model/types/ruin.class';
import { ClipboardService } from '../../_core/services/clipboard.service';
import { CampingComponent } from './camping.component';

interface TestableComponent {
    ruins: { (): Ruin[] };
    town_ruins: { (): Ruin[] };
    bonus: { (): CampingBonus | undefined; set(value: CampingBonus | undefined): void };
    configuration_form: { (): UntypedFormGroup | undefined; set(value: UntypedFormGroup | undefined): void };
    camping_result: { (): CampingOdds | undefined };
    and_amelio: boolean;
    display_bonus_ap: boolean;
    calculateCrowdChance(value: number): number;
    calculateDistanceChance(value: number): number;
    calculateNbCampingsChance(value: number, pro_camper: boolean, pande: boolean): number;
    changeBonusMode(display_bonus_ap: boolean): void;
    changeInTownMode(): void;
    calculateCamping(): void;
    shareCamping(): void;
}

describe('CampingComponent', (): void => {
    let component: CampingComponent;
    let fixture: ComponentFixture<CampingComponent>;
    let testable: TestableComponent;
    let apiService: ApiService;
    let campingService: CampingService;
    let fb: UntypedFormBuilder;

    function makeBonus(): CampingBonus {
        return Object.assign(new CampingBonus(), {
            tomb: 5, pande: 10, improve: 2, object_improve: 3, lighthouse: 4, camp_items: 1,
            zombie_vest: 6, zombie_no_vest: 8, night: 1, devastated: 1,
            dist_chances: [10, 20, 30], crowd_chances: [5, 10, 15],
            panda_pro_camper_by_already_camped: [1, 2], panda_no_pro_camper_by_already_camped: [1, 2],
            normal_pro_camper_by_already_camped: [3, 4], normal_no_pro_camper_by_already_camped: [3, 4],
            desert_bonus: 0
        });
    }

    function makeRuin(id: number): Ruin {
        return Object.assign(new Ruin(), {
            id, camping: 10,
            label: { fr: 'r', en: 'r', es: 'r', de: 'r' },
            description: {}, capacity: 5
        });
    }

    function buildFormGroup(): UntypedFormGroup {
        return fb.group({
            town: [{ value: { id: 'RNE', label: '', bonus: 0 }, disabled: false }],
            job: [{ value: { value: { id: 'citizen' } }, disabled: false }],
            distance: [{ value: 1, disabled: false }],
            campings: [{ value: 0, disabled: false }],
            pro: [{ value: false, disabled: false }],
            hidden_campers: [{ value: 0, disabled: false }],
            objects: [{ value: 0, disabled: false }],
            vest: [{ value: false, disabled: false }],
            tomb: [{ value: false, disabled: false }],
            r4: [{ value: false, disabled: false }],
            zombies: [{ value: 0, disabled: false }],
            night: [{ value: false, disabled: false }],
            devastated: [{ value: false, disabled: false }],
            phare: [{ value: false, disabled: false }],
            improve: [{ value: 0, disabled: false }],
            object_improve: [{ value: 0, disabled: false }],
            complete_improve: [{ value: 10, disabled: false }],
            ruin: [{ value: makeRuin(1), disabled: false }],
            bury_count: [{ value: 0, disabled: false }],
        });
    }

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [CampingComponent],
            providers: [
                provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
                { provide: ActivatedRoute, useValue: { queryParams: of({}) } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CampingComponent);
        component = fixture.componentInstance;
        testable = component as unknown as TestableComponent;
        apiService = TestBed.inject(ApiService);
        campingService = TestBed.inject(CampingService);
        fb = TestBed.inject(UntypedFormBuilder);
    });

    describe('ngOnInit', (): void => {
        it('resolves the async chain (ruins, bonus, form, camping result) and builds the form', (): void => {
            spyOn(apiService, 'getRuins').and.returnValue(of([makeRuin(2), makeRuin(3)]));
            spyOn(campingService, 'getBonus').and.returnValue(of(makeBonus()));
            spyOn(campingService, 'calculateCamping').and.returnValue(of(Object.assign(new CampingOdds(), { probability: 42, bounded_probability: 42, label: { fr: 'x' } })));

            fixture.detectChanges();

            expect(testable.ruins().length).toBeGreaterThan(0);
            expect(testable.bonus()).toBeDefined();
            expect(testable.configuration_form()).toBeDefined();
            expect(testable.camping_result()?.probability).toBe(42);
        });
    });

    describe('calculateCrowdChance / calculateDistanceChance / calculateNbCampingsChance', (): void => {
        beforeEach((): void => {
            testable.bonus.set(makeBonus());
        });

        it('reads the crowd chance at the given index, capped at the array length', (): void => {
            expect(testable.calculateCrowdChance(1)).toBe(10);
            expect(testable.calculateCrowdChance(99)).toBe(15);
        });

        it('reads the distance chance at the given index, capped at the array length', (): void => {
            expect(testable.calculateDistanceChance(0)).toBe(10);
        });

        it('picks the right table among pande/normal x pro/no-pro', (): void => {
            expect(testable.calculateNbCampingsChance(0, true, true)).toBe(1);
            expect(testable.calculateNbCampingsChance(0, false, false)).toBe(3);
        });
    });

    describe('changeBonusMode', (): void => {
        beforeEach((): void => {
            testable.configuration_form.set(buildFormGroup());
        });

        it('divides complete_improve by 5 when switching to AP-equivalent display', (): void => {
            testable.changeBonusMode(true);

            expect(testable.configuration_form()?.get('complete_improve')?.value).toBe(2);
        });

        it('multiplies complete_improve by 5 when switching back to percentage display', (): void => {
            testable.changeBonusMode(false);

            expect(testable.configuration_form()?.get('complete_improve')?.value).toBe(50);
        });
    });

    describe('calculateCamping', (): void => {
        it('computes camping_result from the current form values', (): void => {
            testable.bonus.set(makeBonus());
            testable.configuration_form.set(buildFormGroup());
            spyOn(campingService, 'calculateCamping').and.returnValue(
                of(Object.assign(new CampingOdds(), { probability: 77, bounded_probability: 77, label: { fr: 'y' } }))
            );

            testable.calculateCamping();

            expect(testable.camping_result()?.probability).toBe(77);
        });
    });

    describe('changeInTownMode', (): void => {
        it('locks the town type and devastated controls to the town values when entering "in town" mode', (): void => {
            testable.configuration_form.set(buildFormGroup());
            (component as unknown as { town: unknown; in_town_camping: boolean }).town = { town_type: 'PANDE', is_devaste: true };
            (component as unknown as { in_town_camping: boolean }).in_town_camping = true;

            testable.changeInTownMode();

            expect(testable.configuration_form()?.get('town')?.disabled).toBe(true);
            expect(testable.configuration_form()?.get('devastated')?.disabled).toBe(true);
            expect(testable.configuration_form()?.get('devastated')?.value).toBe(true);
        });
    });

    describe('shareCamping', (): void => {
        it('copies a link containing the current form as query params', (): void => {
            testable.configuration_form.set(buildFormGroup());
            const clipboard: ClipboardService = TestBed.inject(ClipboardService);
            const copySpy: jasmine.Spy = spyOn(clipboard, 'copy');

            testable.shareCamping();

            expect(copySpy).toHaveBeenCalled();
            expect(copySpy.calls.mostRecent().args[0]).toContain('?');
        });
    });
});
