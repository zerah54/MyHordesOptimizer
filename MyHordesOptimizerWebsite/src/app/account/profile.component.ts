import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { environment } from '../../environments/environment';
import { UserAccountPublicDTO } from '../_abstract_model/dto/user-account.dto';
import { UserAccountService } from '../_abstract_model/services/user-account.service';
import { Imports } from '../_abstract_model/types/_types';

const angular_common: Imports = [RouterLink, RouterLinkActive, RouterOutlet];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatCardModule, MatProgressSpinnerModule, MatTabsModule];

@Component({
    selector: 'mho-account',
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './account.component.html',
    styleUrl: './account.component.scss'
})
export class AccountComponent implements OnInit {
    protected readonly profile: WritableSignal<UserAccountPublicDTO | null> = signal<UserAccountPublicDTO | null>(null);
    protected readonly loading: WritableSignal<boolean> = signal<boolean>(true);
    protected readonly error: WritableSignal<boolean> = signal<boolean>(false);
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
                    this.loading.set(false);
                },
                error: () => {
                    this.error.set(true);
                    this.loading.set(false);
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
