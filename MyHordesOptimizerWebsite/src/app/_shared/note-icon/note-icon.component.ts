import { ChangeDetectionStrategy, Component, input, InputSignal, output, OutputEmitterRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'mho-note-icon',
    standalone: true,
    imports: [MatButtonModule, MatIconModule, MatTooltipModule],
    template: `
        <button mat-icon-button type="button" [matTooltip]="note() ?? ''" matTooltipClass="mho-multiline-tooltip"
                (click)="clicked.emit()" [attr.aria-label]="note() ? addedLabel : addLabel">
            <mat-icon>{{ note() ? 'sticky_note_2' : 'note_add' }}</mat-icon>
        </button>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteIconComponent {
    public readonly note: InputSignal<string | null> = input<string | null>(null);
    public readonly clicked: OutputEmitterRef<void> = output<void>();
    protected readonly addedLabel: string = $localize`Voir la note`;
    protected readonly addLabel: string = $localize`Ajouter une note`;
}
