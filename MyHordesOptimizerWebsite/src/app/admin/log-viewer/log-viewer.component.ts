import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment, { Moment } from 'moment';
import { debounceTime } from 'rxjs';
import { LogViewerService } from '../../_abstract_model/services/log-viewer.service';
import { Imports, LogLevel } from '../../_abstract_model/types/_types';
import { LogEntry, LogFilters, LogPageResult } from '../../_abstract_model/types/log-viewer.model';

const LOG_LEVELS: LogLevel[] = ['Verbose', 'Debug', 'Information', 'Warning', 'Error', 'Fatal'];

const angular_common: Imports = [CommonModule,
    ReactiveFormsModule,];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatTableModule, MatPaginatorModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule,
    MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatTooltipModule, MatChipsModule];

@Component({
    selector: 'mho-log-viewer',
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './log-viewer.component.html',
    styleUrl: './log-viewer.component.scss',
})
export class LogViewerComponent implements OnInit {
    private readonly service: LogViewerService = inject(LogViewerService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    protected readonly logLevels: LogLevel[] = LOG_LEVELS;
    protected readonly displayedColumns: string[] = ['stacktrace', 'timestamp', 'level', 'correlationId', 'sourceContext', 'message'];

    protected entries: WritableSignal<LogEntry[]> = signal<LogEntry[]>([]);
    protected totalCount: WritableSignal<number> = signal(0);
    protected loading: WritableSignal<boolean> = signal(false);
    protected expandedRow: WritableSignal<LogEntry | null> = signal<LogEntry | null>(null);
    protected availableDates: WritableSignal<Set<string>> = signal<Set<string>>(new Set());

    protected page: number = 1;
    protected pageSize: number = 200;

    protected filtersForm = new FormGroup({
        date: new FormControl<Moment>(moment()),
        level: new FormControl<LogLevel | ''>(''),
        correlationId: new FormControl<string>(''),
        search: new FormControl<string>(''),
    });

    protected readonly levelColorMap: Record<LogLevel, string> = {
        Verbose: '#9e9e9e',
        Debug: '#2196f3',
        Information: '#4caf50',
        Warning: '#ff9800',
        Error: '#f44336',
        Fatal: '#9c27b0',
    };

    protected dateFilter = (date: Moment | null): boolean => {
        if (!date) return false;
        return this.availableDates().has(date.format('YYYY-MM-DD'));
    };

    public ngOnInit(): void {
        this.service.getAvailableDates().pipe(takeUntilDestroyed(this.destroy_ref)).subscribe(dates => {
            this.availableDates.set(new Set(dates));
        });

        this.loadLogs();

        this.filtersForm.controls.date.valueChanges
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe(() => {
                this.page = 1;
                this.loadLogs();
            });

        const {level, correlationId, search} = this.filtersForm.controls;
        [level.valueChanges, correlationId.valueChanges, search.valueChanges].forEach((obs) =>
            obs.pipe(debounceTime(400), takeUntilDestroyed(this.destroy_ref))
                .subscribe(() => {
                    this.page = 1;
                    this.loadLogs();
                })
        );
    }

    protected onPageChange(event: PageEvent): void {
        this.page = event.pageIndex + 1;
        this.pageSize = event.pageSize;
        this.loadLogs();
    }

    protected toggleRow(row: LogEntry): void {
        this.expandedRow.set(this.expandedRow() === row ? null : row);
    }

    protected filterByCorrelationId(correlationId: string): void {
        this.filtersForm.controls.correlationId.setValue(correlationId);
    }

    protected filterByLevel(level: string): void {
        if (this.filtersForm.controls.level.value === level) return;

        this.filtersForm.controls.level.setValue(level as LogLevel);
    }

    protected getLevelBgColor(level: string): string {
        return (this.levelColorMap[level as LogLevel] ?? '#9e9e9e');
    }

    private loadLogs(): void {
        const {date, level, correlationId, search} = this.filtersForm.value;
        if (!date) return;

        this.loading.set(true);

        const filters: LogFilters = {
            level: level || undefined,
            correlationId: correlationId || undefined,
            search: search || undefined,
        };

        this.service.getLogs(date, this.page, this.pageSize, filters)
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (result: LogPageResult | null) => {
                    if (result) {
                        this.entries.set(result.items);
                        this.totalCount.set(result.totalCount);
                        this.loading.set(false);
                    }
                },
                error: () => this.loading.set(false),
            });
    }
}
