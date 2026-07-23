import { despair_deaths_id, mh_optimizer_icon, nb_dead_zombies_id, zone_info_zombies_id } from '../config/constants';
import { texts } from '../i18n/texts';
import { state } from '../state';
import { cancelWaitForElement, waitForElement } from '../utils/dom-wait';
import { getI18N } from '../utils/i18n';
import { calculateDespairDeaths } from '../utils/misc';
import { createNotification } from '../utils/notifications';
import { pageIsDesert, pageIsTown } from '../utils/page';
import { unwatchRendered, watchMap } from '../utils/render-watch';

/** Clé d'attente : une seule attente du compte à rebours en vol, quel que soit le nombre de rejeux */
const wait_key_dig_countdown: string = 'search-end:countdown';

/**
 * Compte à rebours de MA fouille en cours.
 *
 * Le sélecteur est volontairement ancré sur `#mgd-digging-note` : la page du désert
 * contient aussi un `span[x-countdown-to]` par citoyen présent sur la case (délai avant
 * qu'il puisse re-fouiller, dans une bulle d'aide masquée). Un simple
 * `span[x-countdown-to]` prenait le premier du document et pouvait donc notifier la fin
 * de la fouille de quelqu'un d'autre.
 */
const dig_countdown_selector: string = '#mgd-digging-note span[x-countdown-to]';

/** Avance de la notification sur la fin réelle de la fouille */
const notify_lead_time: number = 2;

/** Réveil programmé pour la fouille en cours */
let search_end_timeout: ReturnType<typeof setTimeout> | undefined;

/** Horodatage de fin de la fouille pour laquelle un réveil est déjà programmé */
let scheduled_dig_target: string | undefined;

/** Fouille déjà notifiée, identifiée par son horodatage de fin : évite une seconde notification pour la même */
let notified_dig_target: string | undefined;

/** Annule le réveil en cours, s'il y en a un */
function clearScheduledNotification(): void {
    if (search_end_timeout !== undefined) {
        clearTimeout(search_end_timeout);
        search_end_timeout = undefined;
    }
    scheduled_dig_target = undefined;
}

/**
 * Horodatage de fin (Unix, secondes) porté par l'attribut `x-countdown-to`, ou `undefined`.
 *
 * On lit l'attribut plutôt que le texte affiché : le jeu insère le compteur avec le
 * texte provisoire « ... » puis ne le remplit par `MM:SS` qu'ensuite, via son module
 * d'horloge. Lire le texte au moment où l'élément apparaît tombait donc souvent sur
 * « ... », illisible. L'attribut, lui, est présent dès le rendu.
 */
function readDigEndTimestamp(element: Element): number | undefined {
    const raw: string | null = element.getAttribute('x-countdown-to');
    const timestamp: number = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(timestamp) ? timestamp : undefined;
}

/**
 * Programme le réveil pour tomber `notify_lead_time` secondes avant la fin.
 *
 * IDEMPOTENT PAR FOUILLE : tant que la fouille en cours (même horodatage de fin) a déjà
 * son réveil, on ne le touche pas. Sans cela, chaque rejeu des initialisations — fréquent
 * pendant une fouille, ne serait-ce qu'à chaque rafraîchissement du journal — annulait puis
 * reprogrammait le réveil, qui, sur un timer de plusieurs minutes, ne survivait jamais assez
 * longtemps pour se déclencher. C'était la cause des notifications manquantes.
 */
function scheduleSearchEndNotification(element: Element): void {
    const end_timestamp: number | undefined = readDigEndTimestamp(element);
    if (end_timestamp === undefined) return;

    const dig_target: string = String(end_timestamp);

    /** Déjà notifiée, ou déjà programmée et son réveil encore en attente : ne rien perturber */
    if (notified_dig_target === dig_target) return;
    if (scheduled_dig_target === dig_target && search_end_timeout !== undefined) return;

    clearScheduledNotification();
    scheduled_dig_target = dig_target;

    const remaining: number = end_timestamp - (Date.now() / 1000);
    const delay: number = Math.max(0, (remaining - notify_lead_time) * 1000);

    search_end_timeout = setTimeout(() => {
        search_end_timeout = undefined;
        scheduled_dig_target = undefined;
        if (!state.mho_parameters.notify_on_search_end || notified_dig_target === dig_target) return;
        notified_dig_target = dig_target;
        /** Inutile de reprogrammer : le jeu recharge la page à expiration (`x-on-expire="reload"`) */
        if (!pageIsTown()) {
            createNotification(getI18N(texts.search_ended));
        }
    }, delay);
}

/**
 * Si l'option associée est activée, notifie peu avant la fin de la fouille en cours.
 *
 * Rejouable à chaque navigation : hors désert ou option décochée, plus rien ne tourne ;
 * en fouille, le réveil déjà programmé pour la fouille courante est laissé intact.
 */
export function notifyOnSearchEnd(): void {
    if (!state.mho_parameters.notify_on_search_end || !pageIsDesert()) {
        clearScheduledNotification();
        cancelWaitForElement(wait_key_dig_countdown);
        return;
    }

    waitForElement(wait_key_dig_countdown, dig_countdown_selector, (element: Element) => {
        /** Le compteur peut apparaître après un changement de page ou d'option */
        if (!state.mho_parameters.notify_on_search_end || !pageIsDesert()) return;
        scheduleSearchEndNotification(element);
    });
}

/** Affiche le nombre de zombies morts aujourd'hui */

export function displayNbDeadZombies() {
    if (state.mho_parameters.display_nb_dead_zombies && pageIsDesert()) {
        /**
         * La surveillance de la carte est posée sans condition sur son état : c'est elle
         * qui rappellera cette fonction une fois le rendu terminé, et à chaque
         * déplacement. Elle remplace la boucle de tentatives à 100 ms, qui n'était
         * bornée par rien et dont chaque rejeu des initialisations lançait un exemplaire
         * supplémentaire.
         */
        watchMap('zombie-counter', displayNbDeadZombies);

        /**
         * Les zombies au sol sont rendus par React : tant que la carte n'est pas prête,
         * les compter donnerait zéro, un décompte faux qui s'afficherait tel quel.
         */
        const map_element = document.querySelector('hordes-map');
        if (!map_element || map_element.childElementCount === 0 || document.querySelector('.map-load-container')) {
            return;
        }

        const zone_dist = document.querySelectorAll(`.zone-dist:not(#${zone_info_zombies_id})`)[0];
        if (zone_dist) {
            let zone_info_zombies = document.getElementById(zone_info_zombies_id);
            const nb_dead_zombies = document.querySelectorAll('.splatter').length;
            const despair_deaths = calculateDespairDeaths(nb_dead_zombies);

            if (!zone_info_zombies) {
                zone_info_zombies = document.createElement('div');
                zone_info_zombies.id = zone_info_zombies_id;
                zone_info_zombies.classList.add('row', 'zone-dist');

                const content_info_zombie = document.createElement('div');
                content_info_zombie.style.display = 'flex';
                content_info_zombie.classList.add('cell', 'rw-12', 'center');
                zone_info_zombies.appendChild(content_info_zombie);

                const btn_mho_img = document.createElement('img');
                btn_mho_img.src = mh_optimizer_icon;
                btn_mho_img.style.height = '16px';
                btn_mho_img.style.margin = 'auto 0.25em';
                content_info_zombie.appendChild(btn_mho_img);

                const rows_container_info_zombies = document.createElement('div');
                rows_container_info_zombies.style.margin = 'auto 0.25em';
                content_info_zombie.appendChild(rows_container_info_zombies);

                const nb_dead_zombies_text = document.createElement('div');
                nb_dead_zombies_text.innerHTML = `${getI18N(texts.nb_dead_zombies)} : <b id="${nb_dead_zombies_id}">${nb_dead_zombies}</span>`;
                rows_container_info_zombies.appendChild(nb_dead_zombies_text);

                const despair_deaths_text = document.createElement('div');
                despair_deaths_text.innerHTML = `${getI18N(texts.nb_despair_deaths)} : <b id="${despair_deaths_id}">${despair_deaths}</span>`;
                rows_container_info_zombies.appendChild(despair_deaths_text);

                zone_dist.parentNode.appendChild(zone_info_zombies);
            } else {
                const nb_dead_zombies_element = document.getElementById(nb_dead_zombies_id);
                nb_dead_zombies_element.innerText = (nb_dead_zombies) as any;

                const despair_deaths_element = document.getElementById(despair_deaths_id);
                despair_deaths_element.innerText = (despair_deaths) as any;
            }
        }
    } else {
        /** Hors désert ou option décochée : plus rien à recompter, on arrête d'écouter la carte */
        unwatchRendered('zombie-counter');

        const zone_info_zombies = document.getElementById(zone_info_zombies_id);
        if (zone_info_zombies) {
            zone_info_zombies.remove();
        }
    }
}
