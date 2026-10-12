import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';

import { BURIED_RUIN_ID } from '../../../../_abstract_model/const';
import {
    CampImprovementDTO,
    CampImprovementUpdateDTO,
    CampingGroupParametersDTO,
    CampingGroupResultDTO
} from '../../../../_abstract_model/dto/camping-group.dto';
import { JobEnum } from '../../../../_abstract_model/enum/job.enum';
import { CampingService } from '../../../../_abstract_model/services/camping.service';
import { TownService } from '../../../../_abstract_model/services/town.service';
import { CampingGroupResult } from '../../../../_abstract_model/types/camping-group-result.class';
import { Cell } from '../../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { HeroSkillLevels } from '../../../../_abstract_model/types/hero-skill-levels';
import { Ruin } from '../../../../_abstract_model/types/ruin.class';
import { Camper, CampersStore } from './campers.store';
import { CAMPING_CALCULATION_DELAY, MapCellCampingComponent } from './map-cell-camping.component';

/** Ce que le composant lit de l'événement de dépôt du CDK. */
type DropIndexes = Pick<CdkDragDrop<readonly Camper[]>, 'previousIndex' | 'currentIndex'>;

function newCell(overrides: Partial<Cell> = {}): Cell {
    const cell: Cell = new Cell();
    cell.x = 4;
    cell.y = 6;
    cell.is_town = false;
    cell.nb_km = 7;
    cell.nb_zombie = 2;
    cell.camp_improvement_level = 23;
    cell.camp_improvement_day = 5;
    Object.assign(cell, overrides);
    return cell;
}

function citizen(id: number, name: string, job?: JobEnum, is_dead: boolean = false): Citizen {
    const result: Citizen = new Citizen();
    result.id = id;
    result.name = name;
    result.job = job;
    result.is_dead = is_dead;
    return result;
}

function ruin(id: number, camping: number, capacity?: number): Ruin {
    return Object.assign(new Ruin(), { id, camping, capacity, label: { fr: 'r' } });
}

function groupResult(overrides: Partial<CampingGroupResultDTO> = {}): CampingGroupResult {
    return new CampingGroupResult({
        odds: [
            { probability: 95, boundedProbability: 90, label: { fr: 'bien' } },
            { probability: 40, boundedProbability: 40, label: { fr: 'mal' } }
        ],
        expectedSurvivors: 1.3,
        bestOrder: [0, 1],
        bestExpectedSurvivors: 1.3,
        ...overrides
    });
}

describe('MapCellCampingComponent', (): void => {
    let fixture: ComponentFixture<MapCellCampingComponent>;
    let store: CampersStore;
    let calculate_group: Mock<(parameters: CampingGroupParametersDTO) => Observable<CampingGroupResult>>;
    let save_camp_improvement: Mock<(update: CampImprovementUpdateDTO) => Observable<CampImprovementDTO>>;
    let update_camping_count: Mock<(citizen_id: number, camping_count: number) => Observable<void>>;
    let update_hero_skills: Mock<(citizen_id: number, levels: HeroSkillLevels) => Observable<void>>;

    beforeEach(async (): Promise<void> => {
        vi.useFakeTimers();
        calculate_group = vi.fn((): Observable<CampingGroupResult> => of(groupResult()));
        save_camp_improvement = vi.fn((): Observable<CampImprovementDTO> => of({ level: 28, day: 6 }));
        update_camping_count = vi.fn((): Observable<void> => of(undefined));
        update_hero_skills = vi.fn((): Observable<void> => of(undefined));
        await TestBed.configureTestingModule({
            imports: [MapCellCampingComponent],
            providers: [
                { provide: CampingService, useValue: { calculateGroup: calculate_group } },
                {
                    provide: TownService,
                    useValue: { saveCampImprovement: save_camp_improvement, updateCampingCount: update_camping_count, updateHeroSkills: update_hero_skills }
                }
            ]
        }).compileComponents();
        store = TestBed.inject(CampersStore);
        fixture = TestBed.createComponent(MapCellCampingComponent);
    });

    afterEach((): void => {
        vi.useRealTimers();
    });

    function render(cell: Cell = newCell(), can_update: boolean = true, ruins: Ruin[] = [], citizens: Citizen[] = []): void {
        fixture.componentRef.setInput('cell', cell);
        fixture.componentRef.setInput('allRuins', ruins);
        fixture.componentRef.setInput('allCitizens', citizens);
        fixture.componentRef.setInput('canUpdate', can_update);
        fixture.detectChanges();
    }

    function element(selector: string): HTMLElement {
        const found: HTMLElement | null = fixture.nativeElement.querySelector(selector);
        if (!found) throw new Error(`element not found: ${selector}`);
        return found;
    }

    function elements(selector: string): HTMLElement[] {
        return Array.from(fixture.nativeElement.querySelectorAll(selector));
    }

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(CAMPING_CALCULATION_DELAY);
        fixture.detectChanges();
    }

    function expand(): void {
        element('.camping-toggle').click();
        fixture.detectChanges();
    }

    it('stays folded by default and calculates nothing', async (): Promise<void> => {
        store.addProfile();
        render();
        await settle();

        expect(fixture.nativeElement.querySelector('.camping-body')).toBeNull();
        expect(calculate_group).not.toHaveBeenCalled();

        expand();
        expect(element('.camping-body')).toBeTruthy();
    });

    it('sends the zone and the campers in hiding order, then shows each chance', async (): Promise<void> => {
        render(newCell({ ruin_id: 12 }), true, [ruin(12, 10, 2)]);
        expand();
        store.addCitizen(citizen(7, 'Bob', JobEnum.SCOUT));
        store.update(store.campers()[0].key, { vest: true, campings: 1 });
        store.addProfile();
        await settle();

        expect(calculate_group).toHaveBeenCalledTimes(1);
        const request: CampingGroupParametersDTO = calculate_group.mock.calls[0][0];
        expect(request).toMatchObject({
            distance: 7, zombies: 2, night: true, phare: false, improvementLevel: 23,
            ruinBonus: 10, ruinCapacity: 2, ruinBuryCount: 0, hiddenCampers: 0
        });
        expect(request.campers).toEqual([
            { job: 'scout', campings: 1, proCamper: false, objects: 0, vest: true, tomb: false, r4: false, recluseLevel: null },
            { job: 'citizen', campings: 0, proCamper: false, objects: 0, vest: false, tomb: false, r4: false, recluseLevel: null }
        ]);
        // Espace insécable avant « % »
        expect(elements('.camper .chance').map((chance: HTMLElement): string => (chance.textContent ?? '').replace(/\s+/g, ' ').trim())).toEqual(['90 %', '40 %']);
        expect(element('.camper .chance').classList).toContain('good');
        expect(element('.summary .expected').textContent).toMatch(/1[.,]3/);
        expect(element('.summary .optimal')).toBeTruthy();
    });

    it('groups a burst of settings into one calculation, and ignores a stale result', async (): Promise<void> => {
        render();
        expand();
        store.addProfile();
        fixture.detectChanges();
        store.update(store.campers()[0].key, { campings: 1 });
        fixture.detectChanges();
        store.update(store.campers()[0].key, { campings: 2 });
        await settle();

        expect(calculate_group).toHaveBeenCalledTimes(1);
        expect(calculate_group.mock.calls[0][0].campers[0].campings).toBe(2);

        // Réglage changé : le résultat précédent ne s'affiche plus en attendant le nouveau
        store.update(store.campers()[0].key, { campings: 3 });
        fixture.detectChanges();
        expect(element('.summary.pending')).toBeTruthy();
    });

    it('desert and buried building: no bonus, piles counted', async (): Promise<void> => {
        render(newCell({ ruin_id: BURIED_RUIN_ID, nb_ruin_dig: 7 }));
        expand();
        store.addProfile();
        await settle();
        expect(calculate_group.mock.calls[0][0]).toMatchObject({ ruinBonus: null, ruinBuryCount: 7 });

        fixture.componentRef.setInput('cell', newCell({ ruin_id: undefined }));
        await settle();
        expect(calculate_group.mock.calls[1][0]).toMatchObject({ ruinBonus: null, ruinCapacity: -1, ruinBuryCount: 0 });
    });

    it('suggests a better order and applies it', async (): Promise<void> => {
        calculate_group.mockReturnValue(of(groupResult({ bestOrder: [1, 0], bestExpectedSurvivors: 1.5 })));
        render();
        expand();
        store.addCitizen(citizen(1, 'Ann'));
        store.addCitizen(citizen(2, 'Ben'));
        await settle();

        expect(element('.suggestion').textContent).toContain('Ben');
        element('.apply-order').click();

        expect(store.campers().map((camper: Camper): string => camper.name)).toEqual(['Ben', 'Ann']);
    });

    it('moves campers with the arrows', async (): Promise<void> => {
        render();
        expand();
        store.addCitizen(citizen(1, 'Ann'));
        store.addCitizen(citizen(2, 'Ben'));
        await settle();

        expect((<HTMLButtonElement>element('.camper .move-up')).disabled).toBe(true);
        element('.camper .move-down').click();

        expect(store.campers().map((camper: Camper): string => camper.name)).toEqual(['Ben', 'Ann']);
    });

    it('moves campers by drag and drop', (): void => {
        render();
        expand();
        store.addCitizen(citizen(1, 'Ann'));
        store.addCitizen(citizen(2, 'Ben'));
        store.addCitizen(citizen(3, 'Cid'));
        fixture.detectChanges();
        const component: { drop: (event: DropIndexes) => void } = <{ drop: (event: DropIndexes) => void }><unknown>fixture.componentInstance;

        component.drop({ previousIndex: 2, currentIndex: 0 });

        expect(store.campers().map((camper: Camper): string => camper.name)).toEqual(['Cid', 'Ann', 'Ben']);
    });

    it('a town citizen\'s campings and Repos level are saved for the citizen list too', async (): Promise<void> => {
        const bob: Citizen = citizen(7, 'Bob');
        render(newCell(), true, [], [bob]);
        expand();
        store.addCitizen(bob);
        store.addProfile();
        await settle();
        const component: { updateCamper: (camper: Camper, changes: object) => void; updateRecluseLevel: (camper: Camper, value: number) => void } =
            <{ updateCamper: (camper: Camper, changes: object) => void; updateRecluseLevel: (camper: Camper, value: number) => void }><unknown>fixture.componentInstance;

        component.updateCamper(store.campers()[0], { campings: 4 });
        component.updateRecluseLevel(store.campers()[0], 2);
        component.updateCamper(store.campers()[1], { campings: 1 });

        expect(update_camping_count).toHaveBeenCalledTimes(1);
        expect(update_camping_count).toHaveBeenCalledWith(7, 4);
        expect(update_hero_skills).toHaveBeenCalledWith(7, { s: null, u: null, p: null, e: null, r: 2 });
        expect(bob.camping_count).toBe(4);
        expect(bob.hero_skills.r).toBe(2);
    });

    it('a known Repos level replaces the Campeur pro and R4 boxes', async (): Promise<void> => {
        render();
        expand();
        store.addProfile();
        await settle();
        expect(fixture.nativeElement.querySelector('.camper .pro-camper')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('.camper .r4')).not.toBeNull();

        store.update(store.campers()[0].key, { recluse_level: 1 });
        await settle();

        expect(fixture.nativeElement.querySelector('.camper .pro-camper')).toBeNull();
        expect(fixture.nativeElement.querySelector('.camper .r4')).toBeNull();
        expect(calculate_group.mock.calls.at(-1)?.[0].campers[0].recluseLevel).toBe(1);
    });

    it('read-only town: nothing saved for a citizen', async (): Promise<void> => {
        const bob: Citizen = citizen(7, 'Bob');
        render(newCell(), false, [], [bob]);
        expand();
        store.addCitizen(bob);
        await settle();
        const component: { updateCamper: (camper: Camper, changes: object) => void } = <{ updateCamper: (camper: Camper, changes: object) => void }><unknown>fixture.componentInstance;

        component.updateCamper(store.campers()[0], { campings: 4 });

        expect(update_camping_count).not.toHaveBeenCalled();
        expect(store.campers()[0].campings).toBe(4);
    });

    it('offers only the living citizens not yet in the group', (): void => {
        render(newCell(), true, [], [citizen(1, 'Zoe'), citizen(2, 'Ann'), citizen(3, 'Dead', undefined, true)]);
        store.addCitizen(citizen(1, 'Zoe'));
        const component: { available_citizens: () => Citizen[] } = <{ available_citizens: () => Citizen[] }><unknown>fixture.componentInstance;

        expect(component.available_citizens().map((available: Citizen): string => available.name)).toEqual(['Ann']);
    });

    it('records improvements and defense objects of the day', (): void => {
        const cell: Cell = newCell();
        render(cell);
        expand();

        expect(element('.improvement-level').textContent?.trim()).toBe('23');
        element('.add-defense-object').click();
        fixture.detectChanges();

        expect(save_camp_improvement).toHaveBeenCalledWith({ x: 4, y: 6, improvements: 0, defenseObjects: 1, level: null });
        expect(element('.improvement-level').textContent?.trim()).toBe('28');
        expect(cell.camp_improvement_level).toBe(28);
        expect(cell.camp_improvement_day).toBe(6);
    });

    it('corrects the level to the one seen in game', (): void => {
        render();
        expand();
        element('.level-edit').click();
        fixture.detectChanges();

        (<HTMLInputElement>element('.level-input')).value = '12';
        element('.level-save').click();
        fixture.detectChanges();

        expect(save_camp_improvement).toHaveBeenCalledWith({ x: 4, y: 6, improvements: 0, defenseObjects: 0, level: 12 });
        expect(fixture.nativeElement.querySelector('.level-input')).toBeNull();
    });

    it('keeps the level after a failed save', (): void => {
        save_camp_improvement.mockReturnValue(throwError((): Error => new Error('ko')));
        render();
        expand();

        element('.add-improvement').click();
        fixture.detectChanges();

        expect(element('.improvement-level').textContent?.trim()).toBe('23');
        expect((<HTMLButtonElement>element('.add-improvement')).disabled).toBe(false);
    });

    it('read-only town: the level is shown, not editable', (): void => {
        render(newCell(), false);
        expand();

        expect(element('.improvement-level').textContent?.trim()).toBe('23');
        expect(fixture.nativeElement.querySelector('.improvement-actions')).toBeNull();
        expect(fixture.nativeElement.querySelector('.level-edit')).toBeNull();
    });
});
