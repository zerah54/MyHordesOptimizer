import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, Subject } from 'rxjs';
import type { Mock } from 'vitest';

import { WishlistService } from '../../../../_abstract_model/services/wishlist.service';
import { WishlistInfo } from '../../../../_abstract_model/types/wishlist-info.class';
import { BuildingPlanContentDTO, emptyPlanContent } from '../plan.types';
import { PlanningStore } from '../planning.store';
import { createFakeStore, fakeEvaluation, FakePlanningStore } from '../planning.store.fake';
import { PlanningResourcesComponent } from './planning-resources.component';

function content(): BuildingPlanContentDTO {
    return { ...emptyPlanContent(), programs: { banned: [], regular: [{ buildingId: 1, kind: 'build', targetRemaining: 0 }] } };
}

describe('PlanningResourcesComponent', (): void => {
    const add_missing_items: Mock<(ids: readonly number[]) => Observable<WishlistInfo>> = vi.fn();
    let fake: FakePlanningStore;
    let fixture: ComponentFixture<PlanningResourcesComponent>;

    async function render(plan: BuildingPlanContentDTO = content()): Promise<void> {
        fake = createFakeStore(plan);
        await TestBed.configureTestingModule({
            imports: [PlanningResourcesComponent],
            providers: [
                { provide: PlanningStore, useValue: fake.store },
                { provide: WishlistService, useValue: { addMissingItems: add_missing_items } }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(PlanningResourcesComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function root(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    beforeEach((): void => {
        vi.resetAllMocks();
        add_missing_items.mockReturnValue(of({} as WishlistInfo));
    });

    it('affiche besoin, stock et manque de chaque ressource', async (): Promise<void> => {
        await render();

        const row: HTMLElement = root().querySelector<HTMLElement>('tr.resource[data-item="5"]') as HTMLElement;
        expect(row.querySelector('.need')?.textContent?.trim()).toBe('2');
        expect(row.querySelector('.stock')?.textContent?.trim()).toBe('1');
        expect(row.querySelector('.gap')?.textContent?.trim()).toBe('1');
        expect(row.classList.contains('missing')).toBe(true);
    });

    it('affiche l\'icône de l\'objet devant son nom', async (): Promise<void> => {
        await render();

        const icon: HTMLImageElement | null = root().querySelector<HTMLImageElement>('tr.resource[data-item="5"] img.item-icon');
        expect(icon?.getAttribute('src')).toContain('item/item_wood.gif');
    });

    it('envoie les manques à la liste de courses', async (): Promise<void> => {
        await render();

        root().querySelector<HTMLButtonElement>('button[data-action="send"]')?.click();

        expect(add_missing_items).toHaveBeenCalledWith([5]);
    });

    it('rien ne manque : bouton désactivé et message', async (): Promise<void> => {
        await render();
        fake.bank.set(new Map<number, number>([[5, 9]]));
        fake.evaluation.set(fakeEvaluation(content(), { bank: new Map<number, number>([[5, 9]]) }));
        fixture.detectChanges();

        expect(root().querySelector<HTMLButtonElement>('button[data-action="send"]')?.disabled).toBe(true);
        expect(root().querySelector('.all-covered')).not.toBeNull();
    });

    it('pendant l\'envoi, le spinner remplace le texte du bouton', async (): Promise<void> => {
        const pending: Subject<WishlistInfo> = new Subject<WishlistInfo>();
        await render();
        add_missing_items.mockReturnValue(pending.asObservable());

        root().querySelector<HTMLButtonElement>('button[data-action="send"]')?.click();
        fixture.detectChanges();

        const button: HTMLButtonElement = root().querySelector<HTMLButtonElement>('button[data-action="send"]') as HTMLButtonElement;
        expect(button.querySelector('mat-spinner')).not.toBeNull();
        expect(button.textContent).not.toContain('Envoyer');
        expect(button.disabled).toBe(true);

        pending.next({} as WishlistInfo);
        pending.complete();
        fixture.detectChanges();
        expect(root().querySelector('button[data-action="send"] mat-spinner')).toBeNull();
    });

    it('sans évaluation, affiche un message', async (): Promise<void> => {
        await render();
        fake.evaluation.set(null);
        fixture.detectChanges();

        expect(root().querySelector('tr.resource')).toBeNull();
        expect(root().querySelector('.no-evaluation')).not.toBeNull();
    });

    it('lecture seule : le bouton est désactivé', async (): Promise<void> => {
        await render();
        fake.can_edit.set(false);
        fixture.detectChanges();

        expect(root().querySelector<HTMLButtonElement>('button[data-action="send"]')?.disabled).toBe(true);
        root().querySelector<HTMLButtonElement>('button[data-action="send"]')?.click();
        expect(add_missing_items).not.toHaveBeenCalled();
    });
});
