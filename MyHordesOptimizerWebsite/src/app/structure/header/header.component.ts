import { BreakpointObserver } from '@angular/cdk/layout';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, EventEmitter, HostBinding, HostListener, inject, Output, ViewChild } from '@angular/core';
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
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BREAKPOINTS } from '../../_abstract_model/const';
import { AuthenticationService } from '../../_abstract_model/services/authentication.service';
import { TownService } from '../../_abstract_model/services/town.service';
import { Me } from '../../_abstract_model/types/me.class';
import { AutoDestroy } from '../../shared/decorators/autodestroy.decorator';
import { DebugLogPipe } from '../../shared/pipes/debug-log.pipe';
import { getExternalAppId, getTown, getUser, setExternalAppId } from '../../shared/utilities/localstorage.util';
import { CitizenMenuComponent } from './citizen-menu/citizen-menu.component';

@Component({
    selector: 'mho-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    standalone: true,
    imports: [MatToolbarModule, MatButtonModule, MatIconModule, NgOptimizedImage, CommonModule, MatTooltipModule, MatMenuModule, MatFormFieldModule,
        MatInputModule, FormsModule, MatDividerModule, DebugLogPipe, CitizenMenuComponent]
})
export class HeaderComponent {
    @HostBinding('style.display') display: string = 'contents';

    @ViewChild(MatToolbar) mat_toolbar!: MatToolbar;

    @Output() changeSidenavStatus: EventEmitter<void> = new EventEmitter();

    /** Le titre de l'application */
    public title: string = '';

    /** La valeur du champ d'identifiant d'app externe */
    public external_app_id_field_value: string | null = null;
    /** L'idendifiant d'app externe si il existe */
    public saved_external_app_id: string | null = getExternalAppId();
    /** Les informations de l'utilisateur */
    public me: Me = getUser();
    public readonly is_dev: boolean = !environment.production;

    public is_in_town: boolean = !!getTown()?.town_id;

    public is_gt_xs: boolean = this.breakpoint_observer.isMatched(BREAKPOINTS['gt-xs']);

    private title_service: Title = inject(Title);
    private authentication_api: AuthenticationService = inject(AuthenticationService);
    private town_service: TownService = inject(TownService);

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    @HostListener('window:resize', ['$event'])
    onResize(): void {
        this.is_gt_xs = this.breakpoint_observer.isMatched(BREAKPOINTS['gt-xs']);
    }

    public constructor(private breakpoint_observer: BreakpointObserver) {
        this.title = this.title_service.getTitle();
    }

    /** Enregistre le nouvel id d'app externe */
    public saveExternalAppId(): void {
        setExternalAppId(this.external_app_id_field_value);
        this.updateMe();
    }

    /** Supprime l'identifiant d'app externe */
    public disconnect(): void {
        setExternalAppId(null);
        this.updateMe();
    }

    /** Mise à jour des outils externes */
    public updateExternalTools(): void {
        this.town_service.updateExternalTools();
    }

    private updateMe(): void {
        this.authentication_api.getMe(true)
            .pipe(takeUntil(this.destroy_sub))
            .subscribe(() => {
                this.me = getUser();
                this.external_app_id_field_value = null;
                this.saved_external_app_id = getExternalAppId();
                this.is_in_town = !!getTown()?.town_id;
            });
    }
}
