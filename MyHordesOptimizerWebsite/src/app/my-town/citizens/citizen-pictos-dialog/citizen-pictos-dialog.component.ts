import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { switchMap } from 'rxjs';

import { UserPictoDTO, UserPictosDTO } from '../../../_abstract_model/dto/user-picto.dto';
import { UserAccountService } from '../../../_abstract_model/services/user-account.service';
import { Imports } from '../../../_abstract_model/types/_types';
import { UserPicto } from '../../../_abstract_model/types/user-picto.class';
import { getUser } from '../../../_core/utilities/localstorage.util';
import { PictosListComponent } from '../../../miscellaneous/pictos-list/pictos-list.component';

const angular_common: Imports = [CommonModule];
const components: Imports = [PictosListComponent];
const material_modules: Imports = [MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule];

export interface CitizenPictosDialogData {
    userId: number;
    citizenName: string;
    /** mapId de la ville, comme attendu par l'API. */
    townId: number;
}

@Component({
    selector: 'mho-citizen-pictos-dialog',
    imports: [...angular_common, ...components, ...material_modules],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './citizen-pictos-dialog.component.html',
    styleUrl: './citizen-pictos-dialog.component.scss'
})
export class CitizenPictosDialogComponent implements OnInit {
    protected readonly data: CitizenPictosDialogData = inject<CitizenPictosDialogData>(MAT_DIALOG_DATA);

    private readonly service: UserAccountService = inject(UserAccountService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    protected pictos: WritableSignal<UserPicto[]> = signal<UserPicto[]>([]);
    protected loading: WritableSignal<boolean> = signal<boolean>(true);
    protected error: WritableSignal<boolean> = signal<boolean>(false);
    protected importedAt: WritableSignal<string | null> = signal<string | null>(null);
    protected importing: WritableSignal<boolean> = signal<boolean>(false);
    /** L'import nécessite une session MHO (clé MyHordes de l'appelant) : masqué pour un visiteur anonyme, sinon un clic échouerait en 401 sans rien expliquer. */
    protected readonly is_logged_in: boolean = !!getUser();

    public ngOnInit(): void {
        this.service.getPictos(this.data.userId, this.data.townId)
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (dto: UserPictosDTO) => {
                    this.applyPictos(dto);
                    this.loading.set(false);
                },
                error: () => {
                    this.error.set(true);
                    this.loading.set(false);
                }
            });
    }

    /**
     * Relance l'import MyHordes (pictos + villes) de ce joueur, puis recharge la vue de la ville en
     * cours : la réponse de l'import elle-même ne porte que le total, jamais restreint à une ville.
     * Appel lourd côté MyHordes : le serveur le refuse s'il est déjà récent, l'interceptor d'erreurs
     * affiche alors le message.
     */
    protected triggerImport(): void {
        if (this.importing()) return;
        this.importing.set(true);
        this.service.importUserData(this.data.userId)
            .pipe(
                switchMap(() => this.service.getPictos(this.data.userId, this.data.townId)),
                takeUntilDestroyed(this.destroy_ref)
            )
            .subscribe({
                next: (dto: UserPictosDTO) => {
                    this.applyPictos(dto);
                    this.importing.set(false);
                },
                error: () => {
                    this.importing.set(false);
                }
            });
    }

    private applyPictos(dto: UserPictosDTO): void {
        this.pictos.set((dto.pictos ?? []).map((picto: UserPictoDTO) => new UserPicto(picto)));
        this.importedAt.set(dto.historyImportedAt ?? null);
    }
}
