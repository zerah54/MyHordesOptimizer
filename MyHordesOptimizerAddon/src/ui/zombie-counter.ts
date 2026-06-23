import {despair_deaths_id, mh_optimizer_icon, nb_dead_zombies_id, zone_info_zombies_id} from '../config/constants';
import {texts} from '../i18n/texts';
import {state} from '../state';
import {getI18N} from '../utils/i18n';
import {calculateDespairDeaths} from '../utils/misc';
import {createNotification} from '../utils/notifications';
import {pageIsDesert, pageIsTown} from '../utils/page';

export function notifyOnSearchEnd() {
    let interval = setInterval(() => {
        if (state.mho_parameters.notify_on_search_end && pageIsDesert()) {
            let count = document.querySelector('span[x-countdown-to]');
            if (count) {
                clearInterval(interval);
                let countdown_array = count.innerText.split(':');
                if (countdown_array.length < 3) {
                    countdown_array.splice(0, 0, 0);
                }
                let countdown = (+countdown_array[0] * 60 * 60) + (+countdown_array[1] * 60) + (+countdown_array[2]);
                if (countdown < 5) {
                    if (!pageIsTown()) {
                        createNotification(getI18N(texts.search_ended));
                    }
                    clearInterval(interval);
                    setTimeout(() => {
                        clearInterval(interval);
                        notifyOnSearchEnd();
                    }, 10000)
                } else {
                    let timeout_counter = countdown / 2 * 1000;
                    setTimeout(() => {
                        clearInterval(interval);
                        notifyOnSearchEnd();
                    }, timeout_counter);
                }
            }
        } else {
            clearInterval(interval);
            notifyOnSearchEnd();
        }
    }, 250);
}

/** Affiche le nombre de zombies morts aujourd'hui */

export function displayNbDeadZombies() {
    if (state.mho_parameters.display_nb_dead_zombies && pageIsDesert()) {
        if (document.querySelector('.map-load-container')) {
            setTimeout(() => {
                displayNbDeadZombies();
            }, 100)
        } else {
            let zone_dist = document.querySelectorAll(`.zone-dist:not(#${zone_info_zombies_id})`)[0];
            if (zone_dist) {
                let zone_info_zombies = document.getElementById(zone_info_zombies_id);
                let nb_dead_zombies = document.querySelectorAll('.splatter').length;
                let despair_deaths = calculateDespairDeaths(nb_dead_zombies);

                if (!zone_info_zombies) {
                    zone_info_zombies = document.createElement('div');
                    zone_info_zombies.id = zone_info_zombies_id;
                    zone_info_zombies.classList.add('row', 'zone-dist');

                    let content_info_zombie = document.createElement('div');
                    content_info_zombie.style.display = 'flex';
                    content_info_zombie.classList.add('cell', 'rw-12', 'center');
                    zone_info_zombies.appendChild(content_info_zombie);

                    let btn_mho_img = document.createElement('img');
                    btn_mho_img.src = mh_optimizer_icon;
                    btn_mho_img.style.height = '16px';
                    btn_mho_img.style.margin = 'auto 0.25em';
                    content_info_zombie.appendChild(btn_mho_img);

                    let rows_container_info_zombies = document.createElement('div');
                    rows_container_info_zombies.style.margin = 'auto 0.25em';
                    content_info_zombie.appendChild(rows_container_info_zombies);

                    let nb_dead_zombies_text = document.createElement('div');
                    nb_dead_zombies_text.innerHTML = `${getI18N(texts.nb_dead_zombies)} : <b id="${nb_dead_zombies_id}">${nb_dead_zombies}</span>`;
                    rows_container_info_zombies.appendChild(nb_dead_zombies_text);

                    let despair_deaths_text = document.createElement('div');
                    despair_deaths_text.innerHTML = `${getI18N(texts.nb_despair_deaths)} : <b id="${despair_deaths_id}">${despair_deaths}</span>`;
                    rows_container_info_zombies.appendChild(despair_deaths_text);

                    zone_dist.parentNode.appendChild(zone_info_zombies);
                } else {
                    let nb_dead_zombies_element = document.getElementById(nb_dead_zombies_id);
                    nb_dead_zombies_element.innerText = (nb_dead_zombies) as any;

                    let despair_deaths_element = document.getElementById(despair_deaths_id);
                    despair_deaths_element.innerText = (despair_deaths) as any;
                }
            }
        }
    } else {
        let zone_info_zombies = document.getElementById(zone_info_zombies_id);
        if (zone_info_zombies) {
            zone_info_zombies.remove();
        }
    }
}
