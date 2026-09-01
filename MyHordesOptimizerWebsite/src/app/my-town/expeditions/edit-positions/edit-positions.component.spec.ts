import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';

import { Expedition } from '../../../_abstract_model/types/expedition.class';
import { ExpeditionPart } from '../../../_abstract_model/types/expedition-part.class';
import { EditPositionsComponent, EditPositionsData } from './edit-positions.component';

interface TestableComponent {
    expeditions: Expedition[];
}

function expedition(id: number, label: string, parts: ExpeditionPart[] = []): Expedition {
    return new Expedition({
        id,
        state: 'stop',
        label,
        minPdc: 0,
        position: 0,
        parts: parts.map((part: ExpeditionPart): ReturnType<ExpeditionPart['modelToDto']> => part.modelToDto())
    });
}

function part(id: number, path: string): ExpeditionPart {
    return new ExpeditionPart({ id, orders: [], citizens: [], position: id, path });
}

function dragEvent(previousIndex: number, currentIndex: number): CdkDragDrop<string[]> {
    return { previousIndex, currentIndex } as CdkDragDrop<string[]>;
}

function rowTitles(fixture: ComponentFixture<EditPositionsComponent>): string[] {
    return Array.from<Element>(fixture.nativeElement.querySelectorAll('.expedition-row-title'))
        .map((el: Element): string => el.textContent?.trim() ?? '');
}

describe('EditPositionsComponent', (): void => {
    let fixture: ComponentFixture<EditPositionsComponent>;
    let testable: TestableComponent;

    async function setup(data: EditPositionsData | undefined): Promise<void> {
        await TestBed.configureTestingModule({
            imports: [EditPositionsComponent],
            providers: [{ provide: MAT_DIALOG_DATA, useValue: data }]
        }).compileComponents();
        fixture = TestBed.createComponent(EditPositionsComponent);
        testable = fixture.componentInstance as unknown as TestableComponent;
        fixture.detectChanges();
    }

    it('starts with no expeditions when the dialog data is undefined', async (): Promise<void> => {
        await setup(undefined);

        expect(testable.expeditions).toEqual([]);
        expect(fixture.nativeElement.querySelectorAll('.expedition-row').length).toBe(0);
    });

    it('renders one row per expedition provided in the dialog data, in order', async (): Promise<void> => {
        await setup({ expeditions: [expedition(1, 'Nord'), expedition(2, 'Sud')] });

        expect(rowTitles(fixture)).toEqual(['Nord', 'Sud']);
    });

    it('clones the expeditions rather than sharing the dialog data references', async (): Promise<void> => {
        const original: Expedition = expedition(1, 'Nord');
        await setup({ expeditions: [original] });

        expect(testable.expeditions[0]).not.toBe(original);
        expect(testable.expeditions[0].label).toBe('Nord');
    });

    it('does not render part rows when an expedition has one part or fewer', async (): Promise<void> => {
        await setup({ expeditions: [expedition(1, 'Nord', [part(1, 'A')])] });

        expect(fixture.nativeElement.querySelector('.part-rows')).toBeNull();
    });

    it('renders one part row per part when an expedition has more than one part', async (): Promise<void> => {
        await setup({ expeditions: [expedition(1, 'Nord', [part(1, 'A'), part(2, 'B')])] });

        const partRows: Element[] = Array.from<Element>(fixture.nativeElement.querySelectorAll('.part-row-main'));
        expect(partRows.map((el: Element): string => el.textContent?.trim() ?? '')).toEqual(['A', 'B']);
    });

    it('does not render a divider after the last expedition row', async (): Promise<void> => {
        await setup({ expeditions: [expedition(1, 'Nord'), expedition(2, 'Sud')] });

        expect(fixture.nativeElement.querySelectorAll('mat-divider').length).toBe(1);
    });

    it('reorders expeditions on the expedition list cdkDropListDropped event', async (): Promise<void> => {
        await setup({ expeditions: [expedition(1, 'Nord'), expedition(2, 'Sud')] });

        fixture.debugElement.query(By.css('.expedition-rows')).triggerEventHandler('cdkDropListDropped', dragEvent(0, 1));
        fixture.detectChanges();

        expect(rowTitles(fixture)).toEqual(['Sud', 'Nord']);
    });

    it('reorders the parts of one expedition on the part list cdkDropListDropped event, without affecting other expeditions', async (): Promise<void> => {
        const target: Expedition = expedition(1, 'Nord', [part(1, 'A'), part(2, 'B')]);
        await setup({ expeditions: [target] });

        fixture.debugElement.query(By.css('.part-rows')).triggerEventHandler('cdkDropListDropped', dragEvent(0, 1));
        fixture.detectChanges();

        const partRows: Element[] = Array.from<Element>(fixture.nativeElement.querySelectorAll('.part-row-main'));
        expect(partRows.map((el: Element): string => el.textContent?.trim() ?? '')).toEqual(['B', 'A']);
    });
});
