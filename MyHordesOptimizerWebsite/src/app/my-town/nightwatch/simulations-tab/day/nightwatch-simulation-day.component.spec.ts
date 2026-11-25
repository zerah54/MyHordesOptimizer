import { ANIMATION_MODULE_TYPE, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { ApiService } from '../../../../_abstract_model/services/api.service';
import { ListForAddRemove } from '../../../../_abstract_model/types/_types';
import { Item } from '../../../../_abstract_model/types/item.class';
import { ListElementAddRemoveComponent } from '../../../../_shared/list-elements-add-remove/list-element-add-remove.component';
import { NightwatchStore, SimulationDayView } from '../../nightwatch.store';
import { createFakeNightwatchStore, FakeNightwatchStore } from '../../nightwatch.store.fake';
import { emptyNightwatchContent, NightwatchPlanContentDTO, NightwatchReferentialDTO } from '../../nightwatch.types';
import { NightwatchSimulationDayComponent } from './nightwatch-simulation-day.component';

const COFFEE: Item = Object.assign(new Item(), { id: 20, uid: 'coffee_#00', label: { fr: 'Café', en: 'Coffee' }, img: 'item/item_coffee.gif', is_heaver: false });
const DOOR: Item = Object.assign(new Item(), { id: 21, uid: 'door_#00', label: { fr: 'Porte', en: 'Door' }, img: 'item/item_door.gif', is_heaver: true });
const WOOD: Item = Object.assign(new Item(), { id: 22, uid: 'wood_#00', label: { fr: 'Planche', en: 'Wood' }, img: 'item/item_wood.gif', is_heaver: false });

/** Référentiel réduit : le café a un effet de survie, porte et planche n'en ont pas. */
const REFERENTIAL: NightwatchReferentialDTO = {
    items: {
        20: { defense: 0, usage: 'single', watchImpact: 0.05, isEssential: false },
        21: { defense: 30, usage: 'permanent', watchImpact: 0, isEssential: false },
        22: { defense: 5, usage: 'permanent', watchImpact: 0, isEssential: false }
    }
} as unknown as NightwatchReferentialDTO;

/**
 * Jour de simulation de test, sur la proposition 7 de la doublure.
 * @param {Partial<SimulationDayView>} overrides Champs modifiés.
 * @returns {SimulationDayView} Jour.
 */
function simDay(overrides: Partial<SimulationDayView> = {}): SimulationDayView {
    return {
        day: 10, plan_id: 7, attack: 500, goal: 500,
        defense: {
            buildings: 100, upgrades: 20, wall: 40, bankDefenseItems: 2, homes: 30, guardians: 5, guardTowerPa: 0, souls: 1,
            cemetery: 2, eveningVote: 0, dumpContribution: 0, fddCoefficient: 1.5, adLevel: -1
        },
        remaining: 120, watch_defense: 80, offered: { slots: 4, slots_known: true, heavy: 1 }, stock: { 22: 3, 999: 1 },
        verdict: { covered: false, missing_watchers: 2 }, watchers: [],
        ...overrides
    };
}

describe('NightwatchSimulationDayComponent', (): void => {
    let fake: FakeNightwatchStore;
    let fixture: ComponentFixture<NightwatchSimulationDayComponent>;

    /**
     * Rend la vue du jour.
     * @param {Partial<NightwatchPlanContentDTO>} content Contenu de la proposition.
     * @param {Partial<SimulationDayView>} day Champs du jour modifiés.
     */
    async function render(content: Partial<NightwatchPlanContentDTO> = {}, day: Partial<SimulationDayView> = {}): Promise<void> {
        fake = createFakeNightwatchStore({ ...emptyNightwatchContent(), ...content });
        fake.referential.set(REFERENTIAL);
        await TestBed.configureTestingModule({
            imports: [NightwatchSimulationDayComponent],
            providers: [
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                { provide: NightwatchStore, useValue: fake.store },
                { provide: ApiService, useValue: { getItems: (): unknown => of([COFFEE, DOOR, WOOD]) } }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(NightwatchSimulationDayComponent);
        fixture.componentRef.setInput('day', simDay(day));
        fixture.detectChanges();
        await fixture.whenStable();
    }

    /** Racine du composant. */
    function root(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    /**
     * Texte d'un élément, espaces normalisés.
     * @param {Element | null} element Élément.
     * @returns {string} Texte.
     */
    function text(element: Element | null): string {
        return (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
    }

    /**
     * Composant de sac repéré par son attribut `data-bag`.
     * @param {string} name Valeur de `data-bag`.
     * @returns {ListElementAddRemoveComponent} Composant.
     */
    function bag(name: string): ListElementAddRemoveComponent {
        const host: DebugElement | undefined = fixture.debugElement.queryAll(By.directive(ListElementAddRemoveComponent))
            .find((element: DebugElement): boolean => element.attributes['data-bag'] === name);
        if (host === undefined) {
            throw new Error(`Sac ${name} absent`);
        }
        return host.componentInstance as ListElementAddRemoveComponent;
    }

    /**
     * Saisit une valeur dans un champ et déclenche `change`.
     * @param {string} field Valeur de `data-field`.
     * @param {string} value Saisie.
     */
    function type(field: string, value: string): void {
        const input: HTMLInputElement | null = root().querySelector<HTMLInputElement>(`input[data-field="${field}"]`);
        if (input === null) {
            throw new Error(`Champ ${field} absent`);
        }
        input.value = value;
        input.dispatchEvent(new Event('change'));
    }

    afterEach((): void => {
        TestBed.resetTestingModule();
        document.querySelectorAll('.cdk-overlay-container').forEach((overlay: Element): void => { overlay.innerHTML = ''; });
    });

    it('saisie de la muraille → setCityDefense, vidage → null ; la valeur pré-remplie est affichée comme valeur', async (): Promise<void> => {
        await render();

        expect(root().querySelector<HTMLInputElement>('input[data-field="wall"]')?.value).toBe('40');
        expect(root().querySelector('button[data-action="reset-wall"]')).toBeNull();
        type('wall', '20');
        expect(fake.actions.setCityDefense).toHaveBeenCalledWith('wall', 20);
        type('wall', '');
        expect(fake.actions.setCityDefense).toHaveBeenLastCalledWith('wall', null);
    });

    it('poste modifié : marqué, et « rétablir » revient à la valeur pré-remplie', async (): Promise<void> => {
        await render({ cityDefense: { wall: 20 } });

        root().querySelector<HTMLButtonElement>('button[data-action="reset-wall"]')?.click();
        expect(fake.actions.setCityDefense).toHaveBeenCalledWith('wall', null);
    });

    it('en-têtes repliables : objectif hors AD de l\'attaque et total de la défense de la ville', async (): Promise<void> => {
        await render({}, { goal: 480 });

        expect(text(root().querySelector('[data-field="attack-goal"]'))).toContain('480');
        expect(text(root().querySelector('[data-field="city-defense-total"]'))).toContain(`${40 + 2 * 1.5 + 100 + 20 + 30 + 5 + 1 + 2}`);
    });

    it('affiche « Apport des décharges » et transmet sa saisie', async (): Promise<void> => {
        await render();

        expect(text(root())).toContain('Apport des décharges');
        type('dumpContribution', '15');
        expect(fake.actions.setCityDefense).toHaveBeenCalledWith('dumpContribution', 15);
    });

    it('attaque, débordement, % retranché et dégâts du réacteur', async (): Promise<void> => {
        await render();

        expect(root().querySelector<HTMLInputElement>('input[data-field="attack"]')?.value).toBe('500');
        type('attack', '600');
        type('overflow', '10');
        type('reduction', '');
        type('reactor', '50');
        expect(fake.actions.setAttackOverride).toHaveBeenCalledWith(600);
        expect(fake.actions.setAllowedOverflow).toHaveBeenCalledWith(10);
        expect(fake.actions.setAttackReduction).toHaveBeenCalledWith(null);
        expect(fake.actions.setReactorDamage).toHaveBeenCalledWith(50);
    });

    it('veilleurs : une fiche par veilleur (défense, risque), retrait ; ajout par la liste des autres citoyens', async (): Promise<void> => {
        await render({ watchers: [{ userId: 3, statuses: [], items: {}, hasDiscourse: false }] }, { watchers: [{ user_id: 3, risk: 0.125, defense: 42 }] });

        const card: HTMLElement | null = root().querySelector('[data-watcher="3"]');
        expect(text(card)).toContain('Chloé');
        expect(text(card?.querySelector('[data-field="defense"]') ?? null)).toContain('42');
        expect(text(card?.querySelector('[data-field="risk"]') ?? null)).toContain('12.5 %');
        card?.querySelector<HTMLButtonElement>('button[data-action="remove-watcher"]')?.click();
        expect(fake.actions.removeWatcher).toHaveBeenCalledWith(3);

        root().querySelector<HTMLElement>('mat-select[data-field="add-watcher"] .mat-mdc-select-trigger')?.click();
        fixture.detectChanges();
        await fixture.whenStable();
        const options: HTMLElement[] = Array.from(document.querySelectorAll<HTMLElement>('mat-option'));
        expect(options.map((option: HTMLElement): string => text(option))).toEqual(['Alice', 'Bob']);
        options[0].click();
        expect(fake.actions.addWatcher).toHaveBeenCalledWith(1);
    });

    it('objets de survie d\'un veilleur : seuls ceux à watchImpact non nul, ajout → setItem', async (): Promise<void> => {
        await render({ watchers: [{ userId: 1, statuses: [], items: { 20: 1, 22: 1 }, hasDiscourse: false }] });

        const survival: ListElementAddRemoveComponent = bag('survival-1');
        expect((survival.lists()[0].list as Item[]).map((item: Item): number => item.id)).toEqual([20]);
        expect((survival.currentList() as Item[]).map((item: Item): number => item.id)).toEqual([20]);
        survival.add.emit(20);
        expect(fake.actions.setItem).toHaveBeenCalledWith(1, 20, 2);
    });

    it('stuff global : ajout et retrait → setGlobalItem', async (): Promise<void> => {
        await render({ globalItems: { 22: 2 } });

        bag('global').add.emit(20);
        expect(fake.actions.setGlobalItem).toHaveBeenCalledWith(20, 1);
        bag('global').remove.emit(22);
        expect(fake.actions.setGlobalItem).toHaveBeenCalledWith(22, 1);
        expect(bag('global').capacity()).toBe(4);
    });

    it('stuff global : onglet « Stock » = stock restant du jour, objets connus seulement', async (): Promise<void> => {
        await render();

        const stock: ListForAddRemove = bag('global').lists()[1];
        expect(stock.label).toBe('Stock');
        expect((stock.list as Item[]).map((item: Item): number => item.id)).toEqual([22]);
        expect(stock.counts?.get(22)).toBe(3);
    });

    it('niveau AD : affiche le niveau retenu ; « rétablir » → setCityDefense(adLevel, null)', async (): Promise<void> => {
        await render({ cityDefense: { adLevel: 2 } });

        root().querySelector<HTMLButtonElement>('button[data-action="reset-adLevel"]')?.click();

        expect(fake.actions.setCityDefense).toHaveBeenCalledWith('adLevel', null);
    });

    it('places dépassées → alerte « Pas assez de place dans le sac »', async (): Promise<void> => {
        await render({ globalItems: { 22: 5 } });

        expect(text(root().querySelector('[data-alert="slots"]'))).toContain('Anomalie dans l\'équipement : Pas assez de place dans le sac');
    });

    it('places inconnues : comparées au bonus Endurant maximal', async (): Promise<void> => {
        await render({ globalItems: { 22: 5 }, watchers: [{ userId: 1, statuses: [], items: {}, hasDiscourse: false }] },
                     { offered: { slots: 4, slots_known: false, heavy: 1 } });

        expect(root().querySelector('[data-alert="slots"]')).toBeNull();
    });

    it('encombrants dépassés → alerte « Trop d\'encombrants »', async (): Promise<void> => {
        await render({ globalItems: { 21: 2 } });

        expect(text(root().querySelector('[data-alert="heavy"]'))).toContain('Anomalie dans l\'équipement : Trop d\'encombrants');
    });

    it('affiche reste à couvrir, défense de la veille et verdict', async (): Promise<void> => {
        await render();

        expect(text(root().querySelector('[data-field="remaining"]'))).toContain('120');
        expect(text(root().querySelector('[data-field="watch-defense"]'))).toContain('80');
        expect(text(root().querySelector('[data-field="verdict"]'))).toContain('Manque 2 veilleurs');
    });

    it('stock restant : objets connus seulement', async (): Promise<void> => {
        await render();

        const lines: string[] = Array.from(root().querySelectorAll('[data-stock]')).map((line: Element): string => line.getAttribute('data-stock') ?? '');
        expect(lines).toEqual(['22']);
        expect(text(root().querySelector('[data-stock="22"]'))).toContain('3');
    });

    it('lecture seule si la proposition sélectionnée n\'est pas celle du jour', async (): Promise<void> => {
        await render({}, { plan_id: 99 });

        expect(root().querySelector<HTMLInputElement>('input[data-field="wall"]')?.disabled).toBe(true);
    });
});
