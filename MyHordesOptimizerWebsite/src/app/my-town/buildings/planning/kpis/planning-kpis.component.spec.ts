import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuildingPlanContentDTO, emptyPlanContent } from '../plan.types';
import { PlanningStore } from '../planning.store';
import { createFakeStore, FAKE_REGULAR_CITIZENS, FakePlanningStore } from '../planning.store.fake';
import { PlanningKpisComponent } from './planning-kpis.component';

function finishingWall(): BuildingPlanContentDTO {
    return {
        ...emptyPlanContent(),
        programs: { banned: [{ buildingId: 1, kind: 'build', mode: 'finish', targetRemaining: 0 }], regular: [{ buildingId: 1, kind: 'build', mode: 'finish', targetRemaining: 0 }] }
    };
}

describe('PlanningKpisComponent', (): void => {
    let fake: FakePlanningStore;
    let fixture: ComponentFixture<PlanningKpisComponent>;

    async function render(content: BuildingPlanContentDTO = emptyPlanContent()): Promise<void> {
        fake = createFakeStore(content);
        await TestBed.configureTestingModule({
            imports: [PlanningKpisComponent],
            providers: [
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                { provide: PlanningStore, useValue: fake.store }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(PlanningKpisComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function root(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    afterEach((): void => {
        vi.useRealTimers();
        document.querySelectorAll('[id^="plan-item-"]').forEach((element: Element): void => element.remove());
    });

    it('affiche la défense projetée, la cible et le reste à couvrir', async (): Promise<void> => {
        await render();

        const defense: HTMLElement = root().querySelector<HTMLElement>('.kpi.defense') as HTMLElement;
        expect(defense.getAttribute('data-state')).toBe('gap');
        expect(defense.textContent).toContain('1000');
        expect(defense.textContent).toContain('1100');
        expect(defense.querySelector('.gap')?.textContent).toContain('100');
    });

    it('affiche les PA restants de chaque poche, négatifs en évidence', async (): Promise<void> => {
        await render({ ...emptyPlanContent(), basePa: 0, programs: { banned: [], regular: [{ buildingId: 1, kind: 'build', mode: 'finish', targetRemaining: 0 }] } });

        const regular: HTMLElement = root().querySelector<HTMLElement>('.kpi[data-pool="regular"]') as HTMLElement;
        expect(regular.querySelector('.negative')).not.toBeNull();
        expect(root().querySelector('.kpi[data-pool="banned"] .negative')).toBeNull();
    });

    it('affiche les bannis avant les non-bannis', async (): Promise<void> => {
        await render();

        const order: (string | null)[] = Array.from(root().querySelectorAll<HTMLElement>('.kpi.pool'))
            .map((kpi: HTMLElement): string | null => kpi.getAttribute('data-pool'));
        expect(order).toEqual(['banned', 'regular']);
    });

    it('sans poche des bannis affichée, un seul indicateur de budget, sans mention de poche', async (): Promise<void> => {
        await render();
        fake.citizens.set(FAKE_REGULAR_CITIZENS);
        fixture.detectChanges();

        expect(root().querySelector('.kpi[data-pool="banned"]')).toBeNull();
        const regular: HTMLElement = root().querySelector<HTMLElement>('.kpi[data-pool="regular"]') as HTMLElement;
        expect(regular.textContent).not.toMatch(/bannis/i);
        expect(regular.querySelector('.title')?.textContent).toContain('Budget');
    });

    it('rappelle le budget total de chaque poche à côté du reste', async (): Promise<void> => {
        await render();

        expect(root().querySelector('.kpi[data-pool="regular"] .sub')?.textContent).toMatch(/44/);
    });

    it('affiche les manques, sans lien vers un détail absent du tiroir', async (): Promise<void> => {
        await render(finishingWall());

        const missing: HTMLElement = root().querySelector<HTMLElement>('[data-action="missing"]') as HTMLElement;
        expect(missing.tagName).toBe('DIV');
        expect(missing.classList.contains('ko')).toBe(true);
        expect(missing.querySelector('.value.list')?.textContent).toMatch(/^1 /);
    });

    it('en mode réduit : la défense seule, et rien de cliquable hors sa modification', async (): Promise<void> => {
        await render(finishingWall());
        fixture.componentRef.setInput('flat', true);
        fixture.detectChanges();

        expect(root().querySelector('.kpis.flat .kpi.defense')).not.toBeNull();
        expect(root().querySelector('.kpi.pool')).toBeNull();
        expect(root().querySelector('[data-action="missing"]')).toBeNull();
        expect(root().querySelector('[data-action="alerts"]')).toBeNull();
        expect(Array.from(root().querySelectorAll('button')).map((button: HTMLButtonElement): string | null => button.getAttribute('data-action'))).toEqual(['edit-defense']);
    });

    it('les alertes listent les problèmes et amènent à la ligne concernée', async (): Promise<void> => {
        await render(finishingWall());
        const target: HTMLElement = document.createElement('div');
        target.id = 'plan-item-banned-0';
        target.scrollIntoView = vi.fn();
        document.body.appendChild(target);

        root().querySelector<HTMLButtonElement>('button[data-action="alerts"]')?.click();
        fixture.detectChanges();
        const items: HTMLButtonElement[] = Array.from(document.querySelectorAll<HTMLButtonElement>('.mat-mdc-menu-panel button[data-action="alert"]'));
        expect(items.length).toBeGreaterThan(0);
        items[0].click();

        expect(target.scrollIntoView).toHaveBeenCalled();
    });

    it('sans alerte, le bouton des alertes est désactivé', async (): Promise<void> => {
        await render();

        expect(root().querySelector<HTMLButtonElement>('button[data-action="alerts"]')?.disabled).toBe(true);
    });

    it('le mode réduit se porte sur le composant, pour garder le formulaire sur la même ligne que la défense', async (): Promise<void> => {
        await render();
        expect(root().classList.contains('flat')).toBe(false);

        fixture.componentRef.setInput('flat', true);
        root().querySelector<HTMLButtonElement>('button[data-action="edit-defense"]')?.click();
        fixture.detectChanges();

        expect(root().classList.contains('flat')).toBe(true);
        expect(root().querySelector(':scope > .defense-fields input[data-field="attack-override"]')).not.toBeNull();
    });

    it('l\'attaque et le débordement se modifient en ligne, après un court délai', async (): Promise<void> => {
        await render();
        root().querySelector<HTMLButtonElement>('button[data-action="edit-defense"]')?.click();
        fixture.detectChanges();
        await fixture.whenStable();
        vi.useFakeTimers();

        const attack: HTMLInputElement = root().querySelector<HTMLInputElement>('input[data-field="attack-override"]') as HTMLInputElement;
        attack.value = '1500';
        attack.dispatchEvent(new Event('input'));
        const overflow: HTMLInputElement = root().querySelector<HTMLInputElement>('input[data-field="overflow"]') as HTMLInputElement;
        overflow.value = '30';
        overflow.dispatchEvent(new Event('input'));
        vi.advanceTimersByTime(400);

        expect(fake.draft()?.attackOverride).toBe(1500);
        expect(fake.draft()?.allowedOverflow).toBe(30);

        attack.value = '';
        attack.dispatchEvent(new Event('input'));
        vi.advanceTimersByTime(400);
        expect(fake.draft()?.attackOverride).toBeNull();
    });

    it('lecture seule : pas de modification de l\'attaque', async (): Promise<void> => {
        await render();
        fake.can_edit.set(false);
        fixture.detectChanges();

        expect(root().querySelector('button[data-action="edit-defense"]')).toBeNull();
    });

    it('sans évaluation (jour passé), le bandeau est vide', async (): Promise<void> => {
        await render();
        fake.evaluation.set(null);
        fixture.detectChanges();

        expect(root().querySelector('.kpi')).toBeNull();
    });
});
