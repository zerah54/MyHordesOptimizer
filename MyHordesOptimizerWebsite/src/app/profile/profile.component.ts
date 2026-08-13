import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { environment } from '../../environments/environment';
import { NoteDTO } from '../_abstract_model/dto/note.dto';
import { UserAccountPublicDTO } from '../_abstract_model/dto/user-account.dto';
import { UserPictosDTO } from '../_abstract_model/dto/user-picto.dto';
import { NoteService } from '../_abstract_model/services/note.service';
import { UserAccountService } from '../_abstract_model/services/user-account.service';
import { Imports } from '../_abstract_model/types/_types';
import { getUserId } from '../_core/utilities/localstorage.util';
import { NoteDialogComponent, NoteDialogData } from '../_shared/note-dialog/note-dialog.component';
import { NoteIconComponent } from '../_shared/note-icon/note-icon.component';

const angular_common: Imports = [CommonModule, RouterLink, RouterLinkActive, RouterOutlet];
const components: Imports = [NoteIconComponent];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatCardModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule, MatTabsModule, MatTooltipModule];

@Component({
    selector: 'mho-profile',
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
    /**
     * Compteur incrémenté à chaque import réussi. Les onglets (villes, pictos) l'observent pour se
     * recharger : l'import alimente tout le joueur, mais le bouton qui le déclenche vit dans l'en-tête
     * du profil, au-dessus des onglets.
     */
    public readonly reloadToken: WritableSignal<number> = signal<number>(0);
    protected readonly profile: WritableSignal<UserAccountPublicDTO | null> = signal<UserAccountPublicDTO | null>(null);
    protected readonly note: WritableSignal<string | null> = signal<string | null>(null);
    protected readonly loading: WritableSignal<boolean> = signal<boolean>(true);
    protected readonly error: WritableSignal<boolean> = signal<boolean>(false);
    /** Date du dernier import MyHordes (pictos + villes), affichée par le bouton de l'en-tête. */
    protected readonly importedAt: WritableSignal<string | null> = signal<string | null>(null);
    protected readonly importing: WritableSignal<boolean> = signal<boolean>(false);
    protected readonly links: Link[] = [
        {
            label: $localize`Villes`,
            link: 'towns'
        },
        {
            label: $localize`Pictos`,
            link: 'pictos'
        }
    ];
    private readonly route: ActivatedRoute = inject(ActivatedRoute);
    private readonly service: UserAccountService = inject(UserAccountService);
    private readonly noteService: NoteService = inject(NoteService);
    private readonly dialog: MatDialog = inject(MatDialog);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);
    private readonly myhordes_url: string = environment.myhordes_url;

    public ngOnInit(): void {
        const user_id: number = Number(this.route.snapshot.paramMap.get('userId'));
        this.service.getPublicProfile(user_id)
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (dto: UserAccountPublicDTO) => {
                    this.profile.set(dto);
                    this.importedAt.set(dto.importedAt);
                    this.loading.set(false);

                    this.noteService.getUserNote(user_id)
                        .pipe(takeUntilDestroyed(this.destroy_ref))
                        .subscribe((noteDto: NoteDTO) => this.note.set(noteDto.note));
                },
                error: () => {
                    this.error.set(true);
                    this.loading.set(false);
                }
            });
    }

    /**
     * Rafraîchit le joueur depuis MyHordes (pictos + villes). L'appel est lourd de leur côté : le
     * serveur le refuse s'il est déjà récent, et l'interceptor d'erreurs affiche alors le message.
     * En cas de succès, on incrémente reloadToken pour que les onglets se rechargent.
     */
    protected triggerImport(): void {
        const p: UserAccountPublicDTO | null = this.profile();
        if (!p || this.importing()) return;
        this.importing.set(true);
        this.service.importUserData(p.id)
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (dto: UserPictosDTO) => {
                    this.importedAt.set(dto.historyImportedAt ?? null);
                    this.reloadToken.update((token: number) => token + 1);
                    this.importing.set(false);
                },
                error: () => {
                    this.importing.set(false);
                }
            });
    }

    /** Ouvre l'édition de la note privée globale de l'appelant sur ce joueur. */
    protected openNote(): void {
        const p: UserAccountPublicDTO | null = this.profile();
        if (!p) return;
        const data: NoteDialogData = { initialContent: this.note() };
        this.dialog.open(NoteDialogComponent, { data })
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((content: string | undefined) => {
                if (content === undefined) return;
                this.noteService.saveUserNote(p.id, content)
                    .pipe(takeUntilDestroyed(this.destroy_ref))
                    .subscribe(() => this.note.set(content));
            });
    }

    /** Une note n'a de sens que sur le profil d'un autre joueur (l'API refuse la note sur soi-même). */
    protected isSelf(): boolean {
        return this.profile()?.id === getUserId();
    }

    protected getAvatarUrl(avatar: string | null): string | null {
        if (!avatar) return null;
        if (avatar.startsWith('http')) return avatar;
        return this.myhordes_url.replace(/\/$/, '') + avatar;
    }
}

interface Link {
    label: string;
    link: string;
}
