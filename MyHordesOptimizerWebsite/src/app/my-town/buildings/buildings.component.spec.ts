import { CdkScrollable } from '@angular/cdk/scrolling';
import { ANIMATION_MODULE_TYPE, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import type { Mock } from 'vitest';

import { CitizenFilterSortStore } from '../../_shared/citizen-filters/citizen-filter-sort.store';
import { BuildingsComponent } from './buildings.component';
import { CitizenFiltersStore } from './planning/citizen-filters.store';
import { PlanningItemValuesDialogComponent } from './planning/item-values-dialog/planning-item-values-dialog.component';
import { BuildingPlanContentDTO, emptyPlanContent } from './planning/plan.types';
import { PlanningStore } from './planning/planning.store';
import { createFakeStore, FakePlanningStore } from './planning/planning.store.fake';
import { PlanningTreeDrawerComponent } from './planning/tree-drawer/planning-tree-drawer.component';

describe('BuildingsComponent', (): void => {
    let fake: FakePlanningStore;
    let fixture: ComponentFixture<BuildingsComponent>;
    let open: Mock;

    async function render(plan: BuildingPlanContentDTO = emptyPlanContent()): Promise<void> {
        fake = createFakeStore(plan);
        open = vi.fn().mockReturnValue({ afterClosed: (): unknown => of(undefined) });
        await TestBed.configureTestingModule({
            imports: [BuildingsComponent],
            providers: [provideRouter([]), { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' }]
        })
            .overrideComponent(BuildingsComponent, { set: { providers: [{ provide: PlanningStore, useValue: fake.store }, CitizenFilterSortStore, CitizenFiltersStore] } })
            .overrideProvider(MatDialog, { useValue: { open } })
            .compileComponents();
        fixture = TestBed.createComponent(BuildingsComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function root(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    it('affiche le titre et lance le chargement', async (): Promise<void> => {
        await render();

        expect(root().querySelector('mat-card-title')?.textContent).toContain('Chantiers');
        expect(fake.actions['load']).toHaveBeenCalledTimes(1);
    });

    describe('modifications non enregistrées', (): void => {
        it('sans modification, la page se quitte sans confirmation', async (): Promise<void> => {
            await render();
            let allowed: boolean | undefined;

            fixture.componentInstance.canLeave().subscribe((value: boolean): void => {
                allowed = value;
            });

            expect(allowed).toBe(true);
            expect(open).not.toHaveBeenCalled();
        });

        it('avec des modifications, quitter demande confirmation ; annuler retient la page', async (): Promise<void> => {
            await render();
            fake.dirty.set(true);
            open.mockReturnValue({ afterClosed: (): unknown => of(false) });
            let allowed: boolean | undefined;

            fixture.componentInstance.canLeave().subscribe((value: boolean): void => {
                allowed = value;
            });

            expect(open).toHaveBeenCalledTimes(1);
            expect(allowed).toBe(false);
        });

        it('fermer l\'onglet avec des modifications déclenche l\'alerte du navigateur', async (): Promise<void> => {
            await render();
            fake.dirty.set(true);
            const event: Event = new Event('beforeunload', { cancelable: true });

            window.dispatchEvent(event);

            expect(event.defaultPrevented).toBe(true);
        });
    });

    it('le bouton de partage est à côté du titre, comme sur les autres pages, et plus dans l\'en-tête des propositions', async (): Promise<void> => {
        await render();

        expect(root().querySelector('mat-card-title button[data-action="share"]')).not.toBeNull();
        expect(root().querySelector('mho-planning-header button[data-action="share"]')).toBeNull();
    });

    describe('valeurs des objets (réglage de la ville)', (): void => {
        function itemValues(): HTMLButtonElement | null {
            return root().querySelector<HTMLButtonElement>('mat-card-header button[data-action="item-values"]');
        }

        it('le bouton est dans la zone de titre, hors de l\'en-tête des propositions, et ouvre la boîte', async (): Promise<void> => {
            await render();

            expect(root().querySelector('mho-planning-header button[data-action="item-values"]')).toBeNull();
            itemValues()?.click();

            expect(open.mock.calls[0][0]).toBe(PlanningItemValuesDialogComponent);
        });

        it('absent tant que les données ne sont pas chargées', async (): Promise<void> => {
            await render();
            fake.loading.set(true);
            fixture.detectChanges();
            expect(itemValues()).toBeNull();

            fake.loading.set(false);
            fake.load_failed.set(true);
            fixture.detectChanges();
            expect(itemValues()).toBeNull();
        });
    });

    it('pendant le chargement, affiche un indicateur', async (): Promise<void> => {
        await render();
        fake.loading.set(true);
        fixture.detectChanges();

        expect(root().querySelector('.loading mat-spinner')).not.toBeNull();
        expect(root().querySelector('mho-planning-header')).toBeNull();
    });

    it('un chargement en échec propose de réessayer', async (): Promise<void> => {
        await render();
        fake.load_failed.set(true);
        fixture.detectChanges();

        expect(root().querySelector('.load-failed')).not.toBeNull();
        root().querySelector<HTMLButtonElement>('button[data-action="retry"]')?.click();
        expect(fake.actions['load']).toHaveBeenCalledTimes(2);
    });

    it('assemble l\'en-tête, les chiffres épinglés, les cartes et le programme, sans accordéon', async (): Promise<void> => {
        await render();

        expect(root().querySelector('mho-planning-header')).not.toBeNull();
        expect(root().querySelector('.sticky-kpis mho-planning-kpis')).not.toBeNull();
        expect(root().querySelector('mho-planning-cards')).not.toBeNull();
        expect(root().querySelector('.card-panel mho-planning-program')).not.toBeNull();
        expect(root().querySelector('mat-expansion-panel')).toBeNull();
    });

    it('la ligne épinglée se limite à la défense : budget, manques et alertes passent sur les cartes', async (): Promise<void> => {
        await render();

        expect(root().querySelector('.sticky-kpis .kpi.defense')).not.toBeNull();
        expect(root().querySelector('.sticky-kpis .kpi.pool')).toBeNull();
        expect(root().querySelector('.sticky-kpis [data-action="missing"]')).toBeNull();
        expect(root().querySelector('.sticky-kpis [data-action="alerts"]')).toBeNull();
    });

    it('le contenu est déclaré défilant, pour que le glisser-déposer du programme suive son défilement', async (): Promise<void> => {
        await render();

        const scrollable: DebugElement | null = fixture.debugElement.query(By.directive(CdkScrollable));
        expect((scrollable?.nativeElement as HTMLElement | undefined)?.classList.contains('card-panel')).toBe(true);
    });

    it('la carte choisie remplace le contenu affiché en dessous', async (): Promise<void> => {
        await render();
        const selectors: [string, string][] = [
            ['tracking', 'mho-planning-tracking'],
            ['budget', 'mho-planning-budget'],
            ['resources', 'mho-planning-resources'],
            ['defense', 'mho-planning-defense'],
            ['program', 'mho-planning-program']
        ];

        for (const [name, selector] of selectors) {
            root().querySelector<HTMLButtonElement>(`button[data-card="${name}"]`)?.click();
            fixture.detectChanges();
            await fixture.whenStable();

            expect(root().querySelector(`.card-panel[data-card="${name}"] ${selector}`)).not.toBeNull();
            expect(root().querySelectorAll('.card-panel > :not(.panel-alerts)').length).toBe(1);
        }
    });

    describe('alertes en haut de la partie ouverte', (): void => {
        const overcommitted: BuildingPlanContentDTO = {
            ...emptyPlanContent(),
            programs: { banned: [{ buildingId: 1, kind: 'build', mode: 'finish', targetRemaining: 0 }], regular: [] },
            citizens: [{ userId: 1, tasks: [{ kind: 'free', label: 'x', pa: 30 }] }]
        };

        function alerts(): string[] {
            return Array.from(root().querySelectorAll('.card-panel .panel-alerts li')).map((item: Element): string => item.textContent?.trim() ?? '');
        }

        it('seules les alertes de la carte choisie sont listées', async (): Promise<void> => {
            await render(overcommitted);

            expect(alerts().length).toBe(1);
            expect(alerts()[0]).toContain('Mur');

            root().querySelector<HTMLButtonElement>('button[data-card="budget"]')?.click();
            fixture.detectChanges();

            expect(alerts().length).toBe(1);
            expect(alerts()[0]).toContain('Alice');
        });

        it('sans alerte, pas de liste', async (): Promise<void> => {
            await render();

            expect(root().querySelector('.panel-alerts')).toBeNull();
        });

        it('une alerte du programme amène à la ligne concernée', async (): Promise<void> => {
            await render(overcommitted);
            const line: HTMLElement = root().querySelector<HTMLElement>('#plan-item-banned-0') as HTMLElement;
            line.scrollIntoView = vi.fn();

            root().querySelector<HTMLButtonElement>('.panel-alerts button[data-action="alert"]')?.click();

            expect(line.scrollIntoView).toHaveBeenCalled();
        });
    });

    it('sans proposition : message, ni programme ni chiffres', async (): Promise<void> => {
        await render();
        fake.selected_plan.set(null);
        fake.draft.set(null);
        fake.evaluation.set(null);
        fixture.detectChanges();

        expect(root().querySelector('.no-plan')).not.toBeNull();
        expect(root().querySelector('mho-planning-program')).toBeNull();
        expect(root().querySelector('mho-planning-header')).not.toBeNull();
    });

    it('jour passé : lecture seule signalée', async (): Promise<void> => {
        await render();
        fake.selected_day.set(9);
        fixture.detectChanges();

        expect(root().querySelector('.past-day')).not.toBeNull();
    });

    it('bannière de conflit avec le nom de l\'auteur et fermeture', async (): Promise<void> => {
        await render();
        fake.conflict.set({ author: 'Bob' });
        fixture.detectChanges();

        const banner: HTMLElement = root().querySelector<HTMLElement>('[role="alert"].conflict') as HTMLElement;
        expect(banner.textContent).toContain('Bob');
        banner.querySelector<HTMLButtonElement>('button[data-action="dismiss-conflict"]')?.click();
        expect(fake.actions['dismissConflict']).toHaveBeenCalledTimes(1);
    });

    it('« ＋ Chantiers » d\'une section ouvre le tiroir pour cette section', async (): Promise<void> => {
        await render();

        root().querySelector<HTMLButtonElement>('section.pool[data-pool="banned"] button[data-action="choose"]')?.click();

        expect(open).toHaveBeenCalledTimes(1);
        expect(open.mock.calls[0][0]).toBe(PlanningTreeDrawerComponent);
        expect(open.mock.calls[0][1].data).toEqual({ pool: 'banned' });
    });
});
