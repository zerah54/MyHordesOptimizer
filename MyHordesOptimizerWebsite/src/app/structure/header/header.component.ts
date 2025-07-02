import { BreakpointObserver } from '@angular/cdk/layout';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, DestroyRef, HostListener, inject, OnInit, output, OutputEmitterRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbar, MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { BREAKPOINTS } from '../../_abstract_model/const';
import { AuthenticationService } from '../../_abstract_model/services/authentication.service';
import { TownService } from '../../_abstract_model/services/town.service';
import { Imports } from '../../_abstract_model/types/_types';
import { Me } from '../../_abstract_model/types/me.class';
import { getExternalAppId, getTown, getUser, setExternalAppId, setTokenWithMeWithExpirationDate } from '../../shared/utilities/localstorage.util';
import { CitizenMenuComponent } from './citizen-menu/citizen-menu.component';
import { HeaderService } from './header.service';
import { skip } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const angular_common: Imports = [CommonModule, NgOptimizedImage, FormsModule];
const components: Imports = [CitizenMenuComponent];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatDividerModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatToolbarModule, MatTooltipModule];

@Component({
    selector: 'mho-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class HeaderComponent implements OnInit {

    @ViewChild(MatToolbar) mat_toolbar!: MatToolbar;

    public changeSidenavStatus: OutputEmitterRef<void> = output();

    /** Le titre de l'application */
    public title: string = '';

    /** La valeur du champ d'identifiant d'app externe */
    public external_app_id_field_value: string | null = null;
    /** L'idendifiant d'app externe si il existe */
    public saved_external_app_id: string | null = getExternalAppId();
    /** Les informations de l'utilisateur */
    public me: Me | null = getUser();
    public readonly is_dev: boolean = !environment.production;
    public readonly myhordes_url: string = environment.myhordes_url;
    public readonly myhordes_app_id: number = environment.myhordes_app_id;

    public is_in_town: boolean = !!getTown()?.town_id;

    public is_gt_xs: boolean = this.breakpoint_observer.isMatched(BREAKPOINTS['gt-xs']);

    private readonly title_service: Title = inject(Title);
    private readonly authentication_api: AuthenticationService = inject(AuthenticationService);
    private readonly town_service: TownService = inject(TownService);
    private readonly header_service: HeaderService = inject(HeaderService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    @HostListener('window:resize', ['$event'])
    onResize(): void {
        this.is_gt_xs = this.breakpoint_observer.isMatched(BREAKPOINTS['gt-xs']);
    }

    public constructor(public router: Router, private breakpoint_observer: BreakpointObserver) {
        this.title = this.title_service.getTitle();
    }

    public ngOnInit(): void {
        this.header_service.token_obs
            .pipe(skip(1))
            .subscribe((token: string | null) => {
                if (this.external_app_id_field_value !== token) {
                    this.external_app_id_field_value = token;
                    this.saveExternalAppId();
                }
            })
    }

    /** Enregistre le nouvel id d'app externe */
    public saveExternalAppId(): void {
        setExternalAppId(this.external_app_id_field_value);
        this.updateMe();
    }

    /** Supprime l'identifiant d'app externe */
    public disconnect(): void {
        setExternalAppId(null);
        setTokenWithMeWithExpirationDate();
        location.reload();
    }

    /** Mise à jour des outils externes */
    public updateExternalTools(): void {
        this.town_service.updateExternalTools();
    }

    private updateMe(): void {
        this.authentication_api.getMe(true)
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe(() => {
                this.me = getUser();
                this.external_app_id_field_value = null;
                this.saved_external_app_id = getExternalAppId();
                this.is_in_town = !!getTown()?.town_id;
                location.reload();
            });
    }
}
