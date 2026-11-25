import { mho_expeditions_window_id, mho_store_notifications_id, mho_store_notifications_window_id, repo_img_hordes_url } from '../config/constants';
import { texts } from '../i18n/texts';
import { state } from '../state';
import { getI18N } from '../utils/i18n';
import { createHeaderButton, getHeaderButtonsContainer } from './header-space';
import { createWindow } from './window';

export function createStoreNotificationsBtn() {
    const stored_notifications_btn = document.getElementById(mho_store_notifications_id);
    if (state.mho_parameters.store_notifications) {

        createWindow(mho_store_notifications_window_id, false);
        const notifications_space = document.querySelector('#notifications');
        const mho_header_space = getHeaderButtonsContainer();
        if (stored_notifications_btn || !mho_header_space || !notifications_space) return;

        // Créez une instance de MutationObserver
        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                // Vérifiez si des nœuds enfants ont été ajoutés ou supprimés
                if (mutation.addedNodes.length) {
                    state.mh_notifications.push(...(Array.from(mutation.addedNodes).map((node) => node.cloneNode(true))));
                    createNotificationsWindowContent();
                }
            });
        });

        // Configuration de l'observateur pour surveiller les modifications des enfants
        const config = { childList: true };

        // Commencez à observer l'élément cible pour les modifications configurées
        observer.observe(notifications_space, config);

        const btn_container = createHeaderButton(mho_store_notifications_id, repo_img_hordes_url + '/icons/news.gif', getI18N(texts.stored_notifications));

        btn_container.addEventListener('click', (event) => {
            event.stopPropagation();
            event.preventDefault();
            document.getElementById(mho_store_notifications_window_id).classList.add('visible');
            createNotificationsWindowContent();
        });

        mho_header_space.appendChild(btn_container);
    } else if (stored_notifications_btn) {
        stored_notifications_btn.remove();
    }
}


export function createNotificationsWindowContent() {

    const window_content = document.querySelector(`#${mho_store_notifications_window_id}-content`);
    window_content.innerHTML = '';

    const window = window_content.parentElement;
    window.style.minWidth = '500px';
    window.style.maxWidth = '100dvw';

    const title: HTMLHeadingElement = document.createElement('h3');
    title.textContent = getI18N(texts.stored_notifications);
    window_content.appendChild(title);

    const tabs_div = document.createElement('div');
    tabs_div.id = 'tabs';
    window_content.appendChild(tabs_div);

    const tabs_ul = document.createElement('ul');
    tabs_div.appendChild(tabs_ul);

    dispatchNotificationsContent();
}


export function dispatchNotificationsContent() {
    const window_content = document.getElementById(mho_store_notifications_window_id + '-content');

    let tab_content = document.getElementById(mho_store_notifications_window_id + '-tab-content');
    if (tab_content) {
        tab_content.remove();
    }
    tab_content = document.createElement('div');
    tab_content.id = mho_expeditions_window_id + '-tab-content';
    tab_content.classList.add('tab-content');
    window_content.appendChild(tab_content);

    const notifications_list = document.createElement('ul');
    notifications_list.id = 'notifications-list';
    tab_content.appendChild(notifications_list);

    state.mh_notifications.forEach((notification, index) => {
        const notification_container = document.createElement('li');
        notification_container.style.display = 'flex';
        notification_container.style.gap = '0.5em';
        notification_container.style.alignItems = 'center';
        notifications_list.appendChild(notification_container);

        const notification_content = document.createElement('div');
        notification_content.style.flex = (1) as any;
        notification_content.innerHTML = notification.innerHTML;
        notification_container.appendChild(notification_content);

        const remove_notification = document.createElement('img');
        remove_notification.src = repo_img_hordes_url + '/icons/small_trash_red.png';
        remove_notification.style.cursor = 'pointer';
        notification_container.appendChild(remove_notification);

        remove_notification.addEventListener('click', (event) => {
            state.mh_notifications.splice(index, 1);
            createNotificationsWindowContent();
        });
    });
}
