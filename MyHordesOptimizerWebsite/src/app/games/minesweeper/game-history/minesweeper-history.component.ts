import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';

import { MinesweeperGameHistoryEntry, MinesweeperGameHistoryPage, MinesweeperService } from '../../../_abstract_model/services/minesweeper.service';
import { Imports } from '../../../_abstract_model/types/_types';
import { ElapsedSecondsPipe } from '../../../_core/utilities/date.util';
import { createDelayedLoadingController, DelayedLoadingController } from '../../../_core/utilities/delayed-loading.util';

const angular_common: Imports = [CommonModule];
const pipes: Imports = [ElapsedSecondsPipe];
const material_modules: Imports = [MatPaginatorModule, MatProgressSpinnerModule];

@Component({
    selector: 'mho-minesweeper-history',
    templateUrl: 'minesweeper-history.component.html',
    styleUrls: ['minesweeper-history.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...pipes, ...material_modules]
})
export class MinesweeperHistoryComponent implements OnInit {
    private readonly minesweeperService: MinesweeperService = inject(MinesweeperService);

    protected readonly items: WritableSignal<MinesweeperGameHistoryEntry[]> = signal([]);
    protected readonly totalCount: WritableSignal<number> = signal(0);
    protected readonly pageIndex: WritableSignal<number> = signal(0);
    protected readonly pageSize: number = 20;
    protected readonly loading: WritableSignal<boolean> = signal(false);
    private readonly loadingController: DelayedLoadingController = createDelayedLoadingController((loading: boolean) => this.loading.set(loading));

    public ngOnInit(): void {
        this.reload();
    }

    protected onPageChange(event: PageEvent): void {
        this.pageIndex.set(event.pageIndex);
        this.reload();
    }

    private reload(): void {
        this.loadingController.start();
        this.minesweeperService.getMyHistory(this.pageIndex() + 1, this.pageSize)
            .pipe(finalize(() => this.loadingController.stop()))
            .subscribe((page: MinesweeperGameHistoryPage) => {
                this.items.set(page.items);
                this.totalCount.set(page.totalCount);
            });
    }
}
