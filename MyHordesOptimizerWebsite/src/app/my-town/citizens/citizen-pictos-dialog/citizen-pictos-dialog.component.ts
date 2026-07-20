import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserPictoDTO, UserPictosDTO } from '../../../_abstract_model/dto/user-picto.dto';
import { UserAccountService } from '../../../_abstract_model/services/user-account.service';
import { Imports } from '../../../_abstract_model/types/_types';
import { UserPicto } from '../../../_abstract_model/types/user-picto.class';
import { PictosListComponent } from '../../../miscellaneous/pictos-list/pictos-list.component';

const angular_common: Imports = [CommonModule];
const components: Imports = [PictosListComponent];
const material_modules: Imports = [MatButtonModule, MatDialogModule, MatProgressSpinnerModule];

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

    public ngOnInit(): void {
        this.service.getPictos(this.data.userId, this.data.townId)
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (dto: UserPictosDTO) => {
                    this.pictos.set((dto.pictos ?? []).map((picto: UserPictoDTO) => new UserPicto(picto)));
                    this.loading.set(false);
                },
                error: () => {
                    this.error.set(true);
                    this.loading.set(false);
                }
            });
    }
}
