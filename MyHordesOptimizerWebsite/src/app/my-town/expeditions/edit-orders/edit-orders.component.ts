import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

import { Imports } from '../../../_abstract_model/types/_types';
import { ExpeditionOrder } from '../../../_abstract_model/types/expedition-order.class';
import { EditorComponent } from '../../../_shared/editor/editor.component';

const angular_common: Imports = [];
const components: Imports = [EditorComponent];
const pipes: Imports = [];
const material_modules: Imports = [DragDropModule, MatButtonModule, MatButtonToggleModule, MatCheckboxModule, MatDialogModule, MatDividerModule, MatIconModule];

@Component({
    selector: 'mho-expeditions-edit-orders',
    templateUrl: './edit-orders.component.html',
    styleUrls: ['./edit-orders.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class EditOrdersComponent {
    private data: EditOrdersData = inject<EditOrdersData>(MAT_DIALOG_DATA);


    protected orders: ExpeditionOrder[] = [];

    public constructor() {
        this.orders = this.data?.orders ? [...this.data.orders.map((order: ExpeditionOrder) => new ExpeditionOrder(order.modelToDto()))] : [];
    }

    protected addOrder(): void {
        const order: ExpeditionOrder = new ExpeditionOrder();
        order.type = 'checkbox';
        this.orders.push(order);
    }

    protected drop(event: CdkDragDrop<string[]>): void {
        moveItemInArray(this.orders, event.previousIndex, event.currentIndex);
    }

    protected deleteOrder(index: number): void {
        this.orders.splice(index, 1);
    }
}

export interface EditOrdersData {
    orders: ExpeditionOrder[];
    citizen_id?: number;
}
