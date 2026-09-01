import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DataView } from 'vis-data/peer';

import { SelectComponent } from '../../_shared/select/select.component';
import { IrlComponent } from './irl.component';
import { IrlPeople, people } from './irl-people.const';
import { IrlTowns, towns } from './irl-towns.const';

interface IrlNodeForTest {
    id: string;
    towns: string[];
}

describe('IrlComponent', (): void => {
    let fixture: ComponentFixture<IrlComponent>;
    let component: IrlComponent;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [IrlComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(IrlComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        // Le `[(ngModel)]` de mho-select écrit sa valeur initiale de façon différée (microtâche) :
        // on la laisse se résoudre ici (fixture encore vivante) pour ne pas la voir émettre après coup.
        // `fixture.whenStable()` n'est pas utilisable ici : le graphe vis-network programme sa propre
        // boucle de stabilisation physique (RAF/ResizeObserver), que la zone ne considère jamais stable.
        await Promise.resolve();
        await Promise.resolve();
    });

    afterEach((): void => {
        fixture.destroy();
    });

    function nodesView(): DataView<IrlNodeForTest> {
        return (component as unknown as { nodes_view: DataView<IrlNodeForTest> }).nodes_view;
    }

    function setSelectedTowns(selected: IrlTowns[]): void {
        (component as unknown as { selected_towns: IrlTowns[] }).selected_towns = selected;
    }

    function getSelectedTowns(): IrlTowns[] {
        return (component as unknown as { selected_towns: IrlTowns[] }).selected_towns;
    }

    it('initializes without throwing and renders the graph canvas inside #hordiens', (): void => {
        const container: HTMLElement = fixture.debugElement.query(By.css('#hordiens')).nativeElement;
        expect(container.querySelector('canvas')).toBeTruthy();
    });

    it('exposes the fixed towns list as select options', (): void => {
        expect((component as unknown as { towns: IrlTowns[] }).towns).toEqual(towns);
    });

    it('selects all towns by default (a copy, not the const array itself)', (): void => {
        const selected: IrlTowns[] = getSelectedTowns();
        expect(selected).toEqual(towns);
        expect(selected).not.toBe(towns);
    });

    it('wires the town filter select with the right options, label binding and multi/search mode', (): void => {
        const select: SelectComponent<IrlTowns> = fixture.debugElement.query(By.directive(SelectComponent)).componentInstance;
        expect(select.options()).toBe(towns);
        expect(select.bindLabel()).toBe('label');
        expect(select.multiple()).toBeTrue();
        expect(select.searchable()).toBeTrue();
    });

    it('includes every person as a node when all towns are selected', (): void => {
        expect(nodesView().length).toBe(people.length);
    });

    it('filters nodes down to people belonging to the selected towns after refresh()', (): void => {
        setSelectedTowns([towns.find((town: IrlTowns) => town.id === 'BB')!]);
        nodesView().refresh();

        const expectedIds: string[] = people
            .filter((person: IrlPeople) => person.towns.includes('BB'))
            .map((person: IrlPeople) => person.id)
            .sort();
        const actualIds: string[] = nodesView().get().map((node: IrlNodeForTest) => node.id).sort();
        expect(actualIds).toEqual(expectedIds);
    });

    it('does not reflect a narrowed selection until refresh() is called (DataView caches its filtered result)', (): void => {
        const before: number = nodesView().length;
        setSelectedTowns([towns.find((town: IrlTowns) => town.id === 'BB')!]);

        expect(nodesView().length).toBe(before);
    });

    it('re-applies the filter when the town select emits filterChange, per the template wiring', (): void => {
        const select: SelectComponent<IrlTowns> = fixture.debugElement.query(By.directive(SelectComponent)).componentInstance;
        setSelectedTowns([towns.find((town: IrlTowns) => town.id === 'BB')!]);

        select.filterChange.emit(undefined);

        const expectedCount: number = people.filter((person: IrlPeople) => person.towns.includes('BB')).length;
        expect(nodesView().length).toBe(expectedCount);
    });
});
