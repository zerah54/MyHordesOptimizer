import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ExpeditionOrder } from '../../../_abstract_model/types/expedition-order.class';
import { EditOrdersComponent, EditOrdersData } from './edit-orders.component';

describe('EditOrdersComponent', (): void => {
    let fixture: ComponentFixture<EditOrdersComponent>;

    function configure(data: EditOrdersData): void {
        TestBed.configureTestingModule({
            imports: [EditOrdersComponent],
            providers: [
                provideNoopAnimations(),
                { provide: MAT_DIALOG_DATA, useValue: data }
            ]
        });

        fixture = TestBed.createComponent(EditOrdersComponent);
        fixture.detectChanges();
    }

    it('renders a tiptap editor bound to the order text instead of angular-editor', (): void => {
        const order: ExpeditionOrder = new ExpeditionOrder();
        order.type = 'text';
        order.text = '<p>hello</p>';
        configure({ orders: [order] });

        expect(fixture.nativeElement.querySelector('angular-editor')).toBeNull();
        const editable: HTMLElement | null = fixture.nativeElement.querySelector('.ProseMirror');
        expect(editable?.textContent).toBe('hello');
    });
});
