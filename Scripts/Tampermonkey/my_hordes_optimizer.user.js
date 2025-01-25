// ==UserScript==
// @name         MHO Addon
// @version      1.0.32.0
// @description  Optimizer for MyHordes - Documentation & fonctionnalités : https://myhordes-optimizer.web.app/, rubrique Tutoriels
// @author       Zerah
//
// @icon         https://myhordes-optimizer.web.app/assets/img/logo/logo_mho_16x16.png
// @icon64       https://myhordes-optimizer.web.app/assets/img/logo/logo_mho_64x64.png
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
// @match        https://fatamorgana.md26.eu/*
//
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM_notification
//
// ==/UserScript==

const changelog = `${getScriptInfo().name} : Changelog pour la version ${getScriptInfo().version}\n\n`
    + `[Correctif] Textes manquants dans certains tooltips\n`;

const lang = (document.querySelector('html[lang]')?.getAttribute('lang') || document.documentElement.lang || navigator.language || navigator.userLanguage).substring(0, 2) || 'fr';

/* const is_mh_beta = document.URL.indexOf('staging') >= 0; */
const is_mh_beta = false;
const website = is_mh_beta ? `https://myhordes-optimizer-beta.web.app/` : `https://myhordes-optimizer.web.app/`;

const gest_hordes_url = 'https://gest-hordes2.eragaming.fr';
const big_broth_hordes_url = 'https://bbh.fred26.fr';
const fata_morgana_url = 'https://fatamorgana.md26.eu';

const gm_bbh_updated_key = 'MHO_bbh_updated';
const gm_gh_updated_key = 'MHO_gh_updated';
const gm_fata_updated_key = 'MHO_fata_updated';
const gm_mho_updated_key = 'MHO_mho_updated';
const gm_mh_external_app_id_key = is_mh_beta ? 'MHO_mh_beta_external_app_id' : 'MHO_mh_external_app_id';
const mho_parameters_key = 'MHO_parameters';
const mh_user_key = 'MHO_mh_user';
const mho_map_key = 'MHO_map';
const mho_token_key = 'MHO_token';
const mho_blacklist_key = 'MHO_blacklist';
const mho_anti_abuse_key = 'MHO_anti_abuse';
const mho_version_key = 'MHO_version';

let mho_parameters;
getStorageItem(mho_parameters_key).then((params) => {
    mho_parameters = params || {};
});
let mh_user;
getStorageItem(mh_user_key).then((user) => {
    mh_user = user;
});
let external_app_id;
getStorageItem(gm_mh_external_app_id_key).then((app_id) => {
    external_app_id = app_id;
});
let token;
getStorageItem(mho_token_key).then((saved_token) => {
    token = saved_token;
});


////////////////////
// L'URL de L'API //
////////////////////

const api_url = 'https://api.myhordesoptimizer.fr' + (is_mh_beta ? '/beta' : '');
// const api_url = 'https://api.myhordesoptimizer.fr/dev';

///////////////////////////////////////////
// Listes de constantes / Constants list //
///////////////////////////////////////////

const hordes_img_url = '/build/images/';
const repo_img_url = 'https://myhordes-optimizer.web.app/assets/img/';
const repo_img_hordes_url = repo_img_url + 'hordes_img/';

const mh_optimizer_icon = 'https://myhordes-optimizer.web.app/assets/img/logo/logo_mho_64x64_outlined.png';

const mh_optimizer_window_id = 'optimizer-window';
const mh_optimizer_map_window_id = 'optimizer-map-window';
const mho_expeditions_window_id = 'mho-expeditions-window';
const btn_id = 'optimizer-btn';
const content_btn_id = 'optimizer-content-btn';
const mh_header_id = 'header-reload-area';
const mh_content_id = 'content';
const mh_update_external_tools_id = 'mh-update-external-tools';
const mho_warn_missing_logs_id = 'mho-warn-missing-logs';
const mho_camping_predict_id = 'mho-camping-predict';
const wiki_btn_id = 'wiki-btn-id';
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
const mho_display_translate_input_id = 'mho-display-translate-input';
const mho_watchtower_estim_id = 'mho-watchtower-estim';
const mho_anti_abuse_counter_id = 'mho-anti-abuse-counter';
const mho_copy_logs_id = 'mho-copy-logs';

//////////////////////////////////////
// Les éléments récupérés via l'API //
//////////////////////////////////////

let items;
let ruins;
let recipes;
let citizens;
let hero_skills;
let wishlist;
let parameters;
let map;
let current_cell;
let my_expeditions;
let tooltips_observer;

///////////////////
// Les variables //
///////////////////

let is_refresh_wishlist;
/** true quand le changelog est nouveau et qu'il faut afficher une pastille sur le menu */
let has_new_changelog = false;
/** True quand une erreur vient d'être affichée. Repasse à false au bout d'une seconde, pour éviter le spam d'erreurs */
let is_error = false;

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
        de: `Aktualisierung…`,
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
        en: `Number of zombies on the zone`,
        fr: `Nombre de zombies sur la case`,
        de: `Anzahl der Zombies auf der Zelle`,
        es: `Cantidad de zombis en la zona`,
    },
    objects_in_bag: {
        en: `Number of skins and tents in the bag`,
        fr: `Nombre de pelures de peau et de toiles de tentes dans le sac`,
        de: `Anzahl der Felle und Zelte in der Tasche`,
        es: `Cantidad de pellejos humanos y telas de carpa en el bolso`,
    },
    improve: {
        en: `Number of simple improvements made on the zone (must subtract 3 after each attack)`,
        fr: `Nombre d'améliorations simples faites sur la case (il faut en soustraire 3 après chaque attaque)`,
        de: `Anzahl der einfachen Verbesserungen, die an der Zelle vorgenommen wurden (muss nach jedem Angriff 3 abziehen)`,
        es: `Cantidad de mejoras simples hechas en la zona (hay que restar 3 luego de cada ataque)`,
    },
    object_improve: {
        en: `Number of defense objects installed on the zone`,
        fr: `Nombre d'objets de défense installés sur la case`,
        de: `Anzahl der auf der Zelle installierten Verteidigungsobjekte`,
        es: `Cantidad de objetos defensivos instalados en la zona`,
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
        en: `Modification of success chances for digging`,
        fr: `Modification des chances de réussite des fouilles`,
        de: `Änderung der Erfolgschancen beim Graben`,
        es: `Modificación de las probabilidades de éxito en las excavaciones`,
    }
}

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
    {id: "clean", img: "status/status_clean.gif", pdc: 1}, // Jamais drogué
    {id: "hasdrunk", img: "status/status_hasdrunk.gif"}, // A bu
    {id: "haseaten", img: "status/status_haseaten.gif"}, // A mangé
    {id: "camper", img: "status/status_camper.gif", searches: '+10%'}, // A campé
    {id: "immune", img: "status/status_immune.gif", watch_death: -0.01}, // Immunisé
    {id: "hsurvive", img: "status/status_hsurvive.gif"}, // VLM niveau 1
    {id: "hsurvive2", img: "status/status_hsurvive2.gif"}, // VLM niveau 2
    {id: "hsurvive3", img: "status/status_hsurvive3.gif"}, // VLM niveau 3
    {id: "tired", img: "status/status_tired.gif"}, // Fatigué
    {id: "terror", img: "status/status_terror.gif", watch_def: -30, watch_death: 0.05}, // Terrorisé
    {id: "thirst1", img: "status/status_thirst1.gif", watch_def: -5}, // Soif
    {id: "thirst2", img: "status/status_thirst2.gif", watch_def: -10, wath_death: 0.03}, // Deshy
    {id: "drugged", img: "status/status_drugged.gif", watch_def: 10}, // Drogué
    {id: "addict", img: "status/status_addict.gif", watch_def: 10, watch_death: 0.06}, // Dépendant
    {id: "infection", img: "status/status_infection.gif", watch_def: -15, watch_death: 0.1}, // Infecté
    {id: "drunk", img: "status/status_drunk.gif", watch_def: 15, watch_death: -0.02, searches: '-20%"'}, // Ivre
    {id: "hungover", img: "status/status_hungover.gif", watch_def: -15, watch_death: 0.06}, // Gueule de bois
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
    {id: "wound6", img: "status/status_wound6.gif", watch_def: -15, watch_death: 0.10, properties: ['wounded']}, // Blessure au pied
    {id: "healed", img: "status/status_healed.gif", watch_def: -15, watch_death: 0.05}, // Convalescent
    {id: "hydrated", img: "status/status_hydrated.gif", pdc: 1}, // Hydraté
    {id: "sober", img: "status/status_sober.gif", pdc: 1} // Sobre
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
        label: {en: `Citizen actions`, fr: `Actions du citoyen`, de: `Bürgeraktionen`, es: `Acciones del habitante`},
        ordering: 1
    },
    {id: `Recipe::WorkshopType`, label: {en: `Workshop`, fr: `Atelier`, de: `Werkstatt`, es: `Taller`}, ordering: 0},
    {
        id: `Recipe::WorkshopTypeShamanSpecific`,
        label: {en: `Workshop - Shaman`, fr: `Atelier - Chaman`, de: `Werkstatt - Schamane`, es: `Taller - Chamán`},
        ordering: 2
    },
];

const wishlist_depot = [
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
        label: {en: ``, fr: ``, es: ``, de: ``},
        id: 'delete'
    },
];

let fill_items_messages_pool = {
    en: [
        {title: 'Hi', content: ':iloveu:'}
    ],
    fr: [
        {title: 'Coucou', content: ':iloveu:'}
    ],
    de: [
        {title: 'Hallo', content: ':iloveu:'}
    ],
    es: [
        {title: 'Hola', content: ':iloveu:'}
    ]
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
            id: `skills`,
            label: {
                en: `Hero Skills`,
                fr: `Pouvoirs`,
                de: `Heldentaten`,
                es: `Poderes`
            },
            icon: repo_img_hordes_url + `/professions/hero.gif`
        },
        {
            ordering: 3,
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
        {
            ordering: 1,
            id: `wishlist`,
            label: {
                en: `Wishlist`,
                fr: `Liste de courses`,
                de: `Wunschzettel`,
                es: `Lista de deseos`
            },
            icon: repo_img_hordes_url + `item/item_cart.gif`,
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
            ordering: 3,
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
                            fr: `Mise à jour quand la ville est en Chaos`,
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
            {
                id: `update_bbh`,
                label: {
                    en: `Update BigBroth’Hordes`,
                    fr: `Mettre à jour BigBroth'Hordes`,
                    de: `BigBroth’Hordes Aktualisieren`,
                    es: `Actualizar BigBroth'Hordes`
                },
                children: [
                    {
                        id: `refresh_bbh_after_update`,
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
                    // {
                    //     id: `update_fata_job_markers`,
                    //     label: {
                    //         en: `Updates information from job markers`,
                    //         fr: `Met à jour les informations issues des marqueurs de métiers`,
                    //         de: `Aktualisiert Informationen von Jobmarkierungen`,
                    //         es: `Actualiza la información de los marcadores de trabajo.`
                    //     },
                    // },
                    {
                        id: `update_fata_devastated`,
                        label: {
                            en: `Zone update even after the town is in Chaos`,
                            fr: `Mise à jour quand la ville est en Chaos`,
                            de: `Zonen-Update, nachdem die Stadt bereits zerstört wurde`,
                            es: `Actualización de zona cuando los pueblo está sumida en el caos`
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
            {
                id: `show_compact`,
                label: {
                    en: `Enable compact mode out of town`,
                    fr: `Activer le mode compact hors de la ville`,
                    de: `Aktivieren Sie den Kompaktmodus außerhalb der Stadt`,
                    es: `Habilitar el modo compacto fuera de la ciudad`
                },
                help: {
                    en: `On small screen only, external tools update button will be displayed with compressed buttons`,
                    fr: `Sur petit écran uniquement, le bouton de mise à jour des outils externes sera affiché avec les boutons compressés`,
                    de: `Nur auf kleinen Bildschirmen wird die Aktualisierungsschaltfläche für externe Tools mit komprimierten Schaltflächen angezeigt`,
                    es: `Solo en pantalla pequeña, el botón de actualización de herramientas externas se mostrará con botones comprimidos`
                },
            },
            {
                id: `display_map`,
                label: {
                    en: `Allow to show a map from external tools`,
                    fr: `Permettre d'afficher une carte issue des outils externes`,
                    de: `Anzeigen einer Karte von externen Tools ermöglichen`,
                    es: `Permitir que se muestre un mapa proveniente de las aplicaciones externas`
                },
                help: {
                    en: `In any external tool, it will be possible to copy the town or ruin map and to paste it into MyHordes`,
                    fr: `Dans les outils externes, il sera possible de copier la carte de la ville ou de la ruine, et une fois copiée de l'afficher dans MyHordes`,
                    de: `In jedem externen Tool wird es möglich sein, die Stadt- oder Ruinenkarte zu kopieren und in MyHordes einzufügen`,
                    es: `En toda aplicación externa, es posible copiar el mapa del pueblo o de la ruina y pegarlo en MyHordes`
                },
            }
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
                id: `enhanced_tooltips`,
                label: {
                    en: `Detailed tooltips`,
                    fr: `Tooltips détaillés`,
                    de: `Detaillierte Tooltips`,
                    es: `Tooltips detallados`
                },
            },
            {
                id: `click_on_voted`,
                label: {
                    en: `Quick navigation to recommended construction site`,
                    fr: `Navigation rapide vers le chantier recommandé`,
                    de: `Schnelle Navigation zur empfohlenen Baustelle`,
                    es: `Navegación rápida hacia la construcción recomendada`
                },
            },
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
                id: `display_camping_predict`,
                label: {
                    en: `Camping predictions in area information`,
                    fr: `Prédictions de camping dans les informations du secteur`,
                    de: `Campingvorhersagen in Gebietsinformationen`,
                    es: `Predicciones para acampar en la información del área`
                },
            },
            {
                id: `display_more_informations_from_mho`,
                label: {
                    en: `Miscellaneous information from MyHordes Optimizer`,
                    fr: `Informations diverses issues de MyHordes Optimizer`,
                    de: `Verschiedene Informationen von MyHordes Optimizer`,
                    es: `Información miscelánea de MyHordes Optimizer`
                },
                help: {
                    en: `Displays the note of the box, if it exists.`,
                    fr: `Affiche la note de la case, si elle existe.`,
                    de: `Zeigt die Notiz der Box an, falls vorhanden.`,
                    es: `Muestra la nota de la caja, si existe.`
                },
            },
            {
                id: `display_estimations_on_watchtower`,
                label: {
                    en: `Shows estimates saved on the watchtower page`,
                    fr: `Affiche les estimations enregistrées sur la page de la tour de guet`,
                    de: `Zeigt auf der Watchtower-Seite gespeicherte Schätzungen an`,
                    es: `Muestra estimaciones guardadas en la página de la torre de vigilancia`
                },
            },
            {
                id: `copy_registry`,
                label: {
                    en: `Adds a button to copy registry contents`,
                    fr: `Ajoute un bouton permettant de copier le contenu du registre`,
                    de: `Fügt eine Schaltfläche zum Kopieren von Registrierungsinhalten hinzu`,
                    es: `Agrega un botón para copiar el contenido del registro`
                },
            },
            {
                id: `display_anti_abuse`,
                label: {
                    en: `Displays a counter to manage anti-abuse`,
                    fr: `Affiche un compteur pour gérer l'anti-abus`,
                    de: `Zeigt einen Zähler zur Verwaltung der Missbrauchsbekämpfung an`,
                    es: `Muestra un contador para gestionar anti-abuso`
                },
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
                id: `display_ghoul_voracity_percent`,
                label: {
                    en: `Shows the percentage on the voracity gauge`,
                    fr: `Affiche le pourcentage sur la jauge de voracité`,
                    de: `Zeigt den Prozentsatz der Unersättlichkeitsanzeige an`,
                    es: `Muestra el porcentaje en el indicador de voracidad`
                },
            },
            {
                id: `display_external_links`,
                label: {
                    en: `Shows links to external profiles`,
                    fr: `Affiche des liens vers les profils externes`,
                    de: `Zeigt Links zu externen Profilen an`,
                    es: `Muestra enlaces a perfiles externos`
                },
            },
            // {
            //     id: `store_notifications`,
            //     label: {
            //         en: `Stores notifications until cleared`,
            //         fr: `Stocke les notifications jusqu'à effacement`,
            //         de: `Speichert Benachrichtigungen, bis sie gelöscht werden`,
            //         es: `Almacena notificaciones hasta que se borran`
            //     },
            // },
            {
                id: `display_my_expeditions`,
                label: {
                    en: `Shows details of expeditions I am registered for`,
                    fr: `Affiche les détails des expéditions auxquelles je suis inscrit`,
                    de: `Zeigt Details zu Expeditionen an, für die ich registriert bin`,
                    es: `Muestra detalles de las expediciones para las que estoy registrado.`
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
                    version[getScriptInfo().version] = confirm(changelog);
                    toggleNewChangelog(!!version[getScriptInfo().version]);
                    setStorageItem(mho_version_key, version);
                } else {
                    alert(changelog);
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
            let manual_app_id_key = prompt(getI18N(texts.edit_add_app_id_key), external_app_id);

            if (manual_app_id_key !== null && manual_app_id_key !== undefined && manual_app_id_key !== '') {
                external_app_id = manual_app_id_key;
                setStorageItem(gm_mh_external_app_id_key, external_app_id);
            } else if (manual_app_id_key === '') {
                external_app_id = undefined;
                setStorageItem(gm_mh_external_app_id_key, undefined);
            }
        },
        img: `icons/small_remove.gif`
    }
];

const table_hero_skills_headers = [
    {id: 'name', label: {en: `Name`, fr: `Nom`, de: `Name`, es: `Nombre`}, type: 'th'},
    {
        id: 'nombreJourHero',
        label: {en: `Hero days`, fr: `Jours héros`, de: `Heldentage`, es: `Días de héroe`},
        type: 'td'
    },
    {
        id: 'lastSkill',
        label: {
            en: `Last power earned`,
            fr: `Dernier pouvoir gagné`,
            de: `Letzte Kraft gewonnen`,
            es: `Último poder obtenido`
        },
        type: 'td'
    },
    {
        id: 'uppercut',
        label: {en: `Vicious uppercut`, fr: `Uppercut Sauvage`, de: `Wildstyle Uppercut`, es: `Puñetazo salvaje`},
        type: 'td',
        img: ''
    },
    {id: 'rescue', label: {en: `Rescue`, fr: `Sauvetage`, de: `Rettung`, es: `Rescate`}, type: 'td', img: ''}
];

const table_skills_headers = [
    {id: 'icon', label: {en: ``, fr: ``, de: ``, es: ``}, type: 'th'},
    {id: 'label', label: {en: `Skill`, fr: `Capacité`, de: `Fähigkeit`, es: `Poder`}, type: 'th'},
    {
        id: 'daysNeeded',
        label: {
            en: `Hero days needed`,
            fr: `Jours héros nécessaires`,
            de: `Benötigte Heldentage`,
            es: `Días de héroe necesarios`
        },
        type: 'td'
    },
    {
        id: 'description',
        label: {en: `Description`, fr: `Description`, de: `Beschreibung`, es: `Descripción`},
        type: 'td'
    }
];

const table_ruins_headers = [
    {id: 'img', label: {en: ``, fr: ``, de: ``, es: ``}, type: 'th'},
    {id: 'label', label: {en: `Name`, fr: 'Nom', de: `Name`, es: `Nombre`}, type: 'th'},
    {
        id: 'description',
        label: {en: `Description`, fr: `Description`, de: `Beschreibung`, es: `Descripción`},
        type: 'td'
    },
    {
        id: 'minDist',
        label: {en: `Minimum distance`, fr: `Distance minimum`, de: `Mindestabstand`, es: `Distancia mínima`},
        type: 'td'
    },
    {
        id: 'maxDist',
        label: {en: `Maximum distance`, fr: `Distance maximum`, de: `Maximale Entfernung`, es: `Distancia máxima`},
        type: 'td'
    },
    {
        id: 'camping',
        label: {en: `Camping bonus`, fr: `Bonus en camping`, de: `Campingbonus`, es: `Bono de acampada`},
        type: 'td'
    },
    {
        id: 'capacity',
        label: {en: `Capacity`, fr: `Capacité`, de: `Kapazität`, es: `Capacidad`},
        type: 'td'
    },
    {id: 'drops', label: {en: `Items`, fr: 'Objets', de: `Gegenstände`, es: `Objetos`}, type: 'td'},
];

const added_ruins = [
    {id: '-1000', camping: 0, label: {en: `None`, fr: `Aucun`, de: `Kein`, es: `Ninguna`}}
];

const town_type = [
    {id: 'rne', label: {de: 'Kleine Stadt', en: 'Small Town', es: 'Amateur', fr: 'Petite carte'}},
    {id: 're', label: {de: 'Entfernte Regionen', en: 'Distant Region', es: 'Leyenda', fr: 'Région éloignée'}},
    {id: 'pande', label: {de: 'Pandämonium', en: 'Pandemonium', es: 'Pandemonio', fr: 'Pandémonium'}}
];

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
    return document.URL.indexOf('citizens') > -1;
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

/** @return {boolean}    on doit refresh le user actuel si le jour de la ville est différent du jour précédent */
function shouldRefreshMe() {
    let current_town_name = document.querySelector('.town-name');
    if (!current_town_name) return false;
    return +current_town_name.nextElementSibling.innerText.replace(/(\D)*/, '') !== +mh_user.townDetails?.day;
}

function getI18N(item) {
    if (!item) return;
    return item[lang] !== 'TODO' ? item[lang] : (item['en'] === 'TODO' ? item['fr'] : item['en']);
}

function getCurrentPosition() {
    return document.querySelector('.current-location')?.innerText.replace(/.*: ?/, '').split('/');
}

function getCellDetailsByPosition() {
    let position = getCurrentPosition();
    if (position && map && map.cells) {
        return map.cells.find((cell) => +cell.displayX === +position[0] && +cell.displayY === +position[1]);
    }
}

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
    if (!notifications) return

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
    if (typeof error === 'string' || (error.name !== 'AbortError' && error.name !== 'TypeError') && !is_error) {
        let notifications = document.getElementById('notifications');
        let notification = document.createElement('div');
        notification.classList.add('error', 'show');
        let error_text = `
            <div style="vertical_align: middle"><img src="${mh_optimizer_icon}" style="width: 24px; margin-right: 0.5em;">${getScriptInfo().name}</div>
            <br />
        `;
        notification.innerHTML = error_text + (typeof error === 'string' ? error : getErrorFromApi(error));
        notifications?.appendChild(notification);
        is_error = true
        notification.addEventListener('click', () => {
            notification.remove();
        });
        setTimeout(() => {
            is_error = false;
        }, 1000)
        setTimeout(() => {
            notification.remove();
        }, 10000);
    }
    console.error(`${getScriptInfo().name} : Une erreur s'est produite : \n`, error);
}

function convertResponsePromiseToError(response) {
    return response.text().then((text) => {
        let error = new Error(text);
        error.status = response.status;
        error.name = response.statusText;
        throw error;
    })
}

function getErrorFromApi(error) {
    if (error.name !== 'AbortError' && error.name !== 'TypeError') {
        let error_text = '';
        error_text += `
            <div>${getI18N(api_texts.error).replace('$error$', (error.status ?? '') + (error.status !== 500 && error.status !== 502 && error.status !== 504 ? ' - ' + (error.message ?? error.name ?? error.statusText) : ''))}</div>
            <br />`
        if (!isScriptVersionLastVersion()) {
            error_text += `<div><small>${getI18N(api_texts.error_version).replace('$your_version$', getScriptInfo().version).replace('$recent_version$', parameters?.find((param) => param.name === 'ScriptVersion')?.value)}</small></div>`;
            error_text += `<small>${getI18N(api_texts.update_script)}</small>`;
        }
        error_text += `<div><small>${getI18N(api_texts.error_discord)}</small><div>`;
        return error_text;
    }
}

function isScriptVersionLastVersion() {
    if (!isScript()) return true;

    const current_script_version = getScriptInfo().version;
    const base_script_version = parameters?.find((param) => param.name === 'ScriptVersion')?.value;
    if (!base_script_version) return true;

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
    has_new_changelog = new_changelog;
    let optimizer_btn = buttonOptimizerElement();
    if (optimizer_btn) {
        if (new_changelog && !optimizer_btn.classList.contains('mho-new-changelog')) {
            optimizer_btn.classList.add('mho-new-changelog');
        } else if (optimizer_btn.classList.contains('mho-new-changelog')) {
            optimizer_btn.classList.remove('mho-new-changelog');
        }

        let changelog_item = optimizer_btn.querySelector('#version');
        if (changelog_item) {
            if (new_changelog && !changelog_item.classList.contains('mho-new-changelog')) {
                changelog_item.classList.add('mho-new-changelog');
            } else if (!new_changelog && changelog_item.classList.contains('mho-new-changelog')) {
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
        } else if (!new_version && optimizer_btn.classList.contains('mho-new-version')) {
            optimizer_btn.classList.remove('mho-new-version');
        }

        let update_item = optimizer_btn.querySelector('#update');
        if (update_item) {
            if (new_version && !update_item.classList.contains('mho-new-version')) {
                update_item.classList.add('mho-new-version');
            } else if (!new_version && update_item.classList.contains('mho-new-version')) {
                update_item.classList.remove('mho-new-version');
            }

            if (new_version && update_item.parentElement.classList.contains('mho-hidden')) {
                update_item.parentElement.classList.remove('mho-hidden');
            } else if (!new_version && !update_item.parentElement.classList.contains('mho-hidden')) {
                update_item.parentElement.classList.add('mho-hidden');
            }
        }
    }
}

function getOrigin() {
    try {
        GM_info.script;
        return 'script';
    } catch (error) {
        try {
            browser.runtime;
            return 'firerox';
        } catch (error) {
            try {
                chrome.runtime;
                return 'chrome';
            } catch (error) {
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
    } catch (error) {
        try {
            return browser.runtime.getManifest();
        } catch (error) {
            try {
                return chrome.runtime.getManifest();
            } catch (error) {
                console.error(error);
            }
        }
    }

}

function getStorageItem(key) {
    return new Promise((resolve, error) => {
        try {
            GM.getValue(key).then((result) => {
                resolve(result);
            });
        } catch (error) {
            try {
                browser.storage.local.get(key).then((result) => {
                    resolve(result[key]);
                });
            } catch (error) {
                try {
                    chrome.storage.local.get(key).then((result) => {
                        resolve(result[key]);
                    });
                } catch (error) {
                    console.error(error);
                }
            }
        }

    })
}

function setStorageItem(key, value) {
    try {
        return GM.setValue(key, value);
    } catch (error) {
        try {
            const key_value = {};
            key_value[key] = value;
            return browser.storage.local.set(key_value);
        } catch (error) {
            try {
                const key_value = {};
                key_value[key] = value;
                return chrome.storage.local.set(key_value);
            } catch (error) {
                console.error(error);
            }
        }
    }

}

function createNotification(content) {
    try {
        GM_notification(
            {
                text: content,
                title: getScriptInfo().name,
                highlight: true,
                timeout: 0
            }
        );
    } catch (error) {
        try {
            browser.runtime.sendMessage({
                type: 'notifications', content: {
                    type: 'basic',
                    title: getScriptInfo().name,
                    message: content,
                    priority: 1,
                    iconUrl: browser.runtime.getURL('assets/img/logo/logo_mho_64x64_outlined.png')
                }
            });
        } catch (error) {
            try {
                chrome.runtime.sendMessage({
                    type: 'notifications', content: {
                        type: 'basic',
                        title: getScriptInfo().name,
                        message: content,
                        priority: 1,
                        iconUrl: chrome.runtime.getURL('assets/img/logo/logo_mho_64x64_outlined.png'),
                        requireInteraction: true
                    }
                });
            } catch (error) {
                console.error(error);
            }
        }
    }

}

function isTouchScreen() {
    return 'ontouchstart' in window || navigator.msMaxTouchPoints;
}

/** Calcule le nombre de zombies qui vont mourir par désespoir */
function calculateDespairDeaths(nb_killed_zombies) {
    return Math.floor(Math.max(0, (nb_killed_zombies - 1) / 2));
}

function fixMhCompiledImg(img) {
    if (!img) return;
    return img.replace(/\/(\w+)\.(\w+)\.(\w+)/, '/$1.$3')
}

function isValidToken() {
    if (!token || !token.token || !token.token.accessToken) return false;
    let expiration_date = new Date(token.token.validTo).getTime();
    let current_date = new Date().getTime();
    return !shouldRefreshMe() && current_date < expiration_date;
}

function getHoveredItem() {
    let hovered = document.querySelectorAll(':hover');
    let hovered_item_icon = Array.from(hovered).find((hovered_element) => hovered_element.classList.contains('item-icon') || (hovered_element.classList.contains('status') && hovered_element.tagName.toLowerCase() === 'LI'.toLowerCase()));

    let hovered_item_img = hovered_item_icon?.firstElementChild;
    let hovered_item_li = hovered_item_icon?.tagName.toLowerCase() === 'LI'.toLowerCase() ? hovered_item_icon : hovered_item_icon?.parentElement;

    let hovered_item;
    let broken;
    let hovered_status;

    if (hovered_item_img && hovered_item_img.src) {
        hovered_item = getItemFromImg(hovered_item_img.src);
        if (!hovered_item) {
            hovered_status = getStatusFromImg(hovered_item_img.src);
        }
        broken = hovered_item_img.parentElement.parentElement.classList.contains('broken');
    }


//     for (let item of hovered) {
//         let hovered_item_img;
//         if (item.classList.contains('item-icon')) {
//             hovered_item_img = item.firstElementChild;
//             hovered_item_li = item.parentElement;
//         } else if (item.tagName.toLowerCase() === 'SPAN'.toLowerCase() && item.previousElementSibling && item.previousElementSibling.classList.contains('item-icon')) {
//             hovered_item_img = item.previousElementSibling?.firstElementChild;
//             hovered_item_li = item.parentElement;
//         } else if (item.tagName.toLowerCase() === 'LI'.toLowerCase()) {
//             hovered_item_img = item.firstElementChild?.firstElementChild;
//             hovered_item_li = item;
//         }
//         if (hovered_item_img && hovered_item_img.src) {
//             hovered_item = getItemFromImg(hovered_item_img.src);
//             broken = hovered_item_img.parentElement.parentElement.classList.contains('broken');
//         }
//     }
    return {
        item: hovered_item,
        broken: broken,
        li: hovered_item_li,
        status: hovered_status,
        alt: hovered_item_img?.alt
    };
}

function getClickedItem(target) {
    let item_icon = event.target.closest('span.item-icon') || event.target.previousElementSibling?.closest('span.item-icon') || event.target.previousElementSibling?.querySelector('span.item-icon');
    if (item_icon) {
        let hovered_item = getItemFromImg(item_icon.querySelector('img').src);
        let broken = item_icon.parentElement.classList.contains('broken');
        return {item: hovered_item, broken: broken};
    }
}

function getItemFromImg(img_src) {
    if (img_src) {
        let index = img_src.indexOf(hordes_img_url);
        img_src = img_src.slice(index).replace(hordes_img_url, '');
        return items.find((item) => item.img === fixMhCompiledImg(img_src));
    }
}

function getStatusFromImg(img_src) {
    if (img_src) {
        let index = img_src.indexOf(hordes_img_url);
        img_src = img_src.slice(index).replace(hordes_img_url, '');
        return status_list.find((status) => status.img === fixMhCompiledImg(img_src));
    }
}

function initOptionsWithLoginNeeded() {


    displayWishlistInApp();
    displayPriorityOnItems();
    createUpdateExternalToolsButton();
    createExpeditionsBtn();
    setTimeout(() => {
        displayCellDetailsOnPage();
    }, 500)
    displayEstimationsOnWatchtower();
}


function initOptionsWithoutLoginNeeded() {
    /** Gère le bouton de mise à jour des outils externes) */
    if (!buttonOptimizerElement()) {
        setTimeout(() => {
            createOptimizerBtn();
        }, 100)
        createWikiToolsWindow();
    }
    preventFromLeaving();
    alertIfInactiveAndNoEscort();
    clickOnVotedToRedirect();
    displaySearchFields();
    displayMinApOnBuildings();
    setTimeout(() => {
        displayNbDeadZombies();
    }, 250)
    displayTranslateTool();
    displayCampingPredict();
    displayAntiAbuseCounter();
    automaticallyOpenBag();
    addCopyRegistryButton();
    changeDefaultEscortOptions();
    displayGhoulVoracityPercent();
    addExternalLinksToProfiles();
    createDisplayMapButton();
    fillItemsMessages();
    // createStoreNotificationsBtn();
    // addExternalLinksToTowns();
    // blockUsersPosts();
}

function updateFetchRequestOptions(options) {
    const update = {...options};
    update.headers = {
        ...update.headers,
        'Mho-Origin': 'script',
        'Mho-Script-Version': getScriptInfo().version,
    };
    if (isValidToken()) {
        update.headers.Authorization = `Bearer ${token.token.accessToken?.toString()}`;
    } else {
        getToken().then(() => {
            if (isValidToken()) {
                update.headers.Authorization = `Bearer ${token.token.accessToken?.toString()}`;
            }
        })
    }
    return update;
}

function updateFetchRequestOptionsWithoutBearer(options) {
    const update = {...options};
    update.headers = {
        ...update.headers,
        'Mho-Origin': 'script',
        'Mho-Script-Version': getScriptInfo().version,
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
function copyToClipboard(text) {
    let input = document.createElement('textarea');
    input.value = text;

    document.body.appendChild(input);
    input.select();

    document.execCommand('copy');
    input.remove();
}

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
        } else if (!options.classList.contains('hidden')) {
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

/** Create Optimize button */
function createOptimizerBtn() {
    let optimizer_btn = buttonOptimizerElement();
    if (!optimizer_btn) {
        let content_zone = document.getElementById(mh_content_id);
        let header_zone = document.getElementById(mh_header_id);
        let last_header_child = header_zone?.lastChild;
        let mhe_button = document.querySelector('#mhe_button')
        let left_position = last_header_child ? last_header_child.offsetLeft + last_header_child.offsetWidth + 5 : (mhe_button ? mhe_button.offsetLeft + mhe_button.offsetWidth + 5 : document.querySelector('#apps')?.getBoundingClientRect().width + 16);

        let img = document.createElement('img');
        let annuary = document.querySelector('#apps img');
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
        website_link.href = website;
        website_link.target = '_blank';
        website_link.style.cursor = 'pointer';

        title_second_part.appendChild(website_link);

        title_first_part.appendChild(img);
        title_first_part.appendChild(title_hidden);

        optimizer_btn = document.createElement('div');
        optimizer_btn.appendChild(title);
        optimizer_btn.id = btn_id;
        optimizer_btn.setAttribute('style', 'left: ' + left_position + 'px');
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
        } else {
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

/** Crée le contenu du bouton de l'optimizer (bouton de wiki, bouton de configuration, etc) */
function createOptimizerButtonContent() {
    let optimizer_btn = buttonOptimizerElement();
    let content = document.getElementById(content_btn_id);
    content.innerHTML = '';
    optimizer_btn.appendChild(content);

    if (external_app_id) {
        /////////////////////
        // SECTION BOUTONS //
        /////////////////////

        let btn_content = document.createElement('div');
        btn_content.style.display = 'flex';
        btn_content.style.gap = '0.5em';
        btn_content.style.alignItems = 'center';
        content.appendChild(btn_content);

        let wiki_btn = document.createElement('a');
        wiki_btn.classList.add('button');
        wiki_btn.style.marginTop = 0;
        wiki_btn.style.textAlign = 'center';
        wiki_btn.innerText = 'Wiki';
        wiki_btn.id = wiki_btn_id;

        wiki_btn.addEventListener('click', () => {
            displayWindow('wiki');
        });

        btn_content.appendChild(wiki_btn);

        let tools_btn = document.createElement('a');
        tools_btn.classList.add('button');
        tools_btn.style.marginTop = 0;
        tools_btn.style.textAlign = 'center';
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
        toggleNewChangelog(has_new_changelog);
        isScriptVersionLastVersion();

    } else {
        let no_external_app_id = document.createElement('div');
        no_external_app_id.innerHTML = getI18N(texts.external_app_id_help);
        content.appendChild(no_external_app_id);
    }
}

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
        let first_level_checkboxes = Array.from(categories_container.querySelectorAll('input.mho-first-level-param[type=checkbox]:not(:checked)'));
        first_level_checkboxes.forEach((checkbox) => {
            checkbox.click();
        })
        setTimeout(() => {
            let second_level_checkboxes = Array.from(categories_container.querySelectorAll('input.mho-second-level-param[type=checkbox]:not(:checked)'));
            second_level_checkboxes.forEach((checkbox) => {
                checkbox.click();
            })
        })
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
            let param_children = param.children;

            let param_container = document.createElement('li');
            param_container.id = param.id;
            category_content.appendChild(param_container);

            let param_with_help = document.createElement('div');
            param_with_help.style.display = 'flex';
            param_with_help.style.alignItems = 'center';
            param_with_help.style.justifyContent = 'space-between';
            param_container.appendChild(param_with_help);

            let param_input_div = document.createElement('div');
            param_input_div.style.display = 'flex';
            param_input_div.style.alignItems = 'center';
            param_with_help.appendChild(param_input_div);

            let param_input = document.createElement('input');
            param_input.type = 'checkbox';
            param_input.id = param.id + '_input';
            param_input.classList.add('mho-input', 'mho-first-level-param');
            param_input.checked = mho_parameters && mho_parameters[param.id] ? mho_parameters[param.id] : false;
            param_input_div.appendChild(param_input);

            let param_label = document.createElement('label');
            param_label.classList.add('small');
            param_label.htmlFor = window.innerWidth > 1000 ? param.id + '_input' : '';
            param_label.innerText = getI18N(param.label);
            param_input_div.appendChild(param_label);


            if (param.help) {
                let param_help = createHelpButton(getI18N(param.help));
                param_with_help.appendChild(param_help);
            }

            if (param_children && param_children.length > 0) {

                if (param_input.checked) {
                    param_container.classList.add('param-has-children');
                }
                let children_container = document.createElement('ul');
                children_container.style.listStyle = 'none';
                children_container.style.display = 'none';
                param_container.appendChild(children_container);

                if (window.innerWidth > 1000) {
                    children_container.style.width = '300px';
                    children_container.style.padding = '0.25em';
                    children_container.style.position = 'absolute';
                    children_container.style.backgroundColor = '#5c2b20';
                    children_container.style.border = '1px solid #f0d79e';
                    children_container.style.outline = '1px solid #000';

                    param_container.addEventListener('mouseenter', () => {
                        children_container.style.left = buttonOptimizerElement().getBoundingClientRect().width - 7 + 'px';
                        children_container.style.top = param_container.getBoundingClientRect().top - 10 + 'px';
                    });
                } else {
                    children_container.style.paddingLeft = '1em';
                }

                let mousein = false;

                param_container.addEventListener('mouseenter', () => {
                    mousein = true;
                    if (param_input.checked) {
                        children_container.style.display = 'block';
                    }
                });

                param_container.addEventListener('mouseleave', () => {
                    mousein = false;
                    setTimeout(() => {
                        if (!mousein) {
                            children_container.style.display = 'none';
                        }
                    }, 250);
                });

                param_children.forEach((param_child) => {
                    let child_container = document.createElement('li');
                    child_container.id = param_child.id;
                    children_container.appendChild(child_container);

                    let child_with_help = document.createElement('div');
                    child_with_help.style.display = 'flex';
                    child_with_help.style.alignItems = 'center';
                    child_with_help.style.justifyContent = 'space-between';
                    child_container.appendChild(child_with_help);

                    let child_input_div = document.createElement('div');
                    child_input_div.style.display = 'flex';
                    child_input_div.style.alignItems = 'center';
                    child_with_help.appendChild(child_input_div);

                    let child_param_input = document.createElement('input');
                    child_param_input.type = 'checkbox';
                    child_param_input.id = param_child.id + '_input';
                    child_param_input.classList.add('mho-input', 'mho-second-level-param');
                    child_param_input.checked = mho_parameters && mho_parameters[param_child.id] ? mho_parameters[param_child.id] : false;
                    child_input_div.appendChild(child_param_input);

                    let child_param_label = document.createElement('label');
                    child_param_label.classList.add('small');
                    child_param_label.htmlFor = param_child.id + '_input';
                    child_param_label.innerText = getI18N(param_child.label);
                    child_input_div.appendChild(child_param_label);

                    if (param_child.help) {
                        let child_param_help = createHelpButton(getI18N(param_child.help));
                        child_with_help.appendChild(child_param_help);
                    }

                    child_param_input.addEventListener('change', (event) => {
                        let new_params;
                        if (!mho_parameters) {
                            new_params = {};
                        } else {
                            new_params = mho_parameters;
                        }
                        new_params[param_child.id] = event.target.checked;
                        setStorageItem(mho_parameters_key, new_params);
                        getStorageItem(mho_parameters_key).then((saved_params) => {
                            mho_parameters = saved_params;
                        });
                        // Quand on change une option, trigger à nouveau certaines vérifications pour ne pas avoir à les vérifier tout le temps (=> perf !)
                        initOptionsWithLoginNeeded();
                        initOptionsWithoutLoginNeeded();

                    });
                })

            }
            param_input.addEventListener('change', (event) => {
                let new_params;
                if (!mho_parameters) {
                    new_params = {};
                } else {
                    new_params = mho_parameters;
                }
                new_params[param.id] = event.target.checked;

                /** Si l'option a des "enfants" alors on les affiche uniquement si elle est cochée et on coche / décoche les enfants en fonction de la coche du parent */
                if (param_children && param_children.length > 0) {
                    let children_container = param_container.querySelector('ul');
                    param_children.forEach((param_child) => {
                        new_params[param_child.id] = event.target.checked;
                        let child_input = document.querySelector(`#${param_child.id}_input`);
                        child_input.checked = event.target.checked;
                    });
                    if (event.target.checked) {
                        param_container.classList.add('param-has-children');
                        children_container.style.display = 'block';
                    } else {
                        param_container.classList.remove('param-has-children');
                        children_container.style.display = 'none';
                    }
                }

                setStorageItem(mho_parameters_key, new_params);
                getStorageItem(mho_parameters_key).then((saved_params) => {
                    mho_parameters = saved_params;
                });

                // Quand on change une option, trigger à nouveau certaines vérifications pour ne pas avoir à les vérifier tout le temps (=> perf !)
                initOptionsWithLoginNeeded();
                initOptionsWithoutLoginNeeded();
            });
        });

    });
}

function createMhoHeaderSpace() {
    let interval = setInterval(() => {
        let header_space = document.querySelector(`#${mho_header_space_id}`);
        if (!header_space) {
            let postbox = document.getElementById('postbox');
            if (postbox && postbox.clientWidth && postbox.clientWidth > 0) {
                let header_space = document.querySelector(`#${mho_header_space_id}`);
                let mh_header = document.querySelector('#header');

                header_space = document.createElement('div');
                header_space.id = mho_header_space_id;

                header_space.style.position = 'absolute';
                header_space.style.right = `calc(${postbox.clientWidth}px + 10px + 0.5em)`;
                header_space.style.top = postbox.getBoundingClientRect().y + 'px';
                header_space.style.display = 'flex';
                header_space.style.gap = '0.5em';
                header_space.style.alignItems = 'flex-start';
                header_space.style.zIndex = '996';

                mh_header.appendChild(header_space);
            } else {
                clearInterval(interval);
                createMhoHeaderSpace();
            }
        } else {
            clearInterval(interval);
        }
    }, 100);
}

function createWindow(id, full_size) {
    let window = document.querySelector(`#${id}`);
    if (window) return;

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
        }
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
        .filter((tab) => mh_user.townDetails?.townId || !tab.needs_town)
        .sort((a, b) => {
            if (a.ordering > b.ordering) {
                return 1;
            } else if (a.ordering === b.ordering) {
                return 0;
            } else {
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
            if (!tab_li.classList.contains('selected') && tab_content !== '' && tab_content !== undefined && tab_content !== null) {
                for (let li of tabs_ul.children) {
                    li.classList.remove('selected');
                }
                tab_li.classList.add('selected');
            }
            dispatchWikiToolsContent(window_type, tab);
        })

        tabs_ul.appendChild(tab_li);
    })
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
    window_overlay_ul.style.margin = '8px -6px 0 0';
    window_overlay_ul.appendChild(window_overlay_li);

    let window_overlay = document.createElement('div');
    window_overlay.id = mh_optimizer_map_window_id + '-overlay';
    window_overlay.setAttribute('style', 'cursor: move; width: 100%;');

    let window_box = document.createElement('div');
    window_box.id = mh_optimizer_map_window_id + '-box';
    window_box.draggable = true;

    let window = document.createElement('div');
    window.style.minWidth = '150px;'
    window.style.minHeight = '150px;'
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
    }
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
            displayItems(items, tab.id);
            break;
        case 'recipes':
            displayRecipes();
            break;
        case 'skills':
            displaySkills();
            break;
        case 'ruins':
            displayRuins();
            break;
        case 'citizens':
            displayCitizens();
            break;
        case 'bank':
            displayBank(tab.id);
            break;
        case 'wishlist':
            displayWishlist();
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
 * Affiche les éléments présents dans la banque
 * @param {string} tab_id
 */
function displayBank(tab_id) {
    getBank().then((bank) => {
        if (bank) {
            displayItems(bank, tab_id);
        }
    });
}

/** Affiche les éléments présents dans la liste de courses */
function displayWishlist() {
    let tab_content = document.getElementById(mh_optimizer_window_id + '-tab-content');

    let explanation = document.createElement('div');
    explanation.innerText = getI18N(texts.wishlist_moved);
    tab_content.appendChild(explanation);

    let go_to_website = document.createElement('a');
    go_to_website.classList.add('button');
    go_to_website.target = '_blank';
    go_to_website.href = `${website}my-town/wishlist`;
    go_to_website.innerHTML = `<img src="${repo_img_hordes_url}icons/small_world.gif" style="vertical-align: top; margin-right: 0.25em;">${getI18N(texts.go_to_website)}`;
    tab_content.appendChild(go_to_website);
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

    filtered_items.forEach((item, index) => {
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
        item_title_and_add_container.appendChild(item_title_container)

        if ((tab_id === 'bank' || tab_id === 'items') && item.wishListCount === 0 && mh_user.townDetails?.townId) {
            let item_add_to_wishlist = document.createElement('div');
            item_add_to_wishlist.classList.add('add-to-wishlist');
            item_title_and_add_container.appendChild(item_add_to_wishlist);

            let add_to_wishlist_button = document.createElement('button');
            add_to_wishlist_button.classList.add('inline');
            add_to_wishlist_button.addEventListener('click', () => {
                addItemToWishlist(item).then((wishlist) => {
                    item_add_to_wishlist.remove();
                });
            })

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
            item_count.setAttribute('style', 'vertical-align: sub; font-size: 10px;')
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

/** Affiche la liste des citoyens */
function displayCitizens() {
    citizens = undefined;
    getCitizens().then(() => {
        let tab_content = document.getElementById(mh_optimizer_window_id + '-tab-content');
        if (citizens && hero_skills) {
            console.log('heroskills', hero_skills);

            let header_cells = [...table_hero_skills_headers];

            let skills_with_uses = hero_skills
                .filter((skill) => skill.nbUses > 0)
                .map((skill) => {
                    return {id: skill.name, label: skill.label, type: 'td', img: skill.icon}
                });
            console.log('skills_with_uses', skills_with_uses);
            header_cells.push(...skills_with_uses);

            let header_row = document.createElement('tr');
            header_row.classList.add('mho-header');

            header_cells.forEach((header_cell) => {
                let cell = document.createElement('th');
                if (cell.img) {
                    cell.innerHTML = '<img src="' + repo_img_hordes_url + header_cell.img + '.gif"></img>'
                } else {
                    cell.innerText = getI18N(header_cell.label);
                }
                header_row.appendChild(cell);
            });

            let table = document.createElement('table');
            table.classList.add('mho-table');
            table.appendChild(header_row);

            tab_content.appendChild(table);
            for (let citizen_key in citizens.citizens) {
                let citizen = citizens.citizens[citizen_key];
                let citizen_row = document.createElement('tr');
                let is_me = citizen.id === mh_user.id;
                if (is_me) {
                    citizen_row.setAttribute('style', 'background-color: rgba(255, 255, 255, 0.1)');
                }
                table.appendChild(citizen_row);

                header_cells.forEach((header_cell) => {
                    let cell = document.createElement(header_cell.type);
                    if (is_me) {
                        switch (header_cell.id) {
                            case 'name':
                                cell.innerText = citizen[header_cell.id];
                                break;
                            case 'nombreJourHero':
                                var input = document.createElement('input');
                                input.classList.add('mho-input');
                                input.type = 'number';
                                input.value = citizen[header_cell.id]
                                cell.appendChild(input);
                                break;
                            case 'lastSkill':
                                cell.innerText = getI18N(hero_skills.find((skill) => skill.daysNeeded >= citizen.nombreJourHero).label);
                                break;
                            default:
                                console.log(header_cell);
                                break;
                        }
                    } else {
                        switch (header_cell.id) {
                            case 'name':
                            case 'nombreJourHero':
                                cell.innerText = citizen[header_cell.id];
                                break;
                            case 'lastSkill':
                                cell.innerText = getI18N(hero_skills.find((skill) => skill.daysNeeded >= citizen.nombreJourHero).label);
                                break;
                            default:
                                cell.innerText = '';
                                break;
                        }
                    }
                    citizen_row.appendChild(cell);
                });
            }
        }
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
        }

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
        })
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
            } else {
                vest_field.style.display = 'initial';
            }
            calculateCamping(conf);
        })

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
        pro_camper.classList.add('mho-input');
        pro_camper.type = 'checkbox';
        pro_camper.id = 'pro';
        pro_camper.checked = conf.pro;
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
        tomb.classList.add('mho-input');
        tomb.type = 'checkbox';
        tomb.id = 'tomb';
        tomb.checked = conf.tomb;
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
        nb_campings.value = conf.campings;
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
        objects_in_bag.value = conf.objects;
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
            select_ruin.appendChild(ruin_option);
        });
        select_ruin.addEventListener('change', ($event) => {
            conf.ruin = $event.srcElement.value;
            let current_ruin = all_ruins.find((_current_ruin) => +_current_ruin.id === +conf.ruin);

            conf.ruinBonus = current_ruin.camping;
            conf.ruinCapacity = current_ruin.capacity;

            let digs_field = document.querySelector('#digs-field');
            if (current_ruin.id === -1) {
                digs_field.style.display = 'block';
            } else {
                digs_field.style.display = 'none';
                digs_field.querySelector('input').value = 0;
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
        digs.value = conf.ruinBuryCount;
        digs.classList.add('mho-input', 'inline');
        digs.addEventListener('change', ($event) => {
            conf.ruinBuryCount = +$event.srcElement.value;
            calculateCamping(conf);
        })
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
        distance.value = conf.distance;
        distance.classList.add('mho-input', 'inline');
        distance.addEventListener('change', ($event) => {
            conf.distance = +$event.srcElement.value;
            calculateCamping(conf);
        })
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
        zombies.value = conf.zombies;
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
        improve.value = conf.improve;
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
        object_improve.value = conf.objectImprove;
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
        hidden_campers.value = conf.hiddenCampers;
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
        devastaded.classList.add('mho-input');
        devastated.addEventListener('change', ($event) => {
            conf.devastated = $event.srcElement.checked;
            calculateCamping(conf);
        })
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
        })
        phare_div.appendChild(phare);
        phare_div.appendChild(phare_label);


        calculateCamping(conf);
    });
}

/** Affiche la liste des pouvoirs */
function displaySkills() {
    getHeroSkills().then((hero_skills) => {
        let tab_content = document.getElementById(mh_optimizer_window_id + '-tab-content');

        let header_cells = [...table_skills_headers];

        let header_row = document.createElement('tr');
        header_row.classList.add('mho-header');
        header_cells.forEach((header_cell) => {
            let cell = document.createElement('th');
            cell.innerText = getI18N(header_cell.label);
            header_row.appendChild(cell);
        })

        let table = document.createElement('table');
        table.classList.add('mho-table');
        table.appendChild(header_row);
        tab_content.appendChild(table);
        for (let skill_key in hero_skills) {
            let skill = hero_skills[skill_key];
            let skill_row = document.createElement('tr');
            table.appendChild(skill_row);

            header_cells.forEach((header_cell) => {
                let cell = document.createElement(header_cell.type);
                let img = document.createElement('img');
                switch (header_cell.id) {
                    case 'icon':
                        img.src = repo_img_hordes_url + 'heroskill/' + skill[header_cell.id] + '.gif';
                        cell.appendChild(img);
                        break;
                    case 'label':
                    case 'description':
                        cell.setAttribute('style', 'text-align: left');
                        cell.innerText = getI18N(skill[header_cell.id]);
                        break;
                    default:
                        cell.setAttribute('style', 'text-align: center');
                        cell.innerText = skill[header_cell.id];
                        break;
                }
                skill_row.appendChild(cell);
            })
        }
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
            })

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
                })
            });
        }
    });
}

/** Affiche la liste des recettes */
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
    let recipe_container = document.createElement('li');

    let compos_container = document.createElement('ul');
    compos_container.setAttribute('style', 'padding: 0; min-width: 200px; width: 25%;');
    recipe.components.forEach((compo) => {
        let compo_container = document.createElement('li');

        let component_img = document.createElement('img');
        component_img.setAttribute('style', 'margin-right: 0.5em');
        component_img.src = repo_img_hordes_url + fixMhCompiledImg(compo.img);
        compo_container.appendChild(component_img);

        let component_label = document.createElement('span');
        component_label.classList.add('label_text');
        component_label.innerText = getI18N(compo.label);
        compo_container.appendChild(component_label);

        compos_container.appendChild(compo_container);
    })
    recipe_container.appendChild(compos_container);

    let transform_img_container = document.createElement('div');
    recipe_container.appendChild(transform_img_container);


    let transform_img = document.createElement('img');
    transform_img.alt = '=>';
    transform_img.src = repo_img_hordes_url + 'icons/small_move.gif';
    transform_img.setAttribute('style', 'margin-left: 0.5em; margin-right: 0.5em');
    transform_img_container.appendChild(transform_img);

    let results_container = document.createElement('ul');
    results_container.setAttribute('style', 'padding: 0');
    recipe.result.forEach((result) => {
        let result_container = document.createElement('li');

        let result_img = document.createElement('img');
        result_img.setAttribute('style', 'margin-right: 0.5em');
        result_img.src = repo_img_hordes_url + fixMhCompiledImg(result.item?.img);
        result_container.appendChild(result_img);

        let result_label = document.createElement('span');
        result_label.classList.add('label_text');
        result_label.innerText = getI18N(result.item.label);
        result_container.appendChild(result_label);

        if (result.probability !== 1) {
            let result_proba = document.createElement('span');
            result_proba.setAttribute('style', 'font-style: italic; color: #ddab76;');
            result_proba.classList.add('label_text');
            result_proba.innerText = ' (' + Math.round(result.probability * 100) + '%)';
            result_container.appendChild(result_proba);
        }

        results_container.appendChild(result_container);
    })
    recipe_container.appendChild(results_container);
    return recipe_container;
}

/**
 * Crée un bouton d'aide
 * @param {string} text_to_display    Le contenu de la popup d'aide
 */
function createHelpButton(text_to_display) {

    let help_button = document.createElement('a');
    help_button.innerText = getI18N(texts.external_app_id_help_label);
    help_button.classList.add('help-button');

    let help_tooltip = document.createElement('div')
    help_tooltip.classList.add('tooltip', 'help', 'hidden', 'mho');
    help_tooltip.setAttribute('style', `text-transform: initial; display: block; position: absolute; width: 250px;`);
    help_tooltip.innerHTML = text_to_display;
    help_button.appendChild(help_tooltip);

    help_button.addEventListener('mouseenter', function () {
        help_tooltip.style.top = help_button.getBoundingClientRect().top;
        help_tooltip.style.right = help_button.getBoundingClientRect().right;
        help_tooltip.classList.remove('hidden');
    })
    help_button.addEventListener('mouseleave', function () {
        help_tooltip.classList.add('hidden');
    })

    return help_button
}

/** Enregistre les paramètres de l'extension */
function saveParameters() {
    let parameters = document.getElementsByClassName('parameter');
}

/** Affiche le bouton de mise à jour des outils externes */
function createUpdateExternalToolsButton() {

    let tools_to_update = {
        isBigBrothHordes: mho_parameters && !is_mh_beta ? mho_parameters.update_bbh : false,
        isFataMorgana: mho_parameters ? mho_parameters.update_fata : false,
        isGestHordes: mho_parameters ? mho_parameters.update_gh : false,
        isMyHordesOptimizer: mho_parameters ? mho_parameters.update_mho : false
    };

    let nb_tools_to_update = Object.keys(tools_to_update).map((key) => tools_to_update[key]).filter((tool) => tool).length;

    let zone_marker = document.querySelector('#zone-marker');
    let compact_actions_zone = document.querySelector('.actions-box .mdg');

    let update_external_tools_btn = document.getElementById(mh_update_external_tools_id);
    const external_display_zone = zone_marker ? (window.innerWidth < 480 && mho_parameters.show_compact && compact_actions_zone ? document.querySelector('.actions-box .mdg') : zone_marker) : undefined;
    const chest = document.querySelector('.inventory.chest');
    const amelios = document.querySelector('#upgrade_home_level')?.parentElement?.parentElement;

    /** Cette fonction ne doit s'exécuter que si on a un id d'app externe ET au moins l'une des options qui est cochée dans les paramètres ET qu'on est hors de la ville OU dans sa maison */
    if (nb_tools_to_update > 0 && external_app_id && (external_display_zone || (chest && pageIsHouse()) || (amelios && pageIsAmelio()))) {
        if (!update_external_tools_btn) {

            if (window.innerWidth < 480 && mho_parameters.show_compact && compact_actions_zone) {
                let el = external_display_zone || chest?.parentElement || amelios;
                let updater_bloc = createSmallUpdateExternalToolsButton(update_external_tools_btn);
                if (amelios) {
                    el.parentElement.insertBefore(updater_bloc, el.nextElementSibling);
                } else {
                    el.appendChild(updater_bloc);
                }
            } else {
                let el = external_display_zone?.parentElement.parentElement.parentElement || chest?.parentElement || amelios;
                let updater_bloc = createLargeUpdateExternalToolsButton(update_external_tools_btn);
                if (amelios) {
                    el.parentElement.insertBefore(updater_bloc, el.nextElementSibling);
                } else {
                    el.appendChild(updater_bloc);
                }
            }
        }

        let warn_missing_logs = document.getElementById(mho_warn_missing_logs_id);

        if (!warn_missing_logs && document.querySelector('.log-complete-link') && external_display_zone && update_external_tools_btn && mho_parameters.update_mho_digs) {
            if (window.innerWidth < 480 && mho_parameters.show_compact && compact_actions_zone) {
                let external_tools_btn_tooltip = document.querySelector('#external-tools-btn-tooltip');
                warn_missing_logs = document.createElement('div');
                warn_missing_logs.id = mho_warn_missing_logs_id;
                warn_missing_logs.classList.add('note', 'note-important');
                warn_missing_logs.style.fontSize = '10px';
                warn_missing_logs.innerHTML = getI18N(texts.warn_missing_logs_title) + '<br /><br />' + getI18N(texts.warn_missing_logs_help);

                external_tools_btn_tooltip.appendChild(warn_missing_logs);
            } else {
                warn_missing_logs = document.createElement('div');
                warn_missing_logs.id = mho_warn_missing_logs_id;
                warn_missing_logs.classList.add('note', 'note-important');
                warn_missing_logs.innerText = getI18N(texts.warn_missing_logs_title);
                let warn_help = createHelpButton(getI18N(texts.warn_missing_logs_help));
                warn_missing_logs.appendChild(warn_help);

                update_external_tools_btn.parentElement.appendChild(warn_missing_logs);
            }
        } else if (warn_missing_logs && (!document.querySelector('.log-complete-link') || !mho_parameters.update_mho_digs)) {
            warn_missing_logs.remove();
        }
    } else if (update_external_tools_btn && (nb_tools_to_update === 0 || !external_app_id || !(external_display_zone && pageIsHouse()) || !(amelios && pageIsAmelio()))) {
        update_external_tools_btn.parentElement.remove();
    }
}

function createLargeUpdateExternalToolsButton(update_external_tools_btn) {
    let updater_bloc = document.createElement('div');
    updater_bloc.style.marginTop = '1em';
    updater_bloc.style.padding = '0.25em';
    updater_bloc.style.border = '1px solid #ddab76';
    let updater_title = document.createElement('h5');
    updater_title.style.margin = '0 0 0.5em'
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
                if (response.mapResponseDto.bigBrothHordesStatus.toLowerCase() === 'ok') setStorageItem(gm_bbh_updated_key, true);
                if (response.mapResponseDto.gestHordesApiStatus.toLowerCase() === 'ok' || response.mapResponseDto.gestHordesCellsStatus.toLowerCase() === 'ok') setStorageItem(gm_gh_updated_key, true);
                if (response.mapResponseDto.fataMorganaStatus.toLowerCase() === 'ok') setStorageItem(gm_fata_updated_key, true);
                if (response.mapResponseDto.mhoApiStatus.toLowerCase() === 'ok') setStorageItem(gm_mho_updated_key, true);

                let tools_fail = [];
                let response_items = Object.keys(response).map((key) => {
                    return {key: key, value: response[key]}
                });

                response_items.forEach((response_item, index) => {

                    let final = Object.keys(response_item.value).map((key) => {
                        return {key: key, value: response_item.value[key]}
                    });
                    tools_fail = [...tools_fail, ...final.filter((final_item) => !final_item.value || (final_item.value.toLowerCase() !== 'ok' && final_item.value.toLowerCase() !== 'not activated'))];
                    if (index >= response_items.length - 1) {
                        update_external_tools_btn.innerHTML = tools_fail.length === 0
                            ? `<img src="${repo_img_hordes_url}icons/done.png">` + getI18N(texts.update_external_tools_success_btn_label)
                            : `<img src="${repo_img_hordes_url}emotes/warning.gif">${getI18N(texts.update_external_tools_errors_btn_label)}<br>${tools_fail.map((item) => item.key.replace('Status', ` : ${item.value}`)).join('<br>')}`;
                    }
                });

                if (tools_fail.length > 0) {
                    console.error(`Erreur lors de la mise à jour de l'un des outils`, response);
                }
            })
            .catch((e) => {
                update_external_tools_btn.innerHTML = `<img src="${repo_img_hordes_url}professions/death.gif">` + getI18N(texts.update_external_tools_fail_btn_label);
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
    } else {
        external_tools_btn_tooltip.innerHTML = undefined;
    }

    let title = document.createElement('div');
    title.classList.add('title')
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
                if (response.mapResponseDto.bigBrothHordesStatus.toLowerCase() === 'ok') setStorageItem(gm_bbh_updated_key, true);
                if (response.mapResponseDto.gestHordesApiStatus.toLowerCase() === 'ok' || response.mapResponseDto.gestHordesCellsStatus.toLowerCase() === 'ok') setStorageItem(gm_gh_updated_key, true);
                if (response.mapResponseDto.fataMorganaStatus.toLowerCase() === 'ok') setStorageItem(gm_fata_updated_key, true);
                if (response.mapResponseDto.mhoApiStatus.toLowerCase() === 'ok') setStorageItem(gm_mho_updated_key, true);

                let tools_fail = [];
                let response_items = Object.keys(response).map((key) => {
                    return {key: key, value: response[key]}
                });
                response_items.forEach((response_item, index) => {
                    let final = Object.keys(response_item.value).map((key) => {
                        return {key: key, value: response_item.value[key]}
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

/** Si l'option associée est activée, un clic sur le chantier recommandé permet de rediriger vers la ligne du chantier en question */
function clickOnVotedToRedirect() {
    if (mho_parameters.click_on_voted && pageIsConstructions()) {
        let voted_building = document.getElementsByClassName('voted-building')[0];
        if (voted_building) {
            voted_building.setAttribute('style', 'cursor: pointer');
            voted_building.addEventListener('click', () => {
                let voted_row = document.getElementsByClassName('voted')[0];
                voted_row.setAttribute('style', 'scroll-margin: 100px');
                voted_row.scrollIntoView();
            });
        }
    }
}

function displaySearchFields() {
    if (mho_parameters.display_search_fields) {
        displaySearchFieldOnBuildings();
        displaySearchFieldOnRecipientList();
        displaySearchFieldOnRegistry();
        displaySearchFieldOnDump();
        hideCompletedBuildings();
    }
}

/** Si l'option associée est activée, affiche un champ de recherche sur la page de chantiers */
function hideCompletedBuildings() {
    if (mho_parameters.hide_completed_buildings_field && pageIsConstructions()) {
        let buildings = Array.from(document.querySelectorAll('.buildings') || []);

        let building_rows = [];
        buildings.forEach((building) => {
            building_rows.push(...Array.from(building.querySelectorAll('.building')));
        });
        /** Masque les lignes de chantiers devant être masquées */
        building_rows.forEach((building_row) => {
            if (building_row.classList.contains('complete') && !building_row.querySelector('.to_repair')) {
                building_row.classList.add('mho-hidden');
            } else {
                building_row.classList.remove('mho-hidden');
            }
        });

        /** Masque les catégories de chantiers dont toutes les lignes ont été masquées */
        buildings.forEach((building) => {
            if (Array.from(building.children).filter((child) => child.classList.contains('building')).every((child) => child.classList.contains('mho-hidden'))) {
                building.classList.add('mho-hidden');
            } else {
                building.classList.remove('mho-hidden');
            }
        });
    } else if (pageIsConstructions) {
        let buildings = Array.from(document.querySelectorAll('.buildings') || []);
        buildings.forEach((building) => {
            if (building.classList.contains('mho-hidden')) {
                building.classList.remove('mho-hidden');
            }
            Array.from(building.querySelectorAll('.building.mho-hidden')).forEach((building) => {
                building.classList.remove('mho-hidden');
            })
        });
    }
}

/** Si l'option associée est activée, affiche un champ de recherche sur la page de chantiers */
function displaySearchFieldOnBuildings() {
    let fields_container = document.getElementById(mho_search_building_field_id);
    if (mho_parameters.display_search_field_buildings && pageIsConstructions()) {
        if (fields_container) return;

        let tabs = document.querySelector('ul.buildings-tabs');
        if (tabs) {
            let tabs_block = tabs.parentElement;

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
            if (!mho_parameters.display_search_field_buildings) {
                search_field_div.classList.add('hidden');
            }

            let header_mho_img = document.createElement('img');
            header_mho_img.src = mh_optimizer_icon;
            header_mho_img.style.height = '24px';
            header_mho_img.style.position = 'absolute';
            search_field_div.appendChild(header_mho_img);

            let search_field = document.createElement('input');
            search_field.type = 'text';
            search_field.placeholder = getI18N(params_categories.find((category) => category.id === 'display').params.find((param) => param.id === 'display_search_fields').children.find((child) => child.id === 'display_search_field_buildings').label);
            search_field.classList.add('mho-input', 'inline');
            search_field.setAttribute('style', 'min-width: 200px; padding-left: 24px;');
            search_field_div.appendChild(search_field);

            let buildings = Array.from(document.querySelectorAll('.buildings') || []);

            let filterBuildings = () => {
                let building_rows = [];
                buildings.forEach((building) => {
                    building_rows.push(...Array.from(building.querySelectorAll('.building')));
                });
                building_rows.forEach((building_row) => {
                    let force_hide = mho_parameters.hide_completed_buildings_field && building_row.classList.contains('complete');

                    if (force_hide) {
                        building_row.classList.add('hidden');
                    } else if (normalizeString(building_row.querySelector('.building_name').innerText).indexOf(normalizeString(search_field.value)) > -1) {
                        building_row.classList.remove('hidden');
                    } else {
                        building_row.classList.add('hidden');
                    }
                });

                buildings.forEach((building) => {
                    if (Array.from(building.children).filter((child) => child.classList.contains('building')).every((child) => child.classList.contains('hidden'))) {
                        building.classList.add('hidden');
                    } else {
                        building.classList.remove('hidden');
                    }
                });
            };

            search_field.addEventListener('keyup', (event) => {
                filterBuildings();
            });
        }
    } else if (fields_container) {
        fields_container.remove();
    }
}

/** Si l'option associée est activée, affiche un champ de recherche sur la liste des destinataires d'un message */
function displaySearchFieldOnRecipientList() {
    let search_field = document.getElementById(mho_search_recipient_field_id);
    if (mho_parameters.display_search_field_recipients && pageIsMsgReceived()) {
        if (search_field) return;

        let recipients = document.querySelector('#recipient_list');
        if (recipients) {
            let search_field_container = document.createElement('div');

            search_field = document.createElement('input');
            search_field.type = 'text';
            search_field.id = mho_search_recipient_field_id;
            search_field.placeholder = getI18N(params_categories.find((category) => category.id === 'display').params.find((param) => param.id === 'display_search_fields').children.find((child) => child.id === 'display_search_field_recipients').label);
            search_field.classList.add('mho-input', 'inline');
            search_field.setAttribute('style', 'padding-left: 24px; margin-bottom: 0.25em;');

            search_field.addEventListener('keyup', (event) => {
                let recipients_list = Array.from(document.querySelectorAll('.recipient.link') || []);
                recipients_list.forEach((recipient) => {
                    if (normalizeString(recipient.innerText).indexOf(normalizeString(search_field.value)) > -1) {
                        recipient.classList.remove('hidden');
                    } else {
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
    } else if (search_field) {
        search_field.parentElement.remove();
    }
}


/** Si l'option associée est activée, affiche un champ de recherche sur la page de la décharge */
function displaySearchFieldOnDump() {
    let search_field = document.getElementById(mho_search_dump_field_id);
    if (mho_parameters.display_search_field_dump && pageIsDump()) {
        if (search_field) return;

        let main_content = document.querySelector('.town-main-content');
        if (main_content) {
            let table = main_content.querySelector('.row-table');
            if (table) {
                let filterFunction = (name_search_field, can_be_dump_field, can_be_recovered_field) => {
                    let items_list = Array.from(table.querySelectorAll('.row:not(.header)') || []);
                    items_list.forEach((item) => {
                        let item_label = item.querySelector('span.icon img');
                        let item_counts = item_label.parentElement.parentElement.nextElementSibling.querySelector('span')?.innerHTML.split('<br>');
                        let item_bank_count = +item_counts[0].replace(/\D*/, '');
                        let item_dump_count = +item_counts[1].replace(/\D*/, '');

                        let is_search_in_string = normalizeString(item_label.getAttribute('alt')).indexOf(normalizeString(name_search_field.value)) > -1;
                        let can_be_recovered = can_be_recovered_field.checked && item_dump_count > 0;
                        let can_be_dump = can_be_dump_field.checked && item_bank_count > 0;

                        if (is_search_in_string && (can_be_dump || can_be_recovered)) {
                            item.classList.remove('hidden');
                        } else {
                            item.classList.add('hidden');
                        }
                    });
                }

                let search_field_container = document.createElement('div');
                search_field_container.setAttribute('style', ' display: flex; flex-wrap: wrap; gap: 0.5em;');
                search_field_container.id = mho_search_dump_field_id;

                search_field = document.createElement('input');
                search_field.type = 'text';
                search_field.placeholder = getI18N(params_categories.find((category) => category.id === 'display').params.find((param) => param.id === 'display_search_fields').children.find((child) => child.id === 'display_search_field_dump').label);
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
    } else if (search_field) {
        search_field.parentElement.remove();
    }
}

/** Si l'option associée est activée, affiche un champ de recherche sur le registre */
function displaySearchFieldOnRegistry() {
    let search_field = document.getElementById(mho_search_registry_field_id);
    if (mho_parameters.display_search_field_registry) {

        if (search_field) return;

        let logs = document.querySelector('hordes-log');

        if (logs) {
            let search_field_container = document.createElement('div');
            let logs_title = logs.parentElement.previousElementSibling;

            search_field = document.createElement('input');
            search_field.type = 'text';
            search_field.id = mho_search_registry_field_id;
            search_field.classList.add('mho-input');
            search_field.placeholder = getI18N(params_categories.find((category) => category.id === 'display').params.find((param) => param.id === 'display_search_fields').children.find((child) => child.id === 'display_search_field_registry').label);
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

                    header_mho_img.style.left = 0;
                } else {
                    search_field_container.style.display = 'flex';
                    search_field_container.style.justifyContent = 'center';

                    header_mho_img.style.left = '4px';
                }

                logs_title.appendChild(search_field_container)


                search_field.addEventListener('keyup', (event) => {
                    let logs_list = Array.from(document.querySelectorAll('.log-entry .log-part-content') || []);
                    logs_list.forEach((log) => {
                        if (normalizeString(log.innerText).indexOf(normalizeString(search_field.value)) > -1) {
                            log.parentElement.classList.remove('hidden');
                        } else {
                            log.parentElement.classList.add('hidden');
                        }
                    });
                });
            }
        }
    } else if (search_field) {
        search_field.parentElement.remove();
    }
}

/** Si l'option associée est activée, affiche le nombre de pa nécessaires pour réparer un bâtiment suffisemment pour qu'il ne soit pas détruit lors de l'attaque */
function displayMinApOnBuildings() {

    tooltips_observer?.disconnect();
    if (mho_parameters.display_missing_ap_for_buildings_to_be_safe && pageIsConstructions()) {
        let complete_buildings = document.querySelectorAll('.building.complete');
        if (!complete_buildings || complete_buildings.length === 0) return;

        ///////////////////////// Observe les modifications sur les tooltips pour mieux alimenter les barres /////////////////////////
        // Selectionne le noeud dont les mutations seront observées
        let tooltip_container = document.querySelector('#tooltip_container');
        // Options de l'observateur (quelles sont les mutations à observer)
        let config = {childList: true, subtree: true};

        // Fonction callback à éxécuter quand une mutation est observée
        let callback = function (mutationsList) {
            if (mho_parameters.display_missing_ap_for_buildings_to_be_safe && pageIsConstructions()) {
                let broken_buildings = Array.from(complete_buildings).filter((complete_building) => complete_building.querySelector('.to_repair'));

                if (!broken_buildings || broken_buildings.length === 0) return;

                broken_buildings.forEach((broken_building) => {
                    let bar_element = broken_building.querySelector('.ap-bar');
                    let nb_ap_element = broken_building.querySelector('.build-req');

                    bar_element.dispatchEvent(new Event('mouseenter'));
                    let tooltip = new Object(document.querySelector('.tooltip:not(.mho)[style*="display: block"]'));
                    bar_element.dispatchEvent(new Event('mouseleave'));

                    if (!tooltip || !tooltip.innerHTML) return;


                    let tooltip_status_match = tooltip.innerText.match(/[0-9]+\/[0-9]+/);
                    if (!tooltip_status_match || tooltip_status_match.length <= 0) return;
                    let building_status = tooltip_status_match[0]?.split('/');

                    let tooltip_match = tooltip.innerHTML.match(/<b>[0-9]+<\/b>/);
                    if (!tooltip_match || tooltip_match.length <= 0) return;

                    let nb_pts_per_ap = parseInt(tooltip_match[0].match(/[0-9]+/)[0], 10);
                    let current_pv = parseInt(building_status[0], 10);
                    let total_pv = parseInt(building_status[1], 10);

                    let minimum_safe = Math.ceil(total_pv * 70 / 100) + 1
                    if (minimum_safe <= current_pv) return;

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
                        missing_ap_info = document.createElement('span')
                        missing_ap_info.classList.add('mho-missing-ap');
                    }
                    missing_ap_info.style.fontWeight = 'initial';
                    missing_ap_info.style.fontSize = '0.8em';
                    missing_ap_info.style.overflow = 'hidden';
                    missing_ap_info.style.textOverflow = 'ellipsis';
                    missing_ap_info.innerText = getI18N(texts.missing_ap_explanation).replace('%VAR%', Math.ceil(missing_pts / nb_pts_per_ap));
                    nb_ap_element.appendChild(missing_ap_info);
                });
            } else {
                tooltips_observer?.disconnect();
            }
        };

        // Créé une instance de l'observateur lié à la fonction de callback
        tooltips_observer = new MutationObserver(callback);
        // Commence à observer le noeud cible pour les mutations précédemment configurées
        tooltips_observer.observe(tooltip_container, config);

        ////////////////////////////////////////////////////////


    } else if (pageIsConstructions()) {
        let missing_ap_infos = document.querySelectorAll('.mho-missing-ap');
        if (!missing_ap_infos) return;
        Array.from(missing_ap_infos).forEach((missing_ap_info) => missing_ap_info.remove())

        let mho_safe_aps = document.querySelectorAll('.mho-safe-ap');
        if (!mho_safe_aps) return;
        Array.from(mho_safe_aps).forEach((mho_safe_ap) => mho_safe_ap.remove());
    }
}

/** Affiche la liste de courses dans le désert et l'atelier */
function displayWishlistInApp() {
    let wishlist_section = document.getElementById('wishlist-section');

    let is_desert = pageIsDesert();
    let is_workshop = pageIsWorkshop();
    if (wishlist && mho_parameters.display_wishlist && (is_workshop || is_desert)) {
        if (wishlist_section) return;

        let zone_to_insert;
        if (is_workshop) {
            zone_to_insert = document.getElementsByClassName('row-table')[0];
        } else {
            zone_to_insert = document.getElementsByClassName('actions-box')[0];
        }

        if (!zone_to_insert) return;

        let used_wishlist = getWishlistForZone();

        if (!used_wishlist) return;

        let list_to_display = used_wishlist.filter((item) => {
            if (is_workshop) {
                return item.isWorkshop;
            } else {
                let items_in_cell = Array.from(document.querySelectorAll('.inventory li.item img')).map((item_element) => getItemFromImg(item_element.src));
                return items_in_cell.some((item_in_cell) => item_in_cell?.id === item.item.id);
            }
        });

        if (is_workshop && list_to_display.length === 0) return;

        let refreshWishlist = () => {
            let update_section = document.createElement('div');
            header.appendChild(update_section);

            let last_update = document.createElement('span');
            last_update.classList.add('small');
            last_update.setAttribute('style', 'margin-right: 0.5em;');
            if (wishlist.lastUpdateInfo) {
                last_update.innerText = new Intl.DateTimeFormat('default', {
                    dateStyle: 'medium',
                    timeStyle: 'medium'
                }).format(new Date(wishlist.lastUpdateInfo.updateTime)) + ' - ' + wishlist.lastUpdateInfo.userName;
            }
            update_section.appendChild(last_update);

            let update_btn = document.createElement('button');
            update_btn.classList.add('inline');
            update_btn.innerText = getI18N(texts.update);
            update_btn.addEventListener('click', () => {
                is_refresh_wishlist = true;
                wishlist = undefined;
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
                    title.innerHTML = `<img src="${repo_img_hordes_url + item.item.img}" class="priority_${item.priority_main}"  style="margin-right: 5px" /><span class="small">${getI18N(item.item.label)}</span>`;
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


            if (!is_refresh_wishlist) {
                hide_state.innerText = '>';
                header_title.show = false;

                list.classList.add('hidden');
                update_section.classList.add('hidden');
            } else {
                hide_state.innerText = '˅';
                header_title.show = true;
            }
            header_title.addEventListener('click', () => {
                if (header_title.show) {
                    hide_state.innerText = '>';
                } else {
                    hide_state.innerText = '˅';
                }
                list.classList.toggle('hidden');
                update_section.classList.toggle('hidden');
                header_title.show = !header_title.show;
            });
            is_refresh_wishlist = false
            displayWishlistInApp();
        };

        wishlist_section = document.createElement('div');
        wishlist_section.id = 'wishlist-section';
        wishlist_section.classList.add('row');

        if (pageIsWorkshop()) {
            zone_to_insert.parentNode.insertBefore(wishlist_section, zone_to_insert.nextSibling);
        } else {
            let main_actions = zone_to_insert.parentNode;
            main_actions.parentNode.insertBefore(wishlist_section, main_actions.nextSibling);
        }

        let cell = document.createElement('div');
        wishlist_section.appendChild(cell);

        let header = document.createElement('h5');
        header.setAttribute('style', 'display: flex; justify-content: space-between;');
        cell.appendChild(header);

        let header_title = document.createElement('span');
        header_title.setAttribute('style', 'margin-top: 7px; cursor: pointer;')
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
        header_label.innerText = getI18N(tabs_list.tools.find((tool) => tool.id === 'wishlist').label);
        header_title.appendChild(header_label);

        let content = document.createElement('div');
        cell.appendChild(content);

        refreshWishlist();
    } else if (wishlist_section) {
        wishlist_section.remove();
    }
}

/** Affiche la priorité directement sur les éléments si l'option associée est cochée */
function displayPriorityOnItems() {
    if (mho_parameters.display_wishlist && pageIsDesert() && wishlist) {
        let present_items = [];
        let empty_spaces = [];
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
                empty_spaces.push(...rucksack?.querySelectorAll('li.free') || []);
                used_spaces.push(...rucksack?.querySelectorAll('li.item:not(.locked):not(.plus)') || []);
            }
        }

        let used_wishlist = getWishlistForZone();
        let item_count = used_spaces.length + empty_spaces.length;

        if (used_wishlist) {
            let count = 0;
            used_wishlist
                .filter((wishlist_item) => wishlist_item.priority !== 0)
                .forEach((wishlist_item) => {
                    present_items
                        .filter((present_item) => fixMhCompiledImg(present_item.querySelector('img').src).indexOf(wishlist_item.item.img) > 0)
                        .forEach((present_item) => {
                            if (wishlist_item.priority_main > 0) {
                                if (count < item_count) {
                                    present_item.classList.add('priority_in');
                                } else {
                                    present_item.classList.add('priority_out');
                                }
                            } else {
                                present_item.classList.add('priority_trash');
                            }
                            count += 1;
                        });
                });
        }
    }
}

function getWishlistForZone() {

    if (!wishlist || !wishlist.wishList) return undefined;
    if (!pageIsDesert()) return wishlist.wishList[0];

    let position = getCurrentPosition() || 0;
    let current_zone = (Math.abs(position[0]) + Math.abs(position[1])) * 2 - 3;
    let zones = Object.keys(wishlist.wishList)
        .map((zone) => +zone)
        .filter((zone) => zone > current_zone && zone !== 0);
    zones = zones
        .sort((zone_a, zone_b) => zone_a - zone_b);

    let used_wishlist = zones.length === 0 ? wishlist.wishList[0] : wishlist.wishList[zones[0]];
    used_wishlist?.sort((item_a, item_b) => {
        return item_b.priority - item_a.priority;
    });
    return used_wishlist;
}

let hovered_tooltip_x_item_id;

/** Affiche les tooltips avancés */
function displayAdvancedTooltips() {
    if (mho_parameters.enhanced_tooltips && items) {

        let tooltip_containers = document.querySelectorAll(`.tooltip.item[style*="display: block"]`);
        if (!tooltip_containers || tooltip_containers.length === 0) return;

        let hovered = getHoveredItem();
        let hovered_item = hovered.item;
        let hovered_status = hovered.status;

        if (!hovered_item && !hovered_status) return;

        let tooltip_container = Array.from(tooltip_containers).find((container) => hovered_item ? getItemFromImg(container.querySelector('h1 img')?.src)?.id === hovered_item.id : container.querySelector('h1')?.innerText === hovered.alt);

        if (!tooltip_container) return;

        let advanced_tooltip_container = tooltip_container.querySelector('#mho-advanced-tooltip');

        if (hovered_item) {

            let hovered_item_x_item_id = hovered.li.getAttribute('x-item-id');
            if (!hovered_tooltip_x_item_id && hovered_item?.recipes?.length > 0) {
                let tooltip_loading = tooltip_container.querySelector('.mho-tooltip-loading');
                if (!tooltip_loading) {
                    tooltip_loading = document.createElement('img');
                    tooltip_loading.classList.add('mho-tooltip-loading');
                    tooltip_loading.style.position = 'absolute';
                    tooltip_loading.style.left = '8px';
                    tooltip_loading.style.top = '0';
                    tooltip_container.querySelector('h1').appendChild(tooltip_loading);
                    tooltip_loading.src = `${repo_img_hordes_url}anims/loading_wheel.gif`;
                } else {
                    tooltip_loading.style.display = 'inline';
                }
                let timeout = setTimeout(() => {
                    if (hovered_tooltip_x_item_id && hovered_tooltip_x_item_id === hovered_item_x_item_id) return;
                    tooltip_loading.style.display = 'none';

                    // Remove opened tooltips
                    let current_tooltips_containers = document.querySelectorAll('.tooltip.item[style*="display: block"]');
                    Array.from(tooltip_containers).forEach((container) => {
                        if (getItemFromImg(container.querySelector('h1 img')?.src)?.id !== hovered_item.id) {
                            container.style.display = 'none';
                        }
                    });

                    const controller = new AbortController();
                    hovered_tooltip_x_item_id = hovered_item_x_item_id;
                    tooltip_container.style.pointerEvents = 'all';
                    hovered.li.addEventListener('mouseleave', function (event) {
                        event.stopImmediatePropagation();
                    }, true, {signal: controller.signal});
                    hovered.li.addEventListener('pointerleave', function (event) {
                        event.stopImmediatePropagation();
                    }, true, {signal: controller.signal});

                    let cancelHover = () => {
                        hovered_tooltip_x_item_id = undefined;
                        controller.abort();
                        tooltip_container.style.display = 'none';
                        tooltip_container.style.pointerEvents = 'none';
                        clearTimeout(timeout);
                    }
                    hovered.li.addEventListener('mouseout', (event) => {
                        setTimeout(() => {
                            if (!hovered_tooltip_x_item_id) return;
                            let all_hovered = document.querySelectorAll(':hover');
                            if (!Array.from(all_hovered).some((hovered_element) => hovered_element.classList.contains('tooltip') || hovered_element.getAttribute('x-item-id') === hovered_tooltip_x_item_id)) {
                                cancelHover();
                            }
                        }, 1000)
                    }, true, {signal: controller.signal});
                    tooltip_container.addEventListener('mouseleave', (event) => {
                        cancelHover();
                    }, {signal: controller.signal});
                    tooltip_container.addEventListener('pointerleave', (event) => {
                        cancelHover();
                    }, {signal: controller.signal});
                }, 1000);
            }

            let item_deco = tooltip_container.getElementsByClassName('item-tag-deco')[0];
            let should_display_advanced_tooltip = hovered_item.recipes.length > 0 || hovered_item.actions || hovered_item.properties || (item_deco && hovered_item.deco > 0);

            if (should_display_advanced_tooltip) {

                if (!advanced_tooltip_container) {
                    advanced_tooltip_container = document.createElement('div');
                    advanced_tooltip_container.id = 'mho-advanced-tooltip';
                    advanced_tooltip_container.setAttribute('style', 'margin-top: 0.5em; border-top: 1px solid;');

                    tooltip_container.appendChild(advanced_tooltip_container);
                } else if (!advanced_tooltip_container.innerHTML) {
                    createAdvancedProperties(advanced_tooltip_container, hovered_item, tooltip_container);
                }
            }
        } else {
            let item_deco = tooltip_container.getElementsByClassName('item-tag-deco')[0];
            let should_display_advanced_tooltip = hovered_status.watch_def !== undefined || hovered_status.watch_kills !== undefined;

            if (should_display_advanced_tooltip) {

                if (!advanced_tooltip_container) {
                    advanced_tooltip_container = document.createElement('div');
                    advanced_tooltip_container.id = 'mho-advanced-tooltip';
                    advanced_tooltip_container.setAttribute('style', 'margin-top: 0.5em; border-top: 1px solid;');

                    tooltip_container.appendChild(advanced_tooltip_container);
                } else if (!advanced_tooltip_container.innerHTML) {
                    createAdvancedPropertiesStatus(advanced_tooltip_container, hovered_status, tooltip_container);
                }
            }


        }
    }

}

function createAdvancedProperties(content, item, tooltip) {
    let item_deco;
    if (tooltip) {
        item_deco = tooltip.getElementsByClassName('item-tag-deco')[0];
    }
    content.innerHtml = '';
    if (tooltip) {
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
        let item_in_wishlist = wishlist_for_zone?.find((item_in_wishlist_for_zone) => item.id === item_in_wishlist_for_zone.item.id);

        if (item_in_wishlist && item_in_wishlist.item.wishListCount && item_in_wishlist.item.wishListCount > 0) {
            let wishlist_wanted_div = document.createElement('div');
            wishlist_wanted_div.style.width = 'calc(50% - 0.5em)';
            stock_div.appendChild(wishlist_wanted_div);
            wishlist_wanted_div.innerText = getI18N(wishlist_headers[5].label) + ' : ' + item_in_wishlist.item.wishListCount;

            let wishlist_depot_div = document.createElement('div');
            wishlist_depot_div.style.width = 'calc(50% - 0.5em)';
            stock_div.appendChild(wishlist_depot_div);
            wishlist_depot_div.innerText = getI18N(wishlist_headers[2].label) + ' : ' + getI18N(wishlist_depot.find((depot) => item_in_wishlist.depot === depot.value).label);
        }
    }
    if ((!item_deco || item.deco === 0) && !item.properties && !item.actions && item.recipes.length === 0) return;

    if (tooltip) {
        // console.log('hovered_item', item);
    }
    if (item_deco && item.deco > 0) {
        let text = item_deco.innerText.replace(/ \(.*\)*/, '');
        item_deco.innerHTML = `<span>${text} <em>( +${item.deco} )</em></span>`;
    }

    if (!item.properties && !item.actions && item.recipes.length === 0) return;

    if (item.properties) {
        let item_properties = document.createElement('div');
        content.appendChild(item_properties);
        item.properties.forEach((property) => {
            let item_action = displayPropertiesOrActions(property, item);
            item_properties.appendChild(item_action);
        });
    }

    if (!item.actions && item.recipes.length === 0) return;

    if (item.actions) {
        let item_actions = document.createElement('div');
        content.appendChild(item_actions);
        item.actions.forEach((action) => {
            let item_action = displayPropertiesOrActions(action, item);
            item_actions.appendChild(item_action);
        });
    }

    if (item.recipes.length === 0) return;

    if (item.recipes.length > 0) {
        if (tooltip) {
            tooltip.classList.add('large-tooltip');
        }
        let item_recipes = document.createElement('div');
        item_recipes.classList.add('recipe');
        item_recipes.style.maxHeight = '250px';
        item_recipes.style.overflowY = 'auto';
        item_recipes.style.pointerEvents = 'all';
        content.appendChild(item_recipes);

        item.recipes.forEach((recipe) => {
            item_recipes.appendChild(getRecipeElement(recipe));
        });
    }
}

/** Affiche les propriétés ou les actions associées à l'objet survolé */
function displayPropertiesOrActions(property_or_action, hovered_item) {
    let item_action = document.createElement('div');
    // TODO MAPPING BACK
    item_action.classList.add('item-tag');
    switch (property_or_action) {
        case 'eat_6ap':
        case 'eat_7ap':
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
            item_action.innerHTML = `<img src="${repo_img_hordes_url}emotes/death.gif">`;
            break;
        case 'hero_find':
            if (!(hovered_item.properties && hovered_item.properties.some((property) => property === 'hero_find_lucky')) && !(hovered_item.actions && hovered_item.actions.some((property) => property === 'hero_find_lucky'))) {
                item_action.classList.add(`item-tag-hero`);
                item_action.innerText = `Trouvaille`;
            } else {
                item_action.classList.remove('item-tag');
            }
            break;
        case 'hero_find_lucky':
            item_action.classList.add(`item-tag-hero`);
            item_action.innerText = `Trouvaille améliorée`;
            break;
        case 'ressource':
            item_action.innerText = `Ressource`;
            break;
        case 'flash_photo_1':
            item_action.classList.add(`mho-item-tag-large`);
            var fail_1 = Math.round(60 / 90 * 100);
            item_action.innerText = `${100 - fail_1}% de chances de pouvoir fuir pendant 30 secondes`;
            break;
        case 'flash_photo_2':
            item_action.classList.add(`mho-item-tag-large`);
            var fail_2 = Math.round(30 / 90 * 100);
            item_action.innerText = `${100 - fail_2}% de chances de pouvoir fuir pendant 60 secondes`;
            break;
        case 'flash_photo_3':
            item_action.classList.add(`mho-item-tag-large`);
            var fail_3 = 1;
            item_action.innerText = `Succès : ${100 - fail_3}% de chances de pouvoir fuir pendant 120 secondes`;
            break;
        case 'can_cook':
            item_action.innerText = `Peut être cuisiné`;
            break;
        case 'pet':
            item_action.innerText = `Animal`;
            break;
        case 'can_poison':
            item_action.innerText = `Peut être empoisonné`;
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
            item_action.innerHTML = `Efface les entrées du registre (-3 minutes)<br />Dissimule votre prochaine entrée (+1 minute)`
            break;
        case 'improve':
            item_action.innerText = `Permet d'aménager un campement`
            break;
        case 'defence':
            // déjà affichés par le jeu
            item_action.classList.remove('item-tag');
            break;
        case 'drug_6ap_2':
        case 'drug_8ap_2':
            // ne pas afficher
            item_action.classList.remove('item-tag');
            break;
        case 'hero_surv_1':
            if (mh_user.townDetails) {
                var days = mh_user.townDetails?.day;
                var devastated = mh_user.townDetails?.isDevaste;
                var chances = 1;
                if (days >= 20) {
                    chances = 0.50;
                } else if (days >= 15) {
                    chances = 0.60;
                } else if (days >= 13) {
                    chances = 0.70;
                } else if (days >= 10) {
                    chances = 0.80;
                } else if (days >= 5) {
                    chances = 0.85;
                }
                if (devastated) chances = Math.max(0.1, chances - 0.2);
                var success = chances * 100;
                item_action.innerText = `${success}% de chances de réussir son manuel`;
            } else {
                item_action.classList.remove('item-tag');
            }
            break;
        case 'hero_surv_2':
            // ne pas afficher
            item_action.classList.remove('item-tag');
            break;
        case 'prevent_night':
            item_action.innerText = `Malus de nuit divisé par 4`;
            break;
        case 'box_opener':
        case 'can_opener':
        case 'parcel_opener':
        case 'impoundable':
        case 'nw_ikea':
        case 'nw_armory':
        case 'food':
        case 'weapon':
        case 'drug':
        case 'nw_trebuchet':
        case 'esc_fixed':
        case 'slaughter_2xs':
        case 'throw_animal_cat':
        case 'throw_animal_tekel':
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
            item_action.classList.remove('item-tag');
            break;
        case 'deco':
        case 'single_use':
            /** Déjà géré par MH */
            item_action.classList.remove('item-tag');
            break;
        case null:
            item_action.classList.remove('item-tag');
            break;
        default:
            console.log(property_or_action);
            break;
    }
    return item_action;
}

function createAdvancedPropertiesStatus(content, status, tooltip) {
    content.innerHtml = '';
    let status_details = document.createElement('div');
    content.appendChild(status_details);

    let have_properties = status.properties && status.properties.length > 0;

    if (status.pdc === undefined && status.watch_def === undefined && status.watch_kills === undefined && status.searches === undefined && !have_properties) return;

    if (status.pdc !== undefined) {
        let status_detail = document.createElement('div');
        status_detail.classList.add('item-tag');
        status_detail.innerHTML = `${status.pdc} ${status.pdc > 1 || status.pdc < -1 ? 'points' : 'point'} de contrôle ${status.pdc > 1 || status.pdc < -1 ? 'supplémentaires' : 'supplémentaire'}`;
        status_details.appendChild(status_detail);
    }

    if (status.watch_def === undefined && status.watch_kills === undefined && status.searches === undefined && !have_properties) return;

    if (status.watch_def !== undefined) {
        let status_detail = document.createElement('div');
        status_detail.classList.add('item-tag');
        status_detail.innerHTML = `${getI18N(status_texts.zombies_killed)} : ${status.watch_def}`;
        status_details.appendChild(status_detail);
    }

    if (status.watch_kills === undefined && status.searches === undefined && !have_properties) return;

    if (status.watch_kills !== undefined) {
        let status_detail = document.createElement('div');
        status_detail.classList.add('item-tag');
        status_detail.innerHTML = `${getI18N(status_texts.watch_survival_chances)} : ${status.watch_kills < 0 ? status.watch_kills * 100 : '+' + status.watch_kills * 100}%`;
        status_details.appendChild(status_detail);
    }

    if (status.searches === undefined && !have_properties) return;

    if (status.searches !== undefined) {
        let status_detail = document.createElement('div');
        status_detail.classList.add('item-tag');
        status_detail.innerHTML = `${getI18N(status_texts.success_digs_changes)} : ${status.searches}`;
        status_details.appendChild(status_detail);
    }
    if (!have_properties) return;

    if (have_properties) {
        status.properties.forEach((property) => {
            let status_property = displayStatusProperties(property, status);
            status_details.appendChild(status_property);
        });
    }
}

function displayStatusProperties(status_properties, hovered_item) {
    let item_action = document.createElement('div');
    item_action.classList.add('item-tag');
    switch (status_properties) {
        case 'head_wounded':
            item_action.innerText = getI18N(status_texts.head_wounded);
            break;
        case 'hand_wounded':
            item_action.innerText = getI18N(status_texts.hand_wounded);
            break;
        case 'arm_wounded':
            item_action.innerText = getI18N(status_texts.arm_wounded);
            break;
        case 'leg_wounded':
            item_action.innerText = getI18N(status_texts.leg_wounded);
            break;
        case null:
            item_action.classList.remove('item-tag');
            break;
        default:
            console.log(status_properties);
            break;
    }
}

function createDisplayMapButton() {
    let display_map_btn = document.getElementById(mho_display_map_id);

    if (mho_parameters.display_map) {
        const mho_header_space = document.getElementById(mho_header_space_id);
        if (display_map_btn || !mho_header_space) return;

        let btn_container = document.createElement('div');
        btn_container.id = mho_display_map_id;

        let postbox_img = document.querySelector('#postbox img');

        let btn_mho_img = document.createElement('img');
        btn_mho_img.src = mh_optimizer_icon;
        btn_mho_img.style.height = postbox_img && postbox_img.height ? postbox_img.height + 'px' : '16px';
        btn_container.appendChild(btn_mho_img);

        let btn_img = document.createElement('img');
        btn_img.src = repo_img_hordes_url + 'emotes/explo.gif';
        btn_img.style.height = postbox_img && postbox_img.height ? postbox_img.height + 'px' : '16px';
        btn_container.appendChild(btn_img);

        btn_container.addEventListener('click', (event) => {
            event.stopPropagation();
            event.preventDefault();
            displayMapContent();
        });

        mho_header_space.appendChild(btn_container);

        createMapWindow();
    } else if (display_map_btn) {
        display_map_btn.remove();
    }
}

function displayMapContent() {
    let map_window = document.getElementById(mh_optimizer_map_window_id);
    map_window.classList.add('visible');
    displayMap();
}

function displayMap() {
    let content = document.getElementById(mh_optimizer_map_window_id + '-content');
    let table = content.querySelector('table');
    if (table) {
        table.outerHTML = '';
    }

    let transformMapping = (map) => {
        table = document.createElement('table');
        table.setAttribute('style', 'border-collapse: collapse;');
        table.classList.add('mho-map');
        let init_col_tr = document.createElement('tr');
        table.appendChild(init_col_tr);

        map.vertical_mapping.forEach((cell) => {
            let td = document.createElement('td');
            td.innerText = cell;
            td.classList.add('around-map');
            init_col_tr.appendChild(td);
        });

        map.map.forEach((row) => {
            let tr = document.createElement('tr');
            row.forEach((cell, cell_index) => {
                if (cell_index === 0) {
                    let init_row_td = document.createElement('td');
                    init_row_td.innerText = cell.horizontal;
                    init_row_td.classList.add('around-map');
                    tr.appendChild(init_row_td);
                }
                let td = document.createElement('td');
                tr.appendChild(td);

                let td_content = document.createElement('div');
                td_content.style.position = 'relative';
                td_content.style.height = '100%';
                td_content.style.width = '100%';
                td.appendChild(td_content);

                if (cell.not_yet_visited) {
                    td.style.backgroundColor = '#0f1717';
                } else if (cell.not_visited_today) {
                    td.style.backgroundColor = 'darkslategray';
                } else {
                    if (+cell.zombies === 1) {
                        td.style.backgroundColor = 'goldenrod';
                    } else if (+cell.zombies === 2) {
                        td.style.backgroundColor = 'chocolate';
                    } else if (+cell.zombies >= 3) {
                        td.style.backgroundColor = 'firebrick';
                    } else {
                        td.style.backgroundColor = 'green';
                    }
                }


                if (cell.town) {
                    let town_here = document.createElement('div');
                    town_here.innerText = '🏠';
                    town_here.style.position = 'absolute';
                    town_here.style.inset = 'calc(50% - 11px)';

                    td_content.appendChild(town_here);
                }
                if (cell.bat) {
                    let bat_here = document.createElement('div');
                    bat_here.style.backgroundColor = 'grey';
                    bat_here.style.position = 'absolute';
                    bat_here.style.inset = '4px';

                    if (cell.ruin) {
                        bat_here.innerText = 'R';
                        bat_here.style.color = 'black';
                    } else if (cell.empty_bat) {
                        bat_here.classList.add('empty-bat');
                    }
                    td_content.appendChild(bat_here);
                }

                if (cell.empty && !cell.town && !cell.not_yet_visited) {
                    let empty_here = document.createElement('div');
                    empty_here.classList.add('dotted-background');
                    empty_here.style.position = 'absolute';
                    empty_here.style.inset = '-1px';

                    td_content.appendChild(empty_here);
                }

                if (cell.my_pos) {
                    let player_here = document.createElement('div');
                    player_here.style.backgroundColor = 'white';
                    player_here.style.margin = 'auto';
                    player_here.style.width = '6px';
                    player_here.style.height = '6px';
                    player_here.style.position = 'absolute';
                    player_here.style.inset = 'calc(50% - 3px)';
                    td_content.appendChild(player_here);
                }
                // if (cell.expedition_here) {
                //     let expedition_here = document.createElement('div');
                //     expedition_here.style.backgroundColor = 'black';
                //     expedition_here.style.margin = 'auto';
                //     expedition_here.textAlign = 'center';
                //     expedition_here.style.width = '10px';
                //     expedition_here.style.height = '10px';
                //     td_content.appendChild(expedition_here);
                // }

                if (cell_index === row.length - 1) {
                    let final_row_td = document.createElement('td');
                    final_row_td.innerText = cell.horizontal;
                    final_row_td.classList.add('around-map');
                    tr.appendChild(final_row_td);
                }
            });
            table.appendChild(tr);
        });

        let final_col_tr = document.createElement('tr');
        map.vertical_mapping.forEach((cell) => {
            let td = document.createElement('td');
            td.innerText = cell;
            td.classList.add('around-map');
            final_col_tr.appendChild(td);
        });
        table.appendChild(final_col_tr);
        table.firstElementChild.firstElementChild.innerText = '🗘';
        table.firstElementChild.firstElementChild.style.cursor = 'pointer';
        table.firstElementChild.firstElementChild.addEventListener('click', () => displayMap());
        content.appendChild(table);
    }

    let transformRuinMapping = (map) => {
        table = document.createElement('table');
        table.setAttribute('style', 'border-collapse: collapse;');
        table.classList.add('mho-ruin');
        let init_col_tr = document.createElement('tr');
        table.appendChild(init_col_tr);

        map.vertical_mapping.forEach((cell) => {
            let td = document.createElement('td');
            td.innerText = cell;
            td.classList.add('around-map');
            init_col_tr.appendChild(td);
        });
        map.map.forEach((row) => {
            let tr = document.createElement('tr');
            row.forEach((cell, cell_index) => {
                if (cell_index === 0) {
                    let init_row_td = document.createElement('td');
                    init_row_td.innerText = cell.horizontal;
                    init_row_td.classList.add('around-map');
                    tr.appendChild(init_row_td);
                }
                let td = document.createElement('td');
                td.style.padding = 0;
                tr.appendChild(td);
                let td_content = document.createElement('div')
                td.style.position = 'relative';
                td.appendChild(td_content);

                if (cell.borders !== '0000') {
                    // let border = document.createElement('div');
                    td_content.style.backgroundColor = 'black';
                    td_content.style.position = 'absolute';
                    td_content.style.top = '0';
                    td_content.style.left = '0';
                    td_content.style.bottom = '0';
                    td_content.style.right = '0';

                    let path = document.createElement('div');
                    path.style.position = 'absolute';
                    path.style.backgroundColor = 'grey';
                    if (cell.borders === 'exit') {
                        path.style.boxShadow = 'inset 0px 5px 6px lightyellow';
                        path.style.left = '4px';
                        path.style.top = '4px';
                        path.style.right = '4px';
                        path.style.bottom = '0';
                        td.classList.add('exit');
                    } else {
                        path.style.left = cell.borders[0] === '0' ? '4px' : '0';
                        path.style.top = cell.borders[1] === '0' ? '4px' : '0';
                        path.style.right = cell.borders[2] === '0' ? '4px' : '0';
                        path.style.bottom = cell.borders[3] === '0' ? '4px' : '0';
                    }
                    td_content.appendChild(path);
                } else {
                    td.classList.add('empty');
                }

                if (cell.zombies && cell.zombies !== '' && cell.zombies > 0) {
                    let zombies = document.createElement('div');
                    zombies.innerText = cell.zombies;
                    zombies.style.position = 'absolute';
                    zombies.style.bottom = '4px';
                    zombies.style.right = '4px';
                    zombies.style.fontSize = '10px';
                    zombies.style.lineHeight = '10px';
                    td_content.appendChild(zombies);
                }

                if (cell.door) {
                    let img = document.createElement('img');
                    img.src = `${repo_img_hordes_url}item/${cell.door}.gif`;
                    img.style.position = 'absolute';
                    img.style.left = 'calc(50% - 8px)';
                    img.style.top = 'calc(50% - 8px)';
                    img.style.zIndex = '100';
                    td_content.appendChild(img);
                    td.classList.add('door');
                }

                if (cell_index === row.length - 1) {
                    let final_row_td = document.createElement('td');
                    final_row_td.innerText = cell.horizontal;
                    final_row_td.classList.add('around-map');
                    tr.appendChild(final_row_td);
                }

                td.addEventListener('click', () => {
                    let my_pos = table.querySelector('.my-pos');
                    if (my_pos) {
                        my_pos.remove();
                    }
                    let new_pos = document.createElement('div');
                    new_pos.classList.add('my-pos');
                    new_pos.style.position = 'absolute';
                    new_pos.style.backgroundColor = 'white';
                    new_pos.style.zIndex = '300';
                    new_pos.style.inset = 'calc(50% - 3px)';
                    td_content.appendChild(new_pos);
                });
            });
            table.appendChild(tr);
        });

        let final_col_tr = document.createElement('tr');
        map.vertical_mapping.forEach((cell) => {
            let td = document.createElement('td');
            td.innerText = cell;
            td.classList.add('around-map');
            final_col_tr.appendChild(td);
        });
        table.appendChild(final_col_tr);
        table.firstElementChild.firstElementChild.innerText = '🗘';
        table.firstElementChild.firstElementChild.style.cursor = 'pointer';
        table.firstElementChild.firstElementChild.addEventListener('click', () => displayMap());
        content.appendChild(table);
    }

    getStorageItem(mho_map_key).then((mho_map) => {
        if (mho_map) {
            if (mho_map.source === 'gh') {
                if (mho_map.map === 'ruin') {
                    getGHRuin().then((map) => transformRuinMapping(map));
                } else {
                    getGHMap().then((map) => transformMapping(map));
                }
            } else if (mho_map.source === 'bbh') {
                if (mho_map.map === 'ruin') {
                    getBBHRuin().then((map) => transformRuinMapping(map));
                } else {
                    getBBHMap().then((map) => transformMapping(map));
                }
            } else if (mho_map.source === 'fm') {
                if (mho_map.map === 'ruin') {
                    getFMRuin().then((map) => transformRuinMapping(map));
                } else {
                    getFMMap().then((map) => transformMapping(map));
                }
            }
        }
    });
}

/** Si l'option associée est activée, demande confirmation avant de quitter si les options d'escorte ne sont pas bonnes */
function preventFromLeaving() {
    if (mho_parameters.alert_if_no_escort && mho_parameters.prevent_from_leaving && pageIsDesert()) {
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
        }

        window.addEventListener('beforeunload', prevent_function, false);
    }
}

/** Si l'option associée est activée, demande confirmation avant de quitter si les options d'escorte ne sont pas bonnes */
function alertIfInactiveAndNoEscort() {
    if (mho_parameters.alert_if_no_escort && mho_parameters.alert_if_inactive && pageIsDesert()) {

        let ae_button = document.querySelector('button[x-toggle-escort="1"]:not([x-escort-control-endpoint])');
        let is_escorting = document.getElementsByClassName('beyond-escort-on')[0];

        let notify = () => {
            createNotification(getI18N(ae_button ? texts.prevent_not_in_ae : texts.escort_not_released))
        };

        if (ae_button || is_escorting) {

            const timer = 300000;

            let timeout = setTimeout(notify, timer);

            document.addEventListener('click', () => {
                clearTimeout(timeout);
                timeout = setTimeout(timeout, timer)
            });

            document.addEventListener('mousemove', () => {
                clearTimeout(timeout);
                timeout = setTimeout(timeout, timer)
            });
        }
    }
}

/** Affiche une notification 5 secondes avant la fin de la fouille en cours */
function notifyOnSearchEnd() {
    let interval = setInterval(() => {
        if (mho_parameters.notify_on_search_end && pageIsDesert()) {
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
function displayNbDeadZombies() {
    if (mho_parameters.display_nb_dead_zombies && pageIsDesert()) {
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
                    nb_dead_zombies_element.innerText = nb_dead_zombies;

                    let despair_deaths_element = document.getElementById(despair_deaths_id);
                    despair_deaths_element.innerText = despair_deaths;
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

function displayTranslateTool() {
    /** On doit laisser l'interval tourner quand l'option est activée, sinon l'input est supprimé lors de changements de page dans l'application */
    let display_translate_input = document.getElementById(mho_display_translate_input_id);
    if (mho_parameters.display_translate_tool) {
        if (display_translate_input) return;

        const mho_header_space = document.getElementById(mho_header_space_id);
        if (!mho_header_space) return;

        let langs = [
            {value: 'de', img: '🇩🇪'},
            {value: 'en', img: '🇬🇧'},
            {value: 'es', img: '🇪🇸'},
            {value: 'fr', img: '🇫🇷'},
        ]
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

        langs.forEach((lang_option) => {
            let option = document.createElement('option');
            option.value = lang_option.value;
            option.setAttribute('style', 'font-size: 16px');
            option.innerText = lang_option.img;
            option.selected = lang_option.value === lang;
            select.appendChild(option);
        })

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
                            } else {
                                display_all_img.src = `${repo_img_hordes_url}/icons/small_less.gif`;
                                display_all_text.innerText = getI18N(texts.display_exact_search_result);
                            }
                            let not_exact = Array.from(block_to_display.getElementsByClassName('not-exact') || []);
                            not_exact.forEach((not_exact_item) => {
                                not_exact_item.classList.toggle('hidden');
                            })
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
                                    img.src = `${repo_img_hordes_url}/lang/${lang_key}.png`
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
        mho_header_space.insertBefore(mho_display_translate_input_div, mho_header_space.firstChild)
    } else if (display_translate_input) {
        display_translate_input.remove();
    }
}

function displayCellDetailsOnPage() {
    if (mho_parameters.display_more_informations_from_mho && pageIsDesert()) {
        let cell = getCellDetailsByPosition();
        let cell_informations = document.querySelector('#cell-informations');
        if (cell) {
            current_cell = cell;
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
                    sub_block_header.id = id + '-header'
                    sub_block_header.style.marginTop = '0';
                    sub_block_header.style.borderBottomWidth = '1px';
                    sub_block_header.style.fontWeight = 'normal';
                    sub_block_header.innerText = title;
                    sub_block.appendChild(sub_block_header);

                    let sub_block_content = document.createElement('div');
                    sub_block_content.id = id + '-content';
                    sub_block.appendChild(sub_block_content);
                }

                let map_box = document.querySelector('.map-box');
                map_box.parentElement.parentElement.appendChild(cell_informations);

                let cell_note = createSubBlock('cell-note', getI18N(texts.note));
                let cell_digs = createSubBlock('cell-digs', getI18N(texts.digs_state_header));
                if (current_cell.idRuin !== null && current_cell.idRuin !== undefined) {
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
                if (current_cell.idRuin !== null && current_cell.idRuin !== undefined && current_cell.idRuin > 0) {
                    let current_ruin = ruins.find((ruin) => ruin.id === current_cell.idRuin);
                    let empty_text = `<div style="opacity: 0.5; font-style: italic; font-size: 12px;">${getI18N(texts.ruin_dried)}</div>`;
                    let complete_text = `<div>${getI18N(texts.ruin_not_dried)}</div>`;
                    let ruin_drops = ``;
                    if (current_ruin && (current_ruin.explorable || !current_cell.isRuinDryed)) {
                        ruin_drops += `<div style="display: flex; flex-direction: row; gap: 0.5em; flex-wrap: wrap; font-size: 12px;">`;
                        if (current_ruin?.drops) {
                            current_ruin.drops.forEach((drop) => {
                                ruin_drops += `<span style="display: flex; flex-direction: column; align-items: center;"><img src="${repo_img_hordes_url}/${drop.item.img}">${Math.round(drop.probability * 100 * 10) / 10}%</span>`
                            })
                        }
                    }
                    ruin_drops += `</div>`;
                    if (cell_informations.querySelector('#cell-ruin-content')) {
                        cell_informations.querySelector('#cell-ruin-content').innerHTML = (!current_ruin?.explorable ? (current_cell.isRuinDryed ? empty_text : complete_text) : '') + ruin_drops;
                    }
                }
            };

            let updateInformations = (cell) => {
                insertCellNote(cell);
                insertCellDigs(cell);
                insertRuinDigs(cell);
            }

            updateInformations(cell);

        }
    } else {
        current_cell = undefined;
    }
}

function displayEstimationsOnWatchtower() {
    if (mho_parameters.display_estimations_on_watchtower && pageIsWatchtower()) {
        let estim_block = document.querySelector(`#${mho_watchtower_estim_id}`);
        let small_note = document.querySelector('.small-note');
        if (estim_block || !small_note) return;


        const TDG_VALUES = [33, 38, 42, 46, 50, 54, 58, 63, 67, 71, 75, 79, 83, 88, 92, 96, 100];
        const PLANIF_VALUES = [0, 4, 8, 13, 17, 21, 25, 29, 33, 38, 42, 46, 50, 54, 58, 63, 67, 71, 75, 79, 83, 88, 92, 96, 100];

        const watchtower_estim_block = document.querySelector('.block.watchtower');
        const watchtower_estim_block_prediction = watchtower_estim_block.querySelector('.x-copy-prediction')?.querySelector('[x-contain-prediction]')?.innerText;

        if (watchtower_estim_block && watchtower_estim_block_prediction) {
            const current_estimation_percent_read = watchtower_estim_block.querySelector('.watchtower-prediction-text')?.innerText?.replace('%', '');
            const current_estimation_percent = current_estimation_percent_read !== undefined && current_estimation_percent_read !== null ? +current_estimation_percent_read : (watchtower_estim_block_prediction ? 100 : undefined);

            const watchtower_planif_block = watchtower_estim_block.nextElementSibling;
            const watchtower_planif_block_prediction = watchtower_planif_block.querySelector('.x-copy-prediction')?.querySelector('[x-contain-prediction]')?.innerText;
            const current_planif_percent_read = watchtower_planif_block.querySelector('.watchtower-prediction-text')?.innerText?.replace('%', '')
            const current_planif_percent = current_planif_percent_read !== undefined && current_planif_percent_read !== null ? +current_planif_percent_read : (watchtower_planif_block_prediction ? 100 : undefined);

            let createEstimationRow = (value, is_new_estimation, estimation, type) => {
                return `<b style="color: #afb3cf; opacity: .8;">[${value}%]</b>
                        <div id="${type}_${value}" style="font-weight: ${is_new_estimation ? 'bold' : 'normal'}; color: ${is_new_estimation ? 'lightgreen' : 'unset'}">
                            <span class="start" style="width: 100px">${estimation?.min || ''}</span> - <span class="end" style="width: 100px">${estimation?.max || ''}</span><img src="${repo_img_hordes_url}emotes/zombie.gif">
                        </div>`;
            };
            let createCalculatedAttackRow = (calculated_attack) => {
                let estim_values_block_title_calculated_text = ``;
                estim_values_block_title_calculated_text += `<div class="attack" style="display: flex; justify-content: space-between; gap: 1em;"><b>${getI18N(texts.calculated_attack)} (Apofoo)</b><div><span>${calculated_attack.result.min}</span> - <span>${calculated_attack.result.max}</span></div></div>`;

                return estim_values_block_title_calculated_text;
            }

            let updateEstimationRow = (estimations, percent, type) => {
                if (!estimations.estimations[type][`_${percent}`]) {
                    /** Workaround pour définir sur l'extension firefox sans passer par cloneinto */
                    let estimations_workaround_estim = {...estimations.estimations};
                    let estimations_workaround_type = {...estimations_workaround_estim[type]};
                    let estimations_workaround_type_percent = {min: null, max: null};
                    estimations_workaround_type[`_${percent}`] = {...estimations_workaround_type_percent};
                    estimations_workaround_estim[type] = {...estimations_workaround_type};
                    estimations.estimations = {...estimations_workaround_estim};
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
            }

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
                    } else {
                        if (calc_attack) {
                            calc_attack.firstElementChild.innerText = estimations.tomorrow_attack.result.min;
                            calc_attack.lastElementChild.innerText = estimations.tomorrow_attack.result.max;
                        }
                    }
                }
            }

            getEstimations().then((estimations) => {
                estimations = {...estimations};
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
                        },
                        {
                            percent: current_planif_percent,
                            value: {
                                min: +watchtower_planif_block_prediction?.split(' ')[0],
                                max: +watchtower_planif_block_prediction?.split(' ')[2]
                            }
                        })
                        .then(() => {
                            estim_block_title_save_button.innerHTML = `<img src="${repo_img_hordes_url}icons/done.png">`;

                            getEstimations().then((new_saved_estimations) => {
                                updateCalculatedAttackRow(new_saved_estimations, 'estim')
                                updateCalculatedAttackRow(new_saved_estimations, 'planif')
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
                            } else {
                                text += `[b][${value_key}%][/b] \n`
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
                        let new_estimations = {...estimations};
                        let new_estimations_estimations = {...new_estimations.estimations};
                        let new_estimations_estimations_estim = {...new_estimations_estimations.estim};
                        new_estimations_estimations_estim['_' + value] = {min: null, max: null};
                        new_estimations_estimations.estim = {...new_estimations_estimations_estim};
                        new_estimations.estimations = {...new_estimations_estimations};
                        estimations = {...new_estimations};
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
                            let new_estimations = {...estimations};
                            let new_estimations_estimations = {...new_estimations.estimations};
                            let new_estimations_estimations_planif = {...new_estimations_estimations.planif};
                            new_estimations_estimations_planif['_' + value] = {min: null, max: null};
                            new_estimations_estimations.planif = {...new_estimations_estimations_planif};
                            new_estimations.estimations = {...new_estimations_estimations};
                            estimations = {...new_estimations};
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

function displayAntiAbuseCounter() {
    const controller = new AbortController();
    if (mho_parameters.display_anti_abuse && (pageIsBank() || pageIsWell())) {
        let mho_anti_abuse_counter = document.querySelector(`#${mho_anti_abuse_counter_id}`);
        if (mho_anti_abuse_counter) return;
        mho_anti_abuse_counter = document.createElement('div');
        mho_anti_abuse_counter.id = mho_anti_abuse_counter_id;
        mho_anti_abuse_counter.style.marginBottom = '0.5em';
        if (pageIsBank()) {
            let forum_preview = document.querySelector('.forum-preview-wrapper-bank');
            if (!forum_preview) return;
            forum_preview.parentElement.insertBefore(mho_anti_abuse_counter, forum_preview.parentElement.firstElementChild);
        } else {
            let actions_box = document.querySelector('.actions-box');
            if (!actions_box) return;
            actions_box.parentElement.insertBefore(mho_anti_abuse_counter, actions_box);
        }

        let header = document.createElement('h5');
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.justifyContent = 'space-between';
        mho_anti_abuse_counter.appendChild(header);

        let first_part = document.createElement('div');
        first_part.innerHTML = `<img src="${mh_optimizer_icon}" style="width: 24px !important; vertical-align: middle; margin-right: 0.5em;">${getI18N(texts.anti_abuse_title)}`;
        header.appendChild(first_part);

        let second_part = document.createElement('div');
        header.appendChild(second_part);

        let content = document.createElement('div');
        content.classList.add('content');
        content.style.borderBottom = '1px solid #ddab76';
        mho_anti_abuse_counter.appendChild(content);

        /** Modifie le style du forum pour pouvoir l'afficher proprement malgré la présence du compteur */
        let forum_preview_wrapper_bank = document.querySelector('.forum-preview-wrapper-bank');
        if (forum_preview_wrapper_bank) {
            forum_preview_wrapper_bank.style.minHeight = 'unset';

            let forum_preview_container = forum_preview_wrapper_bank.querySelector('.forum-preview-container');
            if (forum_preview_container) {
                forum_preview_container.style.position = 'initial';
                forum_preview_container.style.padding = '3px';

                let forum_content = forum_preview_container.querySelector('#forum-content');
                if (forum_content) {
                    forum_content.style.position = 'initial';
                }
            }
        }
        /** Fin */

        getStorageItem(mho_anti_abuse_key).then((counter_values) => {
            console.log('counter_values on loading (avant que la prise soit prise en compte)', counter_values);
            let add_counter_btn = document.createElement('button');
            add_counter_btn.innerText = '+';
            second_part.appendChild(add_counter_btn);
            add_counter_btn.addEventListener('click', () => {
                controller.abort();
                let fictive_item = {
                    label: {
                        de: `Benutzerdefinierter Zähler`,
                        en: `Custom counter`,
                        es: `Contador personalizado`,
                        fr: `Compteur personnalisé`,
                    },
                    img: 'icons/small_warning.gif'
                }
                if (!counter_values) {
                    counter_values = [];
                }
                let counter_value = {item: {item: fictive_item, broken: false}, take_at: Date.now() + 5000};
                counter_values.push(counter_value);
                setStorageItem(mho_anti_abuse_key, counter_values);
                let new_mho_anti_abuse_counter = document.querySelector(`#${mho_anti_abuse_counter_id}`);
                if (new_mho_anti_abuse_counter) {
                    let new_content = new_mho_anti_abuse_counter.querySelector('.content');
                    define_row(counter_value, counter_values.length - 1, new_content, true);
                }
            })

            let define_row = (counter_value, index, new_content, fictive) => {
                let is_time_invalid = (_counter_value, _index) => {
                    let since = (Date.now() - parseInt(_counter_value.take_at))
                    let time_left = new Date(((15) * 60000) - since);
                    if (time_left < 0) {
                        console.log('_counter_value', _counter_value);
                        console.log('_index', _index);
                        console.log('time_left', time_left);
                        console.log('counter_values', [...counter_values]);
                        console.log('index', index);
                        console.log('counter_value_before', [...counter_values]);
                        counter_values.splice(index, 1);
                        console.log('counter_value_after', [...counter_values]);
                        setStorageItem(mho_anti_abuse_key, [...counter_values]);
                    }
                    return time_left < 0;
                };
                if (!is_time_invalid(counter_value, index)) {
                    let value_in_list = document.createElement('div');
                    value_in_list.style.display = 'flex';
                    value_in_list.style.gap = '0.5em';
                    new_content.appendChild(value_in_list);

                    let item_name = document.createElement('div');
                    item_name.style.flex = 1;
                    item_name.innerHTML = `<img src="${repo_img_hordes_url + counter_value.item?.item?.img}" style="margin-right: 0.5em; ${counter_value.item?.broken ? 'border: 1px dotted red' : ''}">${counter_value.item?.item?.label[lang]}`;
                    value_in_list.appendChild(item_name);

                    let item_counter = document.createElement('div');
                    item_counter.style.width = '50px';
                    let interval = setInterval(() => {
                        let since = (Date.now() - parseInt(counter_value.take_at))
                        let time_left = new Date(((15) * 60000) - since);
                        if (is_time_invalid(counter_value, index)) {
                            clearInterval(interval);
                            if (value_in_list) {
                                console.log('remove_value_in_list', value_in_list);
                                value_in_list.remove();
                            }
                        } else {
                            let minute = time_left.getMinutes();
                            let seconds = time_left.getSeconds();
                            item_counter.innerText = minute + ':' + (seconds < 10 ? ('0' + seconds) : seconds);
                        }
                    }, 250);
                    value_in_list.appendChild(item_counter);
                }
            }

            if (!counter_values) {
                counter_values = [];
            }
            counter_values.forEach((counter_value, index) => {
                define_row(counter_value, index, content);
            });

            if (pageIsBank()) {
                let bank = document.querySelector('#bank-inventory');
                let bank_items = bank ? Array.from(bank.querySelectorAll('li.item') || []) : [];
                bank_items.forEach((bank_item) => {
                    bank_item.addEventListener('click', (event) => {
                        let old_bag = Array.from(document.querySelectorAll("#gma ul.rucksack li.item"));

                        document.addEventListener('mh-navigation-complete', () => {
                            controller.abort();
                            if (!pageIsBank()) return;
                            let new_bag = document.querySelectorAll("#gma ul.rucksack li.item");

                            if (old_bag.length < new_bag.length) {
                                getStorageItem(mho_anti_abuse_key).then((counter_values) => {
                                    if (!counter_values) {
                                        counter_values = [];
                                    }
                                    let old_bag_items = Array.from(old_bag).map((item_in_old_bag) => getItemFromImg(item_in_old_bag.querySelector('img').src))
                                    let new_bag_items = Array.from(new_bag).map((item_in_new_bag) => getItemFromImg(item_in_new_bag.querySelector('img').src));
                                    new_bag_items.forEach((new_bag_item, index) => {
                                        let old_bag_item_index = old_bag_items.findIndex((old_bag_item) => old_bag_item.id === new_bag_item.id)
                                        if (old_bag_item_index > -1) {
                                            old_bag_items.splice(old_bag_item_index, 1);
                                        } else {
                                            let counter_value = {
                                                item: {
                                                    item: new_bag_item,
                                                    broken: new_bag[index].classList.contains('broken')
                                                },
                                                take_at: Date.now() + 2500
                                            };
                                            counter_values.push(counter_value);

                                            let new_mho_anti_abuse_counter = document.querySelector(`#${mho_anti_abuse_counter_id}`);
                                            if (new_mho_anti_abuse_counter) {
                                                let new_content = new_mho_anti_abuse_counter.querySelector('.content');
                                                define_row(counter_value, counter_values.length - 1, new_content);
                                            }
                                        }
                                    });

                                    setStorageItem(mho_anti_abuse_key, counter_values);
                                })
                            } else {
                                new_bag = undefined;
                            }
                        }, {once: true});
                    }, {signal: controller.signal})
                });

            } else if (pageIsWell()) {
                let btn = document.querySelector('button[data-fetch-method="get"][data-fetch-confirm]');
                btn?.addEventListener('click', (event) => {
                    document.addEventListener('mh-navigation-complete', () => {
                        controller.abort();
                        if (!pageIsWell()) return;
                        let well_item = {
                            label: {
                                de: `Eine weitere Ration erhalten`,
                                en: `Extra ration`,
                                es: `Ración adicional`,
                                fr: `Ration supplémentaire`,
                            },
                            img: 'log/well.gif'
                        }
                        getStorageItem(mho_anti_abuse_key).then((counter_values) => {
                            if (!counter_values) {
                                counter_values = [];
                            }
                            let counter_value = {item: {item: well_item, broken: false}, take_at: Date.now() + 5000}
                            counter_values.push(counter_value);
                            setStorageItem(mho_anti_abuse_key, counter_values);
                            let new_mho_anti_abuse_counter = document.querySelector(`#${mho_anti_abuse_counter_id}`);
                            if (new_mho_anti_abuse_counter) {
                                let new_content = new_mho_anti_abuse_counter.querySelector('.content');
                                define_row(counter_value, counter_values.length - 1, new_content);
                            }
                        })
                    }, {once: true});
                }, {signal: controller.signal})
            } else {
                controller.abort();
            }
        });
    } else {
        controller.abort();
    }
}

function automaticallyOpenBag() {
    if (mho_parameters.automatically_open_bag) {
        let button = document.querySelector('[x-item-action-toggle="1"]');
        if (button && (!button.getAttribute('style') || button.getAttribute('style').indexOf('display: none') < 0)) {
            button.click();
        }
    }
}

function displayCampingPredict() {
    setTimeout(() => {
        let camping_predict_container = document.getElementById(mho_camping_predict_id);

        let zone_camp = document.querySelector('.zone-camp');
        if (mho_parameters.display_camping_predict && pageIsDesert() && zone_camp) {
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
                let conf = {
                    townType: mh_user.townDetails?.townType.toUpperCase(),
                    job: jobs.find((job) => mh_user.jobDetails.uid === job.img)?.id,
                    distance: document.querySelector('.zone-dist > div > b')?.innerText.replace('km', ''), // OK
                    campings: 0,
                    proCamper: false,
                    hiddenCampers: 0,
                    objects: 0,
                    vest: false,
                    tomb: false,
                    zombies: document.querySelectorAll('.actor.zombie')?.length || 0,
                    night: !!document.querySelector('.map.night'),
                    devastated: mh_user.townDetails?.isDevaste,
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
                nb_campings.value = conf.campings;
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
                objects_in_bag.value = conf.objects;
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
                    let current_ruin = all_ruins.find((_current_ruin) => +_current_ruin.id === +conf.ruin);

                    conf.ruinBonus = current_ruin.camping;
                    conf.ruinCapacity = current_ruin.capacity;

                    let digs_field = document.querySelector('#digs-field');
                    if (current_ruin.id === -1) {
                        digs_field.style.display = 'block';
                    } else {
                        digs_field.style.display = 'none';
                        digs_field.querySelector('input').value = 0;
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
                digs.value = conf.ruinBuryCount;
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
                zombies.value = conf.zombies;
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
                improve.value = conf.improve;
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
                object_improve.value = conf.objectImprove;
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
                hidden_campers.value = conf.hiddenCampers;
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

function addCopyRegistryButton() {
    if (mho_parameters.copy_registry) {
        let logs = document.querySelector('hordes-log');
        let logs_complete_links = document.querySelector('log-complete-link');
        let copy_button = document.querySelector(`#${mho_copy_logs_id}`);

        let createCopyRegistryButtonContent = (value) => {
            return `<div style="display: flex; gap: 0.5em; align-items: center;"><img src="${mh_optimizer_icon}" style="width: 16px !important;">${value}</div>`;
        }

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
                }, 5000)
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
                } else {
                    copy_button.style.display = 'flex';
                    copy_button.style.justifyContent = 'center';
                }

            }
        }
    }
}

function changeDefaultEscortOptions() {
    if (mho_parameters.default_escort_options && pageIsDesert()) {
        const btn_activate_escort = document.querySelector('button[x-toggle-escort="1"]:not([x-escort-control-endpoint])');
        if (!btn_activate_escort) return;

        btn_activate_escort.addEventListener('click', () => {
            document.addEventListener('mh-navigation-complete', () => {
                const escort_force_return = document.querySelector('#escort_force_return');
                const escort_allow_rucksack = document.querySelector('#escort_allow_rucksack');

                if (!escort_force_return || !escort_allow_rucksack) return;

                const escort_force_return_correct = escort_force_return.checked === mho_parameters.default_escort_force_return;
                const escort_allow_rucksack_correct = escort_allow_rucksack.checked === mho_parameters.default_escort_allow_rucksack;
                if (!escort_force_return_correct && !escort_allow_rucksack_correct) {
                    escort_force_return.checked = !escort_force_return.checked;
                    escort_allow_rucksack.click();
                } else if (!escort_force_return_correct || !escort_allow_rucksack_correct) {
                    if (!escort_force_return_correct) {
                        escort_force_return.click();
                    }
                    if (!escort_allow_rucksack_correct) {
                        escort_allow_rucksack.click();
                    }
                }
            }, {once: true});
        });
    }
}

function displayGhoulVoracityPercent() {
    if (mho_parameters.display_ghoul_voracity_percent) {
        let ghoul_voracity_node = document.querySelector('.status-ghoul');

        if (!ghoul_voracity_node) return;

        let voracite = ghoul_voracity_node.querySelector('.ghoul-hunger-bar').style.width;
        ghoul_voracity_node.firstChild.textContent = ghoul_voracity_node.firstChild.textContent.replace(':\n', `: ${voracite}\n`);
    }
}

function addExternalLinksToProfiles() {
    if (mho_parameters.display_external_links) {
        let user_tooltip = document.querySelector('#user-tooltip');
        if (user_tooltip) {
            let user_id = user_tooltip.querySelector('[x-ajax-href]')?.getAttribute('x-ajax-href')?.replace(/\D/g, '');
            if (!user_id) return;
            let dash_separators = user_tooltip.querySelectorAll('hr.dashed');
            let last_separator = Array.from(dash_separators).pop();
            let link_color = window.getComputedStyle(user_tooltip.querySelector('.link')).getPropertyValue('color');

            let new_separator = document.createElement('hr');
            new_separator.classList.add('dashed');
            last_separator.parentNode.insertBefore(new_separator, last_separator.nextSibling);

            let new_part = document.createElement('div');
            new_part.classList.add('link-blocks');
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

            bbh_link.addEventListener('click', () => user_tooltip.remove())

            let bbh_img = document.createElement('img');
            bbh_img.src = `${repo_img_url}external-tools/bbh.gif`;
            bbh_link.appendChild(bbh_img);

            let bbh_br = document.createElement('br');
            bbh_link.appendChild(bbh_br);

            let bbh_title = document.createElement('text');
            bbh_title.innerText = `BigBroth'\nHordes`;
            bbh_link.appendChild(bbh_title);

            let gh_link = document.createElement('a');
            gh_link.classList.add('link-block');
            gh_link.href = `${gest_hordes_url}/ame/${user_id}`;
            new_part.appendChild(gh_link);

            gh_link.addEventListener('click', () => user_tooltip.remove())

            let gh_img = document.createElement('img');
            gh_img.src = `${repo_img_url}external-tools/gh.gif`;
            gh_link.appendChild(gh_img);

            let gh_br = document.createElement('br');
            gh_link.appendChild(gh_br);

            let gh_title = document.createElement('text');
            gh_title.innerText = `Gest'Hordes`;
            gh_link.appendChild(gh_title);

            let empty_link = document.createElement('div');
            empty_link.classList.add('link-block', 'empty');
            new_part.appendChild(empty_link);
        }
    }
}

function addExternalLinksToTowns() {
    if (mho_parameters.display_external_links && pageIsSoul()) {
        let town_history = document.querySelector('.town-history');

        if (!town_history) return;

        let table_header = town_history.querySelector('.row-flex.header');

        if (!table_header) return;

        let new_cell_header = document.createElement('div');
        new_cell_header.classList.add('cell', 'padded', 'rw-2', 'center');
        new_cell_header.innerHTML = `<img src="${mh_optimizer_icon}" style="width: 16px; margin-right: 0.25em;">${getI18N(texts.external_links)}`;
        table_header.appendChild(new_cell_header);

        let table_rows_container = town_history.querySelector('.town-container');

        let table_rows = table_rows_container.querySelectorAll('.row-flex.stretch');
        if (table_rows && table_rows.length > 0) {
            Array.from(table_rows).forEach((table_row) => {
                let town_id = table_row.querySelector('[data-town-id]').getAttribute('data-town-id');

                let new_cell = document.createElement('div');
                new_cell.classList.add('cell', 'padded', 'rw-2', 'center');
                new_cell.style.borderBottom = '1px solid #7e4d2a';
                new_cell.style.borderLeft = '1px solid #7e4d2a';
                new_cell.style.display = 'flex';
                new_cell.style.gap = '0.25em';
                new_cell.style.alignItems = 'flex-start';
                new_cell.style.justifyContent = 'space-around';
                table_row.appendChild(new_cell);

                let bbh_link = document.createElement('a');
                bbh_link.href = `${big_broth_hordes_url}/?cid=5-${town_id}`;
                new_cell.appendChild(bbh_link);

                let bbh_img = document.createElement('img');
                bbh_img.src = `${repo_img_url}external-tools/bbh.gif`;
                bbh_link.appendChild(bbh_img);

                let gh_link = document.createElement('a');
                gh_link.href = `${gest_hordes_url}/carte/${town_id}`;
                new_cell.appendChild(gh_link);

                let gh_img = document.createElement('img');
                gh_img.src = `${repo_img_url}external-tools/gh.gif`
                gh_link.appendChild(gh_img);
            });
        }
    }
}

function fillItemsMessages() {
    if (mho_parameters.fill_items_messages && pageIsMsgReceived()) {
        let row_send = document.querySelector('#rows-send');
        if (!row_send) return;

        let sendable_items = row_send.querySelector('.sendable-items');
        if (!sendable_items) return;

        let editor_block = document.querySelector('#pm-forum-editor');
        if (!editor_block) return;

        setTimeout(() => {

            let editor = editor_block.querySelector('hordes-twino-editor');
            if (!editor) return;

            let items = sendable_items.querySelectorAll('li.item');
            Array.from(items).forEach((item) => {
                item.addEventListener('click', () => {
                    let message_title = editor.querySelector('input');
                    let message_content = editor.querySelector('textarea');
                    if ((message_title.value === undefined || message_title.value === null || message_title.value === '')
                        && (message_content.value === undefined || message_content.value === null || message_content.value === '')) {
                        let lang_fillers = fill_items_messages_pool[lang];
                        let random_filler = lang_fillers[Math.floor(Math.random() * lang_fillers.length)];

                        message_title.setAttribute('value', random_filler.title);
                        message_title.dispatchEvent(new Event('input', {bubbles: true}));

                        message_content.value = random_filler.content;
                        message_content.dispatchEvent(new Event('input', {bubbles: true}));
                    }
                }, {once: true});
            });
        }, 250);
    }
}

function createStoreNotificationsBtn() {
    let stored_notifications_btn = document.getElementById(mho_store_notifications_id);
    if (mho_parameters.store_notifications) {
        const mho_header_space = document.getElementById(mho_header_space_id);
        if (stored_notifications_btn || !mho_header_space) return;

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
        });

        console.log('rdy');

        document.querySelector('#modal-backdrop').addEventListener('pop', (event) => {
            console.log('pop', event);
        });

        mho_header_space.appendChild(btn_container);
    } else if (stored_notifications_btn) {
        stored_notifications_btn.remove();
    }
}

function createExpeditionsBtn() {
    let expeditions_btn = document.getElementById(mho_display_expeditions_id);
    if (mho_parameters.display_my_expeditions) {
        createWindow(mho_expeditions_window_id, false);

        const mho_header_space = document.getElementById(mho_header_space_id);
        if (expeditions_btn || !mho_header_space) return;

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

    } else if (expeditions_btn) {
        expeditions_btn.remove();
    }
}

function createExpeditionsWindowContent() {
    let get_my_expeditions_promise = getMyExpeditions()
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
                if (!tab_li.classList.contains('selected') && tab_content !== '' && tab_content !== undefined && tab_content !== null) {
                    for (let li of tabs_ul.children) {
                        li.classList.remove('selected');
                    }
                    tab_li.classList.add('selected');
                }

                dispatchExpeditionContent(expedition, citizens.citizens);
            })

            tabs_ul.appendChild(tab_li);
        })

        let tabs_div = document.createElement('div');
        tabs_div.id = 'tabs';
        tabs_div.appendChild(tabs_ul)

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

    console.log('expedition', expedition);
    expedition.parts.forEach((part, index) => {
        console.log('part', part);
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
        ]
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
function blockUsersPosts() {
    if (mho_parameters.block_users && pageIsForum()) {
        let posts = document.querySelectorAll('.forum-post');
        if (posts) {
            Array.from(posts).forEach((post) => {
                let blacklisted_user = post.querySelector("#blacklist")
                let user = post.querySelector('.username');
                let user_id = user.getAttribute('x-user-id');
                if (user_id === mh_user.id.toString()) return;

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
                                    blacklisted_user.setAttribute('blacklisted', true);
                                    let user_posts = Array.from(document.querySelectorAll(`.username[x-user-id="${user_id}"]`) || []).map((user_tag) => user_tag.parentElement.parentElement.querySelector('.original'));
                                    user_posts.forEach((user_post) => user_post.classList.remove('force-display'));
                                } else {
                                    let index = temp_blacklist.findIndex((blacklisted_user_id) => blacklisted_user_id === user_id);
                                    if (index > -1) {
                                        temp_blacklist.splice(index, 1);
                                        blacklisted_user.removeAttribute('blacklisted');
                                    }
                                }
                                setStorageItem(mho_blacklist_key, [...temp_blacklist]);
                                getStorageItem(mho_blacklist_key).then((new_blacklist) => {
                                    blacklist = [...new_blacklist];
                                })
                            })
                        });

                        user.parentNode.insertBefore(blacklisted_user, user);
                    }

                    if (is_user_in_blacklist) {
                        blacklisted_user.innerHTML = '&#10007;';
                        blacklisted_user.setAttribute('blacklisted', true);
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
                        } else {
                            if (!original_post_content.classList.contains('force-display')) {
                                new_post_content.style.display = 'block';
                            }
                        }
                    } else {
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

/////////////////////////////////////
// BOUTONS SUR LES OUTILS EXTERNES //
/////////////////////////////////////
function createCopyButton(source, map, map_id, button_block_id) {
    let copy_button_parent = document.getElementById(button_block_id);
    let copy_button = document.createElement('button');
    let copyText = (text, add) => {
        return `<img src="${mh_optimizer_icon}" style="margin: auto; vertical-align: middle;" width="20" height="20"><span style="margin: auto; vertical-align: middle;">${text}<br /><small>${add}</small></span>`;
    }
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
        }, 5000)
        copy_button.disabled = false;
    });
    copy_button_parent.appendChild(copy_button);
}

///////////
// STYLE //
///////////

/** Add styles to this page */
function createStyles() {
    const params_style = `.param-has-children > div::after {`
        + `content: '▶︎';`
        + `margin-left: auto;`
        + `}`;

    const btn_style = `
    #${btn_id} {
        background-color: #5c2b20;
        border: 1px solid #f0d79e;
        outline: 1px solid #000;
        position: absolute;
        top: 10px;
        z-index: 997;
    }
    #${btn_id}.mho-btn-opened h1 span, #${btn_id}.mho-btn-opened h1 a, #${btn_id}.mho-btn-opened h1 img.close {
        display: inline;
    }
    #${btn_id}.mho-btn-opened div {
        display: block;
    }
    #${btn_id} h1 {
        height: auto;
        font-size: 8pt;
        text-transform: none;
        font-variant: small-caps;
        background: none;
        cursor: help;
        margin: 0 5px;
        padding: 0;
        line-height: 17px;
        color: #f0d79e;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    #${btn_id} h1 > div > img {
        vertical-align: -9%;
    }
    #${btn_id}.mho-btn-opened h1 {
        border-bottom: 1px solid #b37c4a;
        margin-bottom: 5px;
    }
    #${btn_id} h1 span, #${btn_id} h1 a, #${btn_id} h1 img.close {
        color: #f0d79e;
        cursor: help;
        font-family: Trebuchet MS,Arial,Verdana,sans-serif;
        letter-spacing: 1px;
        line-height: 17px;
        text-align: left;
        text-transform: none;
        margin-left: 1em;
        display: none;
    }
    #${btn_id} > div {
        display: none;
        margin: 0 5px 8px 5px;
        font-size: 0.9em;
        width: 350px;
    }
    `;

    const mho_window_style = `
    .mho-window {
        opacity: 1;
        transition: opacity 1s ease;
        z-index: 999;
        padding: 0;
        position: fixed;
        min-width: 150px;
        min-height: 150px;
    }
    .mho-window:not(.fullsize) .mho-window-box {
        resize: both;
        overflow: auto;
    }
    .mho-window.fullsize {
        background: url(${repo_img_hordes_url}background/mask.png);
        height: 100%;
        width: 100%;
        resize: none;
    }
    .mho-window:not(.visible), #${mh_optimizer_map_window_id}:not(.visible) {
        opacity: 0;
        pointer-events: none;
        }
    .mho-window:not(.visible) .mho-window-box, .mho-window:not(.visible) #${mh_optimizer_map_window_id}-box {
        transform: scale(0) translateY(1000px);
    }
    .mho-window .mho-window-box {
        background: url(${repo_img_hordes_url}background/bg_content2.jpg) repeat-y 0 0/900px 263px,url(${repo_img_hordes_url}background/bg_content2.jpg) repeat-y 100% 0/900px 263px;
        border-radius: 8px;
        box-shadow: 0 0 10px #000;
        display: flex;
        flex-direction: row;
        position: absolute;
        top: 10px;
        bottom: 10px;
        right: 10px;
        left: 10px;
        transform: scale(1) translateY(0);
        transition: transform .5s ease;
    }
    #${mh_optimizer_map_window_id} #${mh_optimizer_map_window_id}-box {
        background: url(${repo_img_hordes_url}background/bg_content2.jpg) repeat-y 0 0/900px 263px,url(${repo_img_hordes_url}background/bg_content2.jpg) repeat-y 100% 0/900px 263px;
        border-radius: 8px;
        box-shadow: 0 0 10px #000;
        position: absolute;
        transform: scale(1) translateY(0);
        transition: transform .5s ease;
        resize: both;
        overflow: auto;
        z-index: 9999;
    }
    .mho-window .mho-window-box .mho-window-overlay, #${mh_optimizer_map_window_id} #${mh_optimizer_map_window_id}-box #${mh_optimizer_map_window_id}-overlay {
        position: absolute;
        right: 6px;
        top: 6px;
        text-align: right;
    }
    .mho-window .mho-window-box .mho-window-overlay ul, #${mh_optimizer_map_window_id} #${mh_optimizer_map_window_id}-box #${mh_optimizer_map_window_id}-overlay ul {
        margin: 2px;
        padding: 0;
    }
    .mho-window .mho-window-box .mho-window-overlay ul li, #${mh_optimizer_map_window_id} #${mh_optimizer_map_window_id}-box #${mh_optimizer_map_window_id}-overlay ul li {
        cursor: pointer;
        display: inline-block;
    }
    .mho-window .mho-window-drag-handle {
        width: 18px;
        height: 100%;
    }
    .mho-window-content, #${mh_optimizer_map_window_id}-content {
        flex: 1;
        color: #fff;
        overflow: auto;
        background: url(${repo_img_hordes_url}background/box/panel_00.gif) 0 0 no-repeat,url(${repo_img_hordes_url}background/box/panel_02.gif) 100% 0 no-repeat,url(${repo_img_hordes_url}background/box/panel_20.gif) 0 100% no-repeat,url(${repo_img_hordes_url}background/box/panel_22.gif) 100% 100% no-repeat,url(${repo_img_hordes_url}background/box/panel_01.gif) 0 0 repeat-x,url(${repo_img_hordes_url}background/box/panel_10.gif) 0 0 repeat-y,url(${repo_img_hordes_url}background/box/panel_12.gif) 100% 0 repeat-y,url(${repo_img_hordes_url}background/box/panel_21.gif) 0 100% repeat-x,#7e4d2a;
        border-radius: 12px;
        padding: 8px;
   }
   `;

    const mho_window_style_tabs = `
    #tabs {
        color: #ddab76;
        font-size: 1.2rem;
        margin-bottom: 20px;
        position: relative;
        height: 25px;
        order-bottom: 1px solid #ddab76;
    }
    #tabs ul {
        display: flex;
        flex-wrap: wrap;
        padding: 0;
        background: url(${repo_img_hordes_url}background/tabs-header-plain.gif) 0 100% round;
        background-size: cover;
        height: 24px;
        margin-top: 2px;
        margin-right: 20px;
        padding-left: 0.5em;
    }
    #tabs > ul > li {
        cursor: pointer;
        display: inline-block;
        margin-top: auto;
        margin-bottom: auto;
    }
    #tabs > ul > li > div > img {
        margin-right: 0.5em;
    }
    #tabs > ul > li > div {
        background-image: url(${repo_img_hordes_url}background/tab.gif);
        background-position: 0 0;
        background-repeat: no-repeat;
        border-left: 1px solid #694023;
        border-right: 1px solid #694023;
        color: #f0d79e;
        cursor: pointer;
        float: right;
        font-family: Arial,sans-serif;
        font-size: 1rem;
        font-variant: small-caps;
        height: 21px;
        margin-left: 2px;
        margin-right: 0;
        margin-top: 3px;
        padding: 2px 4px 0;
        text-decoration: underline;
        white-space: nowrap;
    }
    #tabs > ul > li > div:hover {
        outline: 1px solid #f0d79e;
        text-decoration: underline;
    }
    #tabs > ul > li.selected {
        position: relative;
        top: 2px;
    }
    `;

    const tab_content_style = '.tab-content {'
        + 'position: absolute;'
        + 'bottom: 10px;'
        + 'left: 28px;'
        + 'right: 8px;'
        + 'top: 40px;'
        + 'overflow: auto;'
        + '}';

    const tab_content_item_list_style = '.tab-content > ul {'
        + 'display: flex;'
        + 'flex-wrap: wrap;'
        + 'padding: 0;'
        + 'margin: 0 0.5em;'
        + '}';

    const tab_content_item_list_item_style = '.tab-content > ul > li {'
        + 'min-width: 300px;'
        + 'flex-basis: min-content;'
        + 'padding: 0.125em 0.5em;'
        + 'margin: 0;'
        + '}';

    const tab_content_item_list_item_selected_style = '.tab-content > ul > li.selected {'
        + 'flex-basis: 100%;'
        + 'padding: 0.25em;'
        + 'margin: 0.25em 1px;'
        + '}';

    const tab_content_item_list_item_not_selected_properties_style = '.tab-content > ul > li:not(.selected) .properties {'
        + 'display: none;'
        + '}';

    const item_category = '.tab-content > ul div.mho-category {'
        + 'width: 100%;'
        + 'border-bottom: 1px solid;'
        + 'margin: 1em 0 0.5em;'
        + '}';

    const parameters_informations_ul_style = '#categories > ul, ul.parameters, #informations > ul {'
        + 'padding: 0;'
        + 'margin: 0;'
        + 'color: #f0d79e;'
        + '}';

    const li_style = '#categories > ul > li, ul.parameters > li, .tab-content ul > li, #informations ul > li {'
        + 'list-style: none;'
        + '}';

    const mho_table_style = '.mho-table {'
        + 'border-collapse: collapse;'
        + 'border-bottom: 1px solid #ddab76;'
        + '}';

    const mho_table_header_style = '.mho-header {'
        + 'font-size: 10pt;'
        + 'background: linear-gradient(0deg,#643b25 0,rgba(100,59,37,0) 50%,rgba(100,59,37,0)) !important;'
        + 'border-bottom: 2px solid #f0d79e;'
        + 'color: #fff;'
        + 'font-family: Trebuchet MS,Arial,Verdana,sans-serif;'
        + 'font-weight: 700;'
        + '}';

    const mho_table_row_style = '.mho-table tr:not(.mho-header) {'
        + 'background-color: #5c2b20;'
        + 'border-bottom: 1px solid #7e4d2a;'
        + '}';

    const mho_table_cells_style = '.mho-table tr th, .mho-table tr td {'
        + 'padding: 0.25em;'
        + '}';

    const mho_table_cells_td_style = '.mho-table tr td {'
        + 'border-left: 1px solid #7e4d2a;'
        + 'color: #f0d79e;'
        + 'font-size: 9pt;'
        + '}';

    const recipe_style = '.tab-content #recipes-list > li, #wishlist > li {'
        + 'min-width: 100% !important;'
        + 'display: flex;'
        + '}';

    const item_title_style = '.item-title {'
        + 'display: flex;'
        + 'justify-content: space-between;'
        + '}';

    const item_list_element_style = 'ul#item-list > li {'
        + 'background-color: #5c2b20;'
        + 'margin: 1px 1px;'
        + 'padding: 0.25em 0.5em;'
        + '}';

    const add_to_wishlist_button_img_style = '.add-to-wishlist > button > img {'
        + 'margin-right: 0;'
        + '}';

    const input_number_webkit_style = 'input.mho-input::-webkit-outer-spin-button, input.mho-input::-webkit-inner-spin-button {'
        + '-webkit-appearance: none;'
        + 'margin: 0;'
        + '}';

    const input_number_firefox_style = 'input.mho-input[type=number] {'
        + '-moz-appearance: textfield;'
        + '}';

    const wishlist_header = '#wishlist .mho-header, #wishlist > li {'
        + 'padding: 0 8px;'
        + 'margin: 0.125em 0;'
        + 'width: 100%;'
        + '}';

    const wishlist_even = '.tab-content #recipes-list > li:nth-child(even), #wishlist > li:nth-child(even) {'
        + 'background-color: #5c2b20;'
        + '}';

    const wishlist_header_cell = '#wishlist .mho-header > div {'
        + 'display: inline-block;'
        + 'vertical-align: middle;'
        + '}'

    const wishlist_label = '#wishlist .label {'
        + 'width: calc(100% - 775px);'
        + 'min-width: 200px;'
        + 'padding: 0 4px;'
        + '}';

    const label_text = '.label_text {'
        + 'font-size: 1.2rem;'
        + 'font-variant: small-caps;'
        + '}';

    const wishlist_cols = '#wishlist .priority, #wishlist .depot, #wishlist .bank_count, #wishlist .bag_count, #wishlist .bank_needed, #wishlist .diff {'
        + 'width: 125px;'
        + 'padding: 0 4px;'
        + '}';

    const wishlist_delete = '#wishlist .delete {'
        + 'width: 25px;'
        + 'text-align: center;'
        + '}';

    const wishlist_in_app = '#wishlist-section ul {'
        + 'padding-left: 0;'
        + '}';

    const wishlist_in_app_item = '#wishlist-section ul > li {'
        + 'display: flex;'
        + 'justify-content: space-between;'
        + '}';

    const advanced_tooltip_recipe_li = '#mho-advanced-tooltip > div.recipe > li, #item-list > li.selected > .properties > .recipe > li {'
        + 'display: flex;'
        + 'padding: 0.25em 0;'
        + '}';

    const item_recipe_li = '#item-list > li.selected > .properties > .recipe > li:not(:last-child) {'
        + 'border-bottom: 1px dotted white;'
        + '}';

    const advanced_tooltip_recipe_li_ul = '#mho-advanced-tooltip > div.recipe > li > ul {'
        + 'min-width: 0 !important;'
        + 'width: calc(100% - 15px) !important;'
        + '}';

    const large_tooltip = 'div.large-tooltip {'
        + 'width: 400px !important;'
        + 'max-width: 400px !important'
        + '}';

    const item_priority = `
        li.item[class^='priority_in'], li.item[class*=' priority_in'], img[class^='priority_in'], img[class*=' priority_in'] {
            box-shadow: inset 0 0 0.5em whitesmoke, 0 0 0.5em whitesmoke;
        }
        li.item[class^='priority_out'], li.item[class*=' priority_out'], img[class^='priority_out'], img[class*=' priority_out'] {
            box-shadow: inset 0 0 1em darkslategrey, 0 0 1em darkslategrey;
        }
        li.item.priority_trash, img.priority_trash {
            box-shadow: inset 0 0 0.5em black, 0 0 0.5em black;
        }`;

    const item_tag_food = 'div.item-tag-food::after {'
        + `background: url(${repo_img_hordes_url}status/status_haseaten.gif) 50%/contain no-repeat;`
        + '}';

    const item_tag_load = 'div.item-tag-load::after {'
        + `background: url(${repo_img_hordes_url}item/item_pile.gif) 50%/contain no-repeat;`
        + '}';

    const item_tag_hero = 'div.item-tag-hero::after {'
        + `background: url(${repo_img_hordes_url}icons/star.gif) 50%/contain no-repeat;`
        + '}';

    const item_tag_alcohol = 'div.item-tag-alcohol::after {'
        + `background: url(${repo_img_hordes_url}status/status_drunk.gif) 50%/contain no-repeat;`
        + '}';

    const item_tag_drug = 'div.item-tag-drug::after {'
        + `background: url(${repo_img_hordes_url}status/status_drugged.gif) 50%/contain no-repeat;`
        + '}';

    const item_tag_smokebomb = 'div.item-tag-smokebomb {'
        + `height: 36px;`
        + '}';

    const display_map_btn = `#${mho_display_map_id}, #${mho_store_notifications_id}, #${mho_display_expeditions_id} {`
        + 'background-color: rgba(62,36,23,.75);'
        + 'border-radius: 6px;'
        + 'color: #ddab76;'
        + 'cursor: pointer;'
        + 'font-size: 10px;'
        + 'padding: 3px 5px;'
        + 'transition: background-color .5s ease-in-out;'
        + 'display: flex;'
        + 'gap: 0.5em;'
        + '}';

    const mho_map_td = `.mho-map tr td {`
        + `border: 1px dotted;`
        + `width: 30px;`
        + `min-width: 30px;`
        + `height: 30px;`
        + `min-height: 30px;`
        + `text-align: center;`
        + `vertical-align: middle;`
        + `}`;

    const mho_ruin_td = `.mho-ruin tr td {`
        + `border: 1px dotted;`
        + `width: 25px;`
        + `min-width: 25px;`
        + `height: 25px;`
        + `min-height: 25px;`
        + `text-align: center;`
        + `vertical-align: middle;`
        + `}`;

    const dotted_background = '.dotted-background {'
        + `background-image: -moz-linear-gradient(45deg, #444 25%, transparent 25%),
                         -moz-linear-gradient(-45deg, #444 25%, transparent 25%),
                         -moz-linear-gradient(45deg, transparent 75%, #444 75%),
                         -moz-linear-gradient(-45deg, transparent 75%, #444 75%);`
        + `background-image: -webkit-gradient(linear, 0 100%, 100% 0, color-stop(.25, #444), color-stop(.25, transparent)),
                         -webkit-gradient(linear, 0 0, 100% 100%, color-stop(.25, #444), color-stop(.25, transparent)),
                         -webkit-gradient(linear, 0 100%, 100% 0, color-stop(.75, transparent), color-stop(.75, #444)),
                         -webkit-gradient(linear, 0 0, 100% 100%, color-stop(.75, transparent), color-stop(.75, #444));`
        + `background-image: -webkit-linear-gradient(45deg, #444 25%, transparent 25%),
                         -webkit-linear-gradient(-45deg, #444 25%, transparent 25%),
                         -webkit-linear-gradient(45deg, transparent 75%, #444 75%),
                         -webkit-linear-gradient(-45deg, transparent 75%, #444 75%);`
        + `background-image: -o-linear-gradient(45deg, #444 25%, transparent 25%),
                         -o-linear-gradient(-45deg, #444 25%, transparent 25%),
                         -o-linear-gradient(45deg, transparent 75%, #444 75%),
                         -o-linear-gradient(-45deg, transparent 75%, #444 75%);`
        + `background-image: linear-gradient(45deg, #444 25%, transparent 25%),
                         linear-gradient(-45deg, #444 25%, transparent 25%),
                         linear-gradient(45deg, transparent 75%, #444 75%),
                         linear-gradient(-45deg, transparent 75%, #444 75%);`
        + `-moz-background-size: 2px 2px;`
        + `background-size: 2px 2px;`
        + `-webkit-background-size: 2px 2px; /* override value for webkit */`
        + `background-position: 0 0, 1px 0, 1px -1px, 0px 1px;`
        + '}';

    let empty_bat_before_after = '.empty-bat:before, .empty-bat:after {'
        + 'position: absolute;'
        + 'content: "";'
        + 'background: black;'
        + 'display: block;'
        + 'width: 1px;'
        + 'height: 25px;'
        + '-webkit-transform: rotate(-45deg);'
        + 'transform: rotate(-45deg);'
        + 'left: 0;'
        + 'right: 0;'
        + 'top: 0;'
        + 'bottom: 0;'
        + 'margin: auto;'
        + '}';

    let empty_bat_after = '.empty-bat:after {'
        + '-webkit-transform: rotate(45deg);'
        + 'transform: rotate(45deg);'
        + '}';

    let camping_spaced_label = '.spaced-label:after {'
        + `content: '\\00a0:\\00a0'`
        + '}';

    let citizen_list_more_info_content = '.content-center-vertical.center {'
        + `justify-content: center;`
        + `min-width: 18px;`
        + `}`;

    let citizen_list_more_info_header_content = '.header-center-vertical {'
        + `text-align: center;`
        + `padding-bottom: 4px;`
        + `min-width: 18px;`
        + `}`;

    let hidden = '.mho-hidden {'
        + 'display: none !important;'
        + '}';

    let item_tag = `.mho-item-tag-large {`
        + `min-height: 18px;`
        + `height: unset !important;`
        + `}`;

    let new_changelog = `
    div.mho-new-changelog::before {
        position: absolute;
        top: -3px;
        left: -3px;
    }
    a.mho-new-changelog::before {
        position: relative;
        top: 0;
        left: 0;
    }
    .mho-new-changelog::before {
        content: '';
        width: 6px;
        aspect-ratio: 1;
        background: #4B107B;
        border-radius: 50%;
        box-shadow: 0px 0px 6px 3px #BF61CF;
        display: inline-block;
    }
    `;

    let new_version = `
    div.mho-new-version::before {
        position: absolute;
        top: -3px;
        left: -3px;
    }
    .mho-new-version::before {
        content: '';
        width: 8px;
        aspect-ratio: 1;
        background: #BF61CF;
        border-radius: 50%;
        box-shadow: 0px 0px 8px 4px #4B107B;
        display: inline-block;
    }
    `;

    let css = params_style + btn_style + mho_window_style + new_changelog + new_version
        + mho_window_style_tabs + tab_content_style + tab_content_item_list_style + tab_content_item_list_item_style + tab_content_item_list_item_selected_style + tab_content_item_list_item_not_selected_properties_style + item_category
        + parameters_informations_ul_style + li_style + recipe_style + input_number_webkit_style + input_number_firefox_style
        + mho_table_style + mho_table_header_style + mho_table_row_style + mho_table_cells_style + mho_table_cells_td_style + label_text
        + item_title_style + add_to_wishlist_button_img_style + advanced_tooltip_recipe_li + item_recipe_li + advanced_tooltip_recipe_li_ul + large_tooltip + item_list_element_style
        + wishlist_label + wishlist_header + wishlist_header_cell + wishlist_cols + wishlist_delete + wishlist_in_app + wishlist_in_app_item + wishlist_even
        + item_priority + item_tag_food + item_tag_load + item_tag_hero + item_tag_smokebomb + item_tag_alcohol + item_tag_drug
        + display_map_btn + mho_map_td + mho_ruin_td + dotted_background + empty_bat_before_after + empty_bat_after + camping_spaced_label + citizen_list_more_info_content
        + citizen_list_more_info_header_content + hidden + item_tag;

    let style = document.createElement('style');

    if (style.styleSheet) {
        style.styleSheet.cssText = css;
    } else {
        style.appendChild(document.createTextNode(css));
    }

    document.getElementsByTagName('head')[0].appendChild(style);
}

////////////////////////////
// Appels outils externes //
////////////////////////////

/** Récupère la carte de GH */
function getGHMap() {
    return new Promise((resolve, reject) => {
        let getArrow = (arrow) => {
            let arrow_sprite = arrow.firstChild.href.baseVal.replace(/^(.*)#/, '');
            switch (arrow_sprite) {
                case 'fleche_0':
                case 'fleche_0_b':
                case 'fleche_0_n':
                    return {direction: 'right', type: 'horizontal', source: '', length: 'semi', position: 'right'};
                case 'fleche_1':
                case 'fleche_1_b':
                case 'fleche_1_n':
                    return {direction: 'top', type: 'vertical', source: '', length: 'semi', position: 'top'};
                case 'fleche_2':
                case 'fleche_2_b':
                case 'fleche_2_n':
                    return {direction: 'left', type: 'horizontal', source: '', length: 'semi', position: 'left'};
                case 'fleche_3':
                case 'fleche_3_b':
                case 'fleche_3_n':
                    return {direction: 'bottom', type: 'vertical', source: '', length: 'semi', position: 'bottom'};
                case 'fleche_4':
                case 'fleche_4_b':
                case 'fleche_4_n':
                    return {direction: 'right', type: 'horizontal', source: '', length: 'semi', position: 'left'};
                case 'fleche_5':
                case 'fleche_5_b':
                case 'fleche_5_n':
                    return {direction: 'top', type: 'vertical', source: '', length: 'semi', position: 'bottom'};
                case 'fleche_6':
                case 'fleche_6_b':
                case 'fleche_6_n':
                    return {direction: 'left', type: 'horizontal', source: '', length: 'semi', position: 'right'};
                case 'fleche_7':
                case 'fleche_7_b':
                case 'fleche_7_n':
                    return {direction: 'bottom', type: 'vertical', source: '', length: 'semi', position: 'top'};
                case 'fleche_8':
                case 'fleche_8_b':
                case 'fleche_8_n':
                    return {direction: 'both', type: 'horizontal', source: '', length: 'semi', position: 'right'};
                case 'fleche_9':
                case 'fleche_9_b':
                case 'fleche_9_n':
                    return {direction: 'both', type: 'vertical', source: '', length: 'semi', position: 'top'};
                case 'fleche_10':
                case 'fleche_10_b':
                case 'fleche_10_n':
                    return {direction: 'both', type: 'horizontal', source: '', length: 'semi', position: 'left'};
                case 'fleche_11':
                case 'fleche_11_b':
                case 'fleche_11_n':
                    return {direction: 'both', type: 'vertical', source: '', length: 'semi', position: 'bottom'};
                case 'fleche_12':
                case 'fleche_12_b':
                case 'fleche_12_n':
                    return {direction: 'left', type: 'horizontal', source: '', length: 'plain', position: 'middle'};
                case 'fleche_13':
                case 'fleche_13_b':
                case 'fleche_13_n':
                    return {direction: 'bottom', type: 'vertical', source: '', length: 'plain', position: 'middle'};
                case 'fleche_14':
                case 'fleche_14_b':
                case 'fleche_14_n':
                    return {direction: 'right', type: 'horizontal', source: '', length: 'plain', position: 'middle'};
                case 'fleche_15':
                case 'fleche_15_b':
                case 'fleche_15_n':
                    return {direction: 'top', type: 'vertical', source: '', length: 'plain', position: 'middle'};
                case 'fleche_16':
                case 'fleche_16_b':
                case 'fleche_16_n':
                    return {direction: 'top', type: 'corner', source: 'right', length: '', position: ''};
                case 'fleche_17':
                case 'fleche_17_b':
                case 'fleche_17_n':
                    return {direction: 'bottom', type: 'corner', source: 'right', length: '', position: ''};
                case 'fleche_18':
                case 'fleche_18_b':
                case 'fleche_18_n':
                    return {direction: 'left', type: 'corner', source: 'top', length: '', position: ''};
                case 'fleche_19':
                case 'fleche_19_b':
                case 'fleche_19_n':
                    return {direction: 'right', type: 'corner', source: 'top', length: '', position: ''};
                case 'fleche_20':
                case 'fleche_20_b':
                case 'fleche_20_n':
                    return {direction: 'top', type: 'corner', source: 'left', length: '', position: ''};
                case 'fleche_21':
                case 'fleche_21_b':
                case 'fleche_21_n':
                    return {direction: 'bottom', type: 'corner', source: 'left', length: '', position: ''};
                case 'fleche_22':
                case 'fleche_22_b':
                case 'fleche_22_n':
                    return {direction: 'right', type: 'corner', source: 'bottom', length: '', position: ''};
                case 'fleche_23':
                case 'fleche_23_b':
                case 'fleche_23_n':
                    return {direction: 'left', type: 'corner', source: 'bottom', length: '', position: ''};
                case 'fleche_24':
                case 'fleche_24_b':
                case 'fleche_24_n':
                    return {direction: 'none', type: 'point', source: 'middle', length: 'none', position: 'middle'};
            }
        }
        getStorageItem(mho_map_key).then((mho_map) => {
            let map_html = document.createElement('div');
            map_html.innerHTML = mho_map.block;

            let new_map = [];
            let map = Array.from(map_html.querySelectorAll('.ligneCarte'));
            let x_mapping = Array.from(map[0].children).map((x) => x.innerText);
            map
                .filter((row) => Array.from(row.children).some((cell) => cell.classList.contains('caseCarte')))
                .forEach((row) => {
                    let cells = [];
                    let y;
                    Array.from(row.children).forEach((cell, index) => {
                        if (cell.classList.contains('fondNoir')) {
                            y = cell.innerText;
                        } else {
                            let cell_parts = Array.from(cell.children);

                            let new_cell = {
                                horizontal: y,
                                vertical: x_mapping[index],
                                town: cell.querySelector('.caseVille'),
                                bat: cell.querySelector('.bat'),
                                my_pos: cell.querySelector('.posJoueur'),
                                expedition_here: cell_parts.some((cell_part) => cell_part.classList.contains('expeditionVille') && cell_part.children.length > 0 /*&& Array.from(cell_part.children).some((expedition_arrow) => expedition_arrow.classList.contains('selected_expe'))*/),
                                expedition_arrows: [],/*Array.from(cell_parts.find((cell_part) => cell_part.classList.contains('expeditionVille')).children).map((arrow) => getArrow(arrow)), */
                                not_yet_visited: cell.querySelector('.zone-NonExplo'),
                                not_visited_today: !cell.querySelector('.danger') && !cell.querySelector('.caseVille'),
                                zombies: cell.querySelector('.danger') ? Array.from(cell.querySelector('.danger').classList).filter((class_name) => class_name.startsWith('zone-danger')).map((class_name) => class_name.replace('zone-danger', ''))[0] : undefined,
                                empty: cell.querySelector('.epuise'),
                                empty_bat: cell.querySelector('.bat') && cell.querySelector('.bat').firstChild.href.baseVal.replace(/^(.*)#/, '') === 'bat-e',
                                ruin: cell.querySelector('.bat') && cell.querySelector('.bat').firstChild.href.baseVal.replace(/^(.*)#/, '') === 'bat-r',
                            };
                            cells.push(new_cell);
                        }
                    });
                    new_map.push(cells);
                });
            resolve({map: new_map, vertical_mapping: x_mapping});
        });
    });
}


/** Récupère la carte de Gest'Hordes */
function getGHRuin() {
    return new Promise((resolve, reject) => {
        getStorageItem(mho_map_key).then((mho_map) => {
            if (mho_map.ruin) {
                let map_html = document.createElement('div');
                map_html.innerHTML = mho_map.ruin;

                let new_map = [];
                let rows = Array.from(map_html.querySelector('#carteRuine')?.querySelector('tbody')?.children);
                let x_mapping = Array.from(rows[0].children).map((x) => x.innerText);
                rows
                    .filter((row) => Array.from(row.children).some((cell) => cell.classList.contains('caseCarteRuine')))
                    .forEach((row, row_index, rows_array) => {
                        let new_cells = [];
                        let cells = Array.from(row.children);
                        let y;
                        cells.forEach((cell, cell_index, cell_array) => {
                            if (cell.classList.contains('bordCarteRuine')) {
                                y = cell.innerText;
                            } else {

                                let cell_parts = Array.from(cell.children);
                                let new_cell = {
                                    horizontal: y,
                                    vertical: x_mapping[cell_index],
                                    borders: '0000',
                                    zombies: cell.firstElementChild.getAttribute('data-z')
                                };

                                let img_path = cell.querySelector('.ruineCarte')?.firstElementChild.href.baseVal.replace(/^(.*)#/, '');
                                switch (img_path) {
                                    case 'ruineCarte_16':
                                        new_cell.borders = 'exit';
                                        break;
                                    case 'ruineCarte_15':
                                        new_cell.borders = '1111';
                                        break;
                                    case 'ruineCarte_7':
                                        new_cell.borders = '1110';
                                        break;
                                    case 'ruineCarte_11':
                                        new_cell.borders = '1101';
                                        break;
                                    case 'ruineCarte_3':
                                        new_cell.borders = '1100';
                                        break;
                                    case 'ruineCarte_13':
                                        new_cell.borders = '1011';
                                        break;
                                    case 'ruineCarte_5':
                                        new_cell.borders = '1010'; // ?
                                        break;
                                    case 'ruineCarte_18':
                                        new_cell.borders = '1010'; // ?
                                        break;
                                    case 'ruineCarte_9':
                                        new_cell.borders = '1001';
                                        break;
                                    case 'ruineCarte_1':
                                        new_cell.borders = '1000';
                                        break;
                                    case 'ruineCarte_14':
                                        new_cell.borders = '0111';
                                        break;
                                    case 'ruineCarte_6':
                                        new_cell.borders = '0110';
                                        break;
                                    case 'ruineCarte_10':
                                        new_cell.borders = '0101';
                                        break;
                                    case 'ruineCarte_2':
                                        new_cell.borders = '0100';
                                        break;
                                    case 'ruineCarte_12':
                                        new_cell.borders = '0011';
                                        break;
                                    case 'ruineCarte_4':
                                        new_cell.borders = '0010';
                                        break;
                                    case 'ruineCarte_8':
                                        new_cell.borders = '0001';
                                        break;
                                    default:
                                        new_cell.borders = '0000';
                                        break;
                                }

                                switch (cell.firstElementChild.getAttribute('data-porte')) {
                                    case 'pC':
                                        new_cell.door = 'item_lock';
                                        break;
                                    case 'p':
                                        new_cell.door = 'item_door';
                                        break;
                                    case 'pD':
                                        new_cell.door = 'item_classicKey';
                                        break;
                                    case 'pP':
                                        new_cell.door = 'item_bumpKey';
                                        break;
                                    case 'pM':
                                        new_cell.door = 'item_magneticKey';
                                        break;
                                    default:
                                        break;
                                }
                                new_cells.push(new_cell);
                            }
                        });
                        new_map.push(new_cells);
                    });
                resolve({map: new_map, vertical_mapping: x_mapping});
            }
        })
    });
}


/** Récupère la carte de GH */
function getBBHMap() {
    return new Promise((resolve, reject) => {
        fetcher(`https://bbh.fred26.fr/?cid=5-${mh_user.townDetails?.townId}&pg=map`)
            .then((response) => {
                if (response.status === 200) {
                    return response.text();
                } else {
                    return convertResponsePromiseToError(response);
                }
            })
            .then((response) => {
                let new_map = [];
                let map = response.querySelector('#carte');
                if (map) {
                    let x_mapping = Array.from(Array.from(map.children)[0].querySelectorAll('td')).map((x) => x.innerText);
                    x_mapping.push('');
                    x_mapping.splice(0, 0, '');
                    if (map.querySelector('#cases')) {
                        Array.from(map.querySelector('#cases')?.querySelectorAll('tr') || [])
                            .forEach((row, row_index) => {
                                let cells = [];
                                let y;
                                Array.from(row.children).forEach((cell, cell_index) => {
                                    let cell_parts = Array.from(cell.querySelector('.divs')?.children);

                                    let new_cell = {
                                        horizontal: map.querySelector('.lgd_l')?.firstElementChild.children[row_index].firstElementChild.innerText,
                                        vertical: x_mapping[cell_index],
                                        town: cell.querySelector('.door'),
                                        bat: cell.querySelector('.bat'),
                                        my_pos: cell.querySelector('.me'),
                                        expedition_here: cell_parts.some((cell_part) => cell_part.classList.contains('expeditionVille') && cell_part.children.length > 0 /*&& Array.from(cell_part.children).some((expedition_arrow) => expedition_arrow.classList.contains('selected_expe'))*/),
                                        expedition_arrows: [],
                                        not_yet_visited: cell.querySelector('.nv'),
                                        not_visited_today: cell.querySelector('.nvt'),
                                        zombies: cell.querySelector('.zombies') ? Array.from(cell.querySelector('.zombies').classList).find((class_name) => class_name.startsWith('z_')).replace('z_', '') : undefined,
                                        empty: cell.querySelector('.praf'),
                                        empty_bat: cell.querySelector('.mark1'),
                                        ruin: cell.querySelector('.tag_11')
                                    };
                                    cells.push(new_cell);
                                });
                                new_map.push(cells);
                            });
                        resolve({map: new_map, vertical_mapping: x_mapping});
                    }
                }
                reject();
            })
            .catch((error) => {
                addError(error);
                reject(error);
            });
    });
}


/** Récupère la carte de BBH */
function getBBHRuin() {
    return new Promise((resolve, reject) => {
        getStorageItem(mho_map_key).then((mho_map) => {
            if (mho_map.ruin) {
                let map_html = document.createElement('div');
                map_html.innerHTML = mho_map.ruin;

                let new_map = [];
                let rows = Array.from(map_html.querySelector('#plan').firstElementChild.children);
                let x_mapping = Array.from(rows[0].children).map((x) => x.innerText);
                rows
                    .filter((row) => Array.from(row.children).some((cell) => cell.querySelector('.divs')))
                    .forEach((row, row_index, rows_array) => {
                        let new_cells = [];
                        let cells = Array.from(row.children);
                        let y;
                        cells.forEach((cell, cell_index, cell_array) => {
                            if (!cell.querySelector('.divs')) {
                                y = cell.innerText;
                            } else {

                                let cell_parts = Array.from(cell.firstElementChild.children);

                                let div_zombies = cell_parts.find((cell_part) => Array.from(cell_part.classList).some((class_name) => class_name.startsWith('z')))
                                let zombies = div_zombies ? Array.from(div_zombies.classList).find(() => (class_name) => class_name.startsWith('z')) : undefined;

                                let new_cell = {
                                    horizontal: y,
                                    vertical: x_mapping[cell_index],
                                    borders: '0000',
                                    zombies: zombies ? zombies[1] : ''
                                };

                                let div_path = cell_parts.find((cell_part) => Array.from(cell_part.classList).some((class_name) => class_name.startsWith('m')))
                                let img_path = div_path ? Array.from(div_path.classList).find(() => (class_name) => class_name.startsWith('m')) : undefined;
                                switch (img_path) {
                                    case 'm1':
                                        new_cell.borders = 'exit';
                                        break;
                                    case 'm2':
                                        new_cell.borders = '0000';
                                        break;
                                    case 'm11':
                                        new_cell.borders = '0101';
                                        break;
                                    case 'm12':
                                        new_cell.borders = '1010';
                                        break;
                                    case 'm13':
                                        new_cell.borders = '1111';
                                        break;
                                    case 'm21':
                                        new_cell.borders = '0111';
                                        break;
                                    case 'm22':
                                        new_cell.borders = '1110';
                                        break;
                                    case 'm23':
                                        new_cell.borders = '1101';
                                        break;
                                    case 'm24':
                                        new_cell.borders = '1011';
                                        break;
                                    case 'm31':
                                        new_cell.borders = '0110';
                                        break;
                                    case 'm32':
                                        new_cell.borders = '1100';
                                        break;
                                    case 'm33':
                                        new_cell.borders = '0011';
                                        break;
                                    case 'm34':
                                        new_cell.borders = '1001';
                                        break;
                                    case 'm41':
                                        new_cell.borders = '0100';
                                        break;
                                    case 'm42':
                                        new_cell.borders = '1000';
                                        break;
                                    case 'm43':
                                        new_cell.borders = '0001';
                                        break;
                                    case 'm44':
                                        new_cell.borders = '0010';
                                        break
                                    default:
                                        new_cell.borders = '0000';
                                        break;
                                }

                                let div_door = cell_parts.find((cell_part) => Array.from(cell_part.classList).some((class_name) => class_name.startsWith('p')))
                                let img_door = div_door ? Array.from(div_door.classList).find(() => (class_name) => class_name.startsWith('p')) : undefined;
                                if (img_door) {
                                    switch (img_door) {
                                        case 'p2':
                                            new_cell.door = 'item_lock';
                                            break;
                                        case 'p1':
                                            new_cell.door = 'item_door';
                                            break;
                                        case 'p5':
                                            new_cell.door = 'item_classicKey';
                                            break;
                                        case 'p4':
                                            new_cell.door = 'item_bumpKey';
                                            break;
                                        case 'p3':
                                            new_cell.door = 'item_magneticKey';
                                            break;
                                        default:
                                            break;
                                    }
                                }
                                new_cells.push(new_cell);
                            }
                        });
                        new_map.push(new_cells);
                    });
                resolve({map: new_map, vertical_mapping: x_mapping});
            }
        })
    });
}

/** Récupère la carte de FataMorgana */
function getFMMap() {
    return new Promise((resolve, reject) => {
        let map_html = document.createElement('div');

        getStorageItem(mho_map_key).then((mho_map) => {
            map_html.innerHTML = mho_map.block;

            let new_map = [];
            let map = Array.from(map_html.querySelector('#map')?.children);
            let x_mapping = Array.from(map[0].children).map((x) => x.innerText);

            map
                .filter((row) => Array.from(row.children).some((cell) => cell.classList.contains('mapzone')))
                .forEach((row) => {
                    let cells = [];
                    let y;
                    Array.from(row.children).forEach((cell, index) => {
                        if (cell.classList.contains('mapruler')) {
                            y = cell.innerText;
                        } else {
                            let cell_parts = Array.from(cell.children);

                            let new_cell = {
                                horizontal: y,
                                vertical: x_mapping[index],
                                town: cell.classList.contains('city'),
                                bat: cell_parts.some((cell_part) => cell_part.classList.contains('building')),
                                my_pos: cell_parts.some((cell_part) => cell_part.classList.contains('posJoueur')),
                                expedition_here: cell_parts.some((cell_part) => cell_part.classList.contains('route-counter')),
                                expedition_arrows: [],
                                not_yet_visited: cell.classList.contains('nyv'),
                                not_visited_today: cell.classList.contains('nvt'),
                                zombies: Array.from(cell.classList).filter((class_name) => class_name.startsWith('danger')).map((class_name) => class_name.replace('danger', ''))[0],
                                empty: !cell.querySelector('.zone-status-full'),
                                empty_bat: cell.querySelector('.depleted-building'),
                                ruin: cell.querySelector('.explorable-building'),
                            };
                            cells.push(new_cell);
                        }
                    });
                    new_map.push(cells);
                });
            resolve({map: new_map, vertical_mapping: x_mapping});
        });
    });
}

/** Récupère la carte de FataMorgana */
function getFMRuin() {
    return new Promise((resolve, reject) => {
        getStorageItem(mho_map_key).then((mho_map) => {
            if (mho_map.ruin) {
                let map_html = document.createElement('div');
                map_html.innerHTML = mho_map.ruin;

                let new_map = [];
                let rows = Array.from(map_html.querySelector('#ruinmap')?.children);
                let x_mapping = Array.from(rows[0].children).map((x) => x.innerText);
                rows
                    .filter((row) => Array.from(row.children).some((cell) => cell.classList.contains('mapzone')))
                    .forEach((row, row_index, rows_array) => {
                        let new_cells = [];
                        let cells = Array.from(row.children);
                        let y;
                        cells.forEach((cell, cell_index, cell_array) => {
                            if (cell.classList.contains('mapruler')) {
                                y = cell.innerText;
                            } else {
                                let new_cell = {
                                    horizontal: y,
                                    vertical: x_mapping[cell_index],
                                    borders: '0000',
                                    zombies: cell.getAttribute('z')
                                };

                                let img = Array.from(cell.classList).find((class_name) => class_name.startsWith('tile-'));
                                switch (img) {
                                    case 'tile-1':
                                        new_cell.borders = '0100';
                                        break;
                                    case 'tile-2':
                                        new_cell.borders = '0010';
                                        break;
                                    case 'tile-3':
                                        new_cell.borders = '0001';
                                        break;
                                    case 'tile-4':
                                        new_cell.borders = '1000';
                                        break;
                                    case 'tile-5':
                                        if (cell.classList.contains('ruinEntry')) {
                                            new_cell.borders = 'exit';
                                        } else {
                                            new_cell.borders = '0101';
                                        }
                                        break;
                                    case 'tile-6':
                                        new_cell.borders = '1010';
                                        break;
                                    case 'tile-7':
                                        new_cell.borders = '1111';
                                        break;
                                    case 'tile-8':
                                        new_cell.borders = '0110';
                                        break;
                                    case 'tile-9':
                                        new_cell.borders = '0011';
                                        break;
                                    case 'tile-10':
                                        new_cell.borders = '1001';
                                        break;
                                    case 'tile-11':
                                        new_cell.borders = '1100';
                                        break;
                                    case 'tile-12':
                                        new_cell.borders = '1110';
                                        break;
                                    case 'tile-13':
                                        new_cell.borders = '0111';
                                        break;
                                    case 'tile-14':
                                        new_cell.borders = '1011';
                                        break;
                                    case 'tile-15':
                                        new_cell.borders = '1101';
                                        break;
                                    case 'tile-0':
                                    default:
                                        new_cell.borders = '0000';
                                        break;
                                }

                                if (cell.classList.contains('doorlock-1')) {
                                    new_cell.door = 'item_lock';
                                } else if (cell.classList.contains('doorlock-2')) {
                                    new_cell.door = 'item_door';
                                } else if (cell.classList.contains('doorlock-3')) {
                                    new_cell.door = 'item_classicKey';
                                } else if (cell.classList.contains('doorlock-4')) {
                                    new_cell.door = 'item_bumpKey';
                                } else if (cell.classList.contains('doorlock-5')) {
                                    new_cell.door = 'item_magneticKey';
                                }
                                new_cells.push(new_cell);
                            }
                        });
                        new_map.push(new_cells);
                    });
                resolve({map: new_map, vertical_mapping: x_mapping});
            }
        })
    });
}

////////////////
// Appels API //
////////////////

function getItems() {
    return new Promise((resolve, reject) => {
        fetcher(api_url + '/Fetcher/items' + (mh_user && mh_user.townDetails && mh_user.townDetails?.townId > 0 ? ('?townId=' + mh_user.townDetails?.townId) : ''))
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    return convertResponsePromiseToError(response);
                }
            })
            .then((response) => {
                items = response
                    .sort((item_a, item_b) => {
                        if (item_a.category.ordering > item_b.category.ordering) {
                            return 1;
                        } else if (item_a.category.ordering === item_b.category.ordering) {
                            return 0;
                        } else {
                            return -1;
                        }
                    })
                    .filter((item) => is_mh_beta ? true : +item.id !== 302);
                let wiki_btn = document.getElementById(wiki_btn_id);
                if (wiki_btn) {
                    wiki_btn.setAttribute('style', 'display: inherit');
                }
                resolve(items);
            })
            .catch((error) => {
                addError(error);
                reject(error);
            });
    });
}

function getRuins() {
    return new Promise((resolve, reject) => {
        if (!ruins) {
            fetcher(api_url + '/Fetcher/ruins?userKey=' + external_app_id)
                .then((response) => {
                    if (response.status === 200) {
                        return response.json();
                    } else {
                        return convertResponsePromiseToError(response);
                    }
                })
                .then((response) => {
                    ruins = response.sort((a, b) => {
                        if (getI18N(a.label) < getI18N(b.label)) {
                            return -1;
                        }
                        if (getI18N(a.label) > getI18N(b.label)) {
                            return 1;
                        }
                        return 0;
                    });

                    ruins.forEach((ruin) => {
                        ruin.drops.sort((drop_a, drop_b) => {
                            if (drop_a.probability < drop_b.probability) {
                                return 1;
                            } else if (drop_b.probability < drop_a.probability) {
                                return -1;
                            } else {
                                return 0;
                            }
                        });
                    })
                    resolve(ruins);
                })
                .catch((error) => {
                    addError(error);
                    reject(error);
                });
        } else {
            resolve(ruins);
        }
    })
}

/** Récupère les informations de la ville */
function getToken(force, stop) {
    return new Promise((resolve, reject) => {
        if (external_app_id) {
            let tokenReceived = async () => {
                console.log('MHO - I am...', mh_user);

                if (mh_user !== '' && mh_user.townDetails?.townId) {
                    let get_items_promise = getItems();
                    let get_wishlist_promise = getWishlist();
                    if (pageIsDesert()) {
                        let get_ruins_promise = getRuins();
                        let get_map_promise = getMap();
                        await Promise.all([get_items_promise, get_ruins_promise, get_wishlist_promise, get_map_promise]);
                    } else {
                        let get_wishlist_promise = getWishlist()
                        await Promise.all([get_items_promise, get_wishlist_promise]);
                    }
                }
            }

            if (!isValidToken() || force) {
                fetcherWithoutBearer(api_url + '/Authentication/Token?userKey=' + external_app_id)
                    .then((response) => {
                        if (response.status === 200) {
                            return response.json();
                        } else {
                            return convertResponsePromiseToError(response);
                        }
                    })
                    .then((response) => {
                        token = response;
                        mh_user = token.simpleMe;
                        if (!mh_user || mh_user.id === 0 && mh_user.townDetails?.townId === 0) {
                            mh_user = '';
                        }
                        setStorageItem(mh_user_key, mh_user);
                        setStorageItem(mho_token_key, token);

                        tokenReceived().then(() => resolve());
                    })
                    .catch((error) => {
                        if (error.status === 400 && !stop) {
                            /** Si on a une erreur 400 ça peut être parce que la clé d'app n'est pas bonne : on tente de récupérer la clé d'app une seule et unique fois pour essayer de rendre ça transparent pour l'utilisateur */
                            external_app_id = undefined;
                            getApiKey().then(() => {
                                getToken(false, true).then(() => {
                                    resolve();
                                });
                            });
                        } else {
                            addError(error);
                            resolve();
                        }
                    });
            } else {
                mh_user = token.simpleMe;
                tokenReceived().then(() => resolve());
            }
        } else {
            resolve();
        }
    });
}

/** Récupère les informations de la ville */
function getCitizens() {
    return new Promise((resolve, reject) => {
        getHeroSkills().then((hero_skills) => {
            fetcher(api_url + `/Fetcher/citizens?userId=${mh_user.id}&townId=${mh_user.townDetails?.townId}`)
                .then((response) => {
                    if (response.status === 200) {
                        return response.json();
                    } else {
                        return convertResponsePromiseToError(response);
                    }
                })
                .then((response) => {
                    citizens = response;
                    citizens.citizens = Object.keys(citizens.citizens).map((key) => citizens.citizens[key])
                    resolve(citizens);
                })
                .catch((error) => {
                    addError(error);
                    reject(error);
                });

        });
    });
}

/** Récupère les informations de la banque */
function getBank() {
    return new Promise((resolve, reject) => {
        fetcher(api_url + '/Fetcher/bank')
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
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
                    } else if (item_a.category.ordering === item_b.category.ordering) {
                        return 0;
                    } else {
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
function getWishlist() {
    return new Promise((resolve, reject) => {
        fetcher(api_url + '/wishlist?townId=' + mh_user.townDetails?.townId)
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    return convertResponsePromiseToError(response);
                }
            })
            .then((response) => {
                let new_wishlist = {...response};
                let new_wishlist_wishlist = {};
                for (let key in new_wishlist.wishList) {
                    let wishlist_zone = Object.keys(new_wishlist.wishList[key])
                        .map((item_key) => new_wishlist.wishList[key][item_key])
                        .map((item) => {
                            if (item.priority < 0) {
                                item.priority_main = -1;
                            } else if (item.priority < 1000) {
                                item.priority_main = 0;
                            } else if (item.priority < 2000) {
                                item.priority_main = 1;
                            } else if (item.priority < 3000) {
                                item.priority_main = 2;
                            } else {
                                item.priority_main = 3;
                            }
                            return item;
                        })
                        .sort((item_a, item_b) => item_b.priority > item_a.priority);
                    wishlist_zone.forEach((item) => {
                        item.item.img = fixMhCompiledImg(item.item.img);
                    });
                    new_wishlist_wishlist[key] = [...wishlist_zone];
                }
                new_wishlist.wishList = new_wishlist_wishlist;
                wishlist = new_wishlist;
                resolve(wishlist);
            })
            .catch((error) => {
                wishlist = undefined;
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
        fetcher(api_url + '/wishlist/add/' + item.id + '?userId=' + mh_user.id + '&townId=' + mh_user.townDetails?.townId, {
            method: 'POST'
        })
            .then((response) => {
                if (response.status === 200) {
                    return response.text();
                } else {
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
function updateExternalTools() {
    return new Promise(async (resolve, reject) => {
        let convertImgToItem = (img) => {
            return items?.find((item) => img.src.replace(/(.*)\/(\w+)\.(\w+)\.(\w+)/, '$1/$2.$4').indexOf(item.img) >= 0);
        }

        let convertListOfSingleObjectsIntoListOfCountedObjects = (objects) => {
            let object_map = [];
            objects.forEach((object) => {
                let object_in_map = object_map.find((_object_in_map) => _object_in_map.id === object.id && _object_in_map.isBroken === object.isBroken);
                if (object_in_map) {
                    object_in_map.count += 1;
                } else if (object) {
                    object.count = 1;
                    object_map.push(object);
                }
            });
            return object_map;
        }

        let data = {};
        let nb_dead_zombies = +document.querySelectorAll('.actor.splatter').length;

        data.townDetails = {
            townX: mh_user.townDetails?.townX,
            townY: mh_user.townDetails?.townY,
            townid: mh_user.townDetails?.townId,
            isChaos: mh_user.townDetails?.isChaos,
        };

        data.map = {}
        data.map.toolsToUpdate = {
            isBigBrothHordes: mho_parameters && mho_parameters.update_bbh && !is_mh_beta ? 'api' : 'none',
            isFataMorgana: mho_parameters && mho_parameters.update_fata ? (pageIsDesert() && ((mho_parameters.update_fata_killed_zombies && nb_dead_zombies > 0) || (mho_parameters.update_fata_devastated && mh_user.townDetails?.isChaos)) ? 'cell' : 'api') : 'none',
            isGestHordes: mho_parameters && mho_parameters.update_gh ? (pageIsDesert() && ((mho_parameters.update_gh_killed_zombies && nb_dead_zombies > 0) || (mho_parameters.update_gh_devastated && mh_user.townDetails?.isChaos)) ? 'cell' : 'api') : 'none',
            isMyHordesOptimizer: mho_parameters && mho_parameters.update_mho ? (pageIsDesert() && ((mho_parameters.update_mho_killed_zombies && nb_dead_zombies > 0) || (mho_parameters.update_mho_devastated && mh_user.townDetails?.isChaos)) ? 'cell' : 'api') : 'none'
        };

        let position = getCurrentPosition();
        let citizen_list = Array.from(document.querySelectorAll('.citizen-box .username[x-user-id]') || [])?.map((citizen_box) => {
            return {
                id: +citizen_box.getAttribute('x-user-id'),
                userName: citizen_box.innerText,
                job: citizen_box.parentElement.parentElement.querySelector('img[src*=professions]').src.replace(/.*professions\/(\w+).*/, '$1'),
                row: citizen_box
            }
        });

        if (!citizen_list || citizen_list.length === 0) {
            citizen_list = [{id: mh_user.id, userName: mh_user.userName, job: mh_user.jobDetails.uid}];
        }

        // Mise à jour en ville chaos
        if (((mho_parameters.update_gh && mho_parameters.update_gh_devastated) || (mho_parameters.update_mho && mho_parameters.update_mho_devastated) || (mho_parameters.update_fata && mho_parameters.update_fata_devastated))
            && pageIsDesert() && mh_user.townDetails?.isChaos) {
            let objects = Array.from(document.querySelector('.inventory.desert')?.querySelectorAll('li.item') || []).map((desert_item) => {
                let item = convertImgToItem(desert_item.querySelector('img'));
                return {id: item?.id, isBroken: desert_item.classList.contains('broken')};
            });

            let content = {
                x: +position[0],
                y: +position[1],
                zombies: +document.querySelectorAll('.actor.zombie').length,
                zoneEmpty: !!document.querySelector('#mgd-empty-zone-note'),
                objects: convertListOfSingleObjectsIntoListOfCountedObjects(objects),
                citizenId: citizen_list.map((citizen) => citizen.id)
            }
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
            let content = {
                x: +position[0],
                y: +position[1],
                deadZombies: nb_dead_zombies,
                citizenId: citizen_list.map((citizen) => citizen.id)
            }

            if (data.map.cell) {
                data.map.cell.deadZombies = nb_dead_zombies;
                data.map.cell.citizenId = content.citizenId;
            } else {
                data.map.cell = content;
            }
        }

        // Mise à jour des marqueurs issus des métiers
        if (((mho_parameters.update_mho && mho_parameters.update_mho_job_markers)
                || (mho_parameters.update_fata && mho_parameters.update_fata_job_markers))
            && pageIsDesert()) {
            if (mh_user.jobDetails.uid === 'dig') {
                let content = {
                    x: +position[0],
                    y: +position[1],
                    scavNextCells: {
                        north: !!document.querySelector('.scavenger-sense-north.scavenger-sense-1'),
                        east: !!document.querySelector('.scavenger-sense-east.scavenger-sense-1'),
                        south: !!document.querySelector('.scavenger-sense-south.scavenger-sense-1'),
                        west: !!document.querySelector('.scavenger-sense-west.scavenger-sense-1')
                    },
                    citizenId: citizen_list.map((citizen) => citizen.id)
                }

                if (data.map.cell) {
                    data.map.cell.scavNextCells = content.scavNextCells;
                    data.map.cell.citizenId = content.citizenId;
                } else {
                    data.map.cell = content;
                }
            } else if (mh_user.jobDetails.uid === 'vest') {
                let zone_scout_level_src = document.querySelector('.zone-scout')?.querySelector('img').src;
                let index = zone_scout_level_src.indexOf(hordes_img_url);
                zone_scout_level_src = zone_scout_level_src.slice(index).replace(hordes_img_url, '')
                let content = {
                    x: +position[0],
                    y: +position[1],
                    scoutNextCells: {
                        north: +document.querySelector('.scout-sense-north')?.querySelector('text')?.innerHTML ?? undefined,
                        east: +document.querySelector('.scout-sense-east')?.querySelector('text')?.innerHTML ?? undefined,
                        south: +document.querySelector('.scout-sense-south')?.querySelector('text')?.innerHTML ?? undefined,
                        west: +document.querySelector('.scout-sense-west')?.querySelector('text')?.innerHTML ?? undefined
                    },
                    scoutZoneLvl: +fixMhCompiledImg(zone_scout_level_src).replace(/\D/g, '') ?? undefined,
                    citizenId: citizen_list.map((citizen) => citizen.id)
                }

                if (data.map.cell) {
                    data.map.cell.scoutNextCells = content.scoutNextCells;
                    data.map.cell.scoutZoneLvl = content.scoutZoneLvl;
                    data.map.cell.citizenId = content.citizenId;
                } else {
                    data.map.cell = content;
                }
            }
        }

        // Mise à jour du contenu des sacs
        if (mho_parameters.update_mho && mho_parameters.update_mho_bags) {

            data.bags = {}
            data.bags.contents = [];
            data.bags.toolsToUpdate = {
                isBigBrothHordes: false,
                isFataMorgana: false,
                isGestHordes: false,
                isMyHordesOptimizer: mho_parameters && mho_parameters.update_mho_bags
            };

            let rucksacks = [];
            let my_rusksack = Array.from(document.querySelector('.pointer.rucksack')?.querySelectorAll('li.item:not(.locked)') || []).map((rucksack_item) => {
                let item = convertImgToItem(rucksack_item.querySelector('img'));
                if (item) {
                    return {id: item.id, isBroken: rucksack_item.classList.contains('broken')};
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
                        let item = convertImgToItem(rucksack_item.querySelector('img'));
                        return {id: item?.id, isBroken: rucksack_item.classList.contains('broken')};
                    });

                    rucksacks.push({
                        userId: escort_id,
                        objects: convertListOfSingleObjectsIntoListOfCountedObjects(escort_rucksack),
                    });
                })
            }

            data.bags.contents = rucksacks;
        }


        // Mise à jour du contenu du coffre
        if (mho_parameters.update_mho && mho_parameters.update_mho_chest && pageIsHouse()) {

            data.chest = {}
            data.chest.contents = [];
            data.chest.toolsToUpdate = {
                isBigBrothHordes: false,
                isFataMorgana: false,
                isGestHordes: false,
                isMyHordesOptimizer: mho_parameters && mho_parameters.update_mho_chest
            };

            let chest_elements = Array.from(document.querySelector('.inventory.chest')?.querySelectorAll('li.item:not(.locked)') || []).map((chest_item) => {
                let item = convertImgToItem(chest_item.querySelector('img'));
                return {id: item.id, isBroken: chest_item.classList.contains('broken')};
            });

            data.chest.contents = convertListOfSingleObjectsIntoListOfCountedObjects(chest_elements);
        }


        /** Récupération des pouvoirs héroïques */
        if (((mho_parameters.update_gh && mho_parameters.update_gh_ah) || (mho_parameters.update_mho && mho_parameters.update_mho_actions)) && (pageIsDesert() || pageIsHouse())) {

            let no_interaction = document.querySelector('.no-interaction');

            data.heroicActions = {}
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
                    }
                    data.heroicActions.actions.push(action);
                }
            } else if (!no_interaction) {
                let action = {
                    locale: lang,
                    label: 'Empty',
                    value: pageIsDesert() ? 0 /* 'desert' */ : 1 /* 'town' */
                }
                data.heroicActions.actions.push(action);
            }

            let apag = document.querySelector('.pointer.rucksack [src*=item_photo]');
            if (apag) {
                let action = {
                    locale: lang,
                    label: apag.alt,
                    value: +apag.src.replace(/.*item_photo_(\d).*/, '$1') || 0
                }
                data.heroicActions.actions.push(action);
            }

            if (pageIsDesert()) {
                let pef = document.querySelector('ul.special_actions [src*=armag]');
                if (pef) {
                    let action = {
                        locale: lang,
                        label: 'PEF',
                        value: 1
                    }
                    data.heroicActions.actions.push(action);
                } else if (!no_interaction) {
                    let action = {
                        locale: lang,
                        label: 'PEF',
                        value: 0
                    }
                    data.heroicActions.actions.push(action);
                }
            }
        }

        /** Récupération des améliorations de maison */
        if (((mho_parameters.update_gh && mho_parameters.update_gh_amelios) || (mho_parameters.update_mho && mho_parameters.update_mho_house)) && pageIsAmelio()) {
            data.amelios = {}
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
                    } else {
                        data.amelios.values[name] = !amelio.querySelector('button[x-upgrade-id]') ? 1 : 0;
                    }
                });
            }
            let house_level = +document.querySelector('[x-tab-group="home-main"][x-tab-id="values"] .town-summary')?.querySelector('.row-detail img')?.alt || undefined;
            data.amelios.values.house = house_level;
        }

        /** Récupération des status */
        if ((mho_parameters.update_mho && mho_parameters.update_mho_status) || (mho_parameters.update_gh && mho_parameters.update_gh_status)) {
            data.status = {}
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
            }
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
            }

            let arrivals = logs.filter((log) => normalizeString(log.innerText).indexOf(normalizeString(getI18N(arrivals_texts))) > -1).map((log) => {
                return {
                    time: log.querySelector('.log-part-time')?.innerText,
                    citizen: log.querySelector('.log-part-content .container span')?.innerText
                };
            });

            let now = document.querySelector('.clock [x-current-time]').innerText;

            citizen_list
                .filter((citizen) => { // On ne garde que les citoyens actuellement en train de fouiller
                    let is_digging = false;
                    if (citizen.id === mh_user.id) { // Il s'agit de l'utilisateur qui a cliqué sur le bouton
                        is_digging = document.querySelector('#mgd-digging-note [x-countdown-to]') ? true : false
                    } else { // Les autres
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
                    } else { // Sinon, on se base sur le cooldown
                        start_date = nb_failed_digs === 0 ? null : failed_digs[failed_digs.length - 1].querySelector('.log-part-time').innerText;
                    }

                    let nb_digs;
                    if (start_date) {
                        let now_minutes = (+now.split(':')[0] * 60) + (+now.split(':')[1]);
                        let start_date_minutes = (+start_date.split(':')[0] * 60) + (+start_date.split(':')[1]);

                        let nb_minutes_digging = now_minutes - start_date_minutes; // Le nombre total de minutes passées à fouiller
                        nb_digs = Math.floor(nb_minutes_digging / nb_minutes_for_dig) + 1;

                    } else {
                        nb_digs = 1;
                    }
                    data.successedDig.values.push({
                        citizenId: citizen.id,
                        successDigs: nb_digs - nb_failed_digs,
                        totalDigs: nb_digs
                    })
                });
        }

        /** Récupération du bain */
        let bath_taken;
        if ((mho_parameters.update_mho && mho_parameters.update_mho_status) && pageIsHouse()) {
            let bath_row = document.querySelector('.heroic_action img[src*=pool]')?.parentElement;
            if (bath_row) {
                if (bath_row.attributes.disabled) {
                    // si barré = le chantier est construit et le bain a été pris
                    bath_taken = true;
                } else {
                    bath_taken = false;
                    // si pas barré = le chantier est construit et le bain n'a pas été pris
                }
            }
            await saveBath(bath_taken);
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

/** Récupère la liste complète des pouvoirs héros */
function getHeroSkills() {
    return new Promise((resolve, reject) => {
        if (!hero_skills) {
            fetcher(api_url + '/Fetcher/heroSkills')
                .then((response) => {
                    if (response.status === 200) {
                        return response.json();
                    } else {
                        return convertResponsePromiseToError(response);
                    }
                })
                .then((response) => {
                    hero_skills = response.sort((a, b) => {
                        if (a.daysNeeded > b.daysNeeded) {
                            return 1;
                        } else if (a.daysNeeded === b.daysNeeded) {
                            return 0;
                        } else {
                            return -1;
                        }
                    });
                    resolve(hero_skills);
                })
                .catch((error) => {
                    addError(error);
                    reject(error);
                });
        } else {
            resolve(hero_skills);
        }
    });
}


/** Récupère les traductions de la chaine de caractères */
function getTranslation(string_to_translate, source_language) {
    return new Promise((resolve, reject) => {
        if (string_to_translate && string_to_translate !== '') {
            let locale = 'locale=' + source_language;
            let sourceString = 'sourceString=' + string_to_translate;
            fetcher(api_url + '/Translation?' + locale + '&' + sourceString)
                .then((response) => {
                    if (response.status === 200) {
                        return response.json();
                    } else {
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
function getRecipes() {
    return new Promise((resolve, reject) => {
        if (!recipes) {
            fetcher(api_url + '/Fetcher/recipes')
                .then((response) => {
                    if (response.status === 200) {
                        return response.json();
                    } else {
                        return convertResponsePromiseToError(response);
                    }
                })
                .then((response) => {
                    let new_recipes = response
                        .map((recipe) => {
                            let new_recipe = {...recipe};
                            new_recipe.type = action_types.find((type) => type.id === new_recipe.type);
                            return new_recipe;
                        })
                        .sort((a, b) => {
                            if (a.type.ordering > b.type.ordering) {
                                return 1;
                            } else if (a.type.ordering === b.type.ordering) {
                                return 0;
                            } else {
                                return -1;
                            }
                        });
                    recipes = new_recipes;
                    resolve(recipes);
                })
                .catch((error) => {
                    addError(error);
                    reject(error);
                });
        } else {
            resolve(recipes);
        }
    });
}

/** Récupère la liste complète des paramètres en base */
function getParameters() {
    return new Promise((resolve, reject) => {
        fetcherWithoutBearer(api_url + '/parameters/parameters')
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    return convertResponsePromiseToError(response);
                }
            })
            .then((response) => {
                parameters = response;
                isScriptVersionLastVersion();
                resolve();
            })
            .catch((error) => {
                addError(error);
                reject(error);
            });
    });
}

function getMap() {
    return new Promise((resolve, reject) => {
        fetcher(api_url + '/Fetcher/map?townId=' + mh_user.townDetails?.townId)
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    return convertResponsePromiseToError(response);
                }
            })
            .then((response) => {
                map = response;
                resolve(map);
            })
            .catch((error) => {
                addError(error);
                reject(error);
            });
    });
}

function getEstimations() {
    return new Promise((resolve, reject) => {
        fetcher(api_url + `/AttaqueEstimation/Estimations/${mh_user.townDetails?.day}?townId=${mh_user.townDetails?.townId}`)
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    return convertResponsePromiseToError(response);
                }
            })
            .then((response) => {
                let estimations = {
                    estimations: response,
                    today_attack: undefined,
                    tomorrow_attack: undefined
                }
                getApofooAttackCalculation(mh_user.townDetails?.day, false).then((today_result) => {
                    estimations.today_attack = today_result;
                    getApofooAttackCalculation(mh_user.townDetails?.day + 1, false).then((tomorrow_result) => {
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

function getApofooAttackCalculation(day, beta) {
    return new Promise((resolve, reject) => {
        fetcher(api_url + `/attaqueEstimation/apofooAttackCalculation${beta ? '/beta' : ''}?day=${day}&townId=${mh_user.townDetails?.townId}`)
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
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
            let new_estimations = {...estimations.estimations};
            if (estim_value && estim_value.value && (estim_value.value.min || estim_value.value.max)) {
                /** Workaround pour définir sur l'extension firefox sans passer par cloneinto */
                let new_estimations_workaround_estim = {...new_estimations.estim};
                new_estimations_workaround_estim['_' + estim_value.percent] = {...estim_value.value};
                new_estimations.estim = {...new_estimations_workaround_estim};
            }
            if (planif_value && planif_value.value && (planif_value.value.min || planif_value.value.max)) {
                /** Workaround pour définir sur l'extension firefox sans passer par cloneinto */
                let new_estimations_workaround_planif = {...new_estimations.planif};
                new_estimations_workaround_planif['_' + planif_value.percent] = {...planif_value.value};
                new_estimations.planif = {...new_estimations_workaround_planif};
            }

            fetcher(api_url + `/AttaqueEstimation/Estimations?townId=${mh_user.townDetails?.townId}&userId=${mh_user.id}`, {
                method: 'POST',
                body: JSON.stringify(new_estimations),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then((response) => {
                    if (response.status === 200) {
                        return response.text();
                    } else {
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

function calculateCamping(camping_parameters) {
    if (camping_parameters.campings < 0 || camping_parameters.campings === null || camping_parameters.campings === undefined || camping_parameters.campings === '') {
        camping_parameters.campings = 0;
    }
    return new Promise((resolve, reject) => {
        fetcher(api_url + '/Camping/Calculate',
            {
                method: 'POST',
                body: JSON.stringify(camping_parameters),
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
            .then((camping_result) => {
                let result = document.querySelector('#camping-result');
                if (result) {
                    result.innerText = result ? `${getI18N(camping_result.label)} (${camping_result.boundedProbability}%)` : '';
                }
                resolve(camping_result);
            })
            .catch((error) => {
                addError(error);
                reject(error);
            });
    });
}

function getMyExpeditions() {
    return new Promise((resolve, reject) => {
        fetcher(api_url + `/expeditions/me/${mh_user.townDetails?.day}`,
            {
                method: 'GET',
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
            .then((expeditions) => {
                my_expeditions = expeditions;
                console.log('expeditions', expeditions);
                resolve(expeditions);
            })
            .catch((error) => {
                addError(error);
                reject(error);
            });
    });
}

function saveBath(bath_taken) {
    if (bath_taken === undefined) return;

    return new Promise((resolve, reject) => {
        fetcher(api_url + `/town/${mh_user.townDetails?.townId}/user/${mh_user.id}/bath?day=${mh_user.townDetails?.day}`,
            {
                method: bath_taken ? 'POST' : 'DELETE',
            })
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
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

function getApiKey() {
    return new Promise((resolve, reject) => {
        if (!external_app_id || external_app_id === '') {

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
                    } else {
                        return convertResponsePromiseToError(response);
                    }
                })
                .then((response) => {
                    let manual = () => {
                        if (document.querySelector('.soul')) {
                            let manual_app_id_key = prompt(getI18N(texts.manually_add_app_id_key));
                            if (manual_app_id_key) {
                                external_app_id = manual_app_id_key;
                                setStorageItem(gm_mh_external_app_id_key, external_app_id);
                                resolve(external_app_id);
                            } else {
                                reject(response);
                            }
                        }
                    }
                    let temp_body = document.createElement('body');

                    if (response) {
                        temp_body.innerHTML = response;
                        let id = temp_body.querySelector('#app_ext');
                        if (id && id !== '' && id !== 'not set' && id.value && id.value !== '' && id.value !== 'not set') {
                            external_app_id = id.value;
                            setStorageItem(gm_mh_external_app_id_key, external_app_id);
                            resolve(external_app_id);
                        } else {
                            manual();
                        }
                    } else {
                        manual();
                    }
                })
                .catch((error) => {
                    reject(error);
                    addError(error);
                });
        } else {
            resolve(external_app_id);
        }
    });
}

///////////////////////////
//     MAIN FUNCTION     //
///////////////////////////
(function () {
    if (document.URL.startsWith(big_broth_hordes_url) || document.URL.startsWith(gest_hordes_url) || document.URL.startsWith(fata_morgana_url) || document.URL.startsWith(website)) {
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
        } else if (document.URL.startsWith(gest_hordes_url)) {
            current_key = gm_gh_updated_key;
            map_block_id = 'zoneCarte';
            ruin_block_id = 'carteRuine';
            block_copy_map_button = 'zoneInfoVilleAutre';
            block_copy_ruin_button = 'menuRuine';
            source = 'gh';
        } else if (document.URL.startsWith(fata_morgana_url)) {
            current_key = gm_fata_updated_key;
            map_block_id = 'map';
            ruin_block_id = 'ruinmap';
            block_copy_map_button = 'modeBar';
            block_copy_ruin_button = 'modeBar';
            source = 'fm';
        } else if (document.URL.startsWith(website)) {
            current_key = gm_mho_updated_key;
            source = 'mho';
        }

        // Si on est sur le site de BBH ou GH ou Fata et que BBH ou GH ou Fata a été mis à jour depuis MyHordes, alors on recharge BBH ou GH ou Fata au moment de revenir sur l'onglet
        document.addEventListener('visibilitychange', function () {
            getStorageItem(current_key).then((current) => {
                if (current && !document.hidden) {
                    setStorageItem(current_key, false);
                    if (current_key === gm_bbh_updated_key && mho_parameters.refresh_bbh_after_update) {
                        location.reload();
                    } else if (current_key === gm_gh_updated_key && mho_parameters.refresh_gh_after_update) {
                        if (document.getElementById('#zoneRefresh')) {
                            document.getElementById('#zoneRefresh').click();
                        } else {
                            location.reload();
                        }
                    } else if (current_key === gm_fata_updated_key && mho_parameters.refresh_fm_after_update) {
                        location.reload();
                    } else if (current_key === gm_mho_updated_key && mho_parameters.refresh_mho_after_update) {
                        location.reload();
                    }
                }
            });
        });

        let interval = setInterval(() => {
            let copy_button = document.getElementById(mho_copy_map_id);
            // console.log(copy_button);
            if (mho_parameters.display_map && !copy_button) {
                let map_block = document.getElementById(map_block_id);
                let ruin_block = document.getElementById(ruin_block_id);
                if (map_block || ruin_block) {
                    if (ruin_block) {
                        createCopyButton(source, 'ruin', ruin_block_id, block_copy_ruin_button);
                    } else if (map_block) {
                        createCopyButton(source, 'map', map_block_id, block_copy_map_button);
                    }
                }
            } else if (!mho_parameters.display_map && copy_button) {
                copy_button.remove();
                clearInterval(interval);
            } else {
                clearInterval(interval);
            }
        }, 1000);
    } else {

        /** Vérifie si la version est nouvelle ou non */
        getStorageItem(mho_version_key).then((version) => {
            toggleNewChangelog(isNewVersion(version))

            createStyles();
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

                        ['mh-navigation-complete', 'mho-mutation-event', /*'pop', 'load', 'popstate', 'error', 'push', , 'tab-switch', '_react', 'x-react-degenerate', 'DOMContentLoaded', 'movement-reset', 'readystatechange'*/].forEach((event_name) => {
                            document.addEventListener(event_name, (event) => {
                                // console.trace('event', event_name, event);
                                if (shouldRefreshMe()) {
                                    getToken(true).then(() => {
                                        initOptionsWithLoginNeeded();
                                        initOptionsWithoutLoginNeeded();
                                    });
                                } else {
                                    initOptionsWithLoginNeeded();
                                    initOptionsWithoutLoginNeeded();
                                }
                            });
                        });
                        setInterval(() => {
                            displayAdvancedTooltips();
                        }, 10);
                    });
                });
            })
                .catch(() => {
                    initOptionsWithoutLoginNeeded();
                });
        });
    }
})();
