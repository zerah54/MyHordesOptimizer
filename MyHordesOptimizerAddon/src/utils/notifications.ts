import { mh_optimizer_icon } from '../config/constants';
import { state } from '../state';
import { getErrorFromApi, getScriptInfo } from './version';

export function normalizeString(str) {
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Affiche une notification de réussite */

export function addSuccess(message) {
    const notifications = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.classList.add('notice', 'show');
    notification.innerText = `${getScriptInfo().name} : ${message}`;
    notifications?.appendChild(notification);
    notification.addEventListener('click', () => {
        notification.remove();
    });
    setTimeout(() => {
        notification.remove();
    }, 5000);
}


/** Affiche une notification de warning */

export function addWarning(message) {
    const notifications = document.getElementById('notifications');
    if (!notifications) return;

    const notification = document.createElement('div');
    notification.classList.add('warning', 'show');
    notification.innerText = `${getScriptInfo().name} : ${message}`;
    notifications?.appendChild(notification);
    notification.addEventListener('click', () => {
        notification.remove();
    });
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

/** Affiche une notification d'erreur */

export function addError(error) {
    if (typeof error === 'string' || (error.name !== 'AbortError' && error.name !== 'TypeError') && !state.is_error) {
        if (error?.status === 503) return;

        const notifications = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.classList.add('error', 'show');
        const error_text = `
            <div style="vertical_align: middle"><img src="${mh_optimizer_icon}" style="width: 24px; margin-right: 0.5em;">${getScriptInfo().name}</div>
            <br />
        `;
        notification.innerHTML = error_text + (typeof error === 'string' ? error : getErrorFromApi(error));
        notifications?.appendChild(notification);
        state.is_error = true;
        notification.addEventListener('click', () => {
            notification.remove();
        });
        setTimeout(() => {
            state.is_error = false;
        }, 5000);
        setTimeout(() => {
            notification.remove();
        }, 10000);
    }
    console.error(`${getScriptInfo().name} : Une erreur s'est produite : \n`, error);
}


export function createNotification(content) {
    try {
        GM_notification(
            {
                text: content,
                title: getScriptInfo().name,
                highlight: true,
                timeout: 0
            }
        );
    } catch (error) {
        try {
            browser.runtime.sendMessage({
                type: 'notifications', content: {
                    type: 'basic',
                    title: getScriptInfo().name,
                    message: content,
                    priority: 1,
                    iconUrl: browser.runtime.getURL('img/logo/logo_mho_64x64_outlined.png')
                }
            });
        } catch (error) {
            try {
                chrome.runtime.sendMessage({
                    type: 'notifications', content: {
                        type: 'basic',
                        title: getScriptInfo().name,
                        message: content,
                        priority: 1,
                        iconUrl: chrome.runtime.getURL('img/logo/logo_mho_64x64_outlined.png'),
                        requireInteraction: true
                    }
                });
            } catch (error) {
                console.error(error);
            }
        }
    }

}
