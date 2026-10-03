import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment, { Moment } from 'moment';
import { catchError, debounceTime, EMPTY, Observable, Subject, switchMap } from 'rxjs';

import { LogViewerService } from '../../_abstract_model/services/log-viewer.service';
import { Imports, LogLevel } from '../../_abstract_model/types/_types';
import { LogEntry, LogPageResult } from '../../_abstract_model/types/log-viewer.model';
import { TypedCellDefDirective } from '../../_core/directives/typed-cell-def.directive';
import { HighlightJsonPipe } from '../../_core/pipes/highlight-json.pipe';

/** Pastille d'un niveau : classe de couleur (log-viewer.component.scss) et libellé court. */
export interface LevelDisplay {
    readonly css_class: string;
    readonly label: string;
}

export interface LevelOption {
    readonly level: LogLevel;
    readonly display: LevelDisplay;
}

/** Ligne du tableau : l'entrée et ce que le gabarit en dérive, calculé une fois par chargement. */
export interface LogRow {
    readonly entry: LogEntry;
    readonly level: LevelDisplay;
    /** Warning et au-delà : liseré de la couleur du niveau à gauche de la ligne. */
    readonly alert: boolean;
    /** Nom court de la classe émettrice (sans l'espace de noms). */
    readonly source: string;
    /** Origine et version de l'appelant, réunies ; `null` si aucune n'est connue. */
    readonly origin: string | null;
    /** Au moins une information pour la ligne grise sous le message. */
    readonly has_meta: boolean;
    /** Corps de requête ou pile d'appels à déplier. */
    readonly expandable: boolean;
}

interface LogFiltersForm {
    date: FormControl<Moment | null>;
    level: FormControl<LogLevel | '' | null>;
    correlationId: FormControl<string | null>;
    search: FormControl<string | null>;
}

const LOG_LEVELS: LogLevel[] = ['Verbose', 'Debug', 'Information', 'Warning', 'Error', 'Fatal'];

const LEVEL_DISPLAY: Readonly<Record<LogLevel, LevelDisplay>> = {
    Verbose: { css_class: 'level--verbose', label: 'VERBOSE' },
    Debug: { css_class: 'level--debug', label: 'DEBUG' },
    Information: { css_class: 'level--information', label: 'INFO' },
    Warning: { css_class: 'level--warning', label: 'WARN' },
    Error: { css_class: 'level--error', label: 'ERROR' },
    Fatal: { css_class: 'level--fatal', label: 'FATAL' },
};

const ALERT_LEVELS: ReadonlySet<LogLevel> = new Set<LogLevel>(['Warning', 'Error', 'Fatal']);

function isLogLevel(level: string): level is LogLevel {
    return LOG_LEVELS.some((candidate: LogLevel): boolean => candidate === level);
}

/** Un niveau inattendu (renvoyé tel quel par l'API) s'affiche en gris, sous son propre nom. */
function levelDisplay(level: string): LevelDisplay {
    return isLogLevel(level) ? LEVEL_DISPLAY[level] : { css_class: 'level--verbose', label: level.toUpperCase() };
}

export function toLogRow(entry: LogEntry): LogRow {
    const origin_parts: string[] = [];
    if (entry.mhoOrigin) origin_parts.push(entry.mhoOrigin);
    if (entry.mhoAddonVersion) origin_parts.push(entry.mhoAddonVersion);
    const origin: string | null = origin_parts.length > 0 ? origin_parts.join(' ') : null;
    const source_context: string = entry.sourceContext ?? '';

    return {
        entry,
        level: levelDisplay(entry.level),
        alert: isLogLevel(entry.level) && ALERT_LEVELS.has(entry.level),
        source: source_context.slice(source_context.lastIndexOf('.') + 1),
        origin,
        has_meta: origin !== null || !!entry.requestPath || !!entry.correlationId || !!entry.actionId,
        expandable: !!entry.stackTrace || !!entry.body,
    };
}

const angular_common: Imports = [CommonModule,
                                 ReactiveFormsModule,];
const components: Imports = [];
const directives: Imports = [TypedCellDefDirective];
const pipes: Imports = [HighlightJsonPipe];
const material_modules: Imports = [MatTableModule, MatPaginatorModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule,
                                   MatIconModule, MatButtonModule, MatTooltipModule, MatDividerModule];

@Component({
    selector: 'mho-log-viewer',
    imports: [...angular_common, ...components, ...directives, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './log-viewer.component.html',
    styleUrl: './log-viewer.component.scss',
})
export class LogViewerComponent implements OnInit {
    private readonly service: LogViewerService = inject(LogViewerService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    protected readonly levelOptions: readonly LevelOption[] = LOG_LEVELS.map((level: LogLevel): LevelOption => ({ level, display: LEVEL_DISPLAY[level] }));
    /** Les informations secondaires (origine, requête, corrélation, action) vont sous le message. */
    protected readonly displayedColumns: string[] = ['expand', 'timestamp', 'level', 'source', 'message'];

    protected readonly entries: WritableSignal<LogEntry[]> = signal<LogEntry[]>([]);
    protected readonly rows: Signal<LogRow[]> = computed((): LogRow[] => this.entries().map(toLogRow));
    protected readonly totalCount: WritableSignal<number> = signal(0);
    protected readonly loading: WritableSignal<boolean> = signal(false);
    protected readonly expandedRow: WritableSignal<LogRow | null> = signal<LogRow | null>(null);
    private readonly availableDates: WritableSignal<Set<string>> = signal<Set<string>>(new Set());

    protected page: number = 1;
    protected pageSize: number = 200;

    protected readonly filtersForm: FormGroup<LogFiltersForm> = new FormGroup<LogFiltersForm>({
        date: new FormControl<Moment>(moment()),
        level: new FormControl<LogLevel | ''>(''),
        correlationId: new FormControl<string>(''),
        search: new FormControl<string>(''),
    });

    private readonly loadTrigger$: Subject<void> = new Subject<void>();

    protected readonly dateFilter: (date: Moment | null) => boolean = (date: Moment | null): boolean => {
        if (!date) return false;
        return this.availableDates().has(date.format('YYYY-MM-DD'));
    };

    public ngOnInit(): void {
        this.loadTrigger$.pipe(
            switchMap(() => {
                const filters: FormGroup<LogFiltersForm>['value'] = this.filtersForm.value;
                if (!filters.date) return EMPTY;
                this.loading.set(true);
                return this.service.getLogs(filters.date, this.page, this.pageSize, {
                    level: filters.level || undefined,
                    correlationId: filters.correlationId || undefined,
                    search: filters.search || undefined,
                }).pipe(
                    catchError(() => {
                        this.loading.set(false);
                        return EMPTY;
                    })
                );
            }),
            takeUntilDestroyed(this.destroy_ref)
        ).subscribe((result: LogPageResult | null) => {
            this.entries.set(result?.items ?? []);
            this.totalCount.set(result?.totalCount ?? 0);
            this.expandedRow.set(null);
            this.loading.set(false);
        });

        this.service.getAvailableDates()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((dates: string[]) => this.availableDates.set(new Set(dates)));

        this.loadLogs();

        this.filtersForm.controls.date.valueChanges
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe(() => {
                this.page = 1;
                setTimeout(() => {
                    this.loadLogs();
                });
            });

        const controls: LogFiltersForm = this.filtersForm.controls;
        [controls.level.valueChanges, controls.correlationId.valueChanges, controls.search.valueChanges].forEach((obs: Observable<string | null>) =>
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

    protected toggleRow(row: LogRow): void {
        this.expandedRow.set(this.expandedRow() === row ? null : row);
    }

    protected filterByCorrelationId(correlationId: string): void {
        this.filtersForm.controls.correlationId.setValue(correlationId);
    }

    protected filterByLevel(level: LogLevel): void {
        if (this.filtersForm.controls.level.value === level) return;

        this.filtersForm.controls.level.setValue(level);
    }

    protected levelDisplay(level: LogLevel): LevelDisplay {
        return LEVEL_DISPLAY[level];
    }

    private loadLogs(): void {
        this.loadTrigger$.next();
    }
}
