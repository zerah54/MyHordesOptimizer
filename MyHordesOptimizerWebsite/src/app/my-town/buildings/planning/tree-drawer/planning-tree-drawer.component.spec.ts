import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import type { Mock } from 'vitest';

import { Building } from '../../../../_abstract_model/types/building.class';
import { TownDetails } from '../../../../_abstract_model/types/town-details.class';
import { setTown } from '../../../../_core/utilities/localstorage.util';
import { BuildingProgress } from '../building-progress.util';
import { BuildingPlanContentDTO, emptyPlanContent, isBuildingStep, PlanItemDTO, PlanPool } from '../plan.types';
import { PlanningStore } from '../planning.store';
import { createFakeStore, FAKE_REGULAR_CITIZENS, fakeCatalog, fakeEvaluation, FakePlanningStore } from '../planning.store.fake';
import { PlanningTreeDrawerComponent } from './planning-tree-drawer.component';

function content(): BuildingPlanContentDTO {
    return { ...emptyPlanContent(), programs: { banned: [], regular: [{ buildingId: 1, kind: 'build', mode: 'finish', targetRemaining: 0 }] } };
}

describe('PlanningTreeDrawerComponent', (): void => {
    let fake: FakePlanningStore;
    let fixture: ComponentFixture<PlanningTreeDrawerComponent>;
    let close: Mock;

    async function render(pool: PlanPool = 'regular', plan: BuildingPlanContentDTO = content(), catalog: Building[] = fakeCatalog()): Promise<void> {
        fake = createFakeStore(plan);
        fake.catalog.set(catalog);
        close = vi.fn();
        await TestBed.configureTestingModule({
            imports: [PlanningTreeDrawerComponent],
            providers: [
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                { provide: PlanningStore, useValue: fake.store },
                { provide: MAT_DIALOG_DATA, useValue: { pool } },
                { provide: MatDialogRef, useValue: { close } }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(PlanningTreeDrawerComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function root(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    function rows(): HTMLElement[] {
        return Array.from(root().querySelectorAll<HTMLElement>('tr.building-row'));
    }

    function names(): string[] {
        return rows().map((row: HTMLElement): string => row.querySelector('.name')?.textContent?.trim() ?? '');
    }

    function row(id: number): HTMLElement {
        return root().querySelector<HTMLElement>(`tr.building-row[data-building="${id}"]`) as HTMLElement;
    }

    function click(action: string): void {
        root().querySelector<HTMLElement>(`[data-action="${action}"]`)?.click();
        fixture.detectChanges();
    }

    afterEach((): void => {
        setTown(null);
    });

    it('sans poche des bannis affichée, ni le titre ni les rappels ne nomment de poche', async (): Promise<void> => {
        await render();
        fake.citizens.set(FAKE_REGULAR_CITIZENS);
        fixture.detectChanges();

        expect(root().querySelector('.drawer-header h2')?.textContent).not.toMatch(/bannis|—/i);
        expect(row(1).querySelector('.program-tag')?.textContent?.trim().startsWith('#1')).toBe(true);
    });

    it('les chiffres clés restent visibles en tête du tiroir pendant qu\'on coche', async (): Promise<void> => {
        await render();

        expect(root().querySelector('.drawer mho-planning-kpis .kpi[data-pool="banned"]')).not.toBeNull();
    });

    it('en Pandémonium, tous les chantiers sont listés par défaut (niveau de plan réglable)', async (): Promise<void> => {
        setTown(Object.assign(new TownDetails(), { town_id: 42, day: 10, town_type: 'PANDE' }));
        await render();

        expect(names()).toEqual(['Mur', 'Atelier', 'Porte']);
    });

    it('par défaut, ne liste que les chantiers débloqués, dans l\'ordre de l\'arbre', async (): Promise<void> => {
        await render();

        expect(names()).toEqual(['Mur', 'Porte']);
        click('unlocked-only');
        expect(names()).toEqual(['Mur', 'Atelier', 'Porte']);
    });

    it('la case reflète la présence du chantier dans la section ouverte', async (): Promise<void> => {
        await render('regular');
        expect(row(1).querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked).toBe(true);
        expect(row(3).querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked).toBe(false);

        TestBed.resetTestingModule();
        await render('banned');
        expect(row(1).querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked).toBe(false);
    });

    it('cocher ajoute le chantier à la section avec l\'action par défaut, décocher le retire', async (): Promise<void> => {
        await render('regular');

        row(3).querySelector<HTMLInputElement>('input[type="checkbox"]')?.click();
        expect(fake.draft()?.programs.regular[1]).toEqual({ buildingId: 3, kind: 'repair', mode: 'finish', targetRemaining: 0 });

        fixture.detectChanges();
        row(1).querySelector<HTMLInputElement>('input[type="checkbox"]')?.click();
        expect(fake.draft()?.programs.regular.map((item: PlanItemDTO): number => (isBuildingStep(item) ? item.buildingId : -1))).toEqual([3]);
    });

    it('un chantier construit sans dégâts n\'a pas de case (rien à construire ni à réparer)', async (): Promise<void> => {
        await render('regular');
        fake.evaluation.set(fakeEvaluation(content(), {
            progress: new Map<number, BuildingProgress>([
                [1, { buildingId: 1, paCurrent: 40, invested: 10, built: false, life: 0, maxLife: 30, def: 0, defMax: 30 }],
                [2, { buildingId: 2, paCurrent: 20, invested: 0, built: false, life: 0, maxLife: 0, def: 0, defMax: 0 }],
                [3, { buildingId: 3, paCurrent: 10, invested: 10, built: true, life: 30, maxLife: 30, def: 15, defMax: 15 }]
            ])
        }));
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(row(3).querySelector('input[type="checkbox"]')).toBeNull();
        expect(row(1).querySelector<HTMLInputElement>('input[type="checkbox"]')?.disabled).toBe(false);
    });

    it('affiche l\'état du chantier dans la ville', async (): Promise<void> => {
        await render();

        expect(row(1).querySelector('.state')?.getAttribute('data-state')).toBe('in-progress');
        expect(row(1).querySelector('.state')?.textContent).toContain('30');
        expect(row(3).querySelector('.state')?.getAttribute('data-state')).toBe('built');
        expect(row(3).querySelector('.state')?.textContent).toMatch(/10\s*\/\s*30/);
    });

    it('rappelle le rang et l\'action prévus dans chaque section', async (): Promise<void> => {
        await render('banned', { ...content(), programs: { banned: [{ buildingId: 1, kind: 'build', mode: 'leave', targetRemaining: 10 }], regular: content().programs.regular } });

        const tags: string[] = Array.from(row(1).querySelectorAll<HTMLElement>('.program-tag')).map((tag: HTMLElement): string => tag.textContent?.trim() ?? '');
        expect(tags.length).toBe(2);
        expect(tags[0].startsWith('B#1')).toBe(true);
        expect(tags[1].startsWith('NB#1')).toBe(true);
    });

    it('le rang rappelé ne compte que les étapes, pas les consignes', async (): Promise<void> => {
        await render('regular', { ...content(), programs: { banned: [], regular: [{ kind: 'instruction', text: 'x' }, { buildingId: 1, kind: 'build', mode: 'finish', targetRemaining: 0 }] } });

        expect(row(1).querySelector('.program-tag')?.textContent?.trim().startsWith('NB#1')).toBe(true);
    });

    it('le coût d\'un chantier non débloqué tient compte de l\'atelier du jour', async (): Promise<void> => {
        await render();
        fake.evaluation.set(fakeEvaluation(content(), { workshopLevel: 5 }));
        fixture.detectChanges();
        click('unlocked-only');

        expect(row(2).querySelectorAll('td')[3].textContent?.trim()).toBe('13');
    });

    it('masque les chantiers construits sur demande', async (): Promise<void> => {
        await render();

        click('hide-built');

        expect(names()).toEqual(['Mur']);
    });

    it('filtre par nom', async (): Promise<void> => {
        await render();
        const search: HTMLInputElement = root().querySelector<HTMLInputElement>('input[data-field="search"]') as HTMLInputElement;
        search.value = 'por';
        search.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(names()).toEqual(['Porte']);
    });

    it('trie par défense par PA, avec le ratio affiché', async (): Promise<void> => {
        await render();
        click('unlocked-only');

        click('sort-ratio');

        expect(names()[0]).toBe('Mur');
        expect(row(1).querySelector('.ratio')?.textContent?.trim()).toBe('0.88');
    });

    it('les ressources que la banque ne couvre pas sont signalées', async (): Promise<void> => {
        await render();

        expect(row(1).querySelector('.resources li.missing')).not.toBeNull();
    });

    it('en Pandémonium, le niveau de plan estimé d\'un chantier non débloqué est enregistré', async (): Promise<void> => {
        setTown(Object.assign(new TownDetails(), { town_id: 42, day: 10, town_type: 'PANDE' }));
        const catalog: Building[] = fakeCatalog();
        Object.assign(catalog[1], { has_hard_mode: true, rarity: 2, tier0_ap: 25, tier1_ap: 20, tier2_ap: 20, tier0_resources: [], tier1_resources: [] });
        await render('regular', content(), catalog);

        row(2).querySelector<HTMLButtonElement>('mho-compact-stepper button[aria-label="+"]')?.click();

        expect(fake.draft()?.planTiers).toEqual({ '2': 1 });
    });

    it('lecture seule : les cases sont désactivées', async (): Promise<void> => {
        await render();
        fake.can_edit.set(false);
        fixture.detectChanges();

        expect(row(1).querySelector<HTMLInputElement>('input[type="checkbox"]')?.disabled).toBe(true);
    });

    it('se ferme', async (): Promise<void> => {
        await render();

        click('close');

        expect(close).toHaveBeenCalled();
    });
});
