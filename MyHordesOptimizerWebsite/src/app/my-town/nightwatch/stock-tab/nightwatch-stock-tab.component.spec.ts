import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';

import { ApiService } from '../../../_abstract_model/services/api.service';
import { Item } from '../../../_abstract_model/types/item.class';
import { StockLine } from '../nightwatch-stock.util';
import { NightwatchStore } from '../nightwatch.store';
import { createFakeNightwatchStore, FakeNightwatchStore } from '../nightwatch.store.fake';
import { BuildingNeeds, NightwatchBuildingNeedsService } from './building-needs.service';
import { NightwatchStockTabComponent } from './nightwatch-stock-tab.component';

function line(overrides: Partial<StockLine> = {}): StockLine {
    return {
        item_id: 5, need: 6, in_bag: 1, in_chests: 2, in_bank: 1, in_desert: 0, manual: 0, broken_in_town: 0,
        available_in_town: 4, remaining: 2, stale_chest: false, unknown_age: false, oldest_chest_update: null, ...overrides
    };
}

describe('NightwatchStockTabComponent', (): void => {
    let fake: FakeNightwatchStore;
    let fixture: ComponentFixture<NightwatchStockTabComponent>;
    let needs_of_day: Mock;

    async function render(lines: StockLine[], building_needs: BuildingNeeds = { status: 'unavailable', needs: [] }, items$: Observable<Item[]> | null = null): Promise<void> {
        fake = createFakeNightwatchStore();
        fake.stock_lines.set(lines);
        fake.totals.set({ defense: 0, real_defense: 0, planned_margin: null, real_margin: null, cost: { repair_pa: 12, batteries: 3, water: 2 }, watcher_count: 1, cap: 4 });
        const wood: Item = Object.assign(new Item(), { id: 5, uid: 'wood', label: { fr: 'Bois', en: 'Bois', de: 'Bois', es: 'Bois' }, img: 'item/item_wood.gif' });
        const metal: Item = Object.assign(new Item(), { id: 6, uid: 'metal', label: { fr: 'Ferraille', en: 'Ferraille', de: 'Ferraille', es: 'Ferraille' }, img: 'item/item_metal.gif' });
        needs_of_day = vi.fn((): unknown => of(building_needs));
        await TestBed.configureTestingModule({
            imports: [NightwatchStockTabComponent],
            providers: [
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                { provide: NightwatchStore, useValue: fake.store },
                { provide: ApiService, useValue: { getItems: vi.fn((): unknown => items$ ?? of([wood, metal])) } },
                { provide: NightwatchBuildingNeedsService, useValue: { needsOfDay: needs_of_day } }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(NightwatchStockTabComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function root(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    function row(item_id: number): HTMLElement {
        return root().querySelector<HTMLElement>(`tr[data-item="${item_id}"]`) as HTMLElement;
    }

    function cell(item_id: number, field: string): string {
        return (row(item_id).querySelector(`[data-field="${field}"]`)?.textContent ?? '').replace(/\s+/g, ' ').trim();
    }

    afterEach((): void => {
        TestBed.resetTestingModule();
    });

    it('une ligne par objet du bilan, avec libellé et sources', async (): Promise<void> => {
        await render([line(), line({ item_id: 6, need: 1, in_bag: 1, in_chests: 0, in_bank: 0, remaining: 0 })]);

        expect(root().querySelectorAll('tr[data-item]').length).toBe(2);
        expect(row(5).textContent).toContain('Bois');
        expect(cell(5, 'need')).toBe('6');
        expect(cell(5, 'in-bag')).toBe('1');
        expect(cell(5, 'in-chests')).toContain('2');
        expect(cell(5, 'in-bank')).toBe('1');
        expect(row(6).textContent).toContain('Ferraille');
    });

    it('reste à trouver : mis en évidence au-dessus de 0, jamais de signe négatif', async (): Promise<void> => {
        await render([line(), line({ item_id: 6, remaining: 0, available_in_town: 9 })]);

        expect(cell(5, 'remaining')).toMatch(/^2/);
        expect(row(5).classList.contains('missing')).toBe(true);
        expect(cell(6, 'remaining')).toBe('0');
        expect(row(6).classList.contains('missing')).toBe(false);
        expect(root().textContent).not.toMatch(/-[0-9]/);
    });

    it('pastille « périmé » et « âge inconnu » sur les coffres concernés', async (): Promise<void> => {
        await render([line({ stale_chest: true }), line({ item_id: 6, unknown_age: true })]);

        expect(row(5).querySelector('[data-badge="stale"]')?.textContent).toContain('périmé');
        expect(row(5).querySelector('[data-badge="unknown-age"]')).toBeNull();
        expect(row(6).querySelector('[data-badge="unknown-age"]')?.textContent).toContain('âge inconnu');
        expect(row(6).querySelector('[data-badge="stale"]')).toBeNull();
    });

    it('date de mise à jour des coffres affichée quand elle est connue, absente sinon', async (): Promise<void> => {
        await render([line({ in_chests: 2, oldest_chest_update: '2026-11-10T10:00:00Z' }), line({ item_id: 6, in_chests: 1, oldest_chest_update: null })]);

        expect(row(5).querySelector('[data-field="chest-date"]')?.textContent?.trim().length).toBeGreaterThan(0);
        expect(row(6).querySelector('[data-field="chest-date"]')).toBeNull();
    });

    it('échec du catalogue des objets : le bilan se rend', async (): Promise<void> => {
        await render([line()], { status: 'unavailable', needs: [] }, throwError((): Error => new Error('api')));

        expect(row(5)).not.toBeNull();
    });

    it('désert marqué à rapatrier, unités cassées en ville en information', async (): Promise<void> => {
        await render([line({ in_desert: 3, broken_in_town: 2 })]);

        expect(cell(5, 'in-desert')).toContain('3');
        expect(cell(5, 'in-desert')).toContain('à rapatrier');
        expect(cell(5, 'broken')).toBe('2');
    });

    it('la saisie manuelle appelle setManualStock avec une quantité entière positive', async (): Promise<void> => {
        await render([line({ manual: 1 })]);
        const input: HTMLInputElement = row(5).querySelector<HTMLInputElement>('input[data-field="manual"]') as HTMLInputElement;

        expect(input.value).toBe('1');
        input.value = '4';
        input.dispatchEvent(new Event('change'));
        input.value = '-3';
        input.dispatchEvent(new Event('change'));

        expect(fake.actions.setManualStock).toHaveBeenNthCalledWith(1, 5, 4);
        expect(fake.actions.setManualStock).toHaveBeenNthCalledWith(2, 5, 0);
    });

    it('la saisie manuelle est désactivée quand can_edit est faux', async (): Promise<void> => {
        await render([line()]);
        fake.can_edit.set(false);
        fixture.detectChanges();

        expect(row(5).querySelector<HTMLInputElement>('input[data-field="manual"]')?.disabled).toBe(true);
    });

    it('affiche le coût : PA de réparation, piles et eau', async (): Promise<void> => {
        await render([line()]);

        expect(root().querySelector('[data-block="cost"] mho-icon-ap')).not.toBeNull();
        expect(root().querySelector('[data-field="repair-pa"]')?.textContent).toContain('12');
        expect(root().querySelector('[data-field="batteries"]')?.textContent).toContain('3');
        expect(root().querySelector('[data-field="water"]')?.textContent).toContain('2');
    });

    it('état vide sans objet attribué', async (): Promise<void> => {
        await render([]);

        expect(root().querySelector('table')).toBeNull();
        expect(root().querySelector('[data-field="no-stock"]')).not.toBeNull();
    });

    it('consommation des chantiers : lignes distinctes du bilan quand un plan effectif existe', async (): Promise<void> => {
        await render([line()], { status: 'ready', needs: [{ itemId: 6, count: 4 }] });

        expect(needs_of_day).toHaveBeenCalledWith(10, 10);
        expect(root().querySelectorAll('tr[data-item]').length).toBe(1);
        const consumption: HTMLElement = root().querySelector('[data-block="buildings"]') as HTMLElement;
        expect(consumption.querySelectorAll('tr[data-building-item]').length).toBe(1);
        expect(consumption.textContent).toContain('Ferraille');
        expect(consumption.querySelector('[data-field="building-need"]')?.textContent).toContain('4');
    });

    it('consommation des chantiers : état vide explicite sans plan effectif, sans erreur', async (): Promise<void> => {
        await render([line()], { status: 'unavailable', needs: [] });

        const consumption: HTMLElement = root().querySelector('[data-block="buildings"]') as HTMLElement;
        expect(consumption.querySelectorAll('tr[data-building-item]').length).toBe(0);
        expect(consumption.querySelector('[data-field="buildings-unavailable"]')).not.toBeNull();
        expect(root().querySelector('[role="alert"]')).toBeNull();
    });

    it('consommation des chantiers : plan effectif sans objet requis', async (): Promise<void> => {
        await render([line()], { status: 'ready', needs: [] });

        expect(root().querySelector('[data-field="buildings-none"]')).not.toBeNull();
    });

    it('une saisie invalide est réécrite normalisée dans le champ affiché', async (): Promise<void> => {
        await render([line({ manual: 0 })]);
        const input: HTMLInputElement = row(5).querySelector<HTMLInputElement>('input[data-field="manual"]') as HTMLInputElement;

        for (const [typed, shown] of [['-3', '0'], ['abc', '0'], ['2.7', '2']]) {
            input.value = typed;
            input.dispatchEvent(new Event('change'));
            fixture.detectChanges();
            expect(input.value).toBe(shown);
        }
        expect(fake.actions.setManualStock).toHaveBeenLastCalledWith(5, 2);
    });

    it('champs de saisie nommés par objet, en-têtes avec scope', async (): Promise<void> => {
        await render([line()]);

        expect(row(5).querySelector('input[data-field="manual"]')?.getAttribute('aria-label')).toContain('Bois');
        const heads: HTMLElement[] = Array.from(root().querySelectorAll<HTMLElement>('th'));
        expect(heads.length).toBeGreaterThan(0);
        expect(heads.every((head: HTMLElement): boolean => head.getAttribute('scope') === 'col')).toBe(true);
    });

    it('reste à trouver > 0 porte un repère textuel, pas seulement la couleur', async (): Promise<void> => {
        await render([line(), line({ item_id: 6, remaining: 0 })]);

        expect(row(5).querySelector('[data-field="missing-mark"]')).not.toBeNull();
        expect(row(6).querySelector('[data-field="missing-mark"]')).toBeNull();
    });

    it('consommation des chantiers : texte de chargement tant que le calcul n\'a pas répondu', async (): Promise<void> => {
        await render([line()], { status: 'loading', needs: [] });

        expect(root().querySelector('[data-field="buildings-loading"]')).not.toBeNull();
    });

    it('consommation des chantiers : recalculée quand le jour affiché change', async (): Promise<void> => {
        await render([line()]);

        fake.selected_day.set(11);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(needs_of_day).toHaveBeenLastCalledWith(11, 10);
    });
});
