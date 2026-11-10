import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuildingPlanContentDTO, emptyPlanContent, PlanDefenseSourceDTO } from '../plan.types';
import { PlanningStore } from '../planning.store';
import { createFakeStore, FakePlanningStore } from '../planning.store.fake';
import { PlanningDefenseComponent } from './planning-defense.component';

function content(): BuildingPlanContentDTO {
    return { ...emptyPlanContent(), defenseSources: [{ label: 'OD', pa: 1, def: 2, qty: 10 }, { label: 'Gratuit', pa: 0, def: 5, qty: 1 }] };
}

describe('PlanningDefenseComponent', (): void => {
    let fake: FakePlanningStore;
    let fixture: ComponentFixture<PlanningDefenseComponent>;

    async function render(plan: BuildingPlanContentDTO = content()): Promise<void> {
        fake = createFakeStore(plan);
        await TestBed.configureTestingModule({
            imports: [PlanningDefenseComponent],
            providers: [{ provide: PlanningStore, useValue: fake.store }]
        }).compileComponents();
        fixture = TestBed.createComponent(PlanningDefenseComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function root(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    function type(input: HTMLInputElement, value: string): void {
        input.value = value;
        input.dispatchEvent(new Event('input'));
    }

    afterEach((): void => {
        vi.useRealTimers();
    });

    it('ne présente que les sources de défense (classement et valeurs d\'objets déplacés)', async (): Promise<void> => {
        await render();

        expect(root().querySelector('tr.ranked')).toBeNull();
        expect(root().querySelector('tr.value')).toBeNull();
        expect(root().querySelectorAll('tr.source').length).toBe(2);
    });

    it('ajoute, modifie et supprime une source de défense', async (): Promise<void> => {
        await render();

        root().querySelector<HTMLButtonElement>('button[data-action="add-source"]')?.click();
        expect(fake.draft()?.defenseSources[2]).toEqual({ label: '', pa: 0, def: 0, qty: 1 });

        fixture.detectChanges();
        vi.useFakeTimers();
        type(root().querySelector<HTMLInputElement>('tr.source input[data-field="source-def"]') as HTMLInputElement, '3');
        vi.advanceTimersByTime(400);
        expect(fake.draft()?.defenseSources[0].def).toBe(3);

        vi.useRealTimers();
        fixture.detectChanges();
        root().querySelector<HTMLButtonElement>('tr.source button[data-action="remove-source"]')?.click();
        expect(fake.draft()?.defenseSources.map((source: PlanDefenseSourceDTO): string => source.label)).toEqual(['Gratuit', '']);
    });

    it('ajoute une perte sur un chantier construit au soir, affiche son effet et la supprime', async (): Promise<void> => {
        await render();

        root().querySelector<HTMLButtonElement>('button[data-action="add-loss"]')?.click();
        expect(fake.draft()?.losses).toEqual([{ buildingId: 3, kind: 'destroyed' }]);

        fixture.detectChanges();
        const row: HTMLElement | null = root().querySelector('tr.loss');
        expect(row?.getAttribute('data-building')).toBe('3');
        expect(row?.querySelector('.loss-def')?.textContent).toContain('−5');
        expect(row?.querySelector('.loss-def')?.textContent).toContain('dès demain');

        root().querySelector<HTMLButtonElement>('tr.loss button[data-action="remove-loss"]')?.click();
        expect(fake.draft()?.losses).toEqual([]);
    });

    it('lecture seule : les contrôles sont désactivés', async (): Promise<void> => {
        await render();
        fake.can_edit.set(false);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const controls: HTMLElement[] = Array.from(root().querySelectorAll<HTMLElement>('button, input'));
        expect(controls.length).toBeGreaterThan(0);
        expect(controls.every((control: HTMLElement): boolean => (control as HTMLButtonElement).disabled)).toBe(true);
    });
});
