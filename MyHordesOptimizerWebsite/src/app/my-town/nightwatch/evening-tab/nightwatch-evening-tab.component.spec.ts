import { ANIMATION_MODULE_TYPE, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { StatusEnum } from '../../../_abstract_model/enum/status.enum';
import { ApiService } from '../../../_abstract_model/services/api.service';
import { Item } from '../../../_abstract_model/types/item.class';
import { ListElementAddRemoveComponent } from '../../../_shared/list-elements-add-remove/list-element-add-remove.component';
import { NightwatchStore } from '../nightwatch.store';
import { createFakeNightwatchStore, FAKE_NIGHTWATCH_STATE, FakeNightwatchStore } from '../nightwatch.store.fake';
import { emptyNightwatchContent, NightwatchCitizenStateDTO, NightwatchPlanDTO, NightwatchStateDTO } from '../nightwatch.types';
import { WatcherGap } from '../nightwatch-compare.util';
import { NightwatchEveningTabComponent } from './nightwatch-evening-tab.component';

const HOUR_MS: number = 3600000;

function gap(overrides: Partial<WatcherGap> = {}): WatcherGap {
    return {
        user_id: 1, planned_risk: 0, real_risk: 0, planned_defense: 40, real_defense: 40, missing_items: {}, extra_items: {}, missing_statuses: [],
        tier_planned: 'certain', tier_real: 'certain', to_contact: false, ...overrides
    };
}

function citizens(bag_updated_at: string | null): NightwatchCitizenStateDTO[] {
    return FAKE_NIGHTWATCH_STATE.citizens.map((citizen: NightwatchCitizenStateDTO): NightwatchCitizenStateDTO => ({ ...citizen, bagUpdatedAt: bag_updated_at }));
}

describe('NightwatchEveningTabComponent', (): void => {
    let fake: FakeNightwatchStore;
    let fixture: ComponentFixture<NightwatchEveningTabComponent>;

    async function render(gaps: WatcherGap[], margin: number | null = 10, bag_age_hours: number | null = 1): Promise<void> {
        fake = createFakeNightwatchStore();
        fake.gaps.set(gaps);
        fake.totals.set({ defense: 80, real_defense: 70, planned_margin: 999, real_margin: margin, cost: { repair_pa: 0, batteries: 0, water: 0 }, watcher_count: gaps.length, cap: 4 });
        fake.state.set({
            ...FAKE_NIGHTWATCH_STATE,
            citizens: citizens(bag_age_hours === null ? null : new Date(Date.now() - bag_age_hours * HOUR_MS).toISOString())
        });
        const portiere: Item = Object.assign(new Item(), { id: 5, uid: 'portiere', label: { fr: 'Portière', en: 'Portière', de: 'Portière', es: 'Portière' }, img: 'item/item_portiere.gif' });
        await TestBed.configureTestingModule({
            imports: [NightwatchEveningTabComponent],
            providers: [
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                { provide: NightwatchStore, useValue: fake.store },
                { provide: ApiService, useValue: { getItems: vi.fn((): unknown => of([portiere])) } }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(NightwatchEveningTabComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function root(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    function text(selector: string): string {
        return (root().querySelector(selector)?.textContent ?? '').replace(/\s+/g, ' ').trim();
    }

    afterEach((): void => {
        TestBed.resetTestingModule();
    });

    it('veilleur sans la portière prévue : à contacter, objet manquant, risque réel au-dessus du prévu', async (): Promise<void> => {
        await render([gap({ missing_items: { 5: 1 }, real_risk: 0.3, planned_risk: 0.0833, tier_real: 't30', to_contact: true })]);

        const row: HTMLElement = root().querySelector('tr[data-user="1"]') as HTMLElement;
        expect(row.querySelector('[data-field="to-contact"]')).not.toBeNull();
        expect((row.querySelector('[data-field="missing-items"]')?.textContent ?? '')).toContain('Portière');
        expect((row.querySelector('[data-field="risk"]')?.textContent ?? '')).toContain('8.33');
        expect((row.querySelector('[data-field="risk"]')?.textContent ?? '')).toContain('30');
        expect(row.textContent).toContain('Alice');
    });

    it('sacs prévu et réel côte à côte : le réel compte aussi les objets hors veille', async (): Promise<void> => {
        await render([gap()]);
        fake.draft.set({ ...emptyNightwatchContent(), watchers: [{ userId: 1, statuses: [], items: { 5: 1 }, pastWatches: null, hasDiscourse: false }] });
        fake.state.update((state: NightwatchStateDTO | null): NightwatchStateDTO | null => state === null ? null : {
            ...state,
            citizens: state.citizens.map((citizen: NightwatchCitizenStateDTO): NightwatchCitizenStateDTO => citizen.userId === 1 ? { ...citizen, bag: { 5: 1, 9: 2 } } : citizen)
        });
        fixture.detectChanges();

        const bags: ListElementAddRemoveComponent[] = fixture.debugElement.queryAll(By.css('td[data-field="bags"] mho-list-element-add-remove'))
            .map((element: DebugElement): ListElementAddRemoveComponent => element.componentInstance as ListElementAddRemoveComponent);
        const capacities: string[] = Array.from(root().querySelectorAll('td[data-field="bags"] .bag-capacity'))
            .map((element: Element): string => (element.textContent ?? '').replace(/\s+/g, ' ').trim());
        expect(bags.length).toBe(2);
        expect(bags.every((bag: ListElementAddRemoveComponent): boolean => bag.readonly())).toBe(true);
        expect(bags[0].currentList().length).toBe(1);
        expect(bags[1].currentList().length).toBe(1);
        expect(capacities).toEqual(['1 / 4+?', '3 / 4+?']);
    });

    it('tous conformes : aucune ligne à contacter', async (): Promise<void> => {
        await render([gap(), gap({ user_id: 3 })]);

        expect(root().querySelectorAll('[data-field="to-contact"]').length).toBe(0);
        expect(root().querySelectorAll('tr[data-user]').length).toBe(2);
    });

    it('statuts manquants et objets en trop affichés', async (): Promise<void> => {
        await render([gap({ missing_statuses: ['drugged'], extra_items: { 5: 2 }, to_contact: true })]);

        expect(text('[data-field="missing-statuses"]')).toBe(StatusEnum.DRUGGED.label);
        expect(text('[data-field="extra-items"]')).toContain('Portière');
    });

    it('marge négative mise en évidence, avec repère textuel', async (): Promise<void> => {
        await render([gap()], -25);

        const margin: HTMLElement = root().querySelector('[data-field="margin"]') as HTMLElement;
        expect(margin.classList.contains('negative')).toBe(true);
        expect(margin.textContent).toContain('-25');
        expect(root().querySelector('[data-field="margin-warning"]')).not.toBeNull();
    });

    it('marge positive : pas de mise en évidence ; attaque inconnue : pas de marge', async (): Promise<void> => {
        await render([gap()], 12);
        expect((root().querySelector('[data-field="margin"]') as HTMLElement).classList.contains('negative')).toBe(false);
        expect(root().querySelector('[data-field="margin-warning"]')).toBeNull();
        TestBed.resetTestingModule();

        await render([gap()], null);
        expect(root().querySelector('[data-field="margin"]')).toBeNull();
        expect(root().querySelector('[data-field="margin-unknown"]')).not.toBeNull();
    });

    it('totaux indisponibles : message explicite', async (): Promise<void> => {
        await render([gap()]);
        fake.totals.set(null);
        fixture.detectChanges();

        expect(root().querySelector('[data-field="no-totals"]')).not.toBeNull();
        expect(root().querySelector('[data-field="planned-total"]')).toBeNull();
    });

    it('statuts du chien : marqués prévu, non vérifié', async (): Promise<void> => {
        await render([gap()]);
        fake.draft.set({ instructions: null, manualStock: {}, watchers: [{ userId: 1, statuses: ['dog', 'drugged'], items: {}, hasDiscourse: false }] });
        fixture.detectChanges();

        const mark: string = text('tr[data-user="1"] [data-field="unverified-statuses"]');
        expect(mark).toContain('Chien');
        expect(mark).toContain('non vérifié');
        expect(mark).not.toContain(StatusEnum.DRUGGED.label);
    });

    it('aucun statut de chien : pas de marque', async (): Promise<void> => {
        await render([gap()]);

        expect(root().querySelector('[data-field="unverified-statuses"]')).toBeNull();
    });

    it('totaux prévu / réel', async (): Promise<void> => {
        await render([gap()]);

        expect(text('[data-field="planned-total"]')).toContain('80');
        expect(text('[data-field="real-total"]')).toContain('70');
    });

    it('données de sac périmées : alerte ; fraîches : aucune', async (): Promise<void> => {
        await render([gap()], 10, 72);
        expect(root().querySelector('[data-field="stale-bags"]')).not.toBeNull();
        TestBed.resetTestingModule();

        await render([gap()], 10, 1);
        expect(root().querySelector('[data-field="stale-bags"]')).toBeNull();
    });

    it('données de sac jamais mises à jour : alerte', async (): Promise<void> => {
        await render([gap()], 10, null);

        expect(root().querySelector('[data-field="stale-bags"]')).not.toBeNull();
    });

    it('proposition affichée non effective : état vide explicite', async (): Promise<void> => {
        await render([gap()]);
        const plan: NightwatchPlanDTO = { ...(fake.selected_plan() as NightwatchPlanDTO), isEffective: false };
        fake.selected_plan.set(plan);
        fake.plans_of_day.set([plan]);
        fixture.detectChanges();

        expect(root().querySelector('[data-field="no-effective"]')).not.toBeNull();
        expect(root().querySelector('table')).toBeNull();
    });

    it('aucune proposition : état vide explicite', async (): Promise<void> => {
        await render([]);
        fake.selected_plan.set(null);
        fake.plans_of_day.set([]);
        fixture.detectChanges();

        expect(root().querySelector('[data-field="no-effective"]')).not.toBeNull();
    });

    it('en-têtes de colonnes avec scope', async (): Promise<void> => {
        await render([gap()]);

        const headers: HTMLElement[] = Array.from(root().querySelectorAll<HTMLElement>('th'));
        expect(headers.length).toBeGreaterThan(0);
        expect(headers.every((header: HTMLElement): boolean => header.getAttribute('scope') === 'col')).toBe(true);
    });
});
