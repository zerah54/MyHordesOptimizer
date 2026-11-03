import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CitizenFiltersStore } from '../citizen-filters.store';
import { BuildingPlanContentDTO, emptyPlanContent } from '../plan.types';
import { DayEvaluation } from '../plan-evaluation.util';
import { PlanningStore } from '../planning.store';
import { createFakeStore, FAKE_REGULAR_CITIZENS, FakePlanningStore } from '../planning.store.fake';
import { TrackingRow } from '../tracking.util';
import { PlanningCardsComponent } from './planning-cards.component';

function wallProgram(): BuildingPlanContentDTO {
    return {
        ...emptyPlanContent(),
        programs: {
            banned: [{ buildingId: 1, kind: 'build', mode: 'finish', targetRemaining: 0 }],
            regular: [{ kind: 'instruction', text: 'x' }, { buildingId: 1, kind: 'build', mode: 'finish', targetRemaining: 0 }]
        }
    };
}

describe('PlanningCardsComponent', (): void => {
    let fake: FakePlanningStore;
    let fixture: ComponentFixture<PlanningCardsComponent>;
    let rows: WritableSignal<TrackingRow[]>;

    async function render(content: BuildingPlanContentDTO = emptyPlanContent()): Promise<void> {
        fake = createFakeStore(content);
        rows = signal<TrackingRow[]>([]);
        await TestBed.configureTestingModule({
            imports: [PlanningCardsComponent],
            providers: [
                { provide: PlanningStore, useValue: fake.store },
                { provide: CitizenFiltersStore, useValue: { rows } }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(PlanningCardsComponent);
        fixture.detectChanges();
        await fixture.whenStable();
    }

    function card(name: string): HTMLButtonElement {
        return (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(`button[data-card="${name}"]`) as HTMLButtonElement;
    }

    function trackingRow(done_count: number, tasks: number): TrackingRow {
        return { done_count, tasks: new Array(tasks).fill({}) } as unknown as TrackingRow;
    }

    it('propose une carte par sujet, Programme choisi par défaut', async (): Promise<void> => {
        await render();

        const cards: HTMLButtonElement[] = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button[data-card]'));
        expect(cards.map((button: HTMLButtonElement): string | undefined => button.dataset['card'])).toEqual(['program', 'tracking', 'budget', 'resources', 'defense']);
        expect(card('program').getAttribute('aria-pressed')).toBe('true');
        expect(card('budget').getAttribute('aria-pressed')).toBe('false');
    });

    it('un clic choisit la carte', async (): Promise<void> => {
        await render();

        card('resources').click();
        fixture.detectChanges();

        expect(fixture.componentInstance.selected()).toBe('resources');
        expect(card('resources').getAttribute('aria-pressed')).toBe('true');
        expect(card('program').getAttribute('aria-pressed')).toBe('false');
    });

    it('Programme : compte les chantiers sans les consignes, et les PA prévus', async (): Promise<void> => {
        await render(wallProgram());

        expect(card('program').querySelector('.value')?.textContent?.trim()).toBe('2');
        expect(card('program').querySelector('.caption')?.textContent).toContain('chantiers');
        expect(card('program').querySelector('.pa')?.textContent).toMatch(/\d+/);
    });

    it('Suivi : additionne les consignes faites de tous les citoyens', async (): Promise<void> => {
        await render();
        rows.set([trackingRow(1, 2), trackingRow(2, 3)]);
        fixture.detectChanges();

        expect(card('tracking').querySelector('.value')?.textContent?.replace(/\s/g, '')).toBe('3/5');
    });

    it('Suivi d\'un jour futur : seulement le nombre de consignes', async (): Promise<void> => {
        await render();
        rows.set([trackingRow(0, 2)]);
        fake.selected_day.set(11);
        fixture.detectChanges();

        expect(card('tracking').querySelector('.value')?.textContent?.trim()).toBe('2');
        expect(card('tracking').querySelector('.caption')?.textContent).toContain('prévues');
    });

    it('Citoyens et budget : nombre de citoyens', async (): Promise<void> => {
        await render();

        expect(card('budget').querySelector('.value')?.textContent?.trim()).toBe('3');
    });

    describe('budget dans la carte Citoyens et budget', (): void => {
        function pool(name: string): HTMLElement | null {
            return card('budget').querySelector<HTMLElement>(`.budgets .budget[data-pool="${name}"]`);
        }

        it('affiche à côté des citoyens les PA restants et le total de chaque poche, bannis d\'abord', async (): Promise<void> => {
            await render();
            const budgets: DayEvaluation['budgets'] = fake.evaluation()?.budgets as DayEvaluation['budgets'];

            const shown: (string | undefined)[] = Array.from(card('budget').querySelectorAll<HTMLElement>('.budget')).map((element: HTMLElement): string | undefined => element.dataset['pool']);
            expect(shown).toEqual(['banned', 'regular']);
            expect(pool('banned')?.textContent).toContain('Bannis');
            expect(pool('banned')?.querySelector('.value')?.textContent?.trim()).toBe(`${budgets.banned.remaining}`);
            expect(pool('regular')?.textContent).toContain('Non-bannis');
            expect(pool('regular')?.querySelector('.value')?.textContent?.trim()).toBe(`${budgets.regular.remaining}`);
            expect(pool('regular')?.textContent).toContain(`restants sur ${budgets.regular.budget}`);
            expect(pool('regular')?.querySelector('mho-icon-ap')).not.toBeNull();
        });

        it('aucun espace entre les PA prévus et l\'icône PA', async (): Promise<void> => {
            await render();

            const icon: Element | null = card('program').querySelector('.pa mho-icon-ap');
            expect(icon?.querySelector('img')?.previousSibling?.textContent).toMatch(/^\d+$/);
        });

        it('un budget dépassé est en évidence', async (): Promise<void> => {
            await render({ ...emptyPlanContent(), basePa: 0, programs: { banned: [], regular: [{ buildingId: 1, kind: 'build', mode: 'finish', targetRemaining: 0 }] } });

            expect(pool('regular')?.querySelector('.value')?.classList.contains('ko')).toBe(true);
            expect(pool('banned')?.querySelector('.value')?.classList.contains('ko')).toBe(false);
        });

        it('sans poche des bannis affichée, un seul budget sans mention de poche', async (): Promise<void> => {
            await render();
            fake.citizens.set(FAKE_REGULAR_CITIZENS);
            fixture.detectChanges();

            expect(pool('banned')).toBeNull();
            expect(pool('regular')?.textContent).toContain('Budget');
            expect(pool('regular')?.textContent).not.toMatch(/bannis/i);
        });

        it('sans évaluation, pas de budget', async (): Promise<void> => {
            await render();
            fake.evaluation.set(null);
            fixture.detectChanges();

            expect(card('budget').querySelector('.budgets')).toBeNull();
            expect(card('budget').querySelector('.value')?.textContent?.trim()).toBe('3');
        });
    });

    it('Ressources : additionne les objets manquants, en évidence', async (): Promise<void> => {
        await render(wallProgram());

        expect(card('resources').querySelector('.value')?.textContent?.trim()).toBe('1');
        expect(card('resources').querySelector('.value')?.classList.contains('ko')).toBe(true);
    });

    it('Ressources sans manque : pas de mise en évidence', async (): Promise<void> => {
        await render();

        expect(card('resources').querySelector('.value')?.textContent?.trim()).toBe('0');
        expect(card('resources').querySelector('.value')?.classList.contains('ko')).toBe(false);
    });

    it('Défense hors chantiers : total des sources libres', async (): Promise<void> => {
        await render({ ...emptyPlanContent(), defenseSources: [{ label: 'OD', pa: 1, def: 2, qty: 10 }, { label: 'Gratuit', pa: 0, def: 5, qty: 1 }] });

        expect(card('defense').querySelector('.value')?.textContent?.trim()).toBe('+25');
    });

    it('sans évaluation (jour passé), les cartes restent, avec un tiret à la place des chiffres calculés', async (): Promise<void> => {
        await render(wallProgram());
        rows.set([trackingRow(1, 2)]);
        fake.evaluation.set(null);
        fixture.detectChanges();

        expect(card('program').querySelector('.value')?.textContent?.trim()).toBe('2');
        expect(card('program').querySelector('.pa')).toBeNull();
        expect(card('resources').querySelector('.value')?.textContent?.trim()).toBe('—');
        expect(card('tracking').querySelector('.value')?.textContent?.replace(/\s/g, '')).toBe('1/2');
    });

    it('les alertes s\'affichent sur la carte concernée', async (): Promise<void> => {
        await render({ ...wallProgram(), citizens: [{ userId: 1, tasks: [{ kind: 'free', label: 'x', pa: 30 }] }] });

        expect(card('program').querySelector('.alert')).not.toBeNull();
        expect(card('budget').querySelector('.alert')).not.toBeNull();
        expect(card('resources').querySelector('.alert')).toBeNull();
    });

    it('sans alerte, aucune mention', async (): Promise<void> => {
        await render();

        expect((fixture.nativeElement as HTMLElement).querySelector('.alert')).toBeNull();
    });
});
