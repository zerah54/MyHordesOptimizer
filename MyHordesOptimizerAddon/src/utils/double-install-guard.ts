import { mh_optimizer_icon, mho_double_install_banner_id, mho_double_install_marker_attr } from '../config/constants';
import { texts } from '../i18n/texts';
import { isConflictingDoubleInstall } from './double-install-conflict';
import { getI18N } from './i18n';
import { getOrigin, getScriptInfo } from './version';

/**
 * Le script (Tampermonkey) et l'extension navigateur partagent le même bundle : quand les
 * deux sont installés sur le même navigateur, ils s'exécutent en parallèle sur la page et
 * se marchent dessus (écouteurs et éléments DOM dupliqués, instabilités). Chacun tourne
 * dans un monde JS isolé de l'autre, seul le DOM leur est commun : on s'en sert comme
 * verrou. Le marqueur porte l'origine (script/firefox/chrome) de l'instance qui l'a posé :
 * une instance qui retrouve sa PROPRE origine (mise à jour non rafraîchie, réveil d'onglet)
 * prend simplement le relais, seule une origine différente est un vrai doublon.
 *
 * @returns {boolean}    `true` si cette instance doit abandonner son initialisation
 */
export function isDoubleInstall(): boolean {
    const current_origin: string = getOrigin() ?? 'unknown';
    const existing_marker: string | null = document.documentElement.getAttribute(mho_double_install_marker_attr);

    if (isConflictingDoubleInstall(existing_marker, current_origin)) {
        showDoubleInstallWarning();
        return true;
    }

    document.documentElement.setAttribute(mho_double_install_marker_attr, current_origin);
    return false;
}

function showDoubleInstallWarning(): void {
    const content_html: string = `
        <div style="vertical-align: middle"><img src="${mh_optimizer_icon}" style="width: 24px; margin-right: 0.5em;">${getScriptInfo()?.name ?? 'MHO Addon'}</div>
        <br />
        <div><strong>${getI18N(texts.double_install_title)}</strong></div>
        <div>${getI18N(texts.double_install_help)}</div>
    `;

    /**
     * `#notifications` est le bloc natif du jeu (mêmes classes `error`/`show` que
     * `addError()`) : il n'existe que sur le domaine MyHordes, pas sur les sites
     * externes (BBH, GestHordes, FataMorgana) que l'addon cible aussi.
     */
    const notifications: HTMLElement | null = document.getElementById('notifications');
    if (notifications) {
        const notification: HTMLDivElement = document.createElement('div');
        notification.classList.add('error', 'show');
        notification.innerHTML = content_html;
        notification.addEventListener('click', () => notification.remove());
        notifications.appendChild(notification);
        return;
    }

    const banner: HTMLDivElement = document.createElement('div');
    banner.id = mho_double_install_banner_id;
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#4a1414;color:#f5d6d6;border-bottom:2px solid #c0392b;padding:0.75em 1em;font-family:sans-serif;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.4);cursor:pointer;';
    banner.innerHTML = content_html;
    banner.addEventListener('click', () => banner.remove());
    (document.body ?? document.documentElement).prepend(banner);
}
