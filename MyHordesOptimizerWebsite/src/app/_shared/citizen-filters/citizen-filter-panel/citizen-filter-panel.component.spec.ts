import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyActionEnum } from '../../../_abstract_model/enum/daily-action.enum';
import { HomeEnum } from '../../../_abstract_model/enum/home.enum';
import { JobEnum } from '../../../_abstract_model/enum/job.enum';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenFilterSortStore } from '../citizen-filter-sort.store';
import { CitizenFilterPanelComponent } from './citizen-filter-panel.component';

describe('CitizenFilterPanelComponent', (): void => {
    let fixture: ComponentFixture<CitizenFilterPanelComponent>;
    let store: CitizenFilterSortStore;

    beforeEach(async (): Promise<void> => {
        store = new CitizenFilterSortStore();
        await TestBed.configureTestingModule({
            imports: [CitizenFilterPanelComponent],
            providers: [{ provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' }, { provide: CitizenFilterSortStore, useValue: store }]
        }).compileComponents();
        fixture = TestBed.createComponent(CitizenFilterPanelComponent);
        fixture.componentRef.setInput('citizens', [Object.assign(new Citizen(), { id: 1, name: 'Alice', job: JobEnum.SCAVENGER })]);
        fixture.componentRef.setInput('items', []);
        fixture.componentRef.setInput('daily_actions', [DailyActionEnum.HOME_POOL]);
        fixture.componentRef.setInput('value_options', { ['home_' + HomeEnum.HOUSE_LEVEL.key]: [0, 1] });
        fixture.detectChanges();
    });

    function root(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    it('un clic sur une action quotidienne fait tourner son filtre oui / non', (): void => {
        root().querySelector<HTMLButtonElement>('[data-filter="daily_home_pool"]')?.click();

        expect(store.boolValue('daily_home_pool')).toBe(true);
    });

    it('propose les niveaux de maison présents et retient ceux choisis', (): void => {
        const toggles: HTMLButtonElement[] = Array.from(root().querySelectorAll<HTMLButtonElement>(`[data-filter="home_${HomeEnum.HOUSE_LEVEL.key}"] button`));
        expect(toggles.map((toggle: HTMLButtonElement): string => toggle.textContent?.trim() ?? '')).toEqual(['0', '1']);

        toggles[0].click();

        expect(store.values('home_' + HomeEnum.HOUSE_LEVEL.key)).toEqual([0]);
    });

    it('réinitialiser retire les critères ; fermer prévient la page', (): void => {
        const closed: string[] = [];
        fixture.componentInstance.closed.subscribe((): void => {
            closed.push('closed');
        });
        store.setJobs([JobEnum.SCAVENGER.key]);
        fixture.detectChanges();

        root().querySelector<HTMLButtonElement>('[data-action="reset-citizen-filters"]')?.click();
        root().querySelector<HTMLButtonElement>('[data-action="close-citizen-filters"]')?.click();

        expect(store.active_count()).toBe(0);
        expect(closed).toEqual(['closed']);
    });
});
