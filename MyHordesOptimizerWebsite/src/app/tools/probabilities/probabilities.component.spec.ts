import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import type { MockInstance } from 'vitest';

import { SnackbarService } from '../../_core/services/snackbar.service';
import { encodeSnapshot, TOOL_SNAPSHOT_PARAM } from '../../_core/utilities/tool-snapshot.util';
import { ToolPresetsComponent } from '../../_shared/tool-presets/tool-presets.component';
import { ProbabilitiesComponent } from './probabilities.component';

interface Simulation {
    current_chances: number[];
    result_probabilities: number[];
    result_average?: number;
    result_most_likely?: number;
    result_peak?: number;
    title: string;
    editing_title: boolean;
    show_detail: boolean;
}

interface TestableComponent {
    simulations: {
        (): Simulation[];
        set(value: Simulation[]): void;
    };
    default_value: number;
    ngAfterViewInit(): void;
    createSimulation(): void;
    deleteSimulation(index: number): void;
    calculateProbabilities(simulation: Simulation): void;
    addPerson(simulation: Simulation): void;
    removePerson(simulation: Simulation, index: number): void;
    barHeight(probability: number, peak: number | undefined): number;
    toSnapshot(): Record<string, unknown>;
    applySnapshot(raw: Record<string, unknown>): boolean;
    loadSnapshot(raw: Record<string, unknown> | null): boolean;
}

describe('ProbabilitiesComponent', (): void => {
    let component: ProbabilitiesComponent;
    let fixture: ComponentFixture<ProbabilitiesComponent>;
    let testable: TestableComponent;

    function makeSimulation(current_chances: number[]): Simulation {
        return { current_chances, result_probabilities: [], title: 't', editing_title: false, show_detail: true };
    }

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [ProbabilitiesComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ProbabilitiesComponent);
        component = fixture.componentInstance;
        testable = component as unknown as TestableComponent;
    });

    describe('calculateProbabilities', (): void => {
        it('gives 100% chance of 0 deaths when the single watcher never dies', (): void => {
            const simulation: Simulation = makeSimulation([100]);

            testable.calculateProbabilities(simulation);

            expect(simulation.result_probabilities).toEqual([1, 0]);
            expect(simulation.result_average).toBe(0);
        });

        it('gives 100% chance of death when the single watcher always dies', (): void => {
            const simulation: Simulation = makeSimulation([0]);

            testable.calculateProbabilities(simulation);

            expect(simulation.result_probabilities).toEqual([0, 1]);
            expect(simulation.result_average).toBe(1);
        });

        it('handles an empty current_chances array', (): void => {
            const simulation: Simulation = makeSimulation([]);

            testable.calculateProbabilities(simulation);

            expect(simulation.result_probabilities).toEqual([1]);
        });
    });

    describe('summary', (): void => {
        it('names the most likely outcome and its weight', (): void => {
            // Deux personnes à 50 % : 25 % / 50 % / 25 %. Le pic est « 1 mort ».
            const simulation: Simulation = makeSimulation([50, 50]);

            testable.calculateProbabilities(simulation);

            expect(simulation.result_most_likely).toBe(1);
            expect(simulation.result_peak).toBeCloseTo(0.5, 6);
            expect(simulation.result_average).toBeCloseTo(1, 6);
        });

        it('scales the histogram against the peak, and keeps near-impossible outcomes visible', (): void => {
            expect(testable.barHeight(0.5, 0.5)).toBe(100);
            expect(testable.barHeight(0.25, 0.5)).toBe(50);
            // Un plancher, sinon une issue quasi impossible disparaîtrait et se lirait comme zéro.
            expect(testable.barHeight(0.000001, 0.5)).toBe(2);
            expect(testable.barHeight(0.5, undefined)).toBe(0);
        });
    });

    describe('addPerson / removePerson', (): void => {
        it('adds a person with the default chance and recomputes', (): void => {
            testable.default_value = 60;
            const simulation: Simulation = makeSimulation([100]);
            testable.simulations.set([simulation]);

            testable.addPerson(simulation);

            expect(simulation.current_chances).toEqual([100, 60]);
            expect(simulation.result_probabilities.length).toBe(3);
        });

        it('never goes past the upper bound of the form', (): void => {
            const simulation: Simulation = makeSimulation(new Array(40).fill(50));
            testable.simulations.set([simulation]);

            testable.addPerson(simulation);

            expect(simulation.current_chances.length).toBe(40);
        });

        it('removes the person that was aimed at, not the last one', (): void => {
            const simulation: Simulation = makeSimulation([10, 20, 30]);
            testable.simulations.set([simulation]);

            testable.removePerson(simulation, 1);

            expect(simulation.current_chances).toEqual([10, 30]);
            expect(simulation.result_probabilities.length).toBe(3);
        });

        it('keeps the last person: a simulation with nobody in it says nothing', (): void => {
            const simulation: Simulation = makeSimulation([10]);
            testable.simulations.set([simulation]);

            testable.removePerson(simulation, 0);

            expect(simulation.current_chances).toEqual([10]);
        });
    });

    describe('createSimulation / deleteSimulation', (): void => {
        it('appends a new simulation with a computed result', (): void => {
            const before: number = testable.simulations().length;

            testable.createSimulation();

            expect(testable.simulations().length).toBe(before + 1);
            expect(testable.simulations()[testable.simulations().length - 1].result_probabilities.length).toBeGreaterThan(0);
        });

        // Régression OnPush : `simulations` est un signal, `.push()`/`.splice()` en place ne
        // notifierait jamais le propre template — réassignation immuable requise.
        it('reassigns the simulations array immutably on create/delete', (): void => {
            const original: Simulation[] = testable.simulations();

            testable.createSimulation();

            expect(testable.simulations()).not.toBe(original);

            const after_create: Simulation[] = testable.simulations();
            testable.deleteSimulation(0);

            expect(testable.simulations()).not.toBe(after_create);
        });

        it('removes the simulation at the given index', (): void => {
            testable.simulations.set([makeSimulation([0]), makeSimulation([100])]);

            testable.deleteSimulation(0);

            expect(testable.simulations().length).toBe(1);
            expect(testable.simulations()[0].current_chances).toEqual([100]);
        });
    });

    describe('ngAfterViewInit', (): void => {
        it('computes the results for every pre-existing simulation', (): void => {
            testable.simulations.set([makeSimulation([100])]);

            testable.ngAfterViewInit();

            expect(testable.simulations()[0].result_probabilities).toEqual([1, 0]);
        });

        // Régression OnPush : ngAfterViewInit s'exécute APRÈS la première évaluation du template — sans
        // nouvelle référence de tableau ici, la simulation initiale calculée resterait invisible (aucun
        // événement ne marque la vue à revérifier, et un signal .set() sur la même référence n'aurait
        // aucun effet, Object.is-égal).
        it('sets a new top-level array reference so the initial simulation renders under OnPush', (): void => {
            const original: Simulation[] = testable.simulations();

            testable.ngAfterViewInit();

            expect(testable.simulations()).not.toBe(original);
        });
    });

    describe('snapshot', (): void => {
        it('toSnapshot ne garde que le titre et les chances de chaque simulation', (): void => {
            testable.simulations.set([
                { ...makeSimulation([50, 100]), title: 'Veille', result_probabilities: [0.5, 0.5], show_detail: false },
                { ...makeSimulation([10]), title: 'Nuit' }
            ]);

            expect(testable.toSnapshot()).toEqual({
                v: 1,
                simulations: [{ title: 'Veille', chances: [50, 100] }, { title: 'Nuit', chances: [10] }]
            });
        });

        it('applySnapshot remplace les simulations et en calcule les probabilités', (): void => {
            const applied: boolean = testable.applySnapshot({ v: 1, simulations: [{ title: 'Veille', chances: [100] }] });

            expect(applied).toBe(true);
            expect(testable.simulations().length).toBe(1);
            expect(testable.simulations()[0].title).toBe('Veille');
            expect(testable.simulations()[0].result_probabilities).toEqual([1, 0]);
            expect(testable.simulations()[0].editing_title).toBe(false);
        });

        it('applySnapshot restitue ce que toSnapshot a produit', (): void => {
            const snapshot: Record<string, unknown> = { v: 1, simulations: [{ title: 'A', chances: [20, 80] }, { title: 'B', chances: [55] }] };
            testable.applySnapshot(snapshot);

            expect(testable.toSnapshot()).toEqual(snapshot);
        });

        it('applySnapshot ramène les chances hors bornes à 0–100 et ignore ce qui n\'est pas un nombre', (): void => {
            testable.applySnapshot({ v: 1, simulations: [{ title: 'A', chances: [150, -20, 'x'] }] });

            expect(testable.simulations()[0].current_chances).toEqual([100, 0, 0]);
        });

        it('applySnapshot borne le nombre de personnes, de simulations et la longueur d\'un titre', (): void => {
            const simulation: Record<string, unknown> = { title: 'T'.repeat(500), chances: new Array(500).fill(50) };
            testable.applySnapshot({ v: 1, simulations: new Array(50).fill(simulation) });

            expect(testable.simulations().length).toBe(20);
            expect(testable.simulations()[0].current_chances.length).toBe(40);
            expect(testable.simulations()[0].title.length).toBe(60);
        });

        it('applySnapshot écarte une simulation sans chances et donne un titre par défaut à une simulation sans titre', (): void => {
            testable.applySnapshot({ v: 1, simulations: [{ title: 'Vide', chances: [] }, { chances: [30] }, 'pas un objet'] });

            expect(testable.simulations().map((simulation: Simulation): string => simulation.title)).toEqual(['Simulation 1']);
        });

        it('applySnapshot refuse une version inconnue ou une liste sans simulation exploitable, sans toucher à l\'état', (): void => {
            const original: Simulation[] = testable.simulations();

            expect(testable.applySnapshot({ v: 99, simulations: [{ title: 'A', chances: [50] }] })).toBe(false);
            expect(testable.applySnapshot({ v: 1, simulations: [] })).toBe(false);
            expect(testable.applySnapshot({ v: 1 })).toBe(false);
            expect(testable.simulations()).toBe(original);
        });

        it('le menu de presets de l\'en-tête fournit la configuration courante et applique le preset choisi', (): void => {
            fixture.detectChanges();
            const presets: ToolPresetsComponent = fixture.debugElement.query(By.directive(ToolPresetsComponent)).componentInstance;

            expect(presets.snapshot()()).toEqual(testable.toSnapshot());

            presets.apply.emit({ v: 1, simulations: [{ title: 'Choisie', chances: [60] }] });

            expect(testable.simulations()[0].title).toBe('Choisie');
        });

        it('loadSnapshot avertit l\'utilisateur quand le snapshot est refusé', (): void => {
            const warning: MockInstance = vi.spyOn(TestBed.inject(SnackbarService), 'warningSnackbar').mockImplementation((): void => undefined);

            testable.loadSnapshot({ v: 99 });

            expect(warning).toHaveBeenCalledTimes(1);
        });
    });
});

describe('ProbabilitiesComponent — lien partagé', (): void => {
    let warning: MockInstance;

    beforeEach((): void => {
        TestBed.configureTestingModule({
            imports: [ProbabilitiesComponent],
            providers: [provideRouter([{ path: '', component: ProbabilitiesComponent }])]
        });
        warning = vi.spyOn(TestBed.inject(SnackbarService), 'warningSnackbar').mockImplementation((): void => undefined);
    });

    it('charge les simulations du lien', async (): Promise<void> => {
        const harness: RouterTestingHarness = await RouterTestingHarness.create();
        const snapshot: Record<string, unknown> = { v: 1, simulations: [{ title: 'Veille', chances: [100, 50] }, { title: 'Nuit', chances: [10] }] };

        const component: ProbabilitiesComponent = await harness.navigateByUrl(`/?${TOOL_SNAPSHOT_PARAM}=${encodeSnapshot(snapshot)}`, ProbabilitiesComponent);

        expect((component as unknown as TestableComponent).toSnapshot()).toEqual(snapshot);
        expect(warning).not.toHaveBeenCalled();
    });

    it('un lien dont le snapshot est illisible avertit et laisse la simulation par défaut', async (): Promise<void> => {
        const harness: RouterTestingHarness = await RouterTestingHarness.create();

        const component: ProbabilitiesComponent = await harness.navigateByUrl(`/?${TOOL_SNAPSHOT_PARAM}=%25%25%25`, ProbabilitiesComponent);

        expect(warning).toHaveBeenCalledTimes(1);
        expect((component as unknown as TestableComponent).simulations().length).toBe(1);
    });
});
