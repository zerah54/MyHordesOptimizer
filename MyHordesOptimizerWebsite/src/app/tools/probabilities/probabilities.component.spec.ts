import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProbabilitiesComponent } from './probabilities.component';

interface Simulation {
    nb_people: number;
    current_chances: number[];
    result_probabilities: number[];
    result_average?: number;
    title: string;
    editing_title: boolean;
    show_detail: boolean;
}

interface TestableComponent {
    simulations: { (): Simulation[]; set(value: Simulation[]): void };
    default_value: number;
    ngAfterViewInit(): void;
    createSimulation(): void;
    deleteSimulation(index: number): void;
    convertFieldsToChances(simulation: Simulation): void;
    calculateProbabilities(simulation: Simulation): void;
}

describe('ProbabilitiesComponent', (): void => {
    let component: ProbabilitiesComponent;
    let fixture: ComponentFixture<ProbabilitiesComponent>;
    let testable: TestableComponent;

    function makeSimulation(nb_people: number, current_chances: number[]): Simulation {
        return { nb_people, current_chances, result_probabilities: [], title: 't', editing_title: false, show_detail: true };
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
            const simulation: Simulation = makeSimulation(1, [100]);

            testable.calculateProbabilities(simulation);

            expect(simulation.result_probabilities).toEqual([1, 0]);
            expect(simulation.result_average).toBe(0);
        });

        it('gives 100% chance of death when the single watcher always dies', (): void => {
            const simulation: Simulation = makeSimulation(1, [0]);

            testable.calculateProbabilities(simulation);

            expect(simulation.result_probabilities).toEqual([0, 1]);
            expect(simulation.result_average).toBe(1);
        });

        it('handles an empty current_chances array', (): void => {
            const simulation: Simulation = makeSimulation(0, []);

            testable.calculateProbabilities(simulation);

            expect(simulation.result_probabilities).toEqual([1]);
        });
    });

    describe('convertFieldsToChances', (): void => {
        it('truncates current_chances when nb_people shrinks', (): void => {
            const simulation: Simulation = makeSimulation(1, [10, 20, 30]);

            testable.convertFieldsToChances(simulation);

            expect(simulation.current_chances).toEqual([10]);
        });

        it('pads current_chances with the default value when nb_people grows', (): void => {
            testable.default_value = 42;
            const simulation: Simulation = makeSimulation(3, [10]);

            testable.convertFieldsToChances(simulation);

            expect(simulation.current_chances).toEqual([10, 42, 42]);
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
            testable.simulations.set([makeSimulation(1, [0]), makeSimulation(1, [100])]);

            testable.deleteSimulation(0);

            expect(testable.simulations().length).toBe(1);
            expect(testable.simulations()[0].current_chances).toEqual([100]);
        });
    });

    describe('ngAfterViewInit', (): void => {
        it('computes the results for every pre-existing simulation', (): void => {
            testable.simulations.set([makeSimulation(1, [100])]);

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
