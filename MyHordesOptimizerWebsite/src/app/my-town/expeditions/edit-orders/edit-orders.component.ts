import { NgForOf } from '@angular/common';
import { Component, HostBinding, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { ExpeditionOrder } from '../../../_abstract_model/types/expedition-order.class';
import { EditorComponent } from '../../../shared/elements/editor/editor.component';

@Component({
    selector: 'mho-expeditions-edit-orders',
    templateUrl: './edit-orders.component.html',
    styleUrls: ['./edit-orders.component.scss'],
    standalone: true,
    imports: [
        NgForOf,
        MatDialogModule,
        EditorComponent,
        MatButtonModule,
        MatCheckboxModule,
        MatIconModule
    ]
})
export class EditOrdersComponent {
    @HostBinding('style.display') display: string = 'contents';

    public orders!: ExpeditionOrder[];

    public constructor(@Inject(MAT_DIALOG_DATA) public data: EditOrdersData) {
        this.orders = this.data?.orders ? [...this.data.orders] : [];
    }

    public addTextOrder(): void {
        const order: ExpeditionOrder = new ExpeditionOrder();
        order.type = 'text';
        this.orders.push(order);
    }

    public addCheckableOrder(): void {
        const order: ExpeditionOrder = new ExpeditionOrder();
        order.type = 'checkbox';
        this.orders.push(order);
    }
}

export interface EditOrdersData {
    orders: ExpeditionOrder[];
    citizen?: Citizen;
}
