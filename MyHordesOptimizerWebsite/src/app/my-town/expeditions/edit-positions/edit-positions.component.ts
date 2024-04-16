import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, HostBinding, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { Expedition } from '../../../_abstract_model/types/expedition.class';
import { EditorComponent } from '../../../shared/elements/editor/editor.component';

@Component({
    selector: 'mho-expeditions-edit-positions',
    templateUrl: './edit-positions.component.html',
    styleUrls: ['./edit-positions.component.scss'],
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
export class EditPositionsComponent {
    @HostBinding('style.display') display: string = 'contents';

    public expeditions: Expedition[] = [];

    public constructor(@Inject(MAT_DIALOG_DATA) public data: EditPositionsData) {
        this.expeditions = this.data?.expeditions ? [...this.data.expeditions.map((expedition: Expedition) => new Expedition(expedition.modelToDto()))] : [];
    }

    public drop(event: CdkDragDrop<string[]>): void {
        moveItemInArray(this.expeditions, event.previousIndex, event.currentIndex);
    }

    public dropPart(event: CdkDragDrop<string[]>, expedition: Expedition): void {
        moveItemInArray(expedition.parts, event.previousIndex, event.currentIndex);
    }
}

export interface EditPositionsData {
    expeditions: Expedition[]
}
