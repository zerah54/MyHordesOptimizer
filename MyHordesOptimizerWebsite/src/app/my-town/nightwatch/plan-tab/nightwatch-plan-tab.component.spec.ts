import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';

import { StatusEnum } from '../../../_abstract_model/enum/status.enum';
import { ApiService } from '../../../_abstract_model/services/api.service';
import { ListForAddRemove } from '../../../_abstract_model/types/_types';
import { Item } from '../../../_abstract_model/types/item.class';
import { SnackbarService } from '../../../_core/services/snackbar.service';
import { ListElementAddRemoveComponent } from '../../../_shared/list-elements-add-remove/list-element-add-remove.component';
import { BuildingPlanDTO } from '../../buildings/planning/plan.types';
import { NightwatchStore } from '../nightwatch.store';
import { createFakeNightwatchStore, FakeNightwatchStore } from '../nightwatch.store.fake';
import {
    NightwatchCitizenStateDTO,
    NightwatchPlanContentDTO,
    NightwatchPlanDTO,
    NightwatchReferentialDTO,
    NightwatchStateDTO,
    NightwatchWatcherDTO
} from '../nightwatch.types';
import { NightwatchPlanTabComponent } from './nightwatch-plan-tab.component';

describe('NightwatchPlanTabComponent', (): void => {
    let fake: FakeNightwatchStore;
    let fixture: ComponentFixture<NightwatchPlanTabComponent>;
    let get_items: Mock;
    const warning: Mock = vi.fn();

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
                { provide: ApiService, useValue: { getItems: get_items } },
                { provide: SnackbarService, useValue: { warningSnackbar: warning } },
                provideRouter([])
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

    it('propose les citoyens non inscrits, bannis compris, par ordre alphabétique, puis ajoute le veilleur choisi', async (): Promise<void> => {
        await render((f: FakeNightwatchStore): void => {
            const citizens: NightwatchCitizenStateDTO[] = f.state()?.citizens ?? [];
            f.state.update((state: NightwatchStateDTO | null): NightwatchStateDTO | null => state === null ? null : { ...state, citizens: [...citizens].reverse() });
        });
        const select: HTMLElement = control<HTMLElement>('mat-select[data-field="add-watcher"]');

        const options: string = (await openSelect(select)).map((option: HTMLElement): string => option.textContent?.trim() ?? '').join('|');
        await pick(select, /Chloé/);

        expect(options).toBe('Bob|Chloé');
        expect(fake.actions.addWatcher).toHaveBeenCalledWith(3);
    });

    it('affiche le métier des citoyens proposés', async (): Promise<void> => {
        await render();

        const options: HTMLElement[] = await openSelect(control<HTMLElement>('mat-select[data-field="add-watcher"]'));
        const chloe: HTMLElement | undefined = options.find((option: HTMLElement): boolean => (option.textContent ?? '').includes('Chloé'));
        const bob: HTMLElement | undefined = options.find((option: HTMLElement): boolean => (option.textContent ?? '').includes('Bob'));

        expect(chloe?.querySelector('img.job')?.getAttribute('src')).toContain('professions/vest.gif');
        expect(bob?.querySelector('img.job')).toBeNull();
    });

    it('copie le stuff d\'un veilleur ; coller est indisponible tant que rien n\'est copié', async (): Promise<void> => {
        await render();
        const paste: HTMLButtonElement = control<HTMLButtonElement>('[data-watcher="1"] button[data-action="paste-items"]');
        expect(paste.disabled).toBe(true);

        control<HTMLButtonElement>('[data-watcher="1"] button[data-action="copy-items"]').click();
        expect(fake.actions.copyItems).toHaveBeenCalledWith(1);

        fake.copied_items.set({ 5: 1 });
        fixture.detectChanges();
        paste.click();
        expect(fake.actions.pasteItems).toHaveBeenCalledWith(1);
    });

    it('choisit la proposition de Chantiers du jour, celle retenue étant affichée', async (): Promise<void> => {
        await render((f: FakeNightwatchStore): void => {
            f.building_plans_of_day.set([{ id: 70, name: 'Chantiers A', isEffective: true } as BuildingPlanDTO, { id: 71, name: 'Chantiers B', isEffective: false } as BuildingPlanDTO]);
            f.planned_buildings.set({ built_uids: new Set<string>(), round_path_level: 0, plan_id: 70 });
        });
        const select: HTMLElement = control<HTMLElement>('mat-select[data-field="building-plan"]');
        expect(select.textContent).toContain('Chantiers A');

        await pick(select, /Chantiers B/);

        expect(fake.actions.setBuildingPlan).toHaveBeenCalledWith(71);
    });

    it('lien vers les Chantiers du jour affiché, sur la proposition retenue', async (): Promise<void> => {
        await render((f: FakeNightwatchStore): void => {
            f.planned_buildings.set({ built_uids: new Set<string>(), round_path_level: 0, plan_id: 70 });
        });

        expect(control<HTMLAnchorElement>('a[data-action="open-buildings"]').getAttribute('href')).toBe('/buildings?day=10&plan=70');
    });

    it('sans proposition de Chantiers ce jour : pas de choix', async (): Promise<void> => {
        await render();

        expect(root().querySelector('mat-select[data-field="building-plan"]')).toBeNull();
    });

    it('retire un veilleur', async (): Promise<void> => {
        await render();

        control<HTMLButtonElement>('[data-watcher="1"] button[data-action="remove-watcher"]').click();

        expect(fake.actions.removeWatcher).toHaveBeenCalledWith(1);
    });

    /** Texte d'un élément, espaces réduits. */
    function text(selector: string): string {
        return (root().querySelector(selector)?.textContent ?? '').replace(/\s+/g, ' ').trim();
    }

    /** Composant de sac habituel de la carte du veilleur 1. */
    function bag(): ListElementAddRemoveComponent {
        return fixture.debugElement.query(By.css('[data-watcher="1"] mho-list-element-add-remove')).componentInstance as ListElementAddRemoveComponent;
    }

    /** Remplace le stuff prévu du veilleur 1. */
    function withItems(f: FakeNightwatchStore, items: Record<number, number>, discourse: boolean = false): void {
        f.draft.update((draft: NightwatchPlanContentDTO | null): NightwatchPlanContentDTO | null =>
            draft === null ? null : { ...draft, watchers: draft.watchers.map((watcher: NightwatchWatcherDTO): NightwatchWatcherDTO => ({ ...watcher, items, hasDiscourse: discourse })) });
    }

    /** Objets d'un onglet du menu d'ajout. */
    function tab(label: RegExp): Item[] {
        return (bag().lists().find((list: ListForAddRemove): boolean => label.test(list.label))?.list ?? []) as Item[];
    }

    it('sac : composant habituel, une icône par exemplaire ; ajout, retrait et vidage passent par setItem', async (): Promise<void> => {
        await render();

        expect(bag().currentList().map((item: Item | StatusEnum): number | string => item.id)).toEqual([5, 5]);
        bag().add.emit(5);
        bag().remove.emit(5);
        bag().empty.emit();

        expect(fake.actions.setItem).toHaveBeenCalledWith(1, 5, 3);
        expect(fake.actions.setItem).toHaveBeenCalledWith(1, 5, 1);
        expect(fake.actions.setItem).toHaveBeenCalledWith(1, 5, 0);
    });

    it('sac : onglets « Objets de veille » (filtrés, quantité en banque, même absents), « Banque » et « Tous » sans filtre', async (): Promise<void> => {
        const label: Record<string, string> = { fr: 'Bois', en: 'Wood', de: 'Holz', es: 'Madera' };
        const wood: Item = Object.assign(new Item(), { id: 5, uid: 'wood', label, img: 'item/item_wood.gif' });
        const spoon: Item = Object.assign(new Item(), { id: 6, uid: 'spoon_#00', label: { fr: 'Cuillère', en: 'Spoon' }, img: 'item/item_spoon.gif' });
        await render((f: FakeNightwatchStore): void => {
            f.state.update((state: NightwatchStateDTO | null): NightwatchStateDTO | null => state === null ? null : { ...state, bank: { 6: 3 } });
        }, of([wood, spoon]));

        expect(bag().lists().map((list: ListForAddRemove): string => list.label)).toEqual(['Objets de veille', 'Banque', 'Tous']);
        expect(tab(/veille/).map((item: Item): number => item.id)).toEqual([5]);
        expect(bag().lists()[0].counts?.get(6)).toBe(3);
        expect(tab(/Banque/).map((item: Item): number => item.id)).toEqual([6]);
        expect(tab(/Tous/).map((item: Item): number => item.id).sort()).toEqual([5, 6]);
    });

    it('sac : emplacements vides selon le SUPER (Endurant), objets en trop marqués seulement si le niveau est connu', async (): Promise<void> => {
        await render((f: FakeNightwatchStore): void => {
            f.actions.enduranceLevel.mockReturnValue(2);
            withItems(f, { 5: 2 });
        });

        expect(root().querySelectorAll('[data-watcher="1"] mho-list-element-add-remove .empty-slot').length).toBe(4);
        expect(bag().capacityUncertain()).toBe(false);
    });

    it('sac : niveau inconnu, emplacements jusqu\'au minimum d\'un habitant, rien de marqué en trop', async (): Promise<void> => {
        await render((f: FakeNightwatchStore): void => {
            withItems(f, { 5: 5 });
        });

        expect(bag().capacity()).toBe(4);
        expect(bag().capacityUncertain()).toBe(true);
        expect(root().querySelectorAll('[data-watcher="1"] mho-list-element-add-remove .overflow').length).toBe(0);
    });

    it('sac : lecture seule sans droit de modification', async (): Promise<void> => {
        await render((f: FakeNightwatchStore): void => {
            f.can_edit.set(false);
        });

        expect(bag().readonly()).toBe(true);
    });

    it('sac : places occupées / capacité, alerte d\'anomalie au dépassement, « +? » si le niveau Endurant est inconnu', async (): Promise<void> => {
        await render((f: FakeNightwatchStore): void => {
            f.actions.enduranceLevel.mockReturnValue(0);
            withItems(f, { 5: 5 });
        });

        expect(text('[data-watcher="1"] .bag-capacity')).toBe('5 / 4');
        expect(text('[data-watcher="1"] [data-alert="bag_overflow"]')).toContain('Anomalie dans l\'équipement : Pas assez de place dans le sac');

        withItems(fake, { 5: 2 });
        fixture.detectChanges();
        expect(root().querySelector('[data-watcher="1"] [data-alert="bag_overflow"]')).toBeNull();
    });

    it('sac : niveau Endurant inconnu, minimum d\'un habitant affiché « +? », pas d\'alerte tant que le stuff tient à +3', async (): Promise<void> => {
        await render((f: FakeNightwatchStore): void => {
            withItems(f, { 5: 7 });
        });

        expect(text('[data-watcher="1"] .bag-capacity')).toBe('7 / 4+?');
        expect(root().querySelector('[data-watcher="1"] .bag-capacity')?.getAttribute('title')).toBe('Niveau Endurant inconnu');
        expect(root().querySelector('[data-watcher="1"] [data-alert="bag_overflow"]')).toBeNull();
    });

    it('sac : le Discours rassurant porté occupe une place ; le retirer du sac décoche le Discours', async (): Promise<void> => {
        const label: Record<string, string> = { fr: 'Bois', en: 'Wood', de: 'Holz', es: 'Madera' };
        const wood: Item = Object.assign(new Item(), { id: 5, uid: 'wood', label, img: 'item/item_wood.gif' });
        const discourse: Item = Object.assign(new Item(), { id: 8, uid: 'chkspk_#00', label: { fr: 'Discours rassurant multicoloré', en: 'Discourse' }, img: 'item/item_chkspk.gif' });
        await render((f: FakeNightwatchStore): void => {
            f.actions.enduranceLevel.mockReturnValue(0);
            withItems(f, { 5: 1 }, true);
        }, of([wood, discourse]));

        expect(bag().currentList().map((item: Item | StatusEnum): number | string => item.id)).toEqual([5, 8]);
        expect(text('[data-watcher="1"] .bag-capacity')).toBe('2 / 4');
        bag().remove.emit(8);
        expect(fake.actions.setDiscourse).toHaveBeenCalledWith(1, false);
        expect(fake.actions.setItem).not.toHaveBeenCalled();
    });

    it('sac : le sac, le grand sac et la ceinture sont attribuables sans alerte « objet absent »', async (): Promise<void> => {
        const label: Record<string, string> = { fr: 'Bois', en: 'Wood', de: 'Holz', es: 'Madera' };
        const wood: Item = Object.assign(new Item(), { id: 5, uid: 'wood', label, img: 'item/item_wood.gif' });
        const extra_bag: Item = Object.assign(new Item(), { id: 9, uid: 'bag_#00', label: { fr: 'Sac supplémentaire', en: 'Extra bag' }, img: 'item/item_bag.gif' });
        await render((f: FakeNightwatchStore): void => {
            f.watcher_rows.set([{ user_id: 1, name: 'Alice', past_watches: 3, defense: 25, risk: 0.12, tier: 't15', alerts: [{ kind: 'unknown_item', item_id: 9 }] }]);
        }, of([wood, extra_bag]));

        expect(tab(/veille/).map((item: Item): number => item.id)).toContain(9);
        expect(root().querySelector('[data-watcher="1"] [data-alert="unknown_item"]')).toBeNull();
    });

    it('encombrants : un de plus que la normale toléré avec alerte ; au-delà, objet retiré du menu et ajout refusé avec avertissement', async (): Promise<void> => {
        const label: Record<string, string> = { fr: 'Bois', en: 'Wood', de: 'Holz', es: 'Madera' };
        const heavy_wood: Item = Object.assign(new Item(), { id: 5, uid: 'wood', label, img: 'item/item_wood.gif', is_heaver: true });
        await render((f: FakeNightwatchStore): void => {
            withItems(f, { 5: 3 });
        }, of([heavy_wood]));
        warning.mockClear();

        bag().add.emit(5);

        expect(tab(/veille/)).toEqual([]);
        expect(tab(/Tous/).map((item: Item): number => item.id)).toEqual([5]);
        expect(fake.actions.setItem).not.toHaveBeenCalled();
        expect(warning).toHaveBeenCalledWith('Anomalie dans l\'équipement : Trop d\'encombrants');
        expect(root().querySelector('[data-watcher="1"] [data-alert="too_many_heavy"]')).not.toBeNull();
    });

    it('avertit quand le stuff collé dépasse les encombrants acceptés', async (): Promise<void> => {
        const label: Record<string, string> = { fr: 'Bois', en: 'Wood', de: 'Holz', es: 'Madera' };
        const heavy_wood: Item = Object.assign(new Item(), { id: 5, uid: 'wood', label, img: 'item/item_wood.gif', is_heaver: true });
        await render((f: FakeNightwatchStore): void => {
            f.copied_items.set({ 5: 2 });
        }, of([heavy_wood]));
        const paste: HTMLButtonElement = control<HTMLButtonElement>('[data-watcher="1"] button[data-action="paste-items"]');
        warning.mockClear();

        paste.click();
        expect(fake.actions.pasteItems).toHaveBeenCalledWith(1);
        expect(warning).not.toHaveBeenCalled();

        fake.copied_items.set({ 5: 3 });
        fixture.detectChanges();
        paste.click();
        expect(warning).toHaveBeenCalledTimes(1);
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

    it('désactive tous les champs sans droit de modification (jour passé ou main d\'un autre), sauf la copie du stuff', async (): Promise<void> => {
        await render((f: FakeNightwatchStore): void => {
            f.can_edit.set(false);
        });

        const controls: HTMLElement[] = Array.from(root().querySelectorAll<HTMLElement>('input, textarea, button:not([data-action="copy-items"])'));
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
    describe('stuff à répartir', (): void => {
        const withGlobals: (simulation_id: number | null) => (f: FakeNightwatchStore) => void = (simulation_id: number | null): ((f: FakeNightwatchStore) => void) => (f: FakeNightwatchStore): void => {
            f.selected_plan.set({ ...(f.selected_plan() as NightwatchPlanDTO), simulationId: simulation_id });
            f.draft.set({
                attackOverride: null, instructions: null, manualStock: {}, globalItems: { 5: 3 },
                watchers: [{ userId: 1, statuses: [], items: { 5: 1 }, pastWatches: 3, hasDiscourse: false, note: null }]
            });
        };

        it('affiche le reste des objets globaux non attribués pour une proposition de simulation', async (): Promise<void> => {
            await render(withGlobals(4));

            const box: HTMLElement | null = root().querySelector<HTMLElement>('[data-field="stuff-to-split"]');
            expect(box).not.toBeNull();
            expect(box?.textContent).toContain('2');
            expect(box?.querySelector('img')?.getAttribute('alt')).toBe('Wood');
        });

        it('masque l\'encart quand tout est réparti', async (): Promise<void> => {
            await render((f: FakeNightwatchStore): void => {
                withGlobals(4)(f);
                f.draft.set({ ...(f.draft() as NightwatchPlanContentDTO), globalItems: { 5: 1 } });
            });

            expect(root().querySelector('[data-field="stuff-to-split"]')).toBeNull();
        });

        it('n\'affiche rien pour une proposition hors simulation', async (): Promise<void> => {
            await render(withGlobals(null));

            expect(root().querySelector('[data-field="stuff-to-split"]')).toBeNull();
        });
    });
});
