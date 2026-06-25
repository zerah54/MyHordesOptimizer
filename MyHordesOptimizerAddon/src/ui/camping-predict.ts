import { calculateCamping } from '../api/camping';
import { getRuins } from '../api/ruins';
import { mh_optimizer_icon, mho_camping_predict_id, repo_img_hordes_url } from '../config/constants';
import { added_ruins } from '../data/informations';
import { jobs, texts } from '../i18n/texts';
import { state } from '../state';
import { getI18N } from '../utils/i18n';
import { pageIsDesert } from '../utils/page';

const stepper_minus_src: string = `${repo_img_hordes_url}icons/small_minus.gif`;
const stepper_plus_src: string = `${repo_img_hordes_url}icons/small_more2.gif`;

interface NumberFieldConfig {
    readonly id: string;
    readonly iconSrc: string;
    readonly title: string;
    readonly initialValue: number;
    readonly minValue?: number;
    readonly fieldId?: string;
    readonly fullWidth?: boolean;
    readonly onChange: (value: number) => void;
}

/**
 * Crée un champ "input number" précédé d'une icône (avec title) et entouré
 * de boutons +/- permettant d'incrémenter/décrémenter la valeur de 1.
 */
function createNumberField(config: NumberFieldConfig): HTMLDivElement {
    const min_value: number = config.minValue ?? 0;

    const field: HTMLDivElement = document.createElement('div');
    field.classList.add('mho-camping-field');
    if (config.fieldId) {
        field.id = config.fieldId;
    }
    if (config.fullWidth) {
        field.classList.add('mho-camping-field--full');
    }

    const label: HTMLLabelElement = document.createElement('label');
    label.htmlFor = config.id;
    label.innerHTML = `<img src="${config.iconSrc}" title="${config.title}">`;

    const minus: HTMLImageElement = document.createElement('img');
    minus.src = stepper_minus_src;
    minus.alt = '-';
    minus.classList.add('mho-camping-stepper-btn');

    const input: HTMLInputElement = document.createElement('input');
    input.type = 'number';
    input.id = config.id;
    input.value = String(config.initialValue);
    input.min = String(min_value);
    input.classList.add('mho-input', 'inline');

    const plus: HTMLImageElement = document.createElement('img');
    plus.src = stepper_plus_src;
    plus.alt = '+';
    plus.classList.add('mho-camping-stepper-btn');

    const dispatch_change = (): void => {
        input.dispatchEvent(new Event('change'));
    };

    minus.addEventListener('click', (_event: MouseEvent): void => {
        const current: number = Number(input.value) || 0;
        input.value = String(Math.max(min_value, current - 1));
        dispatch_change();
    });

    plus.addEventListener('click', (_event: MouseEvent): void => {
        const current: number = Number(input.value) || 0;
        input.value = String(current + 1);
        dispatch_change();
    });

    input.addEventListener('change', (event: Event): void => {
        const target: HTMLInputElement = event.target as HTMLInputElement;
        config.onChange(Number(target.value));
    });

    field.appendChild(label);
    field.appendChild(minus);
    field.appendChild(input);
    field.appendChild(plus);

    return field;
}

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

                camping_predict_container = document.createElement('div');
                camping_predict_container.id = mho_camping_predict_id;
                camping_predict_container.style.display = window.getComputedStyle(zone_camp_info).getPropertyValue('max-height') === '0px' ? 'none' : 'block';
                zone_camp.appendChild(camping_predict_container);

                zone_camp_label.addEventListener('click', () => {
                    camping_predict_container.style.display = camping_predict_container.style.display === 'none' ? 'block' : 'none';
                });

                let updater_title = document.createElement('h5');
                updater_title.classList.add('mho-camping-title');
                let updater_title_mho_img = document.createElement('img');
                updater_title_mho_img.src = mh_optimizer_icon;
                updater_title.appendChild(updater_title_mho_img);

                let updater_title_text = document.createElement('span');
                updater_title_text.innerText = getI18N(texts.camping_calculator);
                updater_title.appendChild(updater_title_text);

                camping_predict_container.appendChild(updater_title);

                let camping_predict_content = document.createElement('div');
                camping_predict_content.classList.add('mho-camping-content');
                camping_predict_content.style.display = 'none';
                camping_predict_container.appendChild(camping_predict_content);

                updater_title.addEventListener('click', () => {
                    let is_hidden = camping_predict_content.style.display === 'none';
                    camping_predict_content.style.display = is_hidden ? 'block' : 'none';
                    camping_predict_container.classList.toggle('mho-camping-opened', is_hidden);
                    if (is_hidden) {
                        calculateCamping(conf);
                    }
                });

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
                    r4: false,
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

                let columns_wrapper = document.createElement('div');
                columns_wrapper.classList.add('mho-camping-columns');
                camping_predict_content.appendChild(columns_wrapper);

                let my_info = document.createElement('div');
                my_info.classList.add('mho-camping-section', 'citizen');
                columns_wrapper.appendChild(my_info);

                let my_info_title = document.createElement('h3');
                my_info_title.innerText = getI18N(texts.camping_citizen);
                my_info.appendChild(my_info_title);

                let my_info_content = document.createElement('div');
                my_info_content.classList.add('mho-camping-section-content');
                my_info.appendChild(my_info_content);

                let town_info = document.createElement('div');
                town_info.classList.add('mho-camping-section', 'town');
                columns_wrapper.appendChild(town_info);

                let town_info_title = document.createElement('h3');
                town_info_title.innerText = getI18N(texts.camping_town);
                town_info.appendChild(town_info_title);

                let town_info_content = document.createElement('div');
                town_info_content.classList.add('mho-camping-section-content');
                town_info.appendChild(town_info_content);

                let cell_info = document.createElement('div');
                cell_info.classList.add('mho-camping-section', 'zone');
                columns_wrapper.appendChild(cell_info);

                let cell_info_title = document.createElement('h3');
                cell_info_title.innerText = getI18N(texts.camping_ruin);
                cell_info.appendChild(cell_info_title);

                let cell_info_content = document.createElement('div');
                cell_info_content.classList.add('mho-camping-section-content');
                cell_info.appendChild(cell_info_content);

                let result = document.createElement('div');
                result.classList.add('mho-camping-section');
                camping_predict_content.appendChild(result);

                let result_title = document.createElement('h3');
                result_title.innerText = getI18N(texts.result);
                result.appendChild(result_title);

                let result_content = document.createElement('div');
                result_content.id = 'camping-result';
                result.appendChild(result_content);

                /** Capuche ? */
                let vest_div = document.createElement('div');
                vest_div.id = 'vest-field';
                vest_div.classList.add('mho-camping-field');
                vest_div.style.display = 'none';
                my_info_content.appendChild(vest_div);

                let vest_label = document.createElement('label');
                vest_label.htmlFor = 'vest';
                vest_label.innerHTML = `<img src="${repo_img_hordes_url}emotes/proscout.gif" title="${getI18N(texts.vest)}">`;
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
                pro_camper_div.classList.add('mho-camping-field');
                my_info_content.appendChild(pro_camper_div);

                let pro_camper_label = document.createElement('label');
                pro_camper_label.htmlFor = 'pro';
                pro_camper_label.innerHTML = `<img src="${repo_img_hordes_url}status/status_camper.gif" title="${getI18N(texts.pro_camper)}">`;
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
                tomb_div.classList.add('mho-camping-field');
                my_info_content.appendChild(tomb_div);

                let tomb_label = document.createElement('label');
                tomb_label.htmlFor = 'tomb';
                tomb_label.innerHTML = `<img src="${repo_img_hordes_url}building/small_cemetery.gif" title="${getI18N(texts.tomb)}">`;
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

                /** R4 ? (impacte uniquement le maximum atteignable) */
                let r4_div = document.createElement('div');
                r4_div.classList.add('mho-camping-field');
                my_info_content.appendChild(r4_div);

                let r4_label = document.createElement('label');
                r4_label.htmlFor = 'r4';
                r4_label.innerText = 'R4';
                let r4 = document.createElement('input');
                r4.type = 'checkbox';
                r4.id = 'r4';
                r4.checked = conf.r4;
                r4.classList.add('mho-input');
                r4.addEventListener('change', ($event) => {
                    conf.r4 = $event.srcElement.checked;
                    calculateCamping(conf);
                })
                r4_div.appendChild(r4);
                r4_div.appendChild(r4_label);

                /** Grille 2 colonnes pour les compteurs du bloc "Le citoyen" */
                let citizen_numbers_grid: HTMLDivElement = document.createElement('div');
                citizen_numbers_grid.classList.add('mho-camping-numbers-grid');
                my_info_content.appendChild(citizen_numbers_grid);

                /** Nombre de nuits déjà campées */
                let nb_campings_field: HTMLDivElement = createNumberField({
                    id: 'nb-campings',
                    iconSrc: `${repo_img_hordes_url}emotes/sleep.gif`,
                    title: getI18N(texts.nb_campings),
                    initialValue: conf.campings,
                    onChange: (value: number): void => {
                        conf.campings = value;
                        calculateCamping(conf);
                    }
                });
                citizen_numbers_grid.appendChild(nb_campings_field);

                /** Nombre de toiles de tente ou pelure de peau */
                let objects_in_bag_field: HTMLDivElement = createNumberField({
                    id: 'nb-objects',
                    iconSrc: `${repo_img_hordes_url}emotes/bag.gif`,
                    title: getI18N(texts.objects_in_bag),
                    initialValue: conf.objects,
                    onChange: (value: number): void => {
                        conf.objects = value;
                        calculateCamping(conf);
                    }
                });
                citizen_numbers_grid.appendChild(objects_in_bag_field);

                /** Type de bâtiment */
                let ruin_type_div = document.createElement('div');
                ruin_type_div.classList.add('mho-camping-field', 'mho-camping-field--full');
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
                let digs_field: HTMLDivElement = createNumberField({
                    id: 'digs',
                    fieldId: 'digs-field',
                    fullWidth: true,
                    iconSrc: `${repo_img_hordes_url}icons/uncover.gif`,
                    title: getI18N(texts.digs),
                    initialValue: conf.ruinBuryCount,
                    onChange: (value: number): void => {
                        conf.ruinBuryCount = value;
                        calculateCamping(conf);
                    }
                });
                digs_field.style.display = 'none';
                cell_info_content.appendChild(digs_field);

                /** Grille 2 colonnes pour les compteurs du bloc "Le bâtiment" */
                let building_numbers_grid: HTMLDivElement = document.createElement('div');
                building_numbers_grid.classList.add('mho-camping-numbers-grid');
                cell_info_content.appendChild(building_numbers_grid);

                /** Nombre de zombies sur la case */
                let zombies_field: HTMLDivElement = createNumberField({
                    id: 'nb-zombies',
                    iconSrc: `${repo_img_hordes_url}emotes/zombie.gif`,
                    title: getI18N(texts.zombies_on_cell),
                    initialValue: conf.zombies,
                    onChange: (value: number): void => {
                        conf.zombies = value;
                        calculateCamping(conf);
                    }
                });
                building_numbers_grid.appendChild(zombies_field);

                /** Nombre de personnes déjà cachées */
                let hidden_campers_field: HTMLDivElement = createNumberField({
                    id: 'hidden-campers',
                    iconSrc: `${repo_img_hordes_url}emotes/human.gif`,
                    title: getI18N(texts.hidden_campers),
                    initialValue: conf.hiddenCampers,
                    onChange: (value: number): void => {
                        conf.hiddenCampers = value;
                        calculateCamping(conf);
                    }
                });
                building_numbers_grid.appendChild(hidden_campers_field);

                /** Nombre d'améliorations simples sur la case */
                let improve_field: HTMLDivElement = createNumberField({
                    id: 'nb-improve',
                    iconSrc: `${repo_img_hordes_url}icons/small_refine.gif`,
                    title: getI18N(texts.improve),
                    initialValue: conf.improve,
                    onChange: (value: number): void => {
                        conf.improve = value;
                        calculateCamping(conf);
                    }
                });
                building_numbers_grid.appendChild(improve_field);

                /** Nombre d'objets de campement installés sur la case */
                let object_improve_field: HTMLDivElement = createNumberField({
                    id: 'nb-object-improve',
                    iconSrc: `${repo_img_hordes_url}item/cat_def.gif`,
                    title: getI18N(texts.object_improve),
                    initialValue: conf.objectImprove,
                    onChange: (value: number): void => {
                        conf.objectImprove = value;
                        calculateCamping(conf);
                    }
                });
                building_numbers_grid.appendChild(object_improve_field);

                /** Nuit ? */
                let night_div = document.createElement('div');
                night_div.classList.add('mho-camping-field');
                town_info_content.appendChild(night_div);

                let night_label = document.createElement('label');
                night_label.htmlFor = 'night';
                night_label.innerHTML = `<img src="${repo_img_hordes_url}pictos/r_doutsd.gif" title="${getI18N(texts.night)}">`;
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
                phare_div.classList.add('mho-camping-field');
                town_info_content.appendChild(phare_div);

                let phare_label = document.createElement('label');
                phare_label.htmlFor = 'phare';
                phare_label.innerHTML = `<img src="${repo_img_hordes_url}building/small_lighthouse.gif" title="${getI18N(texts.phare)}">`;
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

            });

        } else if (camping_predict_container) {
            camping_predict_container.remove();
        }
    }, 500);
}
