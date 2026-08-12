import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface NoteDialogData {
    initialContent: string | null;
}

@Component({
    selector: 'mho-note-dialog',
    standalone: true,
    imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule],
    templateUrl: './note-dialog.component.html',
    styleUrl: './note-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteDialogComponent {
    protected readonly data: NoteDialogData = inject(MAT_DIALOG_DATA);
    protected content: string = this.data.initialContent ?? '';
}
