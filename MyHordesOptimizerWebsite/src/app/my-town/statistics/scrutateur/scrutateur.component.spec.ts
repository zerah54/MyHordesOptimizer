import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { from, of } from 'rxjs';
import type { MockedObject } from 'vitest';

import { TownStatisticsService } from '../../../_abstract_model/services/town-statistics.service';
import { Regen } from '../../../_abstract_model/types/regen.class';
import { ScrutateurComponent } from './scrutateur.component';

describe('ScrutateurComponent', (): void => {
    let fixture: ComponentFixture<ScrutateurComponent>;
    let townStatisticsService: MockedObject<TownStatisticsService>;

    function makeRegen(day: number, directionRegen: string, levelRegen: number, tauxRegen: number): Regen {
        return new Regen({ day, directionRegen, idTown: 1, levelRegen, tauxRegen });
    }

    beforeEach(async (): Promise<void> => {
        townStatisticsService = {
            getScrutList: vi.fn().mockName('TownStatisticsService.getScrutList')
        } as unknown as MockedObject<TownStatisticsService>;

        await TestBed.configureTestingModule({
            imports: [ScrutateurComponent],
            providers: [
                provideHttpClient(withXhr()), provideHttpClientTesting(), { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                { provide: TownStatisticsService, useValue: townStatisticsService }
            ]
        }).compileComponents();

        // jsdom ne rend pas de vrai contexte 2D (getContext('2d') renvoie null) : Chart.js identifie
        // ses instances par `context.canvas`, donc un contexte null confond TOUS les canvases entre
        // eux (« Canvas is already in use » dès le 2e chart créé). On rend un faux contexte qui
        // pointe vers SON canvas (comparaisons `c.canvas === canvas` correctes) et no-op sur le reste.
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
            return new Proxy({ canvas: this }, {
                get: (target: { canvas: HTMLCanvasElement }, prop: string | symbol): unknown =>
                    prop in target ? target[prop as keyof typeof target] : (() => undefined)
            });
        } as unknown as typeof HTMLCanvasElement.prototype.getContext);

        fixture = TestBed.createComponent(ScrutateurComponent);
    });

    afterEach((): void => {
        // Chart.js suit ses instances dans un registre par canvas au niveau du module : sans
        // destroy() explicite, un chart créé par ce test ferait échouer l'acquisition du contexte
        // 2D du suivant (jsdom n'implémente pas HTMLCanvasElement, ce qui rend ce chemin fragile).
        (fixture?.componentInstance as unknown as { polar_chart?: { destroy(): void } })?.polar_chart?.destroy();
        (fixture?.componentInstance as unknown as { pie_chart?: { destroy(): void } })?.pie_chart?.destroy();
        vi.restoreAllMocks();
    });

    it('renders the column headers before any data has loaded', (): void => {
        townStatisticsService.getScrutList.mockReturnValue(of([]));
        fixture.detectChanges();

        const headers: string[] = Array.from(fixture.nativeElement.querySelectorAll('th') as NodeListOf<Element>)
            .map((th: Element): string => th.textContent?.trim() || '');
        expect(headers).toEqual(['Jour', 'Direction', 'Niveau', 'Taux']);
    });

    it('renders one table row per regen returned by getScrutList()', (): void => {
        townStatisticsService.getScrutList.mockReturnValue(of([
            makeRegen(1, 'Norden', 3, 50),
            makeRegen(2, 'Osten', 2, 30)
        ]));
        fixture.detectChanges();

        const rows: NodeListOf<Element> = fixture.nativeElement.querySelectorAll('tbody tr, tr[mat-row]');
        expect(rows.length).toBe(2);
        expect(fixture.nativeElement.textContent).toContain('Nord');
        expect(fixture.nativeElement.textContent).toContain('Est');
    });

    it('builds the polar and pie charts once the regen list has loaded', async (): Promise<void> => {
        // Émission via Promise (asynchrone, comme une vraie requête HTTP) : le composant lit
        // viewChild.required() dans le callback subscribe, qui n'est résolu qu'après
        // ngAfterViewInit. Un of() synchrone ferait tourner ce callback dès ngOnInit, avant que
        // la query de vue soit prête (NG0951), ce qui ne peut jamais arriver en production.
        townStatisticsService.getScrutList.mockReturnValue(from(Promise.resolve([
            makeRegen(1, 'Norden', 3, 50),
            makeRegen(2, 'Osten', 2, 30)
        ])));
        fixture.detectChanges();
        await new Promise<void>((resolve: () => void): void => { setTimeout(resolve); });
        fixture.detectChanges();

        const component: {
            polar_chart: {
                data: {
                    datasets: {
                        data: number[];
                    }[];
                };
            };
            pie_chart: {
                data: {
                    datasets: {
                        data: number[];
                    }[];
                };
            };
        } = fixture.componentInstance as unknown as {
            polar_chart: {
                data: {
                    datasets: {
                        data: number[];
                    }[];
                };
            };
            pie_chart: {
                data: {
                    datasets: {
                        data: number[];
                    }[];
                };
            };
        };
        expect(component.polar_chart).toBeDefined();
        expect(component.pie_chart).toBeDefined();
        expect(component.polar_chart.data.datasets[0].data.reduce((a: number, b: number): number => a + b, 0)).toBe(2);
        expect(component.pie_chart.data.datasets[0].data.reduce((a: number, b: number): number => a + b, 0)).toBe(2);
    });

    it('renders an empty table when getScrutList() returns no regen', (): void => {
        townStatisticsService.getScrutList.mockReturnValue(of([]));
        fixture.detectChanges();

        const rows: NodeListOf<Element> = fixture.nativeElement.querySelectorAll('tbody tr, tr[mat-row]');
        expect(rows.length).toBe(0);
    });
});
