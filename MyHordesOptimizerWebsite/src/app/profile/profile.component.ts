import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { environment } from '../../environments/environment';
import { UserAccountPublicDTO } from '../_abstract_model/dto/user-account.dto';
import { UserPictosDTO } from '../_abstract_model/dto/user-picto.dto';
import { UserAccountService } from '../_abstract_model/services/user-account.service';
import { Imports } from '../_abstract_model/types/_types';

const angular_common: Imports = [CommonModule, RouterLink, RouterLinkActive, RouterOutlet];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, MatTabsModule, MatTooltipModule];

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
