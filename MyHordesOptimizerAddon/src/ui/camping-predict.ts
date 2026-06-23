import {calculateCamping} from '../api/camping';
import {getRuins} from '../api/ruins';
import {mh_optimizer_icon, mho_camping_predict_id, repo_img_hordes_url} from '../config/constants';
import {added_ruins} from '../data/informations';
import {jobs, texts} from '../i18n/texts';
import {state} from '../state';
import {getI18N} from '../utils/i18n';
import {pageIsDesert} from '../utils/page';
import {getScriptInfo} from '../utils/version';

export function displayCampingPredict() {
    setTimeout(() => {
        let camping_predict_container = document.getElementById(mho_camping_predict_id);

        let zone_camp = document.querySelector('.zone-camp');
        if (state.mho_parameters.display_camping_predict && pageIsDesert() && zone_camp) {
            if (camping_predict_container) return;

            getRuins().then((ruins) => {
                let all_ruins = [...added_ruins];
                all_ruins = all_ruins.concat(ruins);

                let zone_camp_info = zone_camp.querySelector('.zone-camp-info');
                let zone_camp_label = zone_camp.querySelector('label');
                zone_camp_label.addEventListener('click', () => {
                    camping_predict_container.style.display = camping_predict_container.style.display === 'none' ? 'block' : 'none';
                    if (camping_predict_container.style.display !== 'none') {
                        calculateCamping(conf);
                    }
                });

                camping_predict_container = document.createElement('div');
                camping_predict_container.id = mho_camping_predict_id;
                camping_predict_container.style.border = '1px solid';
                camping_predict_container.style.padding = '0.5em';
                camping_predict_container.style.margin = '0.5em 0';

                camping_predict_container.style.display = window.getComputedStyle(zone_camp_info).getPropertyValue('max-height') === '0px' ? 'none' : 'block';
                zone_camp.appendChild(camping_predict_container);

                let updater_title = document.createElement('h5');
                updater_title.style.marginTop = '0.5em';
                let updater_title_mho_img = document.createElement('img');
                updater_title_mho_img.src = mh_optimizer_icon;
                updater_title_mho_img.style.height = '24px';
                updater_title_mho_img.style.marginRight = '0.5em';
                updater_title.appendChild(updater_title_mho_img);

                let updater_title_text = document.createElement('text');
                updater_title_text.innerText = getScriptInfo().name;
                updater_title_text.style.fontSize = '1.5em';
                updater_title.appendChild(updater_title_text);

                camping_predict_container.appendChild(updater_title);

                let zone_ruin = document.querySelector('.ruin-info b');
                let ruin = '-1000';
                if (zone_ruin) {
                    ruin = all_ruins.find((one_ruin) => getI18N(one_ruin.label).toLowerCase() === zone_ruin.innerText.toLowerCase()).id;
                }
                let conf: any = {
                    townType: state.mh_user.townDetails?.townType.toUpperCase(),
                    job: jobs.find((job) => state.mh_user.jobDetails.uid === job.img)?.id,
                    distance: document.querySelector('.zone-dist > div > b')?.innerText.replace('km', ''), // OK
                    campings: 0,
                    proCamper: false,
                    hiddenCampers: 0,
                    objects: 0,
                    vest: false,
                    tomb: false,
                    zombies: document.querySelectorAll('.actor.zombie')?.length || 0,
                    night: !!document.querySelector('.map.night'),
                    devastated: state.mh_user.townDetails?.isDevaste,
                    phare: false,
                    improve: 0,
                    objectImprove: 0,
                    ruinBonus: 0,
                    ruinBuryCount: 0,
                    ruinCapacity: 0,
                    ruin: '-1000'
                }

                let my_info = document.createElement('div');
                camping_predict_container.appendChild(my_info);

                let my_info_title = document.createElement('h3');
                my_info_title.innerText = getI18N(texts.camping_citizen);
                my_info.appendChild(my_info_title);

                let my_info_content = document.createElement('div');
                my_info.appendChild(my_info_content);

                let town_info = document.createElement('div');
                camping_predict_container.appendChild(town_info);

                let town_info_title = document.createElement('h3');
                town_info_title.innerText = getI18N(texts.camping_town);
                town_info.appendChild(town_info_title);

                let town_info_content = document.createElement('div');
                town_info.appendChild(town_info_content);

                let cell_info = document.createElement('div');
                camping_predict_container.appendChild(cell_info);

                let cell_info_title = document.createElement('h3');
                cell_info_title.innerText = getI18N(texts.camping_ruin);
                cell_info.appendChild(cell_info_title);

                let cell_info_content = document.createElement('div');
                cell_info.appendChild(cell_info_content);

                let result = document.createElement('div');
                camping_predict_container.appendChild(result);

                let result_title = document.createElement('h3');
                result_title.innerText = getI18N(texts.result);
                result.appendChild(result_title);

                let result_content = document.createElement('div');
                result_content.id = 'camping-result';
                result.appendChild(result_content);

                /** Capuche ? */
                let vest_div = document.createElement('div');
                vest_div.id = 'vest-field';
                vest_div.style.display = 'none';
                my_info_content.appendChild(vest_div);

                let vest_label = document.createElement('label');
                vest_label.htmlFor = 'vest';
                vest_label.innerHTML = `<img src="${repo_img_hordes_url}emotes/proscout.gif"> ${getI18N(texts.vest)}`;
                let vest = document.createElement('input');
                vest.type = 'checkbox';
                vest.id = 'vest';
                vest.checked = conf.vest;
                vest.classList.add('mho-input');
                vest.addEventListener('change', ($event) => {
                    conf.vest = $event.srcElement.checked;
                    calculateCamping(conf);
                })
                vest_div.appendChild(vest);
                vest_div.appendChild(vest_label);

                /** Campeur pro ? */
                let pro_camper_div = document.createElement('div');
                my_info_content.appendChild(pro_camper_div);

                let pro_camper_label = document.createElement('label');
                pro_camper_label.htmlFor = 'pro';
                pro_camper_label.innerHTML = `<img src="${repo_img_hordes_url}status/status_camper.gif"> ${getI18N(texts.pro_camper)}`;
                let pro_camper = document.createElement('input');
                pro_camper.type = 'checkbox';
                pro_camper.id = 'pro';
                pro_camper.checked = conf.pro;
                pro_camper.classList.add('mho-input');
                pro_camper.addEventListener('change', ($event) => {
                    conf.proCamper = $event.srcElement.checked;
                    calculateCamping(conf);
                })
                pro_camper_div.appendChild(pro_camper);
                pro_camper_div.appendChild(pro_camper_label);

                /** Tombe ? */
                let tomb_div = document.createElement('div');
                my_info_content.appendChild(tomb_div);

                let tomb_label = document.createElement('label');
                tomb_label.htmlFor = 'tomb';
                tomb_label.innerHTML = `<img src="${repo_img_hordes_url}building/small_cemetery.gif"> ${getI18N(texts.tomb)}`;
                let tomb = document.createElement('input');
                tomb.type = 'checkbox';
                tomb.id = 'tomb';
                tomb.checked = conf.tomb;
                tomb.classList.add('mho-input');
                tomb.addEventListener('change', ($event) => {
                    conf.tomb = $event.srcElement.checked;
                    calculateCamping(conf);
                })
                tomb_div.appendChild(tomb);
                tomb_div.appendChild(tomb_label);

                /** Nombre de nuits déjà campées */
                let nb_campings_div = document.createElement('div');
                my_info_content.appendChild(nb_campings_div);

                let nb_campings_label = document.createElement('label');
                nb_campings_label.htmlFor = 'nb-campings';
                nb_campings_label.innerHTML = `<img src="${repo_img_hordes_url}emotes/sleep.gif"> ${getI18N(texts.nb_campings)}`;
                nb_campings_label.classList.add('spaced-label');
                let nb_campings = document.createElement('input');
                nb_campings.type = 'number';
                nb_campings.id = 'nb-campings';
                nb_campings.value = (conf.campings) as any;
                nb_campings.classList.add('mho-input', 'inline');
                nb_campings.addEventListener('change', ($event) => {
                    conf.campings = +$event.srcElement.value;
                    calculateCamping(conf);
                })
                nb_campings_div.appendChild(nb_campings_label);
                nb_campings_div.appendChild(nb_campings);

                /** Nombre de toiles de tente ou pelure de peau */
                let objects_in_bag_div = document.createElement('div');
                my_info_content.appendChild(objects_in_bag_div);

                let objects_in_bag_label = document.createElement('label');
                objects_in_bag_label.htmlFor = 'nb-objects';
                objects_in_bag_label.innerText = getI18N(texts.objects_in_bag);
                objects_in_bag_label.innerHTML = `<img src="${repo_img_hordes_url}emotes/bag.gif"> ${getI18N(texts.objects_in_bag)}`;
                objects_in_bag_label.classList.add('spaced-label');
                let objects_in_bag = document.createElement('input');
                objects_in_bag.type = 'number';
                objects_in_bag.id = 'nb-objects';
                objects_in_bag.value = (conf.objects) as any;
                objects_in_bag.classList.add('mho-input', 'inline');
                objects_in_bag.addEventListener('change', ($event) => {
                    conf.objects = +$event.srcElement.value;
                    calculateCamping(conf);
                })
                objects_in_bag_div.appendChild(objects_in_bag_label);
                objects_in_bag_div.appendChild(objects_in_bag);


                /** Type de bâtiment */
                let ruin_type_div = document.createElement('div');
                cell_info_content.appendChild(ruin_type_div);

                let select_ruin_label = document.createElement('label');
                select_ruin_label.htmlFor = 'select-ruin';
                select_ruin_label.innerText = getI18N(texts.ruin);
                select_ruin_label.classList.add('spaced-label');
                let select_ruin = document.createElement('select');
                select_ruin.id = 'select-ruin';
                select_ruin.value = conf.ruin;
                select_ruin.classList.add('small');
                all_ruins.forEach((ruin) => {
                    let ruin_option = document.createElement('option');
                    ruin_option.value = ruin.id;
                    ruin_option.label = getI18N(ruin.label);
                    if (ruin.id === conf.ruin) {
                        ruin_option.setAttribute('selected', 'selected');
                    }
                    select_ruin.appendChild(ruin_option);
                });
                select_ruin.addEventListener('change', ($event) => {
                    conf.ruin = $event.srcElement.value;
                    let current_ruin: any = all_ruins.find((_current_ruin) => +_current_ruin.id === +conf.ruin);

                    conf.ruinBonus = current_ruin.camping;
                    conf.ruinCapacity = current_ruin.capacity;

                    let digs_field = document.querySelector('#digs-field');
                    if (+current_ruin.id === -1) {
                        digs_field.style.display = 'block';
                    } else {
                        digs_field.style.display = 'none';
                        digs_field.querySelector('input').value = (0) as any;
                    }

                    calculateCamping(conf);
                })
                ruin_type_div.appendChild(select_ruin_label);
                ruin_type_div.appendChild(select_ruin);

                /** Nombre de tas sur le bat ? */
                let digs_div = document.createElement('div');
                digs_div.id = 'digs-field'
                digs_div.style.display = 'none'
                cell_info_content.appendChild(digs_div);

                let digs_label = document.createElement('label');
                digs_label.htmlFor = 'digs';
                digs_label.innerText = getI18N(texts.digs);
                digs_label.innerHTML = `<img src="${repo_img_hordes_url}icons/uncover.gif"> ${getI18N(texts.digs)}`;
                digs_label.classList.add('spaced-label');
                let digs = document.createElement('input');
                digs.type = 'number';
                digs.id = 'digs';
                digs.value = (conf.ruinBuryCount) as any;
                digs.classList.add('mho-input', 'inline');
                digs.addEventListener('change', ($event) => {
                    conf.ruinBuryCount = +$event.srcElement.value;
                    calculateCamping(conf);
                })
                digs_div.appendChild(digs_label);
                digs_div.appendChild(digs);

                /** Nombre de zombies sur la case */
                let zombies_div = document.createElement('div');
                cell_info_content.appendChild(zombies_div);

                let zombies_label = document.createElement('label');
                zombies_label.htmlFor = 'nb-zombies';
                zombies_label.innerHTML = `<img src="${repo_img_hordes_url}emotes/zombie.gif"> ${getI18N(texts.zombies_on_cell)}`;
                zombies_label.classList.add('spaced-label');
                let zombies = document.createElement('input');
                zombies.type = 'number';
                zombies.id = 'nb-zombies';
                zombies.value = (conf.zombies) as any;
                zombies.classList.add('mho-input', 'inline');
                zombies.addEventListener('change', ($event) => {
                    conf.zombies = +$event.srcElement.value;
                    calculateCamping(conf);
                })
                zombies_div.appendChild(zombies_label);
                zombies_div.appendChild(zombies);

                /** Nombre d'améliorations simples sur la case */
                let improve_div = document.createElement('div');
                cell_info_content.appendChild(improve_div);

                let improve_label = document.createElement('label');
                improve_label.htmlFor = 'nb-improve';
                improve_label.innerHTML = `<img src="${repo_img_hordes_url}icons/home_recycled.gif"> ${getI18N(texts.improve)}`;
                improve_label.classList.add('spaced-label');
                let improve = document.createElement('input');
                improve.type = 'number';
                improve.id = 'nb-improve';
                improve.value = (conf.improve) as any;
                improve.classList.add('mho-input', 'inline');
                improve.addEventListener('change', ($event) => {
                    conf.improve = +$event.srcElement.value;
                    calculateCamping(conf);
                })
                improve_div.appendChild(improve_label);
                improve_div.appendChild(improve);

                /** Nombre d'objets de campement installés sur la case */
                let object_improve_div = document.createElement('div');
                cell_info_content.appendChild(object_improve_div);

                let object_improve_label = document.createElement('label');
                object_improve_label.htmlFor = 'nb-object-improve';
                object_improve_label.innerHTML = `<img src="${repo_img_hordes_url}icons/home.gif"> ${getI18N(texts.object_improve)}`;
                object_improve_label.classList.add('spaced-label');
                let object_improve = document.createElement('input');
                object_improve.type = 'number';
                object_improve.id = 'nb-object-improve';
                object_improve.value = (conf.objectImprove) as any;
                object_improve.classList.add('mho-input', 'inline');
                object_improve.addEventListener('change', ($event) => {
                    conf.objectImprove = +$event.srcElement.value;
                    calculateCamping(conf);
                })
                object_improve_div.appendChild(object_improve_label);
                object_improve_div.appendChild(object_improve);

                /** Nombre de personnes déjà cachées */
                let hidden_campers_div = document.createElement('div');
                cell_info_content.appendChild(hidden_campers_div);

                let hidden_campers_label = document.createElement('label');
                hidden_campers_label.htmlFor = 'hidden-campers';
                hidden_campers_label.innerHTML = `<img src="${repo_img_hordes_url}emotes/human.gif"> ${getI18N(texts.hidden_campers)}`;
                hidden_campers_label.classList.add('spaced-label');
                let hidden_campers = document.createElement('input');
                hidden_campers.type = 'number';
                hidden_campers.id = 'hidden-campers';
                hidden_campers.value = (conf.hiddenCampers) as any;
                hidden_campers.classList.add('mho-input', 'inline');
                hidden_campers.addEventListener('change', ($event) => {
                    conf.hiddenCampers = +$event.srcElement.value;
                    calculateCamping(conf);
                })
                hidden_campers_div.appendChild(hidden_campers_label);
                hidden_campers_div.appendChild(hidden_campers);

                /** Nuit ? */
                let night_div = document.createElement('div');
                town_info_content.appendChild(night_div);

                let night_label = document.createElement('label');
                night_label.htmlFor = 'night';
                night_label.innerHTML = `<img src="${repo_img_hordes_url}pictos/r_doutsd.gif"> ${getI18N(texts.night)}`;
                let night = document.createElement('input');
                night.type = 'checkbox';
                night.id = 'night';
                night.checked = conf.night;
                night.classList.add('mho-input');
                night.addEventListener('change', ($event) => {
                    conf.night = $event.srcElement.checked;
                    calculateCamping(conf);
                })
                night_div.appendChild(night);
                night_div.appendChild(night_label);

                /** Phare construit ? */
                let phare_div = document.createElement('div');
                town_info_content.appendChild(phare_div);

                let phare_label = document.createElement('label');
                phare_label.htmlFor = 'phare';
                phare_label.innerText = getI18N(texts.phare);
                phare_label.innerHTML = `<img src="${repo_img_hordes_url}building/small_lighthouse.gif"> ${getI18N(texts.phare)}`;
                let phare = document.createElement('input');
                phare.type = 'checkbox';
                phare.id = 'phare';
                phare.checked = conf.phare;
                phare.classList.add('mho-input');
                phare.addEventListener('change', ($event) => {
                    conf.phare = $event.srcElement.checked;
                    calculateCamping(conf);
                })
                phare_div.appendChild(phare);
                phare_div.appendChild(phare_label);

                if (camping_predict_container.style.display !== 'none') {
                    calculateCamping(conf);
                }
            });

        } else if (camping_predict_container) {
            camping_predict_container.remove();
        }
    }, 500);
}
