// ==UserScript==
// @name         MHO Addon
// @version      1.1.49
// @description  Optimizer for MyHordes - Documentation & fonctionnalités : https://myhordes-optimizer.web.app/, rubrique Tutoriels
// @author       Zerah
//
// @icon         https://myhordes-optimizer.web.app/img/logo/logo_mho_16x16.png
// @icon64       https://myhordes-optimizer.web.app/img/logo/logo_mho_64x64.png
//
// @downloadURL  https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/my_hordes_optimizer.user.js
// @updateURL    https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/my_hordes_optimizer.user.js
// @homepageURL  https://myhordes-optimizer.web.app/tutorials/script/installation
// @supportURL   https://discord.gg/ZQH7ZPWcCm
//
// @connect      https://api.myhordesoptimizer.fr/
// @connect      *
//
// @match        *://myhordes.de/*
// @match        *://myhordes.eu/*
// @match        *://myhord.es/*
// @match        *://myhordes.fr/*
//
// @match        https://bbh.fred26.fr/*
// @match        https://gest-hordes2.eragaming.fr/*
// @match        https://gesthordes.fr/*
// @match        https://fatamorgana.md26.eu/*
//
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM_notification
//
// ==/UserScript==
(function () {
    'use strict';

    const lang = ((document.querySelector('html[lang]')?.getAttribute('lang') || document.documentElement.lang || navigator.language || navigator.userLanguage).substring(0, 2) || 'fr');
    /////////////////
    // Les URL MHO //
    /////////////////
    const is_mh_beta = document.URL.indexOf('staging') >= 0;
    const is_mh_local = document.URL.indexOf('localhost') >= 0;
    ////////////////////
    // Les constantes //
    ////////////////////
    const gest_hordes_old_url = 'https://gest-hordes2.eragaming.fr';
    const gest_hordes_url = 'https://gesthordes.fr';
    const big_broth_hordes_url = 'https://bbh.fred26.fr';
    const fata_morgana_url = 'https://fatamorgana.md26.eu';
    const supported_languages = [
        { value: 'de', img: '🇩🇪' },
        { value: 'en', img: '🇬🇧' },
        { value: 'es', img: '🇪🇸' },
        { value: 'fr', img: '🇫🇷' },
    ];
    const gm_bbh_updated_key = 'MHO_bbh_updated';
    const gm_gh_updated_key = 'MHO_gh_updated';
    const gm_fata_updated_key = 'MHO_fata_updated';
    const gm_mho_updated_key = 'MHO_mho_updated';
    const mho_parameters_key = 'MHO_parameters';
    const mh_user_key = 'MHO_mh_user';
    const mho_map_key = 'MHO_map';
    const mho_token_key = 'MHO_token';
    const mho_blacklist_key = 'MHO_blacklist';
    const mho_anti_abuse_key = 'MHO_anti_abuse';
    const mho_version_key = 'MHO_version';
    const gm_mh_external_app_id_key = is_mh_beta ? 'MHO_mh_beta_external_app_id' : 'MHO_mh_external_app_id';
    ///////////////////////////////////////////
    // Listes de constantes / Constants list //
    ///////////////////////////////////////////
    const hordes_img_url = '/build/images/';
    const repo_img_url = 'https://myhordes-optimizer.web.app/img/';
    const repo_img_hordes_url = repo_img_url + 'hordes_img/';
    const mh_optimizer_icon = 'https://myhordes-optimizer.web.app/img/logo/logo_mho_64x64_outlined.png';
    const mh_optimizer_window_id = 'optimizer-window';
    const mh_optimizer_map_window_id = 'optimizer-map-window';
    const mho_expeditions_window_id = 'mho-expeditions-window';
    const mho_store_notifications_window_id = 'mho-store-notifications-window';
    const btn_id = 'optimizer-btn';
    const content_btn_id = 'optimizer-content-btn';
    const mh_content_id = 'content';
    const mh_update_external_tools_id = 'mh-update-external-tools';
    const mho_warn_missing_logs_id = 'mho-warn-missing-logs';
    const mho_camping_predict_id = 'mho-camping-predict';
    const zone_info_zombies_id = 'zone-info-zombies';
    const nb_dead_zombies_id = 'nb-dead-zombies';
    const despair_deaths_id = 'despair-deaths';
    const mho_copy_map_id = 'mho-copy-map';
    const mho_header_space_id = 'mho-header-space';
    const mho_display_map_id = 'mho-display-map';
    const mho_display_expeditions_id = 'mho-display-expeditions';
    const mho_store_notifications_id = 'mho-store-notifications';
    const mho_search_building_field_id = 'mho-search-building-field';
    const mho_search_recipient_field_id = 'mho-search-recipient-field';
    const mho_search_dump_field_id = 'mho-search-dump-field';
    const mho_search_registry_field_id = 'mho-search-registry-field';
    const mho_filter_citizen_list_id = 'mho-filter-citizen-list';
    const mho_filter_omniscience_id = 'mho-filter-omniscience';
    const mho_display_translate_input_id = 'mho-display-translate-input';
    const mho_watchtower_estim_id = 'mho-watchtower-estim';
    const mho_anti_abuse_counter_id = 'mho-anti-abuse-counter';
    const mho_town_external_links_id = 'mho-town-external-links';
    const mho_copy_logs_id = 'mho-copy-logs';

    //////////////////////////////////////
    // Les éléments récupérés via l'API //
    //////////////////////////////////////
    const state = {
        website: '',
        api_url: '',
        mho_parameters: undefined,
        mh_user: undefined,
        external_app_id: undefined,
        token: undefined,
        items: undefined,
        ruins: undefined,
        recipes: undefined,
        citizens: undefined,
        hero_skills: undefined,
        wishlist: undefined,
        parameters: undefined,
        map: undefined,
        current_cell: undefined,
        my_expeditions: undefined,
        tooltips_observer: undefined,
        loading_area_observer: undefined,
        bank_observer: undefined,
        anti_abuse_controller: undefined,
        ///////////////////
        // Les variables //
        ///////////////////
        is_refresh_wishlist: undefined,
        /** true quand le changelog est nouveau et qu'il faut afficher une pastille sur le menu */
        has_new_changelog: false,
        /** True quand une erreur vient d'être affichée. Repasse à false au bout d'une seconde, pour éviter le spam d'erreurs */
        is_error: false,
        /** La liste des notifications récupérées depuis le dernier chargement de l'application */
        mh_notifications: [],
        /** Le mutation observer pour les tooltips */
        advanced_tooltips_observer: undefined,
    };

    function getI18N(item) {
        if (!item)
            return;
        return item?.[lang] !== 'TODO' ? item?.[lang] : (item?.en === 'TODO' ? item?.fr : item?.en);
    }

    /////////////////////////////////////////
    // Fonctions utiles / Useful functions //
    /////////////////////////////////////////
    /** @return {string}     website language */
    function getWebsiteLanguage() {
        return document.getElementsByTagName('html')[0].attributes.lang.value;
    }
    /** @return {boolean}     true if button exists */
    function buttonOptimizerElement() {
        return document.getElementById(btn_id);
    }
    /** @return {boolean}    true si la page de l'utilisateur est la page de selection de ville */
    function pageIsWelcome() {
        return document.URL.endsWith('welcome');
    }
    /** @return {boolean}    true si la page de l'utilisateur est la page de la ville */
    function pageIsTown() {
        return document.URL.indexOf('town') > -1;
    }
    /** @return {boolean}    true si la page de l'utilisateur est la page de l'atelier */
    function pageIsWorkshop() {
        return document.URL.endsWith('workshop');
    }
    /** @return {boolean}    true si la page de l'utilisateur est la page principale de sa maison */
    function pageIsHouse() {
        return document.URL.indexOf('town/house/dash') > -1;
    }
    /** @return {boolean}    true si la page de l'utilisateur est la page d'envoi de messages */
    function pageIsMsgReceived() {
        return document.URL.indexOf('town/house/messages') > -1;
    }
    /** @return {boolean}    true si la page de l'utilisateur est la page des améliorations de sa maison */
    function pageIsAmelio() {
        return document.URL.indexOf('town/house/build') > -1;
    }
    /** @return {boolean}    true si la page de l'utilisateur est la page de la porte */
    function pageIsDoors() {
        return document.URL.endsWith('town/door');
    }
    /** @return {boolean}    true si la page de l'utilisateur est la page de la tour de guet */
    function pageIsWatchtower() {
        return document.URL.indexOf('town/watchtower') > -1;
    }
    /** @return {boolean}    true si la page de l'utilisateur est la page du puit */
    function pageIsWell() {
        return document.URL.indexOf('town/well') > -1;
    }
    /** @return {boolean}    true si la page de l'utilisateur est la page de la banque */
    function pageIsBank() {
        return document.URL.indexOf('town/bank') > -1;
    }
    /** @return {boolean}    true si la page de l'utilisateur est la page de la décharge */
    function pageIsDump() {
        return document.URL.indexOf('town/dump') > -1;
    }
    /** @return {boolean}    true si la page de l'utilisateur est la liste des citoyens */
    function pageIsCitizens() {
        return document.URL.endsWith('citizens');
    }
    /** @return {boolean}    true si la page de l'utilisateur est la page des chantiers */
    function pageIsConstructions() {
        return document.URL.endsWith('constructions');
    }
    /** @return {boolean}    true si la page de l'utilisateur est la page du désert */
    function pageIsDesert() {
        return document.URL.indexOf('desert') > -1;
    }
    /** @return {boolean}    true si la page de l'utilisateur est la page du forum */
    function pageIsForum() {
        return document.URL.indexOf('forum') > -1;
    }
    /** @return {boolean}    true si la page de l'utilisateur est une âme */
    function pageIsSoul() {
        return document.URL.indexOf('soul') > -1;
    }
    /** @return {boolean}    true si la page est un historique de ville */
    function pageIsTownHistory() {
        return document.URL.indexOf('town') > -1 && (document.URL.indexOf('me') > -1 || document.URL.indexOf('soul') > -1);
    }
    /** @return {boolean}    true si la page de l'utilisateur est liste omniscience */
    function pageIsOmniscience() {
        return document.URL.endsWith('omniscience');
    }
    /** @return {boolean}    on doit refresh le user actuel si le jour de la ville est différent du jour précédent */
    function shouldRefreshMe() {
        // Si on est pendant l'attaque, on ne fait rien
        const during_attack = document.querySelector('.during-attack');
        if (during_attack)
            return false;
        // si on change de ville on force le refresh
        const game_clock = document.querySelector('.game-clock[data-town-id]');
        if (!game_clock)
            return false;
        const current_town_id = game_clock?.getAttribute('data-town-id');
        if (isNaN(current_town_id) && +state.mh_user.townDetails?.townId === 0)
            return false;
        if (+current_town_id !== +(state.mh_user.townDetails?.townId ?? 0))
            return true;
        const current_town_day = game_clock?.querySelector('.day-number');
        if (!current_town_day)
            return true;
        // si on change de jour, on force le refresh
        return +current_town_day.innerText.replace(/(\D)*/, '') > +state.mh_user.townDetails?.day;
    }

    function getStorageItem(key) {
        return new Promise((resolve, error) => {
            try {
                GM.getValue(key).then((result) => {
                    resolve(result);
                });
            }
            catch (error) {
                try {
                    browser.storage.local.get(key).then((result) => {
                        resolve(result[key]);
                    });
                }
                catch (error) {
                    try {
                        chrome.storage.local.get(key).then((result) => {
                            resolve(result[key]);
                        });
                    }
                    catch (error) {
                        console.error(error);
                    }
                }
            }
        });
    }
    function setStorageItem(key, value) {
        try {
            return GM.setValue(key, value);
        }
        catch (error) {
            try {
                const key_value = {};
                key_value[key] = value;
                return browser.storage.local.set(key_value);
            }
            catch (error) {
                try {
                    const key_value = {};
                    key_value[key] = value;
                    return chrome.storage.local.set(key_value);
                }
                catch (error) {
                    console.error(error);
                }
            }
        }
    }

    const changelogs = {
        '1.1.49': `
        [Correction] Estimations depuis la mise à jour du site
    `,
        '1.1.48': `
        [Correction] La liste de courses ne s'affichait pas dans l'interface
    `,
        '1.1.47': `
        [Amélioration] Ajout de liens vers les pages des villes des outils externes sur la page de choix de ville
    `,
        '1.1.46': `
        [Correction] Ajustement de la taille de certains filtres de la liste des citoyens
        [Correction] Il y avait un bug de dupliquation des liens vers les outils externes dans la popup d'utilisateur
    `,
        '1.1.45': `
        [Correction] Le compteur anti-abus ne fonctionnait pas correctement (mais on s'en rapproche de plus en plus !)

        [Amélioration] Remise en forme du calculateur de camping intégré à la page
    `,
        '1.1.44': `
        [Correction] Les champs de recherche de la page de chantiers, de la page de veille et de la liste des destinataires ne fonctionnaient pas
        [Correction] Le compteur anti-abus ne fonctionnait pas correctement (on croise les doigts pour que ce soit la bonne)

        [Amélioration] L'affichage du changelog permet également de consulter les anciens changelogs
    `,
        '1.1.43': `
        [Correction] La mise à jour de la carte de GH après une mise à jour des outils externes fonctionne de nouveau correctement sans recharger toute la page

        [Nouveauté] Deux nouvelles options permettent d'afficher des filtres sur les pages de liste des citoyens et d'omniscience
    `,
        '1.1.42': `
        [Correction] La mise à jour depuis la maison ne fonctionnait plus
    `,
        '1.1.41': `
        [Correction] Typo
        [Correction] Les appels ne fonctionnent plus
    `,
        '1.1.40': `
        [Correction] Fix de l'update des outils externes suite à la mise à jour de mi-saison
        [Correction] Affichage de la liste de courses dans la page

        [Amélioration] Remaniement des options du script pour plus de clarté

        [Nouveauté] Option pour trier la liste des citoyens et l'omniscience
    `,
        '1.1.39.0': `
        [Correction] Fix de l'update des outils externes suite à la mise à jour de mi-saison
    `,
        '1.1.38.0': `
        [Correction] Modifications dans la gestion de la wishlist
    `,
        '1.1.37.0': `
        [Correction] Corrige l'affichage des auras sur les objets de la liste de courses
    `,
        '1.1.36.0': `
        [Amélioration] Les tooltips améliorés indiquent désormais sur quel élément de la recette cliquer
    `,
        '1.1.35.0': `
        [Correction] Changement de comportement complet pour le tooltip amélioré pour en fluidifier et corriger l'usage. Merci Emmet pour le coup de main

        [Amélioration] Affichage compact des recettes dans le tooltip amélioré
        [Amélioration] Ajout d'informations sur les propriétés des statuts et objets

        [Nouveauté] Personnalisation des informations affichées dans le tooltip via des options distinctes (attention, ça désactive les options en question il faut les réactiver)
        [Nouveauté] Ajout de la traduction sur les tooltips des objets
    `,
        '1.1.34.0': `
        [Correction] Changement de comportement complet pour le tooltip amélioré pour en fluidifier et corriger l'usage. Merci Emmet pour le coup de main

        [Amélioration] Affichage compact des recettes dans le tooltip amélioré

        [Nouveauté] Personnalisation des informations affichées dans le tooltip via des options distinctes (attention, ça désactive les options en question il faut les réactiver)
        [Nouveauté] Ajout de la traduction sur les tooltips des objets
    `,
        '1.1.33.0': `
        [Correction] Changement de comportement complet pour le tooltip amélioré pour en fluidifier et corriger l'usage. Merci Emmet pour le coup de main
        [Correction] Correction des cas où le tooltip n'avait pas le conseil "shift" ou le bouton pour fermer une fois figé
        [Correction] Empêche de figer un tooltip qui n'a pas le conseil "shift" affiché
        [Correction] Meilleur affichage des boutons "Wiki" et "Outils" du tooltip

        [Nouveauté] Personnalisation des informations affichées dans le tooltip via des options distinctes
        [Nouveauté] Ajout de la traduction sur les tooltips des objets
    `,
        '1.1.32.0': `
        [Correction] Changement de comportement complet pour le tooltip amélioré pour en fluidifier et corriger l'usage. Merci Emmet pour le coup de main
        [Correction] Correction des cas où le tooltip n'avait pas le conseil "shift" ou le bouton pour fermer une fois figé
        [Correction] Empêche de figer un tooltip qui n'a pas le conseil "shift" affiché
        [Correction] Meilleur affichage des boutons "Wiki" et "Outils" du tooltip

        [Nouveauté] Personnalisation des informations affichées dans le tooltip via des options distinctes
        [Nouveauté] Ajout de la traduction sur les tooltips des objets
    `,
        '1.1.31.0': `
        [Correction] Changement de comportement complet pour le tooltip amélioré pour en fluidifier et corriger l'usage. Merci Emmet pour le coup de main
        [Correction] Meilleur affichage des boutons "Wiki" et "Outils" du tooltip

        [Nouveauté] Personnalisation des informations affichées dans le tooltip via des options distinctes
        [Nouveauté] Ajout de la traduction sur les tooltips des objets
    `,
        '1.1.30.0': `
        [Correction] Changement de comportement complet pour le tooltip amélioré pour en fluidifier et corriger l'usage. Merci Emmet pour le coup de main
        [Correction] Meilleur affichage des boutons "Wiki" et "Outils" du tooltip

        [Nouveauté] Personnalisation des informations affichées dans le tooltip via des options distinctes
        [Nouveauté] Ajout de la traduction sur les tooltips des objets
    `,
        '1.1.29.0': `
        [Correction] Changement de comportement complet pour le tooltip amélioré pour en fluidifier et corriger l'usage. Merci Emmet pour le coup de main
    `,
        '1.1.28.0': `
        [Correction] Le filtre sur les noms d'objets dans la page de la décharge ne fonctionnait plus
    `,
        '1.1.27.0': `
        [Correction] Meilleure stabilité à l'ouverture d'un sac
    `,
        '1.1.26.0': `
        [Correction] Tentative de fix des 429 en ville
    `,
        '1.1.25.0': `
        [Correction] Tentative de fix des 429 en ville
    `,
        '1.1.24.0': `
        [Correction] Le script fonctionne avec la nouvelle URL de gh
        [Correction] 429 quand on n'est pas en ville
        [Correction] Certains cas pour lesquels le sac ne s'ouvrait pas automatiquement avec l'option cochée

        [Divers] Retrait de la mise à jour BBH (BBH ne fonctionne plus)
    `,
        '1.1.23.0': `
        [Correction] Affichage du wiki dans le script
        [Correction] Affichage d'erreurs 503 lors de l'attaque
    `,
        '1.1.22.0': `
        [Correction] Mise à jour infinie
    `,
        '1.1.21.0': `
        [Correction] Fix l'erreur 400 au début d'une ville
    `,
        '1.1.20.0': `
        [Correction] Affichage de MHO suite au changement de saison
    `,
        '1.1.19.0': `
        [Correction] Affichage des chantiers
        [Correction] Compteur anti-abus
        [Correction] Affichage en cas d'erreur des outils externes avec CSS
    `,
        '1.1.18.0': `
        [Correction] Affichage des chantiers
    `,
        '1.1.17.0': `
        [Nouveauté] Le script envoie les informations de la page à FataMorgana y compris hors mode chaos
    `,
        '1.1.16.0': `
        [Correction] Le script ne s'affichait plus en cas de wishlist
    `,
        '1.1.15.0': `
        [Correction] Affichage de la banque dans la fenêtre "Outils"
        [Correction] Retrait de l'onglet "Liste de courses" de la fenêtre "Outils" devenu obsolète (à retrouver sur le site)
    `,
        '1.1.14.0': `
        [Correction] Correctif de l'envoi des données de fouineur à Fata Morgana
    `,
        '1.1.13.0': `
        [Correction] Envoi des données d'éclaireur et de fouineur
        [Correction] Anti-abus
    `,
        '1.1.12.0': `
        [Nouveauté] Ajout d'une option pour envoyer les informations issues des métiers (éclaireur, fouineur) à Fata Morgana
    `,
        '1.1.11.0': `
        [Nouveauté] Ajout d'une option pour envoyer les informations issues des métiers (éclaireur, fouineur) à Fata Morgana
    `,
        '1.1.10.1': `
        [Nouveauté] Ajout d'une option pour envoyer les informations issues des métiers (éclaireur, fouineur) à Fata Morgana
    `,
        '1.1.10.0': `
        [Nouveauté] Ajout d'une option pour envoyer les informations issues des métiers (éclaireur, fouineur) à Fata Morgana
    `,
        '1.1.9.0': `
        [Correction] Corrige la liste de courses
    `,
        '1.1.8.0': `
        [Correction] Corrige la liste de courses
    `,
        '1.1.7.0': `
        [Correction] Corrige l'appel en boucle sur la page de l'âme quand on n'est pas incarné
    `,
        '1.1.6.0': `
        [Correction] Affichage des PA manquants sur les chantiers en pandé

        [Amélioration] Performances globales & stabilité

        [Nouveauté] Il est possible d'afficher un compteur de caractères sur le chatcase
        [Nouveauté] Il est possible de relire les anciennes notifications (tant qu'on n'a pas refresh sa page)
    `,
        '1.1.5.0': `
        [Correction] Affichage des PA manquants sur les chantiers en pandé

        [Amélioration] Performances globales & stabilité

        [Nouveauté] Il est possible d'afficher un compteur de caractères sur le chatcase
        [Nouveauté] Il est possible de relire les anciennes notifications (tant qu'on n'a pas refresh sa page)
    `,
        '1.1.4.0': `
        [Correction] Réparations diverses sur les recettes des objets
    `,
        '1.1.3.0': `
        [Correction] Affiche correctement les doublons d'éléments dans les recettes sur les objets
    `,
        '1.1.2.0': `
        [Correction] Affiche correctement les doublons d'éléments dans les recettes sur les objets
    `,
        '1.1.1.0': `
        [Correction] Ajout de diverses propriétés manquantes sur les objets
        [Correction] Corrige l'envoi du sac à dos à MHO
    `,
        '1.1.0.0': `
        Mise à jour de compatibilité (ou presque) avec la S18
    `,
        '1.0.33.0': `
        [Correction] Divers correctifs d'affichage
    `,
        '1.0.32.0': `
        [Correction] Textes manquants dans certains tooltips
    `,
        '1.0.31.0': `
        [Nouveauté] Ajout d'informations sur les tooltips améliorés des statuts
    `,
        '1.0.30.0': `
        [Correction] Libellé dans le tooltip des objets (l'info "en sac" était affichée au lieu de "en banque")
        [Correction] La mise à jour en chaos ne fonctionnait pas
    `,
        '1.0.29.0': `
        [Correction] Les boutons pour incrémenter les valeurs des chantiers avaient disparu
    `,
        '1.0.28.0': `
        [Correction] Correctif du calcul du camping sur la case


        html[lang]
        lang
        fr
    `,
        '1.0.27.0': `
        [Correction] Correctif du calcul du camping sur la case


        html[lang]
        lang
        fr
    `,
        '1.0.26.0': `
        [Correction] La copie du registre ne copie plus les lignes masquées par le filtre

        [Modification] Retrait de la notion de "priorité" dans la liste de courses et affichage des couleurs en fonction de la position
    `,
        '1.0.25.0': `
        [Correction] L'enregistrement à la tour de guet ne fait plus planter l'affichange de l'attaque estimée
    `,
        '1.0.24.0': `
        [Correction] On essaye de faire en sorte que les barres de réparation en pandé ne débordent plus
        [Correction] Retrait du localhost dans la liste des matchs
    `,
        '1.0.23.0': `
        [Correction] On essaye de faire en sorte que les barres de réparation en pandé s'affichent tout le temps, et pas juste quand elles ont envie
    `,
        '1.0.22.0': `
        [Correction] Divers bugs d'affichage
    `,
        '1.0.21.0': `
        [Nouveauté] La mise à jour des outils externes avec l'option statut activé met également à jour l'information indiquant si le bain a été pris ou non
    `,
        '1.0.20.0': `
        [Mise à jour du nom du script] Le script s'appellera désormais MHO Addon
    `,
        '1.0.19.0': `
        [Correction] Le compteur personnalisé de l'anti-abus ne comptait qu'une minute
    `,
        '1.0.18.0': `
        [Correction] Problèmes d'affichage
        [Correction] Erreur lors de l'ajout d'un objet à la liste de courses
    `,
        '1.0.17.0': `
        [Correction] La récupération automatique de l'identifiant externe est de nouveau disponible

        [Amélioration] Diverses améliorations de performance (en tout cas on espère :D)

        [Nouveauté] Ajout d'une option permettant de pré-remplir un message dans la maison quand vous souhaitez envoyer un objet et que le message est vide. Le message est pré-rempli avec des valeurs prises au hasard parmi celles dispo pour votre langue. Actuellement, il n'y a qu'un seul message par langue mais vous pouvez me faire vos suggestions pour que j'en ajoute ;)
        [Nouveauté] Ajout d'une option pour afficher en jeu les expéditions issues de MHO sur lesquelles vous êtes inscrit
    `,
        '1.0.16.0': `
        [Correction] Déploiement d'un hotfix suite à l'introduction d'un bug. La récupération automatique de votre identifiant externe pour les apps n'est pour l'instant plus disponible.
    `,
        '1.0.15.0': `
        [Amélioration] Les mises à jour disponibles sont désormais signalées par un indicateur visuel et un nouveau lien fait son apparition dans le menu en cas de mise à jour disponible
        [Amélioration] Les changelogs ne sont plus affichés au chargement de l'application mais signalés par un indicateur visuel sur le menu

        [Nouveauté] Une nouvelle option fait son apparition pour Fata Morgana : l'envoi du nombre de zombies tués
    `,
        '1.0.14.0': `
        [Correction] Traductions manquantes
        [Correction] Notification de fin de fouille
        [Correction] Divers bugs depuis la version 1.0.8.0

        [Amélioration] Une nouvelle option est disponible pour mettre à jour Fata Morgana en ville dévastée
    `,
        '1.0.13.0': `
        [Correction] Traductions manquantes
        [Correction] Notification de fin de fouille
        [Correction] Divers bugs depuis la version 1.0.8.0

        [Amélioration] Une nouvelle option est disponible pour mettre à jour Fata Morgana en ville dévastée
    `,
        '1.0.12.0': `
        [Correction] Traductions manquantes
        [Correction] Notification de fin de fouille

        [Amélioration] Une nouvelle option est disponible pour mettre à jour Fata Morgana en ville dévastée
    `,
        '1.0.11.0': `
        [Correction] Traductions manquantes
        [Correction] Notification de fin de fouille

        [Amélioration] Une nouvelle option est disponible pour mettre à jour Fata Morgana en ville dévastée
    `,
        '1.0.10.0': `
        [Correction] Traductions manquantes
        [Correction] Notification de fin de fouille

        [Amélioration] Une nouvelle option est disponible pour mettre à jour Fata Morgana en ville dévastée
    `,
        '1.0.9.0': `
        [Correction] Lors de l'enregistrement des fouilles, les fouilles de celui qui enregistre n'étaient jamais prises en compte
        [Correction] Correction d'un bug d'affichage des liens vers les profils externes des utilisateurs
        [Correction] Quelques corrections sur l'Anti-Abus (c'est pas fini, et j'ai l'impression de pas en voir le bout 🥲)
        [Correction] Correction d'un bug d'intégration avec Fata Morgana

        [Suppression] Retrait de la fonctionnalité de notification lors d'un nouveau message, puisqu'elle existe maintenant nativement dans MyHordes
    `,
        '1.0.8.0': `
        [Amélioration] Une nouvelle option est disponible pour mettre à jour Fata Morgana en ville dévastée
    `,
        '1.0.7.0': `
        [Correction] Lors de l'enregistrement des fouilles, les fouilles de celui qui enregistre n'étaient jamais prises en compte
        [Correction] Correction d'un bug d'affichage des liens vers les profils externes des utilisateurs
        [Correction] Quelques corrections sur l'Anti-Abus (c'est pas fini, et j'ai l'impression de pas en voir le bout 🥲)
        [Correction] Correction d'un bug d'intégration avec Fata Morgana

        [Suppression] Retrait de la fonctionnalité de notification lors d'un nouveau message, puisqu'elle existe maintenant nativement dans MyHordes
    `,
        '1.0.6.0': `
        [Correction] Affichage et enregistrement des estimations de la tour de guet dans l'extension Firefox

        [Amélioration] Plus besoin d'appuyer sur Entrée pour démarrer une traduction, elle se lancera automatiquement à chaque recherche de plus de 2 lettres
        [Amélioration] Indicateur visuel sur le bouton de copie du registre quand la copie est effectuée

        [Nouveauté] Ajout de liens vers les profils externes dans la popup d'un utilisateur
    `,
        '1.0.5.0': `
        [Correction] La première prise en banque ne compte de nouveau plus dans l'anti-abus
        [Correction] Traductions

        [Nouveauté] Champs de recherche sur la page de décharge
        [Nouveauté] Affichage du % de voracité sur la jauge
    `,
        '1.0.4.0': `
        [Correction] Le bouton pour ajouter un objet à la liste de courses n'apparait désormais plus sur les objets de l'outil Banque
        [Correction] L'erreur de "CloneInto" devrait être (enfin) corrigée
        [Correction] Le wiki des recettes est de nouveau accessible dans l'extension
    `,
        '1.0.3.0': `
        [Correction] Corrige l'affichage du bouton de mise à jour des outils externes sous chrome
        [Correction] Corrige la récupération de la liste de courses quand elle existe
    `,
        '1.0.2.0': `
        [Correction] Corrige l'affichage de l'icône de succès après une mise à jour des outils externes sur petit écran en mode compact
        [Correction] Corrige l'affichage du loader sur les tooltips qui était en allemand alors qu'il ne devait pas avoir de texte
        [Correction] L'affichage du tooltip d'APAG est désormais plus propre
        [Correction] Corrige le calcul du camping qui prenait en compte la mauvaise valeur pour le bâtiment

        [Nouveauté] Ajout d'un bouton pour cocher tous les paramètres
    `,
        '1.0.1.0': `
        Cette version contient des changements techniques importants. Pour cette raison, il faudra peut être remettre en place toutes vos options.

        [Correction] Corrige le problème de chargement intempestif bloquant MyHordes.

        [Amélioration] Ajout d'une option sur chaque outil externe pour choisir si on souhaite qu'il soit rafraîchi au changement d'onglet ou non. Si vous comptiez sur cette fonctionnalité qui était déjà en place, n'oubliez pas d'aller l'activer dans les options.
    `,
        '1.0.0.0': `
        Cette version contient des changements techniques importants. Pour cette raison, il faudra peut être remettre en place toutes vos options.

        [Correction] Corrige le problème de chargement intempestif bloquant MyHordes.

        [Amélioration] Ajout d'une option sur chaque outil externe pour choisir si on souhaite qu'il soit rafraîchi au changement d'onglet ou non. Si vous comptiez sur cette fonctionnalité qui était déjà en place, n'oubliez pas d'aller l'activer dans les options.
    `,
        '1.0.0': `
        Cette version contient des changements techniques importants. Pour cette raison, il faudra peut être remettre en place toutes vos options.

        [Correction] Corrige le problème de chargement intempestif bloquant MyHordes.

        [Amélioration] Ajout d'une option sur chaque outil externe pour choisir si on souhaite qu'il soit rafraîchi au changement d'onglet ou non. Si vous comptiez sur cette fonctionnalité qui était déjà en place, n'oubliez pas d'aller l'activer dans les options.
    `,
        '1.0.0-beta.73': `
        [Correction] Affichage des calculs de camping
    `,
        '1.0.0-beta.72': `
        [Correction] Lien de mise à jour du script en cas de script pas à jour
        [Correction] Mise à jour du calculateur de camping en S16
        [Correction] Correction de l'affichage des réparations en pandemonium
        [Correction] Corrige la prise de ration dans l'anti-abus

        [Amélioration] Le script ne devrait plus afficher plusieurs erreurs simultanées en cas de multiples appels en erreur en même temps
        [Amélioration] Les objets trouvables dans un bâtiment sont triés par probabilité
    `,
        '1.0.0-beta.71': `
        [Correction] Correction de l'affichage des informations complémentaires sur un bâtiment

        [Amélioration] Mise en place de méthodes pour limiter le nombre d'appels à l'API MyHordes
    `,
        '1.0.0-beta.70': `
        [Correction] Correctifs de l'affichage des chantiers à réparer en pandé

        [Amélioration] Les erreurs issues de MH sont désormais mieux gérées et affichées
        [Amélioration] Le bloc des informations complémentaires indique désormais les objets trouvables dans le bâtiment
    `,
        '1.0.0-beta.69': `
        [Amélioration] Le filtre pour masquer les chantiers terminés ne masque plus les chantiers ayant pris des dégâts
        [Amélioration] Correctifs sur les estimations
        [Amélioration] Le bloc des informations complémentaires indique désormais si le bâtiment est vide
    `,
        '1.0.0-beta.68': `
        [Correction] La copie du registre retire désormais les espaces en trop en début de ligne

        [Amélioration] Les différents filtres ne tiennent désormais plus compte des accents
        [Amélioration] Amélioration visuelle du bloc d'informations complémentaires

        [Nouveauté] Ajout d'un filtre pour masquer les chantiers terminés
    `,
        '1.0.0-beta.67': `
        [Correction] Correction d'un bug l'enregistrement de la valeur du 0 de la tdg

        [Nouveauté] Un message sera désormais affiché au chargement du script si celui-ci n'est pas à sa version la plus récentes.
    `,
        '1.0.0-beta.66': `
        [Correction] Correction d'un bug l'enregistrement de la valeur du 0 de la tdg

        [Nouveauté] Un message sera désormais affiché au chargement du script si celui-ci n'est pas à sa version la plus récentes.
    `,
        '1.0.0-beta.65': `
        [Correction] Correction d'un bug l'enregistrement de la valeur du 0 de la tdg

        [Nouveauté] Un message sera désormais affiché au chargement du script si celui-ci n'est pas à sa version la plus récentes.
    `,
        '1.0.0-beta.64': `
        [Correction] Correction d'un bug l'enregistrement des valeurs de la tdg

        [Amélioration] Tentative d'amélioration des tooltips pour afficher un scroll en cas de recettes
        [Amélioration] Le tooltip amélioré affiche désormais le lieu de dépose d'un objet de la liste de courses
        [Amélioration] La liste de course embarquée dans la page est désormais triée par priorité et n'affiche que les objets présents sur la case
    `,
        '1.0.0-beta.63': `
        [Correction] Correction d'un bug sur les options d'escorte qui n'étaient pas forcément les bonnes après une actualisation
    `,
        '1.0.0-beta.62': `
        [Correction] Bug de recherche dans le nom d'un chantier
    `,
        '1.0.0-beta.61': `
        [Correction] Divers correctifs d'affichage des paramètres en particulier sur mobile ou sur petit écran
    `,
        '1.0.0-beta.60': `
        [Amélioration] Déplacement de la barre de traduction qui pouvait chevaucher des éléments du jeu
        [Amélioration] Amélioration de l'affichage des paramètres en particulier sur mobile ou sur un écran assez petit pour provoquer un défilement dans les paramètres
    `,
        '1.0.0-beta.59': `
        Attention certains changements peuvent avoir impacté vos options sélectionnées, assurez-vous que tout est en ordre !

        [Correction] Corrige l'affichage de certaines images qui ne s'affichaient pas toujours
        [Correction] Corrige la prise en compte du métier dans l'outil intégré de calcul de camping

        [Amélioration] Réorganisation du menu dans lequel les options commençaient à prendre trop de place
        [Amélioration] Séparation de certaines options (mise à jour en ville dévastée et envoi du nombre de zombies tués / champs de recherches)

        [Nouveauté] Ajout d'une option pour enregistrer les estimations de la TDG dans MHO, consulter les valeurs enregistrées et les copier pour le forum
        [Nouveauté] Ajout d'une option pour afficher un champ de recherche sur le registre
        [Nouveauté] Ajout d'une option pour choisir ses options d'escorte à appliquer à l'activation de l'attente d'escorte
        [Nouveauté] Ajout d'une option pour notifier l'utilisateur en cas d'inactivité de plus de 5 minutes si il n'a pas relâché l'escorte ou qu'il ne s'est pas mis en attente d'escorte
    `,
        '1.0.0-beta.58': `
        [Correction] Corrige certains comportements du compteur anti-abus

        [Nouveauté] Ajoute un bouton de copie du registre

        [Remise en place] Réintègre l'option d'envoi des améliorations de maison. Un nouveau bouton sera créé sur la page des améliorations
    `,
        '1.0.0-beta.57': `
        [Correction] Corrige l'affichage du bouton de mise à jour sur petit écran si le mode compact n'est pas activé dans les options
        [Correction] Corrige certains comportements du compteur anti-abus
        [Correction] Devrait corriger l'affichage des images qui était parfois cassé

        [Amélioration] Le bouton d'accès aux options du script est désormais aggrandi sur les petits écrans
    `,
        '1.0.0-beta.56': `
        [Correction] Corrige l'affichage du nombre de zombies morts sur la case
    `,
        '1.0.0-beta.55': `
        [Correction] Le nombre de charges d'APAG restantes était mal enregistré
    `,
        '1.0.0-beta.54': `
        [Nouveauté] Ajout d'une option permettant d'activer un mode compact sur mobile pour le bouton de mise à jour des outils externes
    `,
        '1.0.0-beta.53': `
        [Nouveauté] Ajout d'une option permettant d'activer un mode compact sur mobile pour le bouton de mise à jour des outils externes
    `,
        '1.0.0-beta.52': `
        [Correction] Correction de l'affichage des tooltips améliorés suite à la mise à jour de MyHordes
        [Correction] Correction d'un bug de duplication des lignes des prises en banque dans l'outil de suivi de l'anti-abus

        [Attention] Les améliorations de la maison ne sont plus envoyées à MHO et à GH suite à là mise à jour de MyHordes. J'essaierai de trouver une solution pour rétablir cette fonctionnalité mais sans certitudes.
    `,
        '1.0.0-beta.51': `
        [Correction] Correction de divers comportements

        [Nouveauté] Ajout d'une option pour afficher un compteur de prises en banque
    `,
        '1.0.0-beta.50': `
        [Correction] Correction de divers comportements

        [Amélioration] Devrait désormais fonctionner avec Greasemonkey

        [Nouveauté] Ajout d'une option pour ouvrir automatiquement le menu "Utiliser un objet de son sac"
    `,
        '1.0.0-beta.49': `
        [Correction] Typo
        [Correction] Affichage du warning en cas de registre incomplet
    `,
        '1.0.0-beta.48': `
        [Correction] La valeur de la clôture est envoyée correctement à GH
    `,
        '1.0.0-beta.47': `
        [Correction] Boucle infinie quand on était pris en escorte (oups)
        [Correction] Affichage des pa manquants pour que le chantier ne soit pas détruit dans la nuit
    `,
        '1.0.0-beta.46': `
        [Correction] La copie de la carte de BBH fonctionne à nouveau
        [Correction] La taille des tooltips d'aide est de nouveau convenable
    `,
        '1.0.0-beta.45': `
        [Correction] Suppression d'erreurs en console
        [Correction] La carte ne s'ouvrait plus
    `,
        '1.0.0-beta.44': `
        [Amélioration] Visuel de la note qui est affichée si l'option de fouilles est activée mais que les données de fouilles ne sont pas complètes
    `,
        '1.0.0-beta.43': `
        [Correction] Ajout de traductions manquantes

        [Amélioration] Une note est affichée sur la carte si l'option de fouilles est activée mais que les données de fouilles ne sont pas complètes (lignes du registre non chargées)
    `,
        '1.0.0-beta.42': `
        [Correction] Position de l'icône MHO

        [Amélioration] Lors d'une mise à jour de GH, la page n'est plus intégralement rechargée, seulement sa carte

        [Suppression] Suite à une discussion avec l'équipe de MyHordes (qui fait elle-même suite à une discussion intense sur le forum monde), la fonctionnalité d'informations complémentaires sur les citoyens - appelée par certains "Omniscience++" ou "O++" pour les plus flemmards - a été supprimée.
    `,
        '1.0.0-beta.41': `
        [Correction] Réparation du menu qui passait sous les éléments d'interface de MH suite à des modifications de leur côté
    `,
        '1.0.0-beta.40': `
        [Amélioration] Traductions et wording divers
        [Amélioration] Regroupement des options de champs de recherches en une seule option

        [Nouveauté] Ajout d'un simulateur de camping directement disponible sur la case
        [Nouveauté] Ajout d'une option permettant d'afficher des notes sur une case, issues de la carte de MHO
    `,
        '1.0.0-beta.39': `
        [MH][Amélioration] Le rafraichissement de la liste de courses devrait fonctionner correctement
    `,
        '1.0.0-beta.38': `
        [MH][Correction] Le lien vers le site était invalide

        [MH][Amélioration] Traductions espagnoles (merci Bacchus)
        [MH][Amélioration] La mise à jour de la liste de courses depuis la fenêtre "Outils" a été retirée et confiée explusivement au site
    `,
        '1.0.0-beta.37': `
        [MH][Amélioration] Traductions espagnoles (merci Bacchus)
        [MH][Amélioration] La mise à jour de la liste de courses depuis la fenêtre "Outils" a été retirée et confiée exclusivement au site
    `,
        '1.0.0-beta.36': `
        [MH][Amélioration] Ajout des chances de réussite du manuel dans le tooltip associé
    `,
        '1.0.0-beta.35': `
        [MH][Nouveauté] Ajout d'une option pour filtrer les destinataires des messages
    `,
        '1.0.0-beta.34': `
        [MH][Nouveauté] Ajout d'une option pour recevoir des notifications navigateur en cas de changement dans le nombre de notifications MH
    `,
        '1.0.0-beta.33': `
        [MH][Correction] Correction du lien vers la doc utilisé dans tampermonkey

        [MH][Amélioration] Déplacement du lien du site tout en haut de la liste des options (j'espère que cette fois tout le monde sera au courant qu'il existe 😊)
    `,
        '1.0.0-beta.32': `
        [MH][Correction] Correction des styles qui écrasaient les puces de MH dans les forums (désolée :( )

        [MH][Amélioration] Ajout de traductions (anglaises et allemandes) - merci Xochi, Crazy Unicorn, Nekomine !
    `,
        '1.0.0-beta.31': `
        [MH][Correction] Digs => searches

        [MH][Amélioration] Prise en compte de la quantité d'objets dans les sacs dans la liste de courses
    `,
        '1.0.0-beta.30': `
        [MH][Correction] La liste des citoyens présents sur la case envoyée à MHO était vide si il n'y avait qu'une personne sur la case
    `,
        '1.0.0-beta.29': `
        [MH][Amélioration] Replacement du bouton de suppression de l'id externe pour les apps par un bouton de modification
        [MH][Amélioration] Correctifs visuels sur la page d'informations complémentaires sur les citoyens

        [MH][Nouveauté] Ajout d'une option pour remonter à MHO le résultat de vos fouilles. Des outils de lectures et de modification sont à votre disposition sur le site
    `,
        '1.0.0-beta.28': `
        [MH][Correction] Correction de la mise à jour des outils externes si 0 charges d'APAG
    `,
        '1.0.0-beta.27': `
        [MH-beta][Correction] Réparation de la liste des objets : le Serpent Agonisant n'existait pas dedans, ce qui provoquait des erreurs en cas de mise à jour avec un serpent agonisant
        [MH][Correction]La carte intégrée de GH est réparée (mais non, elle n'intègre toujours pas les expéditions)

        [MH][Amélioration] La liste des citoyens améliorée, en ville, est désormais mieux organisée, et toujours rangée par ordre alphabétique. Contrepartie : elle est légèrement plus longue à charger
        [MH][Amélioration] Le Passage en Force fait désormais partie des AH enregistrées
    `,
        '1.0.0-beta.26': `
        [MH-beta][Amélioration] MHO supporte maintenant la mise à jour de FataMorgana en beta
    `,
        '1.0.0-beta.25': `
        [MH-beta][Correction] Correctif de l'envoi d'informations dans GH
    `,
        '1.0.0-beta.24': `
        [Correction] Remise en place de l'URL d'appels API qui avait disparue (magic everywhere)

        [MH-beta] désactivation des appels vers BBH & Fata. Ils seront réactivés en cas d'existance d'une version compatible beta. Les options restent toujours visibles mais n'auront pas d'effet
    `,
        '1.0.0-beta.23': `
        Ajout du script sur le site de la bêta de MH - aucune nouveauté
    `,
        '1.0.0-beta.22': `
        Ajout du script sur le site de la bêta de MH - aucune nouveauté
    `,
        '1.0.0-beta.21': `
        Ajout du script sur le site de la bêta de MH - aucune nouveauté
    `,
        '1.0.0-beta.20': `
        [Correction] Divers correctifs pour anticiper des plantages
    `,
        '1.0.0-beta.19': `
        [Correction] Le script plante si l'utilisateur n'a pas d'actions héroïques
    `,
        '1.0.0-beta.18': `
        [Correction] L'état "Corps Sain" n'était jamais envoyé à GH
    `,
        '1.0.0-beta.17': `
        [Correction] Il était impossible d'enregistrer le sac à dos dans MHO si vous aviez deux fois le même objet dedans (oups)
    `,
        '1.0.0-beta.16': `
        [Nouveauté] Deux nouvelles options sont disponibles pour mettre à jour GH : la mise à jour automatique des pouvoirs héroïques et la mise à jour des améliorations de maison ! Pensez à les activer dans vos options !
    `,
        '1.0.0-beta.15': `
        [Correction] Envoi des bonnes informations à GH
    `,
        '1.0.0-beta.14': `
        [Nouveauté] Possibilité d'enregistrer des informations complémentaires dans MHO. Pensez à cocher les options associées !
    `,
        '1.0.0-beta.13': `
        [Correction] Correctif du comportement à la mise à jour de GH
    `,
        '1.0.0-beta.12': `
        [Correction] Correctif des erreurs liées à la mise à jour du contenu des sacs
    `,
        '1.0.0-beta.11': `
        [Correction] L'affichage du bouton suite à des mises à jour devrait être corrigé !
    `,
        '1.0.0-beta.10': `
        [Nouveauté] Il est désormais possible d'enregistrer le contenu de son sac via le bouton de mise à jour des outils externes. Les sacs sont consultables et modifiables depuis la liste des citoyens du site web de MHO.
        N'oubliez pas d'activer l'option associée depuis vos paramètres pour rendre cette mise à jour possible !

        [Traductions] Merci à isaaclw qui nous a fourni quelques traductions en anglais ! Si vous voulez contribuer à la traduction, n'hésitez pas à rejoindre le discord, ou à me contacter en MP
    `,
        '1.0.0-beta.09': `
        [Nouveauté] Il est désormais possible d'enregistrer le contenu de son sac via le bouton de mise à jour des outils externes. Les sacs sont consultables et modifiables depuis la liste des citoyens du site web de MHO.
        N'oubliez pas d'activer l'option associée depuis vos paramètres pour rendre cette mise à jour possible !

        [Traductions] Merci à isaaclw qui nous a fourni quelques traductions en anglais ! Si vous voulez contribuer à la traduction, n'hésitez pas à rejoindre le discord, ou à me contacter en MP
    `,
        '1.0.0-beta.08': `
        [Correction] Correctifs divers pour essayer de faire fonctionner le script pour les utilisateurs ios.
        [Correction] Retrait d'un objet remonté par l'API MH mais qui n'existe plus
        [Correction] Affichage d'une erreur lorsqu'on met à jour les app externes sans les avoir toutes cochées (alors que la mise à jour se passe bien)
    `,
        '1.0.0-beta.07': `
        [Correction] Correctif de l'enregistrement de l'état de case épuisée sur GH
    `,
        '1.0.0-beta.06': `
        [Correction] Correctif de l'enregistrement du nombre de zombies tués sur GH

        [Important] Nous avons changé la structure de la base de données. Nous n'avons pas récupéré les listes de courses existantes. Si vous avez besoin de conserver votre liste de course, merci de nous contacter sur le discord de MHO pour qu'on vous la récupère.
    `,
        '1.0.0-beta.05': `
        [Nouveauté] Interface permettant de récupérer les évolutions de chaque citoyen (dans la page de citoyens)
        [Nouveauté] Nouvelle option permettant d'envoyer à GH le nombre de zombies tués sur la case afin de mettre des marqueurs zombies

        [Important] Nous avons changé la structure de la base de données. Nous n'avons pas récupéré les listes de courses existantes. Si vous avez besoin de conserver votre liste de course, merci de nous contacter sur le discord de MHO pour qu'on vous la récupère.
    `,
        '1.0.0-beta.04': `
        [Important] Nous avons changé la structure de la base de données. Nous n'avons pas récupéré les listes de courses existantes. Si vous avez besoin de conserver votre liste de course, merci de nous contacter sur le discord de MHO pour qu'on vous la récupère.
    `,
        '1.0.0-beta.03': `
        [Important] Nous avons changé la structure de la base de données. Nous n'avons pas récupéré les listes de courses existantes. Si vous avez besoin de conserver votre liste de course, merci de nous contacter sur le discord de MHO pour qu'on vous la récupère.
    `,
        '1.0.0-beta.02': `
        [Important] Nous avons changé la structure de la base de données. Nous n'avons pas récupéré les listes de courses existantes. Si vous avez besoin de conserver votre liste de course, merci de nous contacter sur le discord de MHO pour qu'on vous la récupère.
    `,
        '1.0.0-beta.01': `
        [Important] Nous avons changé la structure de la base de données. Nous n'avons pas récupéré les listes de courses existantes. Si vous avez besoin de conserver votre liste de course, merci de nous contacter sur le discord de MHO pour qu'on vous la récupère.
    `,
        '1.0.0-alpha.73': `
        [Correction] Réparation de la recherche de chantiers
    `,
        '1.0.0-alpha.72': `
        [Suppression] Retrait de la fonctionnalité expérimentale de prévention des actions dangereuses (cyanure / dépendance)
    `,
        '1.0.0-alpha.71': `
        [Correction] Réparation du filtre sur les chantiers
    `,
        '1.0.0-alpha.70': `
        [Nouveauté] Ajout du calcul du nombre de zombies qui vont mourir par désespoir sur une case
        [Nouveauté] Il n'est plus nécessaire de renseigner son id d'app externe
    `,
        '1.0.0-alpha.69': `
        [Nouveauté] Ajout du calcul du nombre de zombies qui vont mourir par désespoir sur une case
        [Nouveauté] Il n'est plus nécessaire de renseigner son id d'app externe
    `,
        '1.0.0-alpha.68': `
        [Nouveauté] Ajout du calcul du nombre de zombies qui vont mourir par désespoir sur une case
        [Nouveauté] Il n'est plus nécessaire de renseigner son id d'app externe soi-même
    `,
        '1.0.0-alpha.67': `
        [Correction] On essaie d'améliorer les performances
    `,
        '1.0.0-alpha.66': `
        [Nouveauté] Ajout d'un certificat de sécurité
    `,
        '1.0.0-alpha.65': `
        [Correction] Ajout d'une phrase explicative sur le champ d'ajout d'un objet à la liste de courses

        [Nouveauté] Dans la liste de courses, ajout de la possibilité de sélectionner un endroit où rapporter l'objet (banque ou zone de rapatriement)
    `,
        '1.0.0-alpha.64': `
        [Correction] Ajout d'une phrase explicative sur le champ d'ajout d'un objet à la liste de courses

        [Nouveauté] Dans la liste de courses, ajout de la possibilité de sélectionner un endroit où rapporter l'objet (banque ou zone de rapatriement)
    `,
        '1.0.0-alpha.63': `
        [Correction] Ajout d'une phrase explicative sur le champ d'ajout d'un objet à la liste de courses

        [Nouveauté] Dans la liste de courses, ajout de la possibilité de sélectionner un endroit où rapporter l'objet (banque ou zone de rapatriement)
    `,
        '1.0.0-alpha.62': `
        [Amélioration] Après avoir copié une carte, le texte du bouton informe explicitement l'utilisateur
    `,
        '1.0.0-alpha.61': `
        [Correction] Correction du lien discord qui n'a marché qu'une seule fois avant de décider de manière unilatérale de devenir inutilisable
    `,
        '1.0.0-alpha.60': `
        [Nouveauté] Remplacement du lien mail par un lien discord
        [Nouveauté] Les ajouts d'interface en jeu sont distinctement identifiés comme venant de MHO
    `,
        '1.0.0-alpha.59': `
        [Correction] L'affichage de "l'aura" de priorité ne fonctionnait plus
    `,
        '1.0.0-alpha.58': `
        [Correction] Affichage de la liste de courses dans la page
        [Correction] Affichage de certaines icônes dans les recettes
    `,
        '1.0.0-alpha.57': `
        [Correction] Affichage de la liste de courses dans la page
    `,
        '1.0.0-alpha.56': `
        [Nouveauté] Traduction espagnole (Merci Nekomine !)
    `,
        '1.0.0-alpha.55': `
        [Nouveauté] Traduction espagnole (Merci Nekomine !)
    `,
        '1.0.0-alpha.54': `
        [Correction] En cas d'absence de wishlist enregistrée, l'écran de wishlist ne fonctionnait pas
    `,
        '1.0.0-alpha.53': `
        [Correction] Le positionnement du champ de traduction ne bloque plus le bouton de sondage
    `,
        '1.0.0-alpha.52': `
        [Correction] Images des objets

        [Nouveauté] Ajout d'un bouton pour retirer son ID d'app externes de MHO sans avoir à passer par les paramètres de l'extension
        [Nouveauté] Ajout de la date de dernière mise à jour de la liste des courses dans la page de liste de courses
    `,
        '1.0.0-alpha.51': `
        [Correction] Migration de serveur pour tenter de ne plus avoir de problèmes de quota (on croise les doigts pour que ça marche toujours après ça...). La migration ne concerne malheureusement pas encore le camping et la liste des bâtiments
    `,
        '1.0.0-alpha.50': `
        [Correction] Migration de serveur pour tenter de ne plus avoir de problèmes de quota (on croise les doigts pour que ça marche toujours après ça...). La migration ne concerne malheureusement pas encore le camping et la liste des bâtiments
    `,
        '1.0.0-alpha.49': `
        [Nouveauté] Liste des bâtiments et probabilités sur les objets qu'on peut trouver dedans, tout ça dans "Wiki" > "Bâtiments"

        [Expérimental] Estimnation des chances de survie en camping. Ca se passe dans "Outils" > "Camping"
    `,
        '1.0.0-alpha.48': `
        [Suppression] Suppression de la fonctionnalité d'estimation. Le mode de calcul a comme prévu été changé, rendant la fonctionnalité inefficace
    `,
        '1.0.0-alpha.47': `
        [Amélioration] Ajout du stock en banque et du stock souhaité dans le tooltip avancé
    `,
        '1.0.0-alpha.46': `
        [Amélioration] Traductions pour la fonctionnalité d'estimation de l'attaque (plus que quelques jours pour l'utiliser avant qu'elle ne disparaisse)
    `,
        '1.0.0-alpha.45': `
        [Nouveauté] Nouvelle option, permettant d'afficher le seuil (70% + 1pa) auquel réparer les chantiers pour qu'ils ne soient pas détruits en Pandé
    `,
        '1.0.0-alpha.44': `
        [Expérimental] Fonctionnalité (temporaire) d'estimation de l'attaque
    `,
        '1.0.0-alpha.43': `
        [Expérimental] Fonctionnalité (temporaire) d'estimation de l'attaque
    `,
        '1.0.0-alpha.42': `
        [Correction] Oups, j'avais oublié de réactiver l'option pour la carte, elle était bien implémentée mais impossible de l'activer ^^'
        [Correction] Je tente d'améliorer la fonctionnalité de notification à la fin de la fouille depuis quelques temps, ça semble être plus stable

        [Amélioration] Ajout des PA du café dans le tooltip amélioré
    `,
        '1.0.0-alpha.41': `
        [Nouveauté] Réimplémentation de la fonctionnalité de consultation de carte, qui avait été supprimée.
        Désormais, les cartes sont reconstruites à partir des données récupérées en cliquant sur le bouton "copier".
        Il est donc normal que le design de votre carte ne soit pas identique à celui de votre outil préféré !
    `,
        '1.0.0-alpha.40': `
        [Nouveauté] Réimplémentation de la fonctionnalité de consultation de carte, qui avait été supprimée.
        Désormais, les cartes sont reconstruites à partir des données récupérées en cliquant sur le bouton "copier".
        Il est donc normal que le design de votre carte ne soit pas identique à celui de votre outil préféré !
    `,
        '1.0.0-alpha.39': `
        [Temporaire] Utilisation de l'anglais à la place de l'espagnol tant qu'on n'a pas les traductions espagnoles
    `,
        '1.0.0-alpha.38': `
        [Correction] L'ajout d'une élément de liste de courses à cette liste depuis la page de liste de courses devrait désormais fonctionner correctement
    `,
        '1.0.0-alpha.37': `
        [Correction] Retrait de l'option pour copier les cartes des outils externes suite à un bug Tampermonkey
        [Correction] L'ajout d'une élément de liste de courses à cette liste depuis la page de liste de courses devrait désormais fonctionner correctement
    `,
        '1.0.0-alpha.36': `
        [Correction] L'activation du script provoquait la disparition d'un élément d'arrière-plan du site
    `,
        '1.0.0-alpha.35': `
        [Correction] Quand on refusait une autorisation, on ne pouvait pas accéder au site

        [Amélioration] Ajout du lien vers la documentation dans la description du script, afin que celui-ci soit accessible avant toute installation
    `,
        '1.0.0-alpha.34': `
        [Correction] Tris pas toujours fonctionnels
        [Correction] Affichage du libellé du bouton sur Fata Morgana / Chrome
    `,
        '1.0.0-alpha.33': `
        [Amélioration] Si un des outils externes ne se met pas bien à jour, on affiche le détail des succès et échecs

        [Nouveauté] Prise en chage de Violentmonkey
    `,
        '1.0.0-alpha.32': `
        [Correction] Récupération de la carte depuis GH suite à la nouvelle version (mais la carte est toujours incomplète :'( )

        [Attention] Suite à la mise à jour en V2 de Gest'Hordes, la mise à jour via le script et le site de MHO n'est plus fonctionnelle. Nous travaillons activement à une résolution du problème.
    `,
        '1.0.0-alpha.31': `
        [Nouveauté] Ajout d'un champ de sélection d'objets avec recherche dans la liste de courses
        [Nouveauté] Ajout d'une fonctionnélité permettant de copier une carte d'outil externe (carte complète ou carte de ruine), puis de l'afficher dans MyHordes
    `,
        '1.0.0-alpha.30': `
        [Correction] Corrige de gros ralentissements dans toute l'interface de l'application
    `,
        '1.0.0-alpha.29': `
        [Correction] Corrige de gros ralentissements dans toute l'interface de l'application
    `,
        '1.0.0-alpha.28': `
        [Correction] Résout le problème d'affichage de la barre de menu du jeu quand l'option de traduction est activée

        [Amélioration] Ajout des traductions allemandes pour l'affichage de l'outil de traduction
    `,
        '1.0.0-alpha.27': `
        [Amélioration] Amélioration de la fonctionnalité de traduction (copie d'un libellé, afficher les résultats inexacts)
    `,
        '1.0.0-alpha.26': `
        [Amélioration] Amélioration de la fonctionnalité de traduction (copie d'un libellé, afficher les résultats inexacts)
    `,
        '1.0.0-alpha.25': `
        [Amélioration] Ajout d'une fonctionnalité de traduction des éléments de MyHordes
    `,
        '1.0.0-alpha.24': `
        [Amélioration] Ajout d'une fonctionnalité de traduction des éléments de MyHordes
    `,
        '1.0.0-alpha.23': `
        [Amélioration] Ajout d'une fonctionnalité de traduction des éléments de MyHordes
    `,
        '1.0.0-alpha.22': `
        [Amélioration] Ajout d'une fonctionnalité de traduction des éléments de MyHordes
    `,
        '1.0.0-alpha.21': `
        [Amélioration] Ajout d'une fonctionnalité de traduction des éléments de MyHordes
    `,
        '1.0.0-alpha.20': `
        [Amélioration] Ajout des traductions anglaises et allemandes, merci Katt et Shokolaw
    `,
        '1.0.0-alpha.19': `
        [Amélioration] Refonte des paramètres pour plus de lisibilité

        [Nouveauté] Ajout d'un champ de recherche dans la liste des chantiers
    `,
        '1.0.0-alpha.18': `
        [Correction] Typo

        [Amélioration] Ajout de l'info "Objet de camping" dans le tooltip amélioré
    `,
        '1.0.0-alpha.17': `
        [Nouveauté] Affichage du nombre de zombies morts sur la case aujourd'hui
    `,
        '1.0.0-alpha.16': `
        [Correction] Erreur 500 au chargement du script quand on n'est pas en ville
        [Correction] Comportement de la notification de fouille terminée
    `,
        '1.0.0-alpha.15': `
        [Amélioration] Ajout de certaines propriétés d'objets dans les tooltips améliorés

        [Nouveauté] Ajout d'une option pour être prévenu à la fin de la fouille
    `,
        '1.0.0-alpha.14': `
        [Amélioration] Ajout d'un niveau "trashlist" à la liste de courses, qui s'affiche en gris
        [Amélioration] Changement dans les couleurs des éléments de la liste de courses
        [Amélioration] Les couleurs des priorités d'affichent également sur l'image de l'objet dans la liste de courses intégrée
        [Amélioration] Affichage de certaines propriétés sur les tooltips des objets si l'option "afficher les tooltips détaillés" est activée

        [Nouveauté] [expérimental] Ajout d'une option pour demander une confirmation avant de faire des actions "dangereuses" (consomation de cyanure, consomation de drogue si déjà drogué)
    `,
        '1.0.0-alpha.13': `
        [Correction] Correctif affichage nom du script
    `,
        '1.0.0-alpha.12': `
        [Correction] Ajout à la liste de courses depuis la liste d'objets

        [Amélioration] Affichage des paramètre

        [Nouveauté] Affichage de la version
        [Nouveauté] Affichage du changelog après une mise à jour
    `,
    };

    function convertResponsePromiseToError(response) {
        return response.text().then((text) => {
            let error = new Error(text);
            error.status = response.status;
            error.name = response.statusText;
            throw error;
        });
    }
    function getErrorFromApi(error) {
        if (error.name !== 'AbortError' && error.name !== 'TypeError') {
            let error_text = '';
            error_text += `
            <div>${getI18N(api_texts.error).replace('$error$', (error.status ?? '') + (error.status !== 500 && error.status !== 502 && error.status !== 504 ? ' - ' + (error.message ?? error.name ?? error.statusText) : ''))}</div>
            <br />`;
            if (!isScriptVersionLastVersion()) {
                error_text += `<div><small>${getI18N(api_texts.error_version).replace('$your_version$', getScriptInfo().version).replace('$recent_version$', state.parameters?.find((param) => param.name === 'ScriptVersion')?.value)}</small></div>`;
                error_text += `<small>${getI18N(api_texts.update_script)}</small>`;
            }
            error_text += `<div><small>${getI18N(api_texts.error_discord)}</small><div>`;
            return error_text;
        }
    }
    function isScriptVersionLastVersion() {
        if (!isScript())
            return true;
        const current_script_version = getScriptInfo().version;
        const base_script_version = state.parameters?.find((param) => param.name === 'ScriptVersion')?.value;
        if (!base_script_version)
            return true;
        const comparison_regex = /(\d+)/g;
        const splitted_current = current_script_version.match(comparison_regex);
        const splitted_base = base_script_version.match(comparison_regex);
        return splitted_base.every((part, index) => {
            const is_ok = !splitted_current[index] || splitted_current[index] >= part;
            if (!is_ok) {
                toggleNewVersion(true);
            }
            return is_ok;
        });
    }
    function isNewVersion(version) {
        if (!version || typeof version !== "object") {
            version = {};
            setStorageItem(mho_version_key, version);
        }
        return !version || !version[getScriptInfo().version];
    }
    function toggleNewChangelog(new_changelog) {
        state.has_new_changelog = new_changelog;
        let optimizer_btn = buttonOptimizerElement();
        if (optimizer_btn) {
            if (new_changelog && !optimizer_btn.classList.contains('mho-new-changelog')) {
                optimizer_btn.classList.add('mho-new-changelog');
            }
            else if (optimizer_btn.classList.contains('mho-new-changelog')) {
                optimizer_btn.classList.remove('mho-new-changelog');
            }
            let changelog_item = optimizer_btn.querySelector('#version');
            if (changelog_item) {
                if (new_changelog && !changelog_item.classList.contains('mho-new-changelog')) {
                    changelog_item.classList.add('mho-new-changelog');
                }
                else if (!new_changelog && changelog_item.classList.contains('mho-new-changelog')) {
                    changelog_item.classList.remove('mho-new-changelog');
                }
            }
        }
    }
    function toggleNewVersion(new_version) {
        let optimizer_btn = buttonOptimizerElement();
        if (optimizer_btn) {
            if (new_version && !optimizer_btn.classList.contains('mho-new-version')) {
                optimizer_btn.classList.add('mho-new-version');
            }
            else if (!new_version && optimizer_btn.classList.contains('mho-new-version')) {
                optimizer_btn.classList.remove('mho-new-version');
            }
            let update_item = optimizer_btn.querySelector('#update');
            if (update_item) {
                if (new_version && !update_item.classList.contains('mho-new-version')) {
                    update_item.classList.add('mho-new-version');
                }
                else if (!new_version && update_item.classList.contains('mho-new-version')) {
                    update_item.classList.remove('mho-new-version');
                }
                if (new_version && update_item.parentElement.classList.contains('mho-hidden')) {
                    update_item.parentElement.classList.remove('mho-hidden');
                }
                else if (!new_version && !update_item.parentElement.classList.contains('mho-hidden')) {
                    update_item.parentElement.classList.add('mho-hidden');
                }
            }
        }
    }
    function getOrigin() {
        try {
            GM_info.script;
            return 'script';
        }
        catch (error) {
            try {
                browser.runtime;
                return 'firefox';
            }
            catch (error) {
                try {
                    chrome.runtime;
                    return 'chrome';
                }
                catch (error) {
                    console.error(error);
                }
            }
        }
    }
    function isScript() {
        return getOrigin() === 'script';
    }
    function getScriptInfo() {
        try {
            return GM_info.script;
        }
        catch (error) {
            try {
                return browser.runtime.getManifest();
            }
            catch (error) {
                try {
                    return chrome.runtime.getManifest();
                }
                catch (error) {
                    console.error(error);
                }
            }
        }
    }
    function getChangelog() {
        const version = getScriptInfo().version;
        const content = changelogs[version] ?? `Aucune note de version disponible pour cette mise à jour.`;
        return `${getScriptInfo().name} : Changelog pour la version ${version}
        ${content}`;
    }

    ////////////////
    // Les textes //
    ////////////////
    const texts = {
        website: {
            en: `Website`,
            fr: `Site web`,
            de: `Webseite`,
            es: `Sitio web`
        },
        save_external_app_id: {
            en: `Save your external ID for apps`,
            fr: `Enregistrez votre ID d'app externe`,
            de: `Speichern Sie Ihre externe ID für Apps`,
            es: `Guarde su identificador externo para aplicaciones`
        },
        external_app_id_help: {
            en: `You must have an external ID for apps. <br />You can create it by following “My soul” > “Settings” > “Advanced” > “External Applications” `,
            fr: `Vous devez posséder un ID externe pour les apps. <br />Vous pouvez la créer dans "Votre âme" > "Réglages" > "Avancés" > "Applications externes"`,
            de: `Sie haben eine externe ID für Apps entwickelt. <br />Sie können es wie folgt erstellen “Deine Seele” > “Einstellungen” > “Erweitert” > “Externe Anwendungen” `,
            es: `Debe tener una identificación externa para las aplicaciones. <br />Puedes crearlo siguiendo “Tu alma” > “Configuración” > “Avanzada” > “Aplicaciones Externas”`
        },
        external_app_id_help_label: {
            en: `Help`,
            fr: `Aide`,
            de: `Hilfe`,
            es: `Ayuda`
        },
        tools_btn_label: {
            en: `Tools`,
            fr: `Outils`,
            de: `Werkzeugen`,
            es: `Herramientas`
        },
        parameters_section_label: {
            en: `Parameters`,
            fr: `Paramètres`,
            de: `Einstellungen`,
            es: `Parámetros`
        },
        informations_section_label: {
            en: `Informations`,
            fr: `Informations`,
            de: `Informationen`,
            es: `Informaciones`
        },
        update_external_tools_needed_btn_label: {
            en: `Update external tools`,
            fr: `Mettre à jour les outils externes`,
            de: `Externe Tools Aktualisieren`,
            es: `Actualizar aplicaciones externas`
        },
        update_external_tools_pending_btn_label: {
            en: `Updating...`,
            fr: `Mise à jour en cours...`,
            de: `Aktualisierung...`,
            es: `Actualizando...`
        },
        update_external_tools_success_btn_label: {
            en: `Update completed!`,
            fr: `Mise à jour terminée !`,
            de: `Aktualisierung abgeschlossen!`,
            es: `¡Actualización exitosa!`
        },
        update_external_tools_errors_btn_label: {
            en: `Update completed with errors.`,
            fr: `Mise à jour terminée avec des erreurs.`,
            de: `Aktualisierung mit Fehlern abgeschlossen.`,
            es: `Actualización completada con errores.`
        },
        update_external_tools_fail_btn_label: {
            en: `Can not update.`,
            fr: `Impossible de mettre à jour.`,
            de: `Aktualisierung unmöglich`,
            es: `No se puede actualizar.`
        },
        prevent_from_leaving_information: {
            en: `You asked to be notified before leaving if your escort options were not good: `,
            fr: `Vous avez demandé à être prévenu avant de quitter la page si vos options d'escorte ne sont pas les bonnes : `,
            de: `Sie haben dafür gewählt vor der Abreise benachrichtigt zu werden wenn Ihre Eskorte-Optionen nicht gut waren:`,
            es: `Ha pedido ser notificado antes de cerrar la página si sus opciones de escolta son incorrectas: `
        },
        prevent_not_in_ae: {
            en: `You are not waiting for an escort.`,
            fr: `Vous n'êtes pas en attente d'escorte.`,
            de: `Sie warten nicht auf eine Eskorte.`,
            es: `Su escolta no está activada.`
        },
        escort_not_released: {
            en: `You did not let go of your escort`,
            fr: `Vous n'avez pas relâché votre escorte.`,
            de: `Sie haben Ihre Eskorte nicht losgelassen`,
            es: `No ha soltado a sus acompañantes en escolta.`
        },
        save: {
            en: `Save`,
            fr: `Enregistrer`,
            de: `Speichern`,
            es: `Guardar`
        },
        update: {
            en: `Refresh wishlist`,
            fr: `Rafraîchir la liste`,
            de: `Aktualisieren`,
            es: `Actualizar`
        },
        search_ended: {
            en: `Search completed`,
            fr: `La fouille est terminée`,
            de: `Grabungsaktion fertig`,
            es: `La búsqueda ha finalizado`
        },
        new_message: {
            en: `You have %VAR% new message(s)`,
            fr: `Vous avez %VAR% nouveau(x) message(s)`,
            de: `Sie haben %VAR% neue Nachricht(en)`,
            es: `Tienes %VAR% mensaje(s) nuevo(s)`
        },
        nb_dead_zombies: {
            en: `Number of zombies that died here today`,
            fr: `Nombre de zombies morts sur cette case aujourd'hui`,
            de: `Anzahl der Zombies die heute hier gestorben sind`,
            es: `Número de zombis que han muerto aquí el día de hoy`
        },
        nb_despair_deaths: {
            en: `Amount of zombies that will die from despair`,
            fr: `Nombre de zombies qui vont mourir de désespoir`,
            de: `Anzahl von Zombies, die abwandern werden`,
            es: `Número de zombis que morirán por desesperación`
        },
        copy_map: {
            en: `Copy map`,
            fr: `Copier la carte`,
            de: `Karte kopieren`,
            es: `Copiar el mapa`
        },
        copy_map_end: {
            en: `The map has been copied`,
            fr: `La carte a été copiée`,
            de: `Die Karte wurde kopiert`,
            es: `El mapa ha sido copiado`
        },
        copy_map_end_more: {
            en: `The previous map has been replaced`,
            fr: `La carte précédente a été remplacée`,
            de: `Die vorherige Karte wurde ersetzt`,
            es: `El mapa anterior ha sido reemplazada`
        },
        copy_registry: {
            en: `Copy visible town registry entries`,
            fr: `Copier les entrées visibles du registre`,
            de: `Kopieren Sie sichtbare Stadtregister`,
            es: `Copiar entradas de registro del pueblo visibles`
        },
        translation_file_context: {
            en: `Context (translation file)`,
            fr: `Contexte (fichier de traduction)`,
            de: `Kontext (Übersetzungsdatei)`,
            es: `Contexto (archivo de traducción)`,
        },
        display_all_search_result: {
            en: `Display all results`,
            fr: `Afficher tous les résultats`,
            de: `Alle Ergebnisse anzeigen`,
            es: `Mostrar todos los resultados`
        },
        display_exact_search_result: {
            en: `Only display exact results`,
            fr: `Afficher uniquement les résultats exacts`,
            de: `Nur exakte Ergebnisse anzeigen`,
            es: `Mostrar sólo los resultados exactos`
        },
        missing_ap_explanation: {
            en: `(including %VAR% for the building to stay overnight)`,
            fr: `(dont %VAR% pour que le bâtiment passe la nuit)`,
            de: `(einschließlich %VAR% für das Gebäude zum Übernachten)`,
            es: `(incluyendo %VAR% para que el edificio resista el ataque)`,
        },
        job: {
            en: `Profession`,
            fr: `Métier`,
            de: `Beruf`,
            es: `Oficio`,
        },
        town_type: {
            en: `Town type`,
            fr: `Type de ville`,
            de: `Stadttyp`,
            es: `Tipo de pueblo`,
        },
        ruin: {
            en: `Ruin`,
            fr: `Bâtiment`,
            de: `Ruine`,
            es: `Ruina`,
        },
        pro_camper: {
            en: `Pro Camper`,
            fr: `Campeur professionnel`,
            de: `Proficamper`,
            es: `Campista Experto`,
        },
        distance: {
            en: `Distance from town (in km)`,
            fr: `Distance de la ville (en km)`,
            de: `Entfernung von der Stadt (in km)`,
            es: `Distancia con respecto al pueblo (en km)`,
        },
        digs: {
            en: `Number of piles on the ruin`,
            fr: `Nombre de tas sur le bâtiment`,
            de: `Anzahl der Pfähle am Gebäude`,
            es: `Número de pilotes en el edificio`,
        },
        nb_campings: {
            en: `Number of campsites already made`,
            fr: `Nombre de campings déjà effectués`,
            de: `Anzahl der bereits gemachten Campingplätze`,
            es: `Cantidad de acampes ya realizados`,
        },
        hidden_campers: {
            en: `Number of campers already hidden on the zone`,
            fr: `Nombre de campeurs déjà cachés sur la case`,
            de: `Anzahl der Camper, die bereits auf der Zelle versteckt sind`,
            es: `Cantidad de campistas ya escondidos en la zona`,
        },
        vest: {
            en: `Camouflage Vest`,
            fr: `Tenue de camouflage`,
            de: `Tarnanzug`,
            es: `Camuflaje`,
        },
        tomb: {
            en: `Tomb`,
            fr: `Tombe`,
            de: `Grab`,
            es: `Tumba`,
        },
        night: {
            en: `Night`,
            fr: `Nuit`,
            de: `Nacht`,
            es: `Noche`,
        },
        devastated: {
            en: `Devastated town`,
            fr: `Ville dévastée`,
            de: `Zerstörte Stadt`,
            es: `Pueblo devastado`,
        },
        phare: {
            en: `Lighthouse`,
            fr: `Phare`,
            de: `Leuchtturm`,
            es: `Faro`,
        },
        zombies_on_cell: {
            en: `Zombies on the zone`,
            fr: `Zombies sur la case`,
            de: `Zombies auf der Zelle`,
            es: `Zombis en la zona`,
        },
        objects_in_bag: {
            en: `Skins and tents in the bag`,
            fr: `Pelures et toiles dans le sac`,
            de: `Felle und Zelte in der Tasche`,
            es: `Pellejos y telas en el bolso`,
        },
        improve: {
            en: `Simple improvements (must subtract 3 after each attack)`,
            fr: `Améliorations simples (il faut en soustraire 3 après chaque attaque)`,
            de: `Einfachen Verbesserungen (muss nach jedem Angriff 3 abziehen)`,
            es: `Mejoras simples (hay que restar 3 luego de cada ataque)`,
        },
        object_improve: {
            en: `Defense objects`,
            fr: `Objets de défense`,
            de: `Verteidigungsobjekte`,
            es: `Objetos defensivos`,
        },
        camping_town: {
            en: `The town`,
            fr: `La ville`,
            de: `Die Stadt`,
            es: `El pueblo`,
        },
        camping_citizen: {
            en: `The citizen`,
            fr: `Le citoyen`,
            de: `Der Bürger`,
            es: `El habitante`,
        },
        camping_ruin: {
            en: `The ruin`,
            fr: `Le bâtiment`,
            de: `Die Ruine`,
            es: `La ruina`,
        },
        result: {
            en: `Result`,
            fr: `Résultat`,
            de: `Ergebnis`,
            es: `Resultado`,
        },
        searchObjectToAdd: {
            en: `Find an object to add`,
            fr: `Rechercher un objet à ajouter`,
            de: `Suchen Sie ein hinzuzufügendes Objekt`,
            es: `Encuentre un objeto para agregar`,
        },
        broken: {
            en: `Broken`,
            fr: `Cassé`,
            de: `Kaputt`,
            es: `Roto/a`,
        },
        manually_add_app_id_key: {
            en: `Your external ID could not be retrieved automatically. You can enter it manually here.`,
            fr: `Votre identifiant n'a pas pu être récupéré automatiquement. Vous pouvez le saisir manuellement ici.`,
            de: `Ihr externe ID konnte nicht automatisch abgerufen werden. Sie können ihn hier manuell eingeben.`,
            es: `Ihr Benutzername konnte nicht automatisch abgerufen werden. Sie können ihn hier manuell eingeben.`,
        },
        edit_add_app_id_key: {
            en: `Enter your external ID here.\nYou can also clear the form field to remove it.`,
            fr: `Saisissez votre identifiant externe pour les applications ici.\nVous pouvez vider le champ pour le supprimer.`,
            de: `Bitte hier Deine externe ID eintragen oder den Inhalt des Felds entfernen, um sie zu löschen.`,
            es: `Introduzca su ID externo aquí. También puede borrar el campo del formulario para eliminarlo.`,
        },
        wishlist_moved: {
            en: `Due to too much complexity, the shopping list has been moved to the website.`,
            fr: `Du fait d'une trop grande complexité, la liste de courses a été déplacée sur le site web.`,
            de: `Aufgrund zu großer Komplexität wurde die Einkaufsliste auf die Website verschoben.`,
            es: `Debido a demasiada complejidad, la lista de compras se ha movido al sitio web.`
        },
        go_to_website: {
            en: `Go to website`,
            fr: `Aller sur le site`,
            de: `Gehen Sie zur Website`,
            es: `Ir al sitio`
        },
        note: {
            en: `Box note`,
            fr: `Note de la case`,
            de: `Box-Hinweis`,
            es: `Nota de caja`
        },
        no_note: {
            en: `No note for this box`,
            fr: `Pas de note pour cette case`,
            de: `Keine Hinweis für diese Box`,
            es: `No hay nota para esta caja`
        },
        ruin_dried: {
            en: `The ruin is empty`,
            fr: `Le bâtiment est vide`,
            de: `Die Ruine ist leer`,
            es: `La ruina esta vacia`
        },
        ruin_not_dried: {
            en: `The ruin is not empty`,
            fr: `Le bâtiment n'est pas vide`,
            de: `Die Ruine ist nicht leer`,
            es: `La ruina no está vacía`
        },
        additional_informations: {
            en: `Further information`,
            fr: `Informations complémentaires`,
            de: `Weitere Informationen`,
            es: `Informaciones complementarias`
        },
        anti_abuse_title: {
            en: `Anti-abuse counter`,
            fr: `Compteur anti-abus`,
            de: `Zähler gegen Missbrauch`,
            es: `Contador anti-abuso`
        },
        warn_missing_logs_title: {
            en: `Warning: Missing searches data`,
            fr: `Attention : Données de fouilles manquantes`,
            de: `Warnung: Fehlende Ausgrabungsdaten`,
            es: `Advertencia: Faltan datos de excavación`,
        },
        warn_missing_logs_help: {
            en: `This message appears because you checked the option <strong>"Save successful searches"</strong> and not all of the registry entries in your cell are displayed in the page.<br /><br />You must click the <strong>"Show All Entries"</strong> button at the bottom of the registry for the information to be complete.`,
            fr: `Ce message s'affiche parce que vous avez coché l'option <strong>"Enregistrer les fouilles réussies"</strong> et que toutes les entrées du registre de votre case ne sont pas affichées dans la page.<br /><br />Vous devez cliquer sur le bouton <strong>"Afficher toutes les entrées"</strong> en bas du registre pour que les informations soient complètes.`,
            de: `Diese Meldung wird angezeigt, weil Sie die Option <strong>"Erfolgreiche Ausgrabungen speichern"</strong> aktiviert haben und nicht alle Registrierungseinträge in Ihrer Box auf der Seite angezeigt werden.<br /><br />Sie müssen auf die Schaltfläche <strong >"Alle Einträge anzeigen"</strong> unten in der Registrierung, damit die Informationen vollständig sind.`,
            es: `Este mensaje aparece porque seleccionó la opción <strong>"Guardar excavaciones exitosas"</strong> y no todas las entradas de registro en su casilla se muestran en la página.<br /><br />Debe hacer clic en <strong >"Mostrar todas las entradas"</strong> en la parte inferior del registro para que la información esté completa.`,
        },
        estim_title: {
            en: `Today's attack`,
            fr: `Attaque du jour`,
            de: `Heutiger Angriff`,
            es: `Ataque del día`,
        },
        planif_title: {
            en: `Tomorrow's attack`,
            fr: `Attaque du lendemain`,
            de: `Morgige Abschätzung`,
            es: `Ataque de la noche siguiente`,
        },
        copy_forum: {
            en: `Copy to forum format`,
            fr: `Copier au format forum`,
            de: `In Forumformat kopieren`,
            es: `Copiar al formato del foro`
        },
        copy_forum_watchtower_tooltip: {
            en: `Make sure you save before copying`,
            fr: `Assurez-vous d'avoir enregistré avant de copier`,
            de: `Stellen Sie sicher, dass Sie vor dem Kopieren speichern`,
            es: `Asegúrate de guardar antes de copiar`
        },
        digs_state_header: {
            en: `Digs state`,
            fr: `État des fouilles`,
            de: `Stand der Ausgrabungen`,
            es: `Estado de las excavaciones`
        },
        ruin_state_header: {
            en: `Ruin`,
            fr: `Bâtiment`,
            de: `Ruine`,
            es: `Ruina`
        },
        digs_average: {
            en: `Average remaining digs`,
            fr: `Fouilles moyennes restantes`,
            de: `Verbleibende mittlere Ausgrabungen`,
            es: `Restos de excavaciones medianas`
        },
        digs_max: {
            en: `Maximum remaining digs`,
            fr: `Fouilles maximum restantes`,
            de: `Maximal verbleibende Ausgrabungen`,
            es: `Máximas excavaciones restantes`
        },
        check_all: {
            en: `Check all`,
            fr: `Tout cocher`,
            de: `Alle überprüfen`,
            es: `Comprobar todo`
        },
        can_be_dumped: {
            en: `Can be dumped`,
            fr: `Peut être jeté`,
            de: `Kann weggeworfen werden`,
            es: `Se puede tirar`,
        },
        can_be_recovered: {
            en: `Can be recovered`,
            fr: `Peut être récupéré`,
            de: `Kann wiederhergestellt werden`,
            es: `Se puede recuperar`,
        },
        calculated_attack: {
            en: `Calculated`,
            fr: `Calculée`,
            de: `Berechnet`,
            es: `Calculado`
        },
        external_profiles: {
            en: `External profiles`,
            fr: `Profils externes`,
            de: `Externe Profile`,
            es: `Perfiles externos`,
        },
        external_links: {
            en: `External links`,
            fr: `Liens externes`,
            de: `Externe Links`,
            es: `Enlaces externos`,
        },
        filter_search_name: {
            en: `Search a citizen`,
            fr: `Rechercher un citoyen`,
            de: `Bürger suchen`,
            es: `Buscar ciudadano`
        },
        filter_all: {
            en: `All`,
            fr: `Tous`,
            de: `Alle`,
            es: `Todos`
        },
        filter_online_label: {
            en: `Online status`,
            fr: `Connexion`,
            de: `Status`,
            es: `Estado`
        },
        filter_online_online: {
            en: `Online`,
            fr: `En ligne`,
            de: `Online`,
            es: `En línea`
        },
        filter_online_offline: {
            en: `Offline`,
            fr: `Hors ligne`,
            de: `Offline`,
            es: `Sin conexión`
        },
        filter_location_label: {
            en: `Location`,
            fr: `Emplacement`,
            de: `Ort`,
            es: `Ubicación`
        },
        filter_location_outside: {
            en: `Outside`,
            fr: `Dehors`,
            de: `Draußen`,
            es: `Fuera`
        },
        filter_location_inside: {
            en: `In town`,
            fr: `En ville`,
            de: `In der Stadt`,
            es: `En la ciudad`
        },
        filter_house_level_label: {
            en: `Habitation`,
            fr: `Habitation`,
            de: `Haus`,
            es: `Casa`
        },
        filter_stars_label: {
            en: `Activity`,
            fr: `Activité`,
            de: `Aktivität`,
            es: `Actividad`
        },
        filter_chest_items_label: {
            en: `Chest`,
            fr: `Coffre`,
            de: `Truhe`,
            es: `Cofre`
        },
        filter_selected_count: {
            en: 'selected',
            fr: 'sélectionné(s)',
            de: 'ausgewählt',
            es: 'seleccionado(s)'
        },
        camping_calculator: {
            en: 'Camping calculator',
            fr: 'Calculateur de camping',
            de: 'Campingrechner',
            es: 'Calculadora de camping'
        }
    };
    const status_texts = {
        head_wounded: {
            en: `Alters messages on the Town Forum`,
            fr: `Déforme les messages sur le Forum Ville`,
            de: `Verändert Nachrichten im Stadtforum`,
            es: `Deforma los mensajes en el Foro del Pueblo`,
        },
        hand_wounded: {
            en: `Prevents the use of certain items`,
            fr: `Empêche l'utilisation de certains objets`,
            de: `Verhindert die Nutzung bestimmter Gegenstände`,
            es: `Impide el uso de ciertos objetos`,
        },
        arm_wounded: {
            en: `Prevents working on projects or handling the gate`,
            fr: `Empêche de travailler aux chantiers ou de manipuler la porte`,
            de: `Verhindert Arbeiten an Projekten oder das Bedienen des Tors`,
            es: `Impide trabajar en proyectos o manipular la puerta`,
        },
        leg_wounded: {
            en: `20% chance to prevent movement in the desert while consuming the AP`,
            fr: `20% de chances d'empêcher un déplacement dans le désert tout en consommant le PA`,
            de: `20% Chance, Bewegung in der Wüste zu verhindern, während AP verbraucht werden`,
            es: `20% de probabilidad de impedir el movimiento en el desierto mientras se consume el PA`,
        },
        zombies_killed: {
            en: `Zombies killed while on watch`,
            fr: `Zombies tués en veille`,
            de: `Zombies, die während der Wache getötet wurden`,
            es: `Zombis eliminados mientras estás de guardia`,
        },
        watch_survival_chances: {
            en: `Survival chances while on watch`,
            fr: `Chances de survie en veille`,
            de: `Überlebenschancen während der Wache`,
            es: `Probabilidades de supervivencia mientras estás de guardia`,
        },
        success_digs_changes: {
            en: `Success chances for digging`,
            fr: `Chances de réussite des fouilles`,
            de: `Erfolgsaussichten der Ausgrabungen`,
            es: `Probabilidades de éxito de las excavaciones`,
        },
        terror: {
            en: `Chances of being terrorized in case of an overflow`,
            fr: `Chances d'être terrorisé en cas de débordement`,
            de: `Wahrscheinlichkeit, im Falle eines Überlaufs terrorisiert zu werden`,
            es: `Posibilidades de ser aterrorizado en caso de desbordamiento`,
        },
        prevent_infection: {
            en: `Chances of not becoming infected following an injury`,
            fr: `Chances de ne pas être infecté des suites d'une blessure`,
            de: `Chancen, sich nach einer Verletzung nicht zu infizieren`,
            es: `Probabilidades de no infectarse tras una lesión`,
        },
        fatal_infection: {
            en: `Chances of dying from an infection`,
            fr: `Chances de mourir d'une infection`,
            de: `Sterblichkeitsrisiko durch eine Infektion`,
            es: `Probabilidades de morir por una infección`,
        }
    };
    const jobs = [
        {
            id: 'citizen',
            img: 'basic',
            label: {
                de: `Einwohner`,
                en: `Citizen`,
                es: `Resident`,
                fr: `Habitant`
            },
            camping_factor: 0.9
        },
        {
            id: 'scavenger',
            img: 'dig',
            label: {
                de: `Buddler`,
                en: `Scavenger`,
                es: `Excavador`,
                fr: `Fouineur`
            },
            camping_factor: 0.9
        },
        {
            id: 'scout',
            img: 'vest',
            label: {
                de: `Aufklärer`,
                en: `Scout`,
                es: `Explorador`,
                fr: `Éclaireur`
            },
            camping_factor: 0.9
        },
        {
            id: 'guardian',
            img: 'shield',
            label: {
                de: `Wächter`,
                en: `Guardian`,
                es: `Guardián`,
                fr: `Gardien`
            },
            camping_factor: 0.9
        },
        {
            id: 'survivalist',
            img: 'book',
            label: {
                de: `Einsiedler`,
                en: `Survivalist`,
                es: `Ermitaño`,
                fr: `Ermite`
            },
            camping_factor: 1
        },
        {
            id: 'tamer',
            img: 'tamer',
            label: {
                de: `Dompteur`,
                en: `Tamer`,
                es: `Domador`,
                fr: `Apprivoiseur`
            },
            camping_factor: 0.9
        },
        {
            id: 'technician',
            img: 'tech',
            label: {
                de: `Techniker`,
                en: `Technician`,
                es: `Técnico`,
                fr: `Technicien`
            },
            camping_factor: 0.9
        },
    ];
    const status_list = [
        { id: "clean", img: "status/status_clean.gif", pdc: 1, terror: -3 }, // Jamais drogué
        { id: "hasdrunk", img: "status/status_hasdrunk.gif" }, // A bu
        { id: "haseaten", img: "status/status_haseaten.gif" }, // A mangé
        { id: "camper", img: "status/status_camper.gif", searches: '+10%' }, // A campé
        { id: "immune", img: "status/status_immune.gif", watch_death: -0.01 }, // Immunisé
        { id: "hsurvive", img: "status/status_hsurvive.gif" }, // VLM niveau 1
        { id: "hsurvive2", img: "status/status_hsurvive2.gif" }, // VLM niveau 2
        { id: "hsurvive3", img: "status/status_hsurvive3.gif" }, // VLM niveau 3
        { id: "tired", img: "status/status_tired.gif" }, // Fatigué
        { id: "terror", img: "status/status_terror.gif", watch_def: -30, watch_death: 0.05 }, // Terrorisé
        { id: "thirst1", img: "status/status_thirst1.gif", watch_def: -5 }, // Soif
        { id: "thirst2", img: "status/status_thirst2.gif", watch_def: -10, wath_death: 0.03 }, // Deshy
        { id: "drugged", img: "status/status_drugged.gif", watch_def: 10 }, // Drogué
        { id: "addict", img: "status/status_addict.gif", watch_def: 10, watch_death: 0.06 }, // Dépendant
        { id: "infection", img: "status/status_infection.gif", watch_def: -15, watch_death: 0.1 }, // Infecté
        { id: "drunk", img: "status/status_drunk.gif", watch_def: 15, watch_death: -0.02, searches: '-20%' }, // Ivre
        { id: "hungover", img: "status/status_hungover.gif", watch_def: -15, watch_death: 0.06 }, // Gueule de bois
        {
            id: "wound1",
            img: "status/status_wound1.gif",
            watch_def: -15,
            watch_death: 0.10,
            properties: ['wounded', 'head_wounded']
        }, // Blessure à la tête
        {
            id: "wound2",
            img: "status/status_wound2.gif",
            watch_def: -15,
            watch_death: 0.10,
            properties: ['wounded', 'hand_wounded']
        }, // Blessure à la main
        {
            id: "wound3",
            img: "status/status_wound3.gif",
            watch_def: -15,
            watch_death: 0.10,
            properties: ['wounded', 'arm_wounded']
        }, // Blessure au bras
        {
            id: "wound4",
            img: "status/status_wound4.gif",
            watch_def: -15,
            watch_death: 0.10,
            properties: ['wounded', 'leg_wounded']
        }, // Blessure à la jambe
        {
            id: "wound5",
            img: "status/status_wound5.gif",
            watch_def: -15,
            watch_death: 0.10,
            properties: ['wounded'],
            searches: '/2'
        }, // Blessure à l'oeil
        { id: "wound6", img: "status/status_wound6.gif", watch_def: -15, watch_death: 0.10, properties: ['wounded'] }, // Blessure au pied
        { id: "healed", img: "status/status_healed.gif", watch_def: -15, watch_death: 0.05 }, // Convalescent
        { id: "hydrated", img: "status/status_hydrated.gif", pdc: 1 }, // Hydraté
        { id: "sober", img: "status/status_sober.gif", pdc: 1 }, // Sobre
        {
            id: "good_smell",
            img: "status/status_good_smell.gif",
            terror: -25,
            fatal_infection: -0.25,
            prevent_infection: 0.25
        } // Bonne odeur
    ];
    const api_texts = {
        error: {
            en: `An error occured. (Error : $error$)`,
            fr: `Une erreur s'est produite. (Erreur : $error$)`,
            de: `Fehler aufgetreten. (Fehler : $error$)`,
            es: `Ha ocurrido un error. (Error: $error$)`
        },
        error_version: {
            en: `Your script is not up to date (your version: $your_version$ / most recent version: $recent_version$). Update the script, then try again.`,
            fr: `Votre script n'est pas à jour (votre version : $your_version$ / version la plus récente : $recent_version$). Mettez le script à jour, puis réessayez.`,
            de: `Ihr Skript ist nicht aktuell (Ihre Version: $your_version$ / neueste Version: $recent_version$). Aktualisieren Sie das Skript und versuchen Sie es erneut.`,
            es: `Tu script no está actualizado (tu versión: $your_version$ / versión más reciente: $recent_version$). Actualice el script y vuelva a intentarlo.`
        },
        error_version_startup: {
            en: `Your script is not up to date (your version: $your_version$ / most recent version: $recent_version$).<br /><br />Some features may not work.<br /><br />Update the script to no longer see this error.`,
            fr: `Votre script n'est pas à jour (votre version : $your_version$ / version la plus récente : $recent_version$).<br /><br />Certaines fonctionnalités risquent de ne pas fonctionner.<br /><br />Mettez le script à jour pour ne plus voir cette erreur.`,
            de: `Ihr Skript ist nicht aktuell (Ihre Version: $your_version$ / aktuellste Version: $recent_version$).<br /><br />Einige Funktionen funktionieren möglicherweise nicht.<br /><br />Aktualisieren Sie das Skript, damit dieser Fehler nicht mehr angezeigt wird.`,
            es: `Tu script no está actualizado (su versión: $your_version$ / versión más reciente: $recent_version$).<br /><br />Es posible que algunas funciones no funcionen.<br /><br />Actualice el script para que ya no vea este error.`
        },
        update_script: {
            en: `To update your script, you can use your extension's update functionality or <a target="_blank" href="${getScriptInfo().updateURL}" style="text-decoration: underline;"><i >click on this link</i></a>, then refresh the game page.`,
            fr: `Pour mettre votre script à jour, vous pouvez utiliser la fonctionnalité de mise à jour de votre extension ou <a target="_blank" href="${getScriptInfo().updateURL}" style="text-decoration: underline;"><i>cliquer sur ce lien</i></a>, puis rafraîchir la page du jeu.`,
            de: `Um Ihr Skript zu aktualisieren, können Sie die Aktualisierungsfunktion Ihrer Erweiterung verwenden oder <a target="_blank" href="${getScriptInfo().updateURL}" style="text-decoration: underline;"><i >auf diesen Link klicken</ i></a>, dann aktualisiere die Spieleseite.`,
            es: `Para actualizar su secuencia de comandos, puede utilizar la función de actualización de su extensión o <a target="_blank" href="${getScriptInfo().updateURL}" style="text-decoration: underline;"><i >haga clic en este enlace</ i></a>, luego actualiza la página del juego.`
        },
        error_discord: {
            en: `If the error persists, please let us know on <a href="https://discord.gg/ZQH7ZPWcCm">Discord</a>.`,
            fr: `Si l'erreur persiste, n'hésitez pas à nous la signaler sur <a href="https://discord.gg/ZQH7ZPWcCm">Discord</a>.`,
            de: `Wenn der Fehler weiterhin besteht, teilen Sie uns dies bitte auf <a href="https://discord.gg/ZQH7ZPWcCm">Discord</a> mit.`,
            es: `Si el error persiste, infórmanos en <a href="https://discord.gg/ZQH7ZPWcCm">Discord</a>.`
        },
        update_wishlist_success: {
            en: `Shopping list updated.`,
            fr: `La liste de courses a bien été mise à jour.`,
            de: `Einkaufsliste aktualisiert.`,
            es: `La lista de deseos ha sido actualizada.`
        },
        add_to_wishlist_success: {
            en: `Item has been added to the shopping list.`,
            fr: `L'objet a bien été ajouté à la liste de courses.`,
            de: `Gegenstand wurde der Einkaufsliste hinzugefügt.`,
            es: `El objeto ha sido añadido a la lista de deseos.`
        },
    };
    const action_types = [
        {
            id: `Recipe::ManualAnywhere`,
            label: { en: `Citizen actions`, fr: `Actions du citoyen`, de: `Bürgeraktionen`, es: `Acciones del habitante` },
            ordering: 1
        },
        {
            id: `Recipe::ManualInside`,
            label: {
                en: `Citizen actions inside`,
                fr: `Actions du citoyen à l'intérieur`,
                de: `Bürgeraktionen im Inneren`,
                es: `Acciones del habitante en el interior`
            },
            ordering: 2
        },
        {
            id: `Recipe::ManualOutside`,
            label: {
                en: `Citizen actions outside`,
                fr: `Actions du citoyen à l'extérieur`,
                de: `Bürgeraktionen draußen`,
                es: `Acciones del habitanteen el exterior`
            },
            ordering: 3
        },
        { id: `Recipe::WorkshopType`, label: { en: `Workshop`, fr: `Atelier`, de: `Werkstatt`, es: `Taller` }, ordering: 0 },
        {
            id: `Recipe::WorkshopTypeShamanSpecific`,
            label: { en: `Workshop - Shaman`, fr: `Atelier - Chaman`, de: `Werkstatt - Schamane`, es: `Taller - Chamán` },
            ordering: 4
        },
        {
            id: `Recipe::WorkshopTypeTechSpecific`,
            label: {
                en: `Technicians Workbench`,
                fr: `Établi des Techniciens`,
                de: `Techniker-Werkstatte`,
                es: `Mesa de Trabajo de Técnicos`
            },
            ordering: 5
        },
    ];
    const wishlist_depot = [
        {
            value: -1000,
            label: {
                en: `Do not bring back`,
                fr: `Ne pas ramener`,
                de: `Nicht zurückbringen`,
                es: `No traer de vuelta`
            }
        },
        {
            value: -1,
            label: {
                en: `Not defined`,
                fr: `Non défini`,
                de: `Nicht definiert`,
                es: `Indefinida`
            }
        },
        {
            value: 0,
            label: {
                en: `Bank`,
                fr: `Banque`,
                de: `Bank`,
                es: `Almacén`
            }
        },
        {
            value: 1,
            label: {
                en: `Teleport area`,
                fr: `Zone de rapatriement`,
                de: `Rettungs-Bereich`,
                es: `Zona de volver`
            }
        }
    ];
    const wishlist_title = {
        en: `Wishlist`,
        fr: `Liste de courses`,
        de: `Wunschzettel`,
        es: `Lista de deseos`
    };
    const wishlist_headers = [
        {
            label: {
                en: `Item`,
                fr: `Objet`,
                de: `Gegenstand`,
                es: `Objeto`
            },
            id: `label`
        },
        {
            label: {
                en: `Location`,
                fr: `Dépôt`,
                de: `Ort`,
                es: `Depósito`
            },
            id: `depot`
        },
        {
            label: {
                en: `In bank`,
                fr: `En banque`,
                de: `In der Bank`,
                es: `En el almacén`
            },
            id: `bank_count`
        },
        {
            label: {
                en: `In rucksack`,
                fr: `En sacs`,
                de: `In den Rucksäcken`,
                es: `En las mochilas`
            },
            id: `bag_count`
        },
        {
            label: {
                en: `Desired stock`,
                fr: `Stock souhaité`,
                de: `Gewünschter Bestand`,
                es: `Cantidad deseada`
            },
            id: `bank_needed`
        },
        {
            label: {
                en: `Missing quantity`,
                fr: `Quantité manquante`,
                de: `Fehlende Menge`,
                es: `Cantidad necesaria`
            },
            id: `diff`
        },
        {
            label: { en: ``, fr: ``, es: ``, de: `` },
            id: 'delete'
        },
    ];

    function normalizeString(str) {
        return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    /** Affiche une notification de réussite */
    function addSuccess(message) {
        let notifications = document.getElementById('notifications');
        let notification = document.createElement('div');
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
    function addWarning(message) {
        let notifications = document.getElementById('notifications');
        if (!notifications)
            return;
        let notification = document.createElement('div');
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
    function addError(error) {
        if (typeof error === 'string' || (error.name !== 'AbortError' && error.name !== 'TypeError') && !state.is_error) {
            if (error?.status === 503)
                return;
            let notifications = document.getElementById('notifications');
            let notification = document.createElement('div');
            notification.classList.add('error', 'show');
            let error_text = `
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
    function createNotification(content) {
        try {
            GM_notification({
                text: content,
                title: getScriptInfo().name,
                highlight: true,
                timeout: 0
            });
        }
        catch (error) {
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
            }
            catch (error) {
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
                }
                catch (error) {
                    console.error(error);
                }
            }
        }
    }

    function getItems() {
        return new Promise((resolve, reject) => {
            fetcher(state.api_url + '/Fetcher/items' + (state.mh_user && state.mh_user.townDetails && state.mh_user.townDetails?.townId > 0 ? ('?townId=' + state.mh_user.townDetails?.townId) : ''))
                .then((response) => {
                if (response.status === 200) {
                    return response.json();
                }
                else {
                    return convertResponsePromiseToError(response);
                }
            })
                .then((response) => {
                let new_items = { ...response };
                new_items = response
                    .sort((a, b) => a.category.ordering - b.category.ordering)
                    .filter((item) => is_mh_beta ? true : +item.id !== 302);
                new_items?.forEach((new_item) => {
                    new_item.recipes = new_item?.recipes?.map((recipe) => {
                        let new_recipe = { ...recipe };
                        let new_recipe_components = [];
                        new_recipe.components.forEach((component) => {
                            for (let i = 0; i < component.count; i++) {
                                new_recipe_components.push(component.item);
                            }
                        });
                        new_recipe.components = new_recipe_components;
                        new_recipe.type = action_types.find((type) => type.id === new_recipe.type);
                        if (!new_recipe.type) {
                            console.warn('missing recipe type', recipe.type);
                        }
                        new_recipe.result = new_recipe.result.sort((a, b) => b.probability - a.probability);
                        return new_recipe;
                    });
                });
                state.items = new_items;
                resolve(state.items);
            })
                .catch((error) => {
                addError(error);
                reject(error);
            });
        });
    }

    function getMap() {
        return new Promise((resolve, reject) => {
            fetcher(state.api_url + '/Fetcher/map?townId=' + state.mh_user.townDetails?.townId)
                .then((response) => {
                if (response.status === 200) {
                    return response.json();
                }
                else {
                    return convertResponsePromiseToError(response);
                }
            })
                .then((response) => {
                state.map = response;
                resolve(state.map);
            })
                .catch((error) => {
                addError(error);
                reject(error);
            });
        });
    }

    function getRuins() {
        return new Promise((resolve, reject) => {
            if (!state.ruins) {
                fetcher(state.api_url + '/Fetcher/ruins?userKey=' + state.external_app_id)
                    .then((response) => {
                    if (response.status === 200) {
                        return response.json();
                    }
                    else {
                        return convertResponsePromiseToError(response);
                    }
                })
                    .then((response) => {
                    state.ruins = response.sort((a, b) => {
                        if (getI18N(a.label) < getI18N(b.label)) {
                            return -1;
                        }
                        if (getI18N(a.label) > getI18N(b.label)) {
                            return 1;
                        }
                        return 0;
                    });
                    state.ruins.forEach((ruin) => {
                        ruin.drops.sort((drop_a, drop_b) => {
                            if (drop_a.probability < drop_b.probability) {
                                return 1;
                            }
                            else if (drop_b.probability < drop_a.probability) {
                                return -1;
                            }
                            else {
                                return 0;
                            }
                        });
                    });
                    resolve(state.ruins);
                })
                    .catch((error) => {
                    addError(error);
                    reject(error);
                });
            }
            else {
                resolve(state.ruins);
            }
        });
    }
    /** Récupère les informations de la ville */

    function getWishlist() {
        return new Promise((resolve, reject) => {
            fetcher(state.api_url + '/wishlist?townId=' + state.mh_user.townDetails?.townId)
                .then((response) => {
                if (response.status === 200) {
                    return response.json();
                }
                else {
                    return convertResponsePromiseToError(response);
                }
            })
                .then((response) => {
                state.wishlist = { ...response };
                resolve(state.wishlist);
            })
                .catch((error) => {
                state.wishlist = undefined;
                addError(error);
                reject(error);
            });
        });
    }
    /**
     * Ajoute un élément à la wishlist
     * @param item l'élément à ajouter à la wishlist
     */
    function addItemToWishlist(item) {
        return new Promise((resolve, reject) => {
            fetcher(state.api_url + '/wishlist/add/' + item.id + '?userId=' + state.mh_user.id + '&townId=' + state.mh_user.townDetails?.townId, {
                method: 'POST'
            })
                .then((response) => {
                if (response.status === 200) {
                    return response.text();
                }
                else {
                    return convertResponsePromiseToError(response);
                }
            })
                .then((response) => {
                item.wishListCount = 1;
                resolve(item);
                addSuccess(getI18N(api_texts.add_to_wishlist_success));
            })
                .catch((error) => {
                addError(error);
                reject(error);
            });
        });
    }
    /** Met à jour les outils externes (BBH, GH et Fata) en fonction des paramètres sélectionnés */

    function isTouchScreen() {
        return 'ontouchstart' in window || navigator.msMaxTouchPoints;
    }
    /** Calcule le nombre de zombies qui vont mourir par désespoir */
    function calculateDespairDeaths(nb_killed_zombies) {
        return Math.floor(Math.max(0, (nb_killed_zombies - 1) / 2));
    }
    function fixMhCompiledImg(img) {
        if (!img)
            return;
        return img.replace(/\/(\w+)\.(\w+)\.(\w+)/, '/$1.$3');
    }
    function isValidToken() {
        if (!state.token || !state.token.token || !state.token.token.accessToken)
            return false;
        let expiration_date = new Date(state.token.token.validTo).getTime();
        let current_date = new Date().getTime();
        return !shouldRefreshMe() && current_date < expiration_date;
    }
    function copyToClipboard(text) {
        let input = document.createElement('textarea');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        input.remove();
    }

    function getToken(force, stop) {
        return new Promise((resolve, reject) => {
            if (state.external_app_id) {
                let tokenReceived = async () => {
                    console.log('MHO - I am...', state.mh_user);
                    if (state.mh_user !== '' && state.mh_user !== undefined && state.mh_user !== null) {
                        if (state.mh_user.townDetails?.townId) {
                            let get_items_promise = getItems();
                            let get_wishlist_promise = getWishlist();
                            if (pageIsDesert()) {
                                let get_ruins_promise = getRuins();
                                let get_map_promise = getMap();
                                await Promise.all([get_items_promise, get_ruins_promise, get_wishlist_promise, get_map_promise]);
                            }
                            else {
                                let get_wishlist_promise = getWishlist();
                                await Promise.all([get_items_promise, get_wishlist_promise]);
                            }
                        }
                        else {
                            let get_items_promise = getItems();
                            await Promise.all([get_items_promise]);
                        }
                    }
                };
                if (!isValidToken() || force) {
                    fetcherWithoutBearer(state.api_url + '/Authentication/Token?userKey=' + state.external_app_id)
                        .then((response) => {
                        if (response.status === 200) {
                            return response.json();
                        }
                        else {
                            return convertResponsePromiseToError(response);
                        }
                    })
                        .then((response) => {
                        state.token = response;
                        state.mh_user = state.token.simpleMe;
                        if (!state.mh_user || state.mh_user.id === 0 && state.mh_user.townDetails?.townId === 0) {
                            state.mh_user = '';
                        }
                        setStorageItem(mh_user_key, state.mh_user);
                        setStorageItem(mho_token_key, state.token);
                        tokenReceived().then(() => resolve());
                    })
                        .catch((error) => {
                        if (error.status === 400 && !stop) {
                            /** Si on a une erreur 400 ça peut être parce que la clé d'app n'est pas bonne : on tente de récupérer la clé d'app une seule et unique fois pour essayer de rendre ça transparent pour l'utilisateur */
                            state.external_app_id = undefined;
                            getApiKey().then(() => {
                                getToken(false, true).then(() => {
                                    resolve();
                                });
                            });
                        }
                        else {
                            addError(error);
                            resolve();
                        }
                    });
                }
                else {
                    state.mh_user = state.token.simpleMe;
                    tokenReceived().then(() => resolve());
                }
            }
            else {
                resolve();
            }
        });
    }
    /** Récupère les informations de la ville */

    function getTooltipItem(img, isStatus) {
        let hovered_item;
        let hovered_status;
        if (img && img.src) {
            if (!isStatus) {
                hovered_item = getItemFromImg(img.src);
            }
            else {
                hovered_status = getStatusFromImg(img.src);
            }
        }
        return {
            item: hovered_item,
            status: hovered_status,
            alt: img?.alt
        };
    }
    function getClickedItem(target) {
        let item_icon = event.target.closest('span.item-icon') || event.target.previousElementSibling?.closest('span.item-icon') || event.target.previousElementSibling?.querySelector('span.item-icon');
        if (item_icon) {
            let hovered_item = getItemFromImg(item_icon.querySelector('img').src);
            let broken = item_icon.parentElement.classList.contains('broken');
            return { item: hovered_item, broken: broken };
        }
    }
    function getFixedImagePath(img_src) {
        const index = img_src.indexOf(hordes_img_url);
        if (index === -1) {
            console.warn(`Image source "${img_src}" does not include '${hordes_img_url}' as expected.`, img_src);
            return;
        }
        return img_src
            .slice(index + hordes_img_url.length)
            .replace(/\/(.+)\.(\w+?)\.(\w+?)$/, '/$1.$3')
            .replace('.b.', '.');
    }
    function getItemFromImg(img_src) {
        if (img_src) {
            const img_path = getFixedImagePath(img_src);
            return state.items?.find((item) => item.img === img_path);
        }
    }
    function getStatusFromImg(img_src) {
        if (img_src) {
            const img_path = getFixedImagePath(img_src);
            return status_list.find((status) => status.img === img_path);
        }
    }

    // Local helper: TypeScript's arrFrom(any) sometimes infers element type
    // 'unknown' rather than 'any' when the source isn't a statically-typed
    // iterable. This explicit-any wrapper avoids that, matching the original
    // untyped JS behaviour (no behaviour change, pure typing aid).
    const arrFrom$2 = (x) => Array.from(x);
    function displayAntiAbuseCounter() {
        if (state.anti_abuse_controller) {
            // anti_abuse_controller.abort();
        }
        state.anti_abuse_controller = new AbortController();
        if (!state.mho_parameters.display_anti_abuse || (!pageIsBank() && !pageIsWell())) {
            state.anti_abuse_controller.abort();
            return;
        }
        let mho_anti_abuse_counter = document.querySelector(`#${mho_anti_abuse_counter_id}`);
        if (mho_anti_abuse_counter)
            return;
        mho_anti_abuse_counter = document.createElement('div');
        mho_anti_abuse_counter.id = mho_anti_abuse_counter_id;
        if (pageIsBank()) {
            if (window.innerWidth < 950) {
                const bank_inventory = document.querySelector('#bank-inventory');
                if (!bank_inventory)
                    return;
                const inventory_buttons = bank_inventory.querySelectorAll(':scope > button');
                const last_inventory_button = inventory_buttons[inventory_buttons.length - 1];
                if (!last_inventory_button)
                    return;
                last_inventory_button.parentElement.insertBefore(mho_anti_abuse_counter, last_inventory_button.nextElementSibling);
            }
            else {
                const forum_preview = document.querySelector('.forum-preview-wrapper-bank');
                if (!forum_preview)
                    return;
                forum_preview.parentElement.insertBefore(mho_anti_abuse_counter, forum_preview.parentElement.firstElementChild);
            }
        }
        else {
            const actions_box = document.querySelector('.actions-box');
            if (!actions_box)
                return;
            actions_box.parentElement.insertBefore(mho_anti_abuse_counter, actions_box);
        }
        const header = document.createElement('h5');
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.justifyContent = 'space-between';
        mho_anti_abuse_counter.appendChild(header);
        const first_part = document.createElement('div');
        first_part.innerHTML = `<img src="${mh_optimizer_icon}" style="width: 24px !important; vertical-align: middle; margin-right: 0.5em;">${getI18N(texts.anti_abuse_title)}`;
        header.appendChild(first_part);
        const second_part = document.createElement('div');
        header.appendChild(second_part);
        const content = document.createElement('div');
        content.classList.add('mho-anti-abuse-counter-content');
        mho_anti_abuse_counter.appendChild(content);
        /** Modifie le style du forum pour pouvoir l'afficher proprement malgré la présence du compteur */
        const forum_preview_wrapper_bank = document.querySelector('.forum-preview-wrapper-bank');
        if (forum_preview_wrapper_bank) {
            forum_preview_wrapper_bank.style.minHeight = 'unset';
            const forum_preview_container = forum_preview_wrapper_bank.querySelector('.forum-preview-container');
            if (forum_preview_container) {
                forum_preview_container.style.position = 'initial';
                forum_preview_container.style.padding = '3px';
                const forum_content = forum_preview_container.querySelector('#forum-content');
                if (forum_content) {
                    forum_content.style.position = 'initial';
                }
            }
        }
        /** Fin */
        getStorageItem(mho_anti_abuse_key).then((counter_values) => {
            if (!counter_values) {
                counter_values = [];
            }
            const define_row = (counter_value, new_content, fictive = false) => {
                const is_time_invalid = (_counter_value) => {
                    const since = Date.now() - parseInt(_counter_value.take_at);
                    const time_left = (15 * 60000) - since;
                    if (time_left < 0) {
                        const current_index = counter_values.indexOf(_counter_value);
                        if (current_index > -1) {
                            counter_values.splice(current_index, 1);
                            setStorageItem(mho_anti_abuse_key, [...counter_values]);
                        }
                    }
                    return time_left < 0;
                };
                if (!is_time_invalid(counter_value)) {
                    const value_in_list = document.createElement('div');
                    value_in_list.title = counter_value.item?.item?.label[lang];
                    value_in_list.classList.add('brown-tag');
                    value_in_list.style.width = '85px';
                    new_content.appendChild(value_in_list);
                    const item_name = document.createElement('div');
                    item_name.innerHTML = `<img src="${repo_img_hordes_url + counter_value.item?.item?.img}" style="${counter_value.item?.broken ? 'border: 1px dotted red' : ''}">`;
                    value_in_list.appendChild(item_name);
                    const item_counter = document.createElement('div');
                    const interval = setInterval(() => {
                        if (is_time_invalid(counter_value)) {
                            clearInterval(interval);
                            value_in_list.remove();
                        }
                        else {
                            const since = Date.now() - parseInt(counter_value.take_at);
                            const time_left = (15 * 60000) - since;
                            const minutes = Math.floor(time_left / 60000);
                            const seconds = Math.floor((time_left % 60000) / 1000);
                            item_counter.innerText = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
                        }
                    }, 250);
                    value_in_list.appendChild(item_counter);
                }
            };
            const add_counter_btn = document.createElement('button');
            add_counter_btn.innerText = '+';
            second_part.appendChild(add_counter_btn);
            add_counter_btn.addEventListener('click', () => {
                state.anti_abuse_controller.abort();
                const fictive_item = {
                    label: {
                        de: `Benutzerdefinierter Zähler`,
                        en: `Custom counter`,
                        es: `Contador personalizado`,
                        fr: `Compteur personnalisé`,
                    },
                    img: 'icons/small_warning.gif'
                };
                const counter_value = { item: { item: fictive_item, broken: false }, take_at: Date.now() + 5000 };
                counter_values.push(counter_value);
                setStorageItem(mho_anti_abuse_key, counter_values);
                const new_mho_anti_abuse_counter = document.querySelector(`#${mho_anti_abuse_counter_id}`);
                if (new_mho_anti_abuse_counter) {
                    define_row(counter_value, new_mho_anti_abuse_counter.querySelector('.mho-anti-abuse-counter-content'), true);
                }
            });
            counter_values.forEach((counter_value) => {
                define_row(counter_value, content);
            });
            if (pageIsBank()) {
                const bank = document.querySelector('#bank-inventory');
                let old_bag;
                bank.addEventListener('click', (event) => {
                    event.stopPropagation();
                    const target = event.target;
                    const valid_tags = ['li', 'span', 'img'];
                    if (!valid_tags.includes(target.nodeName.toLowerCase()))
                        return;
                    if (target.classList.length > 0 && !target.classList.contains('item') && !target.classList.contains('item-icon'))
                        return;
                    const rucksack = document.querySelector('#bank-inventory ul.rucksack');
                    if (!rucksack)
                        return;
                    old_bag = document.querySelectorAll('#bank-inventory ul.rucksack li.item');
                    const old_bag_items = arrFrom$2(old_bag).map((item_in_old_bag) => getItemFromImg(item_in_old_bag.querySelector('img').src));
                    state.bank_observer?.disconnect();
                    let observer;
                    const callback = (_mutationsList) => {
                        observer.disconnect();
                        state.bank_observer = undefined;
                        setTimeout(() => {
                            const new_bag = document.querySelectorAll('#bank-inventory ul.rucksack li.item');
                            if ((old_bag?.length ?? 0) < new_bag.length) {
                                getStorageItem(mho_anti_abuse_key).then((stored_values) => {
                                    if (!stored_values) {
                                        stored_values = [];
                                    }
                                    const new_bag_items = arrFrom$2(new_bag).map((item_in_new_bag) => getItemFromImg(item_in_new_bag.querySelector('img').src));
                                    new_bag_items.forEach((new_bag_item, index) => {
                                        const old_item_index = old_bag_items.findIndex((old_bag_item) => old_bag_item.id === new_bag_item.id);
                                        if (old_item_index > -1) {
                                            old_bag_items.splice(old_item_index, 1);
                                        }
                                        else {
                                            const counter_value = {
                                                item: {
                                                    item: new_bag_item,
                                                    broken: new_bag[index].classList.contains('broken')
                                                },
                                                take_at: Date.now() + 2500
                                            };
                                            stored_values.push(counter_value);
                                            counter_values.push(counter_value);
                                            const new_mho_anti_abuse_counter = document.querySelector(`#${mho_anti_abuse_counter_id}`);
                                            if (new_mho_anti_abuse_counter) {
                                                define_row(counter_value, new_mho_anti_abuse_counter.querySelector('.mho-anti-abuse-counter-content'));
                                            }
                                        }
                                    });
                                    setStorageItem(mho_anti_abuse_key, stored_values);
                                    old_bag = new_bag;
                                });
                            }
                            else {
                                old_bag = undefined;
                            }
                        }, 100);
                    };
                    observer = new MutationObserver(callback);
                    state.bank_observer = observer;
                    observer.observe(rucksack, { childList: true, subtree: true, attributes: false });
                }, { signal: state.anti_abuse_controller.signal });
            }
            else if (pageIsWell()) {
                const btn = document.querySelector('button[data-fetch-method="get"][data-fetch-confirm]');
                btn?.addEventListener('click', (_event) => {
                    document.addEventListener('mh-navigation-complete', () => {
                        state.anti_abuse_controller.abort();
                        if (!pageIsWell())
                            return;
                        const well_item = {
                            label: {
                                de: `Eine weitere Ration erhalten`,
                                en: `Extra ration`,
                                es: `Ración adicional`,
                                fr: `Ration supplémentaire`,
                            },
                            img: 'log/well.gif'
                        };
                        getStorageItem(mho_anti_abuse_key).then((stored_values) => {
                            if (!stored_values) {
                                stored_values = [];
                            }
                            const counter_value = { item: { item: well_item, broken: false }, take_at: Date.now() + 5000 };
                            stored_values.push(counter_value);
                            counter_values.push(counter_value);
                            setStorageItem(mho_anti_abuse_key, stored_values);
                            const new_mho_anti_abuse_counter = document.querySelector(`#${mho_anti_abuse_counter_id}`);
                            if (new_mho_anti_abuse_counter) {
                                define_row(counter_value, new_mho_anti_abuse_counter.querySelector('.mho-anti-abuse-counter-content'));
                            }
                        });
                    }, { once: true });
                }, { signal: state.anti_abuse_controller.signal });
            }
            else {
                state.anti_abuse_controller.abort();
            }
        });
    }

    function automaticallyOpenBag(count = 0) {
        if (!state.mho_parameters.automatically_open_bag)
            return;
        const button = document.querySelector('[x-item-action-toggle="1"]');
        const inventories = document.querySelectorAll('hordes-inventory .inventory li.item:not(.locked)');
        if (!button || inventories?.length === 0) {
            if (count < 3)
                setTimeout(() => automaticallyOpenBag(count + 1), 250);
            return;
        }
        const isVisible = !button.getAttribute('style')?.includes('display: none');
        if (!isVisible)
            return;
        // Attendre que le bouton soit prêt via rAF + microtask
        requestAnimationFrame(() => {
            Promise.resolve().then(() => {
                button.click();
                const observer = new MutationObserver(() => {
                    const btn = document.querySelector('[x-item-action-toggle="1"]');
                    if (btn && !btn.getAttribute('style')?.includes('display: none')) {
                        btn.click();
                    }
                });
                inventories.forEach(item => observer.observe(item, { attributes: true }));
            });
        });
    }

    function calculateCamping(camping_parameters) {
        if (camping_parameters.campings < 0 || camping_parameters.campings === null || camping_parameters.campings === undefined || camping_parameters.campings === '') {
            camping_parameters.campings = 0;
        }
        return new Promise((resolve, reject) => {
            fetcher(state.api_url + '/Camping/Calculate', {
                method: 'POST',
                body: JSON.stringify(camping_parameters),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then((response) => {
                if (response.status === 200) {
                    return response.json();
                }
                else {
                    return convertResponsePromiseToError(response);
                }
            })
                .then((camping_result) => {
                let result = document.querySelector('#camping-result');
                if (result) {
                    result.innerText = result ? `${getI18N(camping_result.label)} - ${camping_result.boundedProbability}% (${camping_result.boundedProbability}%)` : '';
                }
                resolve(camping_result);
            })
                .catch((error) => {
                addError(error);
                reject(error);
            });
        });
    }

    //////////////////////////////////
    // La liste des onglets du wiki //
    //////////////////////////////////
    let tabs_list = {
        wiki: [
            {
                ordering: 0,
                id: `items`,
                label: {
                    en: `Items`,
                    fr: `Objets`,
                    de: `Gegenstände`,
                    es: `Objetos`
                },
                icon: repo_img_hordes_url + `emotes/bag.gif`
            },
            {
                ordering: 1,
                id: `recipes`,
                label: {
                    en: `Recipes`,
                    fr: `Recettes`,
                    de: `Rezepte`,
                    es: `Transformaciones`
                },
                icon: repo_img_hordes_url + `building/small_refine.gif`
            },
            {
                ordering: 2,
                id: `ruins`,
                label: {
                    en: `Ruins`,
                    fr: `Bâtiments`,
                    de: `Ruinen`,
                    es: `Ruinas`
                },
                icon: repo_img_hordes_url + `icons/home.gif`,
            }
        ],
        tools: [
            {
                ordering: 0,
                id: `bank`,
                label: {
                    en: `Bank`,
                    fr: `Banque`,
                    de: `Bank`,
                    es: `Almacén`
                },
                icon: repo_img_hordes_url + `icons/home.gif`,
                needs_town: true,
            },
            // {
            //     ordering: 2,
            //     id: `citizens`,
            //     label: {
            //         en: `Citizens`,
            //         fr: `Citoyens`,
            //         de: `Bürger`,
            //         es: `Habitantes`
            //     },
            //     icon: repo_img_hordes_url + `icons/small_human.gif`,
            //     needs_town: true,
            // },
            {
                ordering: 2,
                id: `camping`,
                label: {
                    en: `Camping`,
                    fr: `Camping`,
                    de: `Camping`,
                    es: `Camping`
                },
                icon: repo_img_hordes_url + `status/status_camper.gif`,
                needs_town: false,
            }
        ]
    };

    function getBank() {
        return new Promise((resolve, reject) => {
            fetcher(state.api_url + '/Fetcher/bank')
                .then((response) => {
                if (response.status === 200) {
                    return response.json();
                }
                else {
                    return convertResponsePromiseToError(response);
                }
            })
                .then((response) => {
                let bank = [];
                response.bank.forEach((bank_item) => {
                    bank_item.item.broken = bank_item.isBroken;
                    bank_item.item.wishListCount = bank_item.wishListCount;
                    bank.push(bank_item.item);
                });
                bank = bank.sort((item_a, item_b) => {
                    if (item_a.category.ordering > item_b.category.ordering) {
                        return 1;
                    }
                    else if (item_a.category.ordering === item_b.category.ordering) {
                        return 0;
                    }
                    else {
                        return -1;
                    }
                });
                resolve(bank);
            })
                .catch((error) => {
                addError(error);
                reject(error);
            });
        });
    }
    /** Récupère les informations de liste de course */

    function getRecipes() {
        return new Promise((resolve, reject) => {
            if (!state.recipes) {
                fetcher(state.api_url + '/Fetcher/recipes')
                    .then((response) => {
                    if (response.status === 200) {
                        return response.json();
                    }
                    else {
                        return convertResponsePromiseToError(response);
                    }
                })
                    .then((response) => {
                    let new_recipes = response
                        .map((recipe) => {
                        let new_recipe = { ...recipe };
                        let new_recipe_components = [];
                        new_recipe.components.forEach((component) => {
                            for (let i = 0; i < component.count; i++) {
                                new_recipe_components.push(component.item);
                            }
                        });
                        new_recipe.components = new_recipe_components;
                        new_recipe.type = action_types.find((type) => type.id === new_recipe.type);
                        if (!new_recipe.type) {
                            console.warn('missing recipe type', recipe.type);
                        }
                        return new_recipe;
                    })
                        .sort((a, b) => {
                        if (a.type?.ordering > b.type?.ordering) {
                            return 1;
                        }
                        else if (a.type?.ordering === b.type?.ordering) {
                            return 0;
                        }
                        else {
                            return -1;
                        }
                    });
                    state.recipes = new_recipes;
                    resolve(state.recipes);
                })
                    .catch((error) => {
                    addError(error);
                    reject(error);
                });
            }
            else {
                resolve(state.recipes);
            }
        });
    }
    /** Récupère la liste complète des paramètres en base */

    function displayRecipes() {
        getRecipes().then((recipes) => {
            if (recipes) {
                let tab_content = document.getElementById(mh_optimizer_window_id + '-tab-content');
                let recipes_list = document.createElement('ul');
                recipes_list.id = 'recipes-list';
                tab_content.appendChild(recipes_list);
                recipes.forEach((recipe, index) => {
                    if (index === 0 || recipes[index - 1].type.id !== recipe.type.id) {
                        let category_text = document.createElement('span');
                        category_text.innerText = getI18N(recipe.type.label);
                        let category_container = document.createElement('div');
                        category_container.classList.add('mho-category');
                        category_container.classList.add('mho-header');
                        category_container.appendChild(category_text);
                        recipes_list.appendChild(category_container);
                    }
                    recipes_list.appendChild(getRecipeElement(recipe));
                });
            }
        });
    }
    /** Affiche une recette */
    function getRecipeElement(recipe) {
        let recipe_container = document.createElement('tr');
        recipe_container.classList.add('recipe');
        let recipe_type_container = document.createElement('td');
        recipe_container.appendChild(recipe_type_container);
        let recipe_type_img = document.createElement('img');
        recipe_type_img.title = getI18N(recipe.type.label);
        recipe_type_img.setAttribute('style', 'margin-left: 0.5em; margin-right: 0.5em');
        switch (recipe.type.id ?? recipe.type) {
            case 'Recipe::ManualAnywhere':
                recipe_type_img.src = repo_img_hordes_url + 'log/citizen.gif';
                break;
            case 'Recipe::WorkshopTypeTechSpecific':
                recipe_type_img.src = repo_img_hordes_url + 'building/small_techtable.gif';
                break;
            case 'Recipe::WorkshopType':
            case 'Recipe::WorkshopTypeShamanSpecific':
                recipe_type_img.src = repo_img_hordes_url + 'log/workshop.gif';
                break;
            default:
                recipe_type_img.src = repo_img_hordes_url + 'icons/small_move.gif';
                break;
        }
        recipe_type_container.appendChild(recipe_type_img);
        let compos_cell = document.createElement('td');
        compos_cell.classList.add('items', 'components');
        let compos_container = document.createElement('div');
        recipe.components.forEach((compo) => {
            let compo_container = document.createElement('span');
            compo_container.classList.add('item');
            if (compo.id === recipe.provoking?.id) {
                compo_container.classList.add('mho-recipe-provoking');
            }
            let component_img = document.createElement('img');
            component_img.src = repo_img_hordes_url + fixMhCompiledImg(compo?.item?.img ?? compo?.img);
            component_img.title = getI18N(compo?.item?.label ?? compo?.label);
            compo_container.appendChild(component_img);
            compos_container.appendChild(compo_container);
        });
        compos_cell.appendChild(compos_container);
        recipe_container.appendChild(compos_cell);
        let transform_img_container = document.createElement('td');
        recipe_container.appendChild(transform_img_container);
        let transform_img = document.createElement('img');
        transform_img.alt = '=>';
        transform_img.src = repo_img_hordes_url + 'icons/small_move.gif';
        transform_img.setAttribute('style', 'margin-left: 0.5em; margin-right: 0.5em');
        transform_img_container.appendChild(transform_img);
        let results_cell = document.createElement('td');
        results_cell.classList.add('items', 'results');
        let results_container = document.createElement('div');
        recipe.result.forEach((result) => {
            let result_container = document.createElement('span');
            result_container.classList.add('item');
            let result_img = document.createElement('img');
            result_img.src = repo_img_hordes_url + fixMhCompiledImg(result.item?.img);
            result_img.title = getI18N(result.item.label);
            result_container.appendChild(result_img);
            if (result.probability !== 1) {
                let result_proba = document.createElement('span');
                result_proba.setAttribute('style', 'font-style: italic; color: #ddab76;');
                result_proba.classList.add('label_text');
                result_proba.innerText = Math.round(result.probability * 100) + '%';
                result_container.appendChild(result_proba);
            }
            results_container.appendChild(result_container);
        });
        results_cell.appendChild(results_container);
        recipe_container.appendChild(results_cell);
        return recipe_container;
    }
    /**
     * Crée un bouton d'aide
     * @param {string} text_to_display    Le contenu de la popup d'aide
     */

    function getCurrentPosition() {
        return document.querySelector('.current-location')?.innerText.replace(/.*: ?/, '').split('/') ?? [0, 0];
    }
    function getCellDetailsByPosition() {
        let position = getCurrentPosition();
        if (position && state.map && state.map.cells) {
            return state.map.cells.find((cell) => +cell.displayX === +position[0] && +cell.displayY === +position[1]);
        }
    }

    /** Affiche la liste de courses dans le désert et l'atelier */
    function displayWishlistInApp(count = 0) {
        let wishlist_section = document.getElementById('wishlist-section');
        let is_desert = pageIsDesert();
        let is_workshop = pageIsWorkshop();
        if (state.wishlist && state.mho_parameters.display_wishlist && (is_workshop || is_desert)) {
            if (wishlist_section)
                return;
            let zone_to_insert;
            if (is_workshop) {
                zone_to_insert = document.getElementsByClassName('row-table')[0];
            }
            else {
                zone_to_insert = document.getElementsByClassName('actions-box')[0];
            }
            if (!zone_to_insert)
                return;
            let used_wishlist = getWishlistForZone();
            if (!used_wishlist)
                return;
            let list_to_display = used_wishlist.filter((item) => {
                if (is_workshop) {
                    return item.isWorkshop;
                }
                else {
                    let items_in_cell = Array.from(document.querySelectorAll('.inventory li.item img')).map((item_element) => getItemFromImg(item_element.src));
                    return items_in_cell.some((item_in_cell) => item_in_cell?.id === item.item.id);
                }
            });
            if (is_workshop && list_to_display.length === 0)
                return;
            let refreshWishlist = () => {
                let update_section = document.createElement('div');
                header.appendChild(update_section);
                let last_update = document.createElement('span');
                last_update.classList.add('small');
                last_update.setAttribute('style', 'margin-right: 0.5em;');
                if (state.wishlist.lastUpdateInfo) {
                    last_update.innerText = new Intl.DateTimeFormat('default', {
                        dateStyle: 'medium',
                        timeStyle: 'medium'
                    }).format(new Date(state.wishlist.lastUpdateInfo.updateTime)) + ' - ' + state.wishlist.lastUpdateInfo.userName;
                }
                update_section.appendChild(last_update);
                let update_btn = document.createElement('button');
                update_btn.classList.add('inline');
                update_btn.innerText = getI18N(texts.update);
                update_btn.addEventListener('click', () => {
                    state.is_refresh_wishlist = true;
                    state.wishlist = undefined;
                    wishlist_section = undefined;
                    setTimeout(() => {
                        displayWishlistInApp();
                        getWishlist().then(() => {
                            displayWishlistInApp();
                        });
                    });
                });
                update_section.appendChild(update_btn);
                let list = document.createElement('div');
                list.classList.add('row-table');
                content.appendChild(list);
                let list_header = document.createElement('div');
                list_header.classList.add('row-flex', 'mho-header', 'bottom');
                list.appendChild(list_header);
                wishlist_headers
                    .filter((header_cell_item) => header_cell_item.id !== 'delete')
                    .forEach((header_cell_item) => {
                    let header_cell = document.createElement('div');
                    header_cell.classList.add('padded', 'cell');
                    header_cell.classList.add(header_cell_item.id === 'label' ? 'rw-5' : (header_cell_item.id === 'depot' ? 'rw-3' : 'rw-2'));
                    header_cell.innerText = getI18N(header_cell_item.label);
                    list_header.appendChild(header_cell);
                });
                list_to_display
                    .forEach((item) => {
                    let list_item = document.createElement('div');
                    list_item.classList.add('row-flex');
                    list.appendChild(list_item);
                    let title = document.createElement('div');
                    title.classList.add('padded', 'cell', 'rw-5');
                    title.innerHTML = `<img src="${repo_img_hordes_url + item.item.img}" style="margin-right: 5px" /><span class="small">${getI18N(item.item.label)}</span>`;
                    list_item.appendChild(title);
                    let item_depot = document.createElement('span');
                    item_depot.classList.add('padded', 'cell', 'rw-3');
                    item_depot.innerHTML = `<span class="small">${getI18N(wishlist_depot.find((depot) => item.depot === depot.value).label)}</span>`;
                    list_item.appendChild(item_depot);
                    let bank_count = document.createElement('span');
                    bank_count.classList.add('padded', 'cell', 'rw-2');
                    bank_count.innerHTML = `<span class="small">${item.bankCount}</span>`;
                    list_item.appendChild(bank_count);
                    let bag_count = document.createElement('span');
                    bag_count.classList.add('padded', 'cell', 'rw-2');
                    bag_count.innerHTML = `<span class="small">${item.bagCount}</span>`;
                    list_item.appendChild(bag_count);
                    let bank_need = document.createElement('span');
                    bank_need.classList.add('padded', 'cell', 'rw-2');
                    bank_need.innerHTML = `<span class="small">${item.count >= 0 ? item.count : '∞'}</span>`;
                    list_item.appendChild(bank_need);
                    let needed = document.createElement('span');
                    needed.classList.add('padded', 'cell', 'rw-2');
                    needed.innerHTML = `<span class="small">${item.count >= 0 ? (item.count - item.bankCount - item.bagCount) : '∞'}</span>`;
                    list_item.appendChild(needed);
                });
                if (!state.is_refresh_wishlist) {
                    hide_state.innerText = '>';
                    header_title.show = false;
                    list.classList.add('hidden');
                    update_section.classList.add('hidden');
                }
                else {
                    hide_state.innerText = '˅';
                    header_title.show = true;
                }
                header_title.addEventListener('click', () => {
                    if (header_title.show) {
                        hide_state.innerText = '>';
                    }
                    else {
                        hide_state.innerText = '˅';
                    }
                    list.classList.toggle('hidden');
                    update_section.classList.toggle('hidden');
                    header_title.show = !header_title.show;
                });
                state.is_refresh_wishlist = false;
                displayWishlistInApp();
            };
            wishlist_section = document.createElement('div');
            wishlist_section.id = 'wishlist-section';
            wishlist_section.classList.add('row');
            if (pageIsWorkshop()) {
                zone_to_insert.parentNode.insertBefore(wishlist_section, zone_to_insert.nextSibling);
            }
            else {
                let main_actions = zone_to_insert.parentNode;
                main_actions.parentNode.insertBefore(wishlist_section, main_actions.nextSibling);
            }
            let cell = document.createElement('div');
            wishlist_section.appendChild(cell);
            let header = document.createElement('h5');
            header.setAttribute('style', 'display: flex; justify-content: space-between;');
            cell.appendChild(header);
            let header_title = document.createElement('span');
            header_title.setAttribute('style', 'margin-top: 7px; cursor: pointer;');
            header.appendChild(header_title);
            let hide_state = document.createElement('span');
            hide_state.setAttribute('style', 'margin-right: 0.5em');
            header_title.appendChild(hide_state);
            let header_mho_img = document.createElement('img');
            header_mho_img.src = mh_optimizer_icon;
            header_mho_img.style.height = '24px';
            header_mho_img.style.marginRight = '0.5em';
            header_title.appendChild(header_mho_img);
            let header_label = document.createElement('span');
            header_label.innerText = getI18N(wishlist_title);
            header_title.appendChild(header_label);
            let content = document.createElement('div');
            cell.appendChild(content);
            refreshWishlist();
        }
        else if (wishlist_section) {
            wishlist_section.remove();
        }
        else if (count < 3) {
            setTimeout(() => {
                displayWishlistInApp(count + 1);
            }, 250);
        }
    }
    /** Affiche la priorité directement sur les éléments si l'option associée est cochée */
    function displayPriorityOnItems() {
        if (state.mho_parameters.display_wishlist && pageIsDesert() && state.wishlist) {
            let present_items = [];
            let avalaible_slots = [];
            let used_spaces = [];
            let inventories = document.querySelectorAll('.inventory');
            let rucksacks = document.querySelectorAll('.inventory.rucksack, .inventory.rucksack-escort');
            if (inventories) {
                for (let inventory of inventories) {
                    present_items.push(...inventory?.querySelectorAll('li.item:not(.locked):not(.plus)') || []);
                }
            }
            if (rucksacks) {
                for (let rucksack of rucksacks) {
                    avalaible_slots.push(...rucksack?.querySelectorAll('li.free, li.item:not(.locked):not(.plus)') || []);
                }
            }
            let used_wishlist = getWishlistForZone();
            let item_count = avalaible_slots.length;
            let heavy_slots = avalaible_slots.filter((slot) => slot.classList.contains('bg-heavy')).length;
            if (used_wishlist) {
                let count = 0;
                let heavy_count = 0;
                used_wishlist
                    .forEach((wishlist_item) => {
                    present_items
                        .filter((present_item) => fixMhCompiledImg(present_item.querySelector('img').src).indexOf(wishlist_item.item.img) > 0)
                        .forEach((present_item) => {
                        if (wishlist_item.depot >= -1) {
                            let priority_in = false;
                            if (count < item_count) {
                                if (wishlist_item.item.isHeaver) {
                                    if (heavy_count < heavy_slots) {
                                        priority_in = true;
                                    }
                                    heavy_count++;
                                }
                                else {
                                    priority_in = true;
                                }
                            }
                            if (priority_in) {
                                present_item.classList.add('priority_in');
                                count++;
                            }
                            else {
                                present_item.classList.add('priority_out');
                            }
                        }
                        else if (wishlist_item.depot < -1) {
                            present_item.classList.add('priority_trash');
                        }
                    });
                });
            }
        }
    }
    function getWishlistForZone() {
        if (!state.wishlist || !state.wishlist.wishList)
            return undefined;
        if (!pageIsDesert())
            return [...state.wishlist.wishList];
        let position = getCurrentPosition();
        let current_zone = (Math.abs(position[0]) + Math.abs(position[1])) * 2 - 3;
        let used_wishlist = [...state.wishlist.wishList.filter((wishlist_item) => wishlist_item.zoneXPa === 0 || wishlist_item.zoneXPa >= current_zone)];
        used_wishlist?.sort((item_a, item_b) => {
            return item_b.priority - item_a.priority;
        });
        return used_wishlist;
    }
    /** @param {HTMLElement} tooltip_container */

    function enhanceTooltip(tooltip_container) {
        if (!tooltip_container)
            return;
        // Identifier l'objet actuellement dans le tooltip natif
        let img = tooltip_container.querySelector('h1 > img:last-child');
        const isStatus = !img;
        if (isStatus) {
            const label = tooltip_container.querySelector('h1')?.textContent.trim();
            img = document.querySelector(`li.status > img[alt="${label}"]`);
        }
        if (!img)
            return;
        const imgPath = getFixedImagePath(img.src);
        if (!imgPath)
            return;
        // Vérifier si le tooltip amélioré existant correspond déjà au bon objet
        const existing = tooltip_container.querySelector('.mho-advanced-tooltip');
        if (existing) {
            if (existing.getAttribute('x-icon-path') === imgPath) {
                // Déjà enrichi avec le bon objet, rien à faire
                return;
            }
            // Le tooltip a été réutilisé par MH pour un autre objet : on nettoie
            existing.remove();
            const existingHints = tooltip_container.querySelectorAll('.mho-shift-hint, .mho-close-hint');
            existingHints.forEach(el => el.remove());
        }
        tooltip_container.addEventListener('click', (e) => e.stopImmediatePropagation());
        let item_or_status = getTooltipItem(img, isStatus);
        let item = item_or_status.item;
        let status = item_or_status.status;
        if (!item && !status)
            return;
        const buildAdvancedTooltipContainer = () => {
            const c = document.createElement('div');
            c.classList.add('mho-advanced-tooltip');
            c.setAttribute('x-icon-path', imgPath);
            return c;
        };
        let advanced_tooltip_container;
        if (item) {
            let item_deco = tooltip_container.getElementsByClassName('item-tag-deco')[0];
            let should_display = state.mho_parameters.enhanced_tooltips && state.mho_parameters.enhanced_tooltips_items && ((state.mho_parameters.enhanced_tooltips_item_quantities && tooltip_container) ||
                (state.mho_parameters.enhanced_tooltips_item_properties && item.properties) ||
                (state.mho_parameters.enhanced_tooltips_item_actions && item.actions) ||
                (state.mho_parameters.enhanced_tooltips_item_recipes && item.recipes.length > 0) ||
                state.mho_parameters.enhanced_tooltips_item_translations ||
                (item_deco && item.deco > 0));
            if (should_display) {
                advanced_tooltip_container = buildAdvancedTooltipContainer();
                createAdvancedProperties(advanced_tooltip_container, item, tooltip_container);
            }
        }
        else {
            let should_display = state.mho_parameters.enhanced_tooltips && state.mho_parameters.enhanced_tooltips_statuses && (status.watch_def !== undefined || status.watch_kills !== undefined ||
                status.searches !== undefined || status.terror !== undefined ||
                status.fatal_infection !== undefined || status.prevent_infection !== undefined ||
                status.properties?.length > 0);
            if (should_display) {
                advanced_tooltip_container = buildAdvancedTooltipContainer();
                createAdvancedStatus(advanced_tooltip_container, status, tooltip_container);
            }
        }
        if (advanced_tooltip_container) {
            tooltip_container.appendChild(advanced_tooltip_container);
            addFreezeHintsToTooltip(tooltip_container);
        }
    }
    function addFreezeHintsToTooltip(tooltip_container) {
        if (tooltip_container.querySelector('.mho-shift-hint'))
            return;
        const h1 = tooltip_container.querySelector('h1');
        if (!h1)
            return;
        if (!h1.classList.contains('flex')) {
            h1.classList.add('flex');
        }
        const shift = document.createElement('kbd');
        shift.classList.add('mho-shift-hint');
        shift.innerText = `⇧`;
        const close = document.createElement('img');
        close.classList.add('mho-close-hint');
        close.src = `${repo_img_hordes_url}icons/b_close.png`;
        close.alt = `close`;
        const separator = document.createElement('div');
        separator.style.flex = '1';
        h1.prepend(shift, close, separator);
    }
    function observeNewTooltips(tries = 10) {
        if (state.advanced_tooltips_observer)
            return;
        const tooltip_container = document.querySelector('#tooltip_container');
        if (!tooltip_container) {
            if (tries > 0) {
                setTimeout(observeNewTooltips, 100, tries - 1);
            }
            else {
                console.warn('tooltip_container not found');
            }
            return;
        }
        state.advanced_tooltips_observer = new MutationObserver((records, observer) => {
            for (const record of records) {
                for (const node of record.addedNodes) {
                    if (node instanceof HTMLElement && node.classList.contains('item')) {
                        enhanceTooltip(node);
                    }
                }
                const tooltipItem = record.target.closest?.('.item');
                if (tooltipItem && !record.addedNodes.length) {
                    enhanceTooltip(tooltipItem);
                }
            }
        });
        state.advanced_tooltips_observer.observe(tooltip_container, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style']
        });
    }
    /** Affiche les tooltips avancés */
    function displayAdvancedTooltips() {
        if (state.mho_parameters.enhanced_tooltips && state.items) {
            initTooltipFreezeOnShift();
            // observation des bulles qui apparaîtront plus tard
            observeNewTooltips();
            // traitement des bulles déjà présentes
            document.querySelectorAll('#tooltip_container > .item').forEach(function (element) {
                enhanceTooltip(element);
            });
        }
    }
    function initTooltipFreezeOnShift() {
        if (initTooltipFreezeOnShift._initialized)
            return;
        initTooltipFreezeOnShift._initialized = true;
        let frozenTooltip = null;
        let freezeObserver = null;
        let frozenStyle = null;
        function setHintFrozen(tooltip_container, frozen) {
            const close = tooltip_container?.querySelector('.mho-close-hint');
            if (!close)
                return;
            close.addEventListener('click', (e) => {
                e.stopPropagation();
                unfreeze();
            }, { once: true });
        }
        function unfreeze() {
            if (!frozenTooltip)
                return;
            setHintFrozen(frozenTooltip, false);
            freezeObserver?.disconnect();
            freezeObserver = null;
            const tooltip = frozenTooltip;
            frozenTooltip = null;
            frozenStyle = null;
            tooltip.removeAttribute('style');
            tooltip.classList.remove('mho-frozen');
        }
        function freezeCurrentTooltip() {
            const container = document.getElementById('tooltip_container');
            if (!container)
                return;
            let hint = container.querySelector('.mho-shift-hint');
            if (!hint)
                return;
            const visibleTooltip = [...container.querySelectorAll('.item')].find(el => el.style.display === 'block');
            if (!visibleTooltip)
                return;
            if (visibleTooltip === frozenTooltip)
                return;
            unfreeze();
            visibleTooltip.classList.add('mho-frozen');
            frozenTooltip = visibleTooltip;
            frozenStyle = frozenTooltip.getAttribute('style');
            setHintFrozen(frozenTooltip, true);
            freezeObserver = new MutationObserver(() => {
                if (frozenTooltip && frozenTooltip.style.display !== 'block') {
                    frozenTooltip.setAttribute('style', frozenStyle);
                }
            });
            freezeObserver.observe(frozenTooltip, { attributes: true, attributeFilter: ['style'] });
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Shift') {
                freezeCurrentTooltip();
            }
        });
    }
    function createAdvancedProperties(content, item, tooltip) {
        let item_deco;
        if (tooltip) {
            item_deco = tooltip.getElementsByClassName('item-tag-deco')[0];
        }
        content.innerHtml = '';
        if (tooltip && state.mho_parameters.enhanced_tooltips_item_quantities) {
            let stock_div = document.createElement('div');
            content.appendChild(stock_div);
            stock_div.style.display = 'flex';
            stock_div.style.flexWrap = 'wrap';
            stock_div.style.justifyContent = 'space-between';
            stock_div.style.columnGap = '1em';
            stock_div.style.borderBottom = '1px solid white';
            let bank_div = document.createElement('div');
            bank_div.style.width = 'calc(50% - 0.5em)';
            bank_div.innerText = getI18N(wishlist_headers.find((header) => header.id === 'bank_count').label) + ' : ' + item.bankCount;
            stock_div.appendChild(bank_div);
            let wishlist_for_zone = getWishlistForZone();
            let item_in_wishlist = wishlist_for_zone?.find((iwfz) => item.id === iwfz.item.id);
            if (item_in_wishlist?.item.wishListCount > 0) {
                let wishlist_wanted_div = document.createElement('div');
                wishlist_wanted_div.style.width = 'calc(50% - 0.5em)';
                wishlist_wanted_div.innerText = getI18N(wishlist_headers[5].label) + ' : ' + item_in_wishlist.item.wishListCount;
                stock_div.appendChild(wishlist_wanted_div);
                let wishlist_depot_div = document.createElement('div');
                wishlist_depot_div.style.width = 'calc(50% - 0.5em)';
                wishlist_depot_div.innerText = getI18N(wishlist_headers[2].label) + ' : ' + getI18N(wishlist_depot.find((depot) => item_in_wishlist.depot === depot.value).label);
                stock_div.appendChild(wishlist_depot_div);
            }
        }
        if (state.mho_parameters.enhanced_tooltips_item_translations) {
            let translations = '';
            supported_languages.filter((language) => language.value !== lang).forEach((language) => {
                translations += `<div class="brown-tag"><span class="tooltip-translation-flag">${language.img}</span><span class="tooltip-translation-value">${item.label[language.value]}</span></div>`;
            });
            let item_translations = document.createElement('div');
            item_translations.classList.add('mho-tooltip-translations');
            item_translations.innerHTML = translations;
            content.appendChild(item_translations);
        }
        if ((!item_deco || item.deco === 0) && !item.properties && !item.actions && item.recipes.length === 0)
            return;
        if (item_deco && item.deco > 0) {
            let text = item_deco.innerText.replace(/ \(.*\)*/, '');
            item_deco.innerHTML = `<span>${text} <em>( +${item.deco} )</em></span>`;
        }
        if (!item.properties && !item.actions && item.recipes.length === 0)
            return;
        if (state.mho_parameters.enhanced_tooltips_item_properties && item.properties) {
            let item_properties = document.createElement('div');
            content.appendChild(item_properties);
            item.properties.forEach((property) => {
                item_properties.appendChild(displayPropertiesOrActions(property, item));
            });
        }
        if (state.mho_parameters.enhanced_tooltips_item_actions && item.actions) {
            let item_actions = document.createElement('div');
            content.appendChild(item_actions);
            item.actions.forEach((action) => {
                item_actions.appendChild(displayPropertiesOrActions(action, item));
            });
        }
        if (state.mho_parameters.enhanced_tooltips_item_recipes && item.recipes.length > 0) {
            let item_recipes = document.createElement('table');
            item_recipes.classList.add('recipes');
            content.appendChild(item_recipes);
            item.recipes.forEach((recipe) => {
                item_recipes.appendChild(getRecipeElement(recipe));
            });
        }
    }
    function createAdvancedStatus(content, status, tooltip) {
        content.innerHtml = '';
        let status_details = document.createElement('div');
        content.appendChild(status_details);
        const have_properties = status.properties?.length > 0;
        if (status.pdc === undefined && status.watch_def === undefined
            && status.watch_kills === undefined && status.searches === undefined
            && !have_properties)
            return;
        if (status.pdc !== undefined) {
            let status_detail = document.createElement('div');
            status_detail.classList.add('item-tag', 'mho-item-tag', 'mho-item-tag-no-img');
            status_detail.innerHTML = `${status.pdc} ${Math.abs(status.pdc) > 1 ? 'points' : 'point'} de contrôle supplémentaire${Math.abs(status.pdc) > 1 ? 's' : ''}`;
            status_details.appendChild(status_detail);
        }
        if (status.terror !== undefined) {
            let status_detail = document.createElement('div');
            status_detail.classList.add('item-tag', 'mho-item-tag', 'mho-item-tag-no-img');
            status_detail.innerHTML = `${getI18N(status_texts.terror)} : ${status.terror}%`;
            status_details.appendChild(status_detail);
        }
        if (status.prevent_infection !== undefined) {
            let status_detail = document.createElement('div');
            status_detail.classList.add('item-tag', 'mho-item-tag', 'mho-item-tag-no-img');
            status_detail.innerHTML = `${getI18N(status_texts.prevent_infection)} : ${status.prevent_infection * 100}%`;
            status_details.appendChild(status_detail);
        }
        if (status.fatal_infection !== undefined) {
            let status_detail = document.createElement('div');
            status_detail.classList.add('item-tag', 'mho-item-tag', 'mho-item-tag-no-img');
            status_detail.innerHTML = `${getI18N(status_texts.fatal_infection)} : ${status.fatal_infection < 0 ? status.fatal_infection * 100 : '+' + status.fatal_infection * 100}%`;
            status_details.appendChild(status_detail);
        }
        if (status.watch_def !== undefined || status.watch_kills !== undefined) {
            if (status.watch_def !== undefined) {
                let status_detail = document.createElement('div');
                status_detail.classList.add('item-tag', 'mho-item-tag', 'mho-item-tag-no-img');
                status_detail.innerHTML = `${getI18N(status_texts.zombies_killed)} : ${status.watch_def}`;
                status_details.appendChild(status_detail);
            }
            if (status.watch_kills !== undefined) {
                let status_detail = document.createElement('div');
                status_detail.classList.add('item-tag', 'mho-item-tag', 'mho-item-tag-no-img');
                status_detail.innerHTML = `${getI18N(status_texts.watch_survival_chances)} : ${status.watch_kills < 0 ? status.watch_kills * 100 : '+' + status.watch_kills * 100}%`;
                status_details.appendChild(status_detail);
            }
        }
        if (status.searches !== undefined) {
            let status_detail = document.createElement('div');
            status_detail.classList.add('item-tag', 'mho-item-tag', 'mho-item-tag-no-img');
            status_detail.innerHTML = `${getI18N(status_texts.success_digs_changes)} : ${status.searches}`;
            status_details.appendChild(status_detail);
        }
        if (have_properties) {
            status.properties.forEach((property) => {
                status_details.appendChild(displayStatusProperties(property, status));
            });
        }
    }
    /** Affiche les propriétés ou les actions associées à l'objet survolé */
    function displayPropertiesOrActions(property_or_action, hovered_item) {
        let item_action = document.createElement('div');
        // TODO MAPPING BACK
        item_action.classList.add('item-tag', 'mho-item-tag');
        switch (property_or_action) {
            case 'eat_6ap':
            case 'eat_7ap':
            case 'eat_4ap':
                item_action.classList.add(`item-tag-food`);
                item_action.innerHTML = `+${property_or_action.slice(4, 5)}<img src="${repo_img_hordes_url}emotes/ap.${lang}.gif">`;
                break;
            case 'coffee':
                item_action.classList.add(`item-tag-coffee`);
                item_action.innerHTML = `+4<img src="${repo_img_hordes_url}emotes/ap.${lang}.gif">`;
                break;
            case 'drug_6ap_1':
            case 'drug_8ap_1':
                item_action.classList.add(`item-tag-drug`);
                item_action.innerHTML = `+${property_or_action.slice(5, 6)}<img src="${repo_img_hordes_url}emotes/ap.${lang}.gif">`;
                break;
            case 'alcohol':
                item_action.classList.add(`item-tag-alcohol`);
                item_action.innerHTML = `+6<img src="${repo_img_hordes_url}emotes/ap.${lang}.gif">`;
                break;
            case 'cyanide':
                item_action.classList.add(`mho-item-tag-no-img`);
                item_action.innerHTML = `<img src="${repo_img_hordes_url}emotes/death.gif">`;
                break;
            case 'hero_find':
                item_action.classList.add(`item-tag-hero`);
                item_action.innerText = `Trouvaille`;
                break;
            case 'hero_find_lucky':
                if (!(hovered_item.properties && hovered_item.properties.some((property) => property === 'hero_find')) && !(hovered_item.actions && hovered_item.actions.some((property) => property === 'hero_find'))) {
                    item_action.classList.add(`item-tag-hero`);
                    item_action.innerText = `Jolie trouvaille`;
                }
                else {
                    item_action.classList.remove('item-tag', 'mho-item-tag');
                }
                break;
            case 'hero_find_lucky2':
                if (!(hovered_item.properties && hovered_item.properties.some((property) => property === 'hero_find_lucky')) && !(hovered_item.actions && hovered_item.actions.some((property) => property === 'hero_find_lucky'))) {
                    item_action.classList.add(`item-tag-hero`);
                    item_action.innerText = `Impressionnante trouvaille`;
                }
                else {
                    item_action.classList.remove('item-tag', 'mho-item-tag');
                }
                break;
            case 'hero_find_lucky3':
                if (!(hovered_item.properties && hovered_item.properties.some((property) => property === 'hero_find_lucky2')) && !(hovered_item.actions && hovered_item.actions.some((property) => property === 'hero_find_lucky2'))) {
                    item_action.classList.add(`item-tag-hero`);
                    item_action.innerText = `Incroyable trouvaille`;
                }
                else {
                    item_action.classList.remove('item-tag', 'mho-item-tag');
                }
                break;
            case 'flash_photo_1': {
                item_action.classList.add(`mho-item-tag-large`);
                let fail_1 = Math.round(60 / 90 * 100);
                item_action.innerText = `${100 - fail_1}% de chances de pouvoir fuir pendant 30 secondes`;
                break;
            }
            case 'flash_photo_2': {
                item_action.classList.add(`mho-item-tag-large`);
                let fail_2 = Math.round(30 / 90 * 100);
                item_action.innerText = `${100 - fail_2}% de chances de pouvoir fuir pendant 60 secondes`;
                break;
            }
            case 'flash_photo_3': {
                item_action.classList.add(`mho-item-tag-large`);
                let fail_3 = 1;
                item_action.innerText = `Succès : ${100 - fail_3}% de chances de pouvoir fuir pendant 120 secondes`;
                break;
            }
            case 'flash_photo_4': {
                item_action.classList.add(`mho-item-tag-large`);
                let fail_4 = 1;
                item_action.innerText = `Succès : ${100 - fail_4}% de chances de pouvoir fuir pendant 120 secondes`;
                break;
            }
            case 'can_cook':
                item_action.classList.add(`mho-item-tag-no-img`);
                item_action.innerText = `Peut être cuisiné`;
                break;
            case 'pet':
                item_action.classList.add(`mho-item-tag-no-img`);
                item_action.innerText = `Animal`;
                break;
            case 'can_poison':
                item_action.classList.add(`mho-item-tag-no-img`);
                item_action.innerText = `Peut être empoisonné`;
                break;
            case 'camp_bonus':
                item_action.classList.add(`mho-item-tag-no-img`);
                item_action.innerText = `Dans le sac, augmente de 5% les chances de survie en camping`;
                break;
            case 'load_maglite':
            case 'load_lamp':
            case 'load_pilegun':
            case 'load_radio':
            case 'load_dildo':
            case 'load_lpointer':
            case 'load_mixergun':
            case 'load_taser':
            case 'load_chainsaw':
            case 'load_pilegun3':
            case 'load_pilegun2':
            case 'load_emt':
            case 'load_rmk2':
                item_action.classList.add(`item-tag-load`);
                item_action.innerText = `Peut être rechargé`;
                break;
            case 'smokebomb':
                item_action.classList.add(`item-tag-smokebomb`);
                item_action.classList.add(`mho-item-tag-no-img`);
                item_action.innerHTML = `Efface les entrées du registre (-3 minutes)<br />Dissimule votre prochaine entrée (+1 minute)`;
                break;
            case 'improve':
                item_action.classList.add(`mho-item-tag-no-img`);
                item_action.innerText = `Permet d'aménager un campement`;
                break;
            case 'defence':
                // déjà affichés par le jeu
                item_action.classList.remove('item-tag', 'mho-item-tag');
                break;
            case 'drug_6ap_2':
            case 'drug_8ap_2':
                // ne pas afficher
                item_action.classList.remove('item-tag', 'mho-item-tag');
                break;
            case 'hero_surv_1':
                if (state.mh_user.townDetails) {
                    var days = state.mh_user.townDetails?.day;
                    var devastated = state.mh_user.townDetails?.isDevaste;
                    var chances = 1;
                    if (days >= 20) {
                        chances = 0.50;
                    }
                    else if (days >= 15) {
                        chances = 0.60;
                    }
                    else if (days >= 13) {
                        chances = 0.70;
                    }
                    else if (days >= 10) {
                        chances = 0.80;
                    }
                    else if (days >= 5) {
                        chances = 0.85;
                    }
                    if (devastated)
                        chances = Math.max(0.1, chances - 0.2);
                    var success = chances * 100;
                    item_action.classList.add(`mho-item-tag-no-img`);
                    item_action.innerText = `${success}% de chances de réussir son manuel`;
                }
                else {
                    item_action.classList.remove('item-tag', 'mho-item-tag');
                }
                break;
            case 'hero_surv_2':
                // ne pas afficher
                item_action.classList.remove('item-tag', 'mho-item-tag');
                break;
            case 'prevent_night':
                item_action.classList.add(`mho-item-tag-no-img`);
                item_action.innerText = `Malus de nuit divisé par 4`;
                break;
            case 'no_post':
                item_action.classList.add(`mho-item-tag-no-img`);
                item_action.innerText = `Ne peut pas être envoyé par message`;
                break;
            case 'wagging_flag':
                item_action.classList.add(`mho-item-tag-no-img`);
                item_action.innerText = `Attire 2.5% des zombies du débordement`;
                break;
            case 'fragile':
                item_action.classList.add(`mho-item-tag-no-img`);
                item_action.innerText = `Se casse en cas d'envoi par catapulte`;
                break;
            case 'esc_fixed':
                item_action.classList.add(`mho-item-tag-no-img`);
                item_action.innerText = `Ne peut pas être déposé par le chef d'escorte`;
                break;
            case 'impoundable':
                item_action.classList.add(`mho-item-tag-no-img`);
                item_action.innerText = `Perdu en cas de bannissement`;
                break;
            case 'box_opener':
            case 'can_opener':
            case 'parcel_opener':
            case 'nw_ikea':
            case 'nw_armory':
            case 'ressource':
            case 'food':
            case 'weapon':
            case 'drug':
            case 'nw_trebuchet':
            case 'slaughter_2xs':
            case 'throw_animal_cat':
            case 'throw_animal_cat_t1':
            case 'throw_animal_cat_t2':
            case 'throw_animal_tekel':
            case 'throw_animal_tekel_t1':
            case 'throw_animal_tekel_t2':
            case 'parcel_opener_h':
            case 'hero_tamer_3':
            case 'throw_b_chair_basic':
            case 'throw_b_machine_1':
            case 'throw_b_machine_2':
            case 'throw_b_machine_3':
            case 'cuddle_teddy_1':
            case 'cuddle_teddy_2':
            case 'lock':
            case 'home_store_plus2':
            case 'home_store_plus':
            case 'home_def_plus':
            case 'throw_b_pc':
            case 'slaughter_bmb':
            case 'throw_animal_angryc':
            case 'special_guitar':
            case 'fire_pilegun':
            case 'fire_taser':
            case 'fill_asplash1':
            case 'fill_asplash2':
            case 'throw_b_screw':
            case 'throw_b_wrench':
            case 'throw_b_staff':
            case 'throw_b_knife':
            case 'throw_b_small_knife':
            case 'throw_b_cutter':
            case 'throw_b_can_opener':
            case 'fill_grenade1':
            case 'fill_grenade2':
            case 'fill_splash1':
            case 'fill_splash2':
            case 'fill_ksplash1':
            case 'fill_ksplash2':
            case 'fire_pilegun3':
            case 'throw_b_chain':
            case 'nw_shooting':
            case 'fire_splash3':
            case 'throw_b_torch_off':
            case 'throw_boomfruit':
            case 'throw_animal_dog':
            case 'throw_animal_dog_t1':
            case 'throw_animal_dog_t2':
            case 'throw_b_concrete_wall':
            case 'drug_xana1':
            case 'drug_xana2':
            case 'drug_xana3':
            case 'drug_xana4':
            case 'bandage':
            case 'drug_hyd_1':
            case 'drug_hyd_2':
            case 'drug_hyd_3':
            case 'drug_hyd_4':
            case 'drug_hyd_5':
            case 'drug_hyd_6':
            case 'drug_rand_1':
            case 'drug_rand_2':
            case 'drug_par_1':
            case 'drug_par_2':
            case 'drug_par_3':
            case 'drug_par_4':
            case 'prevent_terror':
            case 'read_rp_cover':
            case 'found_poisoned':
            case 'is_water':
            case 'water_tl0':
            case 'water_tl1a':
            case 'water_tl1b':
            case 'water_tl2':
            case 'water_g':
            case 'can':
            case 'can_t1':
            case 'can_t2':
            case 'can_t3':
            case 'open_doggybag':
            case 'special_dice':
            case 'slaughter_2x':
            case 'throw_animal':
            case 'throw_animal_t1':
            case 'throw_animal_t2':
            case 'slaughter_4xs':
            case 'repair_2':
            case 'zonemarker_1':
            case 'nessquick':
            case 'bomb_2':
            case 'repair_1':
            case 'light_cig':
            case 'poison_1':
            case 'poison_2':
            case 'bp_bunker_2':
            case 'fire_mixergun':
            case 'fire_chainsaw':
            case 'throw_b_lawn':
            case 'throw_b_cutcut':
            case 'throw_b_swiss_knife':
            case 'fill_jsplash':
            case 'throw_grenade':
            case 'throw_projector':
            case 'throw_exgrenade':
            case 'fill_exgrenade1':
            case 'fill_exgrenade2':
            case 'fire_asplash3':
            case 'fire_asplash2':
            case 'fire_asplash1':
            case 'throw_jerrygun':
            case 'throw_b_bone':
            case 'fire_splash2':
            case 'fire_splash1':
            case 'fire_asplash5':
            case 'fire_asplash4':
            case 'fire_pilegun2':
            case 'throw_phone':
            case 'fire_ksplash':
            case 'fire_lpointer4':
            case 'fire_lpointer3':
            case 'fire_lpointer2':
            case 'fire_lpointer1':
            case 'throw_hurling_stick':
            case 'open_metalbox':
            case 'open_metalbox_t1':
            case 'open_metalbox_t2':
            case 'open_metalbox2':
            case 'open_metalbox2_t1':
            case 'open_metalbox2_t2':
            case 'open_toolbox':
            case 'open_toolbox_t1':
            case 'open_toolbox_t2':
            case 'open_c_chest':
            case 'open_gamebox':
            case 'open_letterbox':
            case 'open_justbox':
            case 'open_matbox3':
            case 'open_matbox2':
            case 'open_matbox1':
            case 'open_h_chest':
            case 'open_postbox':
            case 'open_lunchbag':
            case 'open_drugkit':
            case 'open_safe':
            case 'open_abox':
            case 'open_asafe':
            case 'open_catbox':
            case 'open_catbox_t1':
            case 'open_catbox_t2':
            case 'open_xmasbox3':
            case 'open_xmasbox2':
            case 'open_xmasbox1':
            case 'open_postbox_xl':
            case 'throw_b_torch':
            case 'pumpkin':
            case 'drug_beta_bad_1':
            case 'drug_beta_bad_2':
            case 'drug_beta':
            case 'ghoul_serum':
            case 'drug_lsd_1':
            case 'drug_lsd_2':
            case 'drug_april_1':
            case 'drug_april_2':
            case 'eat_meat_1':
            case 'eat_meat_2':
            case 'open_foodbox_in':
            case 'open_foodbox_out':
            case 'open_foodbox_in_t1':
            case 'open_foodbox_out_t1':
            case 'open_foodbox_in_t2':
            case 'open_foodbox_out_t2':
            case 'eat_bone_1':
            case 'eat_bone_2':
            case 'fill_watercan1':
            case 'watercan1_tl0':
            case 'watercan1_tl1a':
            case 'watercan1_tl1b':
            case 'watercan1_tl2':
            case 'watercan1_g':
            case 'fill_watercan2':
            case 'watercan2_tl0':
            case 'watercan2_tl1a':
            case 'watercan2_tl1b':
            case 'watercan2_tl2':
            case 'watercan2_g':
            case 'watercan3_tl0':
            case 'watercan3_tl1a':
            case 'watercan3_tl1b':
            case 'watercan3_tl2':
            case 'watercan3_g':
            case 'eat_fleshroom_1':
            case 'eat_fleshroom_2':
            case 'eat_cadaver_1':
            case 'eat_cadaver_2':
            case 'alcohol_dx':
            case 'water_no_effect':
            case 'potion_tl0a':
            case 'potion_tl0b':
            case 'potion_tl1a':
            case 'potion_tl1b':
            case 'potion_tl2':
            case 'potion_g':
            case 'potion_tl0a_immune':
            case 'potion_tl0b_immune':
            case 'potion_tl1a_immune':
            case 'potion_tl1b_immune':
            case 'potion_tl2_immune':
            case 'potion_g_immune':
            case 'drug_rand_xmas':
            case 'read_rp':
            case 'slaughter_4x':
            case 'vibrator':
            case 'jerrycan_1':
            case 'jerrycan_1b':
            case 'jerrycan_2':
            case 'jerrycan_3':
            case 'emt':
            case 'special_card':
            case 'flare':
            case 'zonemarker_2':
            case 'fill_watercan0':
            case 'bomb_1':
            case 'watercup_1':
            case 'watercup_1b':
            case 'watercup_2':
            case 'watercup_3':
            case 'read_banned_note':
            case 'throw_sandball':
            case 'bp_generic_1':
            case 'bp_generic_2':
            case 'bp_generic_3':
            case 'bp_generic_4':
            case 'open_cbox':
            case 'bp_hotel_2':
            case 'bp_hotel_3':
            case 'bp_hotel_4':
            case 'bp_bunker_3':
            case 'bp_bunker_4':
            case 'bp_hospital_2':
            case 'bp_hospital_3':
            case 'bp_hospital_4':
            case 'purify_soul':
            case 'clean_clothes':
            case 'hero_hunter_1':
            case 'hero_hunter_2':
            case 'hero_tamer_1':
            case 'hero_tamer_1b':
            case 'hero_tamer_2':
            case 'hero_tamer_2b':
            case 'alarm_clock':
            case 'inedible':
            case 'lure':
            case 'equip_shoe_first':
            case 'hero_dog_fetch':
            case 'nw_impact_cumul':
            case 'eat_apple':
            case 'drink_quantum_1':
            case 'drink_quantum_2':
            case 'drink_quantum_3':
            case 'play_soccer_1':
            case 'play_soccer_2':
            case 'nosteal':
            case 'install_garland':
            case 'uninstall_garland':
            case 'open_cellobox':
            case 'flash_photo_4_ruin_bp':
            case 'flash_photo_4_ruin_bp_free':
            case 'flash_photo_4_ruin_no_bp':
            case 'repair_hero':
            case 'equip_bike_first':
            case 'unequip_bike_first':
            case 'pet_doggo':
            case 'jerrycan_4':
            case 'jerrycan_4b':
            case 'hero_tamer_4':
            case 'hero_tamer_4b':
            case 'hero_tamer_5':
            case 'hero_tamer_5b':
            case 'hero_tamer_6':
            case 'hero_tamer_6b':
            case 'hero_tamer_7':
            case 'hero_tamer_7b':
            case 'hero_tamer_8':
            case 'hero_tamer_8b':
            case 'hero_tamer_9':
                item_action.classList.remove('item-tag', 'mho-item-tag');
                break;
            case 'deco':
            case 'single_use':
                /** Déjà géré par MH */
                item_action.classList.remove('item-tag', 'mho-item-tag');
                break;
            case null:
                item_action.classList.remove('item-tag', 'mho-item-tag');
                break;
            default:
                console.warn('missing property or action', property_or_action);
                item_action.classList.remove('item-tag', 'mho-item-tag');
                break;
        }
        return item_action;
    }
    function displayStatusProperties(status_properties, hovered_item) {
        let item_action = document.createElement('div');
        item_action.classList.add('item-tag', 'mho-item-tag');
        switch (status_properties) {
            case 'head_wounded':
                item_action.classList.add('mho-item-tag-no-img');
                item_action.innerText = getI18N(status_texts.head_wounded);
                break;
            case 'hand_wounded':
                item_action.classList.add('mho-item-tag-no-img');
                item_action.innerText = getI18N(status_texts.hand_wounded);
                break;
            case 'arm_wounded':
                item_action.classList.add('mho-item-tag-no-img');
                item_action.innerText = getI18N(status_texts.arm_wounded);
                break;
            case 'leg_wounded':
                item_action.classList.add('mho-item-tag-no-img');
                item_action.innerText = getI18N(status_texts.leg_wounded);
                break;
            case 'wounded':
            case null:
                item_action.classList.remove('item-tag', 'mho-item-tag');
                break;
            default:
                console.log(status_properties);
                break;
        }
        return item_action;
    }

    function displayBank(tab_id) {
        getBank().then((bank) => {
            if (bank) {
                displayItems(bank, tab_id);
            }
        });
    }
    /**
     * Affiche la liste des objets
     * @param filtered_items
     * @param {string} tab_id l'onglet dans lequel on se trouve
     */
    function displayItems(filtered_items, tab_id) {
        let tab_content = document.getElementById(mh_optimizer_window_id + '-tab-content');
        let item_list = document.createElement('ul');
        item_list.id = 'item-list';
        tab_content.appendChild(item_list);
        filtered_items?.forEach((item, index) => {
            if (index === 0 || filtered_items[index - 1].category.idCategory !== item.category.idCategory) {
                let category_text = document.createElement('span');
                category_text.innerText = item.category.label[lang];
                let category_container = document.createElement('div');
                category_container.classList.add('mho-category', 'mho-header');
                category_container.appendChild(category_text);
                item_list.appendChild(category_container);
            }
            let item_title_and_add_container = document.createElement('div');
            item_title_and_add_container.classList.add('item-title');
            let item_title_container = document.createElement('div');
            item_title_container.setAttribute('style', 'flex: 1; cursor: pointer;');
            item_title_and_add_container.appendChild(item_title_container);
            if ((tab_id === 'bank' || tab_id === 'items') && item.wishListCount === 0 && state.mh_user.townDetails?.townId) {
                let item_add_to_wishlist = document.createElement('div');
                item_add_to_wishlist.classList.add('add-to-wishlist');
                item_title_and_add_container.appendChild(item_add_to_wishlist);
                let add_to_wishlist_button = document.createElement('button');
                add_to_wishlist_button.classList.add('inline');
                add_to_wishlist_button.addEventListener('click', () => {
                    addItemToWishlist(item).then((wishlist) => {
                        item_add_to_wishlist.remove();
                    });
                });
                let img = document.createElement('img');
                img.src = `${repo_img_hordes_url}item/item_cart.gif`;
                img.alt = '&#x1F6D2;';
                add_to_wishlist_button.appendChild(img);
                item_add_to_wishlist.appendChild(add_to_wishlist_button);
            }
            let icon_container = document.createElement('span');
            icon_container.setAttribute('style', 'margin-right: 0.5em');
            item_title_container.appendChild(icon_container);
            let item_icon = document.createElement('img');
            if (item.broken) {
                item_icon.style.border = '1px dashed red';
            }
            item_icon.src = repo_img_hordes_url + item.img;
            icon_container.appendChild(item_icon);
            if (tab_id === 'bank' && item.bankCount > 1) {
                let item_count = document.createElement('span');
                item_count.setAttribute('style', 'vertical-align: sub; font-size: 10px;');
                item_count.innerText = item.bankCount;
                icon_container.appendChild(item_count);
            }
            let item_title = document.createElement('span');
            item_title.classList.add('label_text');
            item_title.innerText = getI18N(item.label) + (item.broken ? ' (' + getI18N(texts.broken) + ')' : '');
            item_title_container.appendChild(item_title);
            let item_properties_container = document.createElement('div');
            item_properties_container.classList.add('properties');
            item_properties_container.innerHTML = `<span class="small">${getI18N(item.description)}</span>`;
            createAdvancedProperties(item_properties_container, item, undefined);
            let item_container = document.createElement('li');
            item_container.appendChild(item_title_and_add_container);
            item_container.appendChild(item_properties_container);
            item_title_container.addEventListener('click', () => {
                let selected_items = document.getElementsByClassName('selected');
                item_container.classList.toggle('selected');
            });
            item_list.appendChild(item_container);
        });
    }
    /** Affiche le calcul des probabilités en camping */

    function displayCamping() {
        getRuins().then((ruins) => {
            let all_ruins = [...added_ruins];
            all_ruins = all_ruins.concat(ruins);
            let tab_content = document.getElementById(mh_optimizer_window_id + '-tab-content');
            let camping_tab_content = document.createElement('div');
            camping_tab_content.style.padding = '0 0.5em';
            camping_tab_content.classList.add('camping-tab');
            tab_content.appendChild(camping_tab_content);
            let conf = {
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
            let my_info = document.createElement('div');
            camping_tab_content.appendChild(my_info);
            let my_info_title = document.createElement('h3');
            my_info_title.innerText = getI18N(texts.camping_citizen);
            my_info.appendChild(my_info_title);
            let my_info_content = document.createElement('div');
            my_info.appendChild(my_info_content);
            let town_info = document.createElement('div');
            camping_tab_content.appendChild(town_info);
            let town_info_title = document.createElement('h3');
            town_info_title.innerText = getI18N(texts.camping_town);
            town_info.appendChild(town_info_title);
            let town_info_content = document.createElement('div');
            town_info.appendChild(town_info_content);
            let cell_info = document.createElement('div');
            camping_tab_content.appendChild(cell_info);
            let cell_info_title = document.createElement('h3');
            cell_info_title.innerText = getI18N(texts.camping_ruin);
            cell_info.appendChild(cell_info_title);
            let cell_info_content = document.createElement('div');
            cell_info.appendChild(cell_info_content);
            let result = document.createElement('div');
            camping_tab_content.appendChild(result);
            let result_title = document.createElement('h3');
            result_title.innerText = getI18N(texts.result);
            result.appendChild(result_title);
            let result_content = document.createElement('div');
            result_content.id = 'camping-result';
            result.appendChild(result_content);
            /** Type de ville */
            let town_div = document.createElement('div');
            town_info_content.appendChild(town_div);
            let select_town_label = document.createElement('label');
            select_town_label.htmlFor = 'select-town';
            select_town_label.classList.add('spaced-label');
            select_town_label.innerText = getI18N(texts.town_type);
            let select_town = document.createElement('select');
            select_town.id = 'select-town';
            select_town.value = conf.town;
            select_town.classList.add('small');
            town_type.forEach((town) => {
                let town_option = document.createElement('option');
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
            let job_div = document.createElement('div');
            my_info_content.appendChild(job_div);
            let select_job_label = document.createElement('label');
            select_job_label.htmlFor = 'select-job';
            select_job_label.innerText = getI18N(texts.job);
            select_job_label.classList.add('spaced-label');
            let select_job = document.createElement('select');
            select_job.id = 'select-job';
            select_job.value = conf.job;
            select_job.classList.add('small');
            jobs.forEach((job) => {
                let job_option = document.createElement('option');
                job_option.value = job.id;
                job_option.label = getI18N(job.label);
                select_job.appendChild(job_option);
            });
            select_job.addEventListener('change', ($event) => {
                conf.job = $event.srcElement.value;
                let vest_field = document.querySelector('#vest-field');
                if (conf.job !== 'scout') {
                    conf.vest = false;
                    vest_field.style.display = 'none';
                }
                else {
                    vest_field.style.display = 'initial';
                }
                calculateCamping(conf);
            });
            job_div.appendChild(select_job_label);
            job_div.appendChild(select_job);
            /** Capuche ? */
            let vest_div = document.createElement('div');
            vest_div.id = 'vest-field';
            vest_div.style.display = 'none';
            my_info_content.appendChild(vest_div);
            let vest_label = document.createElement('label');
            vest_label.htmlFor = 'vest';
            vest_label.innerHTML = `<img src="${repo_img_hordes_url}emotes/proscout.gif"> ${getI18N(texts.vest)}`;
            let vest = document.createElement('input');
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
            let pro_camper_div = document.createElement('div');
            my_info_content.appendChild(pro_camper_div);
            let pro_camper_label = document.createElement('label');
            pro_camper_label.htmlFor = 'pro';
            pro_camper_label.innerHTML = `<img src="${repo_img_hordes_url}status/status_camper.gif"> ${getI18N(texts.pro_camper)}`;
            let pro_camper = document.createElement('input');
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
            let tomb_div = document.createElement('div');
            my_info_content.appendChild(tomb_div);
            let tomb_label = document.createElement('label');
            tomb_label.htmlFor = 'tomb';
            tomb_label.innerHTML = `<img src="${repo_img_hordes_url}building/small_cemetery.gif"> ${getI18N(texts.tomb)}`;
            let tomb = document.createElement('input');
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
            });
            r4_div.appendChild(r4);
            r4_div.appendChild(r4_label);
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
            nb_campings.value = (conf.campings);
            nb_campings.classList.add('mho-input', 'inline');
            nb_campings.addEventListener('change', ($event) => {
                conf.campings = +$event.srcElement.value;
                calculateCamping(conf);
            });
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
            objects_in_bag.value = (conf.objects);
            objects_in_bag.classList.add('mho-input', 'inline');
            objects_in_bag.addEventListener('change', ($event) => {
                conf.objects = +$event.srcElement.value;
                calculateCamping(conf);
            });
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
                select_ruin.appendChild(ruin_option);
            });
            select_ruin.addEventListener('change', ($event) => {
                conf.ruin = $event.srcElement.value;
                let current_ruin = all_ruins.find((_current_ruin) => +_current_ruin.id === +conf.ruin);
                conf.ruinBonus = current_ruin.camping;
                conf.ruinCapacity = current_ruin.capacity;
                let digs_field = document.querySelector('#digs-field');
                if (+current_ruin.id === -1) {
                    digs_field.style.display = 'block';
                }
                else {
                    digs_field.style.display = 'none';
                    digs_field.querySelector('input').value = (0);
                }
                calculateCamping(conf);
            });
            ruin_type_div.appendChild(select_ruin_label);
            ruin_type_div.appendChild(select_ruin);
            /** Nombre de tas sur le bat ? */
            let digs_div = document.createElement('div');
            digs_div.id = 'digs-field';
            digs_div.style.display = 'none';
            cell_info_content.appendChild(digs_div);
            let digs_label = document.createElement('label');
            digs_label.htmlFor = 'digs';
            digs_label.innerText = getI18N(texts.digs);
            digs_label.innerHTML = `<img src="${repo_img_hordes_url}icons/uncover.gif"> ${getI18N(texts.digs)}`;
            digs_label.classList.add('spaced-label');
            let digs = document.createElement('input');
            digs.type = 'number';
            digs.id = 'digs';
            digs.value = (conf.ruinBuryCount);
            digs.classList.add('mho-input', 'inline');
            digs.addEventListener('change', ($event) => {
                conf.ruinBuryCount = +$event.srcElement.value;
                calculateCamping(conf);
            });
            digs_div.appendChild(digs_label);
            digs_div.appendChild(digs);
            /** Distance de la ville */
            let distance_div = document.createElement('div');
            cell_info_content.appendChild(distance_div);
            let distance_label = document.createElement('label');
            distance_label.htmlFor = 'distance';
            distance_label.innerText = getI18N(texts.distance).replace('%VAR%', '');
            distance_label.innerHTML = `<img src="${repo_img_hordes_url}emotes/explo.gif"> ${getI18N(texts.distance).replace('%VAR%', '')}`;
            distance_label.classList.add('spaced-label');
            let distance = document.createElement('input');
            distance.type = 'number';
            distance.id = 'distance';
            distance.value = (conf.distance);
            distance.classList.add('mho-input', 'inline');
            distance.addEventListener('change', ($event) => {
                conf.distance = +$event.srcElement.value;
                calculateCamping(conf);
            });
            distance_div.appendChild(distance_label);
            distance_div.appendChild(distance);
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
            zombies.value = (conf.zombies);
            zombies.classList.add('mho-input', 'inline');
            zombies.addEventListener('change', ($event) => {
                conf.zombies = +$event.srcElement.value;
                calculateCamping(conf);
            });
            zombies_div.appendChild(zombies_label);
            zombies_div.appendChild(zombies);
            /** Nombre d'améliorations simples sur la case */
            let improve_div = document.createElement('div');
            cell_info_content.appendChild(improve_div);
            let improve_label = document.createElement('label');
            improve_label.htmlFor = 'nb-improve';
            improve_label.innerHTML = `<img src="${repo_img_hordes_url}icons/small_refine.gif"> ${getI18N(texts.improve)}`;
            improve_label.classList.add('spaced-label');
            let improve = document.createElement('input');
            improve.type = 'number';
            improve.id = 'nb-improve';
            improve.value = (conf.improve);
            improve.classList.add('mho-input', 'inline');
            improve.addEventListener('change', ($event) => {
                conf.improve = +$event.srcElement.value;
                calculateCamping(conf);
            });
            improve_div.appendChild(improve_label);
            improve_div.appendChild(improve);
            /** Nombre d'objets de campement installés sur la case */
            let object_improve_div = document.createElement('div');
            cell_info_content.appendChild(object_improve_div);
            let object_improve_label = document.createElement('label');
            object_improve_label.htmlFor = 'nb-object-improve';
            object_improve_label.innerHTML = `<img src="${repo_img_hordes_url}item/cat_def.gif"> ${getI18N(texts.object_improve)}`;
            object_improve_label.classList.add('spaced-label');
            let object_improve = document.createElement('input');
            object_improve.type = 'number';
            object_improve.id = 'nb-object-improve';
            object_improve.value = (conf.objectImprove);
            object_improve.classList.add('mho-input', 'inline');
            object_improve.addEventListener('change', ($event) => {
                conf.objectImprove = +$event.srcElement.value;
                calculateCamping(conf);
            });
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
            hidden_campers.value = (conf.hiddenCampers);
            hidden_campers.classList.add('mho-input', 'inline');
            hidden_campers.addEventListener('change', ($event) => {
                conf.hiddenCampers = +$event.srcElement.value;
                calculateCamping(conf);
            });
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
            });
            night_div.appendChild(night);
            night_div.appendChild(night_label);
            /** Ville dévastée ? */
            let devastated_div = document.createElement('div');
            town_info_content.appendChild(devastated_div);
            let devastated_label = document.createElement('label');
            devastated_label.htmlFor = 'devastated';
            devastated_label.innerHTML = `<img src="${repo_img_hordes_url}item/item_out_def_broken.gif"> ${getI18N(texts.devastated)}`;
            let devastated = document.createElement('input');
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
            });
            phare_div.appendChild(phare);
            phare_div.appendChild(phare_label);
            calculateCamping(conf);
        });
    }
    /** Affiche la liste des bâtiments trouvables dans le désert */

    function displayRuins() {
        getRuins().then((ruins) => {
            if (ruins) {
                let tab_content = document.getElementById(mh_optimizer_window_id + '-tab-content');
                let header_cells = [...table_ruins_headers];
                let header_row = document.createElement('tr');
                header_row.classList.add('mho-header');
                header_cells.forEach((header_cell) => {
                    let cell = document.createElement('th');
                    cell.innerText = getI18N(header_cell.label);
                    header_row.appendChild(cell);
                });
                let table = document.createElement('table');
                table.classList.add('mho-table');
                table.appendChild(header_row);
                tab_content.appendChild(table);
                ruins.forEach((ruin) => {
                    let ruin_row = document.createElement('tr');
                    table.appendChild(ruin_row);
                    header_cells.forEach((header_cell) => {
                        let cell = document.createElement(header_cell.type);
                        let img = document.createElement('img');
                        switch (header_cell.id) {
                            case 'img':
                                img.src = `${repo_img_hordes_url}ruin/${ruin[header_cell.id]}.gif`;
                                cell.appendChild(img);
                                break;
                            case 'label':
                            case 'description':
                                cell.setAttribute('style', 'text-align: left');
                                cell.innerText = getI18N(ruin[header_cell.id]);
                                break;
                            case 'drops':
                                cell.setAttribute('style', 'text-align: left');
                                var item_divs = document.createElement('div');
                                item_divs.style.display = 'flex';
                                item_divs.style.flexWrap = 'wrap';
                                item_divs.style.justifyContent = 'space-around';
                                cell.appendChild(item_divs);
                                ruin[header_cell.id].forEach((item) => {
                                    let item_div = document.createElement('div');
                                    item_div.style.margin = '0 0.5em';
                                    item_div.title = getI18N(item.item.label);
                                    let item_img = document.createElement('img');
                                    item_img.src = repo_img_hordes_url + item.item.img;
                                    item_img.style.display = 'block';
                                    item_img.style.margin = 'auto';
                                    // let item_label = document.createElement('span');
                                    // item_label.innerText = getI18N(item.item.label);
                                    let item_proba = document.createElement('span');
                                    item_proba.innerText = Math.round(item.probability * 1000) / 10 + '%';
                                    item_proba.style.display = 'block';
                                    item_proba.style.margin = 'auto';
                                    item_div.appendChild(item_img);
                                    // item_div.appendChild(item_label);
                                    item_div.appendChild(item_proba);
                                    item_divs.appendChild(item_div);
                                });
                                break;
                            case 'minDist':
                            case 'maxDist':
                                cell.setAttribute('style', 'text-align: center');
                                cell.innerText = ruin[header_cell.id] + 'km';
                                break;
                            case 'camping':
                                cell.setAttribute('style', 'text-align: center');
                                cell.innerText = ruin[header_cell.id] + '%';
                                break;
                            case 'capacity':
                                cell.setAttribute('style', 'text-align: center');
                                cell.innerText = ruin[header_cell.id];
                                break;
                            default:
                                break;
                        }
                        ruin_row.appendChild(cell);
                    });
                });
            }
        });
    }
    /** Affiche la liste des recettes */

    function createWindow(id, full_size) {
        let window = document.querySelector(`#${id}`);
        if (window)
            return;
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        window = document.createElement('div');
        window.id = id;
        window.classList.add('mho-window');
        if (full_size) {
            window.classList.add('fullsize');
        }
        let window_box = document.createElement('div');
        window_box.id = id + '-box';
        window_box.classList.add('mho-window-box');
        window.appendChild(window_box);
        let window_drag_handler = document.createElement('div');
        window_drag_handler.id = id + '-drag-handle';
        if (!full_size) {
            window_drag_handler.style.cursor = 'move';
        }
        window_drag_handler.classList.add('mho-window-drag-handle');
        window_box.appendChild(window_drag_handler);
        let window_content = document.createElement('div');
        window_content.id = id + '-content';
        window_content.classList.add('mho-window-content');
        window_box.appendChild(window_content);
        let window_overlay = document.createElement('div');
        window_overlay.id = id + '-overlay';
        window_overlay.classList.add('mho-window-overlay');
        window_box.appendChild(window_overlay);
        let window_overlay_ul = document.createElement('ul');
        window_overlay.appendChild(window_overlay_ul);
        let window_overlay_li = document.createElement('li');
        window_overlay_ul.appendChild(window_overlay_li);
        let window_overlay_img = document.createElement('img');
        window_overlay_img.alt = '(X)';
        window_overlay_img.src = repo_img_hordes_url + 'icons/b_close.png';
        window_overlay_li.appendChild(window_overlay_img);
        window_overlay_img.addEventListener('click', () => {
            window.classList.remove('visible');
            let body = document.getElementsByTagName('body')[0];
            body.removeAttribute('style', 'overflow: hidden');
        });
        let post_office = document.getElementById('post-office');
        if (post_office) {
            post_office.parentNode.insertBefore(window, post_office.nextSibling);
        }
        if (!full_size) {
            window_drag_handler.onmousedown = (e) => {
                e = e || window.event;
                e.preventDefault();
                // get the mouse cursor position at startup:
                pos3 = e.clientX;
                pos4 = e.clientY;
                document.onmouseup = () => {
                    document.onmouseup = null;
                    document.onmousemove = null;
                };
                // call a function whenever the cursor moves:
                document.onmousemove = (e) => {
                    e = e || window.event;
                    e.preventDefault();
                    // calculate the new cursor position:
                    pos1 = pos3 - e.clientX;
                    pos2 = pos4 - e.clientY;
                    pos3 = e.clientX;
                    pos4 = e.clientY;
                    // set the element's new position:
                    window.style.top = (window.offsetTop - pos2) + "px";
                    window.style.left = (window.offsetLeft - pos1) + "px";
                };
            };
        }
    }
    /** Crée la fenêtre de wiki */
    function createWikiToolsWindow() {
        createWindow(mh_optimizer_window_id, true);
    }
    /**
     * Crée la liste des onglets de la page de wiki
     * @param {string} window_type
     */
    function createWikiToolsTabs(window_type) {
        let window_content = document.getElementById(mh_optimizer_window_id + '-content');
        window_content.innerHTML = '';
        let tabs_div = document.createElement('div');
        tabs_div.id = 'tabs';
        window_content.appendChild(tabs_div);
        let tabs_ul = document.createElement('ul');
        let current_tabs_list = tabs_list[window_type]
            .filter((tab) => state.mh_user.townDetails?.townId || !tab.needs_town)
            .sort((a, b) => {
            if (a.ordering > b.ordering) {
                return 1;
            }
            else if (a.ordering === b.ordering) {
                return 0;
            }
            else {
                return -1;
            }
        });
        current_tabs_list.forEach((tab, index) => {
            let tab_link = document.createElement('div');
            if (tab.icon) {
                let tab_icon = document.createElement('img');
                tab_icon.src = tab.icon;
                tab_link.appendChild(tab_icon);
            }
            let tab_text = document.createTextNode(getI18N(tab.label));
            tab_link.appendChild(tab_text);
            let tab_li = document.createElement('li');
            tab_li.appendChild(tab_link);
            if (index === 0) {
                tab_li.classList.add('selected');
                dispatchWikiToolsContent(window_type, tab);
            }
            const tab_content = document.getElementById(mh_optimizer_window_id + '-tab-content');
            tab_li.addEventListener('click', () => {
                if (!tab_li.classList.contains('selected') && tab_content !== undefined && tab_content !== null) {
                    for (let li of tabs_ul.children) {
                        li.classList.remove('selected');
                    }
                    tab_li.classList.add('selected');
                }
                dispatchWikiToolsContent(window_type, tab);
            });
            tabs_ul.appendChild(tab_li);
        });
        tabs_div.appendChild(tabs_ul);
    }
    /** Crée la fenêtre de wiki */
    function createMapWindow() {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        let window_content = document.createElement('div');
        window_content.id = mh_optimizer_map_window_id + '-content';
        window_content.setAttribute('style', 'height: calc(100% - 26px); position: initial; margin-top: 26px;');
        let window_overlay_img = document.createElement('img');
        window_overlay_img.alt = '(X)';
        window_overlay_img.src = repo_img_hordes_url + 'icons/b_close.png';
        let window_overlay_li = document.createElement('li');
        window_overlay_li.appendChild(window_overlay_img);
        let window_overlay_ul = document.createElement('ul');
        window_overlay_ul.style.margin = '-2px -2px 0 0';
        window_overlay_ul.appendChild(window_overlay_li);
        let window_overlay = document.createElement('div');
        window_overlay.id = mh_optimizer_map_window_id + '-overlay';
        window_overlay.setAttribute('style', 'cursor: move; width: 100%;');
        let window_box = document.createElement('div');
        window_box.id = mh_optimizer_map_window_id + '-box';
        window_box.draggable = true;
        let window = document.createElement('div');
        window.style.minWidth = '150px;';
        window.style.minHeight = '150px;';
        window.id = mh_optimizer_map_window_id;
        window_overlay.onmousedown = (e) => {
            e = e || window.event;
            e.preventDefault();
            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = () => {
                document.onmouseup = null;
                document.onmousemove = null;
            };
            // call a function whenever the cursor moves:
            document.onmousemove = (e) => {
                e = e || window.event;
                e.preventDefault();
                // calculate the new cursor position:
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                // set the element's new position:
                window_box.style.top = (window_box.offsetTop - pos2) + "px";
                window_box.style.left = (window_box.offsetLeft - pos1) + "px";
            };
        };
        window_overlay.appendChild(window_overlay_ul);
        window_box.appendChild(window_content);
        window_box.appendChild(window_overlay);
        window.appendChild(window_box);
        let post_office = document.getElementById('post-office');
        if (post_office) {
            post_office.parentNode.insertBefore(window, post_office.nextSibling);
        }
        window_overlay_img.addEventListener('click', () => {
            window.classList.remove('visible');
        });
    }
    /**
     * Affiche la fenêtre de wiki et charge la liste d'objets si elle n'a jamais été chargée
     * @param {string} window_type
     */
    function displayWindow(window_type) {
        document.getElementById(mh_optimizer_window_id).classList.add('visible');
        let body = document.getElementsByTagName('body')[0];
        body.setAttribute('style', 'overflow: hidden');
        createWikiToolsTabs(window_type);
    }
    /**
     * Crée le bloc de contenu de la page
     * @param {string} window_tyme     Le type de fenêtre à afficher, correspondant au nom utilisé dans la liste des onglets
     */
    function createWikiToolsTabContent(window_type) {
        let window_content = document.getElementById(mh_optimizer_window_id + '-content');
        let tab_content = document.getElementById(mh_optimizer_window_id + '-tab-content');
        if (tab_content) {
            tab_content.remove();
        }
        tab_content = document.createElement('div');
        tab_content.classList.add('tab-content');
        tab_content.id = mh_optimizer_window_id + '-tab-content';
        window_content.appendChild(tab_content);
    }
    /**
     * Détermine quelle fonction appeler en fonction de l'onglet sélectionné
     * @param {string} window_type     Le type de l'onglet
     * @param tab                      L'onglet à afficher
     */
    function dispatchWikiToolsContent(window_type, tab) {
        createWikiToolsTabContent(window_type);
        let list = document.getElementById(mh_optimizer_window_id + '-tab-content');
        if (list) {
            list.innerHTML = '';
        }
        switch (tab.id) {
            case 'items':
                displayItems(state.items, tab.id);
                break;
            case 'recipes':
                displayRecipes();
                break;
            case 'ruins':
                displayRuins();
                break;
            case 'bank':
                displayBank(tab.id);
                break;
            case 'camping':
                displayCamping();
                break;
            default:
                break;
        }
    }
    /** Filtre la liste des objets */
    function filterItems(source_items) {
        return source_items;
    }
    /**
     * Affiche une modale personnalisée avec le contenu du changelog et un bouton OK.
     * Utilise une modale HTML/CSS au lieu de alert() pour éviter le blocage silencieux du navigateur.
     * @param {string} content      Le texte du changelog à afficher
     * @param {() => void} onConfirm  Callback appelé uniquement quand l'utilisateur clique OK
     */
    function showChangelogModal(content, onConfirm) {
        const modal_id = 'mho-changelog-modal';
        // Supprimer une éventuelle modale existante
        document.getElementById(modal_id)?.remove();
        const overlay = document.createElement('div');
        overlay.id = modal_id;
        overlay.classList.add('mho-changelog-modal-overlay');
        const box = document.createElement('div');
        box.classList.add('mho-changelog-modal-box');
        const title = document.createElement('h3');
        title.classList.add('mho-changelog-modal-title');
        title.textContent = content.split('\n')[0].trim();
        const body = document.createElement('pre');
        body.classList.add('mho-changelog-modal-body');
        body.textContent = content.split('\n').slice(1).map((line) => line.trim()).join('\n').trim();
        // Lien pour afficher l'historique complet des versions passées
        const current_version = getScriptInfo().version;
        const older_versions = Object.entries(changelogs).filter(([v]) => v !== current_version);
        if (older_versions.length > 0) {
            const history_toggle = document.createElement('span');
            history_toggle.classList.add('mho-changelog-history-toggle');
            history_toggle.textContent = '▶ Voir les notes de versions plus anciennes';
            const history_section = document.createElement('div');
            history_section.classList.add('mho-changelog-history-section');
            history_section.style.display = 'none';
            older_versions.forEach(([version, notes]) => {
                const version_block = document.createElement('div');
                version_block.classList.add('mho-changelog-history-block');
                const version_title = document.createElement('h4');
                version_title.classList.add('mho-changelog-history-version');
                version_title.textContent = `${getScriptInfo().name} ${version}`;
                const version_body = document.createElement('pre');
                version_body.classList.add('mho-changelog-history-body');
                version_body.textContent = notes.split('\n').map((line) => line.trim()).join('\n').trim();
                version_block.appendChild(version_title);
                version_block.appendChild(version_body);
                history_section.appendChild(version_block);
            });
            history_toggle.addEventListener('click', () => {
                const is_open = history_section.style.display !== 'none';
                history_section.style.display = is_open ? 'none' : 'block';
                history_toggle.textContent = (is_open ? '▶' : '▼') + ' Voir les notes de versions plus anciennes';
            });
            box.appendChild(title);
            box.appendChild(body);
            box.appendChild(history_toggle);
            box.appendChild(history_section);
        }
        else {
            box.appendChild(title);
            box.appendChild(body);
        }
        const footer = document.createElement('div');
        footer.classList.add('mho-changelog-modal-footer');
        const ok_btn = document.createElement('button');
        ok_btn.textContent = 'OK';
        ok_btn.classList.add('mho-changelog-modal-btn');
        ok_btn.addEventListener('click', () => {
            overlay.remove();
            if (onConfirm)
                onConfirm();
        });
        footer.appendChild(ok_btn);
        box.appendChild(footer);
        overlay.appendChild(box);
        const post_office = document.getElementById('post-office');
        if (post_office) {
            post_office.parentNode.insertBefore(overlay, post_office.nextSibling);
        }
        else {
            document.body.appendChild(overlay);
        }
    }
    /**
     * Affiche les éléments présents dans la banque
     * @param {string} tab_id
     */

    let informations = [
        {
            id: `version`,
            label: {
                en: `Changelog ${getScriptInfo().version}`,
                fr: `Notes de version ${getScriptInfo().version}`,
                de: `Changelog ${getScriptInfo().version}`,
                es: `Notas de la versión ${getScriptInfo().version}`
            },
            src: undefined,
            action: () => {
                getStorageItem(mho_version_key).then((version) => {
                    if (isNewVersion(version)) {
                        showChangelogModal(getChangelog(), () => {
                            version[getScriptInfo().version] = true;
                            toggleNewChangelog(false);
                            setStorageItem(mho_version_key, version);
                        });
                    }
                    else {
                        showChangelogModal(getChangelog());
                    }
                });
            },
            img: `emotes/rptext.gif`
        },
        {
            id: `update`,
            label: {
                en: `Update available`,
                fr: `Mise à jour disponible`,
                de: `Update verfügbar`,
                es: `Actualización disponible`
            },
            src: isScript() ? getScriptInfo().updateURL : undefined,
            action: undefined,
            img: `icons/small_news.gif`,
            display: () => isScript() && !isScriptVersionLastVersion()
        },
        {
            id: `discord-url-id`,
            label: {
                en: `Bugs? Ideas?`,
                fr: `Des bugs ? Des idées ?`,
                de: `Fehler ? Ideen ?`,
                es: `¿Bugs? ¿Ideas?`
            },
            src: `https://discord.gg/ZQH7ZPWcCm`,
            action: undefined,
            img: `${repo_img_url}discord.ico`
        },
        {
            id: `edit-app-id`,
            label: {
                en: `Change my external ID for apps`,
                fr: `Modifier mon ID externe pour les apps`,
                de: `Meine externe ID für externe Programme ändern`,
                es: `Cambiar mi ID externo para las aplicaciones`
            },
            src: undefined,
            action: () => {
                let manual_app_id_key = prompt(getI18N(texts.edit_add_app_id_key), state.external_app_id);
                if (manual_app_id_key !== null && manual_app_id_key !== undefined && manual_app_id_key !== '') {
                    state.external_app_id = manual_app_id_key;
                    setStorageItem(gm_mh_external_app_id_key, state.external_app_id);
                }
                else if (manual_app_id_key === '') {
                    state.external_app_id = undefined;
                    setStorageItem(gm_mh_external_app_id_key, undefined);
                }
            },
            img: `icons/small_remove.gif`
        }
    ];
    const table_ruins_headers = [
        { id: 'img', label: { en: ``, fr: ``, de: ``, es: `` }, type: 'th' },
        { id: 'label', label: { en: `Name`, fr: 'Nom', de: `Name`, es: `Nombre` }, type: 'th' },
        {
            id: 'description',
            label: { en: `Description`, fr: `Description`, de: `Beschreibung`, es: `Descripción` },
            type: 'td'
        },
        {
            id: 'minDist',
            label: { en: `Minimum distance`, fr: `Distance minimum`, de: `Mindestabstand`, es: `Distancia mínima` },
            type: 'td'
        },
        {
            id: 'maxDist',
            label: { en: `Maximum distance`, fr: `Distance maximum`, de: `Maximale Entfernung`, es: `Distancia máxima` },
            type: 'td'
        },
        {
            id: 'camping',
            label: { en: `Camping bonus`, fr: `Bonus en camping`, de: `Campingbonus`, es: `Bono de acampada` },
            type: 'td'
        },
        {
            id: 'capacity',
            label: { en: `Capacity`, fr: `Capacité`, de: `Kapazität`, es: `Capacidad` },
            type: 'td'
        },
        { id: 'drops', label: { en: `Items`, fr: 'Objets', de: `Gegenstände`, es: `Objetos` }, type: 'td' },
    ];
    const added_ruins = [
        { id: '-1000', camping: 0, label: { en: `None`, fr: `Aucun`, de: `Kein`, es: `Ninguna` } }
    ];
    const town_type = [
        { id: 'rne', label: { de: 'Kleine Stadt', en: 'Small Town', es: 'Amateur', fr: 'Petite carte' } },
        { id: 're', label: { de: 'Entfernte Regionen', en: 'Distant Region', es: 'Leyenda', fr: 'Région éloignée' } },
        { id: 'pande', label: { de: 'Pandämonium', en: 'Pandemonium', es: 'Pandemonio', fr: 'Pandémonium' } }
    ];

    const stepper_minus_src = `${repo_img_hordes_url}icons/small_minus.gif`;
    const stepper_plus_src = `${repo_img_hordes_url}icons/small_more2.gif`;
    /**
     * Crée un champ "input number" précédé d'une icône (avec title) et entouré
     * de boutons +/- permettant d'incrémenter/décrémenter la valeur de 1.
     */
    function createNumberField(config) {
        const min_value = config.minValue ?? 0;
        const field = document.createElement('div');
        field.classList.add('mho-camping-field');
        if (config.fieldId) {
            field.id = config.fieldId;
        }
        if (config.fullWidth) {
            field.classList.add('mho-camping-field--full');
        }
        const label = document.createElement('label');
        label.htmlFor = config.id;
        label.innerHTML = `<img src="${config.iconSrc}" title="${config.title}">`;
        const minus = document.createElement('img');
        minus.src = stepper_minus_src;
        minus.alt = '-';
        minus.classList.add('mho-camping-stepper-btn');
        const input = document.createElement('input');
        input.type = 'number';
        input.id = config.id;
        input.value = String(config.initialValue);
        input.min = String(min_value);
        input.classList.add('mho-input', 'inline');
        const plus = document.createElement('img');
        plus.src = stepper_plus_src;
        plus.alt = '+';
        plus.classList.add('mho-camping-stepper-btn');
        const dispatch_change = () => {
            input.dispatchEvent(new Event('change'));
        };
        minus.addEventListener('click', (_event) => {
            const current = Number(input.value) || 0;
            input.value = String(Math.max(min_value, current - 1));
            dispatch_change();
        });
        plus.addEventListener('click', (_event) => {
            const current = Number(input.value) || 0;
            input.value = String(current + 1);
            dispatch_change();
        });
        input.addEventListener('change', (event) => {
            const target = event.target;
            config.onChange(Number(target.value));
        });
        field.appendChild(label);
        field.appendChild(minus);
        field.appendChild(input);
        field.appendChild(plus);
        return field;
    }
    function displayCampingPredict() {
        setTimeout(() => {
            let camping_predict_container = document.getElementById(mho_camping_predict_id);
            let zone_camp = document.querySelector('.zone-camp');
            if (state.mho_parameters.display_camping_predict && pageIsDesert() && zone_camp) {
                if (camping_predict_container)
                    return;
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
                    let conf = {
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
                    };
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
                    });
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
                    });
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
                    });
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
                    });
                    r4_div.appendChild(r4);
                    r4_div.appendChild(r4_label);
                    /** Grille 2 colonnes pour les compteurs du bloc "Le citoyen" */
                    let citizen_numbers_grid = document.createElement('div');
                    citizen_numbers_grid.classList.add('mho-camping-numbers-grid');
                    my_info_content.appendChild(citizen_numbers_grid);
                    /** Nombre de nuits déjà campées */
                    let nb_campings_field = createNumberField({
                        id: 'nb-campings',
                        iconSrc: `${repo_img_hordes_url}emotes/sleep.gif`,
                        title: getI18N(texts.nb_campings),
                        initialValue: conf.campings,
                        onChange: (value) => {
                            conf.campings = value;
                            calculateCamping(conf);
                        }
                    });
                    citizen_numbers_grid.appendChild(nb_campings_field);
                    /** Nombre de toiles de tente ou pelure de peau */
                    let objects_in_bag_field = createNumberField({
                        id: 'nb-objects',
                        iconSrc: `${repo_img_hordes_url}emotes/bag.gif`,
                        title: getI18N(texts.objects_in_bag),
                        initialValue: conf.objects,
                        onChange: (value) => {
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
                        let current_ruin = all_ruins.find((_current_ruin) => +_current_ruin.id === +conf.ruin);
                        conf.ruinBonus = current_ruin.camping;
                        conf.ruinCapacity = current_ruin.capacity;
                        let digs_field = document.querySelector('#digs-field');
                        if (+current_ruin.id === -1) {
                            digs_field.style.display = 'block';
                        }
                        else {
                            digs_field.style.display = 'none';
                            digs_field.querySelector('input').value = (0);
                        }
                        calculateCamping(conf);
                    });
                    ruin_type_div.appendChild(select_ruin_label);
                    ruin_type_div.appendChild(select_ruin);
                    /** Nombre de tas sur le bat ? */
                    let digs_field = createNumberField({
                        id: 'digs',
                        fieldId: 'digs-field',
                        fullWidth: true,
                        iconSrc: `${repo_img_hordes_url}icons/uncover.gif`,
                        title: getI18N(texts.digs),
                        initialValue: conf.ruinBuryCount,
                        onChange: (value) => {
                            conf.ruinBuryCount = value;
                            calculateCamping(conf);
                        }
                    });
                    digs_field.style.display = 'none';
                    cell_info_content.appendChild(digs_field);
                    /** Grille 2 colonnes pour les compteurs du bloc "Le bâtiment" */
                    let building_numbers_grid = document.createElement('div');
                    building_numbers_grid.classList.add('mho-camping-numbers-grid');
                    cell_info_content.appendChild(building_numbers_grid);
                    /** Nombre de zombies sur la case */
                    let zombies_field = createNumberField({
                        id: 'nb-zombies',
                        iconSrc: `${repo_img_hordes_url}emotes/zombie.gif`,
                        title: getI18N(texts.zombies_on_cell),
                        initialValue: conf.zombies,
                        onChange: (value) => {
                            conf.zombies = value;
                            calculateCamping(conf);
                        }
                    });
                    building_numbers_grid.appendChild(zombies_field);
                    /** Nombre de personnes déjà cachées */
                    let hidden_campers_field = createNumberField({
                        id: 'hidden-campers',
                        iconSrc: `${repo_img_hordes_url}emotes/human.gif`,
                        title: getI18N(texts.hidden_campers),
                        initialValue: conf.hiddenCampers,
                        onChange: (value) => {
                            conf.hiddenCampers = value;
                            calculateCamping(conf);
                        }
                    });
                    building_numbers_grid.appendChild(hidden_campers_field);
                    /** Nombre d'améliorations simples sur la case */
                    let improve_field = createNumberField({
                        id: 'nb-improve',
                        iconSrc: `${repo_img_hordes_url}icons/small_refine.gif`,
                        title: getI18N(texts.improve),
                        initialValue: conf.improve,
                        onChange: (value) => {
                            conf.improve = value;
                            calculateCamping(conf);
                        }
                    });
                    building_numbers_grid.appendChild(improve_field);
                    /** Nombre d'objets de campement installés sur la case */
                    let object_improve_field = createNumberField({
                        id: 'nb-object-improve',
                        iconSrc: `${repo_img_hordes_url}item/cat_def.gif`,
                        title: getI18N(texts.object_improve),
                        initialValue: conf.objectImprove,
                        onChange: (value) => {
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
                    });
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
                    });
                    phare_div.appendChild(phare);
                    phare_div.appendChild(phare_label);
                });
            }
            else if (camping_predict_container) {
                camping_predict_container.remove();
            }
        }, 500);
    }

    function displayCellDetailsOnPage() {
        if (state.mho_parameters.display_more_informations_from_mho && pageIsDesert()) {
            let cell = getCellDetailsByPosition();
            let cell_informations = document.querySelector('#cell-informations');
            if (cell) {
                state.current_cell = cell;
                if (!cell_informations) {
                    cell_informations = document.createElement('div');
                    cell_informations.id = 'cell-informations';
                    cell_informations.classList.add('row');
                    let cell_informations_div = document.createElement('div');
                    cell_informations_div.style.width = '100%';
                    cell_informations_div.classList.add('background', 'cell');
                    cell_informations.appendChild(cell_informations_div);
                    let cell_informations_header = document.createElement('h5');
                    cell_informations_header.style.marginTop = '0';
                    cell_informations_header.style.display = 'flex';
                    cell_informations_header.style.justifyContent = 'space-between';
                    cell_informations_header.style.alignItems = 'center';
                    cell_informations_div.appendChild(cell_informations_header);
                    let cell_informations_header_left = document.createElement('div');
                    cell_informations_header_left.innerHTML = `<img src="${mh_optimizer_icon}" style="width: 24px; height: 24px; margin-right: 0.5em">${getI18N(texts.additional_informations)}`;
                    cell_informations_header.appendChild(cell_informations_header_left);
                    let cell_informations_header_right = document.createElement('div');
                    cell_informations_header_right.innerText = `🗘`;
                    cell_informations_header_right.style.fontSize = '16px';
                    cell_informations_header_right.style.cursor = 'pointer';
                    cell_informations_header.appendChild(cell_informations_header_right);
                    cell_informations_header_right.addEventListener('click', () => {
                        if (cell_informations.querySelector('#cell-note-content')) {
                            cell_informations.querySelector('#cell-note-content').innerText = '🗘';
                        }
                        if (cell_informations.querySelector('#cell-digs-content')) {
                            cell_informations.querySelector('#cell-digs-content').innerText = '🗘';
                        }
                        if (cell_informations.querySelector('#cell-ruin-content')) {
                            cell_informations.querySelector('#cell-ruin-content').innerText = '🗘';
                        }
                        getMap().then(() => {
                            cell = getCellDetailsByPosition();
                            updateInformations(cell);
                        });
                    });
                    let cell_informations_content = document.createElement('div');
                    cell_informations_content.style.display = 'flex';
                    cell_informations_content.style.flexDirection = 'column';
                    cell_informations_content.style.gap = '0.5em';
                    cell_informations_div.appendChild(cell_informations_content);
                    let createSubBlock = (id, title) => {
                        let sub_block = document.createElement('div');
                        sub_block.id = id;
                        cell_informations_content.appendChild(sub_block);
                        let sub_block_header = document.createElement('h5');
                        sub_block_header.id = id + '-header';
                        sub_block_header.style.marginTop = '0';
                        sub_block_header.style.borderBottomWidth = '1px';
                        sub_block_header.style.fontWeight = 'normal';
                        sub_block_header.innerText = title;
                        sub_block.appendChild(sub_block_header);
                        let sub_block_content = document.createElement('div');
                        sub_block_content.id = id + '-content';
                        sub_block.appendChild(sub_block_content);
                    };
                    let map_box = document.querySelector('.map-box');
                    map_box.parentElement.parentElement.appendChild(cell_informations);
                    let cell_note = createSubBlock('cell-note', getI18N(texts.note));
                    let cell_digs = createSubBlock('cell-digs', getI18N(texts.digs_state_header));
                    if (state.current_cell.idRuin !== null && state.current_cell.idRuin !== undefined) {
                        let cell_ruin = createSubBlock('cell-ruin', getI18N(texts.ruin_state_header));
                    }
                }
                let insertCellNote = (cell) => {
                    if (cell_informations.querySelector('#cell-note-content')) {
                        cell_informations.querySelector('#cell-note-content').innerHTML = cell.note && cell.note !== ''
                            ? `<div>${cell.note}</div>`
                            : `<div style="opacity: 0.5; font-style: italic; font-size: 12px;">${getI18N(texts.no_note)}</div>`;
                    }
                };
                let insertCellDigs = (cell) => {
                    if (cell_informations.querySelector('#cell-digs-content')) {
                        cell_informations.querySelector('#cell-digs-content').innerHTML = `
                    <div>${getI18N(texts.digs_max)} : ${Math.round(cell.maxPotentialRemainingDig - cell.totalSucces)}</div>
                    <div>${getI18N(texts.digs_average)} : ${Math.round(cell.averagePotentialRemainingDig - cell.totalSucces)}</div>
                `;
                    }
                };
                let insertRuinDigs = (cell) => {
                    if (state.current_cell.idRuin !== null && state.current_cell.idRuin !== undefined && state.current_cell.idRuin > 0) {
                        let current_ruin = state.ruins.find((ruin) => ruin.id === state.current_cell.idRuin);
                        let empty_text = `<div style="opacity: 0.5; font-style: italic; font-size: 12px;">${getI18N(texts.ruin_dried)}</div>`;
                        let complete_text = `<div>${getI18N(texts.ruin_not_dried)}</div>`;
                        let ruin_drops = ``;
                        if (current_ruin && (current_ruin.explorable || !state.current_cell.isRuinDryed)) {
                            ruin_drops += `<div style="display: flex; flex-direction: row; gap: 0.5em; flex-wrap: wrap; font-size: 12px;">`;
                            if (current_ruin?.drops) {
                                current_ruin.drops.forEach((drop) => {
                                    ruin_drops += `<span style="display: flex; flex-direction: column; align-items: center;"><img src="${repo_img_hordes_url}/${drop.item.img}">${Math.round(drop.probability * 100 * 10) / 10}%</span>`;
                                });
                            }
                        }
                        ruin_drops += `</div>`;
                        if (cell_informations.querySelector('#cell-ruin-content')) {
                            cell_informations.querySelector('#cell-ruin-content').innerHTML = (!current_ruin?.explorable ? (state.current_cell.isRuinDryed ? empty_text : complete_text) : '') + ruin_drops;
                        }
                    }
                };
                let updateInformations = (cell) => {
                    insertCellNote(cell);
                    insertCellDigs(cell);
                    insertRuinDigs(cell);
                };
                updateInformations(cell);
            }
        }
        else {
            state.current_cell = undefined;
        }
    }

    function preventFromLeaving() {
        if (state.mho_parameters.alert_if_no_escort && state.mho_parameters.prevent_from_leaving && pageIsDesert()) {
            let prevent_function = (event) => {
                let e = event || window.event;
                let ae_button = document.querySelector('button[x-toggle-escort="1"]:not([x-escort-control-endpoint])');
                if (ae_button) {
                    let mho_leaving_info = document.getElementById('mho-leaving-info');
                    if (!mho_leaving_info) {
                        mho_leaving_info = document.createElement('div');
                        mho_leaving_info.id = 'mho-leaving-info';
                        mho_leaving_info.setAttribute('style', 'background-color: red; padding: 0.5em; margin-top: 0.5em; border: 1px solid;');
                        mho_leaving_info.innerText = getI18N(texts.prevent_from_leaving_information) + getI18N(texts.prevent_not_in_ae);
                        ae_button.parentNode.insertBefore(mho_leaving_info, ae_button.nextSibling);
                    }
                }
                let is_escorting = document.getElementsByClassName('beyond-escort-on')[0];
                if (is_escorting) {
                    let mho_leaving_info = document.getElementById('mho-leaving-info');
                    if (!mho_leaving_info) {
                        mho_leaving_info = document.createElement('div');
                        mho_leaving_info.id = 'mho-leaving-info';
                        mho_leaving_info.setAttribute('style', 'background-color: red; padding: 0.5em; margin-top: 0.5em; border: 1px solid;');
                        mho_leaving_info.innerText = getI18N(texts.prevent_from_leaving_information) + getI18N(texts.escort_not_released);
                        is_escorting.parentNode.insertBefore(mho_leaving_info, is_escorting.nextSibling);
                    }
                }
                /** Si est en AE ou qu'on n'a pas reposé l'escorte */
                if (ae_button || is_escorting) {
                    if (e) {
                        e.returnValue = '';
                        e.preventDefault();
                    }
                    return '';
                }
            };
            window.addEventListener('beforeunload', prevent_function, false);
        }
    }
    /** Si l'option associée est activée, demande confirmation avant de quitter si les options d'escorte ne sont pas bonnes */
    function alertIfInactiveAndNoEscort() {
        if (state.mho_parameters.alert_if_no_escort && state.mho_parameters.alert_if_inactive && pageIsDesert()) {
            let ae_button = document.querySelector('button[x-toggle-escort="1"]:not([x-escort-control-endpoint])');
            let is_escorting = document.getElementsByClassName('beyond-escort-on')[0];
            let notify = () => {
                createNotification(getI18N(ae_button ? texts.prevent_not_in_ae : texts.escort_not_released));
            };
            if (ae_button || is_escorting) {
                const timer = 300000;
                let timeout = setTimeout(notify, timer);
                document.addEventListener('click', () => {
                    clearTimeout(timeout);
                    timeout = setTimeout(timeout, timer);
                });
                document.addEventListener('mousemove', () => {
                    clearTimeout(timeout);
                    timeout = setTimeout(timeout, timer);
                });
            }
        }
    }
    /** Affiche une notification 5 secondes avant la fin de la fouille en cours */
    function changeDefaultEscortOptions() {
        if (state.mho_parameters.default_escort_options && pageIsDesert()) {
            const btn_activate_escort = document.querySelector('button[x-toggle-escort="1"]:not([x-escort-control-endpoint])');
            if (!btn_activate_escort)
                return;
            btn_activate_escort.addEventListener('click', () => {
                document.addEventListener('mh-navigation-complete', () => {
                    const escort_force_return = document.querySelector('#escort_force_return');
                    const escort_allow_rucksack = document.querySelector('#escort_allow_rucksack');
                    if (!escort_force_return || !escort_allow_rucksack)
                        return;
                    const escort_force_return_correct = escort_force_return.checked === state.mho_parameters.default_escort_force_return;
                    const escort_allow_rucksack_correct = escort_allow_rucksack.checked === state.mho_parameters.default_escort_allow_rucksack;
                    if (!escort_force_return_correct && !escort_allow_rucksack_correct) {
                        escort_force_return.checked = !escort_force_return.checked;
                        escort_allow_rucksack.click();
                    }
                    else if (!escort_force_return_correct || !escort_allow_rucksack_correct) {
                        if (!escort_force_return_correct) {
                            escort_force_return.click();
                        }
                        if (!escort_allow_rucksack_correct) {
                            escort_allow_rucksack.click();
                        }
                    }
                }, { once: true });
            });
        }
    }

    function getCitizens() {
        return new Promise((resolve, reject) => {
            fetcher(state.api_url + `/Fetcher/citizens?userId=${state.mh_user.id}&townId=${state.mh_user.townDetails?.townId}`)
                .then((response) => {
                if (response.status === 200) {
                    return response.json();
                }
                else {
                    return convertResponsePromiseToError(response);
                }
            })
                .then((response) => {
                state.citizens = response;
                state.citizens.citizens = Object.keys(state.citizens.citizens).map((key) => state.citizens.citizens[key]);
                resolve(state.citizens);
            })
                .catch((error) => {
                addError(error);
                reject(error);
            });
        });
    }
    /** Récupère les informations de la banque */

    function getMyExpeditions() {
        return new Promise((resolve, reject) => {
            fetcher(state.api_url + `/expeditions/me/${state.mh_user.townDetails?.day}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then((response) => {
                if (response.status === 200) {
                    return response.json();
                }
                else {
                    return convertResponsePromiseToError(response);
                }
            })
                .then((expeditions) => {
                state.my_expeditions = expeditions;
                resolve(expeditions);
            })
                .catch((error) => {
                addError(error);
                reject(error);
            });
        });
    }

    function createExpeditionsBtn() {
        let expeditions_btn = document.getElementById(mho_display_expeditions_id);
        if (state.mho_parameters.display_my_expeditions) {
            createWindow(mho_expeditions_window_id, false);
            const mho_header_space = document.getElementById(mho_header_space_id);
            if (expeditions_btn || !mho_header_space)
                return;
            let btn_container = document.createElement('div');
            btn_container.id = mho_display_expeditions_id;
            let postbox_img = document.querySelector('#postbox img');
            let btn_mho_img = document.createElement('img');
            btn_mho_img.src = mh_optimizer_icon;
            btn_mho_img.style.height = postbox_img && postbox_img.height ? postbox_img.height + 'px' : '16px';
            btn_container.appendChild(btn_mho_img);
            let btn_img = document.createElement('img');
            btn_img.src = repo_img_hordes_url + '/icons/planner.gif';
            btn_img.style.height = postbox_img && postbox_img.height ? postbox_img.height + 'px' : '16px';
            btn_container.appendChild(btn_img);
            mho_header_space.appendChild(btn_container);
            btn_container.addEventListener('click', (event) => {
                event.stopPropagation();
                event.preventDefault();
                document.getElementById(mho_expeditions_window_id).classList.add('visible');
                createExpeditionsWindowContent();
            });
        }
        else if (expeditions_btn) {
            expeditions_btn.remove();
        }
    }
    function createExpeditionsWindowContent() {
        let get_my_expeditions_promise = getMyExpeditions();
        let get_citizens_promize = getCitizens();
        Promise.all([get_my_expeditions_promise, get_citizens_promize]).then(([expeditions, citizens]) => {
            let window_content = document.querySelector(`#${mho_expeditions_window_id}-content`);
            window_content.innerHTML = '';
            let tabs_ul = document.createElement('ul');
            expeditions.forEach((expedition, index) => {
                let tab_link = document.createElement('div');
                let tab_text = document.createTextNode(expedition.label || ' ');
                tab_link.appendChild(tab_text);
                let tab_li = document.createElement('li');
                tab_li.appendChild(tab_link);
                if (index === 0) {
                    tab_li.classList.add('selected');
                    dispatchExpeditionContent(expedition, citizens.citizens);
                }
                const tab_content = document.getElementById(mho_expeditions_window_id + '-tab-content');
                tab_li.addEventListener('click', () => {
                    if (!tab_li.classList.contains('selected') && tab_content !== undefined && tab_content !== null) {
                        for (let li of tabs_ul.children) {
                            li.classList.remove('selected');
                        }
                        tab_li.classList.add('selected');
                    }
                    dispatchExpeditionContent(expedition, citizens.citizens);
                });
                tabs_ul.appendChild(tab_li);
            });
            let tabs_div = document.createElement('div');
            tabs_div.id = 'tabs';
            tabs_div.appendChild(tabs_ul);
            window_content.appendChild(tabs_div);
        });
    }
    function dispatchExpeditionContent(expedition, citizens) {
        let window_content = document.getElementById(mho_expeditions_window_id + '-content');
        let tab_content = document.getElementById(mho_expeditions_window_id + '-tab-content');
        if (tab_content) {
            tab_content.remove();
        }
        tab_content = document.createElement('div');
        tab_content.id = mho_expeditions_window_id + '-tab-content';
        tab_content.classList.add('tab-content');
        window_content.appendChild(tab_content);
        expedition.parts.forEach((part, index) => {
            let part_content = document.createElement('div');
            tab_content.appendChild(part_content);
            if (part.label) {
                let part_content_header = document.createElement('h2');
                part_content_header.innerText = part.label;
                part_content.appendChild(part_content_header);
            }
            let part_content_path = document.createElement('h5');
            part_content_path.innerText = part.path;
            part_content.appendChild(part_content_path);
            switch (part.direction) {
                case 'Süden':
                    part_content_path.innerText += ' ⇩';
                    break;
                case 'Westen':
                    part_content_path.innerText += ' ⇦';
                    break;
                case 'Osten':
                    part_content_path.innerText += ' ⇨';
                    break;
                case 'Norden':
                    part_content_path.innerText += ' ⇧';
                    break;
                default:
                    break;
            }
            let table = document.createElement('table');
            table.style.width = '100%';
            table.classList.add('mho-table');
            part_content.appendChild(table);
            let header = document.createElement('thead');
            table.appendChild(header);
            let header_row = document.createElement('tr');
            header_row.classList.add('mho-header');
            header.appendChild(header_row);
            let header_cells = [
                {
                    id: 'citizen',
                    label: {
                        de: 'Bürger',
                        en: 'Citizen',
                        es: 'Habitante',
                        fr: 'Citoyens'
                    }
                },
                {
                    id: 'isThirsty',
                    label: {
                        de: `<img src="${repo_img_hordes_url}/status/status_thirst1.gif">`,
                        en: `<img src="${repo_img_hordes_url}/status/status_thirst1.gif">`,
                        es: `<img src="${repo_img_hordes_url}/status/status_thirst1.gif">`,
                        fr: `<img src="${repo_img_hordes_url}/status/status_thirst1.gif">`
                    }
                },
                {
                    id: 'starts7ap',
                    label: {
                        de: `7<img src="${repo_img_hordes_url}/icons/ap_small.gif">`,
                        en: `7<img src="${repo_img_hordes_url}/icons/ap_small_en.gif">`,
                        es: `7<img src="${repo_img_hordes_url}/icons/ap_small_es.gif">`,
                        fr: `7<img src="${repo_img_hordes_url}/icons/ap_small_fr.gif">`
                    }
                },
                {
                    id: 'orders',
                    label: {
                        de: `Anweisungen`,
                        en: `Instructions`,
                        es: `Instrucciones`,
                        fr: `Consignes`
                    }
                },
                {
                    id: 'bag',
                    label: {
                        de: `Rucksack`,
                        en: `Backpack`,
                        es: `Mochila`,
                        fr: `Sac`
                    }
                }
            ];
            header_cells.forEach((header_cell) => {
                let header_cell_html = document.createElement('th');
                header_cell_html.innerHTML = header_cell.label[lang];
                header_row.appendChild(header_cell_html);
            });
            let body = document.createElement('tbody');
            table.appendChild(body);
            part.citizens.forEach((citizen_part) => {
                let citizen_row = document.createElement('tr');
                body.appendChild(citizen_row);
                header_cells.forEach((header_cell) => {
                    let cell = document.createElement('td');
                    switch (header_cell.id) {
                        case 'citizen':
                            cell.innerText = citizens.find((citizen) => citizen.id === citizen_part.idUser)?.name ?? '';
                            break;
                        case 'isThirsty':
                            cell.innerHTML = citizen_part.isThirsty ? `<img src="${repo_img_hordes_url}status/status_thirst1.gif">` : '';
                            cell.style.textAlign = 'center';
                            break;
                        case 'starts7ap':
                            cell.innerHTML = citizen_part.nombrePaDepart === 7 ? `✓` : (citizen_part.nombrePaDepart === 6 ? '𐄂' : '');
                            cell.style.textAlign = 'center';
                            break;
                        case 'orders':
                            citizen_part.orders.forEach((order) => {
                                let order_html = document.createElement('div');
                                order_html.innerHTML = order.text;
                                cell.appendChild(order_html);
                            });
                            break;
                        case 'bag':
                            citizen_part.bag?.items?.forEach((item) => {
                                let bag_item = document.createElement('span');
                                bag_item.innerHTML = `<img src="${repo_img_hordes_url}${item.item.img}">`;
                                cell.appendChild(bag_item);
                            });
                            break;
                        default:
                            break;
                    }
                    citizen_row.appendChild(cell);
                });
            });
            let part_orders = document.createElement('div');
            part_orders.style.width = '100%';
            part.orders.forEach((order) => {
                let order_html = document.createElement('div');
                order_html.innerHTML = order.text;
                part_orders.appendChild(order_html);
            });
            part_content.appendChild(part_orders);
            if (index < expedition.parts.length - 1) {
                let separator = document.createElement('hr');
                tab_content.appendChild(separator);
            }
        });
    }
    /** Permet de bloquer / débloquer des utilisateurs et de masquer les posts des utilisateurs bloqués */

    function addExternalLinksToProfiles() {
        let mho_link_block = document.querySelector('.mho-link-blocks');
        if (state.mho_parameters.display_external_links && !mho_link_block) {
            let user_tooltip = document.querySelector('#user-tooltip');
            if (user_tooltip) {
                let user_id = user_tooltip.querySelector('[x-ajax-href]')?.getAttribute('x-ajax-href')?.replace(/\D/g, '');
                if (!user_id)
                    return;
                let dash_separators = user_tooltip.querySelectorAll('hr.dashed');
                let last_separator = Array.from(dash_separators).pop();
                let link_color = window.getComputedStyle(user_tooltip.querySelector('.link')).getPropertyValue('color');
                let new_separator = document.createElement('hr');
                new_separator.classList.add('dashed');
                last_separator.parentNode.insertBefore(new_separator, last_separator.nextSibling);
                let new_part = document.createElement('div');
                new_part.classList.add('link-blocks', 'mho-link-blocks');
                last_separator.parentNode.insertBefore(new_part, last_separator.nextSibling);
                let new_part_title = document.createElement('div');
                new_part_title.innerHTML = `<img src="${mh_optimizer_icon}" style="width: 16px; margin-right: 0.5em;">${getI18N(texts.external_profiles)}`;
                new_part_title.style.marginBottom = '0.5em';
                new_part_title.style.textAlign = 'left';
                new_part_title.style.color = link_color;
                new_part.appendChild(new_part_title);
                let bbh_link = document.createElement('a');
                bbh_link.classList.add('link-block');
                bbh_link.href = `${big_broth_hordes_url}/?pg=user&uid=5-${user_id}`;
                new_part.appendChild(bbh_link);
                bbh_link.addEventListener('click', () => user_tooltip.remove());
                let bbh_img = document.createElement('img');
                bbh_img.src = `${repo_img_url}external-tools/bbh.gif`;
                bbh_link.appendChild(bbh_img);
                let bbh_br = document.createElement('br');
                bbh_link.appendChild(bbh_br);
                let bbh_title = document.createElement('text');
                bbh_title.innerText = `BigBroth'\nHordes`;
                bbh_link.appendChild(bbh_title);
                new_part.appendChild(document.createTextNode('\u00A0'));
                let gh_link = document.createElement('a');
                gh_link.classList.add('link-block');
                gh_link.href = `${gest_hordes_url}/ame/${user_id}`;
                new_part.appendChild(gh_link);
                gh_link.addEventListener('click', () => user_tooltip.remove());
                let gh_img = document.createElement('img');
                gh_img.src = `${repo_img_url}external-tools/gh.gif`;
                gh_link.appendChild(gh_img);
                let gh_br = document.createElement('br');
                gh_link.appendChild(gh_br);
                let gh_title = document.createElement('text');
                gh_title.innerText = `Gest'Hordes`;
                gh_link.appendChild(gh_title);
                new_part.appendChild(document.createTextNode('\u00A0'));
                let empty_link = document.createElement('div');
                empty_link.classList.add('link-block', 'empty');
                new_part.appendChild(empty_link);
            }
        }
        else if (!state.mho_parameters.display_external_links && mho_link_block) {
            mho_link_block.remove();
        }
    }
    function addExternalLinksToTowns() {
        if (!pageIsTownHistory()) {
            return;
        }
        let view_town = document.querySelector('.view-town');
        if (!view_town)
            return;
        let btns_row = view_town.querySelector('button')?.parentElement;
        if (!btns_row)
            return;
        let mho_block = btns_row.querySelector('#' + mho_town_external_links_id);
        if (!state.mho_parameters.display_external_links) {
            mho_block?.remove();
            return;
        }
        if (mho_block)
            return;
        let town_id = view_town.getAttribute('data-town-id');
        if (!town_id)
            return;
        mho_block = document.createElement('div');
        mho_block.id = mho_town_external_links_id;
        mho_block.style.marginTop = '0.5em';
        mho_block.style.padding = '0.25em';
        mho_block.style.border = '1px solid #ddab76';
        btns_row.appendChild(mho_block);
        let updater_title = document.createElement('h5');
        updater_title.style.margin = '0 0 0.5em';
        let btns_title_mho_img = document.createElement('img');
        btns_title_mho_img.src = mh_optimizer_icon;
        btns_title_mho_img.style.height = '24px';
        btns_title_mho_img.style.marginRight = '0.5em';
        updater_title.appendChild(btns_title_mho_img);
        let btns_title_text = document.createElement('text');
        btns_title_text.innerText = getScriptInfo().name;
        updater_title.appendChild(btns_title_text);
        mho_block.appendChild(updater_title);
        let mho_btns_block = document.createElement('div');
        mho_block.appendChild(mho_btns_block);
        mho_btns_block.style.display = 'flex';
        mho_btns_block.style.gap = '0.5em';
        mho_btns_block.style.justifyContent = 'space-between';
        mho_btns_block.style.alignItems = 'center';
        createExternalLinksButtons(town_id).forEach((link) => {
            mho_btns_block.appendChild(link);
        });
    }
    const external_tool_links = [
        // {
        //     icon_file_name: 'bbh.gif',
        //     label: `BigBroth'\nHordes`,
        //     build_url: (town_id: string): string => `${big_broth_hordes_url}/?cid=5-${town_id}`,
        // },
        {
            icon_file_name: 'gh.gif',
            label: `Gest'\nHordes`,
            build_url: (town_id) => `${gest_hordes_url}/carte/${town_id}`,
        },
        {
            icon_file_name: 'fata.gif',
            label: `Fata\nMorgana`,
            build_url: (town_id) => `${fata_morgana_url}/spy/town/${town_id}`,
        },
    ];
    function createExternalLinksButtons(town_id) {
        return external_tool_links.map((tool_link) => {
            const link = document.createElement('button');
            link.classList.add('small');
            link.style.display = 'flex';
            link.style.alignItems = 'center';
            link.style.gap = '0.5em';
            link.onclick = () => window.open(tool_link.build_url(town_id), '_blank');
            const img = document.createElement('img');
            img.src = `${repo_img_url}external-tools/${tool_link.icon_file_name}`;
            link.appendChild(img);
            const title = document.createElement('text');
            title.innerText = tool_link.label;
            link.appendChild(title);
            return link;
        });
    }
    const mho_welcome_link_cell_class = 'mho-town-list-link-cell';
    const mho_welcome_link_header_class = 'mho-town-list-link-header-cell';
    const mho_welcome_link_panel_class = 'mho-town-list-link-panel';
    let mho_welcome_outside_click_bound = false;
    let mho_welcome_observed_element = null;
    let mho_welcome_observer = null;
    function addExternalLinksColumnToWelcomeTowns() {
        if (!pageIsWelcome()) {
            disconnectWelcomeObserver();
            return;
        }
        let onboarding = document.querySelector('hordes-game-onboarding');
        if (!onboarding)
            return;
        if (!state.mho_parameters.display_external_links) {
            removeExternalLinksColumnFromWelcomeTowns();
            disconnectWelcomeObserver();
            return;
        }
        ensureWelcomeObserver(onboarding);
        bindWelcomeOutsideClickOnce();
        let header_rows = onboarding.querySelectorAll('.row-flex.header');
        header_rows.forEach((header_row) => {
            if (header_row.querySelector('.' + mho_welcome_link_header_class))
                return;
            let header_cell = document.createElement('div');
            header_cell.classList.add('padded', 'cell', 'rw-1', 'hide-sm', mho_welcome_link_header_class);
            let header_icon = document.createElement('img');
            header_icon.src = mh_optimizer_icon;
            header_icon.alt = 'MHO';
            header_icon.style.width = '16px';
            header_cell.appendChild(header_icon);
            header_row.appendChild(header_cell);
        });
        let town_rows = onboarding.querySelectorAll('.town-row');
        town_rows.forEach((town_row) => {
            if (town_row.querySelector('.' + mho_welcome_link_cell_class))
                return;
            let town_id = town_row.getAttribute('data-town-id');
            if (!town_id)
                return;
            let link_cell = document.createElement('div');
            link_cell.classList.add('padded', 'cell', 'rw-1', 'rw-sm-2', mho_welcome_link_cell_class);
            let map_icon = document.createElement('img');
            map_icon.src = repo_img_hordes_url + 'icons/item_map.gif';
            map_icon.alt = 'Carte';
            link_cell.appendChild(map_icon);
            let panel = document.createElement('div');
            panel.classList.add(mho_welcome_link_panel_class);
            createExternalLinksButtons(town_id).forEach((link) => {
                panel.appendChild(link);
            });
            link_cell.appendChild(panel);
            link_cell.addEventListener('click', (event) => {
                event.stopPropagation();
                let was_open = panel.classList.contains('mho-open');
                closeAllWelcomeLinkPanels();
                if (!was_open) {
                    panel.classList.add('mho-open');
                    positionWelcomeLinkPanel(panel);
                }
            });
            town_row.appendChild(link_cell);
        });
    }
    function ensureWelcomeObserver(onboarding) {
        if (mho_welcome_observed_element === onboarding && mho_welcome_observer)
            return;
        disconnectWelcomeObserver();
        mho_welcome_observed_element = onboarding;
        mho_welcome_observer = new MutationObserver(() => {
            addExternalLinksColumnToWelcomeTowns();
        });
        mho_welcome_observer.observe(onboarding, { childList: true, subtree: true });
    }
    function disconnectWelcomeObserver() {
        mho_welcome_observer?.disconnect();
        mho_welcome_observer = null;
        mho_welcome_observed_element = null;
    }
    function removeExternalLinksColumnFromWelcomeTowns() {
        document.querySelectorAll('.' + mho_welcome_link_cell_class + ', .' + mho_welcome_link_header_class)
            .forEach((element) => element.remove());
    }
    function closeAllWelcomeLinkPanels() {
        document.querySelectorAll('.' + mho_welcome_link_panel_class + '.mho-open')
            .forEach((panel) => panel.classList.remove('mho-open'));
    }
    function bindWelcomeOutsideClickOnce() {
        if (mho_welcome_outside_click_bound)
            return;
        mho_welcome_outside_click_bound = true;
        document.addEventListener('click', closeAllWelcomeLinkPanels);
    }
    function positionWelcomeLinkPanel(panel) {
        panel.classList.remove('mho-align-right');
        let panel_rect = panel.getBoundingClientRect();
        let overflows_right = panel_rect.right > window.innerWidth;
        if (overflows_right) {
            panel.classList.add('mho-align-right');
        }
    }

    let fill_items_messages_pool = {
        en: [
            { title: 'Hi', content: ':iloveu:' }
        ],
        fr: [
            { title: 'Coucou', content: ':iloveu:' }
        ],
        de: [
            { title: 'Hallo', content: ':iloveu:' }
        ],
        es: [
            { title: 'Hola', content: ':iloveu:' }
        ]
    };

    function fillItemsMessages() {
        if (state.mho_parameters.fill_items_messages && pageIsMsgReceived()) {
            let row_send = document.querySelector('#rows-send');
            if (!row_send)
                return;
            let sendable_items = row_send.querySelector('.sendable-items');
            if (!sendable_items)
                return;
            let editor_block = document.querySelector('#pm-forum-editor');
            if (!editor_block)
                return;
            setTimeout(() => {
                let editor = editor_block.querySelector('hordes-twino-editor');
                if (!editor)
                    return;
                let sendable_items_item = sendable_items.querySelectorAll('li.item');
                Array.from(sendable_items_item).forEach((item) => {
                    item.addEventListener('click', () => {
                        let message_title = editor.querySelector('input');
                        let message_content = editor.querySelector('textarea');
                        if ((message_title.value === undefined || message_title.value === null || message_title.value === '')
                            && (message_content.value === undefined || message_content.value === null || message_content.value === '')) {
                            let lang_fillers = fill_items_messages_pool[lang];
                            let random_filler = lang_fillers[Math.floor(Math.random() * lang_fillers.length)];
                            message_title.setAttribute('value', random_filler.title);
                            message_title.dispatchEvent(new Event('input', { bubbles: true }));
                            message_content.value = random_filler.content;
                            message_content.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    }, { once: true });
                });
            }, 250);
        }
    }
    function blockUsersPosts() {
        if (state.mho_parameters.block_users && pageIsForum()) {
            let posts = document.querySelectorAll('.forum-post');
            if (posts) {
                Array.from(posts).forEach((post) => {
                    let blacklisted_user = post.querySelector("#blacklist");
                    let user = post.querySelector('.username');
                    let user_id = user.getAttribute('x-user-id');
                    if (user_id === state.mh_user.id.toString())
                        return;
                    getStorageItem(mho_blacklist_key).then((blacklist) => {
                        if (!blacklist) {
                            blacklist = [];
                        }
                        let is_user_in_blacklist = blacklist.some((blacklist_user_id) => blacklist_user_id === user_id);
                        let original_post_content = post.querySelector('.forum-post-content:not(.replace-original)');
                        let new_post_content = post.querySelector('.replace-original');
                        if (!blacklisted_user) {
                            blacklisted_user = document.createElement('span');
                            blacklisted_user.id = 'blacklist';
                            blacklisted_user.innerHTML = '&#10003;';
                            blacklisted_user.style.marginRight = '0.5em';
                            blacklisted_user.style.cursor = 'pointer';
                            blacklisted_user.addEventListener('click', () => {
                                getStorageItem(mho_blacklist_key).then((keys) => {
                                    let temp_blacklist = [...keys];
                                    if (!blacklisted_user.getAttribute('blacklisted')) {
                                        temp_blacklist.push(user_id);
                                        blacklisted_user.setAttribute('blacklisted', 'true');
                                        let user_posts = Array.from(document.querySelectorAll(`.username[x-user-id="${user_id}"]`) || []).map((user_tag) => user_tag.parentElement.parentElement.querySelector('.original'));
                                        user_posts.forEach((user_post) => user_post.classList.remove('force-display'));
                                    }
                                    else {
                                        let index = temp_blacklist.findIndex((blacklisted_user_id) => blacklisted_user_id === user_id);
                                        if (index > -1) {
                                            temp_blacklist.splice(index, 1);
                                            blacklisted_user.removeAttribute('blacklisted');
                                        }
                                    }
                                    setStorageItem(mho_blacklist_key, [...temp_blacklist]);
                                    getStorageItem(mho_blacklist_key).then((new_blacklist) => {
                                        blacklist = [...new_blacklist];
                                    });
                                });
                            });
                            user.parentNode.insertBefore(blacklisted_user, user);
                        }
                        if (is_user_in_blacklist) {
                            blacklisted_user.innerHTML = '&#10007;';
                            blacklisted_user.setAttribute('blacklisted', 'true');
                            original_post_content.classList.add('original');
                            if (!original_post_content.classList.contains('force-display')) {
                                original_post_content.style.display = 'none';
                            }
                            if (!new_post_content) {
                                new_post_content = document.createElement('div');
                                new_post_content.classList.add('forum-post-content', 'replace-original');
                                let link = document.createElement('a');
                                link.innerText = 'Cliquez ici pour afficher ce message.';
                                link.style.cursor = 'pointer';
                                link.addEventListener('click', ($event) => {
                                    new_post_content.style.display = 'none';
                                    original_post_content.style.display = 'block';
                                    original_post_content.classList.add('force-display');
                                });
                                new_post_content.innerHTML = `<img src="${mh_optimizer_icon}" style="width: 30px !important; vertical-align: middle; margin-right: 0.5em;"><i>L'utilisateur a été bloqué.</i><br />`;
                                new_post_content.appendChild(link);
                                original_post_content.parentNode.insertBefore(new_post_content, original_post_content);
                            }
                            else {
                                if (!original_post_content.classList.contains('force-display')) {
                                    new_post_content.style.display = 'block';
                                }
                            }
                        }
                        else {
                            blacklisted_user.innerHTML = '&#10003;';
                            blacklisted_user.removeAttribute('blacklisted');
                            if (new_post_content) {
                                new_post_content.style.display = 'none';
                            }
                            original_post_content.style.display = 'block';
                        }
                    });
                });
            }
        }
    }
    function displayCountCharacters() {
        let counter = document.querySelector('#mho_registry_counter_id');
        if (!counter && state.mho_parameters.display_counter_on_input_registry && pageIsDesert()) {
            let log_block = document.querySelector('#beyond-log');
            if (!log_block)
                return;
            let log_input = log_block.querySelector('.overlay-central input');
            if (!log_input)
                return;
            counter = document.createElement('div');
            counter.id = 'mho_registry_counter_id';
            counter.classList.add('cell', 'grow-0', 'small');
            counter.style.margin = 'auto';
            counter.innerText = `${log_input.value.length}/256`;
            log_input.parentElement?.parentElement?.parentElement?.parentElement?.parentNode.insertBefore(counter, log_input.parentElement.parentElement.parentElement.parentElement.nextSibling);
            log_input.addEventListener('input', (event) => {
                counter.innerText = `${event.srcElement.value?.trim().length ?? 0}/256`;
            });
            log_input.addEventListener('change', (event) => {
                let log_block_new = document.querySelector('#beyond-log');
                let log_input_new = log_block_new.querySelector('.overlay-central input');
                counter.innerText = `${log_block_new.value?.trim().length ?? 0}/256`;
            });
        }
        else if (counter) {
            counter.remove();
        }
    }
    /////////////////////////////////////
    // BOUTONS SUR LES OUTILS EXTERNES //
    /////////////////////////////////////

    function displayGhoulVoracityPercent() {
        if (state.mho_parameters.display_ghoul_voracity_percent) {
            let ghoul_voracity_node = document.querySelector('.status-ghoul');
            if (!ghoul_voracity_node)
                return;
            let voracite = ghoul_voracity_node.querySelector('.ghoul-hunger-bar').style.width;
            ghoul_voracity_node.firstChild.textContent = ghoul_voracity_node.firstChild.textContent.replace(':\n', `: ${voracite}\n`);
        }
    }

    function addCopyRegistryButton() {
        if (state.mho_parameters.copy_registry) {
            let logs = document.querySelector('hordes-log');
            let logs_complete_links = document.querySelector('log-complete-link');
            let copy_button = document.querySelector(`#${mho_copy_logs_id}`);
            let createCopyRegistryButtonContent = (value) => {
                return `<div style="display: flex; gap: 0.5em; align-items: center;"><img src="${mh_optimizer_icon}" style="width: 16px !important;">${value}</div>`;
            };
            if (logs && !copy_button && !logs_complete_links) {
                let title = logs.parentElement.previousElementSibling;
                let copy_button = document.createElement('a');
                title.appendChild(copy_button);
                copy_button.innerHTML = createCopyRegistryButtonContent('⧉');
                copy_button.id = mho_copy_logs_id;
                copy_button.style.backgroundColor = 'rgba(62,36,23,.75)';
                copy_button.style.borderRadius = '6px';
                copy_button.style.padding = '3px 5px';
                copy_button.style.cursor = 'pointer';
                copy_button.title = getI18N(texts.copy_registry);
                copy_button.addEventListener('click', () => {
                    let entries = logs.querySelectorAll('.log-entry:not(.hidden)');
                    let soft_entries = Array.from(entries).map((entry) => {
                        let time = entry.querySelector('.log-part-time').innerText.trim();
                        let separator = ' [X] ';
                        let content = entry.querySelector('.log-part-content').innerText.trim();
                        return time + separator + content;
                    });
                    let final_text = soft_entries.join('\n');
                    copyToClipboard(final_text);
                    copy_button.innerHTML = createCopyRegistryButtonContent(`<img src="${repo_img_hordes_url}icons/done.png">`);
                    setTimeout(() => {
                        copy_button.innerHTML = createCopyRegistryButtonContent('⧉');
                    }, 5000);
                });
                if (title) {
                    if (title.tagName.toLowerCase() === 'H5'.toLowerCase()) {
                        copy_button.style.marginRight = '0.5em';
                        copy_button.style.float = 'right';
                        copy_button.style.position = 'relative';
                        copy_button.style.bottom = '7px';
                        let first_link = title.querySelector('a');
                        if (first_link) {
                            first_link.style.marginLeft = 'auto';
                        }
                    }
                    else {
                        copy_button.style.display = 'flex';
                        copy_button.style.justifyContent = 'center';
                    }
                }
            }
        }
    }

    //////////////////////////////////////////////
    // La liste des paramètres de l'application //
    //////////////////////////////////////////////
    let params_categories = [
        {
            id: `external_tools`,
            label: {
                en: `External tools`,
                fr: `Outils externes`,
                de: `Externen Tool`,
                es: `Aplicaciones externas`
            },
            params: [
                {
                    id: `synchronize_external_tools`,
                    label: {
                        en: `External tools update`,
                        fr: `Mise à jour des outils externes`,
                        de: `Aktualisierung externer Tools`,
                        es: `Actualización de herramientas externas`
                    },
                    children: [
                        {
                            id: `update_mho`,
                            label: {
                                en: `Update MyHordes Optimiser`,
                                fr: `Mettre à jour MyHordes Optimiser`,
                                de: `MyHordes Optimiser Aktualisieren`,
                                es: `Actualizar MyHordes Optimiser`
                            },
                            children: [
                                {
                                    id: `update_mho_killed_zombies`,
                                    label: {
                                        en: `Record the number of zombies killed`,
                                        fr: `Enregistrer le nombre de zombies tués`,
                                        de: `Notieren Sie die Anzahl der getöteten Zombies`,
                                        es: `Registrar el número de zombis asesinados`
                                    },
                                },
                                // {
                                //     id: `update_mho_job_markers`,
                                //     label: {
                                //         en: `Updates information from job markers`,
                                //         fr: `Met à jour les informations issues des marqueurs de métiers`,
                                //         de: `Aktualisiert Informationen von Jobmarkierungen`,
                                //         es: `Actualiza la información de los marcadores de trabajo.`
                                //     },
                                // },
                                {
                                    id: `update_mho_devastated`,
                                    label: {
                                        en: `Zone update even after the town is in Chaos`,
                                        fr: `Mise à jour même quand la ville est en Chaos`,
                                        de: `Zonen-Update, nachdem die Stadt bereits zerstört wurde`,
                                        es: `Actualización de zona cuando los pueblo está sumida en el caos`
                                    },
                                },
                                {
                                    id: `update_mho_actions`,
                                    label: {
                                        en: `Heroic Actions`,
                                        fr: `Actions héroïques`,
                                        de: `Heldentaten`,
                                        es: `Acciones heroicas`
                                    },
                                },
                                {
                                    id: `update_mho_house`,
                                    label: {
                                        en: `Home upgrades`,
                                        fr: `Améliorations de la maison`,
                                        de: `Hausverbesserungen`,
                                        es: `Mejoras de la casa`
                                    },
                                    help: {
                                        en: `A new button will be placed on the improvements page`,
                                        fr: `Un nouveau bouton sera placé sur la page des améliorations`,
                                        de: `Auf der Verbesserungsseite wird eine neue Schaltfläche platziert`,
                                        es: `Se colocará un nuevo botón en la página de mejoras.`
                                    },
                                },
                                {
                                    id: `update_mho_bags`,
                                    label: {
                                        en: `Details of my rucksack and those of my escort`,
                                        fr: `Détail de mon sac et de ceux de mon escorte`,
                                        de: `Details meines Inventars und des Inventars meiner Eskorte`,
                                        es: `Detalles de mi mochila y las de mi escolta`
                                    },
                                },
                                // {
                                //     id: `update_mho_chest`,
                                //     label: {
                                //         en: `Items in my chest`,
                                //         fr: `Contenu de mon coffre`,
                                //         de: `Gegenstände in meiner Truhe`,
                                //         es: `Contenido de mi baúl`
                                //     },
                                // },
                                {
                                    id: `update_mho_status`,
                                    label: {
                                        en: `Status`,
                                        fr: `États`,
                                        de: `Status`,
                                        es: `Estatus`
                                    },
                                },
                                {
                                    id: `update_mho_digs`,
                                    label: {
                                        en: `Record successful searches`,
                                        fr: `Enregistrer les fouilles réussies`,
                                        de: `Zeichnen Sie erfolgreiche Ausgrabungen auf`,
                                        es: `Grabar excavaciones exitosas`
                                    },
                                },
                                // {
                                //     id: `update_mho_souls`,
                                //     label: {
                                //         en: `Record souls' positions as a chaman`,
                                //         fr: `Enregistrer les positions des âmes en tant que chaman`,
                                //         de: `Die Position der Seelen als Schamane aufzeichnen`,
                                //         es: `Registrando las posiciones de las almas como chamán`
                                //     },
                                // },
                                {
                                    id: `refresh_mho_after_update`,
                                    label: {
                                        en: `Refresh tab after update`,
                                        fr: `Rafraîchir l'onglet après la mise à jour`,
                                        de: `Registerkarte „Aktualisieren“ nach dem Update`,
                                        es: `Actualizar pestaña después de la actualización`
                                    },
                                    help: {
                                        en: `Will only work if the page is opened in a tab in the same browser window`,
                                        fr: `Ne fonctionnera que si la page est ouverte dans un onglet dans la même fenêtre du navigateur`,
                                        de: `Funktioniert nur, wenn die Seite in einem Tab im selben Browserfenster geöffnet wird`,
                                        es: `Solo funcionará si la página se abre en una pestaña en la misma ventana del navegador.`
                                    }
                                }
                            ]
                        },
                        // {
                        //     id: `update_bbh`,
                        //     label: {
                        //         en: `Update BigBroth’Hordes`,
                        //         fr: `Mettre à jour BigBroth'Hordes`,
                        //         de: `BigBroth’Hordes Aktualisieren`,
                        //         es: `Actualizar BigBroth'Hordes`
                        //     },
                        //     children: [
                        //         {
                        //             id: `refresh_bbh_after_update`,
                        //             label: {
                        //                 en: `Refresh tab after update`,
                        //                 fr: `Rafraîchir l'onglet après la mise à jour`,
                        //                 de: `Registerkarte „Aktualisieren“ nach dem Update`,
                        //                 es: `Actualizar pestaña después de la actualización`
                        //             },
                        //             help: {
                        //                 en: `Will only work if the page is opened in a tab in the same browser window`,
                        //                 fr: `Ne fonctionnera que si la page est ouverte dans un onglet dans la même fenêtre du navigateur`,
                        //                 de: `Funktioniert nur, wenn die Seite in einem Tab im selben Browserfenster geöffnet wird`,
                        //                 es: `Solo funcionará si la página se abre en una pestaña en la misma ventana del navegador.`
                        //             }
                        //         }
                        //     ]
                        // },
                        {
                            id: `update_gh`,
                            label: {
                                en: `Update Gest’Hordes`,
                                fr: `Mettre à jour Gest'Hordes`,
                                de: `Gest’Hordes aktualisieren`,
                                es: `Actualizar Gest'Hordes`
                            },
                            children: [
                                {
                                    id: `update_gh_killed_zombies`,
                                    label: {
                                        en: `Record the number of zombies killed`,
                                        fr: `Enregistrer le nombre de zombies tués`,
                                        de: `Notieren Sie die Anzahl der getöteten Zombies`,
                                        es: `Registrar el número de zombis asesinados`
                                    },
                                },
                                {
                                    id: `update_gh_devastated`,
                                    label: {
                                        en: `Zone update even after the town is in Chaos`,
                                        fr: `Mise à jour quand la ville est en Chaos`,
                                        de: `Zonen-Update, nachdem die Stadt bereits zerstört wurde`,
                                        es: `Actualización de zona cuando los pueblo está sumida en el caos`
                                    },
                                },
                                {
                                    id: `update_gh_ah`,
                                    label: {
                                        en: `Heroic Actions`,
                                        fr: `Actions héroïques`,
                                        de: `Heldentaten`,
                                        es: `Acciones heroicas`
                                    },
                                },
                                {
                                    id: `update_gh_amelios`,
                                    label: {
                                        en: `Home upgrades`,
                                        fr: `Améliorations de la maison`,
                                        de: `Hausverbesserungen`,
                                        es: `Mejoras de la casa`
                                    },
                                    help: {
                                        en: `A new button will be placed on the improvements page`,
                                        fr: `Un nouveau bouton sera placé sur la page des améliorations`,
                                        de: `Auf der Verbesserungsseite wird eine neue Schaltfläche platziert`,
                                        es: `Se colocará un nuevo botón en la página de mejoras.`
                                    },
                                },
                                {
                                    id: `update_gh_status`,
                                    label: {
                                        en: `Status`,
                                        fr: `États`,
                                        de: `Status`,
                                        es: `Estatus`
                                    },
                                },
                                {
                                    id: `refresh_gh_after_update`,
                                    label: {
                                        en: `Refresh tab after update`,
                                        fr: `Rafraîchir l'onglet après la mise à jour`,
                                        de: `Registerkarte „Aktualisieren“ nach dem Update`,
                                        es: `Actualizar pestaña después de la actualización`
                                    },
                                    help: {
                                        en: `Will only work if the page is opened in a tab in the same browser window`,
                                        fr: `Ne fonctionnera que si la page est ouverte dans un onglet dans la même fenêtre du navigateur`,
                                        de: `Funktioniert nur, wenn die Seite in einem Tab im selben Browserfenster geöffnet wird`,
                                        es: `Solo funcionará si la página se abre en una pestaña en la misma ventana del navegador.`
                                    }
                                }
                            ]
                        },
                        {
                            id: `update_fata`,
                            label: {
                                en: `Update Fata Morgana`,
                                fr: `Mettre à jour Fata Morgana`,
                                de: `Fata Morgana aktualisieren`,
                                es: `Actualizar Fata Morgana`
                            },
                            children: [
                                {
                                    id: `update_fata_killed_zombies`,
                                    label: {
                                        en: `Record the number of zombies killed`,
                                        fr: `Enregistrer le nombre de zombies tués`,
                                        de: `Notieren Sie die Anzahl der getöteten Zombies`,
                                        es: `Registrar el número de zombis asesinados`
                                    },
                                },
                                {
                                    id: `update_fata_job_markers`,
                                    label: {
                                        en: `Updates information from job markers`,
                                        fr: `Met à jour les informations issues des marqueurs de métiers`,
                                        de: `Aktualisiert Informationen von Jobmarkierungen`,
                                        es: `Actualiza la información de los marcadores de trabajo.`
                                    },
                                },
                                {
                                    id: `update_fata_devastated`,
                                    label: {
                                        en: `Update even when the town is in Chaos or when the quota is exceeded`,
                                        fr: `Mise à jour même quand la ville est en Chaos ou quand le quota est dépassé`,
                                        de: `Aktualisierung auch dann, wenn in der Stadt Chaos herrscht oder das Kontingent überschritten wird`,
                                        es: `Actualizar incluso cuando la ciudad esté en Caos o cuando se exceda la cuota`
                                    },
                                },
                                {
                                    id: `refresh_fm_after_update`,
                                    label: {
                                        en: `Refresh tab after update`,
                                        fr: `Rafraîchir l'onglet après la mise à jour`,
                                        de: `Registerkarte „Aktualisieren“ nach dem Update`,
                                        es: `Actualizar pestaña después de la actualización`
                                    },
                                    help: {
                                        en: `Will only work if the page is opened in a tab in the same browser window`,
                                        fr: `Ne fonctionnera que si la page est ouverte dans un onglet dans la même fenêtre du navigateur`,
                                        de: `Funktioniert nur, wenn die Seite in einem Tab im selben Browserfenster geöffnet wird`,
                                        es: `Solo funcionará si la página se abre en una pestaña en la misma ventana del navegador.`
                                    }
                                }
                            ]
                        },
                    ]
                },
                // {
                //     id: `display_map`,
                //     label: {
                //         en: `Allow to show a map from external tools`,
                //         fr: `Permettre d'afficher une carte issue des outils externes`,
                //         de: `Anzeigen einer Karte von externen Tools ermöglichen`,
                //         es: `Permitir que se muestre un mapa proveniente de las aplicaciones externas`
                //     },
                //     help: {
                //         en: `In any external tool, it will be possible to copy the town or ruin map and to paste it into MyHordes`,
                //         fr: `Dans les outils externes, il sera possible de copier la carte de la ville ou de la ruine, et une fois copiée de l'afficher dans MyHordes`,
                //         de: `In jedem externen Tool wird es möglich sein, die Stadt- oder Ruinenkarte zu kopieren und in MyHordes einzufügen`,
                //         es: `En toda aplicación externa, es posible copiar el mapa del pueblo o de la ruina y pegarlo en MyHordes`
                //     },
                // },
                {
                    id: `display_more_informations_from_mho`,
                    label: {
                        en: `Shows miscellaneous information from MyHordes Optimizer`,
                        fr: `Affiche des informations diverses issues de MyHordes Optimizer`,
                        de: `Zeigt Verschiedene Informationen von MyHordes Optimizer`,
                        es: `Muestra Información miscelánea de MyHordes Optimizer`
                    },
                    help: {
                        en: `Displays the note of the box, if it exists.`,
                        fr: `Affiche la note de la case, si elle existe.`,
                        de: `Zeigt die Notiz der Box an, falls vorhanden.`,
                        es: `Muestra la nota de la caja, si existe.`
                    },
                },
                {
                    id: `display_my_expeditions`,
                    label: {
                        en: `Shows details of the MyHordes Optimizer expeditions I am registered for`,
                        fr: `Affiche les détails des expéditions de MyHordes Optimizer auxquelles je suis inscrit`,
                        de: `Zeigt Details zu MyHordes Optimizer-Expeditionen an, für die ich registriert bin`,
                        es: `Muestra los detalles de las expediciones de MyHordes Optimizer a las que estoy registrado`
                    },
                },
                {
                    id: `display_external_links`,
                    label: {
                        en: `Shows links to external profiles and towns`,
                        fr: `Affiche des liens vers les profils et villes externes`,
                        de: `Zeigt Links zu externen Profilen und Städten an`,
                        es: `Muestra enlaces a perfiles y ciudades externos`
                    },
                }
            ]
        },
        {
            id: `additionnal_info`,
            label: {
                en: `Further information`,
                fr: `Informations complémentaires`,
                de: `Weitere Informationen`,
                es: `Informaciones complementarias`
            },
            params: [
                {
                    id: `enhanced_tooltips`,
                    label: {
                        en: `Detailed tooltips`,
                        fr: `Tooltips détaillés`,
                        de: `Detaillierte Tooltips`,
                        es: `Tooltips detallados`
                    },
                    children: [
                        {
                            id: `enhanced_tooltips_items`,
                            label: {
                                en: `Items`,
                                fr: `Objets`,
                                de: `Gegenstände`,
                                es: `Objetos`
                            },
                            children: [
                                {
                                    id: `enhanced_tooltips_item_quantities`,
                                    label: {
                                        en: `Bank quantity & wishlist`,
                                        fr: `Quantité en banque & liste de courses`,
                                        de: `Bankbestand & Wunschzettel`,
                                        es: `Cantidad en banco & lista de deseos`
                                    },
                                },
                                {
                                    id: `enhanced_tooltips_item_properties`,
                                    label: {
                                        en: `Properties`,
                                        fr: `Propriétés`,
                                        de: `Eigenschaften`,
                                        es: `Propiedades`
                                    },
                                },
                                {
                                    id: `enhanced_tooltips_item_actions`,
                                    label: {
                                        en: `Actions`,
                                        fr: `Actions`,
                                        de: `Aktionen`,
                                        es: `Acciones`
                                    },
                                },
                                {
                                    id: `enhanced_tooltips_item_recipes`,
                                    label: {
                                        en: `Recipes`,
                                        fr: `Recettes`,
                                        de: `Rezepte`,
                                        es: `Transformaciones`
                                    },
                                },
                                {
                                    id: `enhanced_tooltips_item_translations`,
                                    label: {
                                        en: `Translations`,
                                        fr: `Traductions`,
                                        de: `Übersetzungen`,
                                        es: `Traducciones`
                                    },
                                },
                            ]
                        },
                        {
                            id: `enhanced_tooltips_statuses`,
                            label: {
                                en: `Statuses`,
                                fr: `États`,
                                de: `Status`,
                                es: `Estatus`
                            },
                        },
                    ]
                },
                {
                    id: `display_wishlist`,
                    label: {
                        en: `Wishlist in interface`,
                        fr: `Liste de courses dans l'interface`,
                        de: `Wunschzettel in der Benutzeroberfläche`,
                        es: `Lista de deseos en la interfaz`
                    },
                },
                {
                    id: `display_estimations_on_watchtower`,
                    label: {
                        en: `Estimates saved on the watchtower page`,
                        fr: `Estimations enregistrées sur la page de la tour de guet`,
                        de: `Schätzungen, die auf der Wachturm aufgezeichnet wurden`,
                        es: `Estimaciones registradas en la página de la torre de vigilancia`
                    },
                },
                {
                    id: `display_camping_predict`,
                    label: {
                        en: `Camping predictions in area information`,
                        fr: `Prédictions de camping dans les informations du secteur`,
                        de: `Campingvorhersagen in Gebietsinformationen`,
                        es: `Predicciones para acampar en la información del área`
                    },
                },
            ]
        },
        {
            id: `display`,
            label: {
                en: `Interface improvements`,
                fr: `Améliorations de l'interface`,
                de: `Benutzeroberfläche Verbesserungen`,
                es: `Mejoras de la interfaz`
            },
            params: [
                {
                    id: `sort_and_filter`,
                    label: {
                        en: `Sorts and filters`,
                        fr: `Tris et filtres`,
                        de: `Sortierungen und Filter`,
                        es: `Ordena y filtra`
                    },
                    children: [
                        {
                            id: `display_search_fields`,
                            label: {
                                en: `Additional filters`,
                                fr: `Filtres supplémentaires`,
                                de: `Zusätzliche Filter`,
                                es: `Filtros adicionales`
                            },
                            children: [
                                {
                                    id: `hide_completed_buildings_field`,
                                    label: {
                                        en: `Hide completed projects`,
                                        fr: `Masquer les chantiers terminés`,
                                        de: `Abgeschlossene Bauprojekte ausblenden`,
                                        es: `Ocultar obras completados`
                                    },
                                },
                                {
                                    id: `display_search_field_buildings`,
                                    label: {
                                        en: `Search for a construction site`,
                                        fr: `Rechercher un chantier`,
                                        de: `Baustelle suchen`,
                                        es: `Buscar una construcción`
                                    },
                                },
                                {
                                    id: `display_search_field_recipients`,
                                    label: {
                                        en: `Find a recipient`,
                                        fr: `Rechercher un destinataire`,
                                        de: `Finden Sie einen Empfänger`,
                                        es: `Encuentra un destinatario`
                                    }
                                },
                                {
                                    id: `display_search_field_dump`,
                                    label: {
                                        en: `Search for an object in the landfill`,
                                        fr: `Rechercher un objet de la décharge`,
                                        de: `Suchen Sie nach einem Objekt auf der Mülldeponie`,
                                        es: `Buscar un objeto en el vertedero`
                                    }
                                },
                                {
                                    id: `display_search_field_registry`,
                                    label: {
                                        en: `Search the registry`,
                                        fr: `Rechercher dans le registre`,
                                        de: `Durchsuchen Sie die Registrierung`,
                                        es: `Buscar en el registro`
                                    },
                                    help: {
                                        en: `The search will only be done in the displayed lines of the registry`,
                                        fr: `La recherche ne se fera que dans les lignes affichées du registre`,
                                        de: `Die Suche erfolgt nur in den angezeigten Zeilen des Registers`,
                                        es: `La búsqueda sólo se realizará en las líneas desplegadas del registro`
                                    }
                                },
                                {
                                    id: `display_filters_citizen_list`,
                                    label: {
                                        en: `Search the citizens list`,
                                        fr: `Rechercher dans la liste des citoyens`,
                                        de: `Durchsuchen Sie die Bürgerliste`,
                                        es: `Buscar en el lista ciudadanos`
                                    }
                                },
                                {
                                    id: `display_filters_omniscience`,
                                    label: {
                                        en: `Search the omniscience`,
                                        fr: `Rechercher dans l'omniscience`,
                                        de: `Durchsuchen Sie die Omniscience`,
                                        es: `Buscar en el omnisciencia`
                                    }
                                },
                            ]
                        },
                        {
                            id: `sort_lists`,
                            label: {
                                en: `Additional sorts`,
                                fr: `Tris supplémentaires`,
                                de: `Zusätzliche Sorten`,
                                es: `Tipos adicionales`
                            },
                            children: [
                                {
                                    id: `sort_citizen_list`,
                                    label: {
                                        en: `List of citizens`,
                                        fr: `Liste des citoyens`,
                                        de: `Liste der Bürger`,
                                        es: `Lista de ciudadanos`,
                                    }
                                },
                                {
                                    id: `sort_omniscience_list`,
                                    label: {
                                        en: `Omniscience`,
                                        fr: `Omniscience`,
                                        de: `Allwissenheit`,
                                        es: `Omnisciencia`,
                                    }
                                }
                            ]
                        },
                    ]
                },
                {
                    id: `default_escort_options`,
                    label: {
                        en: `Set default escort options`,
                        fr: `Définir des options d'escorte par défaut`,
                        de: `Legen Sie Standard-Escort-Optionen fest`,
                        es: `Establecer opciones de acompañamiento predeterminadas`
                    },
                    children: [
                        {
                            id: `default_escort_force_return`,
                            label: {
                                en: `Don't allow my escort to take me further away from the town`,
                                fr: `Interdire au chef d'escorte de m'éloigner de la ville`,
                                de: `Ich will auf direktem Weg zurück zur Stadt`,
                                es: `Prohibir al jefe de la escolta alejarme del pueblo`
                            },
                        },
                        {
                            id: `default_escort_allow_rucksack`,
                            label: {
                                en: `Allow the objects in my rucksack to be viewed and used`,
                                fr: `Permettre de voir et de manipuler les objets de mon sac`,
                                de: `Zugriff auf meinen Rucksack zulassen`,
                                es: `Permitir ver y manipular los objetos en mi mochila`
                            },
                        }
                    ]
                },
                {
                    id: `automatically_open_bag`,
                    label: {
                        en: `Automatically opens the "Use an object from my rucksack" menu`,
                        fr: `Ouvre automatiquement le menu "Utiliser un objet de mon sac"`,
                        de: `Öffnet automatisch das Menü "Gegenstand verwenden"`,
                        es: `Abre automáticamente el menú "Usar un objeto de mi mochila"`
                    },
                },
                {
                    id: `display_nb_dead_zombies`,
                    label: {
                        en: `Number of zombie that died today`,
                        fr: `Nombre de zombies morts aujourd'hui`,
                        de: `Anzahl der Zombies die heute hier gestorben sind`,
                        es: `Cantidad de zombis que murieron hoy`
                    },
                    help: {
                        en: `Allows to display the number of blood splatters on the map`,
                        fr: `Permet d'afficher le nombre de taches de sang sur la carte`,
                        de: `Ermöglicht die Anzeige der Anzahl der Blutfleck auf der Karte`,
                        es: `Permite mostrar la cantidad de manchas de sangre en el mapa`
                    },
                },
                {
                    id: `display_missing_ap_for_buildings_to_be_safe`,
                    label: {
                        en: `Missing AP to repair construction sites`,
                        fr: `PA manquants pour réparer les chantiers`,
                        de: `Fehlende AP, um Konstruktionen zu reparieren`,
                        es: `PA faltantes para reparar las construcciones`
                    },
                    help: {
                        en: `In Pandemonium (Hardcore towns), the construction sites are damaged during the attack. The damages can amount to 70% max of the construction's life points (rounded up to the nearest whole number). This option displays over the constructions the number of AP needed to keep them safe.`,
                        fr: `En Pandémonium, les bâtiments prennent des dégâts lors de l'attaque. Ces dégâts équivalent à un maximum de 70% des points de vie du bâtiment (arrondi à l'entier supérieur). Cette option affiche sur les bâtiments les PA à investir pour que le bâtiment soit en sécurité.`,
                        de: `In Pandämonium-Städten nehmen Gebäude während des nächtlichen Angriffs Schaden. Diese Schäden können bis zu 70% eines Gebäudes ausmachen (aufgerundet zur nächsten ganzen Zahl). Diese Einstellung zeigt oberhalb der Bau-AP an, wieviele AP benötigt werden, um das Gebäude für die Nacht zu schützen.`,
                        es: `En Pandemonio, las construcciones sufren daños durante el ataque. Estos daños equivalen a un máximo de 70% de los puntos de vida de la construcción (redondeados al entero superior). Esta opción muestra sobre las construcciones la cantidad de PA a invertir para evitar que puedan ser destruidas.`
                    },
                },
                {
                    id: `display_translate_tool`,
                    label: {
                        en: `MyHordes' item translation bar`,
                        fr: `Barre de traduction des éléments de MyHordes`,
                        de: `Übersetzungsleiste für MyHordes Elemente`,
                        es: `Barra de traducción de elementos de MyHordes`
                    },
                    help: {
                        en: `Shows a translation bar. You must choose the initial language, then type the searched element to get the other translations.`,
                        fr: `Affiche une barre de traduction. Vous devez choisir la langue initiale, puis saisir l'élément recherché pour en récupérer les différentes traductions.`,
                        de: `Zeigt eine Übersetzungsleiste an. Sie müssen die Ausgangssprache auswählen, und dann die Zielelemente eingeben um die Übersetzungen zu generieren.`,
                        es: `Muestra una barra de traducción. Primero se debe escoger el idioma inicial, y luego ingresar el elemento buscado en la barra para obtener las distintas traducciones.`
                    },
                },
                {
                    id: `copy_registry`,
                    label: {
                        en: `Button to copy registry contents`,
                        fr: `Bouton permettant de copier le contenu du registre`,
                        de: `Schaltfläche zum Kopieren von Registrierungsinhalten hinzu`,
                        es: `Botón para copiar el contenido del registro`
                    },
                },
                {
                    id: `display_anti_abuse`,
                    label: {
                        en: `Counter to manage anti-abuse`,
                        fr: `Compteur pour gérer l'anti-abus`,
                        de: `Zähler zur Verwaltung der Missbrauchsbekämpfung an`,
                        es: `Contador para gestionar anti-abuso`
                    },
                },
                {
                    id: `display_ghoul_voracity_percent`,
                    label: {
                        en: `Percentage on the voracity gauge`,
                        fr: `Pourcentage sur la jauge de voracité`,
                        de: `Prozentsatz der Unersättlichkeitsanzeige an`,
                        es: `Porcentaje en el indicador de voracidad`
                    },
                },
                {
                    id: `store_notifications`,
                    label: {
                        en: `Stores notifications until cleared or page refreshed`,
                        fr: `Stocke les notifications jusqu'à effacement ou rafraichissement de la page`,
                        de: `Speichert Benachrichtigungen, bis sie gelöscht oder die Seite aktualisiert wird`,
                        es: `Almacena notificaciones hasta que se borran o se actualiza la página`
                    },
                },
                {
                    id: `display_counter_on_input_registry`,
                    label: {
                        en: `Character counter on the chatcase.`,
                        fr: `Compteur de caractères sur le chatcase`,
                        de: `Zeichenzähler im Chatcase an`,
                        es: `Contador de caracteres en el caso de chat`
                    },
                },
                {
                    id: `fill_items_messages`,
                    label: {
                        en: `Pre-populate the contents of empty messages containing items`,
                        fr: `Pré-remplir le contenu des messages vides contenant des objets`,
                        de: `Füllen Sie den Inhalt leerer Nachrichten mit Gegenstand vorab aus`,
                        es: `Complete previamente el contenido de mensajes vacíos que contengan objetos`
                    },
                }
                // {
                //     id: `block_users`,
                //     label: {
                //         en: `Allows to block users`,
                //         fr: `Permettre de bloquer des utilisateurs`,
                //         de: `TODO`,
                //         es: `Permite bloquear usuarios`
                //     },
                //     help: {
                //         en: `Shows an icon next to the usernames in the forum, allowing to block / unblock a user. If a user is blocked, this option will hide their messages (while allowing to show again any message).`,
                //         fr: `Affiche un icône devant les noms d'utilisateurs sur le forum, permettant de bloquer / débloquer un utilisateur.
                //         Si un utilisateur est bloqué, masque ses messages tout en permettant de réafficher chaque message au besoin.`,
                //         de: `TODO`,
                //         es: `Muestra un ícono junto a los nombres de usuario en el foro que permite bloquear / desbloquear a un usuario. Si un usuario ha sido bloqueado, sus mensajes serán ocultados (pero es posible volver a mostrar cualquier mensaje si se desea).`
                //     },
                // }
            ]
        },
        {
            id: `notifications`,
            label: {
                en: `Notifications and warnings`,
                fr: `Notifications et avertissements`,
                de: `Hinweise und Warnungen`,
                es: `Notificaciones y advertencias`
            },
            params: [
                {
                    id: `alert_if_no_escort`,
                    label: {
                        en: `Notify me when there is no escort or if you have not released your escort`,
                        fr: `Me notifier en l'absence d'escorte ou si vous n'avez pas relâché votre escorte`,
                        de: `Benachrichtigen Sie mich, wenn keine Begleitung da ist oder wenn Sie Ihre Begleitperson nicht freigegeben haben`,
                        es: `Pavísame cuando no haya escolta o si no has soltado tu escolta`
                    },
                    children: [
                        {
                            id: `prevent_from_leaving`,
                            label: {
                                en: `Ask for confirmation before leaving the page`,
                                fr: `Demander confirmation avant de quitter la page`,
                                de: `Bitten Sie um eine Bestätigung, bevor Sie die Seite verlassen`,
                                es: `Pide confirmación antes de salir de la página`
                            },
                        },
                        {
                            id: `alert_if_inactive`,
                            label: {
                                en: `Notify me if I'm inactive for more than 5 minutes on the page`,
                                fr: `Me notifier si je suis inactif depuis 5 minutes sur la page`,
                                de: `Benachrichtigen Sie mich, wenn ich länger als 5 Minuten auf der Seite inaktiv bin`,
                                es: `Notificarme si estoy inactivo por más de 5 minutos en la página`
                            },
                        }
                    ]
                },
                {
                    id: `notify_on_search_end`,
                    label: {
                        en: `Notify me at the end of a search`,
                        fr: `Me notifier à la fin de la fouille`,
                        de: `Mich Benachrichtigen am Ende einer Grabungsaktion`,
                        es: `Notificarme al final de la búsquedas`
                    },
                    help: {
                        en: `Allows to receive a notification when a search ends if the page was not closed in the meantime`,
                        fr: `Permet de recevoir une notification lorsque la fouille est terminée si la page n'a pas été quittée entre temps`,
                        de: `Ermöglicht den Erhalt einer Benachrichtigung wann eine Grabungsaktion endet wenn die Seite in der Zwischenzeit nicht geschlossen wurde`,
                        es: `Permite recibir una notificación al terminar una búsqueda si la página no ha sido cerrada entre tanto`
                    },
                }
            ]
        }
    ];

    function createSelectWithSearch() {
        let select_complete = document.createElement('div');
        let select = document.createElement('label');
        let input = document.createElement('input');
        input.classList.add('mho-input');
        input.type = 'text';
        input.autocomplete = 'off';
        let close = document.createElement('div');
        close.innerHTML = '&#128473';
        close.setAttribute('style', 'position: relative; float: right; top: -23px; color: #5c2b20;');
        select.appendChild(input);
        select.appendChild(close);
        select_complete.appendChild(select);
        let options = document.createElement('div');
        options.classList.add('hidden');
        options.setAttribute('style', 'position: absolute; background: #5c2b20; border: 1px solid #ddab76; box-shadow: 0 0 3px #000; outline: 1px solid #000; color: #ddab76; max-height: 50vh; overflow: auto;');
        input.addEventListener('keyup', (event) => {
            let temp_input = input.value.replace(/\W*/gm, '');
            if (temp_input.length > 2) {
                options.classList.remove('hidden');
            }
            else if (!options.classList.contains('hidden')) {
                options.classList.add('hidden');
            }
        });
        close.addEventListener('click', () => {
            if (!options.classList.contains('hidden')) {
                options.classList.add('hidden');
            }
            input.value = '';
        });
        select_complete.appendChild(options);
        return select_complete;
    }
    // Module-level flag: ensures the global "close any open filter dropdown on
    // outside click" listener is only ever registered once, regardless of how
    // many times filters get (re)created across page navigations.
    let mho_checkbox_dropdown_listener_attached = false;
    /**
     * Enregistre une seule fois un listener global qui ferme tout volet de filtre ouvert
     * lors d'un clic en dehors de celui-ci. Évite l'accumulation de listeners à chaque
     * (re)création de filtres lors des navigations entre pages.
     */
    function ensureCheckboxDropdownGlobalListener() {
        if (mho_checkbox_dropdown_listener_attached)
            return;
        document.addEventListener('click', () => {
            document.querySelectorAll('.mho-checkbox-dropdown-panel').forEach((panel) => {
                panel.style.display = 'none';
            });
        });
        mho_checkbox_dropdown_listener_attached = true;
    }
    /**
     * Crée un filtre multi-valeurs sous forme de volet déroulant avec cases à cocher.
     * Le trigger est un véritable <select> (avec une seule option dynamique) afin de
     * récupérer gratuitement le style natif appliqué par le site aux <select>, sans
     * avoir à dupliquer ses couleurs dans notre CSS.
     * @param {string} labelText
     * @param {string} id
     * @param {{value: string, text: string}[]} options
     * @param {() => void} onChange
     * @returns {{ container: HTMLDivElement, getSelectedValues: () => string[] }}
     */
    function createCheckboxDropdown(labelText, id, options, onChange) {
        ensureCheckboxDropdownGlobalListener();
        let container = document.createElement('div');
        container.classList.add('mho-filter-field');
        let label = document.createElement('label');
        label.innerText = labelText;
        label.classList.add('mho-filter-label');
        container.appendChild(label);
        let toggle = document.createElement('select');
        toggle.id = id;
        toggle.classList.add('mho-input', 'mho-dropdown-toggle');
        let toggleOption = document.createElement('option');
        toggle.appendChild(toggleOption);
        container.appendChild(toggle);
        let panel = document.createElement('div');
        panel.classList.add('mho-checkbox-dropdown-panel');
        container.appendChild(panel);
        let checkboxes = [];
        let updateToggleLabel = () => {
            let selectedCount = checkboxes.filter((checkbox) => checkbox.checked).length;
            toggleOption.innerText = selectedCount === 0
                ? getI18N(texts.filter_all)
                : `${selectedCount} ${getI18N(texts.filter_selected_count)}`;
        };
        options.forEach(({ value, text, icon }) => {
            let optionLine = document.createElement('div');
            let checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = value;
            checkbox.id = `${id}-opt-${value}`;
            checkbox.classList.add('mho-input');
            let optionLabel = document.createElement('label');
            optionLabel.htmlFor = checkbox.id;
            optionLabel.title = text;
            if (icon) {
                let optionIcon = document.createElement('img');
                optionIcon.src = icon;
                optionIcon.alt = text;
                optionIcon.classList.add('mho-dropdown-option-icon');
                optionLabel.appendChild(optionIcon);
            }
            else {
                optionLabel.innerText = text;
            }
            checkbox.addEventListener('change', () => {
                updateToggleLabel();
                onChange();
            });
            optionLine.appendChild(checkbox);
            optionLine.appendChild(optionLabel);
            panel.appendChild(optionLine);
            checkboxes.push(checkbox);
        });
        let togglePanel = () => {
            let wasOpen = panel.style.display === 'block';
            document.querySelectorAll('.mho-checkbox-dropdown-panel').forEach((p) => {
                p.style.display = 'none';
            });
            panel.style.display = wasOpen ? 'none' : 'block';
        };
        // Bloque l'ouverture du volet natif du <select> ; on pilote nous-mêmes le panneau.
        toggle.addEventListener('mousedown', (event) => {
            event.preventDefault();
        });
        // Le 'click' (qui suit le mousedown) bubble normalement : stopPropagation empêche
        // le listener global document (fermeture des panneaux) de refermer celui qu'on ouvre.
        toggle.addEventListener('click', (event) => {
            event.stopPropagation();
            toggle.focus();
            togglePanel();
        });
        toggle.addEventListener('keydown', (event) => {
            if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
                event.preventDefault();
                togglePanel();
            }
            else if (event.key === 'Escape') {
                panel.style.display = 'none';
            }
        });
        panel.addEventListener('click', (event) => event.stopPropagation());
        updateToggleLabel();
        let syncPanelWidth = () => {
            panel.style.width = `${toggle.offsetWidth}px`;
        };
        // Le select peut changer de largeur quand son contenu texte change
        // (ex: "2 sélectionné(s)" vs "Tous"), donc on resynchronise le panel
        // à chaque redimensionnement plutôt qu'une seule fois au chargement.
        let toggleResizeObserver = new ResizeObserver(syncPanelWidth);
        toggleResizeObserver.observe(toggle);
        setTimeout(() => {
            let toggleComputedStyle = getComputedStyle(toggle);
            panel.style.backgroundColor = toggleComputedStyle.backgroundColor;
            panel.style.color = toggleComputedStyle.color;
            syncPanelWidth();
        }, 0);
        return {
            container,
            getSelectedValues: () => checkboxes.filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value),
            destroy: () => toggleResizeObserver.disconnect()
        };
    }
    /**
     * Crée un <select> simple avec son label dans un conteneur flex-column.
     * @param {string} labelText
     * @param {string} id
     * @param {{value: string, text: string}[]} options
     * @param {string[]} classList
     * @returns {{ container: HTMLDivElement, select: HTMLSelectElement }}
     */
    function createSingleFilterSelect(labelText, id, options, classList = []) {
        let container = document.createElement('div');
        container.classList.add('mho-filter-field', ...classList);
        let label = document.createElement('label');
        label.htmlFor = id;
        label.innerText = labelText;
        label.classList.add('mho-filter-label');
        container.appendChild(label);
        let select = document.createElement('select');
        select.id = id;
        select.classList.add('mho-input');
        options.forEach(({ value, text }) => {
            let opt = document.createElement('option');
            opt.value = value;
            opt.innerText = text;
            select.appendChild(opt);
        });
        container.appendChild(select);
        return { container, select };
    }

    // Local helper: TypeScript's arrFrom(any) sometimes infers element type
    // 'unknown' rather than 'any' when the source isn't a statically-typed
    // iterable. This explicit-any wrapper avoids that, matching the original
    // untyped JS behaviour (no behaviour change, pure typing aid).
    const arrFrom$1 = (x) => Array.from(x);
    function displaySearchFields() {
        if (state.mho_parameters.display_search_fields) {
            displaySearchFieldOnBuildings();
            displaySearchFieldOnRecipientList();
            displaySearchFieldOnRegistry();
            displaySearchFieldOnDump();
            hideCompletedBuildings();
            displayFiltersOnOmniscience();
            displayFiltersOnCitizenList();
        }
    }
    /** Si l'option associée est activée, masque les chantiers complétés sur la page de chantiers */
    function hideCompletedBuildings() {
        let hideBuildings = (buildings) => {
            let building_rows = [];
            buildings.forEach((building) => {
                building_rows.push(...arrFrom$1(building.querySelectorAll('.building')));
            });
            /** Masque les lignes de chantiers devant être masquées */
            building_rows.forEach((building_row) => {
                if (building_row.classList.contains('complete') && !building_row.querySelector('.to_repair')) {
                    building_row.classList.add('mho-hidden');
                }
                else {
                    building_row.classList.remove('mho-hidden');
                }
            });
            /** Masque les catégories de chantiers dont toutes les lignes ont été masquées */
            buildings.forEach((building) => {
                if (arrFrom$1(building.children).filter((child) => child.classList.contains('building')).every((child) => child.classList.contains('mho-hidden'))) {
                    building.classList.add('mho-hidden');
                }
                else {
                    building.classList.remove('mho-hidden');
                }
            });
        };
        let showBuildings = (buildings) => {
            buildings?.forEach((building) => {
                if (building.classList.contains('mho-hidden')) {
                    building.classList.remove('mho-hidden');
                }
                arrFrom$1(building.querySelectorAll('.building.mho-hidden')).forEach((buildingRow) => {
                    buildingRow.classList.remove('mho-hidden');
                });
            });
        };
        let observeBuildings = () => {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes.length > 0) {
                        let buildings = arrFrom$1(document.querySelectorAll('.buildings') || []);
                        if (buildings.length > 0) {
                            hideBuildings(buildings);
                            observer.disconnect();
                        }
                    }
                });
            });
            observer.observe(document.body, { childList: true, subtree: true });
        };
        if (pageIsConstructions()) {
            let buildings = arrFrom$1(document.querySelectorAll('.buildings') || []);
            if (state.mho_parameters.hide_completed_buildings_field) {
                if (buildings.length > 0) {
                    hideBuildings(buildings);
                }
                else {
                    observeBuildings();
                }
            }
            else {
                showBuildings(buildings);
            }
        }
    }
    /** Si l'option associée est activée, affiche un champ de recherche sur la page de chantiers */
    function displaySearchFieldOnBuildings() {
        let fields_container = document.getElementById(mho_search_building_field_id);
        let searchFieldAdded = false; // Indicateur pour suivre l'ajout du champ de recherche
        let addSearchField = (tabs) => {
            if (searchFieldAdded)
                return; // Vérifie si le champ de recherche a déjà été ajouté
            let tabs_block = tabs.parentElement;
            fields_container = document.getElementById(mho_search_building_field_id);
            if (fields_container)
                return; // Vérifie si le conteneur existe déjà
            fields_container = document.createElement('div');
            fields_container.style.display = 'flex';
            fields_container.style.flexWrap = 'wrap';
            fields_container.style.alignItems = 'center';
            fields_container.style.gap = '0.5em';
            fields_container.style.marginTop = '0.5em';
            fields_container.id = mho_search_building_field_id;
            tabs_block.insertBefore(fields_container, tabs);
            let search_field_div = document.createElement('div');
            search_field_div.style.display = 'flex';
            search_field_div.style.alignItems = 'center';
            fields_container.appendChild(search_field_div);
            if (!state.mho_parameters.display_search_field_buildings) {
                search_field_div.classList.add('hidden');
            }
            let header_mho_img = document.createElement('img');
            header_mho_img.src = mh_optimizer_icon;
            header_mho_img.style.height = '24px';
            header_mho_img.style.position = 'absolute';
            search_field_div.appendChild(header_mho_img);
            let search_field = document.createElement('input');
            search_field.type = 'text';
            search_field.placeholder = getI18N(params_categories.find((category) => category.id === 'display').params.find((param) => param.id === 'sort_and_filter').children.find((param) => param.id === 'display_search_fields').children.find((child) => child.id === 'display_search_field_buildings').label);
            search_field.classList.add('mho-input', 'inline');
            search_field.setAttribute('style', 'min-width: 200px; padding-left: 24px;');
            search_field_div.appendChild(search_field);
            let buildings = arrFrom$1(document.querySelectorAll('.buildings') || []);
            let filterBuildings = () => {
                let building_rows = [];
                buildings.forEach((building) => {
                    building_rows.push(...arrFrom$1(building.querySelectorAll('.building')));
                });
                building_rows.forEach((building_row) => {
                    let force_hide = state.mho_parameters.hide_completed_buildings_field && building_row.classList.contains('complete');
                    if (force_hide) {
                        building_row.classList.add('hidden');
                    }
                    else if (normalizeString(building_row.querySelector('.building_name').innerText).indexOf(normalizeString(search_field.value)) > -1) {
                        building_row.classList.remove('hidden');
                    }
                    else {
                        building_row.classList.add('hidden');
                    }
                });
                buildings.forEach((building) => {
                    if (arrFrom$1(building.children).filter((child) => child.classList.contains('building')).every((child) => child.classList.contains('hidden'))) {
                        building.classList.add('hidden');
                    }
                    else {
                        building.classList.remove('hidden');
                    }
                });
            };
            search_field.addEventListener('keyup', (event) => {
                filterBuildings();
            });
            searchFieldAdded = true; // Mettre à jour l'indicateur après l'ajout
        };
        let observeTabs = () => {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes.length > 0) {
                        let tabs = document.querySelector('ul.buildings-tabs');
                        if (tabs) {
                            addSearchField(tabs);
                            observer.disconnect();
                        }
                    }
                });
            });
            observer.observe(document.body, { childList: true, subtree: true });
        };
        if (state.mho_parameters.display_search_field_buildings && pageIsConstructions()) {
            if (fields_container)
                return;
            let tabs = document.querySelector('ul.buildings-tabs');
            if (tabs) {
                addSearchField(tabs);
            }
            else {
                observeTabs();
            }
        }
        else if (fields_container) {
            fields_container.remove();
        }
    }
    /** Si l'option associée est activée, affiche un champ de recherche sur la liste des destinataires d'un message */
    function displaySearchFieldOnRecipientList() {
        let search_field = document.getElementById(mho_search_recipient_field_id);
        if (state.mho_parameters.display_search_field_recipients && pageIsMsgReceived()) {
            if (search_field)
                return;
            let recipients = document.querySelector('#recipient_list');
            if (recipients) {
                let search_field_container = document.createElement('div');
                search_field = document.createElement('input');
                search_field.type = 'text';
                search_field.id = mho_search_recipient_field_id;
                search_field.placeholder = getI18N(params_categories.find((category) => category.id === 'display').params.find((param) => param.id === 'sort_and_filter').children.find((param) => param.id === 'display_search_fields').children.find((child) => child.id === 'display_search_field_recipients').label);
                search_field.classList.add('mho-input', 'inline');
                search_field.setAttribute('style', 'padding-left: 24px; margin-bottom: 0.25em;');
                search_field.addEventListener('keyup', (event) => {
                    let recipients_list = arrFrom$1(document.querySelectorAll('.recipient.link') || []);
                    recipients_list.forEach((recipient) => {
                        if (normalizeString(recipient.innerText).indexOf(normalizeString(search_field.value)) > -1) {
                            recipient.classList.remove('hidden');
                        }
                        else {
                            recipient.classList.add('hidden');
                        }
                    });
                });
                search_field_container.appendChild(search_field);
                let header_mho_img = document.createElement('img');
                header_mho_img.src = mh_optimizer_icon;
                header_mho_img.style.height = '24px';
                header_mho_img.style.position = 'absolute';
                header_mho_img.style.left = '4px';
                search_field_container.appendChild(header_mho_img);
                recipients.insertBefore(search_field_container, recipients.firstElementChild);
            }
        }
        else if (search_field) {
            search_field.parentElement.remove();
        }
    }
    /** Si l'option associée est activée, affiche un champ de recherche sur la page de la décharge */
    function displaySearchFieldOnDump() {
        let search_field = document.getElementById(mho_search_dump_field_id);
        if (state.mho_parameters.display_search_field_dump && pageIsDump()) {
            if (search_field)
                return;
            let main_content = document.querySelector('.town-main-content');
            if (main_content) {
                let table = main_content.querySelector('.row-table');
                if (table) {
                    let filterFunction = (name_search_field, can_be_dump_field, can_be_recovered_field) => {
                        let items_list = arrFrom$1(table.querySelectorAll('div.row-flex') || []);
                        items_list.forEach((item) => {
                            let item_label = item.querySelector('div.item-line img');
                            let item_counts = item.children.item(1).querySelectorAll('div');
                            let item_bank_count = +item_counts[0].innerText.replace(/\D*/, '');
                            let item_dump_count = +item_counts[1].innerText.replace(/\D*/, '');
                            let is_search_in_string = normalizeString(item_label.getAttribute('alt')).indexOf(normalizeString(name_search_field.value)) > -1;
                            let can_be_recovered = can_be_recovered_field.checked && item_dump_count > 0;
                            let can_be_dump = can_be_dump_field.checked && item_bank_count > 0;
                            if (is_search_in_string && (can_be_dump || can_be_recovered)) {
                                item.classList.remove('hidden');
                            }
                            else {
                                item.classList.add('hidden');
                            }
                        });
                    };
                    let search_field_container = document.createElement('div');
                    search_field_container.setAttribute('style', ' display: flex; flex-wrap: wrap; gap: 0.5em;');
                    search_field_container.id = mho_search_dump_field_id;
                    search_field = document.createElement('input');
                    search_field.type = 'text';
                    search_field.placeholder = getI18N(params_categories.find((category) => category.id === 'display').params.find((param) => param.id === 'sort_and_filter').children.find((param) => param.id === 'display_search_fields').children.find((child) => child.id === 'display_search_field_dump').label);
                    search_field.classList.add('mho-input', 'inline');
                    search_field.setAttribute('style', 'padding-left: 24px; margin-bottom: 0.25em;');
                    search_field_container.appendChild(search_field);
                    let can_be_dumped = document.createElement('div');
                    search_field_container.appendChild(can_be_dumped);
                    let can_be_dumped_input = document.createElement('input');
                    can_be_dumped_input.type = 'checkbox';
                    can_be_dumped_input.id = 'can_be_dumped';
                    can_be_dumped_input.checked = true;
                    can_be_dumped_input.classList.add('mho-input');
                    can_be_dumped.appendChild(can_be_dumped_input);
                    let can_be_dumped_label = document.createElement('label');
                    can_be_dumped_label.innerText = getI18N(texts.can_be_dumped);
                    can_be_dumped_label.htmlFor = 'can_be_dumped';
                    can_be_dumped.appendChild(can_be_dumped_label);
                    let can_be_recovered = document.createElement('div');
                    search_field_container.appendChild(can_be_recovered);
                    let can_be_recovered_input = document.createElement('input');
                    can_be_recovered_input.type = 'checkbox';
                    can_be_recovered_input.id = 'can_be_recovered';
                    can_be_recovered_input.checked = true;
                    can_be_recovered_input.classList.add('mho-input');
                    can_be_recovered.appendChild(can_be_recovered_input);
                    let can_be_recovered_label = document.createElement('label');
                    can_be_recovered_label.innerText = getI18N(texts.can_be_recovered);
                    can_be_recovered_label.htmlFor = 'can_be_recovered';
                    can_be_recovered.appendChild(can_be_recovered_label);
                    search_field.addEventListener('keyup', (event) => {
                        filterFunction(search_field, can_be_dumped_input, can_be_recovered_input);
                    });
                    can_be_dumped_input.addEventListener('change', (event) => {
                        filterFunction(search_field, can_be_dumped_input, can_be_recovered_input);
                    });
                    can_be_recovered.addEventListener('change', (event) => {
                        filterFunction(search_field, can_be_dumped_input, can_be_recovered_input);
                    });
                    let header_mho_img = document.createElement('img');
                    header_mho_img.src = mh_optimizer_icon;
                    header_mho_img.style.height = '24px';
                    header_mho_img.style.position = 'absolute';
                    header_mho_img.style.left = '16px';
                    search_field_container.appendChild(header_mho_img);
                    main_content.insertBefore(search_field_container, table);
                }
            }
        }
        else if (search_field) {
            search_field.parentElement.remove();
        }
    }
    /** Si l'option associée est activée, affiche un champ de recherche sur le registre */
    function displaySearchFieldOnRegistry() {
        let search_field = document.getElementById(mho_search_registry_field_id);
        if (state.mho_parameters.display_search_field_registry) {
            if (search_field)
                return;
            let logs = document.querySelector('hordes-log');
            if (logs) {
                let search_field_container = document.createElement('div');
                let logs_title = logs.parentElement.previousElementSibling;
                search_field = document.createElement('input');
                search_field.type = 'text';
                search_field.id = mho_search_registry_field_id;
                search_field.classList.add('mho-input');
                search_field.placeholder = getI18N(params_categories.find((category) => category.id === 'display').params.find((param) => param.id === 'sort_and_filter').children.find((param) => param.id === 'display_search_fields').children.find((child) => child.id === 'display_search_field_registry').label);
                search_field.setAttribute('style', 'padding-left: 24px; margin-bottom: 0.25em;');
                search_field_container.appendChild(search_field);
                let header_mho_img = document.createElement('img');
                header_mho_img.src = mh_optimizer_icon;
                header_mho_img.style.height = '24px';
                header_mho_img.style.position = 'absolute';
                search_field_container.appendChild(header_mho_img);
                if (logs_title) {
                    if (logs_title.tagName.toLowerCase() === 'H5'.toLowerCase()) {
                        search_field_container.style.marginRight = '0.5em';
                        search_field_container.style.float = 'right';
                        search_field_container.style.position = 'relative';
                        search_field_container.style.bottom = '7px';
                        search_field.classList.add('inline');
                        let first_link = logs_title.querySelector('a');
                        if (first_link) {
                            first_link.style.marginLeft = 'auto';
                        }
                        header_mho_img.style.left = (0);
                    }
                    else {
                        search_field_container.style.display = 'flex';
                        search_field_container.style.justifyContent = 'center';
                        header_mho_img.style.left = '4px';
                    }
                    logs_title.appendChild(search_field_container);
                    search_field.addEventListener('keyup', (event) => {
                        let logs_list = arrFrom$1(document.querySelectorAll('.log-entry .log-part-content') || []);
                        logs_list.forEach((log) => {
                            if (normalizeString(log.innerText).indexOf(normalizeString(search_field.value)) > -1) {
                                log.parentElement.classList.remove('hidden');
                            }
                            else {
                                log.parentElement.classList.add('hidden');
                            }
                        });
                    });
                }
            }
        }
        else if (search_field) {
            search_field.parentElement.remove();
        }
    }
    /** Si l'option associée est activée, affiche le nombre de pa nécessaires pour réparer un bâtiment suffisemment pour qu'il ne soit pas détruit lors de l'attaque */
    function displayMinApOnBuildings(count = 0) {
        state.tooltips_observer?.disconnect();
        if (state.mho_parameters.display_missing_ap_for_buildings_to_be_safe && pageIsConstructions()) {
            let complete_buildings = document.querySelectorAll('.building.complete');
            if ((!complete_buildings || complete_buildings.length === 0) && count < 10) {
                setTimeout(() => {
                    displayMinApOnBuildings(count + 1);
                }, 100);
                return;
            }
            ///////////////////////// Observe les modifications sur les tooltips pour mieux alimenter les barres /////////////////////////
            // Selectionne le noeud dont les mutations seront observées
            let tooltip_container = document.querySelector('#tooltip_container');
            // Options de l'observateur (quelles sont les mutations à observer)
            let config = { childList: true, subtree: true };
            // Fonction callback à éxécuter quand une mutation est observée
            let callback = function (mutationsList) {
                if (state.mho_parameters.display_missing_ap_for_buildings_to_be_safe && pageIsConstructions()) {
                    let broken_buildings = arrFrom$1(complete_buildings).filter((complete_building) => complete_building.querySelector('.to_repair'));
                    if (!broken_buildings || broken_buildings.length === 0)
                        return;
                    broken_buildings.forEach((broken_building) => {
                        let bar_element = broken_building.querySelector('.ap-bar');
                        let to_repair_element = broken_building.querySelector('.to_repair');
                        let nb_ap_element = broken_building.querySelector('.build-req');
                        to_repair_element.dispatchEvent(new Event('mouseenter'));
                        let tooltip = document.querySelector('.tooltip:not(.mho)[style*="display: block"]');
                        to_repair_element.dispatchEvent(new Event('mouseleave'));
                        if (!tooltip || !tooltip.innerHTML)
                            return;
                        let tooltip_status_match = tooltip.innerText.match(/[0-9]+\/[0-9]+/);
                        if (!tooltip_status_match || tooltip_status_match.length <= 0)
                            return;
                        let building_status = tooltip_status_match[0]?.split('/');
                        let tooltip_match = tooltip.innerHTML.match(/[0-9]+/g);
                        if (!tooltip_match || tooltip_match.length <= 0)
                            return;
                        let nb_pts_per_ap = parseInt(tooltip_match[tooltip_match.length - 1].match(/[0-9]+/)[0], 10);
                        let current_pv = parseInt(building_status[0], 10);
                        let total_pv = parseInt(building_status[1], 10);
                        let minimum_safe = Math.ceil(total_pv * 70 / 100) + 1;
                        if (minimum_safe <= current_pv)
                            return;
                        let missing_pts = minimum_safe - current_pv;
                        bar_element.style.display = 'flex';
                        let new_ap_bar = bar_element.querySelector('.mho-safe-ap');
                        if (!new_ap_bar) {
                            new_ap_bar = document.createElement('div');
                            new_ap_bar.classList.add('mho-safe-ap');
                        }
                        new_ap_bar.style.background = 'yellow';
                        new_ap_bar.style.width = missing_pts / total_pv * 100 + '%';
                        bar_element.appendChild(new_ap_bar);
                        let missing_ap_info = nb_ap_element.querySelector('.mho-missing-ap');
                        if (!missing_ap_info) {
                            missing_ap_info = document.createElement('span');
                            missing_ap_info.classList.add('mho-missing-ap');
                        }
                        missing_ap_info.style.fontWeight = 'initial';
                        missing_ap_info.style.fontSize = '0.8em';
                        missing_ap_info.style.overflow = 'hidden';
                        missing_ap_info.style.textOverflow = 'ellipsis';
                        missing_ap_info.innerText = getI18N(texts.missing_ap_explanation).replace('%VAR%', Math.ceil(missing_pts / nb_pts_per_ap));
                        nb_ap_element.appendChild(missing_ap_info);
                    });
                }
                else {
                    state.tooltips_observer?.disconnect();
                }
            };
            // Créé une instance de l'observateur lié à la fonction de callback
            state.tooltips_observer = new MutationObserver(callback);
            // Commence à observer le noeud cible pour les mutations précédemment configurées
            state.tooltips_observer.observe(tooltip_container, config);
            ////////////////////////////////////////////////////////
        }
        else if (pageIsConstructions()) {
            let missing_ap_infos = document.querySelectorAll('.mho-missing-ap');
            if (!missing_ap_infos)
                return;
            arrFrom$1(missing_ap_infos).forEach((missing_ap_info) => missing_ap_info.remove());
            let mho_safe_aps = document.querySelectorAll('.mho-safe-ap');
            if (!mho_safe_aps)
                return;
            arrFrom$1(mho_safe_aps).forEach((mho_safe_ap) => mho_safe_ap.remove());
        }
    }
    /** Si l'option associée est activée, affiche des filtres sur la liste des citoyens */
    function displayFiltersOnCitizenList() {
        let filter_container = document.getElementById(mho_filter_citizen_list_id);
        if (state.mho_parameters.display_filters_citizen_list && pageIsCitizens()) {
            if (filter_container)
                return;
            let main_content = document.querySelector('.town-main-content');
            if (!main_content)
                return;
            let table = main_content.querySelector('.row-table');
            if (!table)
                return;
            let rows = Array.from(table.querySelectorAll('div.row-flex:not(.header)'));
            let professions = new Map();
            let houseLevels = new Map();
            rows.forEach((row) => {
                let profImg = row.querySelector('.userCell img[alt]:not([alt=""])');
                if (profImg)
                    professions.set(profImg.getAttribute('alt'), profImg.src);
                let defenseLabel = row.querySelector('.citizen-defense');
                let houseImg = defenseLabel?.closest('.citizen-box')?.querySelector('img[alt]');
                if (houseImg)
                    houseLevels.set(houseImg.getAttribute('alt'), houseImg.src);
            });
            filter_container = document.createElement('div');
            filter_container.id = mho_filter_citizen_list_id;
            filter_container.classList.add('mho-filter-bar');
            let dropdownDestroyers = [];
            let applyFilters = () => {
            };
            let triggerFilters = () => applyFilters();
            // Recherche par nom
            let nameWrapper = document.createElement('div');
            nameWrapper.classList.add('mho-search-wrapper');
            let nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.placeholder = getI18N(texts.filter_search_name);
            nameInput.classList.add('mho-input', 'inline', 'mho-search-input');
            nameWrapper.appendChild(nameInput);
            let iconImg = document.createElement('img');
            iconImg.src = mh_optimizer_icon;
            iconImg.classList.add('mho-search-icon');
            nameWrapper.appendChild(iconImg);
            filter_container.appendChild(nameWrapper);
            nameInput.addEventListener('keyup', triggerFilters);
            // Select : statut de connexion
            let { container: onlineCtnr, select: onlineSelect } = createSingleFilterSelect(getI18N(texts.filter_online_label), `${mho_filter_citizen_list_id}-online`, [
                { value: 'all', text: getI18N(texts.filter_all) },
                { value: 'online', text: getI18N(texts.filter_online_online) },
                { value: 'offline', text: getI18N(texts.filter_online_offline) }
            ]);
            filter_container.appendChild(onlineCtnr);
            onlineSelect.addEventListener('change', triggerFilters);
            // Volet : profession
            let { container: profCtnr, getSelectedValues: getSelectedProfessions, destroy: destroyProfDropdown } = createCheckboxDropdown(getI18N(texts.job), `${mho_filter_citizen_list_id}-profession`, Array.from(professions.entries()).map(([alt, src]) => ({ value: alt, text: alt, icon: src })), triggerFilters);
            filter_container.appendChild(profCtnr);
            dropdownDestroyers.push(destroyProfDropdown);
            // Volet : niveau de maison
            let { container: houseCtnr, getSelectedValues: getSelectedHouseLevels, destroy: destroyHouseDropdown } = createCheckboxDropdown(getI18N(texts.filter_house_level_label), `${mho_filter_citizen_list_id}-house-level`, Array.from(houseLevels.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([level, src]) => ({
                value: level,
                text: level,
                icon: src
            })), triggerFilters);
            filter_container.appendChild(houseCtnr);
            dropdownDestroyers.push(destroyHouseDropdown);
            // Select : emplacement
            let { container: locationCtnr, select: locationSelect } = createSingleFilterSelect(getI18N(texts.filter_location_label), `${mho_filter_citizen_list_id}-location`, [
                { value: 'all', text: getI18N(texts.filter_all) },
                { value: 'outside', text: getI18N(texts.filter_location_outside) },
                { value: 'inside', text: getI18N(texts.filter_location_inside) }
            ]);
            filter_container.appendChild(locationCtnr);
            locationSelect.addEventListener('change', triggerFilters);
            applyFilters = () => {
                let nameVal = normalizeString(nameInput.value);
                let onlineVal = onlineSelect.value;
                let locationVal = locationSelect.value;
                let selectedProfs = getSelectedProfessions();
                let selectedLvls = getSelectedHouseLevels();
                rows.forEach((row) => {
                    let nameEl = row.querySelector('.userCell a.username');
                    let rowName = normalizeString(nameEl?.innerText.trim() ?? '');
                    let statusEl = row.querySelector('.citizen-online, .citizen-offline');
                    let connectionStatus = statusEl?.classList.contains('citizen-online') ? 'online'
                        : statusEl?.classList.contains('citizen-offline') ? 'offline'
                            : null;
                    let locEl = row.querySelector('.citizen-box.location');
                    let isOutside = locEl ? /\[/.test(locEl.innerText) : false;
                    let profImg = row.querySelector('.userCell img[alt]:not([alt=""])');
                    let prof = profImg?.getAttribute('alt') ?? '';
                    let defenseLabel = row.querySelector('.citizen-defense');
                    let houseImg = defenseLabel?.closest('.citizen-box')?.querySelector('img[alt]');
                    let houseLevel = houseImg?.getAttribute('alt') ?? '';
                    let pass = (nameVal === '' || rowName.includes(nameVal))
                        && (onlineVal === 'all' || onlineVal === connectionStatus)
                        && (locationVal === 'all' || (locationVal === 'outside') === isOutside)
                        && (selectedProfs.length === 0 || selectedProfs.includes(prof))
                        && (selectedLvls.length === 0 || selectedLvls.includes(houseLevel));
                    row.classList.toggle('hidden', !pass);
                });
            };
            filter_container._mhoDestroyDropdowns = dropdownDestroyers;
            main_content.insertBefore(filter_container, table);
        }
        else if (filter_container) {
            filter_container._mhoDestroyDropdowns?.forEach((destroy) => destroy());
            filter_container.remove();
        }
    }
    /** Si l'option associée est activée, affiche des filtres sur la page Omniscience */
    function displayFiltersOnOmniscience() {
        let filter_container = document.getElementById(mho_filter_omniscience_id);
        if (state.mho_parameters.display_filters_omniscience && pageIsOmniscience()) {
            if (filter_container)
                return;
            let main_content = document.querySelector('.town-main-content');
            if (!main_content)
                return;
            let table = main_content.querySelector('.row-table');
            if (!table)
                return;
            let rows = Array.from(table.querySelectorAll('div.row-flex:not(.header)'));
            let professions = new Map();
            let houseLevels = new Map();
            let starCounts = new Set();
            let chestItems = new Map();
            let hasEmptyChest = false;
            rows.forEach((row) => {
                let profImg = row.querySelector('.citizen-box-name img[alt]:not([alt=""]), .citizen-box-name-me img[alt]:not([alt=""])');
                if (profImg)
                    professions.set(profImg.getAttribute('alt'), profImg.src);
                let houseImg = row.querySelector('.cell.factor-0.content-center-vertical img[alt]');
                if (houseImg)
                    houseLevels.set(houseImg.getAttribute('alt'), houseImg.src);
                let isDead = row.querySelector('.citizen-dead') !== null;
                if (!isDead) {
                    let starsCell = row.querySelector('.cell.rw-3:not(.rw-md-2).citizen-box');
                    starCounts.add(starsCell ? starsCell.querySelectorAll('img[alt="*"]').length : 0);
                }
                let itemImgs = Array.from(row.querySelectorAll('.inventory .item-icon img[alt]:not([alt=""])'));
                if (itemImgs.length === 0) {
                    hasEmptyChest = true;
                }
                else {
                    itemImgs.forEach((img) => {
                        let alt = img.getAttribute('alt');
                        if (!chestItems.has(alt))
                            chestItems.set(alt, img.src);
                    });
                }
            });
            filter_container = document.createElement('div');
            filter_container.id = mho_filter_omniscience_id;
            filter_container.classList.add('mho-filter-bar');
            let dropdownDestroyers = [];
            let applyFilters = () => {
            };
            let triggerFilters = () => applyFilters();
            // Recherche par nom
            let nameWrapper = document.createElement('div');
            nameWrapper.classList.add('mho-search-wrapper');
            let nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.placeholder = getI18N(texts.filter_search_name);
            nameInput.classList.add('mho-input', 'inline', 'mho-search-input');
            nameWrapper.appendChild(nameInput);
            let iconImg = document.createElement('img');
            iconImg.src = mh_optimizer_icon;
            iconImg.classList.add('mho-search-icon');
            nameWrapper.appendChild(iconImg);
            filter_container.appendChild(nameWrapper);
            nameInput.addEventListener('keyup', triggerFilters);
            // Select : statut de connexion
            let { container: onlineCtnr, select: onlineSelect } = createSingleFilterSelect(getI18N(texts.filter_online_label), `${mho_filter_omniscience_id}-online`, [
                { value: 'all', text: getI18N(texts.filter_all) },
                { value: 'online', text: getI18N(texts.filter_online_online) },
                { value: 'offline', text: getI18N(texts.filter_online_offline) }
            ]);
            filter_container.appendChild(onlineCtnr);
            onlineSelect.addEventListener('change', triggerFilters);
            // Volet : niveau de maison
            let { container: houseCtnr, getSelectedValues: getSelectedHouseLevels, destroy: destroyHouseDropdown } = createCheckboxDropdown(getI18N(texts.filter_house_level_label), `${mho_filter_omniscience_id}-house-level`, Array.from(houseLevels.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([level, src]) => ({
                value: level,
                text: level,
                icon: src
            })), triggerFilters);
            filter_container.appendChild(houseCtnr);
            dropdownDestroyers.push(destroyHouseDropdown);
            // Volet : profession
            let { container: profCtnr, getSelectedValues: getSelectedProfessions, destroy: destroyProfDropdown } = createCheckboxDropdown(getI18N(texts.job), `${mho_filter_omniscience_id}-profession`, Array.from(professions.entries()).map(([alt, src]) => ({ value: alt, text: alt, icon: src })), triggerFilters);
            filter_container.appendChild(profCtnr);
            dropdownDestroyers.push(destroyProfDropdown);
            // Volet : objets en coffre
            let itemOptions = [];
            if (hasEmptyChest)
                itemOptions.push({ value: '__empty__', text: '—' });
            chestItems.forEach((src, alt) => itemOptions.push({ value: alt, text: alt, icon: src }));
            let { container: itemsCtnr, getSelectedValues: getSelectedItems, destroy: destroyItemsDropdown } = createCheckboxDropdown(getI18N(texts.filter_chest_items_label), `${mho_filter_omniscience_id}-items`, itemOptions, triggerFilters);
            filter_container.appendChild(itemsCtnr);
            dropdownDestroyers.push(destroyItemsDropdown);
            // Volet : étoiles d'activité (les morts n'ont aucune case correspondante ;
            // ils ne remontent que lorsqu'aucune case n'est cochée)
            let { container: starsCtnr, getSelectedValues: getSelectedStars, destroy: destroyStarsDropdown } = createCheckboxDropdown(getI18N(texts.filter_stars_label), `${mho_filter_omniscience_id}-stars`, Array.from(starCounts).sort((a, b) => a - b).map((count) => ({
                value: String(count),
                text: count > 0 ? '★'.repeat(count) : '—'
            })), triggerFilters);
            filter_container.appendChild(starsCtnr);
            dropdownDestroyers.push(destroyStarsDropdown);
            applyFilters = () => {
                let nameVal = normalizeString(nameInput.value);
                let onlineVal = onlineSelect.value;
                let selectedProfs = getSelectedProfessions();
                let selectedLvls = getSelectedHouseLevels();
                let selectedStars = getSelectedStars();
                let selectedItems = getSelectedItems();
                let filterEmpty = selectedItems.includes('__empty__');
                let itemFilter = selectedItems.filter((value) => value !== '__empty__');
                rows.forEach((row) => {
                    let nameEl = row.querySelector('.citizen-box-name a.username, .citizen-box-name-me a.username');
                    let rowName = normalizeString(nameEl?.innerText.trim() ?? '');
                    let statusEl = row.querySelector('.citizen-online, .citizen-offline, .citizen-dead');
                    let isDead = statusEl?.classList.contains('citizen-dead') ?? false;
                    let connectionStatus = statusEl?.classList.contains('citizen-online') ? 'online'
                        : statusEl?.classList.contains('citizen-offline') ? 'offline'
                            : null;
                    let profImg = row.querySelector('.citizen-box-name img[alt]:not([alt=""]), .citizen-box-name-me img[alt]:not([alt=""])');
                    let prof = profImg?.getAttribute('alt') ?? '';
                    let houseImg = row.querySelector('.cell.factor-0.content-center-vertical img[alt]');
                    let houseLevel = houseImg?.getAttribute('alt') ?? '';
                    let starsCell = isDead ? null : row.querySelector('.cell.rw-3:not(.rw-md-2).citizen-box');
                    let starValue = isDead ? '__dead__' : String(starsCell ? starsCell.querySelectorAll('img[alt="*"]').length : 0);
                    let rowItems = Array.from(row.querySelectorAll('.inventory .item-icon img[alt]:not([alt=""])')).map((img) => img.getAttribute('alt'));
                    let chestEmpty = rowItems.length === 0;
                    let passItems = selectedItems.length === 0
                        || (filterEmpty && chestEmpty)
                        || itemFilter.some((item) => rowItems.includes(item));
                    let pass = (nameVal === '' || rowName.includes(nameVal))
                        && (onlineVal === 'all' || onlineVal === connectionStatus)
                        && (selectedProfs.length === 0 || selectedProfs.includes(prof))
                        && (selectedLvls.length === 0 || selectedLvls.includes(houseLevel))
                        && (selectedStars.length === 0 || selectedStars.includes(starValue))
                        && passItems;
                    row.classList.toggle('hidden', !pass);
                });
            };
            filter_container._mhoDestroyDropdowns = dropdownDestroyers;
            main_content.insertBefore(filter_container, table);
        }
        else if (filter_container) {
            filter_container._mhoDestroyDropdowns?.forEach((destroy) => destroy());
            filter_container.remove();
        }
    }

    // TypeScript's arrFrom(any) can infer element type as 'unknown' rather
    // than 'any' when the source isn't a statically-typed iterable.
    const arrFrom = (x) => Array.from(x);
    ////////////////////////
    // TRI SUR LES LISTES //
    ////////////////////////
    function mhoInitSortableTable(table, columns, rowSelector) {
        if (!table || table.dataset.sortEnabled)
            return;
        table.dataset.sortEnabled = 'true';
        arrFrom(table.querySelectorAll(rowSelector))
            .forEach((row, i) => {
            row.dataset.origIdx = i;
        });
        const header = table.querySelector('.row-flex.header');
        if (!header)
            return;
        const cells = arrFrom(header.children).filter((el) => el.classList.contains('cell'));
        let activeCol = -1;
        let direction = 0;
        const doSort = (colIndex, dir) => {
            const rows = arrFrom(table.querySelectorAll(rowSelector));
            if (dir === 0) {
                rows.sort((a, b) => Number(a.dataset.origIdx) - Number(b.dataset.origIdx));
            }
            else {
                const { extract, compare } = columns[colIndex];
                rows.sort((a, b) => dir * compare(extract(a), extract(b)));
            }
            rows.forEach((row) => table.appendChild(row));
        };
        const arrows = cells.map((cell, colIdx) => {
            cell.querySelector('.help-button')
                ?.addEventListener('click', (e) => e.stopPropagation());
            const arrow = document.createElement('span');
            arrow.className = 'mho-sort-arrow';
            arrow.textContent = ' ⇅';
            cell.classList.add('mho-sortable-cell');
            cell.appendChild(arrow);
            cell.addEventListener('click', () => {
                if (activeCol !== colIdx) {
                    activeCol = colIdx;
                    direction = 1;
                }
                else {
                    if (direction === 1)
                        direction = -1;
                    else if (direction === -1) {
                        direction = 0;
                        activeCol = -1;
                    }
                    else {
                        direction = 1;
                        activeCol = colIdx;
                    }
                }
                arrows.forEach((a, j) => {
                    const on = (j === activeCol && direction !== 0);
                    a.textContent = on ? (direction === 1 ? ' ↑' : ' ↓') : ' ⇅';
                    a.style.opacity = on ? '1' : '0.4';
                });
                doSort(activeCol < 0 ? 0 : activeCol, direction);
            });
            return arrow;
        });
    }
    function mhoCleanupSortableTable(table, rowSelector) {
        if (!table?.dataset.sortEnabled)
            return;
        table.querySelectorAll('.mho-sort-arrow').forEach(a => a.remove());
        const header = table.querySelector('.row-flex.header');
        if (header) {
            arrFrom(header.children)
                .filter((el) => el.classList.contains('cell'))
                .forEach((cell) => cell.classList.remove('mho-sortable-cell'));
        }
        const rows = arrFrom(table.querySelectorAll(rowSelector));
        rows.sort((a, b) => Number(a.dataset.origIdx) - Number(b.dataset.origIdx));
        rows.forEach((row) => {
            table.appendChild(row);
            delete row.dataset.origIdx;
        });
        delete table.dataset.sortEnabled;
    }
    function sortCitizenList() {
        const COLUMNS = [
            {
                extract: row => (row.querySelector('.username')?.textContent ?? '').trim().toLowerCase(),
                compare: (a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }),
            },
            {
                extract: row => {
                    const m = (row.querySelector('.citizen-defense')?.textContent ?? '').match(/(\d+)/);
                    return m ? parseInt(m[1], 10) : 0;
                },
                compare: (a, b) => a - b,
            },
            {
                extract: row => {
                    const text = (row.querySelector('.location')?.textContent ?? '').trim();
                    const m = text.match(/\[(-?\d+),(-?\d+)\]/);
                    if (!m)
                        return { inTown: true, dist: 0 };
                    const x = parseInt(m[1], 10), y = parseInt(m[2], 10);
                    return { inTown: false, dist: Math.abs(x) + Math.abs(y) };
                },
                compare: (a, b) => {
                    if (a.inTown && b.inTown)
                        return 0;
                    if (a.inTown)
                        return -1;
                    if (b.inTown)
                        return 1;
                    return a.dist - b.dist;
                },
            },
        ];
        const table = [...document.querySelectorAll('.row-table.citizens-list')]
            .find((t) => t.querySelectorAll('.row-flex.header .cell').length === 3);
        if (state.mho_parameters.sort_citizen_list && pageIsCitizens()) {
            mhoInitSortableTable(table, COLUMNS, '.row-flex.stretch.pointer');
        }
        else if (!state.mho_parameters.sort_citizen_list && pageIsCitizens()) {
            mhoCleanupSortableTable(table, '.row-flex.stretch.pointer');
        }
    }
    function sortOmniscienceList() {
        const COLUMNS = [
            {
                extract: row => (row.querySelector('.username')?.textContent ?? '').trim().toLowerCase(),
                compare: (a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }),
            },
            {
                extract: row => row.querySelectorAll('li.item').length,
                compare: (a, b) => a - b,
            },
            {
                extract: row => {
                    const cell = [...row.querySelectorAll('.citizen-box')]
                        .find((c) => c.textContent.includes('pts'));
                    const m = cell?.textContent.replace(/\s+/g, '').match(/(\d+)pts/);
                    return m ? parseInt(m[1], 10) : 0;
                },
                compare: (a, b) => a - b,
            },
            {
                extract: row => row.querySelectorAll('img[alt="*"]').length,
                compare: (a, b) => a - b,
            },
        ];
        const table = [...document.querySelectorAll('.row-table.citizens-list')]
            .find((t) => t.querySelectorAll('.row-flex.header .cell').length === 4);
        if (state.mho_parameters.sort_omniscience_list && pageIsOmniscience()) {
            mhoInitSortableTable(table, COLUMNS, '.row-flex.stretch');
        }
        else if (!state.mho_parameters.sort_omniscience_list && pageIsOmniscience()) {
            mhoCleanupSortableTable(table, '.row-flex.stretch');
        }
    }

    function createStoreNotificationsBtn() {
        let stored_notifications_btn = document.getElementById(mho_store_notifications_id);
        if (state.mho_parameters.store_notifications) {
            createWindow(mho_store_notifications_window_id, false);
            const notifications_space = document.querySelector('#notifications');
            const mho_header_space = document.getElementById(mho_header_space_id);
            if (stored_notifications_btn || !mho_header_space || !notifications_space)
                return;
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
            let btn_container = document.createElement('div');
            btn_container.id = mho_store_notifications_id;
            let postbox_img = document.querySelector('#postbox img');
            let btn_mho_img = document.createElement('img');
            btn_mho_img.src = mh_optimizer_icon;
            btn_mho_img.style.height = postbox_img && postbox_img.height ? postbox_img.height + 'px' : '16px';
            btn_container.appendChild(btn_mho_img);
            let btn_img = document.createElement('img');
            btn_img.src = repo_img_hordes_url + '/icons/news.gif';
            btn_img.style.height = postbox_img && postbox_img.height ? postbox_img.height + 'px' : '16px';
            btn_container.appendChild(btn_img);
            btn_container.addEventListener('click', (event) => {
                event.stopPropagation();
                event.preventDefault();
                document.getElementById(mho_store_notifications_window_id).classList.add('visible');
                createNotificationsWindowContent();
            });
            mho_header_space.appendChild(btn_container);
        }
        else if (stored_notifications_btn) {
            stored_notifications_btn.remove();
        }
    }
    function createNotificationsWindowContent() {
        let window_content = document.querySelector(`#${mho_store_notifications_window_id}-content`);
        window_content.innerHTML = '';
        let window = window_content.parentElement;
        window.style.minWidth = '500px';
        window.style.maxWidth = '100dvw';
        let tabs_div = document.createElement('div');
        tabs_div.id = 'tabs';
        window_content.appendChild(tabs_div);
        let tabs_ul = document.createElement('ul');
        tabs_div.appendChild(tabs_ul);
        dispatchNotificationsContent();
    }
    function dispatchNotificationsContent() {
        let window_content = document.getElementById(mho_store_notifications_window_id + '-content');
        let tab_content = document.getElementById(mho_store_notifications_window_id + '-tab-content');
        if (tab_content) {
            tab_content.remove();
        }
        tab_content = document.createElement('div');
        tab_content.id = mho_expeditions_window_id + '-tab-content';
        tab_content.classList.add('tab-content');
        window_content.appendChild(tab_content);
        let notifications_list = document.createElement('ul');
        notifications_list.id = 'notifications-list';
        tab_content.appendChild(notifications_list);
        state.mh_notifications.forEach((notification, index) => {
            let notification_container = document.createElement('li');
            notification_container.style.display = 'flex';
            notification_container.style.gap = '0.5em';
            notification_container.style.alignItems = 'center';
            notifications_list.appendChild(notification_container);
            let notification_content = document.createElement('div');
            notification_content.style.flex = (1);
            notification_content.innerHTML = notification.innerHTML;
            notification_container.appendChild(notification_content);
            let remove_notification = document.createElement('img');
            remove_notification.src = repo_img_hordes_url + '/icons/small_trash_red.png';
            remove_notification.style.cursor = 'pointer';
            notification_container.appendChild(remove_notification);
            remove_notification.addEventListener('click', (event) => {
                state.mh_notifications.splice(index, 1);
                createNotificationsWindowContent();
            });
        });
    }

    function getTranslation(string_to_translate, source_language) {
        return new Promise((resolve, reject) => {
            if (string_to_translate && string_to_translate !== '') {
                let locale = 'locale=' + source_language;
                let sourceString = 'sourceString=' + string_to_translate;
                fetcher(state.api_url + '/Translation?' + locale + '&' + sourceString)
                    .then((response) => {
                    if (response.status === 200) {
                        return response.json();
                    }
                    else {
                        return convertResponsePromiseToError(response);
                    }
                })
                    .then((response) => {
                    resolve(response);
                })
                    .catch((error) => {
                    addError(error);
                    reject(error);
                });
            }
        });
    }
    /** Récupère la liste complète des recettes */

    function displayTranslateTool() {
        /** On doit laisser l'interval tourner quand l'option est activée, sinon l'input est supprimé lors de changements de page dans l'application */
        let display_translate_input = document.getElementById(mho_display_translate_input_id);
        if (state.mho_parameters.display_translate_tool) {
            if (display_translate_input)
                return;
            const mho_header_space = document.getElementById(mho_header_space_id);
            if (!mho_header_space)
                return;
            let mho_display_translate_input_div = createSelectWithSearch();
            mho_display_translate_input_div.id = mho_display_translate_input_id;
            mho_display_translate_input_div.setAttribute('style', 'margin: 0; width: 200px; height: 22px;');
            let label = mho_display_translate_input_div.firstElementChild;
            let input = label.firstElementChild;
            input.setAttribute('style', 'width: calc(100% - 35px); display: inline-block; padding-right: 40px; height: 22px');
            let btn_mho_img = document.createElement('img');
            btn_mho_img.src = mh_optimizer_icon;
            btn_mho_img.style.height = '22px';
            btn_mho_img.style.float = 'right';
            btn_mho_img.style.position = 'relative';
            btn_mho_img.style.top = '-22px';
            label.insertBefore(btn_mho_img, label.lastElementChild);
            let select = document.createElement('select');
            select.classList.add('small');
            select.setAttribute('style', 'height: 22px; width: 35px; font-size: 12px; outline: unset');
            select.value = lang;
            supported_languages.forEach((language) => {
                let option = document.createElement('option');
                option.value = language.value;
                option.setAttribute('style', 'font-size: 16px');
                option.innerText = language.img;
                option.selected = language.value === lang;
                select.appendChild(option);
            });
            label.insertBefore(select, input);
            let block_to_display = mho_display_translate_input_div.lastElementChild;
            block_to_display.setAttribute('style', 'float: right; z-index: 10; position: absolute; right: 0; min-width: 350px; background: #5c2b20; border: 1px solid #ddab76; box-shadow: 0 0 3px #000; outline: 1px solid #000; color: #ddab76; max-height: 50vh; overflow: auto;');
            input.addEventListener('keyup', (event) => {
                let temp_input = input.value.replace(/\W*/gm, '');
                if (temp_input.length > 2) {
                    getTranslation(input.value, select.value).then((response) => {
                        block_to_display.innerHTML = '';
                        let show_exact_match = response.translations.some((translation) => translation.key.isExactMatch);
                        if (show_exact_match) {
                            let display_all = document.createElement('div');
                            display_all.setAttribute('style', 'padding: 4px; border-bottom: 1px solid; cursor: pointer');
                            let display_all_img = document.createElement('img');
                            display_all_img.src = `${repo_img_hordes_url}/icons/small_more.gif`;
                            display_all_img.setAttribute('style', 'margin-right: 8px');
                            let display_all_text = document.createElement('text');
                            display_all_text.innerText = getI18N(texts.display_all_search_result);
                            display_all.appendChild(display_all_img);
                            display_all.appendChild(display_all_text);
                            block_to_display.appendChild(display_all);
                            display_all.addEventListener('click', () => {
                                show_exact_match = !show_exact_match;
                                if (show_exact_match) {
                                    display_all_img.src = `${repo_img_hordes_url}/icons/small_more.gif`;
                                    display_all_text.innerText = getI18N(texts.display_all_search_result);
                                }
                                else {
                                    display_all_img.src = `${repo_img_hordes_url}/icons/small_less.gif`;
                                    display_all_text.innerText = getI18N(texts.display_exact_search_result);
                                }
                                let not_exact = Array.from(block_to_display.getElementsByClassName('not-exact') || []);
                                not_exact.forEach((not_exact_item) => {
                                    not_exact_item.classList.toggle('hidden');
                                });
                            });
                        }
                        response.translations
                            .forEach((translation) => {
                            if (response.translations.length > 1) {
                                let context_div = document.createElement('div');
                                context_div.setAttribute('style', 'text-align: center; padding: 4px; font-variant: small-caps; font-size: 14px;');
                                context_div.innerHTML = getI18N(texts.translation_file_context) + ` <img src="${repo_img_hordes_url}/emotes/arrowright.gif"> ` + translation.key.context;
                                if (!translation.key.isExactMatch && show_exact_match) {
                                    context_div.classList.add('not-exact', 'hidden');
                                }
                                block_to_display.appendChild(context_div);
                            }
                            let key_index = 0;
                            for (let lang_key in translation.value) {
                                let lang = translation.value[lang_key];
                                lang.forEach((result) => {
                                    let content_div = document.createElement('div');
                                    let img = document.createElement('img');
                                    img.src = `${repo_img_hordes_url}/lang/${lang_key}.png`;
                                    img.setAttribute('style', 'margin-right: 8px');
                                    let button_div = document.createElement('div');
                                    let button = document.createElement('button');
                                    button_div.appendChild(button);
                                    button.innerHTML = '&#10697';
                                    button.setAttribute('style', 'font-size: 16px');
                                    button.addEventListener('click', () => {
                                        copyToClipboard(result);
                                    });
                                    content_div.setAttribute('style', 'display: flex; justify-content: space-between; padding: 6px;');
                                    if (key_index === Object.keys(translation.value).length - 1) {
                                        content_div.setAttribute('style', 'display: flex; justify-content: space-between; padding: 6px; border-bottom: 1px solid;');
                                    }
                                    content_div.innerHTML = `<div>${img.outerHTML}${result}</div>`;
                                    content_div.appendChild(button_div);
                                    if (!translation.key.isExactMatch && show_exact_match) {
                                        content_div.classList.add('not-exact', 'hidden');
                                    }
                                    block_to_display.appendChild(content_div);
                                });
                                key_index++;
                            }
                        });
                    });
                }
            });
            mho_header_space.insertBefore(mho_display_translate_input_div, mho_header_space.firstChild);
        }
        else if (display_translate_input) {
            display_translate_input.remove();
        }
    }

    function saveBath(bath_taken) {
        if (bath_taken === undefined)
            return;
        return new Promise((resolve, reject) => {
            fetcher(state.api_url + `/town/${state.mh_user.townDetails?.townId}/user/${state.mh_user.id}/bath?day=${state.mh_user.townDetails?.day}`, {
                method: bath_taken ? 'POST' : 'DELETE',
            })
                .then((response) => {
                if (response.status === 200) {
                    return response.json();
                }
                else {
                    return convertResponsePromiseToError(response);
                }
            })
                .then(() => {
                resolve();
            })
                .catch((error) => {
                addError(error);
                reject(error);
            });
        });
    }

    function updateExternalTools() {
        const { mh_user, mho_parameters, api_url, external_app_id } = state;
        return new Promise(async (resolve, reject) => {
            let convertListOfSingleObjectsIntoListOfCountedObjects = (objects) => {
                let object_map = [];
                objects.forEach((object) => {
                    let object_in_map = object_map.find((_object_in_map) => _object_in_map.id === object.id && _object_in_map.isBroken === object.isBroken);
                    if (object_in_map) {
                        object_in_map.count += 1;
                    }
                    else if (object) {
                        object.count = 1;
                        object_map.push(object);
                    }
                });
                return object_map;
            };
            let data = {};
            let nb_dead_zombies = +document.querySelectorAll('.actor.splatter').length;
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
            let position = getCurrentPosition();
            let citizen_list = Array.from(document.querySelectorAll('.citizen-box .username[x-user-id]') || [])?.map((citizen_box) => {
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
                let objects = Array.from(document.querySelector('.inventory.desert')?.querySelectorAll('li.item') || []).map((desert_item) => {
                    let item = getItemFromImg(desert_item.querySelector('img')?.src);
                    return { id: item?.id, isBroken: desert_item.classList.contains('broken') };
                });
                let content = {
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
                }
                else {
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
                let content = {
                    x: +position[0],
                    y: +position[1],
                    deadZombies: nb_dead_zombies,
                    citizenId: citizen_list.map((citizen) => citizen.id)
                };
                if (data.map.cell) {
                    data.map.cell.deadZombies = nb_dead_zombies;
                }
                else {
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
                    let zone_scav_level_img = fixMhCompiledImg(document.querySelector('.zone-scavenger img')?.src);
                    let index = zone_scav_level_img.indexOf(hordes_img_url);
                    zone_scav_level_img = zone_scav_level_img.slice(index).replace(hordes_img_url, '').replace('icons/', '');
                    let content = {
                        x: +position[0],
                        y: +position[1],
                        scavNextCells: {
                            north: document.querySelector('.scavenger-sense-north') ? !document.querySelector('.scavenger-sense-north.scavenger-sense-1') : undefined,
                            east: document.querySelector('.scavenger-sense-east') ? !document.querySelector('.scavenger-sense-east.scavenger-sense-1') : undefined,
                            south: document.querySelector('.scavenger-sense-south') ? !document.querySelector('.scavenger-sense-south.scavenger-sense-1') : undefined,
                            west: document.querySelector('.scavenger-sense-west') ? !document.querySelector('.scavenger-sense-west.scavenger-sense-1') : undefined
                        },
                        scavZoneLevel: zone_scav_level_img.match(/\d/)?.length > 0 ? +zone_scav_level_img.match(/\d/)[0] : 0,
                        citizenId: citizen_list.map((citizen) => citizen.id),
                    };
                    if (data.map.cell) {
                        data.map.cell.scavNextCells = content.scavNextCells;
                        data.map.cell.scavZoneLevel = content.scavZoneLevel;
                    }
                    else {
                        data.map.cell = content;
                    }
                }
                else if (mh_user.jobDetails.uid === 'vest') {
                    let zone_scout_level_src = document.querySelector('.zone-scout')?.querySelector('img').src;
                    let index = zone_scout_level_src.indexOf(hordes_img_url);
                    zone_scout_level_src = zone_scout_level_src.slice(index).replace(hordes_img_url, '');
                    let content = {
                        x: +position[0],
                        y: +position[1],
                        scoutNextCells: {
                            north: document.querySelector('.scout-sense-north') ? +document.querySelector('.scout-sense-north').querySelector('text')?.innerHTML : undefined,
                            east: document.querySelector('.scout-sense-east') ? +document.querySelector('.scout-sense-east').querySelector('text')?.innerHTML : undefined,
                            south: document.querySelector('.scout-sense-south') ? +document.querySelector('.scout-sense-south').querySelector('text')?.innerHTML : undefined,
                            west: document.querySelector('.scout-sense-west') ? +document.querySelector('.scout-sense-west').querySelector('text')?.innerHTML : undefined
                        },
                        scoutZoneLvl: +fixMhCompiledImg(zone_scout_level_src).replace(/\D/g, '') || undefined
                    };
                    if (data.map.cell) {
                        data.map.cell.scoutNextCells = content.scoutNextCells;
                        data.map.cell.scoutZoneLvl = content.scoutZoneLvl;
                    }
                    else {
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
                let rucksacks = [];
                let my_rusksack = Array.from(document.querySelector('.inventory.rucksack')?.querySelectorAll('li.item:not(.locked)') || []).map((rucksack_item) => {
                    let item = getItemFromImg(rucksack_item.querySelector('img')?.src);
                    if (item) {
                        return { id: item.id, isBroken: rucksack_item.classList.contains('broken') };
                    }
                });
                rucksacks.push({
                    userId: mh_user.id,
                    objects: convertListOfSingleObjectsIntoListOfCountedObjects(my_rusksack),
                });
                if (pageIsDesert()) {
                    let escorts = Array.from(document.querySelectorAll('.beyond-escort-on:not(.beyond-escort-on-all)') || []);
                    escorts.forEach((escort) => {
                        let escort_id = +escort.querySelector('span.username')?.getAttribute('x-user-id');
                        let escort_rucksack = Array.from(escort.querySelector('.inventory.rucksack-escort')?.querySelectorAll('li.item:not(.locked):not(.plus)') || []).map((rucksack_item) => {
                            let item = getItemFromImg(rucksack_item.querySelector('img')?.src);
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
                let chest_elements = Array.from(document.querySelector('.inventory.chest')?.querySelectorAll('li.item:not(.locked)') || []).map((chest_item) => {
                    let item = getItemFromImg(chest_item.querySelector('img')?.src);
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
                console.log("data.souls", data.souls);
                console.log("user", mh_user);
            }
            /** Récupération des pouvoirs héroïques */
            if (((mho_parameters.update_gh && mho_parameters.update_gh_ah) || (mho_parameters.update_mho && mho_parameters.update_mho_actions)) && (pageIsDesert() || pageIsHouse())) {
                let no_interaction = document.querySelector('.no-interaction');
                data.heroicActions = {};
                data.heroicActions.actions = [];
                data.heroicActions.toolsToUpdate = {
                    isBigBrothHordes: false,
                    isFataMorgana: false,
                    isGestHordes: mho_parameters && mho_parameters.update_gh_ah,
                    isMyHordesOptimizer: mho_parameters && mho_parameters.update_mho_actions
                };
                let heroics = Array.from(document.querySelector('.heroic_actions')?.querySelectorAll('.heroic_action:not(.help)') || []);
                if (heroics && heroics.length > 0) {
                    for (let heroic of heroics) {
                        let action = {
                            locale: lang,
                            label: heroic.querySelector('.label')?.innerText,
                            value: heroic.classList.contains('already') ? 0 : 1
                        };
                        data.heroicActions.actions.push(action);
                    }
                }
                else if (!no_interaction) {
                    let action = {
                        locale: lang,
                        label: 'Empty',
                        value: pageIsDesert() ? 0 /* 'desert' */ : 1 /* 'town' */
                    };
                    data.heroicActions.actions.push(action);
                }
                let apag = document.querySelector('.pointer.rucksack [src*=item_photo]');
                if (apag) {
                    let action = {
                        locale: lang,
                        label: apag.alt,
                        value: +apag.src.replace(/.*item_photo_(\d).*/, '$1') || 0
                    };
                    data.heroicActions.actions.push(action);
                }
                if (pageIsDesert()) {
                    let pef = document.querySelector('ul.special_actions [src*=armag]');
                    if (pef) {
                        let action = {
                            locale: lang,
                            label: 'PEF',
                            value: 1
                        };
                        data.heroicActions.actions.push(action);
                    }
                    else if (!no_interaction) {
                        let action = {
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
                let amelios = Array.from(document.querySelectorAll('.row-table .row:not(.header)') || []);
                if (amelios && amelios.length > 0) {
                    amelios.forEach((amelio) => {
                        let amelio_img = amelio.querySelector('img');
                        let name = amelio_img.src.replace(/.*\/home\/(.*)\..*\..*/, '$1');
                        if (name !== 'fence') {
                            let amelio_value = amelio_img?.nextElementSibling.innerText.match(/\d+/);
                            data.amelios.values[name] = amelio_value ? +amelio_value[0] : 0;
                        }
                        else {
                            data.amelios.values[name] = !amelio.querySelector('button[x-upgrade-id]') ? 1 : 0;
                        }
                    });
                }
                let house_level = +document.querySelector('[x-tab-group="home-main"][x-tab-id="values"] .town-summary')?.querySelector('.row-detail img')?.alt || undefined;
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
                let statuses = Array.from(document.querySelectorAll('.rucksack_status_union li.status img') || []);
                if (statuses && statuses.length > 0) {
                    statuses
                        .filter((status) => {
                        let status_name = status.src.replace(/.*\/status\/status_(.*)\..*\..*/, '$1');
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
                let logs = Array.from(document.querySelectorAll('div.log-entry'));
                let arrivals_texts = {
                    de: `angekommen`,
                    en: `has arrived from the`,
                    es: `ha llegado desde el`,
                    fr: `est arrivé depuis`
                };
                let arrivals = logs.filter((log) => normalizeString(log.innerText).indexOf(normalizeString(getI18N(arrivals_texts))) > -1).map((log) => {
                    return {
                        time: log.querySelector('.log-part-time')?.innerText,
                        citizen: log.querySelector('.log-part-content .container span')?.innerText
                    };
                });
                let now = document.querySelector('.game-clock .town-time')?.innerText;
                if (now) {
                    citizen_list
                        .filter((citizen) => {
                        let is_digging = false;
                        if (citizen.id === mh_user.id) { // Il s'agit de l'utilisateur qui a cliqué sur le bouton
                            is_digging = document.querySelector('#mgd-digging-note [x-countdown-to]') ? true : false;
                        }
                        else { // Les autres
                            is_digging = citizen.row.parentElement.parentElement.parentElement.querySelector('li.status img[src*=small_gather]') ? true : false;
                        }
                        return is_digging;
                    })
                        .forEach((citizen) => {
                        let failed_texts = {
                            de: `durch Graben nichts gefunden...`,
                            en: `found nothing during their last search...`,
                            es: `no encontró nada...`,
                            fr: `rien trouvé...`
                        };
                        let failed_digs = Array.from(logs.filter((log) => normalizeString(log.innerText).indexOf(normalizeString(getI18N(failed_texts))) > -1) || []).filter((log) => log.innerText.indexOf(citizen.userName) > -1) || [];
                        let nb_failed_digs = failed_digs.length;
                        let nb_minutes_for_dig = citizen.job === 'dig' ? 90 : 120; // Une fouille = 2h = 120 minutes pour un tous les métiers, ou 1h30 = 90 minutes pour une pelle
                        let citizen_arrivals = arrivals.filter((arrival) => arrival.citizen === citizen.userName); // Les heures d'arrivées du citoyen sur la case
                        let citizen_last_arrival = citizen_arrivals[0]?.time;
                        let start_date;
                        if (citizen_last_arrival) { // Si le citoyen a une heure d'arrivée alors on se base sur cette heure comme heure de début de fouilles
                            start_date = citizen_last_arrival;
                        }
                        else { // Sinon, on se base sur le cooldown
                            start_date = nb_failed_digs === 0 ? null : failed_digs[failed_digs.length - 1].querySelector('.log-part-time').innerText;
                        }
                        let nb_digs;
                        if (start_date) {
                            let now_minutes = (+now.split(':')[0] * 60) + (+now.split(':')[1]);
                            let start_date_minutes = (+start_date.split(':')[0] * 60) + (+start_date.split(':')[1]);
                            let nb_minutes_digging = now_minutes - start_date_minutes; // Le nombre total de minutes passées à fouiller
                            nb_digs = Math.floor(nb_minutes_digging / nb_minutes_for_dig) + 1;
                        }
                        else {
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
                let bath_row = document.querySelector('.heroic_action img[src*=pool]')?.parentElement;
                if (bath_row) {
                    if (bath_row.attributes.disabled) {
                        // si barré = le chantier est construit et le bain a été pris
                        bath_taken = true;
                    }
                    else {
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
                }
                else {
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

    function createParams(content) {
        let categories_container = document.createElement('div');
        categories_container.style.maxHeight = '75vh';
        categories_container.style.overflow = 'auto';
        categories_container.id = 'categories';
        content.appendChild(categories_container);
        let params_title = document.createElement('h5');
        params_title.style.display = 'flex';
        params_title.style.justifyContent = 'space-between';
        categories_container.appendChild(params_title);
        let params_title_text = document.createElement('span');
        params_title_text.innerText = getI18N(texts.parameters_section_label);
        params_title.appendChild(params_title_text);
        let params_title_select_all = document.createElement('a');
        params_title_select_all.innerText = getI18N(texts.check_all);
        params_title_select_all.style.cursor = 'pointer';
        params_title.appendChild(params_title_select_all);
        params_title_select_all.addEventListener('click', () => {
            let unchecked = Array.from(categories_container.querySelectorAll('input.mho-param[type=checkbox]:not(:checked)'));
            unchecked.forEach((checkbox) => checkbox.click());
        });
        let categories_list = document.createElement('ul');
        categories_container.appendChild(categories_list);
        params_categories.forEach((category) => {
            let category_container = document.createElement('li');
            categories_list.appendChild(category_container);
            let category_title = document.createElement('h1');
            category_title.innerText = getI18N(category.label);
            category_container.appendChild(category_title);
            let category_content = document.createElement('ul');
            category_content.classList.add('parameters');
            category_container.appendChild(category_content);
            category.params.forEach((param) => {
                createParamItem(param, category_content, 0);
            });
        });
    }
    /**
     * Crée récursivement un élément de paramètre et ses enfants
     * @param {object} param        Le paramètre à afficher
     * @param {HTMLElement} parent  Le conteneur parent (ul)
     * @param {number} depth        La profondeur actuelle (0 = premier niveau)
     */
    function createParamItem(param, parent, depth) {
        const has_children = param.children && param.children.length > 0;
        const is_touch = isTouchScreen();
        let param_container = document.createElement('li');
        param_container.id = param.id;
        parent.appendChild(param_container);
        // Ligne principale : checkbox + label + help
        let param_row = document.createElement('div');
        param_row.style.display = 'flex';
        param_row.style.alignItems = 'center';
        param_row.style.justifyContent = 'space-between';
        param_container.appendChild(param_row);
        let param_input_div = document.createElement('div');
        param_input_div.style.display = 'flex';
        param_input_div.style.alignItems = 'center';
        param_input_div.style.flex = '1';
        param_row.appendChild(param_input_div);
        let param_input = document.createElement('input');
        param_input.type = 'checkbox';
        param_input.id = param.id + '_input';
        param_input.classList.add('mho-input', 'mho-param');
        param_input.checked = state.mho_parameters?.[param.id] ?? false;
        param_input_div.appendChild(param_input);
        let param_label = document.createElement('label');
        param_label.classList.add('small');
        // Sur mobile on ne lie pas le label à l'input (le clic label = toggle expand, pas check)
        param_label.htmlFor = (!is_touch && window.innerWidth > 1000) ? param.id + '_input' : '';
        param_label.innerText = getI18N(param.label);
        param_label.style.flex = '1';
        param_input_div.appendChild(param_label);
        // Flèche indicateur enfants (mobile uniquement)
        let arrow_indicator = null;
        if (has_children && is_touch) {
            arrow_indicator = document.createElement('span');
            arrow_indicator.classList.add('mho-param-arrow');
            arrow_indicator.style.marginLeft = '0.5em';
            arrow_indicator.style.transition = 'transform 0.2s';
            arrow_indicator.style.display = param_input.checked ? 'inline' : 'none';
            arrow_indicator.innerText = '▶';
            param_input_div.appendChild(arrow_indicator);
        }
        if (param.help) {
            param_row.appendChild(createHelpButton(getI18N(param.help)));
        }
        if (!has_children) {
            param_input.addEventListener('change', (event) => {
                updateParam(param.id, event.target.checked);
                initOptionsWithLoginNeeded();
                initOptionsWithoutLoginNeeded();
            });
            return;
        }
        // Conteneur enfants
        let children_container = document.createElement('ul');
        children_container.style.listStyle = 'none';
        children_container.style.display = 'none';
        param_container.appendChild(children_container);
        param.children.forEach((child) => {
            createParamItem(child, children_container, depth + 1);
        });
        // ── MOBILE ──────────────────────────────────────────────────────────────
        if (is_touch) {
            children_container.style.paddingLeft = '1em';
            children_container.style.paddingRight = '0';
            let is_expanded = false;
            const expand = () => {
                is_expanded = true;
                children_container.style.display = 'block';
                if (arrow_indicator) {
                    arrow_indicator.style.transform = 'rotate(90deg)';
                }
            };
            const collapse = () => {
                is_expanded = false;
                children_container.style.display = 'none';
                if (arrow_indicator) {
                    arrow_indicator.style.transform = 'rotate(0deg)';
                }
            };
            // Clic sur le label : toggle expand (seulement si coché)
            param_label.style.cursor = 'pointer';
            param_label.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                if (!param_input.checked) {
                    // Cocher l'input
                    param_input.checked = true;
                    updateParam(param.id, true);
                    setParamChildrenChecked(param, true);
                    syncChildInputs(param, true);
                    if (arrow_indicator)
                        arrow_indicator.style.display = 'inline';
                    // Ne pas expand ici, juste cocher
                    initOptionsWithLoginNeeded();
                    initOptionsWithoutLoginNeeded();
                }
                else {
                    // Toggle expand/collapse
                    if (is_expanded) {
                        collapse();
                    }
                    else {
                        expand();
                    }
                }
            });
            // Changement direct de l'input (clic sur la checkbox elle-même)
            param_input.addEventListener('change', (event) => {
                const checked = event.target.checked;
                updateParam(param.id, checked);
                setParamChildrenChecked(param, checked);
                syncChildInputs(param, checked);
                if (!checked) {
                    collapse();
                    if (arrow_indicator)
                        arrow_indicator.style.display = 'none';
                }
                else {
                    if (arrow_indicator)
                        arrow_indicator.style.display = 'inline';
                }
                initOptionsWithLoginNeeded();
                initOptionsWithoutLoginNeeded();
            });
            // ── DESKTOP ─────────────────────────────────────────────────────────────
        }
        else {
            children_container.style.zIndex = String(10 + depth);
            children_container.style.width = '300px';
            children_container.style.padding = '0.25em';
            children_container.style.backgroundColor = '#5c2b20';
            children_container.style.border = '1px solid #f0d79e';
            children_container.style.outline = '1px solid #000';
            if (param_input.checked) {
                param_container.classList.add('param-has-children');
            }
            const showTooltip = () => {
                positionTooltip();
                children_container.style.display = 'block';
            };
            const hideTooltip = () => {
                children_container.style.display = 'none';
            };
            const positionTooltip = () => {
                const rect = param_container.getBoundingClientRect();
                const children_width = 300;
                const space_right = window.innerWidth - rect.right;
                children_container.style.position = 'fixed';
                if (space_right >= children_width) {
                    // Assez de place à droite → tooltip flottant
                    children_container.style.position = 'fixed';
                    children_container.style.left = rect.right + 'px';
                    children_container.style.top = rect.top - 5 + 'px';
                    children_container.style.paddingLeft = '0.25em';
                    children_container.style.width = '300px';
                }
                else {
                    // Pas assez de place → comportement mobile inline
                    children_container.style.position = 'relative';
                    children_container.style.left = '';
                    children_container.style.top = '';
                    children_container.style.paddingLeft = '1em';
                    children_container.style.width = '100%';
                }
            };
            let mousein = false;
            const onMouseEnter = () => {
                mousein = true;
                if (param_input.checked) {
                    showTooltip();
                }
            };
            const onMouseLeave = () => {
                mousein = false;
                setTimeout(() => {
                    if (!mousein)
                        hideTooltip();
                }, 250); // délai augmenté
            };
            param_container.addEventListener('mouseenter', onMouseEnter);
            param_container.addEventListener('mouseleave', onMouseLeave);
            children_container.addEventListener('mouseenter', onMouseEnter);
            children_container.addEventListener('mouseleave', onMouseLeave);
            param_input.addEventListener('change', (event) => {
                const checked = event.target.checked;
                updateParam(param.id, checked);
                setParamChildrenChecked(param, checked);
                syncChildInputs(param, checked);
                if (checked) {
                    param_container.classList.add('param-has-children');
                }
                else {
                    param_container.classList.remove('param-has-children');
                    hideTooltip();
                }
                initOptionsWithLoginNeeded();
                initOptionsWithoutLoginNeeded();
            });
        }
    }
    /** Synchronise visuellement les checkboxes enfants dans le DOM */
    function syncChildInputs(param, checked) {
        if (!param.children)
            return;
        param.children.forEach((child) => {
            const input = document.querySelector(`#${child.id}_input`);
            if (input)
                input.checked = checked;
            syncChildInputs(child, checked);
        });
    }
    /**
     * Met à jour un paramètre en storage
     * @param {string} id
     * @param {boolean} value
     */
    function updateParam(id, value) {
        if (!state.mho_parameters)
            state.mho_parameters = {};
        state.mho_parameters[id] = value;
        setStorageItem(mho_parameters_key, state.mho_parameters);
        getStorageItem(mho_parameters_key).then((saved) => {
            state.mho_parameters = saved;
        });
    }
    /**
     * Coche/décoche récursivement tous les descendants d'un paramètre
     * @param {object} param
     * @param {boolean} checked
     */
    function setParamChildrenChecked(param, checked) {
        if (!param.children)
            return;
        param.children.forEach((child) => {
            updateParam(child.id, checked);
            let child_input = document.querySelector(`#${child.id}_input`);
            if (child_input)
                child_input.checked = checked;
            setParamChildrenChecked(child, checked);
        });
    }
    function createHelpButton(text_to_display) {
        let help_button = document.createElement('a');
        help_button.innerText = getI18N(texts.external_app_id_help_label);
        help_button.classList.add('help-button');
        let help_tooltip = document.createElement('div');
        help_tooltip.classList.add('tooltip', 'help', 'hidden', 'mho');
        help_tooltip.setAttribute('style', `text-transform: initial; display: block; position: absolute; width: 250px;`);
        help_tooltip.innerHTML = text_to_display;
        help_button.appendChild(help_tooltip);
        help_button.addEventListener('mouseenter', function () {
            help_tooltip.style.top = (help_button.getBoundingClientRect().top);
            help_tooltip.style.right = (help_button.getBoundingClientRect().right);
            help_tooltip.classList.remove('hidden');
        });
        help_button.addEventListener('mouseleave', function () {
            help_tooltip.classList.add('hidden');
        });
        return help_button;
    }
    /** Enregistre les paramètres de l'extension */
    function saveParameters() {
        let parameters = document.getElementsByClassName('parameter');
    }
    /** Affiche le bouton de mise à jour des outils externes */

    function createUpdateExternalToolsButton(count = 0) {
        let tools_to_update = {
            isBigBrothHordes: /* mho_parameters && !is_mh_beta ? mho_parameters.update_bbh : */ false,
            isFataMorgana: state.mho_parameters ? state.mho_parameters.update_fata : false,
            isGestHordes: state.mho_parameters ? state.mho_parameters.update_gh : false,
            isMyHordesOptimizer: state.mho_parameters ? state.mho_parameters.update_mho : false
        };
        let nb_tools_to_update = Object.keys(tools_to_update).map((key) => tools_to_update[key]).filter((tool) => tool).length;
        let zone_marker = document.querySelector('#zone-marker');
        let compact_actions_zone = document.querySelector('.actions-box .mdg');
        let update_external_tools_btn = document.getElementById(mh_update_external_tools_id);
        const external_display_zone = zone_marker ? (window.innerWidth < 480 && compact_actions_zone ? compact_actions_zone : zone_marker) : undefined;
        const chest = document.querySelector('hordes-inventory');
        const amelios = document.querySelector('#upgrade_home_level')?.parentElement?.parentElement;
        const map_actions = document.querySelector('#door_opener')?.parentElement ?? document.querySelector('#door_exit')?.parentElement;
        if (nb_tools_to_update <= 0 || !state.external_app_id) {
            if (update_external_tools_btn) {
                update_external_tools_btn.parentElement.remove();
            }
        }
        else {
            if (external_display_zone || (chest && pageIsHouse()) || (amelios && pageIsAmelio()) || (map_actions && pageIsDoors() && state.mho_parameters.update_mho && state.mho_parameters.update_mho_souls)) {
                if (!update_external_tools_btn) {
                    if (window.innerWidth < 480 && compact_actions_zone) {
                        let el = external_display_zone ?? chest?.parentElement ?? amelios ?? map_actions;
                        let updater_bloc = createSmallUpdateExternalToolsButton(update_external_tools_btn);
                        if (amelios) {
                            el.parentElement.insertBefore(updater_bloc, el.nextElementSibling);
                        }
                        else {
                            el.appendChild(updater_bloc);
                        }
                    }
                    else {
                        let el = external_display_zone?.parentElement.parentElement.parentElement ?? chest?.parentElement ?? amelios ?? map_actions;
                        let updater_bloc = createLargeUpdateExternalToolsButton(update_external_tools_btn);
                        if (amelios) {
                            el.parentElement.insertBefore(updater_bloc, el.nextElementSibling);
                        }
                        else {
                            el.appendChild(updater_bloc);
                        }
                    }
                }
                else if (count < 3) {
                    setTimeout(() => {
                        createUpdateExternalToolsButton(count + 1);
                    }, 250);
                    return;
                }
                let warn_missing_logs = document.getElementById(mho_warn_missing_logs_id);
                if (!warn_missing_logs && document.querySelector('.log-complete-link') && external_display_zone && update_external_tools_btn && state.mho_parameters.update_mho_digs) {
                    if (window.innerWidth < 480 && compact_actions_zone) {
                        let external_tools_btn_tooltip = document.querySelector('#external-tools-btn-tooltip');
                        warn_missing_logs = document.createElement('div');
                        warn_missing_logs.id = mho_warn_missing_logs_id;
                        warn_missing_logs.classList.add('note', 'note-important');
                        warn_missing_logs.style.fontSize = '10px';
                        warn_missing_logs.innerHTML = getI18N(texts.warn_missing_logs_title) + '<br /><br />' + getI18N(texts.warn_missing_logs_help);
                        external_tools_btn_tooltip.appendChild(warn_missing_logs);
                    }
                    else {
                        warn_missing_logs = document.createElement('div');
                        warn_missing_logs.id = mho_warn_missing_logs_id;
                        warn_missing_logs.classList.add('note', 'note-important');
                        warn_missing_logs.innerText = getI18N(texts.warn_missing_logs_title);
                        let warn_help = createHelpButton(getI18N(texts.warn_missing_logs_help));
                        warn_missing_logs.appendChild(warn_help);
                        update_external_tools_btn.parentElement.appendChild(warn_missing_logs);
                    }
                }
                else if (warn_missing_logs && (!document.querySelector('.log-complete-link') || !state.mho_parameters.update_mho_digs)) {
                    warn_missing_logs.remove();
                }
            }
            else if (update_external_tools_btn && (!(external_display_zone && pageIsHouse()) || !(amelios && pageIsAmelio()))) {
                update_external_tools_btn.parentElement.remove();
            }
            else if (!update_external_tools_btn && external_display_zone && count < 10) {
                setTimeout(() => {
                    createUpdateExternalToolsButton(count + 1);
                }, 250);
            }
        }
    }
    function createLargeUpdateExternalToolsButton(update_external_tools_btn) {
        let updater_bloc = document.createElement('div');
        updater_bloc.style.marginTop = '1em';
        updater_bloc.style.padding = '0.25em';
        updater_bloc.style.border = '1px solid #ddab76';
        let updater_title = document.createElement('h5');
        updater_title.style.margin = '0 0 0.5em';
        let updater_title_mho_img = document.createElement('img');
        updater_title_mho_img.src = mh_optimizer_icon;
        updater_title_mho_img.style.height = '24px';
        updater_title_mho_img.style.marginRight = '0.5em';
        updater_title.appendChild(updater_title_mho_img);
        let updater_title_text = document.createElement('text');
        updater_title_text.innerText = getScriptInfo().name;
        updater_title.appendChild(updater_title_text);
        updater_bloc.appendChild(updater_title);
        update_external_tools_btn = document.createElement('button');
        update_external_tools_btn.innerHTML = `<img src="${repo_img_hordes_url}emotes/arrowright.gif">` + getI18N(texts.update_external_tools_needed_btn_label);
        update_external_tools_btn.id = mh_update_external_tools_id;
        update_external_tools_btn.addEventListener('click', () => {
            /** Au clic sur le bouton, on appelle la fonction de mise à jour */
            update_external_tools_btn.innerHTML = `<img src="${repo_img_hordes_url}emotes/middot.gif">` + getI18N(texts.update_external_tools_pending_btn_label);
            updateExternalTools()
                .then((response) => {
                if (response.mapResponseDto.bigBrothHordesStatus.toLowerCase() === 'ok')
                    setStorageItem(gm_bbh_updated_key, true);
                if (response.mapResponseDto.gestHordesApiStatus.toLowerCase() === 'ok' || response.mapResponseDto.gestHordesCellsStatus.toLowerCase() === 'ok')
                    setStorageItem(gm_gh_updated_key, true);
                if (response.mapResponseDto.fataMorganaStatus.toLowerCase() === 'ok')
                    setStorageItem(gm_fata_updated_key, true);
                if (response.mapResponseDto.mhoApiStatus.toLowerCase() === 'ok')
                    setStorageItem(gm_mho_updated_key, true);
                let tools_fail = [];
                let response_items = Object.keys(response).map((key) => {
                    return { key: key, value: response[key] };
                });
                response_items.forEach((response_item, index) => {
                    let final = Object.keys(response_item.value).map((key) => {
                        return { key: key, value: response_item.value[key] };
                    });
                    tools_fail = [...tools_fail, ...final.filter((final_item) => !final_item.value || (final_item.value.toLowerCase() !== 'ok' && final_item.value.toLowerCase() !== 'not activated'))];
                    if (index >= response_items.length - 1) {
                        update_external_tools_btn.innerText = '';
                        if (tools_fail.length === 0) {
                            let icon = document.createElement('img');
                            icon.src = `${repo_img_hordes_url}icons/done.png`;
                            update_external_tools_btn.appendChild(icon);
                            let text = document.createElement('text');
                            text.innerText = getI18N(texts.update_external_tools_success_btn_label);
                            update_external_tools_btn.appendChild(text);
                        }
                        else {
                            let icon = document.createElement('img');
                            icon.src = `${repo_img_hordes_url}emotes/warning.gif`;
                            update_external_tools_btn.appendChild(icon);
                            let text = document.createElement('div');
                            update_external_tools_btn.appendChild(text);
                            tools_fail.forEach((tool_fail) => {
                                let tool_text = document.createElement('div');
                                tool_text.innerText = tool_text.key.replace('Status', tool_text.value);
                                text.appendChild(tool_fail);
                            });
                        }
                    }
                });
                if (tools_fail.length > 0) {
                    console.error(`Erreur lors de la mise à jour de l'un des outils`, response);
                }
            })
                .catch((e) => {
                update_external_tools_btn.innerText = '';
                let icon = document.createElement('img');
                icon.src = `${repo_img_hordes_url}professions/death.gif`;
                update_external_tools_btn.appendChild(icon);
                let text = document.createElement('text');
                text.innerText = getI18N(texts.update_external_tools_fail_btn_label);
                update_external_tools_btn.appendChild(text);
            });
        });
        updater_bloc.appendChild(update_external_tools_btn);
        return updater_bloc;
    }
    function createSmallUpdateExternalToolsButton(update_external_tools_btn) {
        update_external_tools_btn = document.createElement('button');
        update_external_tools_btn.innerHTML = `<img src="${mh_optimizer_icon}" height="16" width="16"><img src="${repo_img_hordes_url}emotes/arrowright.gif" height="16">`;
        update_external_tools_btn.id = mh_update_external_tools_id;
        let tooltips_container = document.querySelector('#tooltip_container');
        let external_tools_btn_tooltip = tooltips_container.querySelector('#external-tools-btn-tooltip');
        if (!external_tools_btn_tooltip) {
            external_tools_btn_tooltip = document.createElement('div');
            external_tools_btn_tooltip.id = 'external-tools-btn-tooltip';
            external_tools_btn_tooltip.classList.add('tooltip', 'help', 'mho');
            tooltips_container.appendChild(external_tools_btn_tooltip);
        }
        else {
            external_tools_btn_tooltip.innerHTML = undefined;
        }
        let title = document.createElement('div');
        title.classList.add('title');
        title.innerHTML = `<h5 style="margin-top: 0; font-size: 10px;">${getScriptInfo().name}</h5>`;
        external_tools_btn_tooltip.appendChild(title);
        let status_div = document.createElement('div');
        status_div.classList.add('status');
        status_div.innerText = getI18N(texts.update_external_tools_needed_btn_label);
        external_tools_btn_tooltip.appendChild(status_div);
        update_external_tools_btn.addEventListener('pointerover', () => {
            external_tools_btn_tooltip.style.display = 'block';
            external_tools_btn_tooltip.style.top = update_external_tools_btn.getBoundingClientRect().bottom - 20 + 'px';
            external_tools_btn_tooltip.style.right = (window.innerWidth - update_external_tools_btn.getBoundingClientRect().right - 20) + 'px';
        });
        update_external_tools_btn.addEventListener('pointerout', () => {
            external_tools_btn_tooltip.style.display = 'none';
        });
        update_external_tools_btn.addEventListener('click', () => {
            /** Au clic sur le bouton, on appelle la fonction de mise à jour */
            update_external_tools_btn.innerHTML = `<img src="${mh_optimizer_icon}" height="16" width="16"><img src="${repo_img_hordes_url}emotes/middot.gif" height="16">`;
            status_div.innerText = getI18N(texts.update_external_tools_pending_btn_label);
            updateExternalTools()
                .then((response) => {
                if (response.mapResponseDto.bigBrothHordesStatus.toLowerCase() === 'ok')
                    setStorageItem(gm_bbh_updated_key, true);
                if (response.mapResponseDto.gestHordesApiStatus.toLowerCase() === 'ok' || response.mapResponseDto.gestHordesCellsStatus.toLowerCase() === 'ok')
                    setStorageItem(gm_gh_updated_key, true);
                if (response.mapResponseDto.fataMorganaStatus.toLowerCase() === 'ok')
                    setStorageItem(gm_fata_updated_key, true);
                if (response.mapResponseDto.mhoApiStatus.toLowerCase() === 'ok')
                    setStorageItem(gm_mho_updated_key, true);
                let tools_fail = [];
                let response_items = Object.keys(response).map((key) => {
                    return { key: key, value: response[key] };
                });
                response_items.forEach((response_item, index) => {
                    let final = Object.keys(response_item.value).map((key) => {
                        return { key: key, value: response_item.value[key] };
                    });
                    tools_fail = [...tools_fail, ...final.filter((final_item) => !final_item.value || (final_item.value.toLowerCase() !== 'ok' && final_item.value.toLowerCase() !== 'not activated'))];
                    if (index >= response_items.length - 1) {
                        update_external_tools_btn.innerHTML = tools_fail.length === 0
                            ? `<img src="${mh_optimizer_icon}" height="16" width="16"><img src="${repo_img_hordes_url}icons/done.png" height="16">`
                            : `<img src="${mh_optimizer_icon}" height="16" width="16"><img src="${repo_img_hordes_url}emotes/warning.gif" height="16">`;
                        status_div.innerHTML = tools_fail.length === 0 ? getI18N(texts.update_external_tools_success_btn_label)
                            : `${getI18N(texts.update_external_tools_errors_btn_label)}<br>${tools_fail.map((item) => item.key.replace('Status', ` : ${item.value}`)).join('<br>')}`;
                    }
                });
                if (tools_fail.length > 0) {
                    console.error(`Erreur lors de la mise à jour de l'un des outils`, response);
                }
            })
                .catch((error) => {
                console.error(`Erreur lors de la mise à jour de l'un des outils`, error);
                update_external_tools_btn.innerHTML = `<img src="${mh_optimizer_icon}" height="16" width="16"><img src="${repo_img_hordes_url}professions/death.gif" height="16">`;
                status_div.innerText = getI18N(texts.update_external_tools_fail_btn_label);
            });
        });
        return update_external_tools_btn;
    }

    function getEstimations() {
        return new Promise((resolve, reject) => {
            fetcher(state.api_url + `/AttaqueEstimation/Estimations/${state.mh_user.townDetails?.day}?townId=${state.mh_user.townDetails?.townId}`)
                .then((response) => {
                if (response.status === 200) {
                    return response.json();
                }
                else {
                    return convertResponsePromiseToError(response);
                }
            })
                .then((response) => {
                let estimations = {
                    estimations: response,
                    today_attack: undefined,
                    tomorrow_attack: undefined
                };
                getAttackCalculation(state.mh_user.townDetails?.day, false).then((today_result) => {
                    estimations.today_attack = today_result;
                    getAttackCalculation(state.mh_user.townDetails?.day + 1, false).then((tomorrow_result) => {
                        estimations.tomorrow_attack = tomorrow_result;
                        resolve(estimations);
                    });
                });
            })
                .catch((error) => {
                addError(error);
                reject(error);
            });
        });
    }
    function getAttackCalculation(day, beta) {
        return new Promise((resolve, reject) => {
            fetcher(state.api_url + `/attaqueEstimation/attackCalculation${beta ? '/beta' : ''}?day=${day}&townId=${state.mh_user.townDetails?.townId}`)
                .then((response) => {
                if (response.status === 200) {
                    return response.json();
                }
                else {
                    return convertResponsePromiseToError(response);
                }
            })
                .then((response) => {
                resolve(response);
            })
                .catch((error) => {
                addError(error);
                reject(error);
            });
        });
    }
    function saveEstimations(estim_value, planif_value) {
        return new Promise((resolve, reject) => {
            getEstimations().then((estimations) => {
                let new_estimations = { ...estimations.estimations };
                if (estim_value && estim_value.value && (estim_value.value.min || estim_value.value.max)) {
                    /** Workaround pour définir sur l'extension firefox sans passer par cloneinto */
                    let new_estimations_workaround_estim = { ...new_estimations.estim };
                    new_estimations_workaround_estim['_' + estim_value.percent] = { ...estim_value.value };
                    new_estimations.estim = { ...new_estimations_workaround_estim };
                }
                if (planif_value && planif_value.value && (planif_value.value.min || planif_value.value.max)) {
                    /** Workaround pour définir sur l'extension firefox sans passer par cloneinto */
                    let new_estimations_workaround_planif = { ...new_estimations.planif };
                    new_estimations_workaround_planif['_' + planif_value.percent] = { ...planif_value.value };
                    new_estimations.planif = { ...new_estimations_workaround_planif };
                }
                fetcher(state.api_url + `/AttaqueEstimation/Estimations?townId=${state.mh_user.townDetails?.townId}&userId=${state.mh_user.id}`, {
                    method: 'POST',
                    body: JSON.stringify(new_estimations),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                    .then((response) => {
                    if (response.status === 200) {
                        return response.text();
                    }
                    else {
                        return convertResponsePromiseToError(response);
                    }
                })
                    .then((response) => {
                    resolve(response);
                })
                    .catch((error) => {
                    addError(error);
                    reject(error);
                });
            });
        });
    }

    function displayEstimationsOnWatchtower() {
        if (state.mho_parameters.display_estimations_on_watchtower && pageIsWatchtower()) {
            let estim_block = document.querySelector(`#${mho_watchtower_estim_id}`);
            let small_note = document.querySelector('.small-note');
            if (estim_block || !small_note)
                return;
            const TDG_VALUES = [33, 38, 42, 46, 50, 54, 58, 63, 67, 71, 75, 79, 83, 88, 92, 96, 100];
            const PLANIF_VALUES = [0, 4, 8, 13, 17, 21, 25, 29, 33, 38, 42, 46, 50, 54, 58, 63, 67, 71, 75, 79, 83, 88, 92, 96, 100];
            const watchtower_estim_block = document.querySelector('.block.watchtower');
            const watchtower_estim_block_prediction = watchtower_estim_block.querySelector('.x-copy-prediction')?.querySelector('[x-contain-prediction]')?.innerText;
            if (watchtower_estim_block) {
                const current_estimation_percent_read = watchtower_estim_block.querySelector('.watchtower-prediction-text')?.innerText?.replace('%', '');
                const current_estimation_percent = current_estimation_percent_read !== undefined && current_estimation_percent_read !== null ? +current_estimation_percent_read : (watchtower_estim_block_prediction ? 100 : undefined);
                const watchtower_planif_block = watchtower_estim_block.nextElementSibling;
                const watchtower_planif_block_prediction = watchtower_planif_block.querySelector('.x-copy-prediction')?.querySelector('[x-contain-prediction]')?.innerText;
                const current_planif_percent_read = watchtower_planif_block.querySelector('.watchtower-prediction-text')?.innerText?.replace('%', '');
                const current_planif_percent = current_planif_percent_read !== undefined && current_planif_percent_read !== null ? +current_planif_percent_read : (watchtower_planif_block_prediction ? 100 : undefined);
                let createEstimationRow = (value, is_new_estimation, estimation, type) => {
                    return `<b style="color: #afb3cf; opacity: .8;">[${value}%]</b>
                        <div id="${type}_${value}" style="font-weight: ${is_new_estimation ? 'bold' : 'normal'}; color: ${is_new_estimation ? 'lightgreen' : 'unset'}">
                            <span class="start" style="width: 100px">${estimation?.min || ''}</span> - <span class="end" style="width: 100px">${estimation?.max || ''}</span><img src="${repo_img_hordes_url}emotes/zombie.gif">
                        </div>`;
                };
                let createCalculatedAttackRow = (calculated_attack) => {
                    let estim_values_block_title_calculated_text = ``;
                    estim_values_block_title_calculated_text += `<div class="attack" style="display: flex; justify-content: space-between; gap: 1em;"><b>${getI18N(texts.calculated_attack)}</b><div><span>${calculated_attack.result.min}</span> - <span>${calculated_attack.result.max}</span></div></div>`;
                    return estim_values_block_title_calculated_text;
                };
                let updateEstimationRow = (estimations, percent, type) => {
                    if (!estimations.estimations[type][`_${percent}`]) {
                        /** Workaround pour définir sur l'extension firefox sans passer par cloneinto */
                        let estimations_workaround_estim = { ...estimations.estimations };
                        let estimations_workaround_type = { ...estimations_workaround_estim[type] };
                        let estimations_workaround_type_percent = { min: null, max: null };
                        estimations_workaround_type[`_${percent}`] = { ...estimations_workaround_type_percent };
                        estimations_workaround_estim[type] = { ...estimations_workaround_type };
                        estimations.estimations = { ...estimations_workaround_estim };
                    }
                    let estimation = estimations.estimations[type][`_${percent}`];
                    let main = document.querySelector(`#${mho_watchtower_estim_id}`);
                    let row = main.querySelector(`#${type}_${percent}`);
                    row.style.fontWeight = 'normal';
                    row.style.color = 'unset';
                    let start = row.querySelector(`.start`);
                    start.innerText = estimation?.min || '';
                    let end = row.querySelector(`.end`);
                    end.innerText = estimation?.max || '';
                };
                let updateCalculatedAttackRow = (estimations, type) => {
                    let main = document.querySelector(`#${mho_watchtower_estim_id}`);
                    let block = main.querySelector(`#${type}`);
                    if (block) {
                        let header = block.querySelector(`h5`);
                        let calc_block = header.lastElementChild;
                        let calc_attack = calc_block.querySelector('.attack').lastElementChild;
                        if (type === 'estim') {
                            if (calc_attack) {
                                calc_attack.firstElementChild.innerText = estimations.today_attack.result.min;
                                calc_attack.lastElementChild.innerText = estimations.today_attack.result.max;
                            }
                        }
                        else {
                            if (calc_attack) {
                                calc_attack.firstElementChild.innerText = estimations.tomorrow_attack.result.min;
                                calc_attack.lastElementChild.innerText = estimations.tomorrow_attack.result.max;
                            }
                        }
                    }
                };
                getEstimations().then((estimations) => {
                    estimations = { ...estimations };
                    estim_block = document.createElement('div');
                    estim_block.style.marginTop = '1em';
                    estim_block.style.padding = '0.25em';
                    estim_block.style.border = '1px solid #ddab76';
                    estim_block.id = mho_watchtower_estim_id;
                    let estim_block_title = document.createElement('h5');
                    estim_block_title.style.margin = '0 0 0.5em';
                    estim_block_title.style.display = 'flex';
                    estim_block_title.style.gap = '0.5em';
                    estim_block_title.style.alignItems = 'center';
                    estim_block.appendChild(estim_block_title);
                    let estim_block_title_mho_img = document.createElement('img');
                    estim_block_title_mho_img.src = mh_optimizer_icon;
                    estim_block_title_mho_img.style.height = '24px';
                    estim_block_title.appendChild(estim_block_title_mho_img);
                    let estim_block_title_text = document.createElement('text');
                    estim_block_title_text.style.flex = '1';
                    estim_block_title_text.innerText = getScriptInfo().name;
                    estim_block_title.appendChild(estim_block_title_text);
                    let estim_block_title_save_button = document.createElement('button');
                    estim_block_title_save_button.style.flex = '0';
                    estim_block_title_save_button.style.margin = '0';
                    estim_block_title_save_button.innerText = `💾`;
                    estim_block_title_save_button.title = getI18N(texts.save);
                    estim_block_title.appendChild(estim_block_title_save_button);
                    estim_block_title_save_button.addEventListener('click', () => {
                        saveEstimations({
                            percent: current_estimation_percent,
                            value: {
                                min: +watchtower_estim_block_prediction?.split(' ')[0],
                                max: +watchtower_estim_block_prediction?.split(' ')[2]
                            }
                        }, {
                            percent: current_planif_percent,
                            value: {
                                min: +watchtower_planif_block_prediction?.split(' ')[0],
                                max: +watchtower_planif_block_prediction?.split(' ')[2]
                            }
                        })
                            .then(() => {
                            estim_block_title_save_button.innerHTML = `<img src="${repo_img_hordes_url}icons/done.png">`;
                            getEstimations().then((new_saved_estimations) => {
                                updateCalculatedAttackRow(new_saved_estimations, 'estim');
                                updateCalculatedAttackRow(new_saved_estimations, 'planif');
                                TDG_VALUES.forEach((percent) => {
                                    updateEstimationRow(new_saved_estimations, percent, 'estim');
                                });
                                if (watchtower_planif_block && watchtower_planif_block_prediction) {
                                    PLANIF_VALUES.forEach((percent) => {
                                        updateEstimationRow(new_saved_estimations, percent, 'planif');
                                    });
                                }
                            });
                        });
                    });
                    let estim_block_title_share_button = document.createElement('button');
                    estim_block_title_share_button.style.flex = '0';
                    estim_block_title_share_button.style.margin = '0';
                    estim_block_title_share_button.style.whiteSpace = 'nowrap';
                    estim_block_title_share_button.innerText = `⧉ ${getI18N(texts.copy_forum)}`;
                    estim_block_title_share_button.title = `${getI18N(texts.copy_forum_watchtower_tooltip)}`;
                    estim_block_title.appendChild(estim_block_title_share_button);
                    estim_block_title_share_button.addEventListener('click', () => {
                        getEstimations().then((saved_estimations) => {
                            let text = '';
                            /** Ajout du titre **/
                            text += `[big][b][bad]J${saved_estimations.estimations.day}[/bad][/b][/big]{hr}\n`;
                            /** Ajout du titre "Attaque du jour" */
                            text += `[i]${getI18N(texts.estim_title)} (J${saved_estimations.estimations.day})[/i]\n`;
                            /** Ajout des valeurs du jour */
                            TDG_VALUES.forEach((value_key) => {
                                const value = saved_estimations.estimations.estim['_' + value_key];
                                if (value && (value.min || value.max)) {
                                    text += `[b][${value_key}%][/b] ${value.min || '?'} - ${value.max || '?'} :zombie:\n`;
                                }
                                else {
                                    text += `[b][${value_key}%][/b] \n`;
                                }
                            });
                            text += '{hr}\n';
                            /** Ajout du titre "Attaque du lendemain" */
                            text += `[i]${getI18N(texts.planif_title)} (J${saved_estimations.estimations.day + 1})[/i]\n`;
                            /** Ajout des valeurs du lendemain */
                            PLANIF_VALUES.forEach((value_key) => {
                                const value = saved_estimations.estimations.planif['_' + value_key];
                                if (value && (value.min || value.max)) {
                                    text += `[b][${value_key}%][/b] ${value.min || '?'} - ${value.max || '?'} :zombie:\n`;
                                }
                            });
                            text += '{hr}';
                            copyToClipboard(text);
                            estim_block_title_share_button.innerHTML = `<img src="${repo_img_hordes_url}icons/done.png">`;
                        });
                    });
                    small_note.parentElement.insertBefore(estim_block, small_note);
                    let estim_block_content = document.createElement('div');
                    estim_block_content.style.display = 'flex';
                    estim_block_content.style.flexWrap = 'wrap';
                    estim_block_content.style.justifyContent = 'space-around';
                    estim_block.appendChild(estim_block_content);
                    let estim_values_block = document.createElement('div');
                    estim_values_block.id = 'estim';
                    estim_block_content.appendChild(estim_values_block);
                    let estim_values_block_title = document.createElement('h5');
                    estim_values_block_title.style.marginTop = '0.25em';
                    let estim_values_block_title_title = document.createElement('div');
                    estim_values_block_title_title.innerText = getI18N(texts.estim_title);
                    estim_values_block_title.appendChild(estim_values_block_title_title);
                    let estim_values_block_title_calculated = document.createElement('div');
                    let estim_values_block_title_calculated_text = createCalculatedAttackRow(estimations.today_attack);
                    estim_values_block_title_calculated.innerHTML = estim_values_block_title_calculated_text;
                    estim_values_block_title.appendChild(estim_values_block_title_calculated);
                    estim_values_block.appendChild(estim_values_block_title);
                    TDG_VALUES.forEach((value) => {
                        let saved_estimation = estimations.estimations.estim['_' + value] ? {
                            min: estimations.estimations.estim['_' + value].min,
                            max: estimations.estimations.estim['_' + value].max
                        } : undefined;
                        if (!estimations.estimations.estim['_' + value]) {
                            /** Workaround pour définir sur l'extension firefox sans passer par cloneinto */
                            let new_estimations = { ...estimations };
                            let new_estimations_estimations = { ...new_estimations.estimations };
                            let new_estimations_estimations_estim = { ...new_estimations_estimations.estim };
                            new_estimations_estimations_estim['_' + value] = { min: null, max: null };
                            new_estimations_estimations.estim = { ...new_estimations_estimations_estim };
                            new_estimations.estimations = { ...new_estimations_estimations };
                            estimations = { ...new_estimations };
                        }
                        let value_block = document.createElement('div');
                        value_block.style.display = 'flex';
                        value_block.style.justifyContent = 'space-between';
                        value_block.style.gap = '1em';
                        estim_values_block.appendChild(value_block);
                        let estimation = estimations.estimations.estim['_' + value];
                        if (current_estimation_percent === value) {
                            let current_estimation_value = {
                                min: watchtower_estim_block_prediction.split(' ')[0],
                                max: watchtower_estim_block_prediction.split(' ')[2]
                            };
                            if (current_estimation_percent !== null && current_estimation_percent !== undefined && current_estimation_value) {
                                estimation.min = current_estimation_value.min;
                                estimation.max = current_estimation_value.max;
                            }
                        }
                        const is_new_estimation = current_estimation_percent === value && (+saved_estimation?.min !== +estimation?.min || +saved_estimation?.max !== +estimation?.max);
                        value_block.innerHTML = createEstimationRow(value, is_new_estimation, estimation, 'estim');
                    });
                    if (watchtower_planif_block && watchtower_planif_block_prediction) {
                        let planif_values_block = document.createElement('div');
                        planif_values_block.id = 'planif';
                        estim_block_content.appendChild(planif_values_block);
                        let planif_values_block_title = document.createElement('h5');
                        planif_values_block_title.style.marginTop = '0.25em';
                        let planif_values_block_title_title = document.createElement('div');
                        planif_values_block_title_title.innerText = getI18N(texts.planif_title);
                        planif_values_block_title.appendChild(planif_values_block_title_title);
                        let planif_values_block_title_calculated = document.createElement('div');
                        let planif_values_block_title_calculated_text = createCalculatedAttackRow(estimations.tomorrow_attack);
                        planif_values_block_title_calculated.innerHTML = planif_values_block_title_calculated_text;
                        planif_values_block_title.appendChild(planif_values_block_title_calculated);
                        planif_values_block.appendChild(planif_values_block_title);
                        PLANIF_VALUES.forEach((value) => {
                            let saved_estimation = estimations.estimations.planif['_' + value] ? {
                                min: estimations.estimations.planif['_' + value].min,
                                max: estimations.estimations.planif['_' + value].max
                            } : undefined;
                            if (!estimations.estimations.planif['_' + value]) {
                                /** Workaround pour définir sur l'extension firefox sans passer par cloneinto */
                                let new_estimations = { ...estimations };
                                let new_estimations_estimations = { ...new_estimations.estimations };
                                let new_estimations_estimations_planif = { ...new_estimations_estimations.planif };
                                new_estimations_estimations_planif['_' + value] = { min: null, max: null };
                                new_estimations_estimations.planif = { ...new_estimations_estimations_planif };
                                new_estimations.estimations = { ...new_estimations_estimations };
                                estimations = { ...new_estimations };
                            }
                            let value_block = document.createElement('div');
                            value_block.style.display = 'flex';
                            value_block.style.justifyContent = 'space-between';
                            value_block.style.gap = '1em';
                            planif_values_block.appendChild(value_block);
                            let estimation = estimations.estimations.planif['_' + value];
                            if (current_planif_percent === value) {
                                let current_estimation_value = {
                                    min: watchtower_planif_block_prediction.split(' ')[0],
                                    max: watchtower_planif_block_prediction.split(' ')[2]
                                };
                                if (current_planif_percent !== null && current_planif_percent !== undefined && current_estimation_value) {
                                    estimation.min = current_estimation_value.min;
                                    estimation.max = current_estimation_value.max;
                                }
                            }
                            const is_new_estimation = current_planif_percent === value && (+saved_estimation?.min !== +estimation?.min || +saved_estimation?.max !== +estimation?.max);
                            value_block.innerHTML = createEstimationRow(value, is_new_estimation, estimation, 'planif');
                        });
                    }
                });
            }
        }
    }

    function notifyOnSearchEnd() {
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
                        }, 10000);
                    }
                    else {
                        let timeout_counter = countdown / 2 * 1000;
                        setTimeout(() => {
                            clearInterval(interval);
                            notifyOnSearchEnd();
                        }, timeout_counter);
                    }
                }
            }
            else {
                clearInterval(interval);
                notifyOnSearchEnd();
            }
        }, 250);
    }
    /** Affiche le nombre de zombies morts aujourd'hui */
    function displayNbDeadZombies() {
        if (state.mho_parameters.display_nb_dead_zombies && pageIsDesert()) {
            if (document.querySelector('.map-load-container')) {
                setTimeout(() => {
                    displayNbDeadZombies();
                }, 100);
            }
            else {
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
                    }
                    else {
                        let nb_dead_zombies_element = document.getElementById(nb_dead_zombies_id);
                        nb_dead_zombies_element.innerText = (nb_dead_zombies);
                        let despair_deaths_element = document.getElementById(despair_deaths_id);
                        despair_deaths_element.innerText = (despair_deaths);
                    }
                }
            }
        }
        else {
            let zone_info_zombies = document.getElementById(zone_info_zombies_id);
            if (zone_info_zombies) {
                zone_info_zombies.remove();
            }
        }
    }

    function initOptionsWithLoginNeeded() {
        displayWishlistInApp();
        displayPriorityOnItems();
        createUpdateExternalToolsButton();
        createExpeditionsBtn();
        setTimeout(() => {
            displayCellDetailsOnPage();
        }, 500);
        displayEstimationsOnWatchtower();
    }
    function initOptionsWithoutLoginNeeded() {
        createWikiToolsWindow();
        preventFromLeaving();
        alertIfInactiveAndNoEscort();
        displaySearchFields();
        displayMinApOnBuildings();
        setTimeout(() => {
            displayNbDeadZombies();
        }, 250);
        displayAdvancedTooltips();
        displayTranslateTool();
        displayCampingPredict();
        displayAntiAbuseCounter();
        automaticallyOpenBag();
        addCopyRegistryButton();
        changeDefaultEscortOptions();
        displayGhoulVoracityPercent();
        addExternalLinksToProfiles();
        // createDisplayMapButton();
        fillItemsMessages();
        displayCountCharacters();
        createStoreNotificationsBtn();
        addExternalLinksToTowns();
        addExternalLinksColumnToWelcomeTowns();
        sortCitizenList();
        sortOmniscienceList();
        // blockUsersPosts();
    }
    function updateFetchRequestOptions(options) {
        const update = { ...options };
        update.headers = {
            ...update.headers,
            'Mho-Origin': 'mho-addon',
            'Mho-Addon-Version': getScriptInfo().version,
        };
        if (isValidToken()) {
            update.headers.Authorization = `Bearer ${state.token.token.accessToken?.toString()}`;
        }
        else {
            getToken().then(() => {
                if (isValidToken()) {
                    update.headers.Authorization = `Bearer ${state.token.token.accessToken?.toString()}`;
                }
            });
        }
        return update;
    }
    function updateFetchRequestOptionsWithoutBearer(options) {
        const update = { ...options };
        update.headers = {
            ...update.headers,
            'Mho-Origin': 'mho-addon',
            'Mho-Addon-Version': getScriptInfo().version,
        };
        return update;
    }
    function fetcher(url, options) {
        return fetch(url, updateFetchRequestOptions(options));
    }
    function fetcherWithoutBearer(url, options) {
        return fetch(url, updateFetchRequestOptionsWithoutBearer(options));
    }
    /**
     * Copie un texte
     * @param {string} le texte à copier
     */

    function getApiKey() {
        return new Promise((resolve, reject) => {
            if (!state.external_app_id || state.external_app_id === '') {
                fetcherWithoutBearer(location.origin + `/jx/soul/settings`, {
                    method: 'POST',
                    body: JSON.stringify({}),
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-Request-Intent': 'WebNavigation',
                        'X-Render-Target': 'content'
                    }
                })
                    .then((response) => {
                    if (response.status === 200) {
                        return response.text();
                    }
                    else {
                        return convertResponsePromiseToError(response);
                    }
                })
                    .then((response) => {
                    let manual = () => {
                        if (document.querySelector('.soul')) {
                            let manual_app_id_key = prompt(getI18N(texts.manually_add_app_id_key));
                            if (manual_app_id_key) {
                                state.external_app_id = manual_app_id_key;
                                setStorageItem(gm_mh_external_app_id_key, state.external_app_id);
                                resolve(state.external_app_id);
                            }
                            else {
                                reject(response);
                            }
                        }
                    };
                    let temp_body = document.createElement('body');
                    if (response) {
                        temp_body.innerHTML = response;
                        let id = temp_body.querySelector('#app_ext');
                        if (id && id !== '' && id !== 'not set' && id.value && id.value !== '' && id.value !== 'not set') {
                            state.external_app_id = id.value;
                            setStorageItem(gm_mh_external_app_id_key, state.external_app_id);
                            resolve(state.external_app_id);
                        }
                        else {
                            manual();
                        }
                    }
                    else {
                        manual();
                    }
                })
                    .catch((error) => {
                    reject(error);
                    addError(error);
                });
            }
            else {
                resolve(state.external_app_id);
            }
        });
    }

    function getParameters() {
        return new Promise((resolve, reject) => {
            fetcherWithoutBearer(state.api_url + '/parameters/parameters')
                .then((response) => {
                if (response.status === 200) {
                    return response.json();
                }
                else {
                    return convertResponsePromiseToError(response);
                }
            })
                .then((response) => {
                state.parameters = response;
                isScriptVersionLastVersion();
                resolve();
            })
                .catch((error) => {
                addError(error);
                reject(error);
            });
        });
    }

    // Runs once at script load: resolves environment URLs and restores
    // persisted state (parameters, cached user/token) from storage.
    function bootstrap() {
        if (is_mh_beta) {
            state.website = `https://myhordes-optimizer-beta.web.app/`;
            state.api_url = `https://api.myhordesoptimizer.fr/beta`;
        }
        else if (is_mh_local) {
            state.website = `http://localhost:4200/`;
            state.api_url = `http://localhost:5001`;
        }
        else {
            state.website = `https://myhordes-optimizer.web.app/`;
            state.api_url = `https://api.myhordesoptimizer.fr`;
        }
        getStorageItem(mho_parameters_key).then((params) => {
            state.mho_parameters = params || {};
        });
        getStorageItem(mh_user_key).then((user) => {
            state.mh_user = user;
        });
        getStorageItem(gm_mh_external_app_id_key).then((app_id) => {
            state.external_app_id = app_id;
        });
        getStorageItem(mho_token_key).then((saved_token) => {
            state.token = saved_token;
        });
    }

    function createCopyButton(source, map, map_id, button_block_id) {
        let copy_button_parent = document.getElementById(button_block_id);
        let copy_button = document.createElement('button');
        let copyText = (text, add) => {
            return `<img src="${mh_optimizer_icon}" style="margin: auto; vertical-align: middle;" width="20" height="20"><span style="margin: auto; vertical-align: middle;">${text}<br /><small>${add}</small></span>`;
        };
        copy_button.setAttribute('style', 'max-width: initial; float: right');
        copy_button.innerHTML = copyText(getI18N(texts.copy_map), '');
        copy_button.id = mho_copy_map_id;
        copy_button.addEventListener('click', () => {
            copy_button.disabled = true;
            let map_to_convert = document.getElementById(map_id);
            if (source === 'fm') {
                map = document.querySelector('#ruinmap-wrapper') && document.querySelector('#ruinmap-wrapper')?.offsetParent === null ? 'map' : 'ruin';
                map_to_convert = map === 'ruin' ? document.getElementById('ruinmap') : document.getElementById('map');
            }
            getStorageItem(mho_map_key).then((mho_map) => {
                setStorageItem(mho_map_key, {
                    source: source,
                    map: map,
                    block: (source === 'fm' || source === 'gh') && map === 'map' ? map_to_convert.outerHTML : undefined,
                    ruin: map === 'ruin' ? map_to_convert.outerHTML : undefined
                });
            });
            copy_button.innerHTML = copyText(getI18N(texts.copy_map_end), getI18N(texts.copy_map_end_more));
            setTimeout(() => {
                copy_button.innerHTML = copyText(getI18N(texts.copy_map), '');
            }, 5000);
            copy_button.disabled = false;
        });
        copy_button_parent.appendChild(copy_button);
    }

    /** Create Optimize button */
    function createOptimizerBtn() {
        const apps_exists_callback = function (appsExistsMutationsList, observer) {
            for (const appsExistsMutation of appsExistsMutationsList) {
                let apps_block = document.querySelector('.app-directory');
                if (appsExistsMutation.type === 'childList' && apps_block) {
                    let optimizer_btn = buttonOptimizerElement();
                    if (!optimizer_btn) {
                        let content_zone = document.getElementById(mh_content_id);
                        let img = document.createElement('img');
                        let annuary = apps_block.querySelector('img');
                        img.src = mh_optimizer_icon;
                        img.setAttribute('height', annuary && annuary.height ? annuary.height + 'px' : '16px');
                        img.setAttribute('width', annuary && annuary.width ? annuary.width + 'px' : '16px');
                        img.style.margin = '1px 0 2px';
                        let title_hidden = document.createElement('span');
                        title_hidden.classList.add('label_text');
                        title_hidden.innerText = getScriptInfo().name;
                        let title = document.createElement('h1');
                        let title_first_part = document.createElement('div');
                        title_first_part.style.display = 'flex';
                        title_first_part.style.alignItems = 'center';
                        title.appendChild(title_first_part);
                        let title_second_part = document.createElement('div');
                        title_second_part.style.display = 'flex';
                        title_second_part.style.alignItems = 'center';
                        title_second_part.style.gap = '0.5em';
                        title.appendChild(title_second_part);
                        let website_link = document.createElement('a');
                        website_link.innerHTML = `<img src="${repo_img_hordes_url}icons/small_world.gif" style="vertical-align: top; margin-right: 0.25em;">${getI18N(texts.website)}`;
                        website_link.href = state.website;
                        website_link.target = '_blank';
                        website_link.style.cursor = 'pointer';
                        title_second_part.appendChild(website_link);
                        title_first_part.appendChild(img);
                        title_first_part.appendChild(title_hidden);
                        let mhe_button = document.querySelector('#mhe_button');
                        let left_position = mhe_button ? (mhe_button.offsetLeft + mhe_button.offsetWidth + 5) : apps_block?.getBoundingClientRect().width + (annuary && annuary.height ? annuary.height : 34);
                        optimizer_btn = document.createElement('div');
                        optimizer_btn.id = btn_id;
                        optimizer_btn.setAttribute('style', 'left: ' + left_position + 'px');
                        optimizer_btn.appendChild(title);
                        optimizer_btn.addEventListener('click', (event) => {
                            event.stopPropagation();
                        });
                        if (isTouchScreen()) {
                            let close_link = document.createElement('img');
                            close_link.src = `${repo_img_hordes_url}icons/b_close.png`;
                            close_link.classList.add('close');
                            title_second_part.appendChild(close_link);
                            close_link.addEventListener('click', () => {
                                optimizer_btn.classList.remove('mho-btn-opened');
                            });
                            optimizer_btn.addEventListener('mouseover', () => {
                                optimizer_btn.classList.add('mho-btn-opened');
                            });
                            optimizer_btn.addEventListener('mouseout', () => {
                                optimizer_btn.classList.remove('mho-btn-opened');
                            });
                        }
                        else {
                            optimizer_btn.addEventListener('mouseenter', () => {
                                optimizer_btn.classList.add('mho-btn-opened');
                            });
                            optimizer_btn.addEventListener('mouseleave', () => {
                                optimizer_btn.classList.remove('mho-btn-opened');
                            });
                        }
                        content_zone.appendChild(optimizer_btn);
                        let mho_content_zone = document.createElement('div');
                        mho_content_zone.id = content_btn_id;
                        content_zone.appendChild(mho_content_zone);
                        createOptimizerButtonContent();
                    }
                }
            }
        };
        const apps_exists_observer = new MutationObserver(apps_exists_callback);
        const mh_content = document.querySelector('#content'); // ou un autre élément parent approprié
        const apps_exists_config = { childList: true, subtree: false, attributes: false };
        apps_exists_observer.observe(mh_content, apps_exists_config);
    }
    /** Crée le contenu du bouton de l'optimizer (bouton de wiki, bouton de configuration, etc) */
    function createOptimizerButtonContent() {
        let optimizer_btn = buttonOptimizerElement();
        let content = document.getElementById(content_btn_id);
        content.innerHTML = '';
        optimizer_btn.appendChild(content);
        if (state.external_app_id) {
            /////////////////////
            // SECTION BOUTONS //
            /////////////////////
            let btn_content = document.createElement('div');
            btn_content.style.display = 'flex';
            btn_content.style.gap = '0.5em';
            btn_content.style.alignItems = 'center';
            content.appendChild(btn_content);
            let wiki_btn = document.createElement('a');
            wiki_btn.classList.add('button', 'mho-parameters-btn');
            wiki_btn.innerText = 'Wiki';
            wiki_btn.addEventListener('click', () => {
                displayWindow('wiki');
            });
            btn_content.appendChild(wiki_btn);
            let tools_btn = document.createElement('a');
            tools_btn.classList.add('button', 'mho-parameters-btn');
            tools_btn.innerText = getI18N(texts.tools_btn_label);
            tools_btn.addEventListener('click', () => {
                displayWindow('tools');
            });
            btn_content.appendChild(tools_btn);
            ////////////////////////
            // SECTION PARAMETRES //
            ////////////////////////
            createParams(content);
            //////////////////////////
            // SECTION INFORMATIONS //
            //////////////////////////
            let informations_title = document.createElement('h5');
            informations_title.innerText = getI18N(texts.informations_section_label);
            let informations_list = document.createElement('ul');
            let informations_container = document.createElement('div');
            informations_container.id = 'informations';
            informations_container.appendChild(informations_title);
            informations_container.appendChild(informations_list);
            informations.forEach((information) => {
                let information_link = document.createElement('a');
                information_link.id = information.id;
                information_link.innerHTML = (information.img ? `<img src="${information.img.startsWith('http') ? information.img : repo_img_hordes_url + information.img}" style="margin: 0 4px 0 3px; width: 16px">` : ``) + `<span class=small>${getI18N(information.label)}</span>`;
                information_link.href = information.src;
                information_link.target = '_blank';
                if (!information.src) {
                    information_link.addEventListener('click', (event) => {
                        event.preventDefault();
                        information.action();
                    });
                }
                let information_container = document.createElement('li');
                information_container.appendChild(information_link);
                informations_list.appendChild(information_container);
                if (information.display && !information.display()) {
                    information_container.classList.add('mho-hidden');
                }
            });
            content.appendChild(informations_container);
            toggleNewChangelog(state.has_new_changelog);
            isScriptVersionLastVersion();
        }
        else {
            let no_external_app_id = document.createElement('div');
            no_external_app_id.innerHTML = getI18N(texts.external_app_id_help);
            content.appendChild(no_external_app_id);
        }
    }

    function createMhoHeaderSpace() {
        let mh_header = document.querySelector('#header');
        if (!mh_header)
            return;
        let postbox = document.querySelector('#postbox');
        if (!postbox)
            return;
        let header_space = document.querySelector(`#${mho_header_space_id}`);
        if (!header_space) {
            header_space = document.createElement('div');
            header_space.id = mho_header_space_id;
            mh_header.appendChild(header_space);
            header_space.style.position = 'absolute';
            header_space.style.display = 'none';
            header_space.style.gap = '0.5em';
            header_space.style.alignItems = 'flex-start';
            header_space.style.zIndex = '996';
        }
        const callback = function (mutationsList, observer) {
            if (postbox.clientWidth && postbox.clientWidth > 0) {
                header_space.style.display = 'flex';
                header_space.style.right = `calc(${postbox.clientWidth}px + 10px + 0.5em)`;
                header_space.style.top = postbox.getBoundingClientRect().y + 'px';
                observer.disconnect();
            }
        };
        const observer = new MutationObserver(callback);
        const config = { attributes: true, subtree: false, childList: false };
        observer.observe(postbox, config);
    }

    const styleTemplate = "@charset \"UTF-8\";\n/*\n * Tokens remplacés au runtime par createStyles.ts à partir de config/constants.ts :\n *   __BTN_ID__, __MH_OPTIMIZER_MAP_WINDOW_ID__, __MHO_DISPLAY_EXPEDITIONS_ID__,\n *   __MHO_DISPLAY_MAP_ID__, __MHO_STORE_NOTIFICATIONS_ID__, __REPO_IMG_HORDES_URL__\n */\n.param-has-children > div::after {\n  content: \"▶︎\";\n  margin-left: auto;\n}\n\n#__BTN_ID__ {\n  background-color: #5c2b20;\n  border: 1px solid #f0d79e;\n  outline: 1px solid #000;\n  position: absolute;\n  top: 10px;\n  z-index: 997;\n}\n\n#__BTN_ID__.mho-btn-opened h1 span, #__BTN_ID__.mho-btn-opened h1 a, #__BTN_ID__.mho-btn-opened h1 img.close {\n  display: inline;\n}\n\n#__BTN_ID__.mho-btn-opened div {\n  display: block;\n}\n\n#__BTN_ID__ h1 {\n  height: auto;\n  font-size: 8pt;\n  text-transform: none;\n  font-variant: small-caps;\n  background: none;\n  cursor: help;\n  margin: 0 5px;\n  padding: 0;\n  line-height: 17px;\n  color: #f0d79e;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n\n#__BTN_ID__ h1 > div > img {\n  vertical-align: -9%;\n}\n\n#__BTN_ID__.mho-btn-opened h1 {\n  border-bottom: 1px solid #b37c4a;\n  margin-bottom: 5px;\n}\n\n#__BTN_ID__ h1 span, #__BTN_ID__ h1 a, #__BTN_ID__ h1 img.close {\n  color: #f0d79e;\n  cursor: help;\n  font-family: Trebuchet MS, Arial, Verdana, sans-serif;\n  letter-spacing: 1px;\n  line-height: 17px;\n  text-align: left;\n  text-transform: none;\n  margin-left: 1em;\n  display: none;\n}\n\n#__BTN_ID__ > div {\n  display: none;\n  margin: 0 5px 8px 5px;\n  font-size: 0.9em;\n  width: 350px;\n}\n\n#__BTN_ID__ .mho-parameters-btn {\n  margin-top: 0;\n  text-align: center;\n  display: block;\n}\n\n.mho-window {\n  opacity: 1;\n  transition: opacity 1s ease;\n  z-index: 999;\n  padding: 0;\n  position: fixed;\n  min-width: 150px;\n  min-height: 150px;\n}\n\n.mho-window:not(.fullsize) .mho-window-box {\n  resize: both;\n  overflow: auto;\n}\n\n.mho-window.fullsize {\n  background: url(__REPO_IMG_HORDES_URL__background/mask.png);\n  height: 100%;\n  width: 100%;\n  resize: none;\n}\n\n.mho-window:not(.visible), #__MH_OPTIMIZER_MAP_WINDOW_ID__:not(.visible) {\n  opacity: 0;\n  pointer-events: none;\n}\n\n.mho-window:not(.visible) .mho-window-box, .mho-window:not(.visible) #__MH_OPTIMIZER_MAP_WINDOW_ID__-box {\n  transform: scale(0) translateY(1000px);\n}\n\n.mho-window .mho-window-box {\n  background: url(__REPO_IMG_HORDES_URL__background/bg_content2.jpg) repeat-y 0 0/900px 263px, url(__REPO_IMG_HORDES_URL__background/bg_content2.jpg) repeat-y 100% 0/900px 263px;\n  border-radius: 8px;\n  box-shadow: 0 0 10px #000;\n  display: flex;\n  flex-direction: row;\n  position: absolute;\n  top: 10px;\n  bottom: 10px;\n  right: 10px;\n  left: 10px;\n  transform: scale(1) translateY(0);\n  transition: transform 0.5s ease;\n}\n\n#__MH_OPTIMIZER_MAP_WINDOW_ID__ #__MH_OPTIMIZER_MAP_WINDOW_ID__-box {\n  background: url(__REPO_IMG_HORDES_URL__background/bg_content2.jpg) repeat-y 0 0/900px 263px, url(__REPO_IMG_HORDES_URL__background/bg_content2.jpg) repeat-y 100% 0/900px 263px;\n  border-radius: 8px;\n  box-shadow: 0 0 10px #000;\n  position: absolute;\n  transform: scale(1) translateY(0);\n  transition: transform 0.5s ease;\n  resize: both;\n  overflow: auto;\n  z-index: 9999;\n}\n\n.mho-window .mho-window-box .mho-window-overlay, #__MH_OPTIMIZER_MAP_WINDOW_ID__ #__MH_OPTIMIZER_MAP_WINDOW_ID__-box #__MH_OPTIMIZER_MAP_WINDOW_ID__-overlay {\n  position: absolute;\n  right: 6px;\n  top: 6px;\n  text-align: right;\n}\n\n.mho-window .mho-window-box .mho-window-overlay ul, #__MH_OPTIMIZER_MAP_WINDOW_ID__ #__MH_OPTIMIZER_MAP_WINDOW_ID__-box #__MH_OPTIMIZER_MAP_WINDOW_ID__-overlay ul {\n  margin: 2px;\n  padding: 0;\n}\n\n.mho-window .mho-window-box .mho-window-overlay ul li, #__MH_OPTIMIZER_MAP_WINDOW_ID__ #__MH_OPTIMIZER_MAP_WINDOW_ID__-box #__MH_OPTIMIZER_MAP_WINDOW_ID__-overlay ul li {\n  cursor: pointer;\n  display: inline-block;\n}\n\n.mho-window .mho-window-drag-handle {\n  width: 18px;\n  height: 100%;\n}\n\n.mho-window-content, #__MH_OPTIMIZER_MAP_WINDOW_ID__-content {\n  flex: 1;\n  color: #fff;\n  overflow: auto;\n  background: url(__REPO_IMG_HORDES_URL__background/box/panel_00.gif) 0 0 no-repeat, url(__REPO_IMG_HORDES_URL__background/box/panel_02.gif) 100% 0 no-repeat, url(__REPO_IMG_HORDES_URL__background/box/panel_20.gif) 0 100% no-repeat, url(__REPO_IMG_HORDES_URL__background/box/panel_22.gif) 100% 100% no-repeat, url(__REPO_IMG_HORDES_URL__background/box/panel_01.gif) 0 0 repeat-x, url(__REPO_IMG_HORDES_URL__background/box/panel_10.gif) 0 0 repeat-y, url(__REPO_IMG_HORDES_URL__background/box/panel_12.gif) 100% 0 repeat-y, url(__REPO_IMG_HORDES_URL__background/box/panel_21.gif) 0 100% repeat-x, #7e4d2a;\n  border-radius: 12px;\n  padding: 8px;\n}\n\ndiv.mho-new-changelog::before {\n  position: absolute;\n  top: -3px;\n  left: -3px;\n}\n\na.mho-new-changelog::before {\n  position: relative;\n  top: 0;\n  left: 0;\n}\n\n.mho-new-changelog::before {\n  content: \"\";\n  width: 6px;\n  aspect-ratio: 1;\n  background: #4B107B;\n  border-radius: 50%;\n  box-shadow: 0px 0px 6px 3px #BF61CF;\n  display: inline-block;\n}\n\ndiv.mho-new-version::before {\n  position: absolute;\n  top: -3px;\n  left: -3px;\n}\n\n.mho-new-version::before {\n  content: \"\";\n  width: 8px;\n  aspect-ratio: 1;\n  background: #BF61CF;\n  border-radius: 50%;\n  box-shadow: 0px 0px 8px 4px #4B107B;\n  display: inline-block;\n}\n\n#tabs {\n  color: #ddab76;\n  font-size: 1.2rem;\n  margin-bottom: 20px;\n  position: relative;\n  height: 25px;\n  order-bottom: 1px solid #ddab76;\n}\n\n#tabs ul {\n  display: flex;\n  flex-wrap: wrap;\n  padding: 0;\n  background: url(__REPO_IMG_HORDES_URL__background/tabs-header-plain.gif) 0 100% round;\n  background-size: cover;\n  height: 24px;\n  margin-top: 2px;\n  margin-right: 20px;\n  padding-left: 0.5em;\n}\n\n#tabs > ul > li {\n  cursor: pointer;\n  display: inline-block;\n  margin-top: auto;\n  margin-bottom: auto;\n}\n\n#tabs > ul > li > div > img {\n  margin-right: 0.5em;\n}\n\n#tabs > ul > li > div {\n  background-image: url(__REPO_IMG_HORDES_URL__background/tab.gif);\n  background-position: 0 0;\n  background-repeat: no-repeat;\n  border-left: 1px solid #694023;\n  border-right: 1px solid #694023;\n  color: #f0d79e;\n  cursor: pointer;\n  float: right;\n  font-family: Arial, sans-serif;\n  font-size: 1rem;\n  font-variant: small-caps;\n  height: 21px;\n  margin-left: 2px;\n  margin-right: 0;\n  margin-top: 3px;\n  padding: 2px 4px 0;\n  text-decoration: underline;\n  white-space: nowrap;\n}\n\n#tabs > ul > li > div:hover {\n  outline: 1px solid #f0d79e;\n  text-decoration: underline;\n}\n\n#tabs > ul > li.selected {\n  position: relative;\n  top: 2px;\n}\n\n.tab-content {\n  position: absolute;\n  bottom: 10px;\n  left: 28px;\n  right: 8px;\n  top: 40px;\n  overflow: auto;\n}\n\n.tab-content > ul {\n  display: flex;\n  flex-wrap: wrap;\n  padding: 0;\n  margin: 0 0.5em;\n}\n\n.tab-content > ul > li {\n  min-width: 300px;\n  flex-basis: min-content;\n  padding: 0.125em 0.5em;\n  margin: 0;\n}\n\n.tab-content > ul > li.selected {\n  flex-basis: 100%;\n  padding: 0.25em;\n  margin: 0.25em 1px;\n}\n\n.tab-content > ul > li:not(.selected) .properties {\n  display: none;\n}\n\n.tab-content > ul div.mho-category {\n  width: 100%;\n  border-bottom: 1px solid;\n  margin: 1em 0 0.5em;\n}\n\n#categories > ul, ul.parameters, #informations > ul {\n  padding: 0;\n  margin: 0;\n  color: #f0d79e;\n}\n\n#categories > ul > li, ul.parameters > li, .tab-content ul > li, #informations ul > li {\n  list-style: none;\n}\n\n.tab-content #recipes-list > li, .tab-content #notifications-list > li, #wishlist > li {\n  min-width: 100% !important;\n  display: flex;\n}\n\ninput.mho-input::-webkit-outer-spin-button, input.mho-input::-webkit-inner-spin-button {\n  -webkit-appearance: none;\n  margin: 0;\n}\n\ninput.mho-input[type=number] {\n  -moz-appearance: textfield;\n}\n\n.mho-table {\n  border-collapse: collapse;\n  border-bottom: 1px solid #ddab76;\n}\n\n.mho-header {\n  font-size: 10pt;\n  background: linear-gradient(0deg, #643b25 0, rgba(100, 59, 37, 0) 50%, rgba(100, 59, 37, 0)) !important;\n  border-bottom: 2px solid #f0d79e;\n  color: #fff;\n  font-family: Trebuchet MS, Arial, Verdana, sans-serif;\n  font-weight: 700;\n}\n\n.mho-table tr:not(.mho-header) {\n  background-color: #5c2b20;\n  border-bottom: 1px solid #7e4d2a;\n}\n\n.mho-table tr th, .mho-table tr td {\n  padding: 0.25em;\n}\n\n.mho-table tr td {\n  border-left: 1px solid #7e4d2a;\n  color: #f0d79e;\n  font-size: 9pt;\n}\n\n.label_text {\n  font-size: 1.2rem;\n  font-variant: small-caps;\n}\n\n.item-title {\n  display: flex;\n  justify-content: space-between;\n}\n\n.add-to-wishlist > button > img {\n  margin-right: 0;\n}\n\n.mho-advanced-tooltip {\n  margin-top: 0.5em;\n  border-top: 1px solid;\n  max-height: 400px;\n  overflow-y: auto;\n}\n\n.mho-advanced-tooltip > table.recipes, #item-list > li.selected > .properties > table.recipes {\n  border-collapse: collapse;\n  width: 100%;\n}\n\n.mho-advanced-tooltip > table.recipes > tr, #item-list > li.selected > .properties > table.recipes > tr {\n  border: dotted;\n  border-width: 1px 0;\n}\n\n.mho-advanced-tooltip > table.recipes > tr:first-child, #item-list > li.selected > .properties > table.recipes > tr:first-child {\n  border-top: none;\n}\n\n.mho-advanced-tooltip > table.recipes > tr:last-child, #item-list > li.selected > .properties > table.recipes > tr:last-child {\n  border-bottom: none;\n}\n\n.mho-advanced-tooltip > table.recipes > tr > td.items > div, #item-list > li.selected > .properties > table.recipes > tr > td.items > div {\n  display: flex;\n  gap: 0.5em;\n}\n\n.mho-advanced-tooltip > table.recipes > tr > td:not(.results), #item-list > li.selected > .properties > table.recipes > tr > td:not(.results) {\n  width: 0;\n}\n\n.mho-advanced-tooltip > table.recipes > tr > td.results > div, #item-list > li.selected > .properties > table.recipes > tr > td.results > div {\n  flex-wrap: wrap;\n}\n\ndiv.tooltip.item:has(table.recipes) > div:first-of-type {\n  width: 0 !important;\n  min-width: 100% !important;\n}\n\n.mho-advanced-tooltip > table.recipes > tr > td.items > div > .item, #item-list > li.selected > .properties > table.recipes > tr > td.items > div > .item {\n  background-color: #524053;\n  padding: 0.5em;\n  border-radius: 0.25em;\n  white-space: nowrap;\n  display: flex;\n  align-items: center;\n  gap: 0.25em;\n}\n\n.mho-advanced-tooltip > table.recipes > tr > td.items > div > .item.mho-recipe-provoking, #item-list > li.selected > .properties > table.recipes > tr > td.items > div > .item.mho-recipe-provoking {\n  border: 1px dashed #ddab76;\n}\n\ndiv.tooltip.item:has(table.recipes) {\n  min-width: 250px !important;\n  max-width: 400px !important;\n  width: auto !important;\n}\n\n.mho-frozen {\n  pointer-events: all !important;\n}\n\n.mho-shift-hint {\n  display: inline-flex;\n  align-items: center;\n  gap: 2px;\n  margin-right: 6px;\n  opacity: 0.6;\n  font-size: 0.75em;\n  white-space: nowrap;\n  flex-shrink: 0;\n}\n\nkbd.mho-shift-hint {\n  border: 1px solid #f0d79e;\n  border-radius: 3px;\n  padding: 0 3px;\n  font-family: inherit;\n  line-height: 1.4;\n  background: rgba(240, 215, 158, 0.15);\n}\n\nimg.mho-close-hint {\n  margin-top: -6px;\n}\n\n.mho-close-hint {\n  display: none;\n}\n\n.mho-frozen .mho-shift-hint {\n  display: none;\n}\n\n.mho-frozen .mho-close-hint {\n  display: initial;\n}\n\n.mho-tooltip-translations {\n  display: flex;\n  flex-direction: row;\n  gap: 0.5em;\n  flex-wrap: wrap;\n  align-items: start;\n  justify-content: start;\n  border-bottom: 1px solid;\n  margin: 0.25em 0;\n  padding: 0.25em 0;\n}\n\n.brown-tag {\n  display: flex;\n  flex-direction: row;\n  gap: 0.5em;\n  flex-wrap: nowrap;\n  align-items: center;\n  justify-content: center;\n  background-color: #5c2b20;\n  border-radius: 0.25em;\n  padding: 0.25em 0.5em;\n}\n\nul#item-list > li {\n  background-color: #5c2b20;\n  margin: 1px 1px;\n  padding: 0.25em 0.5em;\n}\n\n#wishlist .label {\n  width: calc(100% - 775px);\n  min-width: 200px;\n  padding: 0 4px;\n}\n\n#wishlist .mho-header, #wishlist > li {\n  padding: 0 8px;\n  margin: 0.125em 0;\n  width: 100%;\n}\n\n#wishlist .mho-header > div {\n  display: inline-block;\n  vertical-align: middle;\n}\n\n#wishlist .priority, #wishlist .depot, #wishlist .bank_count, #wishlist .bag_count, #wishlist .bank_needed, #wishlist .diff {\n  width: 125px;\n  padding: 0 4px;\n}\n\n#wishlist .delete {\n  width: 25px;\n  text-align: center;\n}\n\n#wishlist-section ul {\n  padding-left: 0;\n}\n\n#wishlist-section ul > li {\n  display: flex;\n  justify-content: space-between;\n}\n\n.tab-content #recipes-list > li:nth-child(even), .tab-content #notifications-list > li:nth-child(even), #wishlist > li:nth-child(even) {\n  background-color: #5c2b20;\n}\n\nli.item[class^=priority_in], li.item[class*=\" priority_in\"], img[class^=priority_in], img[class*=\" priority_in\"] {\n  box-shadow: inset 0 0 0.5em whitesmoke, 0 0 0.5em whitesmoke;\n}\n\nli.item[class^=priority_out], li.item[class*=\" priority_out\"], img[class^=priority_out], img[class*=\" priority_out\"] {\n  box-shadow: inset 0 0 1em darkslategrey, 0 0 1em darkslategrey;\n}\n\nli.item.priority_trash, img.priority_trash {\n  box-shadow: inset 0 0 0.5em black, 0 0 0.5em black;\n}\n\ndiv.item-tag-food::after {\n  background: url(__REPO_IMG_HORDES_URL__status/status_haseaten.gif) 50%/contain no-repeat;\n}\n\ndiv.item-tag-load::after {\n  background: url(__REPO_IMG_HORDES_URL__item/item_pile.gif) 50%/contain no-repeat;\n}\n\ndiv.item-tag-hero::after {\n  background: url(__REPO_IMG_HORDES_URL__icons/star.gif) 50%/contain no-repeat;\n}\n\ndiv.item-tag-alcohol::after {\n  background: url(__REPO_IMG_HORDES_URL__status/status_drunk.gif) 50%/contain no-repeat;\n}\n\ndiv.item-tag-drug::after {\n  background: url(__REPO_IMG_HORDES_URL__status/status_drugged.gif) 50%/contain no-repeat;\n}\n\ndiv.item-tag.mho-item-tag-no-img {\n  padding-left: 2px;\n}\n\n.mho-item-tag {\n  min-height: 18px !important;\n  height: unset !important;\n}\n\n#__MHO_DISPLAY_MAP_ID__, #__MHO_STORE_NOTIFICATIONS_ID__, #__MHO_DISPLAY_EXPEDITIONS_ID__ {\n  background-color: rgba(62, 36, 23, 0.75);\n  border-radius: 6px;\n  color: #ddab76;\n  cursor: pointer;\n  font-size: 10px;\n  padding: 3px 5px;\n  transition: background-color 0.5s ease-in-out;\n  display: flex;\n  gap: 0.5em;\n}\n\n.mho-map tr td {\n  border: 1px dotted;\n  width: 30px;\n  min-width: 30px;\n  height: 30px;\n  min-height: 30px;\n  text-align: center;\n  vertical-align: middle;\n}\n\n.mho-ruin tr td {\n  border: 1px dotted;\n  width: 25px;\n  min-width: 25px;\n  height: 25px;\n  min-height: 25px;\n  text-align: center;\n  vertical-align: middle;\n}\n\n.dotted-background {\n  background-image: -moz-linear-gradient(45deg, #444 25%, transparent 25%), -moz-linear-gradient(-45deg, #444 25%, transparent 25%), -moz-linear-gradient(45deg, transparent 75%, #444 75%), -moz-linear-gradient(-45deg, transparent 75%, #444 75%);\n  background-image: -webkit-gradient(linear, 0 100%, 100% 0, color-stop(0.25, #444), color-stop(0.25, transparent)), -webkit-gradient(linear, 0 0, 100% 100%, color-stop(0.25, #444), color-stop(0.25, transparent)), -webkit-gradient(linear, 0 100%, 100% 0, color-stop(0.75, transparent), color-stop(0.75, #444)), -webkit-gradient(linear, 0 0, 100% 100%, color-stop(0.75, transparent), color-stop(0.75, #444));\n  background-image: -webkit-linear-gradient(45deg, #444 25%, transparent 25%), -webkit-linear-gradient(-45deg, #444 25%, transparent 25%), -webkit-linear-gradient(45deg, transparent 75%, #444 75%), -webkit-linear-gradient(-45deg, transparent 75%, #444 75%);\n  background-image: -o-linear-gradient(45deg, #444 25%, transparent 25%), -o-linear-gradient(-45deg, #444 25%, transparent 25%), -o-linear-gradient(45deg, transparent 75%, #444 75%), -o-linear-gradient(-45deg, transparent 75%, #444 75%);\n  background-image: linear-gradient(45deg, #444 25%, transparent 25%), linear-gradient(-45deg, #444 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #444 75%), linear-gradient(-45deg, transparent 75%, #444 75%);\n  -moz-background-size: 2px 2px;\n  background-size: 2px 2px;\n  -webkit-background-size: 2px 2px; /* override value for webkit */\n  background-position: 0 0, 1px 0, 1px -1px, 0px 1px;\n}\n\n.empty-bat:before, .empty-bat:after {\n  position: absolute;\n  content: \"\";\n  background: black;\n  display: block;\n  width: 1px;\n  height: 25px;\n  -webkit-transform: rotate(-45deg);\n  transform: rotate(-45deg);\n  left: 0;\n  right: 0;\n  top: 0;\n  bottom: 0;\n  margin: auto;\n}\n\n.empty-bat:after {\n  -webkit-transform: rotate(45deg);\n  transform: rotate(45deg);\n}\n\n.spaced-label:after {\n  content: \" : \";\n}\n\n.mho-hidden {\n  display: none !important;\n}\n\n.mho-sort-arrow {\n  display: inline-block;\n  margin-left: 2px;\n  opacity: 0.4;\n  font-size: 10px;\n  cursor: pointer;\n  user-select: none;\n  transition: opacity 0.15s;\n}\n\n.mho-sortable-cell {\n  cursor: pointer;\n  white-space: nowrap;\n}\n\n.mho-checkbox-dropdown-panel {\n  display: none;\n  position: absolute;\n  top: 100%;\n  left: 0;\n  z-index: 10;\n  max-height: 200px;\n  overflow-y: auto;\n  padding: 4px;\n  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);\n}\n.mho-checkbox-dropdown-panel > div {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  white-space: nowrap;\n}\n\n.mho-dropdown-toggle {\n  max-width: 200px;\n}\n\n#mho-filter-omniscience-stars {\n  min-width: 100px;\n}\n\n#mho-filter-omniscience-online, #mho-filter-citizen-list-online {\n  max-width: 60px;\n}\n\n.mho-filter-bar {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.5em;\n  margin-bottom: 0.5em;\n  align-items: flex-end;\n}\n\n.mho-filter-field {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n  position: relative;\n}\n.mho-filter-field:has(.mho-checkbox-dropdown-panel) {\n  min-width: 65px;\n}\n\n.mho-filter-label {\n  display: block !important;\n  width: 100%;\n  font-size: 0.8em;\n}\n\n.mho-search-wrapper {\n  position: relative;\n}\n\n.mho-search-input {\n  padding-left: 24px;\n  margin-bottom: 0;\n}\n\n.mho-search-icon {\n  height: 24px;\n  position: absolute;\n  left: 0;\n  top: 50%;\n  transform: translateY(-50%);\n}\n\n.mho-changelog-modal-overlay {\n  position: fixed;\n  inset: 0;\n  z-index: 10000;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background: rgba(0, 0, 0, 0.65);\n}\n\n.mho-changelog-modal-box {\n  background: url(__REPO_IMG_HORDES_URL__background/box/panel_00.gif) 0 0 no-repeat, url(__REPO_IMG_HORDES_URL__background/box/panel_02.gif) 100% 0 no-repeat, url(__REPO_IMG_HORDES_URL__background/box/panel_20.gif) 0 100% no-repeat, url(__REPO_IMG_HORDES_URL__background/box/panel_22.gif) 100% 100% no-repeat, url(__REPO_IMG_HORDES_URL__background/box/panel_01.gif) 0 0 repeat-x, url(__REPO_IMG_HORDES_URL__background/box/panel_10.gif) 0 0 repeat-y, url(__REPO_IMG_HORDES_URL__background/box/panel_12.gif) 100% 0 repeat-y, url(__REPO_IMG_HORDES_URL__background/box/panel_21.gif) 0 100% repeat-x, #7e4d2a;\n  border-radius: 12px;\n  box-shadow: 0 0 20px #000;\n  color: #f0d79e;\n  display: flex;\n  flex-direction: column;\n  max-height: 80vh;\n  max-width: 600px;\n  min-width: 320px;\n  padding: 1em 1.5em;\n  gap: 0.75em;\n}\n\n.mho-changelog-modal-title {\n  color: #fff;\n  font-family: Trebuchet MS, Arial, Verdana, sans-serif;\n  font-variant: small-caps;\n  margin: 0;\n  border-bottom: 1px solid #ddab76;\n  padding-bottom: 0.5em;\n}\n\n.mho-changelog-modal-body {\n  flex: 1;\n  overflow-y: auto;\n  white-space: pre-wrap;\n  word-break: break-word;\n  font-family: Trebuchet MS, Arial, Verdana, sans-serif;\n  font-size: 0.9em;\n  margin: 0;\n  color: #f0d79e;\n}\n\n.mho-changelog-modal-footer {\n  display: flex;\n  justify-content: flex-end;\n  border-top: 1px solid #ddab76;\n  padding-top: 0.5em;\n}\n\n.mho-changelog-modal-btn {\n  background-color: #5c2b20;\n  border: 1px solid #f0d79e;\n  color: #f0d79e;\n  cursor: pointer;\n  font-family: Trebuchet MS, Arial, Verdana, sans-serif;\n  font-variant: small-caps;\n  padding: 0.25em 1.5em;\n}\n.mho-changelog-modal-btn:hover {\n  background-color: #7e4d2a;\n  outline: 1px solid #f0d79e;\n}\n\n.mho-changelog-history-toggle {\n  color: #ddab76;\n  cursor: pointer;\n  font-family: Trebuchet MS, Arial, Verdana, sans-serif;\n  font-size: 0.85em;\n  font-variant: small-caps;\n  text-decoration: underline dotted;\n  user-select: none;\n}\n\n.mho-changelog-history-toggle:hover {\n  color: #f0d79e;\n}\n\n.mho-changelog-history-section {\n  border-top: 1px solid #7e4d2a;\n  display: flex;\n  flex-direction: column;\n  gap: 0.75em;\n  max-height: 35vh;\n  overflow-y: auto;\n  padding-top: 0.5em;\n}\n\n.mho-changelog-history-block {\n  border-bottom: 1px dotted #7e4d2a;\n  padding-bottom: 0.5em;\n}\n\n.mho-changelog-history-block:last-child {\n  border-bottom: none;\n}\n\n.mho-changelog-history-version {\n  color: #ddab76;\n  font-family: Trebuchet MS, Arial, Verdana, sans-serif;\n  font-variant: small-caps;\n  font-size: 0.9em;\n  margin: 0 0 0.25em 0;\n}\n\n.mho-changelog-history-body {\n  color: #c8a870;\n  font-family: Trebuchet MS, Arial, Verdana, sans-serif;\n  font-size: 0.8em;\n  margin: 0;\n  white-space: pre-wrap;\n  word-break: break-word;\n}\n\n.mho-anti-abuse-counter-content {\n  border-bottom: 1px solid #ddab76;\n  display: flex;\n  gap: 0.5em;\n  justify-content: space-between;\n  flex-wrap: wrap;\n}\n\n#mho-camping-predict {\n  background-color: rgba(92, 43, 32, 0.35);\n  border: 1px solid #7e4d2a;\n  border-radius: 8px;\n  padding: 0.5em 0.75em;\n  margin: 0.5em 0;\n  color: #f0d79e;\n}\n#mho-camping-predict .mho-camping-title {\n  display: flex;\n  align-items: center;\n  gap: 0.5em;\n  margin: 0 0 0.5em;\n  padding-bottom: 0.4em;\n  border-bottom: 1px solid #7e4d2a;\n}\n#mho-camping-predict .mho-camping-title img {\n  height: 24px;\n}\n#mho-camping-predict .mho-camping-title span {\n  font-size: 1.25em;\n  font-variant: small-caps;\n  color: #fff;\n}\n#mho-camping-predict .mho-camping-section {\n  margin-bottom: 0.5em;\n}\n#mho-camping-predict .mho-camping-section:last-child {\n  margin-bottom: 0;\n}\n#mho-camping-predict .mho-camping-section > h3 {\n  font-size: 0.95em;\n  font-variant: small-caps;\n  color: #ddab76;\n  margin: 0 0 0.3em;\n  padding-bottom: 0.15em;\n  border-bottom: 1px dotted #7e4d2a;\n}\n#mho-camping-predict .mho-camping-columns {\n  display: flex;\n  flex-direction: row;\n  gap: 0;\n}\n#mho-camping-predict .mho-camping-columns > .mho-camping-section {\n  min-width: 0;\n  padding: 0 0.75em;\n  flex: 3 1 0;\n}\n#mho-camping-predict .mho-camping-columns > .mho-camping-section.town {\n  flex: 2 1 0;\n}\n#mho-camping-predict .mho-camping-columns > .mho-camping-section:first-child {\n  padding-left: 0;\n}\n#mho-camping-predict .mho-camping-columns > .mho-camping-section:last-child {\n  padding-right: 0;\n}\n#mho-camping-predict .mho-camping-columns > .mho-camping-section:not(:first-child) {\n  border-left: 1px solid #7e4d2a;\n}\n#mho-camping-predict .mho-camping-columns > .mho-camping-section > .mho-camping-section-content {\n  display: flex;\n  flex-wrap: wrap;\n  justify-content: space-around;\n  gap: 1em 2em;\n}\n#mho-camping-predict .mho-camping-field {\n  display: flex;\n  align-items: center;\n  gap: 0.4em;\n  padding: 0.15em 0;\n  min-width: 0;\n}\n#mho-camping-predict .mho-camping-field label {\n  display: flex;\n  align-items: center;\n  gap: 0.3em;\n  flex: 1 1 auto;\n  min-width: 0;\n  cursor: pointer;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n#mho-camping-predict .mho-camping-field label img {\n  flex-shrink: 0;\n}\n#mho-camping-predict .mho-camping-field:has(input[type=checkbox]) {\n  display: inline-flex;\n}\n#mho-camping-predict .mho-camping-field:has(input[type=number]) {\n  width: 100%;\n}\n#mho-camping-predict .mho-camping-field input[type=number] {\n  flex: 0 0 auto;\n  width: 2em;\n  text-align: center;\n  margin: 0;\n}\n#mho-camping-predict .mho-camping-field input[type=checkbox] {\n  flex: 0 0 auto;\n  margin: 0;\n}\n#mho-camping-predict .mho-camping-field select {\n  flex: 1 1 auto;\n  min-width: 0;\n}\n#mho-camping-predict .mho-camping-stepper-btn {\n  flex-shrink: 0;\n  height: 14px;\n  width: auto;\n  cursor: pointer;\n  user-select: none;\n}\n#mho-camping-predict .mho-camping-field--full {\n  grid-column: 1/-1;\n}\n#mho-camping-predict .mho-camping-numbers-grid {\n  display: grid;\n  grid-template-columns: repeat(2, 1fr);\n  gap: 0.2em 0.6em;\n  width: 100%;\n}\n#mho-camping-predict .mho-camping-numbers-grid label {\n  flex: 0 0 auto;\n  width: 2em;\n}\n#mho-camping-predict .mho-camping-numbers-grid > .mho-camping-field:nth-child(2n) {\n  justify-content: flex-end;\n}\n#mho-camping-predict #camping-result {\n  background-color: rgba(0, 0, 0, 0.25);\n  border-radius: 6px;\n  padding: 0.5em 0.6em;\n  margin-top: 0.2em;\n}\n#mho-camping-predict .mho-camping-title {\n  cursor: pointer;\n  user-select: none;\n  position: relative;\n}\n#mho-camping-predict .mho-camping-title::before {\n  content: \"▶︎\";\n  transition: transform 0.2s ease;\n}\n#mho-camping-predict.mho-camping-opened .mho-camping-title::before {\n  transform: rotate(90deg);\n}\n#mho-camping-predict .mho-camping-content {\n  padding-top: 0.4em;\n}\n\n.row-table:has(.mho-town-list-link-cell) .cell.rw-1:has(img):not(:has(.language)), .row-table:has(.mho-town-list-link-cell) .cell.rw-1.right {\n  flex-basis: 4.166666665%;\n}\n.row-table:has(.mho-town-list-link-cell) .cell.rw-3 {\n  flex-basis: 20.833333335%;\n}\n\n.mho-town-list-link-cell {\n  align-items: center;\n  cursor: pointer;\n  display: flex;\n  gap: 0.25em;\n  position: relative;\n}\n\n.mho-town-list-link-panel {\n  background-color: #5c2b20;\n  border: 1px solid #ddab76;\n  border-radius: 6px;\n  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);\n  display: none;\n  flex-direction: column;\n  gap: 0.25em;\n  left: 0;\n  padding: 0.5em;\n  position: absolute;\n  top: 100%;\n  z-index: 10;\n}\n.mho-town-list-link-panel.mho-open {\n  display: flex;\n}\n.mho-town-list-link-panel.mho-align-right {\n  left: auto;\n  right: 0;\n}";

    const STYLE_PLACEHOLDERS = new Map([
        ['__BTN_ID__', btn_id],
        ['__MH_OPTIMIZER_MAP_WINDOW_ID__', mh_optimizer_map_window_id],
        ['__MHO_DISPLAY_EXPEDITIONS_ID__', mho_display_expeditions_id],
        ['__MHO_DISPLAY_MAP_ID__', mho_display_map_id],
        ['__MHO_STORE_NOTIFICATIONS_ID__', mho_store_notifications_id],
        ['__REPO_IMG_HORDES_URL__', repo_img_hordes_url]
    ]);
    function createStyles() {
        let css = styleTemplate;
        for (const [placeholder, value] of STYLE_PLACEHOLDERS) {
            css = css.replaceAll(placeholder, value);
        }
        const style = document.createElement('style');
        style.appendChild(document.createTextNode(css));
        document.getElementsByTagName('head')[0].appendChild(style);
    }

    bootstrap();
    ///////////////////////////
    //     MAIN FUNCTION     //
    ///////////////////////////
    (function () {
        if (document.URL.startsWith(big_broth_hordes_url) || document.URL.startsWith(gest_hordes_url) || document.URL.startsWith(gest_hordes_old_url) || document.URL.startsWith(fata_morgana_url) || document.URL.startsWith(state.website)) {
            let current_key;
            let map_block_id;
            let ruin_block_id;
            let block_copy_map_button;
            let block_copy_ruin_button;
            let source;
            if (document.URL.startsWith(big_broth_hordes_url)) {
                current_key = gm_bbh_updated_key;
                map_block_id = 'carte';
                ruin_block_id = 'plan';
                block_copy_map_button = 'ul_infos_1';
                block_copy_ruin_button = 'cl1';
                source = 'bbh';
            }
            else if (document.URL.startsWith(gest_hordes_url) || document.URL.startsWith(gest_hordes_old_url)) {
                current_key = gm_gh_updated_key;
                map_block_id = 'zoneCarte';
                ruin_block_id = 'carteRuine';
                block_copy_map_button = 'zoneInfoVilleAutre';
                block_copy_ruin_button = 'menuRuine';
                source = 'gh';
            }
            else if (document.URL.startsWith(fata_morgana_url)) {
                current_key = gm_fata_updated_key;
                map_block_id = 'map';
                ruin_block_id = 'ruinmap';
                block_copy_map_button = 'modeBar';
                block_copy_ruin_button = 'modeBar';
                source = 'fm';
            }
            else if (document.URL.startsWith(state.website)) {
                current_key = gm_mho_updated_key;
                source = 'mho';
            }
            // Si on est sur le site de BBH ou GH ou Fata et que BBH ou GH ou Fata a été mis à jour depuis MyHordes, alors on recharge BBH ou GH ou Fata au moment de revenir sur l'onglet
            document.addEventListener('visibilitychange', function () {
                getStorageItem(current_key).then((current) => {
                    if (current && !document.hidden) {
                        setStorageItem(current_key, false);
                        if (current_key === gm_bbh_updated_key && state.mho_parameters.refresh_bbh_after_update) {
                            location.reload();
                        }
                        else if (current_key === gm_gh_updated_key && state.mho_parameters.refresh_gh_after_update) {
                            const refresh_btn = document.querySelector('#zoneRefresh');
                            if (refresh_btn) {
                                refresh_btn.click();
                            }
                            else {
                                location.reload();
                            }
                        }
                        else if (current_key === gm_fata_updated_key && state.mho_parameters.refresh_fm_after_update) {
                            location.reload();
                        }
                        else if (current_key === gm_mho_updated_key && state.mho_parameters.refresh_mho_after_update) {
                            location.reload();
                        }
                    }
                });
            });
            let interval = setInterval(() => {
                let copy_button = document.getElementById(mho_copy_map_id);
                if (state.mho_parameters.display_map && !copy_button) {
                    let map_block = document.getElementById(map_block_id);
                    let ruin_block = document.getElementById(ruin_block_id);
                    if (map_block || ruin_block) {
                        if (ruin_block) {
                            createCopyButton(source, 'ruin', ruin_block_id, block_copy_ruin_button);
                        }
                        else if (map_block) {
                            createCopyButton(source, 'map', map_block_id, block_copy_map_button);
                        }
                    }
                }
                else if (!state.mho_parameters.display_map && copy_button) {
                    copy_button.remove();
                    clearInterval(interval);
                }
                else {
                    clearInterval(interval);
                }
            }, 1000);
        }
        else {
            /** Vérifie si la version est nouvelle ou non */
            getStorageItem(mho_version_key).then((version) => {
                toggleNewChangelog(isNewVersion(version));
                createStyles();
                createOptimizerBtn();
                createMhoHeaderSpace();
                notifyOnSearchEnd();
                initOptionsWithoutLoginNeeded();
                getParameters().then(() => {
                    getApiKey().then(() => {
                        getToken().then(() => {
                            setTimeout(() => {
                                initOptionsWithLoginNeeded();
                                initOptionsWithoutLoginNeeded();
                            });
                            const handleEvent = (event_name) => (event) => {
                                console.log('MHO - handled event', event_name);
                                if (shouldRefreshMe()) {
                                    getToken(true).then(() => {
                                        initOptionsWithLoginNeeded();
                                        initOptionsWithoutLoginNeeded();
                                    });
                                }
                                else {
                                    initOptionsWithLoginNeeded();
                                    initOptionsWithoutLoginNeeded();
                                }
                            };
                            [
                                {
                                    target: document,
                                    events: [/*'mh-navigation-begin', */ 'mh-navigation-complete', 'mh-current-log-update', 'mh-current-log-refresh' /*, 'tokenExchangeCompleted', 'load', 'tooltipAppear', 'tooltipDisappear', 'pop', 'load', 'popstate', 'error', 'push', 'tab-switch', '_react', 'x-react-degenerate', 'DOMContentLoaded', 'movement-reset', 'readystatechange'*/]
                                },
                                {
                                    target: document.documentElement,
                                    events: [ /*'sig-inventory-bag-loaded', 'sig-inventory-changed', 'sig-inventory-changed-b', 'sig-inventory-changed-headless', 'sig-log-changed', 'sig-map-changed', 'sig-web-navigation'*/]
                                },
                            ].forEach(({ target, events }) => {
                                events.forEach((event_name) => {
                                    target.addEventListener(event_name, handleEvent(event_name));
                                });
                            });
                        })
                            .catch(() => {
                            initOptionsWithoutLoginNeeded();
                        });
                    });
                })
                    .catch(() => {
                    initOptionsWithoutLoginNeeded();
                });
            });
        }
    })();

})();
