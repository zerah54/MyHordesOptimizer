import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTooltip } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { Observable, of, Subject, throwError } from 'rxjs';
import type { Mock } from 'vitest';

import { TownService } from '../../../../_abstract_model/services/town.service';
import { WishlistService } from '../../../../_abstract_model/services/wishlist.service';
import { Bag } from '../../../../_abstract_model/types/bag.class';
import { Cell } from '../../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { Item } from '../../../../_abstract_model/types/item.class';
import { ItemCountShort } from '../../../../_abstract_model/types/item-count-short.class';
import { Town } from '../../../../_abstract_model/types/town.class';
import { WishlistInfo } from '../../../../_abstract_model/types/wishlist-info.class';
import { BuildingPlanContentDTO, emptyPlanContent } from '../plan.types';
import { PlanningStore } from '../planning.store';
import { createFakeStore, fakeEvaluation, FakePlanningStore } from '../planning.store.fake';
import { PlanningResourcesComponent } from './planning-resources.component';

function content(): BuildingPlanContentDTO {
    return { ...emptyPlanContent(), programs: { banned: [], regular: [{ buildingId: 1, kind: 'build', targetRemaining: 0 }] } };
}

function storage(count: number, broken: number = 0): Bag {
    const wood: (is_broken: boolean) => Item = (is_broken: boolean): Item => Object.assign(new Item(), { id: 5, is_broken });
    return Object.assign(new Bag(), { items: [...new Array<boolean>(count).fill(false), ...new Array<boolean>(broken).fill(true)].map(wood) });
}

function holder(name: string, in_bag: Bag, in_chest: Bag): Citizen {
    return Object.assign(new Citizen(), { id: name.length, name, is_dead: false, bag: in_bag, chest: in_chest });
}

function cell(x: number, y: number, count: number, broken: number = 0, is_town: boolean = false): Cell {
    const items: ItemCountShort[] = [
        Object.assign(new ItemCountShort(), { item_id: 5, count, is_broken: false }),
        Object.assign(new ItemCountShort(), { item_id: 5, count: broken, is_broken: true })
    ];
    return Object.assign(new Cell(), { x, y, is_town, items: items.filter((item: ItemCountShort): boolean => item.count > 0) });
}

/** Carte 5 × 4, ville en (2, 2), bois au sol sur deux cases, dont un exemplaire cassé. */
function town(): Town {
    return Object.assign(new Town(), { map_width: 5, map_height: 4, town_x: 2, town_y: 2, cells: [cell(2, 2, 0, 0, true), cell(0, 0, 2, 1), cell(4, 3, 1), cell(1, 1, 0)] });
}

describe('PlanningResourcesComponent', (): void => {
    const add_missing_items: Mock<(ids: readonly number[]) => Observable<WishlistInfo>> = vi.fn();
    const get_map: Mock<() => Observable<Town>> = vi.fn();
    let fake: FakePlanningStore;
    let fixture: ComponentFixture<PlanningResourcesComponent>;

    async function render(plan: BuildingPlanContentDTO = content()): Promise<void> {
        fake = createFakeStore(plan);
        await TestBed.configureTestingModule({
            imports: [PlanningResourcesComponent],
            providers: [
                { provide: PlanningStore, useValue: fake.store },
                { provide: WishlistService, useValue: { addMissingItems: add_missing_items } },
                { provide: TownService, useValue: { getMap: get_map } }
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
        get_map.mockReturnValue(of(town()));
    });

    function woodCell(column: string): HTMLElement {
        return root().querySelector<HTMLElement>(`tr.resource[data-item="5"] .${column}`) as HTMLElement;
    }

    function tooltipOf(column: string): string {
        const cell_element: DebugElement = fixture.debugElement.query(By.css(`tr.resource[data-item="5"] .${column}`));
        return cell_element.injector.get(MatTooltip).message;
    }

    function showHolders(): void {
        fake.citizens_full.set([holder('Zoé', storage(2), storage(0)), holder('Abel', storage(1, 1), storage(2))]);
        fixture.detectChanges();
    }

    it('affiche les quantités en sacs, en coffres et au sol sur la carte, cassés compris', async (): Promise<void> => {
        await render();
        showHolders();

        expect(woodCell('bags').textContent?.trim()).toBe('4');
        expect(woodCell('chests').textContent?.trim()).toBe('2');
        expect(woodCell('ground').textContent?.trim()).toBe('4');
    });

    it('le manque reste calculé sur la banque seule', async (): Promise<void> => {
        await render();
        showHolders();

        expect(woodCell('gap').textContent?.trim()).toBe('1');
    });

    it('sans objet en sac, en coffre ni au sol, les cellules restent vides', async (): Promise<void> => {
        get_map.mockReturnValue(of(Object.assign(new Town(), { map_width: 5, map_height: 4, town_x: 2, town_y: 2, cells: [] })));
        await render();
        fake.citizens_full.set([holder('Zoé', storage(0), storage(0))]);
        fixture.detectChanges();

        expect(woodCell('bags').textContent?.trim()).toBe('');
        expect(woodCell('chests').textContent?.trim()).toBe('');
        expect(woodCell('ground').textContent?.trim()).toBe('');
    });

    it('au survol d\'une cellule Sacs ou Coffres, liste les citoyens concernés, un par ligne, avec leurs exemplaires cassés', async (): Promise<void> => {
        await render();
        showHolders();

        expect(tooltipOf('bags')).toBe('Abel ×2 (1 cassé)\nZoé ×2');
        expect(tooltipOf('chests')).toBe('Abel ×2');
    });

    it('au survol d\'une cellule Carte, affiche la carte entière avec la ville et les cases concernées en évidence', async (): Promise<void> => {
        await render();
        showHolders();

        woodCell('ground').querySelector('.origin')?.dispatchEvent(new MouseEvent('mouseenter'));
        fixture.detectChanges();

        const map: HTMLElement | null = document.querySelector<HTMLElement>('.item-map');
        expect(map?.querySelectorAll('.mini-cell').length).toBe(20);
        const town_cells: HTMLElement[] = Array.from(map?.querySelectorAll<HTMLElement>('.mini-cell.town') ?? []);
        expect(town_cells.map((element: HTMLElement): string | undefined => element.dataset['cell'])).toEqual(['2:2']);
        const spots: HTMLElement[] = Array.from(map?.querySelectorAll<HTMLElement>('.mini-cell.spot') ?? []);
        expect(spots.map((element: HTMLElement): string | undefined => element.dataset['cell'])).toEqual(['0:0', '4:3']);

        woodCell('ground').querySelector('.origin')?.dispatchEvent(new MouseEvent('mouseleave'));
        fixture.detectChanges();
        expect(document.querySelector('.item-map')).toBeNull();
    });

    it('carte indisponible : la colonne Carte reste vide, le reste du tableau s\'affiche', async (): Promise<void> => {
        get_map.mockReturnValue(throwError((): Error => new Error('boom')));
        await render();
        showHolders();

        expect(woodCell('ground').textContent?.trim()).toBe('');
        expect(woodCell('bags').textContent?.trim()).toBe('4');
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
