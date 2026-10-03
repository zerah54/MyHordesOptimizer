import { HttpErrorResponse, provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import type { MockedObject } from 'vitest';

import { PLANIF_VALUES, TDG_VALUES } from '../../../_abstract_model/const';
import { RefinementInputDTO, RefinementViewDTO } from '../../../_abstract_model/dto/refinement.dto';
import { MinMax } from '../../../_abstract_model/interfaces';
import { AdminService } from '../../../_abstract_model/services/admin.service';
import { TownStatisticsService } from '../../../_abstract_model/services/town-statistics.service';
import { Dictionary } from '../../../_abstract_model/types/_types';
import { Estimations } from '../../../_abstract_model/types/estimations.class';
import { EstimationsResult } from '../../../_abstract_model/types/estimations-result.class';
import { TownDetails } from '../../../_abstract_model/types/town-details.class';
import { ClipboardService } from '../../../_core/services/clipboard.service';
import { TownContextService } from '../../../_core/services/town-context.service';
import { getMaxAttack, getMinAttack } from '../../../_core/utilities/estimations.util';
import { setTown } from '../../../_core/utilities/localstorage.util';
import { EstimationsComponent } from './estimations.component';
import { RefinerParams } from './refiner/attack-model';
import { AttackRefinerService, RefineResult } from './refiner/attack-refiner.service';

describe('EstimationsComponent', (): void => {
    let fixture: ComponentFixture<EstimationsComponent>;
    let townStatisticsService: MockedObject<TownStatisticsService>;
    let refinerService: MockedObject<AttackRefinerService>;
    let clipboardService: MockedObject<ClipboardService>;
    let adminService: AdminService;
    let townContextService: TownContextService;

    /** Estimations avec toutes les clés TDG/planif présentes (min/max vides), overridables. */
    function makeEstimations(overrides: {
        estim?: Dictionary<Partial<MinMax>>;
        planif?: Dictionary<Partial<MinMax>>;
    } = {}): Estimations {
        const estimations: Estimations = new Estimations();
        estimations.estim = {};
        estimations.planif = {};
        TDG_VALUES.forEach((percent: number): void => {
            estimations.estim['_' + percent] = { min: undefined, max: undefined, ...(overrides.estim?.['_' + percent] || {}) };
        });
        PLANIF_VALUES.forEach((percent: number): void => {
            estimations.planif['_' + percent] = { min: undefined, max: undefined, ...(overrides.planif?.['_' + percent] || {}) };
        });
        return estimations;
    }

    function makeAttackResult(min: number, max: number): EstimationsResult {
        return new EstimationsResult({ result: { min, max }, minList: [min], maxList: [max] });
    }

    /** `[color]="'accent'"` est une property binding, pas un attribut DOM — repérer par le libellé. */
    function findSaveButton(): HTMLButtonElement | undefined {
        return Array.from(fixture.nativeElement.querySelectorAll('.actions button') as NodeListOf<HTMLButtonElement>)
            .find((button: HTMLButtonElement): boolean => button.textContent?.includes('Enregistrer') === true);
    }

    beforeEach(async (): Promise<void> => {
        setTown(Object.assign(new TownDetails(), { day: 10, town_type: 'RE' }));

        townStatisticsService = {
            getEstimations: vi.fn().mockName('TownStatisticsService.getEstimations'),
            getAttackCalculation: vi.fn().mockName('TownStatisticsService.getAttackCalculation'),
            saveEstimations: vi.fn().mockName('TownStatisticsService.saveEstimations'),
            getAttackSettings: vi.fn().mockName('TownStatisticsService.getAttackSettings'),
            saveAttackSettings: vi.fn().mockName('TownStatisticsService.saveAttackSettings'),
            getRefinement: vi.fn().mockName('TownStatisticsService.getRefinement'),
            getRefinementInput: vi.fn().mockName('TownStatisticsService.getRefinementInput'),
            postRefinement: vi.fn().mockName('TownStatisticsService.postRefinement')
        } as unknown as MockedObject<TownStatisticsService>;
        refinerService = {
            isSupported: vi.fn().mockName('AttackRefinerService.isSupported'),
            cancel: vi.fn().mockName('AttackRefinerService.cancel'),
            refine: vi.fn().mockName('AttackRefinerService.refine')
        } as unknown as MockedObject<AttackRefinerService>;
        clipboardService = {
            copy: vi.fn().mockName('ClipboardService.copy')
        } as unknown as MockedObject<ClipboardService>;

        await TestBed.configureTestingModule({
            imports: [EstimationsComponent],
            providers: [
                provideHttpClient(withXhr()), provideHttpClientTesting(), { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                { provide: TownStatisticsService, useValue: townStatisticsService },
                { provide: AttackRefinerService, useValue: refinerService },
                { provide: ClipboardService, useValue: clipboardService }
            ]
        }).compileComponents();
        townStatisticsService.getAttackSettings.mockReturnValue(of({ souls: null, spaLevel: null, fireworks: false }));
        townStatisticsService.getRefinement.mockReturnValue(of({ status: 'None', attackMin: null, attackMax: null, reductionMin: null, reductionMax: null, noCompatibleConfiguration: false, lastUpdateInfo: null }));
        townStatisticsService.saveAttackSettings.mockReturnValue(of(undefined));

        adminService = TestBed.inject(AdminService);
        townContextService = TestBed.inject(TownContextService);
        townContextService.clear();
        refinerService.isSupported.mockReturnValue(false);

        // jsdom n'implémente ni DataTransfer ni ClipboardEvent (pasteFromMH() en a besoin) : deux
        // stubs minimaux, suffisants pour setData()/getData() et l'accès à .clipboardData.
        if (typeof globalThis.DataTransfer === 'undefined') {
            vi.stubGlobal('DataTransfer', class {
                private readonly data: Map<string, string> = new Map<string, string>();
                public setData(format: string, data: string): void {
                    this.data.set(format, data);
                }
                public getData(format: string): string {
                    return this.data.get(format) ?? '';
                }
            });
        }
        if (typeof globalThis.ClipboardEvent === 'undefined') {
            vi.stubGlobal('ClipboardEvent', class extends Event {
                public readonly clipboardData: DataTransfer | null;
                public constructor(type: string, eventInitDict?: ClipboardEventInit) {
                    super(type, eventInitDict);
                    this.clipboardData = eventInitDict?.clipboardData ?? null;
                }
            });
        }

        // jsdom ne rend pas de vrai contexte 2D (getContext('2d') renvoie null) : Chart.js identifie
        // ses instances par `context.canvas`, donc un contexte null confond TOUS les canvases entre
        // eux (« Canvas is already in use » dès le 2e chart créé). On rend un faux contexte qui
        // pointe vers SON canvas (comparaisons `c.canvas === canvas` correctes) et no-op sur le reste.
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement): unknown {
            return new Proxy({ canvas: this }, {
                get: (target: { canvas: HTMLCanvasElement }, prop: string | symbol): unknown =>
                    prop in target ? target[prop as keyof typeof target] : ((): undefined => undefined)
            });
        } as unknown as typeof HTMLCanvasElement.prototype.getContext);

        fixture = TestBed.createComponent(EstimationsComponent);
        vi.useFakeTimers();
    });

    afterEach((): void => {
        setTown(null);
        townContextService.clear();
        // Chart.js suit ses instances dans un registre par canvas au niveau du module : sans
        // destroy() explicite à la fin de chaque test, un chart créé par un test précédent
        // (nombreux ici, via loadEstimations()) fait échouer l'acquisition du contexte 2D du
        // suivant (jsdom n'implémente pas HTMLCanvasElement, ce qui rend ce chemin fragile).
        const charts: string[] = ['today_estim_chart', 'today_offset_chart', 'tomorrow_estim_chart', 'tomorrow_offset_chart'];
        charts.forEach((key: string): void => {
            (fixture?.componentInstance as unknown as Record<string, { destroy(): void } | undefined>)?.[key]?.destroy();
        });
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    /**
     * Charge le composant en interleaving les 3 réponses HTTP (estimations, attaque J, attaque
     * J+1) avec des `detectChanges()` intermédiaires : les canvases sont derrière `@if
     * (estimations)`, `viewChild.required` lèverait NG0951 si tout était flushé en un seul tick.
     * Avance les timers après chaque `detectChanges()` : `NgModel._updateValue` écrit la valeur DOM dans un
     * micro-tâche (`resolvedPromise.then(...)`), pas synchrone à l'intérieur de `detectChanges()`.
     * Doit être appelée depuis un test `async` (avec `vi.useFakeTimers()` déjà actif via le
     * `beforeEach` du fichier).
     */
    async function loadEstimations(estimations: Estimations, today_attack: EstimationsResult, tomorrow_attack: EstimationsResult): Promise<void> {
        const estimations$: Subject<Estimations> = new Subject();
        const today$: Subject<EstimationsResult> = new Subject();
        const tomorrow$: Subject<EstimationsResult> = new Subject();
        townStatisticsService.getEstimations.mockImplementation((day: number) => day === 10 ? estimations$.asObservable() : of(makeEstimations()));
        townStatisticsService.getAttackCalculation.mockImplementation((day: number) => day === 10 ? today$.asObservable() : tomorrow$.asObservable());

        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(0);
        estimations$.next(estimations);
        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(0);
        today$.next(today_attack);
        tomorrow$.next(tomorrow_attack);
        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(0);
    }

    it('renders nothing until estimations has loaded', (): void => {
        townStatisticsService.getEstimations.mockReturnValue(of());
        townStatisticsService.getAttackCalculation.mockReturnValue(of());
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.content')).toBeNull();
    });

    /** Le pipe `number` en français sépare avec une espace insécable : on la normalise. */
    function plainText(selector: string): string {
        return (fixture.nativeElement.querySelector(selector)?.textContent ?? '').replace(/\u00a0|\u202f/g, ' ').trim();
    }

    it('renders the TDG/planif tables and the calculated attack once everything has loaded', async (): Promise<void> => {
        await loadEstimations(makeEstimations({ estim: { _33: { min: 10, max: 20 } } }), makeAttackResult(5, 15), makeAttackResult(6, 16));

        expect(fixture.nativeElement.querySelector('.content')).not.toBeNull();
        const tdg_min_input: HTMLInputElement = fixture.nativeElement.querySelector('table input');
        expect(tdg_min_input.value).toBe('10');
        expect(plainText('.mho-kpi')).toBe('5 – 15');
    });

    it('switches the KPI and the chart to the next day, and back', async (): Promise<void> => {
        await loadEstimations(makeEstimations({ estim: { _33: { min: 10, max: 20 } } }), makeAttackResult(5, 15), makeAttackResult(6, 16));

        const toggles: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('.day-switch button'));
        expect(toggles.length).toBe(2);
        expect(plainText('.mho-kpi-label')).toContain('J10');

        toggles[1].click();
        fixture.detectChanges();

        expect(plainText('.mho-kpi-label')).toContain('J11');
        expect(plainText('.mho-kpi')).toBe('6 – 16');

        toggles[0].click();
        fixture.detectChanges();

        expect(plainText('.mho-kpi')).toBe('5 – 15');
    });

    it('situates the calculated range inside the day theoretical bounds', async (): Promise<void> => {
        const low: number = getMinAttack(10, 'RE');
        const high: number = getMaxAttack(10, 'RE');
        // Une plage calculée au premier quart du possible du jour.
        const min: number = Math.round(low + (high - low) * 0.25);
        const max: number = Math.round(low + (high - low) * 0.5);
        await loadEstimations(makeEstimations({ estim: { _33: { min: low, max: high } } }), makeAttackResult(min, max), makeAttackResult(min, max));

        const gauge: HTMLElement = fixture.nativeElement.querySelector('.kpi-gauge');
        expect(gauge).not.toBeNull();
        const range: HTMLElement = gauge.querySelector('.range') as HTMLElement;
        expect(Math.round(parseFloat(range.style.left))).toBe(25);
        expect(Math.round(parseFloat(range.style.width))).toBe(25);
        // Les deux bornes de l'échelle sont annoncées sous la jauge.
        expect(plainText('.kpi-scale')).toContain(String(low));
    });

    it('shows the average when every possible attack is equally likely', async (): Promise<void> => {
        // Une seule valeur dans la distribution : rien ne ressort, on retombe sur la moyenne.
        await loadEstimations(makeEstimations(), makeAttackResult(100, 200), makeAttackResult(100, 200));
        expect(plainText('.kpi-sub')).toContain('Moyenne');
        expect(plainText('.kpi-sub')).toContain('150');
    });

    // Test à part : le composant ne s'abonne qu'une fois (ngOnInit), un second chargement dans le
    // même test n'atteignait jamais le composant et l'assertion lisait encore la moyenne.
    it('shows the most likely attack when one value stands out', async (): Promise<void> => {
        // 140 revient trois fois : c'est l'attaque la plus probable.
        const peaked: EstimationsResult = new EstimationsResult({
            result: { min: 100, max: 200 },
            minList: [100, 140, 140, 140, 200],
            maxList: [100, 140, 140, 140, 200]
        });
        await loadEstimations(makeEstimations(), peaked, peaked);

        expect(plainText('.kpi-sub')).toContain('Plus probable');
        expect(plainText('.kpi-sub')).toContain('140');
    });

    it('shows the save button when not in observer/readonly mode, hides it otherwise', async (): Promise<void> => {
        await loadEstimations(makeEstimations(), makeAttackResult(1, 2), makeAttackResult(1, 2));
        expect(findSaveButton()).not.toBeUndefined();

        townContextService.setObservedTown(new TownDetails());
        fixture.detectChanges();
        expect(findSaveButton()).toBeUndefined();
    });

    it('saveEstimations posts the current estimations then reloads them', async (): Promise<void> => {
        await loadEstimations(makeEstimations(), makeAttackResult(1, 2), makeAttackResult(1, 2));
        townStatisticsService.saveEstimations.mockReturnValue(of(undefined));
        townStatisticsService.getEstimations.mockClear();
        townStatisticsService.getEstimations.mockReturnValue(of(makeEstimations()));
        townStatisticsService.getAttackCalculation.mockReturnValue(of());

        findSaveButton()?.click();
        await vi.advanceTimersByTimeAsync(0);

        expect(townStatisticsService.saveEstimations).toHaveBeenCalledTimes(1);
        expect(townStatisticsService.getEstimations).toHaveBeenCalledTimes(1);
    });

    it('does not show the refine controls when WebGPU is unsupported', async (): Promise<void> => {
        adminService.isAdmin.set(true);
        refinerService.isSupported.mockReturnValue(false);
        await loadEstimations(makeEstimations(), makeAttackResult(1, 2), makeAttackResult(1, 2));

        expect(fixture.nativeElement.querySelector('.refine')).toBeNull();
    });

    describe('affinage partagé', (): void => {
        const valid_view: RefinementViewDTO = {
            status: 'Valid', attackMin: 3736, attackMax: 3757, reductionMin: null, reductionMax: null,
            noCompatibleConfiguration: false, lastUpdateInfo: { userName: 'Zerah', updateTime: '2026-10-01T18:00:00Z' }
        };
        const input: RefinementInputDTO = {
            observed: new Array<number>(100).fill(2147483647), observedPlanif: null,
            params: {
                baseLoRand: 4, baseHiRand: 20, offSum: 21, protect: 3, blocks: 20, soulTdg: new Array<number>(25).fill(1), soulPlanif: new Array<number>(25).fill(1),
                shiftSpan: 0.075, shiftSteps: 750, minGlobal: 2860, maxGlobal: 4096, reboundPossible: true, fireworks: false
            }
        };

        /** Clique « Affiner » sur le panneau affiché. */
        async function clickRefine(): Promise<void> {
            (fixture.nativeElement.querySelector('.refine button[mat-stroked-button]') as HTMLButtonElement).click();
            await vi.advanceTimersByTimeAsync(0);
            fixture.detectChanges();
        }

        beforeEach((): void => {
            refinerService.isSupported.mockReturnValue(true);
        });

        it('shows the shared range and its author to every visitor, observers included', async (): Promise<void> => {
            townStatisticsService.getRefinement.mockImplementation((day: number) => of(day === 10 ? valid_view : { ...valid_view, status: 'None' }));
            townContextService.setObservedTown(new TownDetails());
            await loadEstimations(makeEstimations(), makeAttackResult(3700, 3800), makeAttackResult(1, 2));

            expect(fixture.nativeElement.querySelector('.refined')).not.toBeNull();
            expect(fixture.nativeElement.textContent).toContain('Zerah');
            expect(fixture.nativeElement.querySelector('.refine button[mat-stroked-button]')).toBeNull();
        });

        it('offers the refine button to any citizen with WebGPU, without admin rights', async (): Promise<void> => {
            adminService.isAdmin.set(false);
            await loadEstimations(makeEstimations(), makeAttackResult(1, 2), makeAttackResult(1, 2));

            expect(fixture.nativeElement.querySelector('.refine button[mat-stroked-button]')).not.toBeNull();
        });

        it('scans with the server inputs then posts the hits and shows the returned range', async (): Promise<void> => {
            townStatisticsService.getRefinementInput.mockReturnValue(of(input));
            townStatisticsService.postRefinement.mockReturnValue(of(valid_view));
            refinerService.refine.mockReturnValue(Promise.resolve({ hits: [777001], scanned: 100, cancelled: false, overflow: false }));
            await loadEstimations(makeEstimations({ estim: { _33: { min: 3400, max: 4259 } } }), makeAttackResult(3700, 3800), makeAttackResult(1, 2));

            await clickRefine();

            const params: RefinerParams = refinerService.refine.mock.calls[0][1];
            expect(params.base_lo_rand).toBe(4);
            expect(params.shift_steps).toBe(750);
            expect(params.soul_attack).toBe(1);
            expect(townStatisticsService.postRefinement).toHaveBeenCalledWith(10, input, [777001]);
            expect(fixture.nativeElement.querySelector('.refined')).not.toBeNull();
        });

        it('asks for a new scan when the server answers 409', async (): Promise<void> => {
            townStatisticsService.getRefinementInput.mockReturnValue(of(input));
            townStatisticsService.postRefinement.mockReturnValue(throwError((): HttpErrorResponse => new HttpErrorResponse({ status: 409 })));
            refinerService.refine.mockReturnValue(Promise.resolve({ hits: [1], scanned: 100, cancelled: false, overflow: false }));
            await loadEstimations(makeEstimations({ estim: { _33: { min: 3400, max: 4259 } } }), makeAttackResult(1, 2), makeAttackResult(1, 2));

            await clickRefine();

            expect(fixture.nativeElement.textContent).toContain('Saisies modifiées pendant le scan');
        });

        it('explains that more paliers are needed when the scan overflows, without posting', async (): Promise<void> => {
            townStatisticsService.getRefinementInput.mockReturnValue(of(input));
            refinerService.refine.mockReturnValue(Promise.resolve({ hits: [], scanned: 100, cancelled: false, overflow: true }));
            await loadEstimations(makeEstimations({ estim: { _33: { min: 3400, max: 4259 } } }), makeAttackResult(1, 2), makeAttackResult(1, 2));

            await clickRefine();

            expect(townStatisticsService.postRefinement).not.toHaveBeenCalled();
            expect(fixture.nativeElement.textContent).toContain('saisissez plus de paliers');
        });

        it('reports that no estimation can be refined when the server answers 400', async (): Promise<void> => {
            townStatisticsService.getRefinementInput.mockReturnValue(throwError((): HttpErrorResponse => new HttpErrorResponse({ status: 400 })));
            await loadEstimations(makeEstimations(), makeAttackResult(1, 2), makeAttackResult(1, 2));

            await clickRefine();

            expect(refinerService.refine).not.toHaveBeenCalled();
            expect(fixture.nativeElement.textContent).toContain('Aucune estimation saisie à affiner');
        });

        it('disables the refine button while estimations are modified but not saved', async (): Promise<void> => {
            await loadEstimations(makeEstimations({ estim: { _33: { min: 3400, max: 4259 } } }), makeAttackResult(1, 2), makeAttackResult(1, 2));
            const button = (): HTMLButtonElement => fixture.nativeElement.querySelector('.refine button[mat-stroked-button]');
            expect(button().disabled).toBe(false);

            const tdg_min_input: HTMLInputElement = fixture.nativeElement.querySelector('table input');
            tdg_min_input.value = '3401';
            tdg_min_input.dispatchEvent(new Event('input'));
            fixture.detectChanges();

            expect(button().disabled).toBe(true);
            expect(fixture.nativeElement.textContent).toContain('Enregistrez vos estimations pour pouvoir affiner');
        });

        it('disables the refine button after a soul or attack setting change until saved', async (): Promise<void> => {
            await loadEstimations(makeEstimations({ estim: { _33: { min: 3400, max: 4259 } } }), makeAttackResult(1, 2), makeAttackResult(1, 2));
            const component: { setRowSouls(day: number, family: 'estim' | 'planif', percent: number, souls: number): void; setFireworksDay(day: number, exploded: boolean): void } =
                fixture.componentInstance as unknown as { setRowSouls(day: number, family: 'estim' | 'planif', percent: number, souls: number): void; setFireworksDay(day: number, exploded: boolean): void };
            const button = (): HTMLButtonElement => fixture.nativeElement.querySelector('.refine button[mat-stroked-button]');

            component.setRowSouls(10, 'estim', 33, 1);
            fixture.detectChanges();
            expect(button().disabled).toBe(true);

            component.setRowSouls(10, 'estim', 33, 0);
            fixture.detectChanges();
            expect(button().disabled).toBe(false);

            component.setFireworksDay(10, true);
            fixture.detectChanges();
            expect(button().disabled).toBe(true);
        });

        it('says the attack has not been refined yet', async (): Promise<void> => {
            await loadEstimations(makeEstimations(), makeAttackResult(1, 2), makeAttackResult(1, 2));

            expect(fixture.nativeElement.querySelector('.refine__status').textContent).toContain('Pas encore affiné');
        });

        it('asks to retry later when the server is busy (429)', async (): Promise<void> => {
            townStatisticsService.getRefinementInput.mockReturnValue(of(input));
            townStatisticsService.postRefinement.mockReturnValue(throwError((): HttpErrorResponse => new HttpErrorResponse({ status: 429 })));
            refinerService.refine.mockReturnValue(Promise.resolve({ hits: [1], scanned: 100, cancelled: false, overflow: false }));
            await loadEstimations(makeEstimations({ estim: { _33: { min: 3400, max: 4259 } } }), makeAttackResult(1, 2), makeAttackResult(1, 2));

            await clickRefine();

            expect(fixture.nativeElement.textContent).toContain('Serveur occupé');
        });

        it('shows that the refinement must be run again when it is invalid', async (): Promise<void> => {
            townStatisticsService.getRefinement.mockImplementation((day: number) => of({ ...valid_view, status: day === 10 ? 'Invalid' : 'None' }));
            await loadEstimations(makeEstimations(), makeAttackResult(1, 2), makeAttackResult(1, 2));

            expect(fixture.nativeElement.textContent).toContain('relance nécessaire');
            expect(fixture.nativeElement.querySelector('.refined')).toBeNull();
        });

        it('shows the progress spinner/bar while refining, and forwards Annuler to refiner.cancel()', async (): Promise<void> => {
            await loadEstimations(makeEstimations({ estim: { _33: { min: 10, max: 20 } } }), makeAttackResult(1, 2), makeAttackResult(1, 2));
            townStatisticsService.getRefinementInput.mockReturnValue(of(input));
            let resolve_refine!: (result: RefineResult) => void;
            let captured_on_progress!: (fraction: number) => void;
            refinerService.refine.mockImplementation((_observed: Int32Array, _params: RefinerParams, on_progress: (fraction: number) => void): Promise<RefineResult> => {
                captured_on_progress = on_progress;
                return new Promise<RefineResult>((resolve: (result: RefineResult) => void): void => {
                    resolve_refine = resolve;
                });
            });

            const today_panel: HTMLElement = fixture.nativeElement.querySelectorAll('.refine')[0];
            (today_panel.querySelector('button[mat-stroked-button]') as HTMLButtonElement).click();
            await vi.advanceTimersByTimeAsync(0);
            fixture.detectChanges();

            expect(fixture.nativeElement.querySelector('.refine__spin')).not.toBeNull();
            captured_on_progress(0.5);
            fixture.detectChanges();
            expect(fixture.nativeElement.querySelector('.refine__pct').textContent).toContain('50%');

            (fixture.nativeElement.querySelector('.refine button[mat-icon-button]') as HTMLButtonElement).click();
            expect(refinerService.cancel).toHaveBeenCalledTimes(1);

            resolve_refine({ hits: [], scanned: 10, cancelled: false, overflow: false });
            await vi.advanceTimersByTimeAsync(0);
            fixture.detectChanges();
            expect(fixture.nativeElement.querySelector('.refine__spin')).toBeNull();
        });

        it('updates the elapsed-time label every second while refining', async (): Promise<void> => {
            await loadEstimations(makeEstimations({ estim: { _33: { min: 10, max: 20 } } }), makeAttackResult(1, 2), makeAttackResult(1, 2));
            townStatisticsService.getRefinementInput.mockReturnValue(of(input));
            refinerService.refine.mockReturnValue(new Promise<RefineResult>((): void => { }));

            const today_panel: HTMLElement = fixture.nativeElement.querySelectorAll('.refine')[0];
            (today_panel.querySelector('button[mat-stroked-button]') as HTMLButtonElement).click();
            await vi.advanceTimersByTimeAsync(0);
            fixture.detectChanges();
            const initial_label: string = fixture.nativeElement.querySelector('.refine__stats').textContent;

            // 70s : franchit le seuil moment.humanize() « a few seconds » → « a minute ».
            await vi.advanceTimersByTimeAsync(70000);
            fixture.detectChanges();

            expect(fixture.nativeElement.querySelector('.refine__stats').textContent).not.toBe(initial_label);
        });
    });

    describe('mode âmes (état)', (): void => {
        /** Accès aux membres protégés du composant. */
        interface SoulsApi {
            setSoulsMode(enabled: boolean): void;
            setRowSouls(day: number, family: 'estim' | 'planif', percent: number, souls: number): void;
            setAttackSouls(attack_day: number, souls: number): void;
            attackSouls(attack_day: number): number;
            setSpaLevel(day: number, family: 'estim' | 'planif', level: number): void;
            attackSpaLevel(attack_day: number): number;
            setAttackSpaLevel(attack_day: number, level: number): void;
        }
        const api = (): SoulsApi => fixture.componentInstance as unknown as SoulsApi;

        it('lets an explicit attack soul count override the default', async (): Promise<void> => {
            await loadEstimations(makeEstimations({ estim: { _33: { min: 10, max: 20 } } }), makeAttackResult(5, 15), makeAttackResult(6, 16));

            api().setSoulsMode(true);
            api().setRowSouls(10, 'estim', 33, 2);
            expect(api().attackSouls(10)).toBe(2);

            api().setAttackSouls(10, 0);
            expect(api().attackSouls(10)).toBe(0);
        });

        it('defaults the attack SPA level to the level of the family that produced the estimation', async (): Promise<void> => {
            await loadEstimations(makeEstimations({ estim: { _33: { min: 10, max: 20 } } }), makeAttackResult(5, 15), makeAttackResult(6, 16));

            api().setSoulsMode(true);
            expect(api().attackSpaLevel(10)).toBe(0);

            api().setSpaLevel(10, 'estim', 1);
            expect(api().attackSpaLevel(10)).toBe(1);

            api().setSpaLevel(10, 'planif', 3);
            expect(api().attackSpaLevel(11)).toBe(3);
        });

        it('lets an explicit attack SPA level override the default', async (): Promise<void> => {
            await loadEstimations(makeEstimations({ estim: { _33: { min: 10, max: 20 } } }), makeAttackResult(5, 15), makeAttackResult(6, 16));

            api().setSoulsMode(true);
            api().setSpaLevel(10, 'estim', 1);
            expect(api().attackSpaLevel(10)).toBe(1);

            api().setAttackSpaLevel(10, 2);
            expect(api().attackSpaLevel(10)).toBe(2);
        });

        it('scales the theoretical scale of the gauge by the attack soul factor', async (): Promise<void> => {
            // 1 âme ⇒ ×1,04 ; l'échelle basse reste sous 1000 (pas de séparateur de milliers dans le rendu).
            const scaled_low: number = Math.round(getMinAttack(10, 'RE') * 1.04);
            await loadEstimations(makeEstimations({ estim: { _33: { min: 10, max: 20 } } }), makeAttackResult(5, 15), makeAttackResult(6, 16));

            api().setSoulsMode(true);
            api().setAttackSouls(10, 1);
            fixture.detectChanges();

            expect(plainText('.kpi-scale')).toContain(String(scaled_low));
        });
    });

    describe('mode âmes (interface)', (): void => {
        function switchSoulsMode(): HTMLButtonElement {
            return fixture.nativeElement.querySelector('.souls-toggle button') as HTMLButtonElement;
        }
        async function enableSoulsMode(): Promise<void> {
            switchSoulsMode().click();
            fixture.detectChanges();
            await vi.advanceTimersByTimeAsync(0);
            fixture.detectChanges();
        }

        it('shows no soul stepper until the mode is enabled', async (): Promise<void> => {
            await loadEstimations(makeEstimations({ estim: { _33: { min: 10, max: 20 } } }), makeAttackResult(5, 15), makeAttackResult(6, 16));

            expect(fixture.nativeElement.querySelectorAll('.estim-card mho-compact-stepper').length).toBe(0);
            expect(fixture.nativeElement.querySelector('.kpi-souls')).toBeNull();
            expect(fixture.nativeElement.querySelector('.kpi-spa-level')).toBeNull();
        });

        it('adds a soul stepper on every row of both tables, one SPA level stepper per table, and one souls + one SPA level stepper in the KPI card once the mode is enabled', async (): Promise<void> => {
            await loadEstimations(makeEstimations({ estim: { _33: { min: 10, max: 20 } } }), makeAttackResult(5, 15), makeAttackResult(6, 16));

            await enableSoulsMode();

            // Un stepper d'âmes par ligne des deux tableaux + un stepper de niveau SPA par tableau (pas par ligne : le niveau ne varie pas entre paliers d'une même lecture).
            expect(fixture.nativeElement.querySelectorAll('.estim-card mho-compact-stepper').length).toBe(TDG_VALUES.length + PLANIF_VALUES.length + 2);
            expect(fixture.nativeElement.querySelectorAll('.kpi-souls mho-compact-stepper').length).toBe(1);
            expect(fixture.nativeElement.querySelectorAll('.kpi-spa-level mho-compact-stepper').length).toBe(1);
        });
    });

    describe('âmes et réglages en base', (): void => {
        /** Accès aux membres protégés du composant. */
        interface SoulsApi {
            souls_mode: () => boolean;
            rowSouls(day: number, family: 'estim' | 'planif', percent: number): number;
            spaLevel(day: number, family: 'estim' | 'planif'): number;
            setRowSouls(day: number, family: 'estim' | 'planif', percent: number, souls: number): void;
            setAttackSouls(attack_day: number, souls: number): void;
            attackSouls(attack_day: number): number;
            isFireworksDay(day: number): boolean;
        }
        const api = (): SoulsApi => fixture.componentInstance as unknown as SoulsApi;

        it('loads the row souls and SPA levels and turns the souls display on', async (): Promise<void> => {
            const estimations: Estimations = makeEstimations({ estim: { _33: { min: 10, max: 20 } } });
            estimations.estim_souls = { '33': 2 };
            estimations.estim_spa_level = 2;
            await loadEstimations(estimations, makeAttackResult(5, 15), makeAttackResult(6, 16));

            expect(api().rowSouls(10, 'estim', 33)).toBe(2);
            expect(api().spaLevel(10, 'estim')).toBe(2);
            expect(api().souls_mode()).toBe(true);
        });

        it('takes the server default when the tower of the day is empty (planner of the day before)', async (): Promise<void> => {
            townStatisticsService.getAttackSettings.mockImplementation((day: number) =>
                of({ souls: null, spaLevel: null, fireworks: false, defaultSouls: day === 10 ? 2 : 0, defaultSpaLevel: day === 10 ? 1 : 0, defaultFromTdg: false }));
            await loadEstimations(makeEstimations(), makeAttackResult(5, 15), makeAttackResult(6, 16));

            expect(api().attackSouls(10)).toBe(2);
            expect((fixture.componentInstance as unknown as { attackSpaLevel(day: number): number }).attackSpaLevel(10)).toBe(1);
        });

        it('takes the server default for tomorrow when it comes from a tower not shown on screen', async (): Promise<void> => {
            townStatisticsService.getAttackSettings.mockImplementation((day: number) =>
                of({ souls: null, spaLevel: null, fireworks: false, defaultSouls: day === 11 ? 4 : 0, defaultSpaLevel: 0, defaultFromTdg: day === 11 }));
            await loadEstimations(makeEstimations({ planif: { _0: { min: 10, max: 20 } } }), makeAttackResult(5, 15), makeAttackResult(6, 16));

            api().setRowSouls(10, 'planif', 0, 1);

            expect(api().attackSouls(11)).toBe(4);
        });

        it('follows the displayed rows live when they are the source of the default', async (): Promise<void> => {
            townStatisticsService.getAttackSettings.mockImplementation(() =>
                of({ souls: null, spaLevel: null, fireworks: false, defaultSouls: 0, defaultSpaLevel: 0, defaultFromTdg: false }));
            await loadEstimations(makeEstimations({ planif: { _0: { min: 10, max: 20 } } }), makeAttackResult(5, 15), makeAttackResult(6, 16));

            api().setRowSouls(10, 'planif', 0, 3);

            expect(api().attackSouls(11)).toBe(3);
        });

        it('loads the attack settings of both days', async (): Promise<void> => {
            townStatisticsService.getAttackSettings.mockImplementation((day: number) => of({ souls: day === 11 ? 3 : null, spaLevel: null, fireworks: day === 11 }));
            await loadEstimations(makeEstimations(), makeAttackResult(5, 15), makeAttackResult(6, 16));

            expect(api().attackSouls(11)).toBe(3);
            expect(api().isFireworksDay(11)).toBe(true);
            expect(api().isFireworksDay(10)).toBe(false);
        });

        it('neither saves nor recalculates when a counter changes', async (): Promise<void> => {
            await loadEstimations(makeEstimations({ estim: { _33: { min: 10, max: 20 } } }), makeAttackResult(5, 15), makeAttackResult(6, 16));
            townStatisticsService.getAttackCalculation.mockClear();

            api().setRowSouls(10, 'estim', 33, 1);
            api().setAttackSouls(11, 2);
            await vi.advanceTimersByTimeAsync(1000);

            expect(townStatisticsService.getAttackCalculation).not.toHaveBeenCalled();
            expect(townStatisticsService.saveEstimations).not.toHaveBeenCalled();
            expect(townStatisticsService.saveAttackSettings).not.toHaveBeenCalled();
        });

        it('Enregistrer sends the souls with the estimations, then the changed attack settings, then reloads', async (): Promise<void> => {
            await loadEstimations(makeEstimations({ estim: { _33: { min: 10, max: 20 } } }), makeAttackResult(5, 15), makeAttackResult(6, 16));
            townStatisticsService.saveEstimations.mockReturnValue(of(undefined));
            townStatisticsService.getEstimations.mockClear();
            townStatisticsService.getEstimations.mockReturnValue(of(makeEstimations()));
            townStatisticsService.getAttackCalculation.mockReturnValue(of(makeAttackResult(5, 15)));

            api().setRowSouls(10, 'estim', 33, 1);
            api().setAttackSouls(11, 2);
            findSaveButton()?.click();
            await vi.advanceTimersByTimeAsync(0);

            const saved: Estimations = townStatisticsService.saveEstimations.mock.calls[0][0];
            expect(saved.modelToDto().estimSouls).toEqual({ '33': 1 });
            expect(saved.modelToDto().planifSouls).toEqual({});
            expect(townStatisticsService.saveAttackSettings).toHaveBeenCalledTimes(1);
            expect(townStatisticsService.saveAttackSettings).toHaveBeenCalledWith(11, { souls: 2, spaLevel: null, fireworks: false });
            expect(townStatisticsService.getEstimations).toHaveBeenCalledTimes(1);
        });

        it('hides the soul and SPA steppers in observer mode', async (): Promise<void> => {
            const estimations: Estimations = makeEstimations();
            estimations.estim_souls = { '33': 1 };
            townContextService.setObservedTown(new TownDetails());
            await loadEstimations(estimations, makeAttackResult(5, 15), makeAttackResult(6, 16));

            expect(fixture.nativeElement.querySelector('mho-compact-stepper[label="Âmes rouges"]')).toBeNull();
            expect(fixture.nativeElement.querySelector('.spa-level')).toBeNull();
        });
    });

    it('copies a forum-formatted summary via ClipboardService', async (): Promise<void> => {
        await loadEstimations(makeEstimations({ estim: { _33: { min: 10, max: 20 } } }), makeAttackResult(1, 2), makeAttackResult(1, 2));

        const share_button: HTMLButtonElement | undefined = Array.from(fixture.nativeElement.querySelectorAll('.actions button') as NodeListOf<HTMLButtonElement>)
            .find((button: HTMLButtonElement): boolean => button.textContent?.includes('share') === true);
        share_button?.click();

        expect(clipboardService.copy).toHaveBeenCalledTimes(1);
        expect((vi.mocked(clipboardService.copy).mock.lastCall![0] as string)).toContain('J10');
    });

    it('pasteFromMH splits a "min - max" pasted range across both fields', async (): Promise<void> => {
        await loadEstimations(makeEstimations(), makeAttackResult(1, 2), makeAttackResult(1, 2));
        const min_max: MinMax = { min: undefined, max: undefined };
        const paste_event: ClipboardEvent = new ClipboardEvent('paste', { clipboardData: new DataTransfer() });
        paste_event.clipboardData?.setData('Text', '10 - 20');
        vi.spyOn(paste_event, 'preventDefault');

        (fixture.componentInstance as unknown as {
            pasteFromMH(e: ClipboardEvent, mm: MinMax, min: boolean): void;
        })
            .pasteFromMH(paste_event, min_max, true);

        expect(paste_event.preventDefault).toHaveBeenCalled();
        expect(min_max.min).toBe(10);
        expect(min_max.max).toBe(20);
    });

    it('pasteFromMH writes a single pasted value to the targeted field only', async (): Promise<void> => {
        await loadEstimations(makeEstimations(), makeAttackResult(1, 2), makeAttackResult(1, 2));
        const min_max: MinMax = { min: 1, max: 2 };
        const paste_event: ClipboardEvent = new ClipboardEvent('paste', { clipboardData: new DataTransfer() });
        paste_event.clipboardData?.setData('Text', '42');

        (fixture.componentInstance as unknown as {
            pasteFromMH(e: ClipboardEvent, mm: MinMax, min: boolean): void;
        })
            .pasteFromMH(paste_event, min_max, false);

        expect(min_max.min).toBe(1);
        expect(min_max.max).toBe(42);
    });

    it('does not throw on window resize before or after charts exist', async (): Promise<void> => {
        townStatisticsService.getEstimations.mockReturnValue(of());
        townStatisticsService.getAttackCalculation.mockReturnValue(of());
        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(0);
        expect((): boolean => window.dispatchEvent(new Event('resize'))).not.toThrow();

        await loadEstimations(makeEstimations(), makeAttackResult(1, 2), makeAttackResult(1, 2));
        expect((): boolean => window.dispatchEvent(new Event('resize'))).not.toThrow();
    });
});
