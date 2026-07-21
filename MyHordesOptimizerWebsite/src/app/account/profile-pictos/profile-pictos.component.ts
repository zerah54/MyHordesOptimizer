import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';

import { UserPictoDTO, UserPictosDTO } from '../../_abstract_model/dto/user-picto.dto';
import { UserAccountService } from '../../_abstract_model/services/user-account.service';
import { Imports } from '../../_abstract_model/types/_types';
import { UserPicto } from '../../_abstract_model/types/user-picto.class';
import { PictosListComponent } from '../../miscellaneous/pictos-list/pictos-list.component';

const angular_common: Imports = [CommonModule];
const components: Imports = [PictosListComponent];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatProgressSpinnerModule];

@Component({
    selector: 'mho-account-pictos',
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './account-pictos.component.html',
    styleUrl: './account-pictos.component.scss',
})
export class AccountPictosComponent implements OnInit {
    protected readonly pictos: WritableSignal<UserPicto[]> = signal<UserPicto[]>([]);
    protected readonly pictos_imported_at: WritableSignal<string | null> = signal<string | null>(null);
    protected readonly pictos_loading: WritableSignal<boolean> = signal<boolean>(true);
    protected readonly pictos_importing: WritableSignal<boolean> = signal<boolean>(false);
    private readonly route: ActivatedRoute = inject(ActivatedRoute);
    private readonly service: UserAccountService = inject(UserAccountService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);
    /** Le joueur est porté par la route parente (/account/:userId), pas par celle de l'onglet. */
    private readonly userId: number | undefined = Number(this.route.parent?.snapshot.paramMap.get('userId')) || undefined;

    public ngOnInit(): void {
        this.loadPictos();
    }

    /**
     * Rafraîchit les pictos du joueur depuis MyHordes. L'appel est lourd de leur côté : le serveur
     * le refuse s'il est déjà récent, et l'interceptor d'erreurs affiche alors le message.
     */
    protected importPictos(): void {
        if (!this.userId || this.pictos_importing()) return;
        this.pictos_importing.set(true);
        this.service.importPictos(this.userId)
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (dto: UserPictosDTO) => {
                    this.setPictos(dto);
                    this.pictos_importing.set(false);
                },
                error: () => {
                    this.pictos_importing.set(false);
                }
            });
    }

    private loadPictos(): void {
        if (!this.userId) {
            this.pictos_loading.set(false);
            return;
        }
        this.pictos_loading.set(true);
        this.service.getPictos(this.userId)
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (dto: UserPictosDTO) => {
                    this.setPictos(dto);
                    this.pictos_loading.set(false);
                },
                error: () => {
                    this.pictos_loading.set(false);
                }
            });
    }

    private setPictos(dto: UserPictosDTO): void {
        this.pictos.set((dto.pictos ?? []).map((picto: UserPictoDTO) => new UserPicto(picto)));
        this.pictos_imported_at.set(dto.historyImportedAt ?? null);
    }
}
