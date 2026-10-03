import { ComponentFixture, TestBed } from '@angular/core/testing';

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
});
