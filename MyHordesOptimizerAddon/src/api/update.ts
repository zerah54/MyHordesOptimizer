import { hordes_img_url, lang } from '../config/constants';
import { state } from '../state';
import { fetcher } from '../utils/fetch';
import { getI18N } from '../utils/i18n';
import { getItemFromImg } from '../utils/item-lookup';
import { fixMhCompiledImg } from '../utils/misc';
import { addError, normalizeString } from '../utils/notifications';
import { pageIsAmelio, pageIsDesert, pageIsDoors, pageIsHouse } from '../utils/page';
import { getCurrentPosition } from '../utils/position';
import { convertResponsePromiseToError } from '../utils/version';
import { saveBath } from './bath';
import { getMap } from './map';
import { getWishlist } from './wishlist';

export function updateExternalTools() {
    const { mh_user, mho_parameters, api_url, external_app_id } = state as any;
    return new Promise(async (resolve, reject) => {

        const convertListOfSingleObjectsIntoListOfCountedObjects = (objects) => {
            const object_map = [];
            objects.forEach((object) => {
                const object_in_map = object_map.find((_object_in_map) => _object_in_map.id === object.id && _object_in_map.isBroken === object.isBroken);
                if (object_in_map) {
                    object_in_map.count += 1;
                } else if (object) {
                    object.count = 1;
                    object_map.push(object);
                }
            });
            return object_map;
        };

        const data: any = {};
        const nb_dead_zombies = +document.querySelectorAll('.actor.splatter').length;

        data.townDetails = {
            townX: mh_user.townDetails?.townX,
            townY: mh_user.townDetails?.townY,
            townid: mh_user.townDetails?.townId,
            isChaos: mh_user.townDetails?.isChaos,
        };

        data.map = {};
        data.map.toolsToUpdate = {
            isBigBrothHordes: /* mho_parameters && mho_parameters.update_bbh && !is_mh_beta ? 'api' : */ 'none',
            isFataMorgana: mho_parameters && mho_parameters.update_fata ? 'api' : 'none',
            isGestHordes: mho_parameters && mho_parameters.update_gh ? 'api' : 'none',
            isMyHordesOptimizer: mho_parameters && mho_parameters.update_mho ? 'api' : 'none'
        };

        const position = getCurrentPosition();
        let citizen_list: any[] = Array.from(document.querySelectorAll('.citizen-box .username[x-user-id]') || [])?.map((citizen_box: any) => {
            return {
                id: +citizen_box.getAttribute('x-user-id'),
                userName: citizen_box.innerText,
                job: citizen_box.parentElement.parentElement.querySelector('img[src*=professions]').src.replace(/.*professions\/(\w+).*/, '$1'),
                row: citizen_box
            };
        });

        if (!citizen_list || citizen_list.length === 0) {
            citizen_list = [{ id: mh_user.id, userName: mh_user.userName, job: mh_user.jobDetails.uid }];
        }

        // Mise à jour en ville chaos
        if (pageIsDesert() && (mh_user.townDetails?.isChaos && (mho_parameters.update_gh && mho_parameters.update_gh_devastated) || (mho_parameters.update_mho && mho_parameters.update_mho_devastated)) || (mho_parameters.update_fata && mho_parameters.update_fata_devastated)) {

            if (mho_parameters.update_gh && mho_parameters.update_gh_devastated && mh_user.townDetails?.isChaos) {
                data.map.toolsToUpdate.isGestHordes = 'cell';
            }
            if (mho_parameters.update_mho && mho_parameters.update_mho_devastated && mh_user.townDetails?.isChaos) {
                data.map.toolsToUpdate.isMyHordesOptimizer = 'cell';
            }
            if (mho_parameters.update_fata && mho_parameters.update_fata_devastated) {
                data.map.toolsToUpdate.isFataMorgana = 'cell';
            }

            const objects = Array.from(document.querySelector('.inventory.desert')?.querySelectorAll('li.item') || []).map((desert_item) => {
                const item = getItemFromImg(desert_item.querySelector('img')?.src);
                return { id: item?.id, isBroken: desert_item.classList.contains('broken') };
            });

            const content = {
                x: +position[0],
                y: +position[1],
                zombies: +document.querySelectorAll('.actor.zombie').length,
                zoneEmpty: !!document.querySelector('#mgd-zone-note'),
                objects: convertListOfSingleObjectsIntoListOfCountedObjects(objects),
                citizenId: citizen_list.map((citizen) => citizen.id)
            };
            if (data.map.cell) {
                data.map.cell.zombies = content.zombies;
                data.map.cell.zoneEmpty = content.zoneEmpty;
                data.map.cell.objects = content.objects || [];
                data.map.cell.citizenId = content.citizenId;
            } else {
                data.map.cell = content;
            }
        }

        // Mise à jour du nombre de zombies tués
        if (((mho_parameters.update_gh && mho_parameters.update_gh_killed_zombies)
                || (mho_parameters.update_mho && mho_parameters.update_mho_killed_zombies)
                || (mho_parameters.update_fata && mho_parameters.update_fata_killed_zombies))
            && pageIsDesert() && nb_dead_zombies > 0) {

            if (mho_parameters.update_gh && mho_parameters.update_gh_killed_zombies) {
                data.map.toolsToUpdate.isGestHordes = 'cell';
            }
            if (mho_parameters.update_mho && mho_parameters.update_mho_killed_zombies) {
                data.map.toolsToUpdate.isMyHordesOptimizer = 'cell';
            }
            if (mho_parameters.update_fata && mho_parameters.update_fata_killed_zombies) {
                data.map.toolsToUpdate.isFataMorgana = 'cell';
            }

            const content = {
                x: +position[0],
                y: +position[1],
                deadZombies: nb_dead_zombies,
                citizenId: citizen_list.map((citizen) => citizen.id)
            };

            if (data.map.cell) {
                data.map.cell.deadZombies = nb_dead_zombies;
            } else {
                data.map.cell = content;
            }
        }

        // Mise à jour des marqueurs issus des métiers
        if (((mho_parameters.update_mho && mho_parameters.update_mho_job_markers)
                || (mho_parameters.update_fata && mho_parameters.update_fata_job_markers))
            && pageIsDesert() && (mh_user.jobDetails.uid === 'dig' || mh_user.jobDetails.uid === 'vest')) {

            if (mho_parameters.update_mho && mho_parameters.update_mho_job_markers) {
                data.map.toolsToUpdate.isMyHordesOptimizer = 'cell';
            }
            if (mho_parameters.update_fata && mho_parameters.update_fata_job_markers) {
                data.map.toolsToUpdate.isFataMorgana = 'cell';
            }

            if (mh_user.jobDetails.uid === 'dig') {

                // L'indicateur d'abondance est absent de la page quand le niveau de fouille est inconnu.
                // Dans ce cas la valeur doit rester indéfinie : un 0 signifierait « zone épuisée ».
                const scav_zone_level_src = document.querySelector('.zone-scavenger img')?.src;
                let scav_zone_level = undefined;
                if (scav_zone_level_src) {
                    let zone_scav_level_img = fixMhCompiledImg(scav_zone_level_src);
                    const index = zone_scav_level_img.indexOf(hordes_img_url);
                    zone_scav_level_img = zone_scav_level_img.slice(index).replace(hordes_img_url, '').replace('icons/', '');
                    // Les niveaux 1 à 3 utilisent collec_lvX.gif, le niveau 0 utilise Small_broken.gif
                    const level_match = zone_scav_level_img.match(/\d/);
                    scav_zone_level = level_match && level_match.length > 0 ? +level_match[0] : 0;
                }

                const content = {
                    x: +position[0],
                    y: +position[1],
                    scavNextCells: {
                        north: document.querySelector('.scavenger-sense-north') ? !document.querySelector('.scavenger-sense-north.scavenger-sense-1') : undefined,
                        east: document.querySelector('.scavenger-sense-east') ? !document.querySelector('.scavenger-sense-east.scavenger-sense-1') : undefined,
                        south: document.querySelector('.scavenger-sense-south') ? !document.querySelector('.scavenger-sense-south.scavenger-sense-1') : undefined,
                        west: document.querySelector('.scavenger-sense-west') ? !document.querySelector('.scavenger-sense-west.scavenger-sense-1') : undefined
                    },
                    scavZoneLevel: scav_zone_level,
                    citizenId: citizen_list.map((citizen) => citizen.id),
                };

                if (data.map.cell) {
                    data.map.cell.scavNextCells = content.scavNextCells;
                    data.map.cell.scavZoneLevel = content.scavZoneLevel;
                } else {
                    data.map.cell = content;
                }
            } else if (mh_user.jobDetails.uid === 'vest') {
                // Le bloc .zone-scout n'existe pas si le niveau d'exploration est inconnu
                // ou si le joueur n'est pas en mode expert : on ne remonte alors aucun niveau.
                let zone_scout_level_src = document.querySelector('.zone-scout')?.querySelector('img')?.src;
                let scout_zone_level = undefined;
                if (zone_scout_level_src) {
                    const index = zone_scout_level_src.indexOf(hordes_img_url);
                    zone_scout_level_src = zone_scout_level_src.slice(index).replace(hordes_img_url, '');
                    scout_zone_level = +fixMhCompiledImg(zone_scout_level_src).replace(/\D/g, '');
                    if (isNaN(scout_zone_level)) {
                        scout_zone_level = undefined;
                    }
                }
                const content = {
                    x: +position[0],
                    y: +position[1],
                    scoutNextCells: {
                        north: document.querySelector('.scout-sense-north') ? +document.querySelector('.scout-sense-north').querySelector('text')?.innerHTML : undefined,
                        east: document.querySelector('.scout-sense-east') ? +document.querySelector('.scout-sense-east').querySelector('text')?.innerHTML : undefined,
                        south: document.querySelector('.scout-sense-south') ? +document.querySelector('.scout-sense-south').querySelector('text')?.innerHTML : undefined,
                        west: document.querySelector('.scout-sense-west') ? +document.querySelector('.scout-sense-west').querySelector('text')?.innerHTML : undefined
                    },
                    scoutZoneLvl: scout_zone_level
                };

                if (data.map.cell) {
                    data.map.cell.scoutNextCells = content.scoutNextCells;
                    data.map.cell.scoutZoneLvl = content.scoutZoneLvl;
                } else {
                    data.map.cell = content;
                }
            }
        }

        // Mise à jour du contenu des sacs
        if (mho_parameters.update_mho && mho_parameters.update_mho_bags) {

            data.bags = {};
            data.bags.contents = [];
            data.bags.toolsToUpdate = {
                isBigBrothHordes: false,
                isFataMorgana: false,
                isGestHordes: false,
                isMyHordesOptimizer: mho_parameters && mho_parameters.update_mho_bags
            };

            const rucksacks = [];
            const my_rusksack = Array.from(document.querySelector('.inventory.rucksack')?.querySelectorAll('li.item:not(.locked)') || []).map((rucksack_item) => {
                const item = getItemFromImg(rucksack_item.querySelector('img')?.src);
                if (item) {
                    return { id: item.id, isBroken: rucksack_item.classList.contains('broken') };
                }
            });

            rucksacks.push({
                userId: mh_user.id,
                objects: convertListOfSingleObjectsIntoListOfCountedObjects(my_rusksack),
            });

            if (pageIsDesert()) {
                const escorts = Array.from(document.querySelectorAll('.beyond-escort-on:not(.beyond-escort-on-all)') || []);
                escorts.forEach((escort) => {
                    const escort_id = +escort.querySelector('span.username')?.getAttribute('x-user-id');
                    const escort_rucksack = Array.from(escort.querySelector('.inventory.rucksack-escort')?.querySelectorAll('li.item:not(.locked):not(.plus)') || []).map((rucksack_item) => {
                        const item = getItemFromImg(rucksack_item.querySelector('img')?.src);
                        return { id: item?.id, isBroken: rucksack_item.classList.contains('broken') };
                    });

                    rucksacks.push({
                        userId: escort_id,
                        objects: convertListOfSingleObjectsIntoListOfCountedObjects(escort_rucksack),
                    });
                });
            }

            data.bags.contents = rucksacks;
        }


        // Mise à jour du contenu du coffre
        if (mho_parameters.update_mho && mho_parameters.update_mho_chest && pageIsHouse()) {

            data.chest = {};
            data.chest.contents = [];
            data.chest.toolsToUpdate = {
                isBigBrothHordes: false,
                isFataMorgana: false,
                isGestHordes: false,
                isMyHordesOptimizer: mho_parameters && mho_parameters.update_mho_chest
            };

            const chest_elements = Array.from(document.querySelector('.inventory.chest')?.querySelectorAll('li.item:not(.locked)') || []).map((chest_item) => {
                const item = getItemFromImg(chest_item.querySelector('img')?.src);
                return { id: item.id, isBroken: chest_item.classList.contains('broken') };
            });

            data.chest.contents = convertListOfSingleObjectsIntoListOfCountedObjects(chest_elements);
        }

        // Mise à jour des positions des âmes en tant que chaman
        // TODO récupérer l'info "isChaman" et n'envoyer ces informations que si on l'est
        if (mho_parameters.update_mho && mho_parameters.update_mho_souls && pageIsDoors()) {
            const soul_areas = Array.from(document.querySelectorAll('.soul-area') ?? []).map((soul_area) => {
                return {
                    x: soul_area.parentElement?.style?.gridRowStart,
                    y: soul_area.parentElement?.style?.gridColumnStart
                };
            });
            data.souls = soul_areas;
            console.log('data.souls', data.souls);
            console.log('user', mh_user);
        }


        /** Récupération des pouvoirs héroïques */
        if (((mho_parameters.update_gh && mho_parameters.update_gh_ah) || (mho_parameters.update_mho && mho_parameters.update_mho_actions)) && (pageIsDesert() || pageIsHouse())) {

            const no_interaction = document.querySelector('.no-interaction');

            data.heroicActions = {};
            data.heroicActions.actions = [];
            data.heroicActions.toolsToUpdate = {
                isBigBrothHordes: false,
                isFataMorgana: false,
                isGestHordes: mho_parameters && mho_parameters.update_gh_ah,
                isMyHordesOptimizer: mho_parameters && mho_parameters.update_mho_actions
            };
            const heroics = Array.from(document.querySelector('.heroic_actions')?.querySelectorAll('.heroic_action:not(.help)') || []);
            if (heroics && heroics.length > 0) {
                for (const heroic of heroics) {
                    const action = {
                        locale: lang,
                        label: heroic.querySelector('.label')?.innerText,
                        value: heroic.classList.contains('already') ? 0 : 1
                    };
                    data.heroicActions.actions.push(action);
                }
            } else if (!no_interaction) {
                const action = {
                    locale: lang,
                    label: 'Empty',
                    value: pageIsDesert() ? 0 /* 'desert' */ : 1 /* 'town' */
                };
                data.heroicActions.actions.push(action);
            }

            const apag = document.querySelector('.pointer.rucksack [src*=item_photo]');
            if (apag) {
                const action = {
                    locale: lang,
                    label: apag.alt,
                    value: +apag.src.replace(/.*item_photo_(\d).*/, '$1') || 0
                };
                data.heroicActions.actions.push(action);
            }

            if (pageIsDesert()) {
                const pef = document.querySelector('ul.special_actions [src*=armag]');
                if (pef) {
                    const action = {
                        locale: lang,
                        label: 'PEF',
                        value: 1
                    };
                    data.heroicActions.actions.push(action);
                } else if (!no_interaction) {
                    const action = {
                        locale: lang,
                        label: 'PEF',
                        value: 0
                    };
                    data.heroicActions.actions.push(action);
                }
            }
        }

        /** Récupération des améliorations de maison */
        if (((mho_parameters.update_gh && mho_parameters.update_gh_amelios) || (mho_parameters.update_mho && mho_parameters.update_mho_house)) && pageIsAmelio()) {
            data.amelios = {};
            data.amelios.values = {};
            data.amelios.toolsToUpdate = {
                isBigBrothHordes: false,
                isFataMorgana: false,
                isGestHordes: mho_parameters && mho_parameters.update_gh_amelios,
                isMyHordesOptimizer: mho_parameters && mho_parameters.update_mho_house
            };
            const amelios = Array.from(document.querySelectorAll('.row-table .row:not(.header)') || []);
            if (amelios && amelios.length > 0) {
                amelios.forEach((amelio) => {
                    const amelio_img = amelio.querySelector('img');
                    const name = amelio_img.src.replace(/.*\/home\/(.*)\..*\..*/, '$1');
                    if (name !== 'fence') {
                        const amelio_value = amelio_img?.nextElementSibling.innerText.match(/\d+/);
                        data.amelios.values[name] = amelio_value ? +amelio_value[0] : 0;
                    } else {
                        data.amelios.values[name] = !amelio.querySelector('button[x-upgrade-id]') ? 1 : 0;
                    }
                });
            }
            const house_level = +document.querySelector('[x-tab-group="home-main"][x-tab-id="values"] .town-summary')?.querySelector('.row-detail img')?.alt || undefined;
            data.amelios.values.house = house_level;
        }

        /** Récupération des status */
        if ((mho_parameters.update_mho && mho_parameters.update_mho_status) || (mho_parameters.update_gh && mho_parameters.update_gh_status)) {
            data.status = {};
            data.status.values = [];
            data.status.toolsToUpdate = {
                isBigBrothHordes: false,
                isFataMorgana: false,
                isGestHordes: mho_parameters && mho_parameters.update_gh_status,
                isMyHordesOptimizer: mho_parameters && mho_parameters.update_mho_status
            };
            const statuses = Array.from(document.querySelectorAll('.rucksack_status_union li.status img') || []);
            if (statuses && statuses.length > 0) {
                statuses
                    .filter((status) => {
                        const status_name = status.src.replace(/.*\/status\/status_(.*)\..*\..*/, '$1');
                        return status.src.indexOf('/status') > -1 && status_name !== 'ghoul' && status_name !== 'unknown';
                    })
                    .forEach((status) => {
                        data.status.values.push(status.src.replace(/.*\/status\/status_(.*)\..*\..*/, '$1'));
                    });
            }
        }

        /** Récupération des fouilles réussies */
        if (pageIsDesert() && (mho_parameters.update_mho && mho_parameters.update_mho_digs)) {
            data.successedDig = {};
            data.successedDig.cell = {
                day: mh_user.townDetails?.day,
                x: +position[0],
                y: +position[1]
            };
            data.successedDig.values = [];
            data.successedDig.toolsToUpdate = {
                isBigBrothHordes: false,
                isFataMorgana: false,
                isGestHordes: false,
                isMyHordesOptimizer: mho_parameters && mho_parameters.update_mho_digs
            };

            const logs = Array.from(document.querySelectorAll('div.log-entry'));
            const arrivals_texts = {
                de: 'angekommen',
                en: 'has arrived from the',
                es: 'ha llegado desde el',
                fr: 'est arrivé depuis'
            };

            const arrivals = logs.filter((log) => normalizeString(log.innerText).indexOf(normalizeString(getI18N(arrivals_texts))) > -1).map((log) => {
                return {
                    time: log.querySelector('.log-part-time')?.innerText,
                    citizen: log.querySelector('.log-part-content .container span')?.innerText
                };
            });

            const now = document.querySelector('.game-clock .town-time')?.innerText;
            if (now) {
                citizen_list
                    .filter((citizen) => { // On ne garde que les citoyens actuellement en train de fouiller
                        let is_digging = false;
                        if (citizen.id === mh_user.id) { // Il s'agit de l'utilisateur qui a cliqué sur le bouton
                            is_digging = document.querySelector('#mgd-digging-note [x-countdown-to]') ? true : false;
                        } else { // Les autres
                            is_digging = citizen.row.parentElement.parentElement.parentElement.querySelector('li.status img[src*=small_gather]') ? true : false;
                        }
                        return is_digging;
                    })
                    .forEach((citizen) => {

                        const failed_texts = {
                            de: 'durch Graben nichts gefunden...',
                            en: 'found nothing during their last search...',
                            es: 'no encontró nada...',
                            fr: 'rien trouvé...'
                        };
                        const failed_digs = Array.from(logs.filter((log) => normalizeString(log.innerText).indexOf(normalizeString(getI18N(failed_texts))) > -1) || []).filter((log) => log.innerText.indexOf(citizen.userName) > -1) || [];
                        const nb_failed_digs = failed_digs.length;

                        const nb_minutes_for_dig = citizen.job === 'dig' ? 90 : 120; // Une fouille = 2h = 120 minutes pour un tous les métiers, ou 1h30 = 90 minutes pour une pelle

                        const citizen_arrivals = arrivals.filter((arrival) => arrival.citizen === citizen.userName); // Les heures d'arrivées du citoyen sur la case

                        const citizen_last_arrival = citizen_arrivals[0]?.time;
                        let start_date;

                        if (citizen_last_arrival) { // Si le citoyen a une heure d'arrivée alors on se base sur cette heure comme heure de début de fouilles
                            start_date = citizen_last_arrival;
                        } else { // Sinon, on se base sur le cooldown
                            start_date = nb_failed_digs === 0 ? null : failed_digs[failed_digs.length - 1].querySelector('.log-part-time').innerText;
                        }

                        let nb_digs;
                        if (start_date) {
                            const now_minutes = (+now.split(':')[0] * 60) + (+now.split(':')[1]);
                            const start_date_minutes = (+start_date.split(':')[0] * 60) + (+start_date.split(':')[1]);

                            const nb_minutes_digging = now_minutes - start_date_minutes; // Le nombre total de minutes passées à fouiller
                            nb_digs = Math.floor(nb_minutes_digging / nb_minutes_for_dig) + 1;

                        } else {
                            nb_digs = 1;
                        }
                        data.successedDig.values.push({
                            citizenId: citizen.id,
                            successDigs: nb_digs - nb_failed_digs,
                            totalDigs: nb_digs
                        });
                    });
            }
        }

        /** Récupération des actions quotidiennes */
        // TODO changer update_mho_status en update_mho_daily_actions quand on les aura toutes mises
        if ((mho_parameters.update_mho && mho_parameters.update_mho_status) && pageIsHouse()) {

            /** Bain */
            let bath_taken;
            const bath_row = document.querySelector('.heroic_action img[src*=pool]')?.parentElement;
            if (bath_row) {
                if ((bath_row.attributes as any).disabled) {
                    // si barré = le chantier est construit et le bain a été pris
                    bath_taken = true;
                } else {
                    bath_taken = false;
                    // si pas barré = le chantier est construit et le bain n'a pas été pris
                }
            }
            await saveBath(bath_taken);

            /** Espace naturel des ermites */

            /** Cuisine */

            /** Labo */

            /** Tour des gardiens */

            /** Coin sieste */

            /** Galerie des fouineurs */

            /** Repaire des éclaireurs */
        }

        /** Envoi des informations */
        console.log('MHO - Envoyé pour enregistrement :', data);

        fetcher(api_url + '/externaltools/update?userKey=' + external_app_id + '&userId=' + mh_user.id, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    return convertResponsePromiseToError(response);
                }
            })
            .then((response) => {
                getWishlist();
                getMap();
                resolve(response);
            })
            .catch((error) => {
                reject();
                addError(error);
            });
    });
}

/** Récupère les traductions de la chaine de caractères */
