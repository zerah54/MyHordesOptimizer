import { firefox_amo_url, mho_version_key } from '../config/constants';
import { texts } from '../i18n/texts';
import { showChangelogModal } from '../ui/window';
import { getI18N } from './i18n';
import { addWarning } from './notifications';
import { getStorageItem, setStorageItem } from './storage';
import { getChangelog, getOrigin, getScriptInfo, isNewVersion, toggleNewChangelog } from './version';

let has_notified_update_available: boolean = false;

/** Ouvre la modale de changelog et marque la version courante comme vue */
export function openChangelogAndMarkSeen(): void {
    getStorageItem(mho_version_key).then((version: Record<string, boolean>) => {
        if (isNewVersion(version)) {
            showChangelogModal(getChangelog(), () => {
                version[getScriptInfo().version] = true;
                toggleNewChangelog(false);
                setStorageItem(mho_version_key, version);
            });
        } else {
            showChangelogModal(getChangelog());
        }
    });
}

export type ChromeUpdateCheckResult = 'no_update_yet' | 'throttled' | 'ready' | 'unknown';

/**
 * `chrome.runtime.onUpdateAvailable` (côté script d'arrière-plan) ne se déclenche que si le
 * téléchargement de la mise à jour aboutit : sans lui, `sendResponse` n'est jamais appelé et
 * le port de message reste ouvert tant que l'onglet l'est. Ce délai borne l'attente pour que
 * `onResult` soit toujours appelé, comme documenté ci-dessous.
 */
export const CHECK_FOR_UPDATE_TIMEOUT_MS: number = 15000;

/**
 * Sollicite activement le Web Store via le script d'arrière-plan (Chrome/Opera uniquement).
 * Appelle toujours `onResult`, au plus tard après `CHECK_FOR_UPDATE_TIMEOUT_MS` : une réponse
 * absente, non reconnue, ou qui n'arrive jamais, est traitée comme `'unknown'`.
 */
export function checkForUpdateOnChrome(onResult: (result: ChromeUpdateCheckResult) => void): void {
    let settled: boolean = false;
    const settle = (result: ChromeUpdateCheckResult): void => {
        if (settled) return;
        settled = true;
        onResult(result);
    };

    setTimeout(() => settle('unknown'), CHECK_FOR_UPDATE_TIMEOUT_MS);

    chrome.runtime.sendMessage({ type: 'checkForUpdate' }, (response?: { status?: string }) => {
        if (response?.status === 'throttled') settle('throttled');
        else if (response?.status === 'ready') settle('ready');
        else if (response?.status === 'no_update') settle('no_update_yet');
        else settle('unknown');
    });
}

let is_checking_for_update: boolean = false;

/** Déclenche la vérification active Chrome/Opera et affiche le résultat ; ignore un second clic pendant une vérification en cours */
export function triggerChromeUpdateCheck(): void {
    if (is_checking_for_update) return;
    is_checking_for_update = true;

    addWarning(getI18N(texts.update_checking_toast));
    checkForUpdateOnChrome((result: ChromeUpdateCheckResult) => {
        is_checking_for_update = false;
        if (result === 'no_update_yet') addWarning(getI18N(texts.update_not_yet_on_store_toast));
        else if (result === 'throttled') addWarning(getI18N(texts.update_throttled_toast));
        else if (result === 'ready') addWarning(getI18N(texts.update_ready_refresh_toast));
        else if (result === 'unknown') addWarning(getI18N(texts.update_check_unknown_toast));
    });
}

/** Prévient qu'une mise à jour est disponible ; au plus une fois par chargement de page */
export function notifyUpdateAvailable(): void {
    if (has_notified_update_available) return;
    has_notified_update_available = true;

    const origin = getOrigin();
    if (origin === 'script') {
        addWarning(getI18N(texts.update_available_toast_script), () => window.open(getScriptInfo().updateURL, '_blank'));
    } else if (origin === 'chrome') {
        addWarning(getI18N(texts.update_available_toast_chrome), () => triggerChromeUpdateCheck());
    } else {
        addWarning(getI18N(texts.update_available_toast_firefox), () => window.open(firefox_amo_url, '_blank'));
    }
}

/** Prévient qu'une mise à jour vient d'être appliquée, une fois par version */
export function notifyJustUpdated(version: unknown): void {
    if (!isNewVersion(version)) return;
    addWarning(getI18N(texts.just_updated_toast).replace('$version$', getScriptInfo().version), () => openChangelogAndMarkSeen());
}
