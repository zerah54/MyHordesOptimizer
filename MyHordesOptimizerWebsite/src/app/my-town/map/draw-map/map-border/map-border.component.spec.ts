import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cell } from '../../../../_abstract_model/types/cell.class';
import { MapBorderComponent } from './map-border.component';

function cellAt(displayed_x: number, displayed_y: number): Cell {
    const cell: Cell = new Cell();
    cell.displayed_x = displayed_x;
    cell.displayed_y = displayed_y;
    return cell;
}

describe('MapBorderComponent', (): void => {
    let fixture: ComponentFixture<MapBorderComponent>;
    let th: HTMLElement;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [MapBorderComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(MapBorderComponent);
        th = fixture.nativeElement.querySelector('th');
    });

    it('renders with no orientation/state classes and an empty index by default', (): void => {
        fixture.detectChanges();

        expect(th.classList.contains('horizontal')).toBe(false);
        expect(th.classList.contains('vertical')).toBe(false);
        expect(th.classList.contains('me')).toBe(false);
        expect(th.classList.contains('hovered')).toBe(false);
        expect(th.textContent?.trim()).toBe('');
    });

    it('sets the horizontal/vertical classes from the boolean attributes', (): void => {
        fixture.componentRef.setInput('horizontal', true);
        fixture.componentRef.setInput('vertical', true);
        fixture.detectChanges();

        expect(th.classList.contains('horizontal')).toBe(true);
        expect(th.classList.contains('vertical')).toBe(true);
    });

    it('shows the index as text', (): void => {
        fixture.componentRef.setInput('index', 4);
        fixture.detectChanges();

        expect(th.textContent?.trim()).toBe('4');
    });

    it('marks the "me" cell on the vertical axis when myCell.displayed_y matches the index', (): void => {
        fixture.componentRef.setInput('vertical', true);
        fixture.componentRef.setInput('index', 2);
        fixture.componentRef.setInput('myCell', cellAt(0, 2));
        fixture.detectChanges();

        expect(th.classList.contains('me')).toBe(true);
    });

    it('marks the "me" cell on the horizontal axis when myCell.displayed_x matches the index', (): void => {
        fixture.componentRef.setInput('horizontal', true);
        fixture.componentRef.setInput('index', 5);
        fixture.componentRef.setInput('myCell', cellAt(5, 0));
        fixture.detectChanges();

        expect(th.classList.contains('me')).toBe(true);
    });

    it('does not mark "me" when myCell does not match the index', (): void => {
        fixture.componentRef.setInput('vertical', true);
        fixture.componentRef.setInput('index', 2);
        fixture.componentRef.setInput('myCell', cellAt(0, 9));
        fixture.detectChanges();

        expect(th.classList.contains('me')).toBe(false);
    });

    it('marks "hovered" on the vertical axis when hoveredCell.displayed_y matches the index', (): void => {
        fixture.componentRef.setInput('vertical', true);
        fixture.componentRef.setInput('index', 2);
        fixture.componentRef.setInput('hoveredCell', cellAt(0, 2));
        fixture.detectChanges();

        expect(th.classList.contains('hovered')).toBe(true);
    });

    it('marks "hovered" on the horizontal axis when hoveredCell.displayed_x matches the index', (): void => {
        fixture.componentRef.setInput('horizontal', true);
        fixture.componentRef.setInput('index', 5);
        fixture.componentRef.setInput('hoveredCell', cellAt(5, 0));
        fixture.detectChanges();

        expect(th.classList.contains('hovered')).toBe(true);
    });

    it('unmarks "hovered" once a new hoveredCell stops matching the index', (): void => {
        fixture.componentRef.setInput('vertical', true);
        fixture.componentRef.setInput('index', 2);
        fixture.componentRef.setInput('hoveredCell', cellAt(0, 2));
        fixture.detectChanges();
        expect(th.classList.contains('hovered')).toBe(true);

        fixture.componentRef.setInput('hoveredCell', cellAt(0, 9));
        fixture.detectChanges();

        expect(th.classList.contains('hovered')).toBe(false);
    });

    it('characterizes the legacy quirk: once "me" is set it never gets cleared by a later non-matching myCell/index', (): void => {
        fixture.componentRef.setInput('vertical', true);
        fixture.componentRef.setInput('index', 2);
        fixture.componentRef.setInput('myCell', cellAt(0, 2));
        fixture.detectChanges();
        expect(th.classList.contains('me')).toBe(true);

        fixture.componentRef.setInput('index', 9);
        fixture.detectChanges();

        expect(th.classList.contains('me')).toBe(true);
    });

    it('characterizes the legacy quirk: changing the index alone does not re-evaluate "hovered"', (): void => {
        fixture.componentRef.setInput('vertical', true);
        fixture.componentRef.setInput('index', 2);
        fixture.componentRef.setInput('hoveredCell', cellAt(0, 2));
        fixture.detectChanges();
        expect(th.classList.contains('hovered')).toBe(true);

        fixture.componentRef.setInput('index', 9);
        fixture.detectChanges();

        expect(th.classList.contains('hovered')).toBe(true);
        expect(th.textContent?.trim()).toBe('9');
    });
});
