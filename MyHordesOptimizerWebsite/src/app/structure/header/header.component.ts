import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, EventEmitter, HostBinding, Output, ViewChild, HostListener } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { Title } from '@angular/platform-browser';
import { getExternalAppId, getTown, setExternalAppId } from 'src/app/shared/utilities/localstorage.util';
import { BREAKPOINTS } from 'src/app/_abstract_model/const';
import { ApiServices } from '../../_abstract_model/services/api.services';

@Component({
    selector: 'mho-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
    @HostBinding('style.display') display: string = 'contents';

    @HostListener('window:resize', ['$event'])
    onResize() {
        this.is_gt_xs = this.breakpoint_observer.isMatched(BREAKPOINTS['gt-xs']);
    }

    @ViewChild(MatToolbar) mat_toolbar!: MatToolbar;

    @Output() changeSidenavStatus: EventEmitter<void> = new EventEmitter();

    /** Le titre de l'application */
    public title: string = '';

    /** La valeur du champ d'identifiant d'app externe */
    public external_app_id_field_value: string | null = getExternalAppId();
    /** L'idendifiant d'app externe si il existe */
    public saved_external_app_id: string | null = getExternalAppId();

    public is_in_town: boolean = !!getTown()?.town_id;

    public is_gt_xs: boolean = this.breakpoint_observer.isMatched(BREAKPOINTS['gt-xs']);

    public constructor(private breakpoint_observer: BreakpointObserver, private title_service: Title, private api: ApiServices) {
        this.title = this.title_service.getTitle();
    }

    /** Enregistre le nouvel id d'app externe */
    public saveExternalAppId() {
        setExternalAppId(this.external_app_id_field_value);
        this.saved_external_app_id = getExternalAppId();
        this.api.getMe();
    }

    /** Mise à jour des outils externes */
    public updateExternalTools() {
        this.api.updateExternalTools();
    }
}
