import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuildingPlanContentDTO, emptyPlanContent } from '../plan.types';
import { PlanningStore } from '../planning.store';
import { createFakeStore, FAKE_REGULAR_CITIZENS, FakePlanningStore } from '../planning.store.fake';
import { PlanningBudgetComponent } from './planning-budget.component';

/**
 * Une ligne ville « Guitare » ; Alice a une consigne libre, Bob (banni) fouille les déchets.
 * @returns {BuildingPlanContentDTO} Contenu.
 */
function content(): BuildingPlanContentDTO {
    return {
        ...emptyPlanContent(),
        townLines: [{ label: 'Guitare', pool: 'regular', pa: 40 }],
        citizens: [
            { userId: 1, tasks: [{ kind: 'free', label: 'RDE', pa: 3 }] },
            { userId: 2, tasks: [{ kind: 'action', ref: 'trash', count: 2, pa: 2 }] }
        ]
    };
}

describe('PlanningBudgetComponent', (): void => {
    let fake: FakePlanningStore;
    let fixture: ComponentFixture<PlanningBudgetComponent>;

    /**
     * Affiche le budget.
     * @param {BuildingPlanContentDTO} plan Contenu du plan.
     */
    async function render(plan: BuildingPlanContentDTO = content()): Promise<void> {
        fake = createFakeStore(plan);
        await TestBed.configureTestingModule({
            imports: [PlanningBudgetComponent],
            providers: [{ provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' }, { provide: PlanningStore, useValue: fake.store }]
        }).compileComponents();
        fixture = TestBed.createComponent(PlanningBudgetComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    /**
     * Racine du composant.
     * @returns {HTMLElement} Élément.
     */
    function root(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    /**
     * Valeur d'une catégorie pour une poche.
     * @param {string} category Catégorie.
     * @param {string} pool Poche.
     * @returns {string | undefined} Texte de la cellule.
     */
    function cell(category: string, pool: string): string | undefined {
        return root().querySelector(`table.breakdown tr[data-category="${category}"] td[data-pool="${pool}"]`)?.textContent?.trim();
    }

    it('une ligne par catégorie non vide, puis le reste de chaque poche', async (): Promise<void> => {
        await render();

        const categories: string[] = Array.from(root().querySelectorAll<HTMLElement>('table.breakdown tr[data-category]'))
            .map((row: HTMLElement): string => row.dataset['category'] ?? '');
        expect(categories).toEqual(['basePa', 'technicianCp', 'action:trash', 'free', 'townLines', 'remaining']);
        expect(cell('action:trash', 'banned')).toBe('-2');
        expect(cell('free', 'regular')).toBe('-3');
        expect(root().querySelector('table.breakdown tr[data-category="action:trash"] th')?.textContent?.trim()).toBe('Fouiller les déchets');
        expect(cell('remaining', 'regular')).toBe(`${fake.evaluation()?.budgets.regular.remaining}`);
    });

    it('les PA de base et les PC du technicien sont libellés par leur icône', async (): Promise<void> => {
        await render();

        expect(root().querySelector('table.breakdown tr[data-category="basePa"] th mho-icon-ap img')).not.toBeNull();
        expect(root().querySelector('table.breakdown tr[data-category="technicianCp"] th mho-icon-cp img')).not.toBeNull();
    });

    it('les bannis avant les non-bannis', async (): Promise<void> => {
        await render();

        const pools: (string | null)[] = Array.from(root().querySelectorAll<HTMLElement>('table.breakdown thead th[data-pool]'))
            .map((header: HTMLElement): string | null => header.getAttribute('data-pool'));
        expect(pools).toEqual(['banned', 'regular']);
    });

    it('sans poche des bannis affichée : une seule colonne, sans nom de poche', async (): Promise<void> => {
        await render();
        fake.citizens.set(FAKE_REGULAR_CITIZENS);
        fixture.detectChanges();

        expect(root().querySelector('table.breakdown [data-pool="banned"]')).toBeNull();
        expect(root().querySelector('table.breakdown')?.textContent).not.toMatch(/bannis|poche/i);
        expect(root().querySelector('tr.line mat-select')).toBeNull();
        expect(root().querySelector('table.lines')?.textContent).not.toMatch(/poche/i);
    });

    it('un reste négatif est marqué', async (): Promise<void> => {
        await render({ ...content(), townLines: [{ label: 'Perte', pool: 'regular', pa: -100 }] });

        expect(root().querySelector('table.breakdown td.remaining[data-pool="regular"]')?.classList.contains('negative')).toBe(true);
        expect(root().querySelector('table.breakdown td.remaining[data-pool="banned"]')?.classList.contains('negative')).toBe(false);
    });

    it('plus de liste de citoyens', async (): Promise<void> => {
        await render();

        expect(root().querySelector('tr.citizen, mho-planning-citizen-filters, input[data-field="base-pa"]')).toBeNull();
    });

    it('ajoute et supprime une ligne ville', async (): Promise<void> => {
        await render();

        root().querySelector<HTMLButtonElement>('button[data-action="add-line"]')?.click();
        expect(fake.draft()?.townLines[1]).toEqual({ label: '', pool: 'regular', pa: 0 });

        fixture.detectChanges();
        root().querySelector<HTMLButtonElement>('button[data-action="remove-line"]')?.click();
        expect(fake.draft()?.townLines.length).toBe(1);
        expect(fake.draft()?.townLines[0].label).toBe('');
    });

    it('lecture seule : les lignes de la ville ne se modifient pas', async (): Promise<void> => {
        await render();
        fake.can_edit.set(false);
        fake.can_validate_budget.set(false);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const controls: HTMLElement[] = Array.from(root().querySelectorAll<HTMLElement>('button, input'));
        expect(controls.length).toBeGreaterThan(0);
        expect(controls.every((control: HTMLElement): boolean => (control as HTMLButtonElement).disabled)).toBe(true);
    });

    it('modèles de lignes ajoutés comme lignes ordinaires (mode simple)', async (): Promise<void> => {
        await render({ ...content(), budgetMode: 'simple' });
        const internals: { addPreset(preset: 'guitar' | 'dice' | 'cs'): void } = fixture.componentInstance as unknown as { addPreset(preset: 'guitar' | 'dice' | 'cs'): void };

        internals.addPreset('guitar');
        internals.addPreset('dice');
        internals.addPreset('cs');

        expect(fake.draft()?.townLines.slice(1)).toEqual([
            { label: 'Guitare artisanale', pool: 'regular', pa: 0 },
            { label: 'Dés / Cartes', pool: 'regular', pa: 0 },
            { label: 'Coin sieste', pool: 'regular', pa: 0 }
        ]);
    });

    it('le bouton de modèles n\'existe qu\'en mode simple et se désactive en lecture seule', async (): Promise<void> => {
        await render();
        expect(root().querySelector('[data-action="add-preset"]')).toBeNull();

        fake.draft.set({ ...content(), budgetMode: 'simple' });
        fixture.detectChanges();
        expect(root().querySelector<HTMLButtonElement>('[data-action="add-preset"]')?.disabled).toBe(false);

        fake.can_edit.set(false);
        fixture.detectChanges();
        expect(root().querySelector<HTMLButtonElement>('[data-action="add-preset"]')?.disabled).toBe(true);
    });

    describe('budget validé', (): void => {
        it('le bouton est inactif sans possibilité de valider, et déclenche la validation sinon', async (): Promise<void> => {
            await render();
            const button: HTMLButtonElement = root().querySelector<HTMLButtonElement>('[data-action="validate-budget"]') as HTMLButtonElement;
            expect(button.disabled).toBe(false);
            expect(button.textContent?.trim()).toBe('Valider le budget');
            button.click();
            expect(fake.actions['validateBudget']).toHaveBeenCalledTimes(1);

            fake.can_validate_budget.set(false);
            fixture.detectChanges();
            expect(root().querySelector<HTMLButtonElement>('[data-action="validate-budget"]')?.disabled).toBe(true);
        });

        it('le libellé devient « Revalider » et la date s\'affiche une fois validé ; pas d\'écart sans diff', async (): Promise<void> => {
            await render({ ...content(), validatedBudget: { validatedAt: '2026-11-13T10:00:00Z', pools: { banned: { budget: 0, cost: 0 }, regular: { budget: 0, cost: 0 } }, steps: [] } });

            expect(root().querySelector('[data-action="validate-budget"]')?.textContent?.trim()).toBe('Revalider le budget');
            expect(root().querySelector('[data-field="validated-at"]')).not.toBeNull();
            expect(root().querySelector('[data-section="budget-diff"]')).toBeNull();
        });

        it('affiche les écarts par poche et la liste des étapes ajoutées, retirées et modifiées', async (): Promise<void> => {
            await render();
            fake.budget_diff.set({
                pools: { banned: { budget: 0, cost: 0, remaining: 0 }, regular: { budget: 2, cost: 30, remaining: -28 } },
                steps: [
                    { buildingId: 1, kind: 'build', change: 'added', delta: 30 },
                    { buildingId: 2, kind: 'build', change: 'removed', delta: -20 },
                    { buildingId: 3, kind: 'repair', change: 'changed', delta: 5 }
                ]
            });
            fixture.detectChanges();

            const text = (selector: string): string | undefined => root().querySelector(selector)?.textContent?.trim();
            expect(text('[data-section="budget-diff"] tr[data-pool="regular"] [data-diff-field="budget"]')).toContain('+2');
            expect(text('[data-section="budget-diff"] tr[data-pool="regular"] [data-diff-field="cost"]')).toContain('+30');
            expect(text('[data-section="budget-diff"] tr[data-pool="regular"] [data-diff-field="remaining"]')).toContain('-28');
            expect(root().querySelector('tr[data-pool="regular"] [data-diff-field="remaining"]')?.classList).toContain('negative');
            expect(text('[data-diff="added"]')).toContain('Mur');
            expect(text('[data-diff="removed"]')).toContain('Atelier');
            expect(text('[data-diff="changed"]')).toContain('Porte');
            expect(text('[data-diff="removed"]')).toContain('-20');
        });
    });
});
