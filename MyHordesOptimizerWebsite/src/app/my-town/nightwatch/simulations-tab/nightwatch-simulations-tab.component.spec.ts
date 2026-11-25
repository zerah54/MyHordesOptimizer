import { ANIMATION_MODULE_TYPE, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import type { Mock } from 'vitest';

import { ApiService } from '../../../_abstract_model/services/api.service';
import { ListForAddRemove } from '../../../_abstract_model/types/_types';
import { Item } from '../../../_abstract_model/types/item.class';
import { ConfirmDialogComponent } from '../../../_shared/confirm-dialog/confirm-dialog.component';
import { ListElementAddRemoveComponent } from '../../../_shared/list-elements-add-remove/list-element-add-remove.component';
import { NightwatchStore, SimulationDayView, SimulationVerdict, SimulationWatcherView } from '../nightwatch.store';
import { createFakeNightwatchStore, FAKE_NIGHTWATCH_STATE, FakeNightwatchStore } from '../nightwatch.store.fake';
import { NightwatchSimulationDTO } from '../nightwatch.types';
import { NightwatchSimulationDialogResult } from './nightwatch-simulation-dialog.component';
import { NightwatchSimulationsTabComponent } from './nightwatch-simulations-tab.component';

const WOOD: Item = Object.assign(new Item(), { id: 22, uid: 'wood_#00', label: { fr: 'Planche', en: 'Wood' }, img: 'item/item_wood.gif', is_heaver: false });
const METAL: Item = Object.assign(new Item(), { id: 23, uid: 'metal_#00', label: { fr: 'Ferraille', en: 'Metal' }, img: 'item/item_metal.gif', is_heaver: false });

/** Simulation de test. */
function simulation(id: number, name: string, stock: Record<number, number> = {}): NightwatchSimulationDTO {
    return { id, name, lastDay: 12, stock, version: 1, lastUpdateInfo: null };
}

/** Jour de simulation réduit aux champs affichés. */
function simDay(day: number, watchers: SimulationWatcherView[], verdict: SimulationVerdict | null): SimulationDayView {
    return {
        day, plan_id: 100 + day, attack: null, goal: null, remaining: null, watch_defense: 0, stock: {}, verdict, watchers,
        defense: {
            buildings: 0, upgrades: 0, wall: 0, bankDefenseItems: 0, homes: 0, guardians: 0, guardTowerPa: 0, souls: 0,
            cemetery: 0, eveningVote: 0, dumpContribution: 0, fddCoefficient: 1, adLevel: -1
        },
        offered: { slots: 0, slots_known: true, heavy: 0 }
    };
}

describe('NightwatchSimulationsTabComponent', (): void => {
    let fake: FakeNightwatchStore;
    let fixture: ComponentFixture<NightwatchSimulationsTabComponent>;
    let open: Mock;

    /** Rend l'onglet ; les boîtes de dialogue renvoient `dialog_result`. */
    async function render(dialog_result: NightwatchSimulationDialogResult | boolean | undefined = undefined): Promise<void> {
        fake = createFakeNightwatchStore();
        open = vi.fn().mockReturnValue({ afterClosed: (): unknown => of(dialog_result) });
        await TestBed.configureTestingModule({
            imports: [NightwatchSimulationsTabComponent],
            providers: [
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                { provide: NightwatchStore, useValue: fake.store },
                { provide: ApiService, useValue: { getItems: (): unknown => of([WOOD, METAL]) } }
            ]
        }).overrideProvider(MatDialog, { useValue: { open } }).compileComponents();
        fixture = TestBed.createComponent(NightwatchSimulationsTabComponent);
        fixture.detectChanges();
        await fixture.whenStable();
    }

    /** Racine du composant. */
    function root(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    /** Texte d'un élément, espaces normalisés. */
    function text(element: Element | null | undefined): string {
        return (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
    }

    /** Ouvre le menu de la simulation sélectionnée. */
    async function openMenu(): Promise<void> {
        root().querySelector<HTMLButtonElement>('button[data-action="simulation-menu"]')?.click();
        fixture.detectChanges();
        await fixture.whenStable();
    }

    /** Entrée du menu ouvert. */
    function menuItem(action: string): HTMLButtonElement | null {
        return document.querySelector<HTMLButtonElement>(`.mat-mdc-menu-panel button[data-action="${action}"]`);
    }

    /**
     * Composant de sac repéré par son attribut `data-bag`.
     * @param {string} name Valeur de `data-bag`.
     * @returns {ListElementAddRemoveComponent | undefined} Composant, absent s'il n'est pas rendu.
     */
    function bag(name: string): ListElementAddRemoveComponent | undefined {
        return fixture.debugElement.queryAll(By.directive(ListElementAddRemoveComponent))
            .find((element: DebugElement): boolean => element.attributes['data-bag'] === name)?.componentInstance as ListElementAddRemoveComponent | undefined;
    }

    /**
     * Réponses successives des boîtes de dialogue.
     * @param {unknown[]} results Résultat de chaque boîte, dans l'ordre.
     */
    function dialogResults(...results: unknown[]): void {
        open.mockReset();
        results.forEach((result: unknown): void => {
            open.mockReturnValueOnce({ afterClosed: (): unknown => of(result) });
        });
    }

    /** Ouvre la simulation 1 (« J36 », dernier jour 12). */
    function selectSimulation(stock: Record<number, number> = {}): void {
        fake.simulations.set([simulation(1, 'J36', stock)]);
        fake.selected_simulation_id.set(1);
        fixture.detectChanges();
    }

    /** Déplie le panneau du stock de départ. */
    async function openStock(): Promise<void> {
        root().querySelector<HTMLElement>('mat-expansion-panel[data-panel="stock"] mat-expansion-panel-header')?.click();
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    afterEach((): void => {
        TestBed.resetTestingModule();
    });

    it('affiche une puce par simulation et sélectionne au clic', async (): Promise<void> => {
        await render();
        fake.simulations.set([simulation(1, 'J36'), simulation(2, 'Plan B')]);
        fixture.detectChanges();

        const chips: HTMLButtonElement[] = Array.from(root().querySelectorAll<HTMLButtonElement>('button[data-action="select-simulation"]'));
        expect(chips.map((chip: HTMLButtonElement): string => text(chip))).toEqual(['J36', 'Plan B']);
        chips[1].click();

        expect(fake.actions.selectSimulation).toHaveBeenCalledWith(2);
    });

    it('un clic sur la simulation sélectionnée la quitte', async (): Promise<void> => {
        await render();
        fake.simulations.set([simulation(1, 'J36')]);
        fake.selected_simulation_id.set(1);
        fixture.detectChanges();

        root().querySelector<HTMLButtonElement>('button[data-action="select-simulation"]')?.click();

        expect(fake.actions.selectSimulation).toHaveBeenCalledWith(null);
    });

    it('« + Simulation » demande nom et dernier jour puis crée', async (): Promise<void> => {
        await render({ name: 'J36', last_day: 36 });

        root().querySelector<HTMLButtonElement>('button[data-action="new-simulation"]')?.click();

        expect(fake.actions.createSimulation).toHaveBeenCalledWith('J36', 36);
    });

    it('« + Simulation » désactivé sans droit de modifier les simulations', async (): Promise<void> => {
        await render();
        fake.can_edit_simulations.set(false);
        fixture.detectChanges();

        expect(root().querySelector<HTMLButtonElement>('button[data-action="new-simulation"]')?.disabled).toBe(true);
    });

    it('menu : renommer, changer le dernier jour, dupliquer', async (): Promise<void> => {
        await render({ name: 'Autre', last_day: 20 });
        fake.simulations.set([simulation(1, 'J36')]);
        fake.selected_simulation_id.set(1);
        fixture.detectChanges();

        await openMenu();
        menuItem('rename')?.click();
        await openMenu();
        menuItem('last-day')?.click();
        await openMenu();
        menuItem('duplicate')?.click();

        expect(fake.actions.renameSimulation).toHaveBeenCalledWith('Autre');
        expect(fake.actions.setSimulationLastDay).toHaveBeenCalledWith(20);
        expect(fake.actions.duplicateSimulation).toHaveBeenCalledWith('Autre');
    });

    it('menu : supprimer après confirmation', async (): Promise<void> => {
        await render(true);
        fake.simulations.set([simulation(1, 'J36')]);
        fake.selected_simulation_id.set(1);
        fixture.detectChanges();

        await openMenu();
        menuItem('delete')?.click();

        expect(fake.actions.deleteSimulation).toHaveBeenCalled();
    });

    it('frise : une carte par jour (verdict, veilleurs) ; clic sur un jour ; tableau limité aux citoyens qui veillent', async (): Promise<void> => {
        await render();
        fake.state.set({ ...FAKE_NIGHTWATCH_STATE, citizens: [FAKE_NIGHTWATCH_STATE.citizens[2], FAKE_NIGHTWATCH_STATE.citizens[0]] });
        fake.simulations.set([simulation(1, 'J36')]);
        fake.selected_simulation_id.set(1);
        fake.simulation_days.set([
            simDay(10, [{ user_id: 1, risk: 0.1234, defense: 10 }], { covered: true, missing_watchers: 0 }),
            simDay(11, [], { covered: false, missing_watchers: 2 }),
            simDay(12, [], null),
            simDay(13, [], { covered: false, missing_watchers: 1 })
        ]);
        fixture.detectChanges();

        const cards: string[] = Array.from(root().querySelectorAll('button[data-action="select-day"]')).map((card: Element): string =>
            Array.from(card.children).map((part: Element): string => text(part)).join(' '));
        expect(cards).toEqual(['J 10 Couvert 1 veilleur', 'J 11 Manque 2 veilleurs 0 veilleurs', 'J 12 ? 0 veilleurs', 'J 13 Manque 1 veilleur 0 veilleurs']);
        const rows: HTMLTableRowElement[] = Array.from(root().querySelectorAll<HTMLTableRowElement>('tbody tr'));
        expect(rows.map((row: HTMLTableRowElement): string => text(row.querySelector('th')))).toEqual(['Alice']);
        expect(Array.from(rows[0].querySelectorAll('td')).map((cell: Element): string => text(cell))).toEqual(['12.34 %', '', '', '']);

        root().querySelectorAll<HTMLButtonElement>('button[data-action="select-day"]')[1].click();

        expect(fake.actions.selectDay).toHaveBeenCalledWith(11);
    });

    it('affiche la vue du jour sélectionné sous le tableau', async (): Promise<void> => {
        await render();
        fake.simulations.set([simulation(1, 'J36')]);
        fake.simulation_days.set([simDay(10, [], null), simDay(11, [], null)]);
        fixture.detectChanges();
        expect(root().querySelector('mho-nightwatch-simulation-day')).toBeNull();

        fake.selected_simulation_id.set(1);
        fixture.detectChanges();

        expect(root().querySelectorAll('mho-nightwatch-simulation-day').length).toBe(1);
        expect(root().querySelector('mho-nightwatch-simulation-day input[data-field="wall"]')).not.toBeNull();
    });

    it('raccourcir le dernier jour demande confirmation ; annuler ne change rien', async (): Promise<void> => {
        await render();
        selectSimulation();
        dialogResults({ name: null, last_day: 10 }, false);

        await openMenu();
        menuItem('last-day')?.click();

        expect(open).toHaveBeenCalledTimes(2);
        expect(open.mock.calls[1][0]).toBe(ConfirmDialogComponent);
        expect(fake.actions.setSimulationLastDay).not.toHaveBeenCalled();
    });

    it('raccourcir le dernier jour après confirmation → setSimulationLastDay', async (): Promise<void> => {
        await render();
        selectSimulation();
        dialogResults({ name: null, last_day: 10 }, true);

        await openMenu();
        menuItem('last-day')?.click();

        expect(fake.actions.setSimulationLastDay).toHaveBeenCalledWith(10);
    });

    it('allonger le dernier jour : sans confirmation', async (): Promise<void> => {
        await render();
        selectSimulation();
        dialogResults({ name: null, last_day: 15 });

        await openMenu();
        menuItem('last-day')?.click();

        expect(open).toHaveBeenCalledTimes(1);
        expect(fake.actions.setSimulationLastDay).toHaveBeenCalledWith(15);
    });

    it('stock de départ replié : nombre d\'objets en résumé, contenu rendu à l\'ouverture seulement', async (): Promise<void> => {
        await render();
        selectSimulation({ 22: 2, 23: 3 });

        expect(text(root().querySelector('[data-field="stock-count"]'))).toContain('5');
        expect(bag('stock')).toBeUndefined();
    });

    it('stock de départ : un objet par exemplaire, objets inconnus ignorés ; ajout, retrait → setSimulationStock ; vider → clearSimulationStock', async (): Promise<void> => {
        await render();
        selectSimulation({ 22: 2, 999: 1 });
        await openStock();

        const stock: ListElementAddRemoveComponent | undefined = bag('stock');
        expect(stock?.label()).toBe('Stock de départ');
        expect((stock?.currentList() as Item[]).map((item: Item): number => item.id)).toEqual([22, 22]);
        expect(stock?.readonly()).toBe(false);
        stock?.add.emit(22);
        expect(fake.actions.setSimulationStock).toHaveBeenCalledWith(22, 3);
        stock?.add.emit(23);
        expect(fake.actions.setSimulationStock).toHaveBeenCalledWith(23, 1);
        stock?.remove.emit(22);
        expect(fake.actions.setSimulationStock).toHaveBeenCalledWith(22, 1);
        stock?.empty.emit();
        expect(fake.actions.clearSimulationStock).toHaveBeenCalled();
    });

    it('stock de départ : listes « Banque » (avec quantités) et « Tous » ; lecture seule sans droit', async (): Promise<void> => {
        await render();
        fake.state.set({ ...FAKE_NIGHTWATCH_STATE, bank: { 23: 4 } });
        selectSimulation();
        await openStock();

        const lists: ListForAddRemove[] = bag('stock')?.lists() ?? [];
        expect(lists.map((list: ListForAddRemove): string => list.label)).toEqual(['Banque', 'Tous']);
        expect((lists[0].list as Item[]).map((item: Item): number => item.id)).toEqual([23]);
        expect(lists[0].counts?.get(23)).toBe(4);
        expect((lists[1].list as Item[]).map((item: Item): number => item.id)).toEqual([22, 23]);

        fake.can_edit_simulations.set(false);
        fixture.detectChanges();
        expect(bag('stock')?.readonly()).toBe(true);
    });
});
