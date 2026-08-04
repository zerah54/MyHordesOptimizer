import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, TemplateRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { Imports } from '../../../_abstract_model/types/_types';

const angular_common: Imports = [NgTemplateOutlet];
const material_modules: Imports = [MatButtonModule, MatDialogModule, MatIconModule];

export interface MinesweeperLeaderboardDialogData {
    template: TemplateRef<unknown>;
}

@Component({
    selector: 'mho-minesweeper-leaderboard-dialog',
    templateUrl: './minesweeper-leaderboard-dialog.component.html',
    styleUrl: './minesweeper-leaderboard-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...material_modules]
})
export class MinesweeperLeaderboardDialogComponent {
    protected readonly data: MinesweeperLeaderboardDialogData = inject<MinesweeperLeaderboardDialogData>(MAT_DIALOG_DATA);
}
