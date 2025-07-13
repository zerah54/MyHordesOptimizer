import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { Imports } from '../../../_abstract_model/types/_types';
import { Expedition } from '../../../_abstract_model/types/expedition.class';

const angular_common: Imports = [];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [DragDropModule, MatButtonModule, MatButtonToggleModule, MatCheckboxModule, MatDialogModule, MatDividerModule, MatIconModule];

@Component({
    selector: 'mho-expeditions-edit-positions',
    templateUrl: './edit-positions.component.html',
    styleUrls: ['./edit-positions.component.scss'],
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class EditPositionsComponent {

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
