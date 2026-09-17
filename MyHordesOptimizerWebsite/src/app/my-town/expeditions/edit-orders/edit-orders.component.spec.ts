import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { ExpeditionOrder } from '../../../_abstract_model/types/expedition-order.class';
import { EditOrdersComponent, EditOrdersData } from './edit-orders.component';

describe('EditOrdersComponent', (): void => {
    let fixture: ComponentFixture<EditOrdersComponent>;

    function configure(data: EditOrdersData): void {
        TestBed.configureTestingModule({
            imports: [EditOrdersComponent],
            providers: [
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                provideHttpClient(withXhr()),
                provideHttpClientTesting(),
                { provide: MAT_DIALOG_DATA, useValue: data }
            ]
        });

        fixture = TestBed.createComponent(EditOrdersComponent);
        fixture.detectChanges();
    }

    afterEach((): void => {
        vi.useRealTimers();
    });

    it('renders a tiptap editor bound to the order text instead of angular-editor', async (): Promise<void> => {
        vi.useFakeTimers();
        const order: ExpeditionOrder = new ExpeditionOrder();
        order.type = 'text';
        order.text = '<p>hello</p>';
        configure({ orders: [order] });
        await vi.advanceTimersByTimeAsync(0);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('angular-editor')).toBeNull();
        const editable: HTMLElement | null = fixture.nativeElement.querySelector('.ProseMirror');
        expect(editable?.textContent).toBe('hello');
    });

    describe('addOrder / deleteOrder / drop (mutation manuelle de orders)', (): void => {
        function rowCount(): number {
            return fixture.nativeElement.querySelectorAll('.row').length;
        }

        it('addOrder appends a new checkbox order and renders an extra row', (): void => {
            configure({ orders: [] });
            expect(rowCount()).toBe(0);

            fixture.nativeElement.querySelector('button[mat-button]').click();
            fixture.detectChanges();

            expect(rowCount()).toBe(1);
        });

        it('deleteOrder removes the row at the given index', (): void => {
            const first: ExpeditionOrder = new ExpeditionOrder();
            first.type = 'text';
            const second: ExpeditionOrder = new ExpeditionOrder();
            second.type = 'checkbox';
            configure({ orders: [first, second] });
            expect(rowCount()).toBe(2);

            fixture.nativeElement.querySelector('button[mat-icon-button]').click();
            fixture.detectChanges();

            expect(rowCount()).toBe(1);
        });

        it('drop reorders orders without losing any (moveItemInArray on a fresh array)', (): void => {
            const first: ExpeditionOrder = new ExpeditionOrder();
            first.type = 'text';
            first.text = 'first';
            const second: ExpeditionOrder = new ExpeditionOrder();
            second.type = 'text';
            second.text = 'second';
            configure({ orders: [first, second] });

            (fixture.componentInstance as unknown as {
                drop(event: unknown): void;
            }).drop({ previousIndex: 0, currentIndex: 1 });
            fixture.detectChanges();

            const orders: ExpeditionOrder[] = (fixture.componentInstance as unknown as {
                orders: ExpeditionOrder[];
            }).orders;
            expect(orders.map((o: ExpeditionOrder) => o.text)).toEqual(['second', 'first']);
            expect(orders.length).toBe(2);
        });
    });
});
