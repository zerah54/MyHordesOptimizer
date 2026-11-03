import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuHarness, MatMenuItemHarness } from '@angular/material/menu/testing';
import type { Mock } from 'vitest';

import { ClipboardService } from '../../../../_core/services/clipboard.service';
import { BuildingPlanContentDTO, emptyPlanContent } from '../plan.types';
import { PlanningStore } from '../planning.store';
import { createFakeStore, FakePlanningStore } from '../planning.store.fake';
import { PlanningShareComponent } from './planning-share.component';

describe('PlanningShareComponent', (): void => {
    const copy: Mock<(text: string, success: string) => void> = vi.fn();
    let fake: FakePlanningStore;
    let fixture: ComponentFixture<PlanningShareComponent>;

    async function render(plan: BuildingPlanContentDTO = emptyPlanContent()): Promise<MatMenuHarness> {
        fake = createFakeStore(plan);
        await TestBed.configureTestingModule({
            imports: [PlanningShareComponent],
            providers: [
                { provide: PlanningStore, useValue: fake.store },
                { provide: ClipboardService, useValue: { copy } }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(PlanningShareComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        return TestbedHarnessEnvironment.loader(fixture).getHarness(MatMenuHarness);
    }

    beforeEach((): void => {
        vi.resetAllMocks();
    });

    it('le bouton est désactivé sans évaluation (jour passé)', async (): Promise<void> => {
        const menu: MatMenuHarness = await render();
        fake.evaluation.set(null);
        fixture.detectChanges();

        expect(await menu.isDisabled()).toBe(true);
    });

    it('propose le post budget et le post programme', async (): Promise<void> => {
        const menu: MatMenuHarness = await render();

        await menu.open();
        const labels: string[] = await Promise.all((await menu.getItems()).map((item: MatMenuItemHarness): Promise<string> => item.getText()));

        expect(labels).toEqual(['Post budget', 'Post programme', 'Post programme sans ping (relecture)']);
    });

    it('chaque pseudo est précédé de l\'emote de son métier', async (): Promise<void> => {
        const plan: BuildingPlanContentDTO = { ...emptyPlanContent(), citizens: [{ userId: 1, tasks: [{ id: 't1', kind: 'free', label: 'Puits', pa: 1 }] }] };
        const menu: MatMenuHarness = await render(plan);

        await menu.clickItem({ text: 'Post programme' });

        expect(copy.mock.calls[0][0]).toContain(':scav: @Alice:1');
    });

    it('chaque ressource est précédée de l\'emote de son objet', async (): Promise<void> => {
        const plan: BuildingPlanContentDTO = { ...emptyPlanContent(), programs: { banned: [], regular: [{ buildingId: 1, kind: 'build', mode: 'finish', targetRemaining: 0 }] } };
        const menu: MatMenuHarness = await render(plan);
        fake.item_emotes.set({ wood: ':item_wood:' });
        fixture.detectChanges();

        await menu.clickItem({ text: 'Post budget' });

        expect(copy.mock.calls[0][0]).toMatch(/:middot: :item_wood: .+ × \d+/);
    });

    it('un clic copie le post choisi', async (): Promise<void> => {
        const menu: MatMenuHarness = await render();

        await menu.clickItem({ text: 'Post programme' });

        expect(copy).toHaveBeenCalledTimes(1);
        expect(copy.mock.calls[0][0]).toContain('Programme chantiers');
        expect(copy.mock.calls[0][1].length).toBeGreaterThan(0);
    });

    it('un post trop long est proposé en plusieurs messages numérotés', async (): Promise<void> => {
        const long_lines: BuildingPlanContentDTO['townLines'] = Array.from({ length: 400 }, (_: unknown, index: number): BuildingPlanContentDTO['townLines'][number] => ({
            label: `Ligne ${index} ${'x'.repeat(50)}`, pool: 'regular', pa: 1
        }));
        const menu: MatMenuHarness = await render({ ...emptyPlanContent(), townLines: long_lines });

        await menu.open();
        const labels: string[] = await Promise.all((await menu.getItems()).map((item: MatMenuItemHarness): Promise<string> => item.getText()));

        const parts: string[] = labels.filter((label: string): boolean => /^Post budget — message \d+\/\d+$/.test(label));
        expect(parts.length).toBeGreaterThan(1);
        const total: number = parts.length;
        expect(parts[0]).toBe(`Post budget — message 1/${total}`);
        await menu.clickItem({ text: parts[total - 1] });
        expect(copy.mock.calls[0][0].startsWith(`(${total}/${total})`)).toBe(true);
    });
});
