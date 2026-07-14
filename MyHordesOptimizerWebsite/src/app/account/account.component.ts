import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../environments/environment';
import { UserAccountPublicDTO } from '../_abstract_model/dto/user-account.dto';
import { UserAccountService } from '../_abstract_model/services/user-account.service';
import { Imports } from '../_abstract_model/types/_types';
import { TownListComponent } from '../miscellaneous/town-list/town-list.component';

const angular_common: Imports = [CommonModule];
const components: Imports = [TownListComponent];
const material_modules: Imports = [
    MatCardModule,
    MatProgressSpinnerModule
];

@Component({
    selector: 'mho-account',
    imports: [...angular_common, ...components, ...material_modules],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './account.component.html',
    styleUrl: './account.component.scss'
})
export class AccountComponent implements OnInit {
    private readonly route: ActivatedRoute = inject(ActivatedRoute);
    private readonly service: UserAccountService = inject(UserAccountService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    protected readonly myhordes_url: string = environment.myhordes_url;

    protected userId: WritableSignal<number | undefined> = signal<number | undefined>(undefined);
    protected profile: WritableSignal<UserAccountPublicDTO | null> = signal<UserAccountPublicDTO | null>(null);
    protected loading: WritableSignal<boolean> = signal<boolean>(true);
    protected error: WritableSignal<boolean> = signal<boolean>(false);

    public ngOnInit(): void {
        const user_id: number = Number(this.route.snapshot.paramMap.get('userId'));
        this.userId.set(user_id);
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
