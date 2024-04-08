import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, HostBinding, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { ExpeditionOrder } from '../../../_abstract_model/types/expedition-order.class';
import { EditorComponent } from '../../../shared/elements/editor/editor.component';

@Component({
    selector: 'mho-expeditions-edit-orders',
    templateUrl: './edit-orders.component.html',
    styleUrls: ['./edit-orders.component.scss'],
    standalone: true,
    imports: [
        MatDialogModule,
        EditorComponent,
        MatButtonModule,
        MatCheckboxModule,
        MatIconModule,
        DragDropModule,
        MatButtonToggleModule,
        MatDividerModule
    ]
})
export class EditOrdersComponent {
    @HostBinding('style.display') display: string = 'contents';

    public orders: ExpeditionOrder[] = [];

    public constructor(@Inject(MAT_DIALOG_DATA) public data: EditOrdersData) {
        this.orders = this.data?.orders ? [...this.data.orders.map((order: ExpeditionOrder) => new ExpeditionOrder(order.modelToDto()))] : [];
    }

    public addOrder(): void {
        const order: ExpeditionOrder = new ExpeditionOrder();
        order.type = 'checkbox';
        this.orders.push(order);
    }

    public drop(event: CdkDragDrop<string[]>): void {
        moveItemInArray(this.orders, event.previousIndex, event.currentIndex);
    }

    public toggleMode(order: ExpeditionOrder): void {
        if (order.type === 'text') {
            order.type = 'checkbox';
        } else {
            order.type = 'text';
        }
    }

    public deleteOrder(index: number): void {
        this.orders.splice(index, 1);
    }
}

export interface EditOrdersData {
    orders: ExpeditionOrder[];
    citizen_id?: number;
}
