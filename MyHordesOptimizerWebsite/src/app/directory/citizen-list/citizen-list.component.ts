import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, Signal, signal,ViewChild, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule, SortDirection } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { debounceTime, finalize } from 'rxjs';

import { NoteDTO } from '../../_abstract_model/dto/note.dto';
import { NoteService } from '../../_abstract_model/services/note.service';
import { UserAccountService } from '../../_abstract_model/services/user-account.service';
import { Dictionary, Imports } from '../../_abstract_model/types/_types';
import { CitizenListItem, CitizenListPageResult } from '../../_abstract_model/types/citizen-list-item.model';
import { getUserId } from '../../_core/utilities/localstorage.util';
import { AvatarComponent } from '../../_shared/avatar/avatar.component';
import { NoteDialogComponent, NoteDialogData } from '../../_shared/note-dialog/note-dialog.component';
import { NoteIconComponent } from '../../_shared/note-icon/note-icon.component';

const angular_common: Imports = [CommonModule, ReactiveFormsModule];
const components: Imports = [AvatarComponent, NoteIconComponent, NoteDialogComponent];
const pipes: Imports = [];
const material_modules: Imports = [
    MatTableModule, MatSortModule, MatIconModule, MatProgressSpinnerModule,
    MatTooltipModule, MatCardModule, MatFormFieldModule, MatPaginatorModule, MatInputModule, MatDialogModule
];

@Component({
    selector: 'mho-citizen-list',
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './citizen-list.component.html',
    styleUrl: './citizen-list.component.scss',
})
export class CitizenListComponent implements OnInit, AfterViewInit {
    private readonly userAccountService: UserAccountService = inject(UserAccountService);
    private readonly noteService: NoteService = inject(NoteService);
    private readonly dialog: MatDialog = inject(MatDialog);
    private readonly router: Router = inject(Router);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    /** Note globale non affichée si non connecté (endpoint authentifié, annuaire lisible sans compte). */
    protected readonly myUserId: number | null = getUserId();
    protected readonly displayedColumns: Signal<string[]> = computed(() => {
        const cols: string[] = ['avatar_name', 'nbTownsPlayed', 'bestSurvival', 'lastTown'];
        return this.myUserId !== null ? [...cols, 'note'] : cols;
    });

    @ViewChild(MatSort) private matSort!: MatSort;

    protected readonly citizens: WritableSignal<CitizenListItem[]> = signal<CitizenListItem[]>([]);
    protected readonly userNotes: WritableSignal<Dictionary<NoteDTO>> = signal({});
    protected readonly totalCount: WritableSignal<number> = signal(0);
    protected readonly pageIndex: WritableSignal<number> = signal(0);
    protected readonly pageSize: WritableSignal<number> = signal(50);
    protected readonly pageSizeOptions: number[] = [25, 50, 100, 200];
    protected readonly loading: WritableSignal<boolean> = signal(false);

    // Défaut aligné sur le serveur : les joueurs les plus actifs d'abord
    private readonly sortState: WritableSignal<{ active: string; direction: SortDirection }> =
        signal({ active: 'nbTownsPlayed', direction: 'desc' as SortDirection });

    private readonly nameFilter: WritableSignal<string> = signal('');

    protected readonly filtersForm: FormGroup = new FormGroup({
        name: new FormControl<string>(''),
    });

    public ngOnInit(): void {
        this.filtersForm.controls['name'].valueChanges
            .pipe(debounceTime(300), takeUntilDestroyed(this.destroy_ref))
            .subscribe((value: string | null) => {
                this.nameFilter.set(value ?? '');
                this.resetAndReload();
            });

        this.reload();

        if (this.myUserId !== null) {
            this.noteService.getMyUserNotes()
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe((notes: Dictionary<NoteDTO>) => this.userNotes.set(notes));
        }
    }

    public ngAfterViewInit(): void {
        this.matSort.sortChange
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((change: { active: string; direction: SortDirection }) => {
                this.sortState.set({ active: change.active, direction: change.direction });
                this.resetAndReload();
            });
    }

    protected trackById(_index: number, citizen: CitizenListItem): number {
        return citizen.id;
    }

    /** Ouvre le profil public du joueur. */
    protected onRowClick(citizen: CitizenListItem): void {
        this.router.navigate(['/profile', citizen.id]);
    }

    /** Ouvre l'édition de la note privée globale de l'appelant sur ce joueur, puis la persiste si modifiée. */
    protected openUserNote(userId: number): void {
        const data: NoteDialogData = { initialContent: this.userNotes()[userId]?.note ?? null };
        this.dialog.open(NoteDialogComponent, { data })
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((content: string | undefined) => {
                if (content === undefined) return;
                this.noteService.saveUserNote(userId, content)
                    .pipe(takeUntilDestroyed(this.destroy_ref))
                    .subscribe(() => this.userNotes.update((notes) => ({ ...notes, [userId]: { note: content } })));
            });
    }

    protected onPageChange(event: PageEvent): void {
        this.pageIndex.set(event.pageIndex);
        this.pageSize.set(event.pageSize);
        this.reload();
    }

    /** Un changement de tri ou de filtre invalide la position : la page courante n'a plus de sens. */
    private resetAndReload(): void {
        this.pageIndex.set(0);
        this.reload();
    }

    private reload(): void {
        this.loading.set(true);
        this.userAccountService.getCitizensPaged({
            page: this.pageIndex() + 1,
            pageSize: this.pageSize(),
            sortColumn: this.sortState().active,
            sortDirection: this.sortState().direction,
            name: this.nameFilter() || undefined,
        })
            .pipe(
                finalize(() => this.loading.set(false)),
                takeUntilDestroyed(this.destroy_ref)
            )
            .subscribe((result: CitizenListPageResult) => {
                this.citizens.set(result.items);
                this.totalCount.set(result.totalCount);
            });
    }
}
