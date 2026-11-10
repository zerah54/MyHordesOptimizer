import { hordes_img_url, lang, mho_sent_digs_key, mho_token_key } from '../config/constants';
import { state } from '../state';
import type { ApiToken } from '../types';
import { reportHomeDailyActions } from '../utils/daily-action-detection';
import type { ScavNextCells, ScoutNextCells } from '../utils/desert-radars';
import { getScavNextCells, getScoutNextCells } from '../utils/desert-radars';
import { detectEquippedShoes } from '../utils/equipped-shoes';
import { fetcher } from '../utils/fetch';
import { countInventoryObjects, resolveInventoryObjects } from '../utils/item-lookup';
import { fixMhCompiledImg } from '../utils/misc';
import { addError } from '../utils/notifications';
import { getCurrentTownDay, pageIsAmelio, pageIsDesert, pageIsDoors, pageIsHouse } from '../utils/page';
import { getCurrentPosition } from '../utils/position';
import { getStorageItem, setStorageItem } from '../utils/storage';
import type { DigEstimate, SentDigsMemory, SuccessfulDigValue } from '../utils/successful-digs';
import { isSentDigsMemory, mergeWithSentDigs } from '../utils/successful-digs';
import type { PageUser } from '../utils/successful-digs-page';
import { collectSuccessfulDigs } from '../utils/successful-digs-page';
import { convertResponsePromiseToError } from '../utils/version';
import type { ZenHordesCell, ZenHordesScope } from '../utils/zen-hordes-cell';
import { collectZenHordesCell, resolveZenHordesScope } from '../utils/zen-hordes-cell';
import { fetchTownCitizenRefs } from './citizens';
import { saveDailyAction } from './daily-actions';
import { getMap } from './map';
import { saveShoesEquipped } from './shoes';
import { getWishlist } from './wishlist';

export interface ExternalToolUpdateError {
    unit: string;
    message: string;
}

export interface ExternalToolUpdateState {
    tool: string;
    status: 'pending' | 'success' | 'error';
    errors: ExternalToolUpdateError[];
}

export interface ExternalToolsUpdateJobState {
    jobId: string;
    isRunning: boolean;
    tools: ExternalToolUpdateState[];
    renewedToken?: ApiToken;
}

/**
 * Range le token renouvelé par le job dans l'état partagé et le persiste, comme le fait
 * déjà `requestToken` (`api/token.ts`). Le job peut détecter une dérive de ville à tout
 * moment de son exécution, pas seulement à la fin : appelée à la fois sur la réponse
 * initiale et sur chaque état reçu par le polling.
 */
function applyRenewedTokenIfPresent(job_state: ExternalToolsUpdateJobState): void {
    if (!job_state.renewedToken?.simpleMe) {
        return;
    }
    state.token = job_state.renewedToken;
    state.mh_user = job_state.renewedToken.simpleMe;
    /** `mh_user` (donnée de jeu) n'est plus persisté, contrairement au token (credential) — cf. bootstrap.ts */
    setStorageItem(mho_token_key, state.token);
}

/**
 * Vrai si un relevé de métier a été lu : une case envoyée sans aucun marqueur mettrait quand même à jour,
 * chez Gest'Hordes, la date de passage de la case et la position du joueur.
 */
function hasJobMarker(next_cells: ScavNextCells | ScoutNextCells, zone_level: number | undefined): boolean {
    return zone_level !== undefined
        || Object.values(next_cells).some((value: boolean | number | undefined): boolean => value !== undefined);
}

/** Ajoute des relevés à la case réservée à Gest'Hordes, créée à la première donnée. */
function addToGestHordesCell(data: any, position: readonly (string | number)[], fields: Record<string, unknown>): void {
    data.map.gestHordesCell = { ...(data.map.gestHordesCell ?? { x: +position[0], y: +position[1] }), ...fields };
}

/** Identifiant rendu par le serveur quand aucun lancement n'est connu pour ce joueur */
const empty_job_id: string = '00000000-0000-0000-0000-000000000000';
/** Intervalle d'interrogation de l'avancement */
const polling_interval_ms: number = 800;
/** Au-delà, on cesse de suivre ; le traitement, lui, continue côté serveur */
const polling_timeout_ms: number = 120000;

export function updateExternalTools(on_progress?: (state: ExternalToolsUpdateJobState) => void): Promise<ExternalToolsUpdateJobState> {
    const { mh_user, mho_parameters, api_url, external_app_id } = state as any;
    return new Promise<ExternalToolsUpdateJobState>(async (resolve, reject) => {

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
            isMyHordesOptimizer: mho_parameters && mho_parameters.update_mho ? 'api' : 'none',
            isZenHordes: 'none'
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

        // Gest'Hordes a sa propre case, remplie selon ses seules options : la case partagée part chez tous les outils qui la lisent.
        // Mise à jour en ville chaos. Le relevé lit la page du désert (note « zone épuisée », zombies,
        // sol) : hors de cette page, il enverrait une case vide et « non épuisée ».
        const devastated_for_gh: boolean = !!(mh_user.townDetails?.isChaos && mho_parameters.update_gh && mho_parameters.update_gh_devastated);
        const devastated_in_cell: boolean = !!((mho_parameters.update_mho && mho_parameters.update_mho_devastated)
            || (mho_parameters.update_fata && mho_parameters.update_fata_devastated));
        if (pageIsDesert() && (devastated_for_gh || devastated_in_cell)) {

            if (mho_parameters.update_mho && mho_parameters.update_mho_devastated && mh_user.townDetails?.isChaos) {
                data.map.toolsToUpdate.isMyHordesOptimizer = 'cell';
            }
            if (mho_parameters.update_fata && mho_parameters.update_fata_devastated) {
                data.map.toolsToUpdate.isFataMorgana = 'cell';
            }

            const objects = resolveInventoryObjects(Array.from(document.querySelector('.inventory.desert')?.querySelectorAll('li.item') || []));

            const content = {
                x: +position[0],
                y: +position[1],
                zombies: +document.querySelectorAll('.actor.zombie').length,
                zoneEmpty: !!document.querySelector('#mgd-zone-note'),
                objects: countInventoryObjects(objects),
                citizenId: citizen_list.map((citizen) => citizen.id)
            };
            if (devastated_in_cell) {
                if (data.map.cell) {
                    data.map.cell.zombies = content.zombies;
                    data.map.cell.zoneEmpty = content.zoneEmpty;
                    data.map.cell.objects = content.objects || [];
                    data.map.cell.citizenId = content.citizenId;
                } else {
                    data.map.cell = content;
                }
            }
            if (devastated_for_gh) {
                addToGestHordesCell(data, position, { zombies: content.zombies, zoneEmpty: content.zoneEmpty, objects: content.objects });
            }
        }

        // Mise à jour du nombre de zombies tués
        const killed_zombies_for_gh: boolean = !!(mho_parameters.update_gh && mho_parameters.update_gh_killed_zombies);
        const killed_zombies_in_cell: boolean = !!((mho_parameters.update_mho && mho_parameters.update_mho_killed_zombies)
            || (mho_parameters.update_fata && mho_parameters.update_fata_killed_zombies));
        if ((killed_zombies_for_gh || killed_zombies_in_cell) && pageIsDesert() && nb_dead_zombies > 0) {

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

            if (killed_zombies_in_cell) {
                if (data.map.cell) {
                    data.map.cell.deadZombies = nb_dead_zombies;
                } else {
                    data.map.cell = content;
                }
            }
            if (killed_zombies_for_gh) {
                addToGestHordesCell(data, position, { deadZombies: nb_dead_zombies });
            }
        }

        // Mise à jour des marqueurs issus des métiers
        const job_markers_in_cell: boolean = !!((mho_parameters.update_mho && mho_parameters.update_mho_job_markers)
            || (mho_parameters.update_fata && mho_parameters.update_fata_job_markers));
        const job_markers_for_gh: boolean = !!(mho_parameters.update_gh && mho_parameters.update_gh_job_markers);
        if ((job_markers_in_cell || job_markers_for_gh)
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
                    scavNextCells: getScavNextCells(),
                    scavZoneLevel: scav_zone_level,
                    citizenId: citizen_list.map((citizen) => citizen.id),
                };

                if (job_markers_in_cell) {
                    if (data.map.cell) {
                        data.map.cell.scavNextCells = content.scavNextCells;
                        data.map.cell.scavZoneLevel = content.scavZoneLevel;
                    } else {
                        data.map.cell = content;
                    }
                }
                if (job_markers_for_gh && hasJobMarker(content.scavNextCells, content.scavZoneLevel)) {
                    addToGestHordesCell(data, position, { scavNextCells: content.scavNextCells, scavZoneLevel: content.scavZoneLevel });
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
                    scoutNextCells: getScoutNextCells(),
                    scoutZoneLvl: scout_zone_level
                };

                if (job_markers_in_cell) {
                    if (data.map.cell) {
                        data.map.cell.scoutNextCells = content.scoutNextCells;
                        data.map.cell.scoutZoneLvl = content.scoutZoneLvl;
                    } else {
                        data.map.cell = content;
                    }
                }
                if (job_markers_for_gh && hasJobMarker(content.scoutNextCells, content.scoutZoneLvl)) {
                    addToGestHordesCell(data, position, { scoutNextCells: content.scoutNextCells, scoutZoneLvl: content.scoutZoneLvl });
                }
            }
        }

        // Zen Hordes : la case est relevée à part, jamais dans `data.map.cell` que Fata, GH et MHO lisent quel que soit leur mode
        const zen_scope: ZenHordesScope = pageIsDesert()
            ? resolveZenHordesScope(mho_parameters, mh_user.townDetails?.isChaos, mh_user.jobDetails?.uid)
            : { zone: false, radars: false };
        if (zen_scope.zone || zen_scope.radars) {
            const zen_cell: ZenHordesCell | undefined = collectZenHordesCell(position, zen_scope, mh_user.jobDetails?.uid);
            if (zen_cell) {
                data.map.toolsToUpdate.isZenHordes = 'cell';
                data.map.zenHordesCell = zen_cell;
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
            const my_rusksack = resolveInventoryObjects(Array.from(document.querySelector('.inventory.rucksack')?.querySelectorAll('li.item:not(.locked)') || []));

            rucksacks.push({
                userId: mh_user.id,
                objects: countInventoryObjects(my_rusksack),
            });

            if (pageIsDesert()) {
                const escorts = Array.from(document.querySelectorAll('.beyond-escort-on:not(.beyond-escort-on-all)') || []);
                escorts.forEach((escort) => {
                    const escort_id = +escort.querySelector('span.username')?.getAttribute('x-user-id');
                    const escort_rucksack = resolveInventoryObjects(Array.from(escort.querySelector('.inventory.rucksack-escort')?.querySelectorAll('li.item:not(.locked):not(.plus)') || []));

                    rucksacks.push({
                        userId: escort_id,
                        objects: countInventoryObjects(escort_rucksack),
                    });
                });
            }

            data.bags.contents = rucksacks;

            // Envoi à part, sans attente : un échec (déjà notifié) ne doit pas retarder ni empêcher la mise à jour
            saveShoesEquipped(detectEquippedShoes(document.querySelector('.inventory.rucksack')))?.catch((): void => undefined);
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

            // `.banished_hidden` : stash secret (compétence héroïque Endurant, ChestHiddenStashLimit
            // côté jeu), visible du propriétaire mais pas des autres citoyens — ne doit pas être relevé.
            const chest_elements = resolveInventoryObjects(Array.from(document.querySelector('.inventory.chest')?.querySelectorAll('li.item:not(.locked):not(.banished_hidden)') || []));

            data.chest.contents = countInventoryObjects(chest_elements);
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

        /** Récupération des fouilles réussies (règles du jeu et hypothèse : utils/successful-digs.ts) */
        if (pageIsDesert() && (mho_parameters.update_mho && mho_parameters.update_mho_digs) && !document.querySelector('.during-attack')) {
            // Jour lu sur l'horloge de la page : celui du jeton reste celui de la veille après l'attaque, tant qu'on ne s'est pas reconnecté
            const dig_day: number | undefined = getCurrentTownDay() ?? mh_user.townDetails?.day;
            if (dig_day !== undefined) {
                const dig_x: number = +position[0];
                const dig_y: number = +position[1];
                data.successedDig = {
                    cell: { day: dig_day, x: dig_x, y: dig_y },
                    values: [],
                    toolsToUpdate: {
                        isBigBrothHordes: false,
                        isFataMorgana: false,
                        isGestHordes: false,
                        isMyHordesOptimizer: mho_parameters && mho_parameters.update_mho_digs
                    }
                };

                const page_user: PageUser = { id: mh_user.id, name: mh_user.userName ?? '', job: mh_user.jobDetails?.uid ?? '' };
                const estimates: DigEstimate[] = await collectSuccessfulDigs(page_user, dig_day, Date.now(), fetchTownCitizenRefs) ?? [];
                if (estimates.length > 0) {
                    const stored_memory: unknown = await getStorageItem(mho_sent_digs_key);
                    const merged: { values: SuccessfulDigValue[]; memory: SentDigsMemory } = mergeWithSentDigs(
                        estimates, isSentDigsMemory(stored_memory) ? stored_memory : undefined, +(mh_user.townDetails?.townId ?? 0), dig_day, dig_x, dig_y);
                    data.successedDig.values = merged.values;
                    await setStorageItem(mho_sent_digs_key, merged.memory);
                }
            }
        }

        /** Récupération des actions quotidiennes */
        if ((mho_parameters.update_mho && mho_parameters.update_mho_daily_actions) && pageIsHouse()) {

            await reportHomeDailyActions(saveDailyAction, mh_user.jobDetails?.uid);
        }

        /** Envoi des informations */
        console.log('MHO - Envoyé pour enregistrement :', data);

        fetcher(api_url + '/externaltools/update/start?userKey=' + external_app_id + '&userId=' + mh_user.id, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then((response: Response) => {
                if (response.status === 200 || response.status === 202) {
                    return response.json();
                }
                return convertResponsePromiseToError(response);
            })
            .then((initial_state: ExternalToolsUpdateJobState) => {
                applyRenewedTokenIfPresent(initial_state);
                if (on_progress) {
                    on_progress(initial_state);
                }
                return followUpdateJob(initial_state, on_progress);
            })
            .then((final_state: ExternalToolsUpdateJobState) => resolve(final_state))
            .catch((error) => {
                reject(error);
                addError(error);
            });
    });
}

/**
 * Interroge l'avancement jusqu'à la fin du lancement suivi. Les rafraîchissements de la liste de
 * courses et de la carte sont déclenchés dès que MyHordes Optimizer est à jour : les rattacher à
 * la fin du traitement les supprimerait quand le garde-fou de deux minutes arrête le suivi, et un
 * Gest'Hordes lent n'a aucune raison de les retarder.
 */
async function followUpdateJob(initial_state: ExternalToolsUpdateJobState, on_progress?: (state: ExternalToolsUpdateJobState) => void): Promise<ExternalToolsUpdateJobState> {
    const started_at: number = Date.now();
    let current_state: ExternalToolsUpdateJobState = initial_state;
    let mho_refreshed: boolean = false;

    const refreshMhoDataOnce = (): void => {
        if (mho_refreshed) {
            return;
        }
        mho_refreshed = true;
        getWishlist();
        getMap();
    };

    const isMhoDone = (job_state: ExternalToolsUpdateJobState): boolean => {
        return job_state.tools.some((tool: ExternalToolUpdateState) => tool.tool === 'myHordesOptimizer' && tool.status === 'success');
    };

    if (isMhoDone(current_state)) {
        refreshMhoDataOnce();
    }

    while (current_state.isRunning && Date.now() - started_at < polling_timeout_ms) {
        await new Promise<void>((wait: () => void) => setTimeout(wait, polling_interval_ms));

        let next_state: ExternalToolsUpdateJobState;
        try {
            const response: Response = await fetcher(state.api_url + '/externaltools/update/status?userKey=' + state.external_app_id + '&userId=' + state.mh_user.id + '&jobId=' + current_state.jobId);
            if (response.status !== 200) {
                continue;
            }
            next_state = await response.json();
        } catch {
            // Interrogation en échec (coupure, redémarrage de l'API) : le traitement continue
            // côté serveur, la suivante reprendra le suivi.
            continue;
        }

        // Un état sans lancement connu, ou portant un autre identifiant, n'est pas le nôtre :
        // le prendre pour argent comptant se lirait comme une fin de traitement réussie.
        if (next_state.jobId === empty_job_id || next_state.jobId !== current_state.jobId) {
            continue;
        }

        current_state = next_state;
        applyRenewedTokenIfPresent(current_state);
        if (on_progress) {
            on_progress(current_state);
        }
        if (isMhoDone(current_state)) {
            refreshMhoDataOnce();
        }
    }

    refreshMhoDataOnce();
    return current_state;
}

/** Récupère les traductions de la chaine de caractères */
