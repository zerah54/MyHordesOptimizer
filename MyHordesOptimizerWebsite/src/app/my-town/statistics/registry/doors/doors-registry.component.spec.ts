import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { Entry } from '../../../../_abstract_model/interfaces';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { CitizenInfo } from '../../../../_abstract_model/types/citizen-info.class';
import { DoorsRegistryComponent } from './doors-registry.component';

describe('DoorsRegistryComponent', (): void => {
    let fixture: ComponentFixture<DoorsRegistryComponent>;

    function makeCitizen(id: number, name: string): Citizen {
        return Object.assign(new Citizen(), { id, name });
    }

    function makeCitizenList(citizens: Citizen[]): CitizenInfo {
        const list: CitizenInfo = new CitizenInfo();
        list.citizens = citizens;
        return list;
    }

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [DoorsRegistryComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(DoorsRegistryComponent);
        fixture.componentRef.setInput('completeCitizenList', makeCitizenList([makeCitizen(1, 'Alice'), makeCitizen(2, 'Bob')]));
        fixture.componentRef.setInput('displayPseudo', 'simple');
    });

    it('renders the canvas placeholder before any registry entry has been processed', (): void => {
        fixture.componentRef.setInput('registry', undefined);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('canvas')).not.toBeNull();
        expect((fixture.componentInstance as unknown as { doors_chart: unknown }).doors_chart).toBeUndefined();
    });

    it('builds a bar chart from entering/leaving door entries once the registry is set and the timer flushes', fakeAsync((): void => {
        const registry: Entry[] = [
            { hour: '8:00', entry: 'Alice est de retour en ville' },
            { hour: '20:00', entry: 'Bob a quitté la ville' }
        ];
        fixture.componentRef.setInput('registry', registry);
        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        const chart: { data: { labels: string[] } } = (fixture.componentInstance as unknown as { doors_chart: { data: { labels: string[] } } }).doors_chart;
        expect(chart).toBeDefined();
        expect(chart.data.labels).toEqual(['Alice', 'Bob']);
    }));

    it('leaves the previously built chart untouched when registry becomes undefined', fakeAsync((): void => {
        const registry: Entry[] = [{ hour: '8:00', entry: 'Alice est de retour en ville' }];
        fixture.componentRef.setInput('registry', registry);
        fixture.detectChanges();
        tick();
        fixture.detectChanges();
        const chart_after_first_set: unknown = (fixture.componentInstance as unknown as { doors_chart: unknown }).doors_chart;

        fixture.componentRef.setInput('registry', undefined);
        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        expect((fixture.componentInstance as unknown as { doors_chart: unknown }).doors_chart).toBe(chart_after_first_set);
    }));
});
