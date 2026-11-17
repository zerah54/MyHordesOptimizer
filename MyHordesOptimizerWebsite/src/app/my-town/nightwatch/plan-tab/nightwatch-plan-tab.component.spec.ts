import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';

import { ApiService } from '../../../_abstract_model/services/api.service';
import { Item } from '../../../_abstract_model/types/item.class';
import { NightwatchStore } from '../nightwatch.store';
import { createFakeNightwatchStore, FakeNightwatchStore } from '../nightwatch.store.fake';
import { NightwatchPlanContentDTO, NightwatchReferentialDTO } from '../nightwatch.types';
import { NightwatchPlanTabComponent } from './nightwatch-plan-tab.component';

describe('NightwatchPlanTabComponent', (): void => {
    let fake: FakeNightwatchStore;
    let fixture: ComponentFixture<NightwatchPlanTabComponent>;
    let get_items: Mock;

    async function render(setup: (fake: FakeNightwatchStore) => void = (): void => undefined, items$: Observable<Item[]> | null = null): Promise<void> {
        fake = createFakeNightwatchStore({
            attackOverride: null, instructions: null, manualStock: {},
            watchers: [{ userId: 1, statuses: ['drunk'], items: { 5: 2 }, pastWatches: 3, hasDiscourse: false, note: null }]
        });
        fake.referential.set({ items: { 5: { defense: 6 } }, watcherCapByRoundPathLevel: {} } as unknown as NightwatchReferentialDTO);
        fake.watcher_rows.set([{ user_id: 1, name: 'Alice', past_watches: 3, defense: 25, risk: 0.12, tier: 't15', alerts: [] }]);
        fake.totals.set({ defense: 25, real_defense: 0, planned_margin: 5, real_margin: 999, cost: {} as never, watcher_count: 1, cap: 4 });
        setup(fake);
        const label: Record<string, string> = { fr: 'Bois', en: 'Wood', de: 'Holz', es: 'Madera' };
        const wood: Item = Object.assign(new Item(), { id: 5, uid: 'wood', label, img: 'item/item_wood.gif' });
        get_items = vi.fn((): unknown => items$ ?? of([wood]));
        await TestBed.configureTestingModule({
            imports: [NightwatchPlanTabComponent],
            providers: [
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                { provide: NightwatchStore, useValue: fake.store },
                { provide: ApiService, useValue: { getItems: get_items } }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(NightwatchPlanTabComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function root(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    function control<T extends HTMLElement>(selector: string): T {
        return root().querySelector<T>(selector) as T;
    }

    /** Ouvre un mat-select et renvoie les mat-option affichées dans le panneau. */
    async function openSelect(host: HTMLElement): Promise<HTMLElement[]> {
        host.querySelector<HTMLElement>('.mat-mdc-select-trigger')?.click();
        fixture.detectChanges();
        await fixture.whenStable();
        return Array.from(document.querySelectorAll<HTMLElement>('mat-option'));
    }

    /** Choisit dans un mat-select l'option dont le texte correspond. */
    async function pick(host: HTMLElement, text: RegExp): Promise<void> {
        const options: HTMLElement[] = await openSelect(host);
        options.find((option: HTMLElement): boolean => text.test(option.textContent ?? ''))?.click();
        fixture.detectChanges();
        await fixture.whenStable();
    }

    function statusButton(status: string): HTMLButtonElement {
        return control<HTMLButtonElement>(`[data-watcher="1"] mat-chip-option[data-status="${status}"] button.mdc-evolution-chip__action--primary`);
    }

    afterEach((): void => {
        TestBed.resetTestingModule();
        document.querySelectorAll('.cdk-overlay-container').forEach((overlay: Element): void => { overlay.innerHTML = ''; });
    });

    it('affiche défense, risque et palier du veilleur d\'après watcher_rows', async (): Promise<void> => {
        await render();

        expect(control('[data-watcher="1"]').textContent).toContain('Alice');
        expect(control('[data-field="defense"]').textContent).toContain('25');
        expect(control('[data-field="risk"]').textContent).toContain('12');
        expect(control('[data-field="tier"]').textContent).toContain('vous vous sentez invincible');
    });

    it('charge le catalogue des objets une seule fois', async (): Promise<void> => {
        await render();

        expect(get_items).toHaveBeenCalledTimes(1);
    });

    it('un clic sur un statut appelle toggleStatus(user_id, statut)', async (): Promise<void> => {
        await render();

        statusButton('drugged').click();

        expect(fake.actions.toggleStatus).toHaveBeenCalledWith(1, 'drugged');
        expect(statusButton('drunk').getAttribute('aria-selected')).toBe('true');
        expect(statusButton('drugged').getAttribute('aria-selected')).toBe('false');
    });

    it('propose les citoyens non bannis et non inscrits, puis ajoute le veilleur choisi', async (): Promise<void> => {
        await render();
        const select: HTMLElement = control<HTMLElement>('mat-select[data-field="add-watcher"]');

        const options: string = (await openSelect(select)).map((option: HTMLElement): string => option.textContent?.trim() ?? '').join('|');
        await pick(select, /Chloé/);

        expect(options).toContain('Chloé');
        expect(options).not.toContain('Bob');
        expect(options).not.toContain('Alice');
        expect(fake.actions.addWatcher).toHaveBeenCalledWith(3);
    });

    it('retire un veilleur', async (): Promise<void> => {
        await render();

        control<HTMLButtonElement>('[data-watcher="1"] button[data-action="remove-watcher"]').click();

        expect(fake.actions.removeWatcher).toHaveBeenCalledWith(1);
    });

    it('attribue un objet avec sa quantité, modifie ou retire une attribution', async (): Promise<void> => {
        await render();
        const select: HTMLElement = control<HTMLElement>('[data-watcher="1"] mat-select[data-field="add-item"]');
        const quantity: HTMLInputElement = control<HTMLInputElement>('[data-watcher="1"] input[data-field="add-item-quantity"]');

        await pick(select, /Bois|Wood/);
        quantity.value = '3';
        quantity.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        control<HTMLButtonElement>('[data-watcher="1"] button[data-action="add-item"]').click();
        const existing: HTMLInputElement = control<HTMLInputElement>('[data-watcher="1"] input[data-item="5"]');
        existing.value = '4';
        existing.dispatchEvent(new Event('change'));
        control<HTMLButtonElement>('[data-watcher="1"] button[data-action="remove-item-5"]').click();

        expect(fake.actions.setItem).toHaveBeenCalledWith(1, 5, 3);
        expect(fake.actions.setItem).toHaveBeenCalledWith(1, 5, 4);
        expect(fake.actions.setItem).toHaveBeenCalledWith(1, 5, 0);
    });

    it('modifie veilles passées, Discours rassurant, consignes et attaque estimée', async (): Promise<void> => {
        await render();
        const past: HTMLInputElement = control<HTMLInputElement>('[data-watcher="1"] input[data-field="past-watches"]');
        past.value = '5';
        past.dispatchEvent(new Event('change'));
        control<HTMLInputElement>('[data-watcher="1"] mat-checkbox[data-field="discourse"] input').click();
        const instructions: HTMLTextAreaElement = control<HTMLTextAreaElement>('textarea[data-field="instructions"]');
        instructions.value = 'Monter tôt';
        instructions.dispatchEvent(new Event('change'));
        const attack: HTMLInputElement = control<HTMLInputElement>('input[data-field="attack-override"]');
        attack.value = '1500';
        attack.dispatchEvent(new Event('change'));

        expect(fake.actions.setPastWatches).toHaveBeenCalledWith(1, 5);
        expect(fake.actions.setDiscourse).toHaveBeenCalledWith(1, true);
        expect(fake.actions.setInstructions).toHaveBeenCalledWith('Monter tôt');
        expect(fake.actions.setAttackOverride).toHaveBeenCalledWith(1500);
    });

    it('affiche l\'attaque estimée en indication du champ d\'attaque vide', async (): Promise<void> => {
        await render((store: FakeNightwatchStore): void => store.estimated_attack.set(1800));

        expect(control<HTMLInputElement>('input[data-field="attack-override"]').placeholder).toBe('1800');
        expect(root().querySelector('.attack mat-label')?.textContent).toContain('vide = estimée');
    });

    it('enregistre la note du veilleur dans la copie de travail', async (): Promise<void> => {
        await render();
        const note: HTMLInputElement = control<HTMLInputElement>('[data-watcher="1"] input[data-field="note"]');

        note.value = 'Mange avant';
        note.dispatchEvent(new Event('change'));
        const mutate: (content: NightwatchPlanContentDTO) => void = fake.actions.updateDraft.mock.calls[0][0];
        const content: NightwatchPlanContentDTO = { watchers: [{ userId: 1, statuses: [], items: {}, hasDiscourse: false, note: null }], manualStock: {} };
        mutate(content);

        expect(content.watchers[0].note).toBe('Mange avant');
    });

    it('affiche effectif, plafond, marge et l\'alerte de plafond dépassé', async (): Promise<void> => {
        await render((f: FakeNightwatchStore): void => {
            f.over_cap.set(true);
            f.totals.set({ defense: 25, real_defense: 0, planned_margin: -7, real_margin: 999, cost: {} as never, watcher_count: 5, cap: 4 });
        });

        expect(control('[data-field="count"]').textContent).toContain('5');
        expect(control('[data-field="count"]').textContent).toContain('4');
        expect(control('[data-field="margin"]').textContent).toContain('-7');
        expect(root().querySelector('[data-alert="over-cap"]')).not.toBeNull();
    });

    it('plafond dépassé : une seule alerte, même si une ligne de veilleur la porterait aussi', async (): Promise<void> => {
        await render((f: FakeNightwatchStore): void => {
            f.over_cap.set(true);
            f.watcher_rows.set([{ user_id: 1, name: 'Alice', past_watches: 3, defense: 25, risk: 0, tier: 'certain', alerts: [{ kind: 'over_cap' } as never] }]);
        });

        const text: string = root().textContent ?? '';
        expect(text.split('Plafond de veilleurs dépassé').length - 1).toBe(1);
    });

    it('marge prévue affichée, pas la marge réelle', async (): Promise<void> => {
        await render();

        const margin: string = control('[data-field="margin"]').textContent ?? '';
        expect(margin).toContain('5');
        expect(margin).not.toContain('999');
    });

    it('quantité attribuée supérieure au disponible : alerte unique nommant l\'objet', async (): Promise<void> => {
        await render((f: FakeNightwatchStore): void => {
            f.stock_lines.set([{ item_id: 5, need: 4, in_bag: 1, in_chests: 0, in_bank: 0, in_desert: 0, manual: 0, broken_in_town: 0, available_in_town: 1, remaining: 3, stale_chest: false, unknown_age: false, oldest_chest_update: null },
                { item_id: 6, need: 1, in_bag: 1, in_chests: 0, in_bank: 0, in_desert: 0, manual: 0, broken_in_town: 0, available_in_town: 1, remaining: 0, stale_chest: false, unknown_age: false, oldest_chest_update: null }]);
        });

        const alerts: NodeListOf<Element> = root().querySelectorAll('[data-alert="insufficient-stock"]');
        expect(alerts.length).toBe(1);
        expect(alerts[0].textContent).toMatch(/Bois|Wood/);
    });

    it('stock suffisant : pas d\'alerte de quantité', async (): Promise<void> => {
        await render();

        expect(root().querySelector('[data-alert="insufficient-stock"]')).toBeNull();
    });

    it('consignes : longueur limitée à 2000 caractères', async (): Promise<void> => {
        await render();

        expect(control<HTMLTextAreaElement>('[data-field="instructions"]').maxLength).toBe(2000);
    });

    it('totaux : pas de région aria-live', async (): Promise<void> => {
        await render();

        expect(root().querySelector('.kpis [aria-live]')).toBeNull();
    });

    it('échec du catalogue des objets : la page se rend, catalogue vide', async (): Promise<void> => {
        await render((): void => undefined, throwError((): Error => new Error('api')));

        expect(root().querySelector('[data-watcher="1"]')).not.toBeNull();
    });

    it('signale un objet inconnu et un risque non nul', async (): Promise<void> => {
        await render((f: FakeNightwatchStore): void => {
            f.watcher_rows.set([{ user_id: 1, name: 'Alice', past_watches: 3, defense: 0, risk: 0.2, tier: 't30', alerts: [{ kind: 'unknown_item', item_id: 99 }, { kind: 'risk_above_zero' }] }]);
        });

        expect(root().querySelector('[data-watcher="1"] [data-alert="unknown_item"]')).not.toBeNull();
        expect(root().querySelector('[data-watcher="1"] [data-alert="risk_above_zero"]')).not.toBeNull();
    });

    it('désactive tous les champs sans droit de modification (jour passé ou main d\'un autre)', async (): Promise<void> => {
        await render((f: FakeNightwatchStore): void => {
            f.can_edit.set(false);
        });

        const controls: HTMLElement[] = Array.from(root().querySelectorAll<HTMLElement>('input, textarea, button'));
        const selects: HTMLElement[] = Array.from(root().querySelectorAll<HTMLElement>('mat-select'));
        expect(controls.length).toBeGreaterThan(0);
        expect(selects.length).toBeGreaterThan(0);
        expect(controls.filter((element: HTMLElement): boolean => (element as HTMLButtonElement).disabled !== true && element.getAttribute('aria-disabled') !== 'true')).toEqual([]);
        expect(selects.filter((element: HTMLElement): boolean => element.getAttribute('aria-disabled') !== 'true')).toEqual([]);
    });

    it('sans proposition, propose la création et appelle createPlan', async (): Promise<void> => {
        await render((f: FakeNightwatchStore): void => {
            f.selected_plan.set(null);
            f.draft.set(null);
            f.can_create.set(true);
        });

        control<HTMLButtonElement>('button[data-action="create-plan"]').click();

        expect(fake.actions.createPlan).toHaveBeenCalledWith('Plan');
        expect(root().querySelector('[data-watcher]')).toBeNull();
    });

    it('sans proposition ni droit de création, ne propose pas de bouton', async (): Promise<void> => {
        await render((f: FakeNightwatchStore): void => {
            f.selected_plan.set(null);
            f.draft.set(null);
            f.can_create.set(false);
        });

        expect(root().querySelector('button[data-action="create-plan"]')).toBeNull();
    });
});
