import { Clipboard } from '@angular/cdk/clipboard';
import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NEVER, Subject } from 'rxjs';
import type { Mock } from 'vitest';

import { RealtimeNightwatchPlansService } from '../../_abstract_model/realtime-services/realtime-nightwatch-plans.service';
import { ApiService } from '../../_abstract_model/services/api.service';
import { SnackbarService } from '../../_core/services/snackbar.service';
import { TownContextService } from '../../_core/services/town-context.service';
import { NightwatchComponent } from './nightwatch.component';
import { NightwatchStore } from './nightwatch.store';
import { createFakeNightwatchStore, FAKE_NIGHTWATCH_STATE, FakeNightwatchStore } from './nightwatch.store.fake';
import { NightwatchPlanContentDTO } from './nightwatch.types';
import { buildForumInput } from './nightwatch-forum-input.util';
import { buildForumLabels } from './nightwatch-forum-labels';
import { buildForumPost } from './nightwatch-forum-post.util';
import { statusLabel } from './nightwatch-status-labels';
import { NightwatchBuildingNeedsService } from './stock-tab/building-needs.service';

describe('NightwatchComponent', (): void => {
    let fake: FakeNightwatchStore;
    let fixture: ComponentFixture<NightwatchComponent>;
    let join: Mock;
    let leave: Mock;
    let copy: Mock;
    let success: Mock;
    let failure: Mock;

    async function render(setup: (fake: FakeNightwatchStore) => void = (): void => undefined, readonly: boolean = false): Promise<void> {
        fake = createFakeNightwatchStore();
        join = vi.fn((): Promise<number[]> => Promise.resolve([]));
        leave = vi.fn((): Promise<void> => Promise.resolve());
        copy = vi.fn((): boolean => true);
        success = vi.fn();
        failure = vi.fn();
        setup(fake);
        TestBed.configureTestingModule({
            imports: [NightwatchComponent],
            providers: [
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                { provide: RealtimeNightwatchPlansService, useValue: { joinPresence: join, leavePresence: leave, users$: new Subject<number[]>().asObservable() } },
                { provide: Clipboard, useValue: { copy } },
                { provide: SnackbarService, useValue: { successSnackbar: success, errorSnackbar: failure } },
                { provide: TownContextService, useValue: { isReadonly: (): boolean => readonly } },
                { provide: ApiService, useValue: { getItems: (): Subject<never[]> => new Subject<never[]>() } },
                { provide: NightwatchBuildingNeedsService, useValue: { needsOfDay: (): typeof NEVER => NEVER } },
                provideRouter([])
            ]
        });
        TestBed.overrideComponent(NightwatchComponent, { set: { providers: [{ provide: NightwatchStore, useValue: fake.store }] } });
        await TestBed.compileComponents();
        fixture = TestBed.createComponent(NightwatchComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function root(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    afterEach((): void => {
        TestBed.resetTestingModule();
    });

    it('affiche le titre « Veilles », charge le store et déclare la présence à l\'ouverture', async (): Promise<void> => {
        await render();

        expect(root().querySelector('mat-card-title mho-page-title')?.textContent?.trim()).toBe('Veilles');
        expect(fake.actions.load).toHaveBeenCalledTimes(1);
        expect(join).toHaveBeenCalledTimes(1);
    });

    it('retire la présence à la destruction, après la déclaration', async (): Promise<void> => {
        await render();

        fixture.destroy();
        await Promise.resolve();
        await Promise.resolve();

        expect(leave).toHaveBeenCalledTimes(1);
    });

    it('ne déclare aucune présence sur une ville observée', async (): Promise<void> => {
        await render((): void => undefined, true);

        expect(join).not.toHaveBeenCalled();
    });

    it('propose les onglets Simulations, Plan, Bilan et Soir de veille', async (): Promise<void> => {
        await render();

        const labels: string[] = Array.from(root().querySelectorAll('[role="tab"]')).map((tab: Element): string => tab.textContent?.trim() ?? '');
        expect(labels).toEqual(['Simulations', 'Plan', 'Bilan', 'Soir de veille']);
    });

    it('ouvre l\'onglet Plan par défaut', async (): Promise<void> => {
        await render();

        const selected: Element | null = root().querySelector('[role="tab"][aria-selected="true"]');
        expect(selected?.textContent?.trim()).toBe('Plan');
    });

    it('ville observée : message de lecture seule', async (): Promise<void> => {
        await render((): void => undefined, true);

        expect(root().querySelector('[data-field="readonly-town"]')?.textContent).toContain('lecture seule');
    });

    it('ville non observée : pas de message de ville observée', async (): Promise<void> => {
        await render();

        expect(root().querySelector('[data-field="readonly-town"]')).toBeNull();
    });

    it('jour passé : message de lecture seule', async (): Promise<void> => {
        await render((f: FakeNightwatchStore): void => {
            f.selected_day.set(9);
            f.can_write.set(false);
            f.can_edit.set(false);
        });

        expect(root().querySelector('[data-field="past-day"]')?.textContent).toContain('lecture seule');
    });

    it('main tenue par un autre : nom du détenteur et prise de main', async (): Promise<void> => {
        await render((f: FakeNightwatchStore): void => {
            f.lock.set({ kind: 'other', userId: 3, sameUser: false });
            f.can_edit.set(false);
        });

        root().querySelector<HTMLButtonElement>('button[data-action="take-lock"]')?.click();

        expect(root().querySelector('[data-field="lock-banner"]')?.textContent).toContain('Chloé');
        expect(fake.actions.takeLock).toHaveBeenCalledTimes(1);
    });

    it('affiche la bannière de conflit et la ferme', async (): Promise<void> => {
        await render((f: FakeNightwatchStore): void => {
            f.conflict.set({ plan_id: 7, author: 'Zerah', kept: true });
        });

        expect(root().querySelector('[role="alert"]')?.textContent).toContain('Zerah');
        root().querySelector<HTMLButtonElement>('button[data-action="dismiss-conflict"]')?.click();
        expect(fake.actions.dismissConflict).toHaveBeenCalledTimes(1);
    });

    it('en échec de chargement, propose de réessayer', async (): Promise<void> => {
        await render((f: FakeNightwatchStore): void => {
            f.load_failed.set(true);
        });

        root().querySelector<HTMLButtonElement>('button[data-action="retry"]')?.click();

        expect(fake.actions.load).toHaveBeenCalledTimes(2);
    });

    it('partage forum comme les autres pages : icône à côté du titre, infobulle « Copier au format forum »', async (): Promise<void> => {
        await render();

        const button: HTMLButtonElement | null = root().querySelector<HTMLButtonElement>('mat-card-title button[mat-icon-button][data-action="copy-forum"]');
        expect(button?.querySelector('mat-icon')?.textContent?.trim()).toBe('share');
        expect(root().querySelector('.actions')).toBeNull();
    });

    it('bouton « Copier le message forum » désactivé sans veilleur', async (): Promise<void> => {
        await render();

        const button: HTMLButtonElement = root().querySelector<HTMLButtonElement>('button[data-action="copy-forum"]') as HTMLButtonElement;
        expect(button.disabled).toBe(true);
        button.click();
        expect(copy).not.toHaveBeenCalled();
    });

    it('bouton « Copier le message forum » : copie le message construit depuis le store, avec confirmation', async (): Promise<void> => {
        await render((f: FakeNightwatchStore): void => {
            f.draft.set({ instructions: 'Soyez à l\'heure', watchers: [{ userId: 1, statuses: [], items: {}, hasDiscourse: false }], manualStock: {} });
            f.watcher_rows.set([{ user_id: 1, name: 'Alice', past_watches: 0, defense: 42, risk: 0, tier: 'certain', alerts: [] }]);
            f.totals.set({ defense: 300, real_defense: 280, planned_margin: 5, real_margin: 5, cost: { repair_pa: 12, batteries: 5, water: 3 }, watcher_count: 1, cap: 4 });
        });

        const button: HTMLButtonElement = root().querySelector<HTMLButtonElement>('button[data-action="copy-forum"]') as HTMLButtonElement;
        expect(button.disabled).toBe(false);
        button.click();

        expect(copy).toHaveBeenCalledTimes(1);
        const text: string = copy.mock.calls[0][0] as string;
        const expected: string = buildForumPost(buildForumInput({
            draft: fake.draft() as NightwatchPlanContentDTO,
            rows: fake.watcher_rows(),
            citizens: FAKE_NIGHTWATCH_STATE.citizens,
            stock_lines: [],
            referential: null,
            total_defense: 300,
            cost: { repair_pa: 12, batteries: 5, water: 3 },
            itemLabel: (item_id: number): string => `#${item_id}`,
            statusLabel
        }), buildForumLabels());
        expect(text).toBe(expected);
        expect(text).toContain('Alice');
        expect(success).toHaveBeenCalledTimes(1);
        expect(failure).not.toHaveBeenCalled();
    });

    it('bouton « Copier le message forum » : copie refusée -> message d\'échec, jamais de succès', async (): Promise<void> => {
        await render((f: FakeNightwatchStore): void => {
            f.draft.set({ instructions: null, watchers: [{ userId: 1, statuses: [], items: {}, hasDiscourse: false }], manualStock: {} });
            f.totals.set({ defense: 300, real_defense: 280, planned_margin: 5, real_margin: 5, cost: { repair_pa: 12, batteries: 5, water: 3 }, watcher_count: 1, cap: 4 });
        });
        copy.mockReturnValue(false);

        root().querySelector<HTMLButtonElement>('button[data-action="copy-forum"]')?.click();

        expect(copy).toHaveBeenCalledTimes(1);
        expect(failure).toHaveBeenCalledTimes(1);
        expect(success).not.toHaveBeenCalled();
    });
});
