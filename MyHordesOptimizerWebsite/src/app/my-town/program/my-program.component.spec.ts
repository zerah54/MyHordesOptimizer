import { ANIMATION_MODULE_TYPE, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import type { Mock } from 'vitest';

import { ApiService } from '../../_abstract_model/services/api.service';
import { BuiltBuildingsService } from '../../_abstract_model/services/built-buildings.service';
import { TownService } from '../../_abstract_model/services/town.service';
import { CitizenExpedition } from '../../_abstract_model/types/citizen-expedition.class';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { DailyAction } from '../../_abstract_model/types/daily-action.class';
import { ExpeditionOrder } from '../../_abstract_model/types/expedition-order.class';
import { ExpeditionPart } from '../../_abstract_model/types/expedition-part.class';
import { Expedition } from '../../_abstract_model/types/expedition.class';
import { Me } from '../../_abstract_model/types/me.class';
import { Ruin } from '../../_abstract_model/types/ruin.class';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { setTown, setUser } from '../../_core/utilities/localstorage.util';
import { BuildingPlanContentDTO, emptyPlanContent } from '../buildings/planning/plan.types';
import { PlanningStore } from '../buildings/planning/planning.store';
import { createFakeStore, fakeEvaluation, FakePlanningStore } from '../buildings/planning/planning.store.fake';
import { ExpeditionOrderEditorService } from '../expeditions/expedition-orders/expedition-order-editor.service';
import { DayExpeditionsStatus, DayExpeditionsStore } from '../map/map-orders/day-expeditions.store';
import { MyProgramComponent } from './my-program.component';
import { ProgramExpeditionComponent } from './program-expedition/program-expedition.component';
import { hiddenKey } from './program-hidden.util';

const TOWN_ID: number = 42;

/** Doublure du store des expéditions du jour. */
interface FakeDayStore {
    expeditions: WritableSignal<readonly Expedition[]>;
    status: WritableSignal<DayExpeditionsStatus>;
    load: Mock<(map_id: number, day: number) => void>;
}

function order(id: number, is_done: boolean): ExpeditionOrder {
    return Object.assign(new ExpeditionOrder(), { id, type: 'text', text: `Consigne ${id}`, is_done, position: id, x: null, y: null });
}

function place(id: number, citizen_id: number | undefined, orders: ExpeditionOrder[] = []): CitizenExpedition {
    return Object.assign(new CitizenExpedition(), { id, citizen_id, orders });
}

function expedition(id: number, label: string, places: CitizenExpedition[], state: 'ready' | 'stop' = 'ready'): Expedition {
    return Object.assign(new Expedition(), { id, label, state, parts: [Object.assign(new ExpeditionPart(), { id: id * 10, position: 0, orders: [], citizens: places })] });
}

describe('MyProgramComponent', (): void => {
    let fake: FakePlanningStore;
    let day_store: FakeDayStore;
    let get_map: Mock<() => Observable<never>>;
    let fixture: ComponentFixture<MyProgramComponent>;

    function content(overrides: Partial<BuildingPlanContentDTO> = {}): BuildingPlanContentDTO {
        return {
            ...emptyPlanContent(),
            programs: {
                regular: [{ buildingId: 1, kind: 'build', targetRemaining: 0 }],
                banned: [{ buildingId: 3, kind: 'repair', targetRemaining: 0 }, { buildingId: 1, kind: 'build', targetRemaining: 0 }]
            },
            ...overrides
        };
    }

    async function render(plan: BuildingPlanContentDTO = content(), user_id: number | null = 1, expeditions: Expedition[] = []): Promise<void> {
        setUser(user_id === null ? null : Object.assign(new Me(), { id: user_id }));
        setTown({ town_id: TOWN_ID, day: 10 } as TownDetails);
        fake = createFakeStore(plan);
        day_store = { expeditions: signal<readonly Expedition[]>(expeditions), status: signal<DayExpeditionsStatus>('loaded'), load: vi.fn() };
        get_map = vi.fn((): Observable<never> => EMPTY);
        await TestBed.configureTestingModule({
            imports: [MyProgramComponent],
            providers: [
                provideRouter([]),
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                { provide: DayExpeditionsStore, useValue: day_store },
                { provide: TownService, useValue: { getMap: get_map } },
                { provide: ApiService, useValue: { getRuins: (): Observable<Ruin[]> => of([]) } },
                { provide: BuiltBuildingsService, useValue: { builtUids: (): Observable<ReadonlySet<string> | null> => of(null) } },
                { provide: ExpeditionOrderEditorService, useValue: { toggleDone: vi.fn() } }
            ]
        })
            .overrideComponent(MyProgramComponent, { set: { providers: [{ provide: PlanningStore, useValue: fake.store }] } })
            .compileComponents();
        fixture = TestBed.createComponent(MyProgramComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function root(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    function text(selector: string): string {
        return root().querySelector(selector)?.textContent ?? '';
    }

    /** Texte d'un élément, espaces regroupés. */
    function flat(selector: string): string {
        return text(selector).replace(/\s+/g, ' ');
    }

    function click(selector: string): void {
        root().querySelector<HTMLButtonElement>(selector)?.click();
        fixture.detectChanges();
    }

    function showDay(day: number): void {
        fake.selected_day.set(day);
        fixture.detectChanges();
    }

    beforeEach((): void => {
        localStorage.clear();
    });

    afterEach((): void => {
        vi.restoreAllMocks();
        localStorage.clear();
        setUser(null);
        setTown(null);
    });

    it('affiche les blocs Expédition et Chantiers', async (): Promise<void> => {
        const tasks: BuildingPlanContentDTO = content({ citizens: [{ userId: 1, tasks: [{ id: 'f', kind: 'free', label: 'Puits', pa: 3 }, { id: 'g', kind: 'free', label: 'Fossé', pa: 1 }] }] });
        await render(tasks, 1, [expedition(1, 'Nord', [place(10, 1, [order(1, true), order(2, false)]), place(11, 2)])]);

        expect(root().querySelector('.block.expedition mho-program-expedition')).not.toBeNull();
        expect(root().querySelector('.block.buildings')).not.toBeNull();
        expect(flat('.summary-strip')).toContain('Nord · 1/2 faites');
        expect(flat('.summary-strip')).toContain('0/2 consignes individuelles');
        const child: ProgramExpeditionComponent = fixture.debugElement.query(By.directive(ProgramExpeditionComponent)).componentInstance;
        expect(child.me()).toBe(1);
        expect(child.day()).toBe(10);
        expect(child.checkable()).toBe(true);
    });

    it('masque un bloc pour la journée et le réaffiche', async (): Promise<void> => {
        await render(content(), 1, [expedition(1, 'Nord', [place(10, 1, [order(1, true), order(2, false)])])]);

        click('button[data-action="hide-expedition"]');

        expect(root().querySelector('.block.expedition')).toBeNull();
        expect(flat('.hidden-bar.expedition')).toContain('Expédition masquée pour J10 · 1/2 consignes faites');
        expect(text('.hidden-bar.expedition button[data-action="show-expedition"]').trim()).toBe('Réafficher');
        expect(root().querySelector('.block.buildings')?.classList.contains('full-width')).toBe(true);

        click('button[data-action="show-expedition"]');

        expect(root().querySelector('.block.expedition')).not.toBeNull();
        expect(root().querySelector('.hidden-bar.expedition')).toBeNull();
        expect(root().querySelector('.block.buildings')?.classList.contains('full-width')).toBe(false);

        click('button[data-action="hide-buildings"]');

        expect(root().querySelector('.block.buildings')).toBeNull();
        expect(flat('.hidden-bar.buildings')).toContain('Chantiers masqués pour J10');
        expect(root().querySelector('.block.expedition')?.classList.contains('full-width')).toBe(true);
    });

    it('garde le masquage du jour, l\'oublie le lendemain', async (): Promise<void> => {
        await render();
        click('button[data-action="hide-expedition"]');
        expect(localStorage.getItem(hiddenKey(TOWN_ID, 10, 'expedition'))).toBe('1');

        showDay(11);
        expect(root().querySelector('.block.expedition')).not.toBeNull();

        showDay(10);
        expect(root().querySelector('.block.expedition')).toBeNull();
        expect(root().querySelector('.hidden-bar.expedition')).not.toBeNull();
    });

    it('affiche tout si le stockage lève une exception', async (): Promise<void> => {
        localStorage.setItem(hiddenKey(TOWN_ID, 10, 'expedition'), '1');
        const fail: () => never = (): never => {
            throw new Error('storage denied');
        };
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(fail);
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(fail);
        vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(fail);

        await render();
        expect(root().querySelector('.block.expedition')).not.toBeNull();

        click('button[data-action="hide-buildings"]');
        expect(root().querySelector('.block.buildings')).not.toBeNull();
        expect(root().querySelector('.hidden-bar')).toBeNull();
    });

    it('renvoie vers les expéditions avec les places libres si je ne suis pas inscrit', async (): Promise<void> => {
        await render(content(), 1, [expedition(1, 'Sud', [place(10, undefined), place(11, undefined), place(12, 2)])]);

        expect(root().querySelector('.block.expedition mho-program-expedition')).toBeNull();
        expect(flat('.block.expedition .not-registered')).toContain('Vous n\'êtes inscrit sur aucune expédition aujourd\'hui.');
        expect(flat('.block.expedition .open-expeditions')).toContain('Sud : 2 places libres');
        expect(root().querySelector('.block.expedition a')?.getAttribute('routerLink')).toBe('../expeditions');
        expect(flat('.summary-strip')).toContain('Sud : 2 places libres');
    });

    it('chargement des expéditions : petit spinner, ni « non inscrit » ni places libres', async (): Promise<void> => {
        await render(content(), 1, [expedition(1, 'Sud', [place(10, undefined)])]);
        day_store.status.set('loading');
        fixture.detectChanges();

        expect(root().querySelector('.block.expedition .expeditions-loading mat-spinner')).not.toBeNull();
        expect(root().querySelector('.block.expedition .not-registered')).toBeNull();
        expect(root().querySelector('.block.expedition .open-expeditions')).toBeNull();
        expect(flat('.summary-strip')).not.toContain('place libre');
    });

    it('échec de chargement des expéditions : message et relance', async (): Promise<void> => {
        await render(content(), 1, [expedition(1, 'Sud', [place(10, undefined)])]);
        day_store.status.set('error');
        fixture.detectChanges();

        expect(root().querySelector('.block.expedition .not-registered')).toBeNull();
        expect(flat('.block.expedition .expeditions-failed')).toContain('Impossible de charger les expéditions.');
        expect(flat('.summary-strip')).not.toContain('place libre');
        day_store.load.mockClear();

        click('.block.expedition button[data-action="retry-expeditions"]');

        expect(day_store.load).toHaveBeenCalledWith(TOWN_ID, 10);
    });

    it('jour passé : pas de places libres', async (): Promise<void> => {
        await render(content(), 1, [expedition(1, 'Sud', [place(10, undefined)])]);
        showDay(9);

        expect(root().querySelector('.block.expedition .open-expeditions')).toBeNull();
        expect(flat('.summary-strip')).not.toContain('place libre');
    });

    it('autre jour que le jour courant : textes « ce jour »', async (): Promise<void> => {
        await render();
        expect(text('button[data-action="hide-expedition"]').trim()).toBe('Masquer pour aujourd\'hui');
        expect(text('button[data-action="hide-buildings"]').trim()).toBe('Masquer pour aujourd\'hui');

        showDay(11);

        expect(text('button[data-action="hide-expedition"]').trim()).toBe('Masquer pour ce jour');
        expect(text('button[data-action="hide-buildings"]').trim()).toBe('Masquer pour ce jour');
        expect(flat('.block.expedition .not-registered')).toContain('Vous n\'êtes inscrit sur aucune expédition ce jour-là.');
    });

    it('expédition sans consigne : pas de compteur « 0/0 faites »', async (): Promise<void> => {
        await render(content(), 1, [expedition(1, 'Nord', [place(10, 1)])]);

        expect(flat('.summary-strip')).toContain('Nord');
        expect(flat('.summary-strip')).not.toContain('faites');
    });

    it('ne charge la carte qu\'avec une expédition, une seule fois', async (): Promise<void> => {
        await render();
        expect(get_map).not.toHaveBeenCalled();

        day_store.expeditions.set([expedition(1, 'Nord', [place(10, 1)])]);
        fixture.detectChanges();
        expect(get_map).toHaveBeenCalledTimes(1);

        day_store.expeditions.set([]);
        fixture.detectChanges();
        day_store.expeditions.set([expedition(1, 'Nord', [place(10, 1)])]);
        fixture.detectChanges();
        expect(get_map).toHaveBeenCalledTimes(1);
    });

    it('signale une expédition en préparation dans le bandeau et la barre masquée',async (): Promise<void> => {
        await render(content(), 1, [expedition(1, 'Nord', [place(10, 1, [order(1, false)])], 'stop')]);

        expect(flat('.summary-strip')).toContain('En préparation');

        click('button[data-action="hide-expedition"]');

        expect(flat('.hidden-bar.expedition')).toContain('En préparation');
    });

    it('charge les expéditions du jour affiché', async (): Promise<void> => {
        await render();
        expect(day_store.load).toHaveBeenCalledWith(TOWN_ID, 10);

        showDay(11);

        expect(day_store.load).toHaveBeenLastCalledWith(TOWN_ID, 11);
    });

    it('échec de chargement des chantiers : le bloc Expédition reste affiché', async (): Promise<void> => {
        await render(content(), 1, [expedition(1, 'Nord', [place(10, 1, [order(1, true), order(2, false)])])]);
        fake.load_failed.set(true);
        fixture.detectChanges();

        expect(root().querySelector('.block.expedition mho-program-expedition')).not.toBeNull();
        expect(flat('.summary-strip')).toContain('Nord · 1/2 faites');
        expect(root().querySelector('.days')).not.toBeNull();
        expect(root().querySelector('.block.buildings .load-failed')).not.toBeNull();
        expect(root().querySelector('.block.buildings button[data-action="retry"]')).not.toBeNull();
    });

    it('chargement des chantiers en cours : le bloc Expédition reste affiché pour le jour courant', async (): Promise<void> => {
        await render(content(), 1, [expedition(1, 'Nord', [place(10, 1, [order(1, true), order(2, false)])])]);
        fake.loading.set(true);
        fixture.detectChanges();

        expect(root().querySelector('.block.expedition mho-program-expedition')).not.toBeNull();
        expect(flat('.summary-strip')).toContain('Nord · 1/2 faites');
        expect(root().querySelector('.block.buildings .loading mat-spinner')).not.toBeNull();
        expect(day_store.load).toHaveBeenLastCalledWith(TOWN_ID, 10);
    });

    it('conserve le bloc Chantiers actuel', async (): Promise<void> => {
        await render(content({ citizens: [{ userId: 1, tasks: [{ kind: 'free', label: 'Puits', pa: 3 }] }] }));

        expect(text('.block.buildings .steps')).toContain('Terminer Mur');
        expect(text('.block.buildings .tasks')).toContain('Puits');
        expect(root().querySelector('.block.expedition .steps')).toBeNull();
    });

    it('lance le chargement et affiche le titre', async (): Promise<void> => {
        await render();

        expect(fake.actions['load']).toHaveBeenCalledTimes(1);
        expect(root().querySelector('mat-card-title')?.textContent?.trim()).toBe('Mon programme');
    });

    it('spinner pendant le chargement, puis échec avec relance', async (): Promise<void> => {
        await render();
        fake.loading.set(true);
        fixture.detectChanges();
        expect(root().querySelector('.loading mat-spinner')).not.toBeNull();

        fake.loading.set(false);
        fake.load_failed.set(true);
        fixture.detectChanges();
        root().querySelector<HTMLButtonElement>('button[data-action="retry"]')?.click();
        expect(fake.actions['load']).toHaveBeenCalledTimes(2);
    });

    it('un jour est sélectionnable', async (): Promise<void> => {
        await render();

        root().querySelector<HTMLButtonElement>('.days button[data-action="next-day"]')?.click();

        expect(fake.actions['selectDay']).toHaveBeenCalledWith(11);
    });

    it('non-banni : ses étapes, pas celles des bannis', async (): Promise<void> => {
        await render();

        expect(text('.steps')).toContain('Terminer Mur');
        expect(text('.steps')).not.toContain('Réparer entièrement Porte');
        expect(root().querySelector('.notice')).toBeNull();
    });

    it('banni avec BDE : étapes des bannis et avertissement des paires', async (): Promise<void> => {
        await render(content(), 2);
        fake.evaluation.set(fakeEvaluation(content(), { hasSlavery: true }));
        fixture.detectChanges();

        expect(text('.steps')).toContain('Réparer entièrement Porte');
        expect(root().querySelector('.notice[data-notice="pairs"]')).not.toBeNull();
    });

    it('banni sans BDE : construction interdite, réparations seules', async (): Promise<void> => {
        await render(content(), 2);

        expect(root().querySelector('.notice[data-notice="banned-forbidden"]')).not.toBeNull();
        expect(text('.steps')).toContain('Réparer entièrement Porte');
        expect(text('.steps')).not.toContain('Terminer');
    });

    it('affiche les consignes du jour, les consignes de la section et les notes d\'étape', async (): Promise<void> => {
        await render(content({
            instructions: 'Planches en banque avant 18h.',
            programs: {
                regular: [{ buildingId: 1, kind: 'build', mode: 'finish', targetRemaining: 0, note: 'après 20h' }, { kind: 'instruction', text: 'Attendre l\'expé' }],
                banned: []
            }
        }));

        expect(text('.day-instructions')).toContain('Planches en banque avant 18h.');
        expect(text('.steps')).toContain('Attendre l\'expé');
        expect(root().querySelector('.steps li.instruction')).not.toBeNull();
        expect(text('.steps .note')).toContain('après 20h');
    });

    it('affiche le chantier à voter ce soir', async (): Promise<void> => {
        await render(content({ eveningVoteBuildingId: 2 }));

        expect(text('.vote')).toContain('Atelier');
    });

    it('les consignes du jour gardent leurs retours à la ligne', async (): Promise<void> => {
        await render(content({ instructions: 'Ligne 1\nLigne 2' }));

        expect(root().querySelector('.day-instructions p')?.classList.contains('multiline')).toBe(true);
    });

    it('affiche les consignes individuelles du citoyen', async (): Promise<void> => {
        await render(content({ citizens: [{ userId: 1, tasks: [{ kind: 'free', label: 'Puits', pa: 3 }] }] }));

        expect(text('.tasks h3')).toBe('Consignes individuelles');
        expect(text('.tasks')).toContain('Puits');
    });

    it('chaque consigne a sa case : cochée si faite (relevée ou cochée), un clic l\'enregistre', async (): Promise<void> => {
        await render(content({ citizens: [{ userId: 1, tasks: [{ id: 'a', kind: 'action', ref: 'home_scavenge', pa: 1 }, { id: 'f', kind: 'free', label: 'Puits', pa: 3 }] }] }));
        fake.citizens_full.set(fake.citizens_full().map((citizen: Citizen): Citizen => {
            if (citizen.id === 1) {
                citizen.daily_actions = [Object.assign(new DailyAction(), { day: 10, action_key: 'home_scavenge' })];
            }
            return citizen;
        }));
        fixture.detectChanges();

        const boxes: HTMLInputElement[] = Array.from(root().querySelectorAll<HTMLInputElement>('.tasks input[type="checkbox"]'));
        expect(boxes.map((box: HTMLInputElement): boolean => box.checked)).toEqual([true, false]);
        expect(text('.tasks')).toContain('Creuser dans les galeries');

        boxes[1].click();
        expect(fake.actions['setTaskDone']).toHaveBeenCalledWith(1, { id: 'f', kind: 'free', label: 'Puits', pa: 3 }, true);
    });

    it('un clic sans écriture réussie laisse la case dans l\'état réel', async (): Promise<void> => {
        await render(content({ citizens: [{ userId: 1, tasks: [{ id: 'f', kind: 'free', label: 'Puits', pa: 3 }] }] }));
        const box: HTMLInputElement = root().querySelector<HTMLInputElement>('.tasks input[type="checkbox"]') as HTMLInputElement;

        box.click();
        fixture.detectChanges();

        expect(box.checked).toBe(false);
    });

    it('jour à venir : consignes sans case', async (): Promise<void> => {
        await render(content({ citizens: [{ userId: 1, tasks: [{ id: 'f', kind: 'free', label: 'Puits', pa: 3 }] }] }));
        fake.selected_day.set(11);
        fake.can_track.set(false);
        fixture.detectChanges();

        expect(root().querySelector('.tasks input[type="checkbox"]')).toBeNull();
        expect(text('.tasks')).toContain('Puits');
    });

    it('hors du jour en cours, les cases sont en lecture seule', async (): Promise<void> => {
        await render(content({ citizens: [{ userId: 1, tasks: [{ id: 'f', kind: 'free', label: 'Puits', pa: 3 }] }] }));
        fake.can_track.set(false);
        fixture.detectChanges();

        expect(root().querySelector<HTMLInputElement>('.tasks input[type="checkbox"]')?.disabled).toBe(true);
    });

    it('utilisateur non connecté ou non citoyen : message dédié', async (): Promise<void> => {
        await render(content(), null);
        expect(root().querySelector('.not-citizen')).not.toBeNull();

        setUser(Object.assign(new Me(), { id: 1 }));
        fake.is_citizen.set(false);
        fixture.detectChanges();
        expect(root().querySelector('.not-citizen')).not.toBeNull();
        expect(root().querySelector('.steps')).toBeNull();
    });

    it('proposition non effective : message', async (): Promise<void> => {
        await render();
        fake.selected_plan.set({ ...(fake.selected_plan() as NonNullable<ReturnType<typeof fake.selected_plan>>), isEffective: false });
        fixture.detectChanges();

        expect(root().querySelector('.no-plan')).not.toBeNull();
        expect(root().querySelector('.steps')).toBeNull();
    });

    it('jour passé (sans évaluation) : message', async (): Promise<void> => {
        await render();
        fake.evaluation.set(null);
        fixture.detectChanges();

        expect(root().querySelector('.no-evaluation')).not.toBeNull();
    });

    it('jour passé : consignes du jour et consignes individuelles en lecture seule, avec leur état ce jour-là', async (): Promise<void> => {
        await render(content({ instructions: 'Tous au puits', citizens: [{ userId: 1, tasks: [{ id: 'f', kind: 'free', label: 'Puits', pa: 3 }] }] }));
        fake.citizens_full()[0].daily_actions = [Object.assign(new DailyAction(), { day: 9, action_key: 'task_f' })];
        fake.selected_day.set(9);
        fake.can_track.set(false);
        fake.evaluation.set(null);
        fixture.detectChanges();

        expect(root().querySelector('.no-evaluation')).toBeNull();
        expect(text('.day-instructions')).toContain('Tous au puits');
        const box: HTMLInputElement = root().querySelector<HTMLInputElement>('.tasks input[type="checkbox"]') as HTMLInputElement;
        expect(box.checked).toBe(true);
        expect(box.disabled).toBe(true);
        expect(root().querySelector('.past-note')).not.toBeNull();
    });

    it('rien à faire : message plutôt que des listes vides', async (): Promise<void> => {
        await render(content({ programs: { regular: [], banned: [] } }));

        expect(root().querySelector('.nothing')).not.toBeNull();
        expect(root().querySelector('.steps')).toBeNull();
    });

    it('chantier inconnu : affiché par son identifiant', async (): Promise<void> => {
        await render(content({ programs: { regular: [{ buildingId: 99, kind: 'build', targetRemaining: 0 }], banned: [] } }));

        expect(text('.steps')).toContain('#99');
    });
});
