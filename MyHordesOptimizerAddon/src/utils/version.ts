import {mho_version_key} from '../config/constants';
import {api_texts} from '../i18n/texts';
import {state} from '../state';
import {getI18N} from './i18n';
import {buttonOptimizerElement} from './page';
import {setStorageItem} from './storage';

export function convertResponsePromiseToError(response: any): Promise<any> {
    return response.text().then((text) => {
        let error = new Error(text);
        error.status = response.status;
        error.name = response.statusText;
        throw error;
    })
}


export function getErrorFromApi(error) {
    if (error.name !== 'AbortError' && error.name !== 'TypeError') {
        let error_text = '';
        error_text += `
            <div>${getI18N(api_texts.error).replace('$error$', (error.status ?? '') + (error.status !== 500 && error.status !== 502 && error.status !== 504 ? ' - ' + (error.message ?? error.name ?? error.statusText) : ''))}</div>
            <br />`
        if (!isScriptVersionLastVersion()) {
            error_text += `<div><small>${getI18N(api_texts.error_version).replace('$your_version$', getScriptInfo().version).replace('$recent_version$', state.parameters?.find((param) => param.name === 'ScriptVersion')?.value)}</small></div>`;
            error_text += `<small>${getI18N(api_texts.update_script)}</small>`;
        }
        error_text += `<div><small>${getI18N(api_texts.error_discord)}</small><div>`;
        return error_text;
    }
}


export function isScriptVersionLastVersion() {
    if (!isScript()) return true;

    const current_script_version = getScriptInfo().version;
    const base_script_version = state.parameters?.find((param) => param.name === 'ScriptVersion')?.value;
    if (!base_script_version) return true;

    const comparison_regex = /(\d+)/g;
    const splitted_current = current_script_version.match(comparison_regex);
    const splitted_base = base_script_version.match(comparison_regex);

    return splitted_base.every((part, index) => {
        const is_ok = !splitted_current[index] || splitted_current[index] >= part;
        if (!is_ok) {
            toggleNewVersion(true);
        }
        return is_ok;
    });
}


export function isNewVersion(version) {
    if (!version || typeof version !== "object") {
        version = {};
        setStorageItem(mho_version_key, version);
    }
    return !version || !version[getScriptInfo().version];
}


export function toggleNewChangelog(new_changelog) {
    state.has_new_changelog = new_changelog;
    let optimizer_btn = buttonOptimizerElement();
    if (optimizer_btn) {
        if (new_changelog && !optimizer_btn.classList.contains('mho-new-changelog')) {
            optimizer_btn.classList.add('mho-new-changelog');
        } else if (optimizer_btn.classList.contains('mho-new-changelog')) {
            optimizer_btn.classList.remove('mho-new-changelog');
        }

        let changelog_item = optimizer_btn.querySelector('#version');
        if (changelog_item) {
            if (new_changelog && !changelog_item.classList.contains('mho-new-changelog')) {
                changelog_item.classList.add('mho-new-changelog');
            } else if (!new_changelog && changelog_item.classList.contains('mho-new-changelog')) {
                changelog_item.classList.remove('mho-new-changelog');
            }
        }
    }
}


export function toggleNewVersion(new_version) {
    let optimizer_btn = buttonOptimizerElement();
    if (optimizer_btn) {
        if (new_version && !optimizer_btn.classList.contains('mho-new-version')) {
            optimizer_btn.classList.add('mho-new-version');
        } else if (!new_version && optimizer_btn.classList.contains('mho-new-version')) {
            optimizer_btn.classList.remove('mho-new-version');
        }

        let update_item = optimizer_btn.querySelector('#update');
        if (update_item) {
            if (new_version && !update_item.classList.contains('mho-new-version')) {
                update_item.classList.add('mho-new-version');
            } else if (!new_version && update_item.classList.contains('mho-new-version')) {
                update_item.classList.remove('mho-new-version');
            }

            if (new_version && update_item.parentElement.classList.contains('mho-hidden')) {
                update_item.parentElement.classList.remove('mho-hidden');
            } else if (!new_version && !update_item.parentElement.classList.contains('mho-hidden')) {
                update_item.parentElement.classList.add('mho-hidden');
            }
        }
    }
}


export function getOrigin() {
    try {
        GM_info.script;
        return 'script';
    } catch (error) {
        try {
            browser.runtime;
            return 'firerox';
        } catch (error) {
            try {
                chrome.runtime;
                return 'chrome';
            } catch (error) {
                console.error(error);
            }
        }
    }
}


export function isScript() {
    return getOrigin() === 'script';
}


export function getScriptInfo() {
    try {
        return GM_info.script;
    } catch (error) {
        try {
            return browser.runtime.getManifest();
        } catch (error) {
            try {
                return chrome.runtime.getManifest();
            } catch (error) {
                console.error(error);
            }
        }
    }

}

export function getChangelog(): string {
    return `${getScriptInfo().name} : Changelog pour la version ${getScriptInfo().version}\n\n`
        + `[Correctif] La mise à jour de la carte de GH après une mise à jour des outils externes fonctionne de nouveau correctement sans recharger toute la page \n\n`
        + `[Nouveauté] Deux nouvelles options permettent d'afficher des filtres sur les pages de liste des citoyens et d'omniscience`;
}