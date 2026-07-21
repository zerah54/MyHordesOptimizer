import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';

import { UserPictoDTO, UserPictosDTO } from '../../_abstract_model/dto/user-picto.dto';
import { UserAccountService } from '../../_abstract_model/services/user-account.service';
import { Imports } from '../../_abstract_model/types/_types';
import { UserPicto } from '../../_abstract_model/types/user-picto.class';
import { PictosListComponent } from '../../miscellaneous/pictos-list/pictos-list.component';
import { ProfileComponent } from '../profile.component';

const angular_common: Imports = [CommonModule];
const components: Imports = [PictosListComponent];
const pipes: Imports = [];
const material_modules: Imports = [MatProgressSpinnerModule];

@Component({
    selector: 'mho-profile-pictos',
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './profile-pictos.component.html',
    styleUrl: './profile-pictos.component.scss',
})
export class ProfilePictosComponent implements OnInit {
    protected readonly pictos: WritableSignal<UserPicto[]> = signal<UserPicto[]>([]);
    protected readonly pictos_loading: WritableSignal<boolean> = signal<boolean>(true);
    private readonly route: ActivatedRoute = inject(ActivatedRoute);
    private readonly service: UserAccountService = inject(UserAccountService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);
    /** Profil parent : l'import (pictos + villes) est piloté depuis son en-tête, au-dessus des onglets. */
    private readonly profile: ProfileComponent = inject(ProfileComponent);
    /** Le joueur est porté par la route parente (/profile/:userId), pas par celle de l'onglet. */
    private readonly userId: number | undefined = Number(this.route.parent?.snapshot.paramMap.get('userId')) || undefined;

    public constructor() {
        // Recharge les pictos après un import déclenché depuis l'en-tête du profil. La valeur
        // initiale (0) est ignorée : le chargement initial est fait par ngOnInit.
        let previousToken: number = this.profile.reloadToken();
        effect(() => {
            const token: number = this.profile.reloadToken();
            if (token === previousToken) {
                return;
            }
            previousToken = token;
            this.loadPictos();
        });
    }

    public ngOnInit(): void {
        this.loadPictos();
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
    }
}
