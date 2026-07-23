import { calculateCamping } from '../api/camping';
import { getRuins } from '../api/ruins';
import { mh_optimizer_window_id, mho_hidden_class, repo_img_hordes_url } from '../config/constants';
import { added_ruins, town_type } from '../data/informations';
import { jobs, texts } from '../i18n/texts';
import { getI18N } from '../utils/i18n';

export function displayCamping() {
    getRuins().then((ruins) => {
        let all_ruins = [...added_ruins];
        all_ruins = all_ruins.concat(ruins);

        const tab_content = document.getElementById(mh_optimizer_window_id + '-tab-content');

        const camping_tab_content = document.createElement('div');
        camping_tab_content.style.padding = '0 0.5em';
        camping_tab_content.classList.add('camping-tab');
        tab_content.appendChild(camping_tab_content);

        const conf: any = {
            townType: 'RNE',
            job: 'citizen',
            distance: 1,
            campings: 0,
            proCamper: false,
            hiddenCampers: 0,
            objects: 0,
            vest: false,
            tomb: false,
            r4: false,
            zombies: 0,
            night: false,
            devastated: false,
            phare: false,
            improve: 0,
            objectImprove: 0,
            ruinBonus: 0,
            ruinBuryCount: 0,
            ruinCapacity: 0,
            ruin: '-1000'
        };

        const my_info = document.createElement('div');
        camping_tab_content.appendChild(my_info);

        const my_info_title = document.createElement('h3');
        my_info_title.innerText = getI18N(texts.camping_citizen);
        my_info.appendChild(my_info_title);

        const my_info_content = document.createElement('div');
        my_info.appendChild(my_info_content);

        const town_info = document.createElement('div');
        camping_tab_content.appendChild(town_info);

        const town_info_title = document.createElement('h3');
        town_info_title.innerText = getI18N(texts.camping_town);
        town_info.appendChild(town_info_title);

        const town_info_content = document.createElement('div');
        town_info.appendChild(town_info_content);

        const cell_info = document.createElement('div');
        camping_tab_content.appendChild(cell_info);

        const cell_info_title = document.createElement('h3');
        cell_info_title.innerText = getI18N(texts.camping_ruin);
        cell_info.appendChild(cell_info_title);

        const cell_info_content = document.createElement('div');
        cell_info.appendChild(cell_info_content);

        const result = document.createElement('div');
        camping_tab_content.appendChild(result);

        const result_title = document.createElement('h3');
        result_title.innerText = getI18N(texts.result);
        result.appendChild(result_title);

        const result_content = document.createElement('div');
        result_content.id = 'camping-result';
        result.appendChild(result_content);

        /** Type de ville */
        const town_div = document.createElement('div');
        town_info_content.appendChild(town_div);

        const select_town_label = document.createElement('label');
        select_town_label.htmlFor = 'select-town';
        select_town_label.classList.add('spaced-label');
        select_town_label.innerText = getI18N(texts.town_type);
        const select_town = document.createElement('select');
        select_town.id = 'select-town';
        select_town.value = conf.town;
        select_town.classList.add('small');
        town_type.forEach((town) => {
            const town_option = document.createElement('option');
            town_option.value = town.id;
            town_option.label = getI18N(town.label);
            select_town.appendChild(town_option);
        });
        select_town.addEventListener('change', ($event) => {
            conf.townType = $event.srcElement.value.toUpperCase();
            calculateCamping(conf);
        });
        town_div.appendChild(select_town_label);
        town_div.appendChild(select_town);


        /** Métier */
        const job_div = document.createElement('div');
        my_info_content.appendChild(job_div);

        const select_job_label = document.createElement('label');
        select_job_label.htmlFor = 'select-job';
        select_job_label.innerText = getI18N(texts.job);
        select_job_label.classList.add('spaced-label');
        const select_job = document.createElement('select');
        select_job.id = 'select-job';
        select_job.value = conf.job;
        select_job.classList.add('small');
        jobs.forEach((job) => {
            const job_option = document.createElement('option');
            job_option.value = job.id;
            job_option.label = getI18N(job.label);
            select_job.appendChild(job_option);
        });
        select_job.addEventListener('change', ($event) => {
            conf.job = $event.srcElement.value;
            const vest_field = document.querySelector('#vest-field');
            /** Masquage par classe et non par style en ligne, pour ne pas écraser la mise en page du champ */
            vest_field?.classList.toggle(mho_hidden_class, conf.job !== 'scout');
            if (conf.job !== 'scout') {
                conf.vest = false;
            }
            calculateCamping(conf);
        });

        job_div.appendChild(select_job_label);
        job_div.appendChild(select_job);

        /** Capuche ? */
        const vest_div = document.createElement('div');
        vest_div.id = 'vest-field';
        vest_div.classList.add(mho_hidden_class);
        my_info_content.appendChild(vest_div);

        const vest_label = document.createElement('label');
        vest_label.htmlFor = 'vest';
        vest_label.innerHTML = `<img src="${repo_img_hordes_url}emotes/proscout.gif"> ${getI18N(texts.vest)}`;
        const vest = document.createElement('input');
        vest.classList.add('mho-input');
        vest.type = 'checkbox';
        vest.id = 'vest';
        vest.checked = conf.vest;
        vest.addEventListener('change', ($event) => {
            conf.vest = $event.srcElement.checked;
            calculateCamping(conf);
        });
        vest_div.appendChild(vest);
        vest_div.appendChild(vest_label);

        /** Campeur pro ? */
        const pro_camper_div = document.createElement('div');
        my_info_content.appendChild(pro_camper_div);

        const pro_camper_label = document.createElement('label');
        pro_camper_label.htmlFor = 'pro';
        pro_camper_label.innerHTML = `<img src="${repo_img_hordes_url}status/status_camper.gif"> ${getI18N(texts.pro_camper)}`;
        const pro_camper = document.createElement('input');
        pro_camper.classList.add('mho-input');
        pro_camper.type = 'checkbox';
        pro_camper.id = 'pro';
        pro_camper.checked = conf.pro;
        pro_camper.addEventListener('change', ($event) => {
            conf.proCamper = $event.srcElement.checked;
            calculateCamping(conf);
        });
        pro_camper_div.appendChild(pro_camper);
        pro_camper_div.appendChild(pro_camper_label);

        /** Tombe ? */
        const tomb_div = document.createElement('div');
        my_info_content.appendChild(tomb_div);

        const tomb_label = document.createElement('label');
        tomb_label.htmlFor = 'tomb';
        tomb_label.innerHTML = `<img src="${repo_img_hordes_url}building/small_cemetery.gif"> ${getI18N(texts.tomb)}`;
        const tomb = document.createElement('input');
        tomb.classList.add('mho-input');
        tomb.type = 'checkbox';
        tomb.id = 'tomb';
        tomb.checked = conf.tomb;
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

        /** Nombre de nuits déjà campées */
        const nb_campings_div = document.createElement('div');
        my_info_content.appendChild(nb_campings_div);

        const nb_campings_label = document.createElement('label');
        nb_campings_label.htmlFor = 'nb-campings';
        nb_campings_label.innerHTML = `<img src="${repo_img_hordes_url}emotes/sleep.gif"> ${getI18N(texts.nb_campings)}`;
        nb_campings_label.classList.add('spaced-label');
        const nb_campings = document.createElement('input');
        nb_campings.type = 'number';
        nb_campings.id = 'nb-campings';
        nb_campings.value = (conf.campings) as any;
        nb_campings.classList.add('mho-input', 'inline');
        nb_campings.addEventListener('change', ($event) => {
            conf.campings = +$event.srcElement.value;
            calculateCamping(conf);
        });
        nb_campings_div.appendChild(nb_campings_label);
        nb_campings_div.appendChild(nb_campings);

        /** Nombre de toiles de tente ou pelure de peau */
        const objects_in_bag_div = document.createElement('div');
        my_info_content.appendChild(objects_in_bag_div);

        const objects_in_bag_label = document.createElement('label');
        objects_in_bag_label.htmlFor = 'nb-objects';
        objects_in_bag_label.innerText = getI18N(texts.objects_in_bag);
        objects_in_bag_label.innerHTML = `<img src="${repo_img_hordes_url}emotes/bag.gif"> ${getI18N(texts.objects_in_bag)}`;
        objects_in_bag_label.classList.add('spaced-label');
        const objects_in_bag = document.createElement('input');
        objects_in_bag.type = 'number';
        objects_in_bag.id = 'nb-objects';
        objects_in_bag.value = (conf.objects) as any;
        objects_in_bag.classList.add('mho-input', 'inline');
        objects_in_bag.addEventListener('change', ($event) => {
            conf.objects = +$event.srcElement.value;
            calculateCamping(conf);
        });
        objects_in_bag_div.appendChild(objects_in_bag_label);
        objects_in_bag_div.appendChild(objects_in_bag);


        /** Type de bâtiment */
        const ruin_type_div = document.createElement('div');
        cell_info_content.appendChild(ruin_type_div);

        const select_ruin = document.createElement('select');
        select_ruin.id = 'select-ruin';
        select_ruin.value = conf.ruin;
        select_ruin.classList.add('small');
        all_ruins.forEach((ruin) => {
            const ruin_option = document.createElement('option');
            ruin_option.value = ruin.id;
            ruin_option.label = getI18N(ruin.label);
            select_ruin.appendChild(ruin_option);
        });
        select_ruin.addEventListener('change', ($event) => {
            conf.ruin = $event.srcElement.value;
            const current_ruin: any = all_ruins.find((_current_ruin) => +_current_ruin.id === +conf.ruin);

            conf.ruinBonus = current_ruin.camping;
            conf.ruinCapacity = current_ruin.capacity;

            const digs_field = document.querySelector('#digs-field');
            /** Masquage par classe et non par style en ligne, pour ne pas écraser la mise en page du champ */
            const is_undug_ruin: boolean = +current_ruin.id === -1;
            digs_field?.classList.toggle(mho_hidden_class, !is_undug_ruin);
            if (!is_undug_ruin) {
                const digs_input: HTMLInputElement | null | undefined = digs_field?.querySelector('input');
                if (digs_input) digs_input.value = '0';
                conf.ruinBuryCount = 0;
            }

            calculateCamping(conf);
        });
        ruin_type_div.appendChild(select_ruin);

        /** Nombre de tas sur le bat ? */
        const digs_div = document.createElement('div');
        digs_div.id = 'digs-field';
        digs_div.classList.add(mho_hidden_class);
        cell_info_content.appendChild(digs_div);

        const digs_label = document.createElement('label');
        digs_label.htmlFor = 'digs';
        digs_label.innerText = getI18N(texts.digs);
        digs_label.innerHTML = `<img src="${repo_img_hordes_url}icons/uncover.gif"> ${getI18N(texts.digs)}`;
        digs_label.classList.add('spaced-label');
        const digs = document.createElement('input');
        digs.type = 'number';
        digs.id = 'digs';
        digs.value = (conf.ruinBuryCount) as any;
        digs.classList.add('mho-input', 'inline');
        digs.addEventListener('change', ($event) => {
            conf.ruinBuryCount = +$event.srcElement.value;
            calculateCamping(conf);
        });
        digs_div.appendChild(digs_label);
        digs_div.appendChild(digs);

        /** Distance de la ville */
        const distance_div = document.createElement('div');
        cell_info_content.appendChild(distance_div);

        const distance_label = document.createElement('label');
        distance_label.htmlFor = 'distance';
        distance_label.innerText = getI18N(texts.distance).replace('%VAR%', '');
        distance_label.innerHTML = `<img src="${repo_img_hordes_url}emotes/explo.gif"> ${getI18N(texts.distance).replace('%VAR%', '')}`;
        distance_label.classList.add('spaced-label');
        const distance = document.createElement('input');
        distance.type = 'number';
        distance.id = 'distance';
        distance.value = (conf.distance) as any;
        distance.classList.add('mho-input', 'inline');
        distance.addEventListener('change', ($event) => {
            conf.distance = +$event.srcElement.value;
            calculateCamping(conf);
        });
        distance_div.appendChild(distance_label);
        distance_div.appendChild(distance);

        /** Nombre de zombies sur la case */
        const zombies_div = document.createElement('div');
        cell_info_content.appendChild(zombies_div);

        const zombies_label = document.createElement('label');
        zombies_label.htmlFor = 'nb-zombies';
        zombies_label.innerHTML = `<img src="${repo_img_hordes_url}emotes/zombie.gif"> ${getI18N(texts.zombies_on_cell)}`;
        zombies_label.classList.add('spaced-label');
        const zombies = document.createElement('input');
        zombies.type = 'number';
        zombies.id = 'nb-zombies';
        zombies.value = (conf.zombies) as any;
        zombies.classList.add('mho-input', 'inline');
        zombies.addEventListener('change', ($event) => {
            conf.zombies = +$event.srcElement.value;
            calculateCamping(conf);
        });
        zombies_div.appendChild(zombies_label);
        zombies_div.appendChild(zombies);

        /** Nombre d'améliorations simples sur la case */
        const improve_div = document.createElement('div');
        cell_info_content.appendChild(improve_div);

        const improve_label = document.createElement('label');
        improve_label.htmlFor = 'nb-improve';
        improve_label.innerHTML = `<img src="${repo_img_hordes_url}icons/small_refine.gif"> ${getI18N(texts.improve)}`;
        improve_label.classList.add('spaced-label');
        const improve = document.createElement('input');
        improve.type = 'number';
        improve.id = 'nb-improve';
        improve.value = (conf.improve) as any;
        improve.classList.add('mho-input', 'inline');
        improve.addEventListener('change', ($event) => {
            conf.improve = +$event.srcElement.value;
            calculateCamping(conf);
        });
        improve_div.appendChild(improve_label);
        improve_div.appendChild(improve);

        /** Nombre d'objets de campement installés sur la case */
        const object_improve_div = document.createElement('div');
        cell_info_content.appendChild(object_improve_div);

        const object_improve_label = document.createElement('label');
        object_improve_label.htmlFor = 'nb-object-improve';
        object_improve_label.innerHTML = `<img src="${repo_img_hordes_url}item/cat_def.gif"> ${getI18N(texts.object_improve)}`;
        object_improve_label.classList.add('spaced-label');
        const object_improve = document.createElement('input');
        object_improve.type = 'number';
        object_improve.id = 'nb-object-improve';
        object_improve.value = (conf.objectImprove) as any;
        object_improve.classList.add('mho-input', 'inline');
        object_improve.addEventListener('change', ($event) => {
            conf.objectImprove = +$event.srcElement.value;
            calculateCamping(conf);
        });
        object_improve_div.appendChild(object_improve_label);
        object_improve_div.appendChild(object_improve);

        /** Nombre de personnes déjà cachées */
        const hidden_campers_div = document.createElement('div');
        cell_info_content.appendChild(hidden_campers_div);

        const hidden_campers_label = document.createElement('label');
        hidden_campers_label.htmlFor = 'hidden-campers';
        hidden_campers_label.innerHTML = `<img src="${repo_img_hordes_url}emotes/human.gif"> ${getI18N(texts.hidden_campers)}`;
        hidden_campers_label.classList.add('spaced-label');
        const hidden_campers = document.createElement('input');
        hidden_campers.type = 'number';
        hidden_campers.id = 'hidden-campers';
        hidden_campers.value = (conf.hiddenCampers) as any;
        hidden_campers.classList.add('mho-input', 'inline');
        hidden_campers.addEventListener('change', ($event) => {
            conf.hiddenCampers = +$event.srcElement.value;
            calculateCamping(conf);
        });
        hidden_campers_div.appendChild(hidden_campers_label);
        hidden_campers_div.appendChild(hidden_campers);

        /** Nuit ? */
        const night_div = document.createElement('div');
        town_info_content.appendChild(night_div);

        const night_label = document.createElement('label');
        night_label.htmlFor = 'night';
        night_label.innerHTML = `<img src="${repo_img_hordes_url}pictos/r_doutsd.gif"> ${getI18N(texts.night)}`;
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

        /** Ville dévastée ? */
        const devastated_div = document.createElement('div');
        town_info_content.appendChild(devastated_div);

        const devastated_label = document.createElement('label');
        devastated_label.htmlFor = 'devastated';
        devastated_label.innerHTML = `<img src="${repo_img_hordes_url}item/item_out_def_broken.gif"> ${getI18N(texts.devastated)}`;
        const devastated = document.createElement('input');
        devastated.type = 'checkbox';
        devastated.id = 'devastated';
        devastated.checked = conf.devastated;
        devastated.classList.add('mho-input');
        devastated.addEventListener('change', ($event) => {
            conf.devastated = $event.srcElement.checked;
            calculateCamping(conf);
        });
        devastated_div.appendChild(devastated);
        devastated_div.appendChild(devastated_label);

        /** Phare construit ? */
        const phare_div = document.createElement('div');
        town_info_content.appendChild(phare_div);

        const phare_label = document.createElement('label');
        phare_label.htmlFor = 'phare';
        phare_label.innerText = getI18N(texts.phare);
        phare_label.innerHTML = `<img src="${repo_img_hordes_url}building/small_lighthouse.gif"> ${getI18N(texts.phare)}`;
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


        calculateCamping(conf);
    });
}

/** Affiche la liste des bâtiments trouvables dans le désert */
