import { mho_version_key } from '../config/constants';
import { changelogs } from '../data/changelogs';
import { api_texts } from '../i18n/texts';
import { state } from '../state';
import { getI18N } from './i18n';
import { buttonOptimizerElement } from './page';
import { setStorageItem } from './storage';

export function convertResponsePromiseToError(response: any): Promise<any> {
    return response.text().then((text) => {
        const error = new Error(text);
        error.status = response.status;
        error.name = response.statusText;
        throw error;
    });
}

export function getErrorFromApi(error): string | undefined {
    if (error.name !== 'AbortError' && error.name !== 'TypeError') {
        let error_text = '';
        error_text += `
            <div>${getI18N(api_texts.error).replace('$error$', (error.status ?? '') + (error.status !== 500 && error.status !== 502 && error.status !== 504 ? ' - ' + (error.message ?? error.name ?? error.statusText) : ''))}</div>
            <br />`;
        if (!isScriptVersionLastVersion()) {
            error_text += `<div><small>${getI18N(api_texts.error_version).replace('$your_version$', getScriptInfo().version).replace('$recent_version$', state.parameters?.find((param) => param.name === 'ScriptVersion')?.value)}</small></div>`;
            error_text += `<small>${isScript() ? getI18N(api_texts.update_script).replace('$update_url$', getScriptInfo().updateURL ?? '') : getI18N(api_texts.update_script_via_menu)}</small>`;
        }
        error_text += `<div><small>${getI18N(api_texts.error_discord)}</small><div>`;
        return error_text;
    }
}

export function isScriptVersionLastVersion() {
    const current_script_version = getScriptInfo().version;
    if (!current_script_version) return true;

    const base_script_version = state.parameters?.find((param) => param.name === 'ScriptVersion')?.value;
    if (!base_script_version) return true;

    const comparison_regex = /(\d+)/g;
    const splitted_current = current_script_version.match(comparison_regex);
    const splitted_base = base_script_version.match(comparison_regex);

    for (let index = 0; index < splitted_base.length; index++) {
        const current_part = Number(splitted_current[index] ?? 0);
        const base_part = Number(splitted_base[index]);
        if (current_part > base_part) return true;
        if (current_part < base_part) {
            toggleNewVersion(true);
            return false;
        }
    }
    return true;
}

export function isNewVersion(version) {
    if (!version || typeof version !== 'object') {
        version = {};
        setStorageItem(mho_version_key, version);
    }
    return !version || !version[getScriptInfo().version];
}

export function toggleNewChangelog(new_changelog) {
    state.has_new_changelog = new_changelog;
    const optimizer_btn = buttonOptimizerElement();
    if (optimizer_btn) {
        if (new_changelog && !optimizer_btn.classList.contains('mho-new-changelog')) {
            optimizer_btn.classList.add('mho-new-changelog');
        } else if (optimizer_btn.classList.contains('mho-new-changelog')) {
            optimizer_btn.classList.remove('mho-new-changelog');
        }

        const changelog_item = optimizer_btn.querySelector('#version');
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
    const optimizer_btn = buttonOptimizerElement();
    if (optimizer_btn) {
        if (new_version && !optimizer_btn.classList.contains('mho-new-version')) {
            optimizer_btn.classList.add('mho-new-version');
        } else if (!new_version && optimizer_btn.classList.contains('mho-new-version')) {
            optimizer_btn.classList.remove('mho-new-version');
        }

        const update_item = optimizer_btn.querySelector('#update');
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

export function getOrigin(): 'script' | 'firefox' | 'chrome' {
    try {
        GM_info.script;
        return 'script';
    } catch (error) {
        try {
            browser.runtime;
            return 'firefox';
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

export function isScript(): boolean {
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

    return {};
}

export function getChangelog(): string {
    const version: string = getScriptInfo().version;
    const content: string = changelogs[version] ?? 'Aucune note de version disponible pour cette mise à jour.';
    return `${getScriptInfo().name} : Changelog pour la version ${version}
        ${content}`;
}