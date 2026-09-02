import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject } from 'rxjs';

import { PLANIF_VALUES, TDG_VALUES } from '../../../_abstract_model/const';
import { MinMax } from '../../../_abstract_model/interfaces';
import { TownStatisticsService } from '../../../_abstract_model/services/town-statistics.service';
import { Dictionary } from '../../../_abstract_model/types/_types';
import { Estimations } from '../../../_abstract_model/types/estimations.class';
import { EstimationsResult } from '../../../_abstract_model/types/estimations-result.class';
import { TownDetails } from '../../../_abstract_model/types/town-details.class';
import { ClipboardService } from '../../../_core/services/clipboard.service';
import { TownContextService } from '../../../_core/services/town-context.service';
import { setTown } from '../../../_core/utilities/localstorage.util';
import { EstimationsComponent } from './estimations.component';

describe('EstimationsComponent', (): void => {
    let fixture: ComponentFixture<EstimationsComponent>;
    let townStatisticsService: jasmine.SpyObj<TownStatisticsService>;
    let clipboardService: jasmine.SpyObj<ClipboardService>;
    let townContextService: TownContextService;

    /** Estimations avec toutes les clés TDG/planif présentes (min/max vides), overridables. */
    function makeEstimations(overrides: { estim?: Dictionary<Partial<MinMax>>; planif?: Dictionary<Partial<MinMax>> } = {}): Estimations {
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

        townStatisticsService = jasmine.createSpyObj<TownStatisticsService>('TownStatisticsService', ['getEstimations', 'getAttackCalculation', 'saveEstimations']);
        clipboardService = jasmine.createSpyObj<ClipboardService>('ClipboardService', ['copy']);

        await TestBed.configureTestingModule({
            imports: [EstimationsComponent],
            providers: [
                provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations(),
                { provide: TownStatisticsService, useValue: townStatisticsService },
                { provide: ClipboardService, useValue: clipboardService }
            ]
        }).compileComponents();

        townContextService = TestBed.inject(TownContextService);
        townContextService.clear();

        fixture = TestBed.createComponent(EstimationsComponent);
    });

    afterEach((): void => {
        setTown(null);
        townContextService.clear();
    });

    /**
     * Charge le composant en interleaving les 3 réponses HTTP (estimations, attaque J, attaque
     * J+1) avec des `detectChanges()` intermédiaires : les canvases sont derrière `@if
     * (estimations)`, `viewChild.required` lèverait NG0951 si tout était flushé en un seul tick.
     * `tick()` après chaque `detectChanges()` : `NgModel._updateValue` écrit la valeur DOM dans un
     * micro-tâche (`resolvedPromise.then(...)`), pas synchrone à l'intérieur de `detectChanges()`.
     * Doit être appelée depuis un test `fakeAsync`.
     */
    function loadEstimations(estimations: Estimations, today_attack: EstimationsResult, tomorrow_attack: EstimationsResult): void {
        const estimations$: Subject<Estimations> = new Subject();
        const today$: Subject<EstimationsResult> = new Subject();
        const tomorrow$: Subject<EstimationsResult> = new Subject();
        townStatisticsService.getEstimations.and.callFake((day: number) => day === 10 ? estimations$.asObservable() : of(makeEstimations()));
        townStatisticsService.getAttackCalculation.and.callFake((day: number) => day === 10 ? today$.asObservable() : tomorrow$.asObservable());

        fixture.detectChanges();
        tick();
        estimations$.next(estimations);
        fixture.detectChanges();
        tick();
        today$.next(today_attack);
        tomorrow$.next(tomorrow_attack);
        fixture.detectChanges();
        tick();
    }

    it('renders nothing until estimations has loaded', (): void => {
        townStatisticsService.getEstimations.and.returnValue(of());
        townStatisticsService.getAttackCalculation.and.returnValue(of());
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.tables')).toBeNull();
    });

    it('renders the TDG/planif tables and the calculated attack once everything has loaded', fakeAsync((): void => {
        loadEstimations(
            makeEstimations({ estim: { _33: { min: 10, max: 20 } } }),
            makeAttackResult(5, 15),
            makeAttackResult(6, 16)
        );

        expect(fixture.nativeElement.querySelector('.tables')).not.toBeNull();
        const tdg_min_input: HTMLInputElement = fixture.nativeElement.querySelector('table input');
        expect(tdg_min_input.value).toBe('10');
        expect(fixture.nativeElement.textContent).toContain('[5');
        expect(fixture.nativeElement.textContent).toContain('16]');
    }));

    it('shows the save button when not in observer/readonly mode, hides it otherwise', fakeAsync((): void => {
        loadEstimations(makeEstimations(), makeAttackResult(1, 2), makeAttackResult(1, 2));
        expect(findSaveButton()).not.toBeUndefined();

        townContextService.setObservedTown(new TownDetails());
        fixture.detectChanges();
        expect(findSaveButton()).toBeUndefined();
    }));

    it('saveEstimations posts the current estimations then reloads them', fakeAsync((): void => {
        loadEstimations(makeEstimations(), makeAttackResult(1, 2), makeAttackResult(1, 2));
        townStatisticsService.saveEstimations.and.returnValue(of(undefined));
        townStatisticsService.getEstimations.calls.reset();
        townStatisticsService.getEstimations.and.returnValue(of(makeEstimations()));
        townStatisticsService.getAttackCalculation.and.returnValue(of());

        findSaveButton()?.click();
        tick();

        expect(townStatisticsService.saveEstimations).toHaveBeenCalledTimes(1);
        expect(townStatisticsService.getEstimations).toHaveBeenCalledTimes(1);
    }));

    it('copies a forum-formatted summary via ClipboardService', fakeAsync((): void => {
        loadEstimations(makeEstimations({ estim: { _33: { min: 10, max: 20 } } }), makeAttackResult(1, 2), makeAttackResult(1, 2));

        const share_button: HTMLButtonElement | undefined = Array.from(fixture.nativeElement.querySelectorAll('.actions button') as NodeListOf<HTMLButtonElement>)
            .find((button: HTMLButtonElement): boolean => button.textContent?.includes('share') === true);
        share_button?.click();

        expect(clipboardService.copy).toHaveBeenCalledTimes(1);
        expect((clipboardService.copy.calls.mostRecent().args[0] as string)).toContain('J10');
    }));

    it('pasteFromMH splits a "min - max" pasted range across both fields', fakeAsync((): void => {
        loadEstimations(makeEstimations(), makeAttackResult(1, 2), makeAttackResult(1, 2));
        const min_max: MinMax = { min: undefined, max: undefined };
        const paste_event: ClipboardEvent = new ClipboardEvent('paste', { clipboardData: new DataTransfer() });
        paste_event.clipboardData?.setData('Text', '10 - 20');
        spyOn(paste_event, 'preventDefault');

        (fixture.componentInstance as unknown as { pasteFromMH(e: ClipboardEvent, mm: MinMax, min: boolean): void })
            .pasteFromMH(paste_event, min_max, true);

        expect(paste_event.preventDefault).toHaveBeenCalled();
        expect(min_max.min).toBe(10);
        expect(min_max.max).toBe(20);
    }));

    it('pasteFromMH writes a single pasted value to the targeted field only', fakeAsync((): void => {
        loadEstimations(makeEstimations(), makeAttackResult(1, 2), makeAttackResult(1, 2));
        const min_max: MinMax = { min: 1, max: 2 };
        const paste_event: ClipboardEvent = new ClipboardEvent('paste', { clipboardData: new DataTransfer() });
        paste_event.clipboardData?.setData('Text', '42');

        (fixture.componentInstance as unknown as { pasteFromMH(e: ClipboardEvent, mm: MinMax, min: boolean): void })
            .pasteFromMH(paste_event, min_max, false);

        expect(min_max.min).toBe(1);
        expect(min_max.max).toBe(42);
    }));

    it('does not throw on window resize before or after charts exist', fakeAsync((): void => {
        townStatisticsService.getEstimations.and.returnValue(of());
        townStatisticsService.getAttackCalculation.and.returnValue(of());
        fixture.detectChanges();
        tick();
        expect((): boolean => window.dispatchEvent(new Event('resize'))).not.toThrow();

        loadEstimations(makeEstimations(), makeAttackResult(1, 2), makeAttackResult(1, 2));
        expect((): boolean => window.dispatchEvent(new Event('resize'))).not.toThrow();
    }));
});
