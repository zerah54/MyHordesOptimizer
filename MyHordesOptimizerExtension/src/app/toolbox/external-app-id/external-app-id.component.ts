import { Component } from '@angular/core';
import { faQuestionCircle } from '@fortawesome/free-regular-svg-icons';
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { browser } from 'webextension-polyfill-ts';
import { UserService } from '../../shared/services/user.service';

/**
 * La toolbox est la fenêtre accessible depuis un clic sur l'icône de l'extension dans le navigateur
 * Dans notre cas, elle va servir entrer la clé d'applications externes et à afficher des informations utiles en dehors de la page
 */
@Component({
    selector: 'mho-external-app-id',
    templateUrl: './external-app-id.component.html',
    styleUrls: ['./external-app-id.component.scss']
})
export class ExternalAppIdComponent {


    public external_app_id: string = this.user_service.getExternalAppId();
    /** True si on vient de valider et que l'enregistrement s'est correctement effectué, pour afficher un retour à l'utilisateur */
    public validate_active: boolean = false;

    /** Icones */
    public readonly help_icon = faQuestionCircle;
    public readonly validate_icon = faCheck;
    public readonly empty_icon = faXmark;

    /** Libellés */
    public readonly external_app_id_label: string = browser.i18n.getMessage('EXTERNAL_APP_ID_LABEL');
    public readonly external_app_id_help: string = browser.i18n.getMessage('EXTERNAL_APP_ID_HELP');

    constructor(private user_service: UserService) {

    }

    validate(): void {
        this.user_service.setExternalAppId(this.external_app_id);
        this.validate_active = true;
        setTimeout(() => {
            this.validate_active = false
        }, 5000);
    }

}
