import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { TownStatisticsService } from '../../../_abstract_model/services/town-statistics.service';
import { Regen } from '../../../_abstract_model/types/regen.class';
import { ScrutateurComponent } from './scrutateur.component';

describe('ScrutateurComponent', (): void => {
    let fixture: ComponentFixture<ScrutateurComponent>;
    let townStatisticsService: jasmine.SpyObj<TownStatisticsService>;

    function makeRegen(day: number, directionRegen: string, levelRegen: number, tauxRegen: number): Regen {
        return new Regen({ day, directionRegen, idTown: 1, levelRegen, tauxRegen });
    }

    beforeEach(async (): Promise<void> => {
        townStatisticsService = jasmine.createSpyObj<TownStatisticsService>('TownStatisticsService', ['getScrutList']);

        await TestBed.configureTestingModule({
            imports: [ScrutateurComponent],
            providers: [
                provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations(),
                { provide: TownStatisticsService, useValue: townStatisticsService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ScrutateurComponent);
    });

    it('renders the column headers before any data has loaded', (): void => {
        townStatisticsService.getScrutList.and.returnValue(of([]));
        fixture.detectChanges();

        const headers: string[] = Array.from(fixture.nativeElement.querySelectorAll('th') as NodeListOf<Element>)
            .map((th: Element): string => th.textContent?.trim() || '');
        expect(headers).toEqual(['Jour', 'Direction', 'Niveau', 'Taux']);
    });

    it('renders one table row per regen returned by getScrutList()', (): void => {
        townStatisticsService.getScrutList.and.returnValue(of([
            makeRegen(1, 'Norden', 3, 50),
            makeRegen(2, 'Osten', 2, 30)
        ]));
        fixture.detectChanges();

        const rows: NodeListOf<Element> = fixture.nativeElement.querySelectorAll('tbody tr, tr[mat-row]');
        expect(rows.length).toBe(2);
        expect(fixture.nativeElement.textContent).toContain('Nord');
        expect(fixture.nativeElement.textContent).toContain('Est');
    });

    it('builds the polar and pie charts once the regen list has loaded', (): void => {
        townStatisticsService.getScrutList.and.returnValue(of([
            makeRegen(1, 'Norden', 3, 50),
            makeRegen(2, 'Osten', 2, 30)
        ]));
        fixture.detectChanges();

        const component: { polar_chart: { data: { datasets: { data: number[] }[] } }; pie_chart: { data: { datasets: { data: number[] }[] } } } =
            fixture.componentInstance as unknown as { polar_chart: { data: { datasets: { data: number[] }[] } }; pie_chart: { data: { datasets: { data: number[] }[] } } };
        expect(component.polar_chart).toBeDefined();
        expect(component.pie_chart).toBeDefined();
        expect(component.polar_chart.data.datasets[0].data.reduce((a: number, b: number): number => a + b, 0)).toBe(2);
        expect(component.pie_chart.data.datasets[0].data.reduce((a: number, b: number): number => a + b, 0)).toBe(2);
    });

    it('renders an empty table when getScrutList() returns no regen', (): void => {
        townStatisticsService.getScrutList.and.returnValue(of([]));
        fixture.detectChanges();

        const rows: NodeListOf<Element> = fixture.nativeElement.querySelectorAll('tbody tr, tr[mat-row]');
        expect(rows.length).toBe(0);
    });
});
