import { CdkConnectedOverlay, ConnectedPosition } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { Cell } from '../../_abstract_model/types/cell.class';
import { ItemCountShort } from '../../_abstract_model/types/item-count-short.class';
import { Town } from '../../_abstract_model/types/town.class';
import { ItemMapComponent } from './item-map.component';

function cell(x: number, y: number, items: { id: number; count: number; broken?: boolean }[], is_town: boolean = false): Cell {
    return Object.assign(new Cell(), {
        x, y, is_town,
        items: items.map((item: { id: number; count: number; broken?: boolean }): ItemCountShort =>
            Object.assign(new ItemCountShort(), { item_id: item.id, count: item.count, is_broken: item.broken === true }))
    });
}

/** Carte 5 × 4, ville en (2, 2), bois au sol sur deux cases dont une avec un exemplaire cassé. */
function town(): Town {
    return Object.assign(new Town(), {
        map_width: 5, map_height: 4, town_x: 2, town_y: 2,
        cells: [cell(2, 2, [], true), cell(0, 0, [{ id: 5, count: 2 }, { id: 5, count: 1, broken: true }]), cell(4, 3, [{ id: 5, count: 1 }, { id: 7, count: 9 }])]
    });
}

@Component({
    template: '<mho-item-map [map]="map()" [itemId]="5">4</mho-item-map>',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ItemMapComponent]
})
class HostComponent {
    public readonly map: WritableSignal<Town | null> = signal<Town | null>(town());
}

describe('ItemMapComponent', (): void => {
    let fixture: ComponentFixture<HostComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
        fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
    });

    function origin(): HTMLElement {
        return (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('mho-item-map .origin') as HTMLElement;
    }

    function hover(): void {
        origin().dispatchEvent(new MouseEvent('mouseenter'));
        fixture.detectChanges();
    }

    function shown(selector: string): string[] {
        return Array.from(document.querySelectorAll<HTMLElement>(`.item-map ${selector}`)).map((element: HTMLElement): string => element.dataset['cell'] ?? '');
    }

    it('affiche le contenu fourni, sans carte tant qu\'il n\'est pas survolé', (): void => {
        expect(origin().textContent?.trim()).toBe('4');
        expect(document.querySelector('.item-map')).toBeNull();
    });

    it('au survol, affiche la carte entière avec la ville', (): void => {
        hover();

        expect(document.querySelectorAll('.item-map .mini-cell').length).toBe(20);
        expect(shown('.mini-cell.town')).toEqual(['2:2']);
    });

    it('met en évidence les cases de l\'objet avec leur nombre, cassés compris', (): void => {
        hover();

        expect(shown('.mini-cell.spot')).toEqual(['0:0', '4:3']);
        expect(document.querySelector('.item-map .mini-cell[data-cell="0:0"] .count')?.textContent?.trim()).toBe('3');
        expect(document.querySelector('.item-map .mini-cell[data-cell="4:3"] .count')?.textContent?.trim()).toBe('1');
    });

    it('signale les cases où un exemplaire est cassé, avec une légende', (): void => {
        hover();

        expect(shown('.mini-cell.broken')).toEqual(['0:0']);
        expect(document.querySelector('.item-map .legend')?.textContent).toContain('cassé');
    });

    it('sans exemplaire cassé, pas de légende', (): void => {
        fixture.componentInstance.map.set(Object.assign(new Town(), { map_width: 2, map_height: 1, town_x: 0, town_y: 0, cells: [cell(1, 0, [{ id: 5, count: 1 }])] }));
        fixture.detectChanges();
        hover();

        expect(shown('.mini-cell.spot')).toEqual(['1:0']);
        expect(document.querySelector('.item-map .legend')).toBeNull();
    });

    it('se referme quand le survol s\'arrête', (): void => {
        hover();
        origin().dispatchEvent(new MouseEvent('mouseleave'));
        fixture.detectChanges();

        expect(document.querySelector('.item-map')).toBeNull();
    });

    it('reste dans la page : se décale si besoin et peut s\'ouvrir sur les côtés', (): void => {
        const overlay: CdkConnectedOverlay = fixture.debugElement.queryAllNodes(By.directive(CdkConnectedOverlay))[0].injector.get(CdkConnectedOverlay);

        expect(overlay.push).toBe(true);
        expect(overlay.positions.map((position: ConnectedPosition): string => `${position.originX}/${position.overlayX}`)).toEqual(
            expect.arrayContaining(['start/end', 'end/start']));
    });

    it('réduit les cases à la taille de la fenêtre : la grille connaît ses colonnes et ses lignes', (): void => {
        hover();

        const grid: HTMLElement | null = document.querySelector<HTMLElement>('.item-map .grid');
        expect(grid?.style.getPropertyValue('--mho-map-columns')).toBe('5');
        expect(grid?.style.getPropertyValue('--mho-map-rows')).toBe('4');
    });

    it('sans carte chargée, rien ne s\'ouvre', (): void => {
        fixture.componentInstance.map.set(null);
        fixture.detectChanges();
        hover();

        expect(document.querySelector('.item-map')).toBeNull();
    });
});
