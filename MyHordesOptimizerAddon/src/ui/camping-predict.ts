import { calculateCamping } from '../api/camping';
import { getRuins } from '../api/ruins';
import { mh_optimizer_icon, mho_camping_predict_id, mho_hidden_class, repo_img_hordes_url } from '../config/constants';
import { added_ruins } from '../data/informations';
import { jobs, texts } from '../i18n/texts';
import { state } from '../state';
import { cancelWaitForElement, waitForElement } from '../utils/dom-wait';
import { getI18N } from '../utils/i18n';
import { pageIsDesert } from '../utils/page';

/** Identifiant du champ « nombre de tas », partagé entre sa création et son pilotage */
const digs_field_id: string = 'digs-field';

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

/** Clé d'attente : une seule attente du bloc de campement en vol, quel que soit le nombre de rejeux */
const wait_key_zone_camp: string = 'camping-predict:zone-camp';

/**
 * Une construction est déjà lancée : `getRuins()` étant asynchrone, deux rejeux
 * rapprochés produiraient sinon deux calculateurs empilés dans le même bloc.
 */
let camping_predict_building: boolean = false;

/**
 * Si l'option associée est activée, affiche le calculateur de campement dans le
 * bloc de campement du désert.
 *
 * Le bloc est rendu par le jeu après la navigation : on attend son apparition
 * plutôt que de différer aveuglément de 500 ms, délai qui laissait le calculateur
 * absent jusqu'à la prochaine action de l'utilisateur quand le rendu était plus lent.
 */
export function displayCampingPredict(): void {
    const existing_container: HTMLElement | null = document.getElementById(mho_camping_predict_id);

    if (!state.mho_parameters.display_camping_predict || !pageIsDesert()) {
        cancelWaitForElement(wait_key_zone_camp);
        existing_container?.remove();
        return;
    }

    if (existing_container) {
        cancelWaitForElement(wait_key_zone_camp);
        return;
    }

    waitForElement(wait_key_zone_camp, '.zone-camp', (zone_camp: Element): void => {
        /** La cible peut apparaître après un changement de page ou d'option */
        if (!state.mho_parameters.display_camping_predict || !pageIsDesert()) return;
        if (document.getElementById(mho_camping_predict_id) || camping_predict_building) return;

        buildCampingPredict(zone_camp);
    });
}

/** Construit le calculateur dans le bloc de campement fourni */
function buildCampingPredict(zone_camp: Element): void {
    camping_predict_building = true;

    getRuins()
        .then((ruins) => {
            /** Le bloc a pu être remplacé pendant l'appel : on ne greffe rien sur un nœud détaché */
            if (!zone_camp.isConnected || document.getElementById(mho_camping_predict_id)) return;

            let all_ruins = [...added_ruins];
            all_ruins = all_ruins.concat(ruins);

            const zone_camp_info = zone_camp.querySelector('.zone-camp-info');
            const zone_camp_label = zone_camp.querySelector('label');

            const camping_predict_container: HTMLDivElement = document.createElement('div');
            camping_predict_container.id = mho_camping_predict_id;
            /** Le bloc replié a une hauteur maximale nulle : on s'aligne sur son état */
            const is_zone_camp_collapsed: boolean = !!zone_camp_info
                    && window.getComputedStyle(zone_camp_info).getPropertyValue('max-height') === '0px';
            camping_predict_container.style.display = is_zone_camp_collapsed ? 'none' : 'block';
            zone_camp.appendChild(camping_predict_container);

            zone_camp_label?.addEventListener('click', () => {
                camping_predict_container.style.display = camping_predict_container.style.display === 'none' ? 'block' : 'none';
            });

            const updater_title = document.createElement('h5');
            updater_title.classList.add('mho-camping-title');
            const updater_title_mho_img = document.createElement('img');
            updater_title_mho_img.src = mh_optimizer_icon;
            updater_title.appendChild(updater_title_mho_img);

            const updater_title_text = document.createElement('span');
            updater_title_text.innerText = getI18N(texts.camping_calculator);
            updater_title.appendChild(updater_title_text);

            camping_predict_container.appendChild(updater_title);

            const camping_predict_content = document.createElement('div');
            camping_predict_content.classList.add('mho-camping-content');
            camping_predict_content.style.display = 'none';
            camping_predict_container.appendChild(camping_predict_content);

            updater_title.addEventListener('click', () => {
                const is_hidden = camping_predict_content.style.display === 'none';
                camping_predict_content.style.display = is_hidden ? 'block' : 'none';
                camping_predict_container.classList.toggle('mho-camping-opened', is_hidden);
                if (is_hidden) {
                    calculateCamping(conf);
                }
            });

            /**
             * Bâtiment de la case, présélectionné dans la liste. Le jeu rend l'un ou
             * l'autre de ces deux états, jamais les deux :
             * - des tas restants (`.ruin-bury-count .sand`) : le bâtiment est enfoui, donc
             *   inconnu du joueur, et c'est l'entrée « bâtiment non déterré » (id -1) qui
             *   s'applique, avec le nombre de tas relevé sur la page ;
             * - sinon `.ruin-info b` porte le libellé traduit du bâtiment déterré.
             * Faute des deux, on garde la valeur par défaut « Aucun ».
             */
            const bury_count: number = document.querySelectorAll('.ruin-info .ruin-bury-count .sand').length;
            const undug_ruin: any = bury_count > 0 ? all_ruins.find((one_ruin) => +one_ruin.id === -1) : undefined;

            const zone_ruin_label: string = document.querySelector('.ruin-info b')?.textContent?.trim() ?? '';
            const detected_ruin: any = undug_ruin ?? (zone_ruin_label
                ? all_ruins.find((one_ruin) => getI18N(one_ruin.label).trim().toLowerCase() === zone_ruin_label.toLowerCase())
                : undefined);

            const conf: any = {
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
                /** Bonus et capacité doivent suivre le bâtiment présélectionné, sinon le calcul l'ignore */
                ruinBonus: detected_ruin?.camping ?? 0,
                /** Le nombre de tas n'a de sens que pour le bâtiment non déterré */
                ruinBuryCount: undug_ruin ? bury_count : 0,
                ruinCapacity: detected_ruin?.capacity ?? 0,
                ruin: String(detected_ruin?.id ?? '-1000')
            };

            const columns_wrapper = document.createElement('div');
            columns_wrapper.classList.add('mho-camping-columns');
            camping_predict_content.appendChild(columns_wrapper);

            const my_info = document.createElement('div');
            my_info.classList.add('mho-camping-section', 'citizen');
            columns_wrapper.appendChild(my_info);

            const my_info_title = document.createElement('h3');
            my_info_title.innerText = getI18N(texts.camping_citizen);
            my_info.appendChild(my_info_title);

            const my_info_content = document.createElement('div');
            my_info_content.classList.add('mho-camping-section-content');
            my_info.appendChild(my_info_content);

            const town_info = document.createElement('div');
            town_info.classList.add('mho-camping-section', 'town');
            columns_wrapper.appendChild(town_info);

            const town_info_title = document.createElement('h3');
            town_info_title.innerText = getI18N(texts.camping_town);
            town_info.appendChild(town_info_title);

            const town_info_content = document.createElement('div');
            town_info_content.classList.add('mho-camping-section-content');
            town_info.appendChild(town_info_content);

            const cell_info = document.createElement('div');
            cell_info.classList.add('mho-camping-section', 'zone');
            columns_wrapper.appendChild(cell_info);

            const cell_info_title = document.createElement('h3');
            cell_info_title.innerText = getI18N(texts.camping_ruin);
            cell_info.appendChild(cell_info_title);

            const cell_info_content = document.createElement('div');
            cell_info_content.classList.add('mho-camping-section-content');
            cell_info.appendChild(cell_info_content);

            const result = document.createElement('div');
            result.classList.add('mho-camping-section');
            camping_predict_content.appendChild(result);

            const result_title = document.createElement('h3');
            result_title.innerText = getI18N(texts.result);
            result.appendChild(result_title);

            const result_content = document.createElement('div');
            result_content.id = 'camping-result';
            result.appendChild(result_content);

            /** Capuche ? */
            const vest_div = document.createElement('div');
            vest_div.id = 'vest-field';
            vest_div.classList.add('mho-camping-field', mho_hidden_class);
            my_info_content.appendChild(vest_div);

            const vest_label = document.createElement('label');
            vest_label.htmlFor = 'vest';
            vest_label.innerHTML = `<img src="${repo_img_hordes_url}emotes/proscout.gif" title="${getI18N(texts.vest)}">`;
            const vest = document.createElement('input');
            vest.type = 'checkbox';
            vest.id = 'vest';
            vest.checked = conf.vest;
            vest.classList.add('mho-input');
            vest.addEventListener('change', ($event) => {
                conf.vest = $event.srcElement.checked;
                calculateCamping(conf);
            });
            vest_div.appendChild(vest);
            vest_div.appendChild(vest_label);

            /** Campeur pro ? */
            const pro_camper_div = document.createElement('div');
            pro_camper_div.classList.add('mho-camping-field');
            my_info_content.appendChild(pro_camper_div);

            const pro_camper_label = document.createElement('label');
            pro_camper_label.htmlFor = 'pro';
            pro_camper_label.innerHTML = `<img src="${repo_img_hordes_url}status/status_camper.gif" title="${getI18N(texts.pro_camper)}">`;
            const pro_camper = document.createElement('input');
            pro_camper.type = 'checkbox';
            pro_camper.id = 'pro';
            pro_camper.checked = conf.pro;
            pro_camper.classList.add('mho-input');
            pro_camper.addEventListener('change', ($event) => {
                conf.proCamper = $event.srcElement.checked;
                calculateCamping(conf);
            });
            pro_camper_div.appendChild(pro_camper);
            pro_camper_div.appendChild(pro_camper_label);

            /** Tombe ? */
            const tomb_div = document.createElement('div');
            tomb_div.classList.add('mho-camping-field');
            my_info_content.appendChild(tomb_div);

            const tomb_label = document.createElement('label');
            tomb_label.htmlFor = 'tomb';
            tomb_label.innerHTML = `<img src="${repo_img_hordes_url}building/small_cemetery.gif" title="${getI18N(texts.tomb)}">`;
            const tomb = document.createElement('input');
            tomb.type = 'checkbox';
            tomb.id = 'tomb';
            tomb.checked = conf.tomb;
            tomb.classList.add('mho-input');
            tomb.addEventListener('change', ($event) => {
                conf.tomb = $event.srcElement.checked;
                calculateCamping(conf);
            });
            tomb_div.appendChild(tomb);
            tomb_div.appendChild(tomb_label);

            /** R4 ? (impacte uniquement le maximum atteignable) */
            const r4_div = document.createElement('div');
            r4_div.classList.add('mho-camping-field');
            my_info_content.appendChild(r4_div);

            const r4_label = document.createElement('label');
            r4_label.htmlFor = 'r4';
            r4_label.innerText = 'R4';
            const r4 = document.createElement('input');
            r4.type = 'checkbox';
            r4.id = 'r4';
            r4.checked = conf.r4;
            r4.classList.add('mho-input');
            r4.addEventListener('change', ($event) => {
                conf.r4 = $event.srcElement.checked;
                calculateCamping(conf);
            });
            r4_div.appendChild(r4);
            r4_div.appendChild(r4_label);

            /** Grille 2 colonnes pour les compteurs du bloc "Le citoyen" */
            const citizen_numbers_grid: HTMLDivElement = document.createElement('div');
            citizen_numbers_grid.classList.add('mho-camping-numbers-grid');
            my_info_content.appendChild(citizen_numbers_grid);

            /** Nombre de nuits déjà campées */
            const nb_campings_field: HTMLDivElement = createNumberField({
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
            const objects_in_bag_field: HTMLDivElement = createNumberField({
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

            /**
             * Le bâtiment et son nombre de tas forment une seule ligne : le second ne
             * concerne que le bâtiment non déterré et n'a pas de sens sans le premier.
             * Les deux champs gardent leurs identifiants et leurs classes, seul leur
             * parent change — le reste du code les retrouve par identifiant.
             */
            const ruin_row: HTMLDivElement = document.createElement('div');
            ruin_row.classList.add('mho-camping-ruin-row');
            cell_info_content.appendChild(ruin_row);

            /** Type de bâtiment */
            const ruin_type_div = document.createElement('div');
            ruin_type_div.classList.add('mho-camping-field', 'mho-camping-field--full');
            ruin_row.appendChild(ruin_type_div);

            const select_ruin = document.createElement('select');
            select_ruin.id = 'select-ruin';
            select_ruin.value = conf.ruin;
            select_ruin.classList.add('small');
            all_ruins.forEach((ruin) => {
                const ruin_option = document.createElement('option');
                ruin_option.value = ruin.id;
                ruin_option.label = getI18N(ruin.label);
                /**
                 * Comparaison numérique : l'API renvoie un id entier alors que la valeur
                 * par défaut est la chaîne '-1000', une égalité stricte ne matcherait jamais.
                 */
                if (+ruin.id === +conf.ruin) {
                    ruin_option.setAttribute('selected', 'selected');
                }
                select_ruin.appendChild(ruin_option);
            });
            /** Les options n'existaient pas encore lors de l'affectation initiale de `value` */
            select_ruin.value = String(conf.ruin);
            select_ruin.addEventListener('change', ($event) => {
                conf.ruin = $event.srcElement.value;
                const current_ruin: any = all_ruins.find((_current_ruin) => +_current_ruin.id === +conf.ruin);

                conf.ruinBonus = current_ruin.camping;
                conf.ruinCapacity = current_ruin.capacity;

                /**
                 * Masquage par classe : un `style.display` en ligne écraserait la mise en
                 * page en flex du champ, qui réapparaîtrait alors icône et saisie désalignées.
                 */
                const digs_field_element: HTMLElement | null = document.getElementById(digs_field_id);
                const is_undug_ruin: boolean = +current_ruin.id === -1;
                digs_field_element?.classList.toggle(mho_hidden_class, !is_undug_ruin);
                if (!is_undug_ruin) {
                    const digs_input: HTMLInputElement | null | undefined = digs_field_element?.querySelector('input');
                    if (digs_input) digs_input.value = '0';
                    conf.ruinBuryCount = 0;
                }

                calculateCamping(conf);
            });
            ruin_type_div.appendChild(select_ruin);

            /** Nombre de tas sur le bat ? */
            const digs_field: HTMLDivElement = createNumberField({
                id: 'digs',
                fieldId: digs_field_id,
                fullWidth: true,
                iconSrc: `${repo_img_hordes_url}icons/uncover.gif`,
                title: getI18N(texts.digs),
                initialValue: conf.ruinBuryCount,
                onChange: (value: number): void => {
                    conf.ruinBuryCount = value;
                    calculateCamping(conf);
                }
            });
            /** Même règle d'affichage qu'au changement de bâtiment dans la liste */
            digs_field.classList.toggle(mho_hidden_class, +conf.ruin !== -1);
            ruin_row.appendChild(digs_field);

            /** Grille 2 colonnes pour les compteurs du bloc "Le bâtiment" */
            const building_numbers_grid: HTMLDivElement = document.createElement('div');
            building_numbers_grid.classList.add('mho-camping-numbers-grid');
            cell_info_content.appendChild(building_numbers_grid);

            /** Nombre de zombies sur la case */
            const zombies_field: HTMLDivElement = createNumberField({
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
            const hidden_campers_field: HTMLDivElement = createNumberField({
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
            const improve_field: HTMLDivElement = createNumberField({
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
            const object_improve_field: HTMLDivElement = createNumberField({
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
            const night_div = document.createElement('div');
            night_div.classList.add('mho-camping-field');
            town_info_content.appendChild(night_div);

            const night_label = document.createElement('label');
            night_label.htmlFor = 'night';
            night_label.innerHTML = `<img src="${repo_img_hordes_url}pictos/r_doutsd.gif" title="${getI18N(texts.night)}">`;
            const night = document.createElement('input');
            night.type = 'checkbox';
            night.id = 'night';
            night.checked = conf.night;
            night.classList.add('mho-input');
            night.addEventListener('change', ($event) => {
                conf.night = $event.srcElement.checked;
                calculateCamping(conf);
            });
            night_div.appendChild(night);
            night_div.appendChild(night_label);

            /** Phare construit ? */
            const phare_div = document.createElement('div');
            phare_div.classList.add('mho-camping-field');
            town_info_content.appendChild(phare_div);

            const phare_label = document.createElement('label');
            phare_label.htmlFor = 'phare';
            phare_label.innerHTML = `<img src="${repo_img_hordes_url}building/small_lighthouse.gif" title="${getI18N(texts.phare)}">`;
            const phare = document.createElement('input');
            phare.type = 'checkbox';
            phare.id = 'phare';
            phare.checked = conf.phare;
            phare.classList.add('mho-input');
            phare.addEventListener('change', ($event) => {
                conf.phare = $event.srcElement.checked;
                calculateCamping(conf);
            });
            phare_div.appendChild(phare);
            phare_div.appendChild(phare_label);
        })
        .catch((error: unknown) => {
            console.error('MHO - calculateur de campement en échec', error);
        })
        .finally(() => {
            camping_predict_building = false;
        });
}
