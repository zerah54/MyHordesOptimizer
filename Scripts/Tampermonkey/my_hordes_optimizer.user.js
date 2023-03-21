// ==UserScript==
// @name         MyHordes Optimizer
// @version      1.0.0-beta.44
// @description  Optimizer for MyHordes - Documentation & fonctionnalités : https://myhordes-optimizer.web.app/, rubrique Tutoriels
// @author       Zerah
//
// @icon         https://github.com/zerah54/MyHordesOptimizer/raw/main/assets/img/logo/logo_mho_16x16.png
// @icon64       https://github.com/zerah54/MyHordesOptimizer/raw/main/assets/img/logo/logo_mho_64x64.png
//
// @downloadURL  https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/my_hordes_optimizer.user.js
// @updateURL    https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/my_hordes_optimizer.user.js
// @homepageURL  https://myhordes-optimizer.web.app/tutorials/script/installation
// @supportURL   lenoune38@gmail.com
//
// @connect      https://myhordesoptimizerapi.azurewebsites.net/
// @connect      https://api.myhordesoptimizer.fr/
// @connect      *
//
// @match        *://myhordes.de/*
// @match        *://myhordes.eu/*
// @match        *://myhord.es/*
// @match        *://myhordes.localhost/*
// @match        *://staging.myhordes.de/*
//
// @match        https://bbh.fred26.fr/*
// @match        https://gest-hordes2.eragaming.fr/*
// @match        https://fatamorgana.md26.eu/*
//
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.xmlHttpRequest
// @grant        GM_notification
//
// ==/UserScript==


const changelog = `${GM_info.script.name} : Changelog pour la version ${GM_info.script.version}\n\n`
    + `[amélioration] Visuel de la note qui est affichée si l'option de fouilles est activée mais que les données de fouilles ne sont pas complètes`;

const lang = (document.documentElement.lang || navigator.language || navigator.userLanguage).substring(0, 2);

const is_mh_beta = document.URL.indexOf('staging') >= 0;
const website = is_mh_beta ? `https://myhordes-optimizer-beta.web.app/` : `https://myhordes-optimizer.web.app/`;


const gm_bbh_updated_key = 'bbh_updated';
const gm_gh_updated_key = 'gh_updated';
const gm_fata_updated_key = 'fata_updated';
const gm_mh_external_app_id_key = is_mh_beta ? 'mh_beta_external_app_id' : 'mh_external_app_id';
const gm_parameters_key = 'mh_optimizer_parameters';
const mh_user_key = 'mh_user';
const mho_map_key = 'mho_map';
const mho_blacklist_key = 'mho_blacklist';
const mho_anti_abuse_key = 'mho_anti_abuse';

let mho_parameters;
GM.getValue(gm_parameters_key).then((params) => {
    mho_parameters = params || {};
});
let mh_user;
GM.getValue(mh_user_key).then((user) => {
    mh_user = user;
});
let external_app_id;
GM.getValue(gm_mh_external_app_id_key).then((app_id) => {
    external_app_id = app_id;
});


////////////////////
// L'URL de L'API //
////////////////////

const api_url = 'https://api.myhordesoptimizer.fr' + (is_mh_beta ? '/beta' : '');
const api_url_2 = 'https://myhordesoptimizerapi.azurewebsites.net';

///////////////////////////////////////////
// Listes de constantes / Constants list //
///////////////////////////////////////////

const hordes_img_url = '/build/images/';
const repo_img_url = 'https://github.com/zerah54/MyHordesOptimizer/raw/main/assets/img/';
const repo_img_hordes_url = repo_img_url + 'hordes_img/';

const mh_optimizer_icon = 'https://github.com/zerah54/MyHordesOptimizer/raw/main/assets/img/logo/logo_mho_64x64_outlined.png';

const mho_title = 'MH Optimizer';
const mh_optimizer_window_id = 'optimizer-window';
const mh_optimizer_map_window_id = 'optimizer-map-window';
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
const mho_opti_map_id = 'mho-opti-map';
const mho_display_map_id = 'mho-display-map';
const mho_search_building_field_id = 'mho-search-building-field';
const mho_search_recipient_field_id = 'mho-search-recipient-field';
const mho_display_translate_input_id = 'mho-display-translate-input';
const mho_watchtower_estim_id = 'mho-watchtower-estim';
const mho_anti_abuse_counter_id = 'mho-anti-abuse-counter';


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

///////////////////
// Les variables //
///////////////////

let loading_count = 0;
let is_refresh_wishlist;
let dragged = {item: undefined, element: undefined};
let count_pending_notifications;

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
        en: `you are not waiting for an escort.`,
        fr: `vous n'êtes pas en attente d'escorte.`,
        de: `Sie warten nicht auf eine Eskorte.`,
        es: `su escolta no está activada.`
    },
    escort_not_released: {
        en: `you did not let go of your escort`,
        fr: `vous n'avez pas relâché votre escorte.`,
        de: `Sie haben Ihre Eskorte nicht losgelassen`,
        es: `no ha soltado a sus acompañantes en escolta.`
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
    search_building: {
        en: `Search for a construction site`,
        fr: `Rechercher un chantier`,
        de: `Baustelle suchen`,
        es: `Buscar una construcción`
    },
    search_recipient: {
        en: `Find a recipient`,
        fr: `Rechercher un destinataire`,
        de: `Finden Sie einen Empfänger`,
        es: `Encuentra un destinatario`
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
    nb_campings: {
        en: `Number of campsites already made`,
        fr: `Nombre de campings déjà effectués`,
        de: `Anzahl der bereits gemachten Campingplätze`,
        es: `Cantidad de acampes ya realizados`,
    },
    hidden_campers: {
        en: `Number of campers already hidden on the cell`,
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
        en: `Number of zombies on the cell`,
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
        en: `Number of simple improvements made on the cell (must subtract 3 after each attack)`,
        fr: `Nombre d'améliorations simples faites sur la case (il faut en soustraire 3 après chaque attaque)`,
        de: `Anzahl der einfachen Verbesserungen, die an der Zelle vorgenommen wurden (muss nach jedem Angriff 3 abziehen)`,
        es: `Cantidad de mejoras simples hechas en la zona (hay que restar 3 luego de cada ataque)`,
    },
    object_improve: {
        en: `Number of defense objects installed on the cell`,
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
        fr: `Du fait d'une trop grande complexité, la liste de courses à été déplacée sur le site web.`,
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
    }
};

const camping_results = [
    {
        probability: 0.1,
        strict: false,
        label: {
            en: `You reckon your chances of surviving here are hee haw... Might as well take some cyanide now.`,
            fr: `Vous estimez que vos chances de survie ici sont quasi nulles… Autant gober du cyanure tout de suite.`,
            de: `Du schätzt, dass deine Überlebenschancen hier quasi Null sind... Besser gleich 'ne Zyanidkapsel schlucken.`,
            es: `Crees que tus posibilidades de sobrevivir aquí son casi nulas... ¿Cianuro?`,
        }
    },
    {
        probability: 0.3,
        strict: false,
        label: {
            en: `You reckon your chances of surviving here are really poor. Maybe you should play heads or tails?`,
            fr: `Vous estimez que vos chances de survie ici sont très faibles. Peut-être que vous aimez jouer à pile ou face ?`,
            de: `Du schätzt, dass deine Überlebenschancen hier sehr gering sind. Vielleicht hast du ja Bock 'ne Runde Kopf oder Zahl zu spielen?`,
            es: `Crees que tus posibilidades de sobrevivir aquí son muy pocas. ¿Apostamos?`,
        }
    },
    {
        probability: 0.5,
        strict: false,
        label: {
            en: `You reckon your chances of surviving here are poor. Difficult to say.`,
            fr: `Vous estimez que vos chances de survie ici sont faibles. Difficile à dire.`,
            de: `Du schätzt, dass deine Überlebenschancen hier gering sind. Hmmm... schwer zu sagen, wie das hier ausgeht.`,
            es: `Crees que tus posibilidades de sobrevivir aquí son pocas. Quién sabe...`,
        }
    },
    {
        probability: 0.65,
        strict: false,
        label: {
            en: `You reckon your chances of surviving here are limited, but tempting. However, accidents happen...`,
            fr: `Vous estimez que vos chances de survie ici sont limitées, bien que ça puisse se tenter. Mais un accident est vite arrivé...`,
            de: `Du schätzt, dass deine Überlebenschancen hier mittelmäßig sind. Ist allerdings einen Versuch wert.. obwohl, Unfälle passieren schnell...`,
            es: `Crees que tus posibilidades de sobrevivir aquí son reducidas, aunque se puede intentar. Tú sabes, podrías sufrir un accidente...`,
        }
    },
    {
        probability: 0.8,
        strict: false,
        label: {
            en: `You reckon your chances of surviving here are largely satisfactory, as long as nothing unforeseen happens.`,
            fr: `Vous estimez que vos chances de survie ici sont à peu près satisfaisantes, pour peu qu'aucun imprévu ne vous tombe dessus.`,
            de: `Du schätzt, dass deine Überlebenschancen hier zufriedenstellend sind - vorausgesetzt du erlebst keine böse Überraschung.`,
            es: `Crees que tus posibilidades de sobrevivir aquí son aceptables, esperando que no suceda ningún imprevisto.`,
        }
    },
    {
        probability: 0.9,
        strict: false,
        label: {
            en: `You reckon your chances of surviving here are decent: you just have to hope for the best!`,
            fr: `Vous estimez que vos chances de survie ici sont correctes : il ne vous reste plus qu'à croiser les doigts !`,
            de: `Du schätzt, dass deine Überlebenschancen hier korrekt sind. Jetzt heißt's nur noch Daumen drücken!`,
            es: `Crees que tus posibilidades de sobrevivir aquí son buenas. ¡Cruza los dedos!`,
        }
    },
    {
        probability: 1,
        strict: true,
        label: {
            en: `You reckon your chances of surviving here are good, you should be able to spend the night here.`,
            fr: `Vous estimez que vos chances de survie ici sont élevées : vous devriez pouvoir passer la nuit ici.`,
            de: `Du schätzt, dass deine Überlebenschancen hier gut sind. Du müsstest hier problemlos die Nacht verbringen können.`,
            es: `Crees que tus posibilidades de sobrevivir aquí son altas. Podías pasar la noche aquí.`,
        }
    },
    {
        probability: 1,
        strict: false,
        label: {
            en: `You reckon your chances of surviving here are optimal. Nobody would see you, even if they were looking straight at you.`,
            fr: `Vous estimez que vos chances de survie ici sont optimales : personne ne vous verrait même en vous pointant du doigt.`,
            de: `Du schätzt, dass deine Überlebenschancen hier optimal sind. Niemand wird dich sehen - selbst wenn man mit dem Finger auf dich zeigt.`,
            es: `Crees que tus posibilidades de sobrevivir aquí son óptimas. Nadie te verá, ni señalándote con el dedo`,
        }
    },
];

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

const wishlist_priorities = [
    {
        value: -1000,
        label: {
            en: `Do not bring to town`,
            fr: `Ne pas ramener`,
            de: `Nicht mitbringen`,
            es: `No traer al pueblo`
        }
    },
    {
        value: 0,
        label: {
            en: `Not defined`,
            fr: `Non définie`,
            de: `Nicht definiert`,
            es: `Indefinida`
        }
    },
    {
        value: 1000,
        label: {
            en: `Low`,
            fr: `Basse`,
            de: `Niedrig`,
            es: `Baja`
        }
    },
    {
        value: 2000,
        label: {
            en: `Medium`,
            fr: `Moyenne`,
            de: `Mittel`,
            es: `Media`
        }
    },
    {
        value: 3000,
        label: {
            en: `High`,
            fr: `Haute`,
            de: `Hoch`,
            es: `Alta`
        }
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
            en: `Priority`,
            fr: `Priorité`,
            de: `Priorität`,
            es: `Prioridad`
        }, id: `priority`
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
                parent_id: null
            },
            {
                id: `update_mho_actions`,
                label: {
                    en: `Heroic Actions`,
                    fr: `Actions héroïques`,
                    de: `Heldentaten`,
                    es: `Acciones heroicas`
                },
                parent_id: `update_mho`
            },
            {
                id: `update_mho_house`,
                label: {
                    en: `Home upgrades`,
                    fr: `Améliorations de la maison`,
                    de: `Hausverbesserungen`,
                    es: `Mejoras de la casa`
                },
                parent_id: `update_mho`
            },
            {
                id: `update_mho_bags`,
                label: {
                    en: `Details of my rucksack and those of my escort`,
                    fr: `Détail de mon sac et de ceux de mon escorte`,
                    de: `Details meines Inventars und des Inventars meiner Eskorte`,
                    es: `Detalles de mi mochila y las de mi escolta`
                },
                parent_id: `update_mho`
            },
            // {
            //     id: `update_mho_chest`,
            //     label: {
            //         en: `Items in my chest`,
            //         fr: `Contenu de mon coffre`,
            //         de: `Gegenstände in meiner Truhe`,
            //         es: `Contenido de mi baúl`
            //     },
            //     parent_id: `update_mho`
            // },
            {
                id: `update_mho_status`,
                label: {
                    en: `Status`,
                    fr: `États`,
                    de: `Status`,
                    es: `Estatus`
                },
                parent_id: `update_mho`
            },
            {
                id: `update_mho_digs`,
                label: {
                    en: `Record successful searches`,
                    fr: `Enregistrer les fouilles réussies`,
                    de: `Zeichnen Sie erfolgreiche Ausgrabungen auf`,
                    es: `Grabar excavaciones exitosas`
                },
                parent_id: `update_mho`
            },
            {
                id: `update_bbh`,
                label: {
                    en: `Update BigBroth’Hordes`,
                    fr: `Mettre à jour BigBroth'Hordes`,
                    de: `BigBroth’Hordes Aktualisieren`,
                    es: `Actualizar BigBroth'Hordes`
                },
                parent_id: null
            },
            {
                id: `update_gh`,
                label: {
                    en: `Update Gest’Hordes`,
                    fr: `Mettre à jour Gest'Hordes`,
                    de: `Gest’Hordes aktualisieren`,
                    es: `Actualizar Gest'Hordes`
                },
                parent_id: null
            },
            {
                id: `update_gh_without_api`,
                label: {
                    en: `Additional information on the map`,
                    fr: `Informations complémentaires sur la carte`,
                    de: `Zusätzliche Informationen auf der Karte`,
                    es: `Información adicional sobre el mapa`
                },
                help: {
                    en: `Amount of zombies killed in a zone; Zone update even after the town has been devastated`,
                    fr: `Marqueurs zombies tués ; Mise à jour en ville dévastée`,
                    de: `Anzahl getöteter Zombies; Zonen-Update, nachdem die Stadt bereits zerstört wurde`,
                    es: `Marcadores zombis matados; Actualización en pueblo devastado`
                },
                parent_id: `update_gh`
            },
            {
                id: `update_gh_ah`,
                label: {
                    en: `Heroic Actions`,
                    fr: `Actions héroïques`,
                    de: `Heldentaten`,
                    es: `Acciones heroicas`
                },
                parent_id: `update_gh`
            },
            {
                id: `update_gh_amelios`,
                label: {
                    en: `Home upgrades`,
                    fr: `Améliorations de la maison`,
                    de: `Hausverbesserungen`,
                    es: `Mejoras de la casa`
                },
                parent_id: `update_gh`
            },
            {
                id: `update_gh_status`,
                label: {
                    en: `Status`,
                    fr: `États`,
                    de: `Status`,
                    es: `Estatus`
                },
                parent_id: `update_gh`
            },
            {
                id: `update_fata`,
                label: {
                    en: `Update Fata Morgana`,
                    fr: `Mettre à jour Fata Morgana`,
                    de: `Fata Morgana aktualisieren`,
                    es: `Actualizar Fata Morgana`
                },
                parent_id: null
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
                parent_id: null
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
                parent_id: null
            },
            {
                id: `click_on_voted`,
                label: {
                    en: `Quick navigation to recommended construction site`,
                    fr: `Navigation rapide vers le chantier recommandé`,
                    de: `Schnelle Navigation zur empfohlenen Baustelle`,
                    es: `Navegación rápida hacia la construcción recomendada`
                },
                parent_id: null
            },
            {
                id: `display_search_fields`,
                label: {
                    en: `Additional search fields`,
                    fr: `Champs de recherches supplémentaires`,
                    de: `Zusätzliche Suchfelder`,
                    es: `Campos de búsqueda adicionales`
                },
                help: {
                    en: `Displays a search field in the list of construction sites, and a search field in the list of recipients of a message in his house.`,
                    fr: `Affiche un champ de recherche dans la liste de chantiers, et un champ de recherche sur la liste des destinataires d'un message dans sa maison.`,
                    de: `Zeigt ein Suchfeld in der Liste der Baustellen und ein Suchfeld in der Liste der Empfänger einer Nachricht in seinem Haus an.`,
                    es: `Muestra un campo de búsqueda en la lista de sitios de construcción y un campo de búsqueda en la lista de destinatarios de un mensaje en su casa.`
                },
                parent_id: null
            },
            {
                id: `display_wishlist`,
                label: {
                    en: `Wishlist in interface`,
                    fr: `Liste de courses dans l'interface`,
                    de: `Wunschzettel in der Benutzeroberfläche`,
                    es: `Lista de deseos en la interfaz`
                },
                parent_id: null
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
                    fr: `Permet d'afficher le nombre de tâches de sang sur la carte`,
                    de: `Ermöglicht die Anzeige der Anzahl der Blutfleck auf der Karte`,
                    es: `Permite mostrar la cantidad de manchas de sangre en el mapa`
                },
                parent_id: null
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
                parent_id: null
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
                parent_id: null
            },
            {
                id: `display_camping_predict`,
                label: {
                    en: `[Experimental] Camping predictions in area information`,
                    fr: `[Expérimental] Prédictions de camping dans les informations sur le secteur`,
                    de: `Campingvorhersagen in Gebietsinformationen`,
                    es: `[Experimental] Predicciones para acampar en la información del área`
                },
                parent_id: null
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
                parent_id: null
            },
            // {
            //     id: `display_estimations_on_watchtower`,
            //     label: {
            //         en: `TODO`,
            //         fr: `Affiche les estimations enregistrées sur la page de la tour de guet`,
            //         de: `TODO`,
            //         es: `TODO`
            //     },
            //     parent_id: null
            // },
            // {
            //     id: `display_anti_abuse`,
            //     label: {
            //         en: `TODO`,
            //         fr: `Affiche un compteur pour gérer l'anti-abus`,
            //         de: `TODO`,
            //         es: `TODO`
            //     },
            //     parent_id: null
            // }
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
            //     parent_id: null
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
                id: `prevent_from_leaving`,
                label: {
                    en: `Request confirmation before leaving without automatic escort`,
                    fr: `Demander confirmation avant de quitter en l'absence d'escorte automatique`,
                    de: `Bestätigung anfordern bevor Abreise ohne automatische Eskorte`,
                    es: `Pedir confirmación antes de cerrar la página sin haber puesto la escolta automática`
                },
                parent_id: null
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
                parent_id: null
            },
            {
                id: `notify_on_new_msg`,
                label: {
                    en: `Notify me if I receive a new message`,
                    fr: `Me notifier si je reçois un nouveau message`,
                    de: `Benachrichtigen Sie mich, wenn ich eine neue Nachricht erhalte`,
                    es: `Notificarme si recibo un mensaje nuevo`
                },
                help: {
                    en: `Allows to receive a notification in case of reception of a new notification changing the count of notifications of the game`,
                    fr: `Permet de recevoir une notification en cas de réception d'une nouvelle notification faisant changer le compteur de notifications du jeu`,
                    de: `Ermöglicht den Erhalt einer Benachrichtigung im Falle des Empfangs einer neuen Benachrichtigung, die die Anzahl der Benachrichtigungen des Spiels ändert`,
                    es: `Permite recibir una notificación en caso de recibir una nueva notificación cambiando el conteo de notificaciones del juego`
                },
                parent_id: null
            }
        ]
    }
];

let informations = [
    {
        id: `version`,
        label: {
            en: `Changelog ${GM_info.script.version}`,
            fr: `Notes de version ${GM_info.script.version}`,
            de: `Changelog ${GM_info.script.version}`,
            es: `Notas de la versión ${GM_info.script.version}`
        },
        src: undefined,
        action: () => {
            alert(changelog);
        },
        img: `emotes/rptext.gif`
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
                GM.setValue(gm_mh_external_app_id_key, external_app_id);
            } else if (manual_app_id_key === '') {
                external_app_id = undefined;
                GM.setValue(gm_mh_external_app_id_key, undefined);
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
    {id: 'drops', label: {en: `Items`, fr: 'Objets', de: `Gegenstände`, es: `Objetos`}, type: 'td'},
];

const added_ruins = [
    {id: '', camping: 0, label: {en: `None`, fr: `Aucun`, de: `Kein`, es: `Ninguna`}},
    {
        id: 'nondig',
        camping: 8,
        label: {
            en: `Buried building`,
            fr: `Bâtiment non déterré`,
            de: `Verschüttete Ruine`,
            es: `Edificio no desenterrado`
        }
    }
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
function buttonOptimizerExists() {
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

/** @return {boolean}    true si la page de l'utilisateur est la page de sa maison */
function pageIsHouse() {
    return document.URL.indexOf('town/house') > -1;
}

/** @return {boolean}    true si la page de l'utilisateur est la page de la tour de guet */
function pageIsWatchtower() {
    return document.URL.indexOf('town/watchtower') > -1;
}

/** @return {boolean}    true si la page de l'utilisateur est la page de la tour de guet */
function pageIsWell() {
    return document.URL.indexOf('town/well') > -1;
}

/** @return {boolean}    true si la page de l'utilisateur est la page de la tour de guet */
function pageIsBank() {
    return document.URL.indexOf('town/bank') > -1;
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

function getI18N(item) {
    if (!item) return;
    return item[lang] !== 'TODO' ? item[lang] : (item['en'] === 'TODO' ? item['fr'] : item['en']);
}

function getCurrentPosition() {
    return document.querySelector('.current-location')?.innerText.replace(/.*: ?/, '').split('/');
}

function getCellDetailsByPosition() {
    let position = getCurrentPosition();
    if (position) {
        return map.cells.find((cell) => +cell.displayX === +position[0] && +cell.displayY === +position[1]);
    }
}

/** Affiche ou masque la page de chargement de MyHordes en fonction du nombre d'appels en cours */
function displayLoading() {
    let loadzone = document.getElementById('loadzone');
    if (loading_count > 0) {
        loadzone.setAttribute('x-stack', 1);
    } else {
        loadzone.setAttribute('x-stack', 0);
    }
}

/** Affiche la page de chargement de MyHordes */
function startLoading() {
    loading_count += 1;
    displayLoading();
}

/** Masque la page de chargement de MyHordes */
function endLoading() {
    loading_count -= 1;
    displayLoading();
}

/** Affiche une notification de réussite */
function addSuccess(message) {
    let notifications = document.getElementById('notifications');
    let notification = document.createElement('div');
    notification.classList.add('notice', 'show');
    notification.innerText = `${GM_info.script.name} : ${message}`;
    notifications.appendChild(notification);
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
    let notification = document.createElement('div');
    notification.classList.add('warning', 'show');
    notification.innerText = `${GM_info.script.name} : ${message}`;
    notifications.appendChild(notification);
    notification.addEventListener('click', () => {
        notification.remove();
    });
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

/** Affiche une notification d'erreur */
function addError(error) {
    let notifications = document.getElementById('notifications');
    let notification = document.createElement('div');
    notification.classList.add('error', 'show');
    notification.innerHTML = `
    <div style="vertical_align: middle"><img src="${mh_optimizer_icon}" style="width: 24px; margin-right: 0.5em;">${GM_info.script.name} :</div>
    <br />
    <div>${getI18N(api_texts.error).replace('$error$', error.status)}</div>
    <br />`
    if (parameters?.find((param) => param.name === 'ScriptVersion')?.value !== GM_info.script.version) {
        notification.innerHTML += `<div><small>${getI18N(api_texts.error_version).replace('$your_version$', GM_info.script.version).replace('$recent_version$', parameters?.find((param) => param.name === 'ScriptVersion')?.value)}</small><div>`
    }
    notification.innerHTML += `<div><small>${getI18N(api_texts.error_discord)}</small><div>`;

    notifications.appendChild(notification);
    notification.addEventListener('click', () => {
        notification.remove();
    });
    setTimeout(() => {
        notification.remove();
    }, 10000);
    console.error(`${GM_info.script.name} : Une erreur s'est produite : \n`, error);
}

/** Calcule le nombre de zombies qui vont mourir par désespoir */
function calculateDespairDeaths(nb_killed_zombies) {
    return Math.floor(Math.max(0, (nb_killed_zombies - 1) / 2));
}


function initOptions() {
    preventFromLeaving();
    createDisplayMapButton();

    count_pending_notifications = document.querySelector('#postbox-new-msg-counter')?.innerText;
}

/**
 * Copie un texte
 * @param {string} le texte à copier
 */
function copyToClipboard(text) {
    let input = document.createElement('input');
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
    input.type = 'text';

    let close = document.createElement('div');
    close.innerHTML = '&#128473';
    close.setAttribute('style', 'position: relative; float: right; top: -25px; color: #5c2b20;');

    select.appendChild(input);
    select.appendChild(close);

    select_complete.appendChild(select);

    let options = document.createElement('div');
    options.classList.add('hidden');
    options.setAttribute('style', 'position: absolute; background: #5c2b20; border: 1px solid #ddab76; box-shadow: 0 0 3px #000; outline: 1px solid #000; color: #ddab76; max-height: 50vh; overflow: auto;');

    input.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            options.classList.remove('hidden');
        }
    });
    close.addEventListener('click', () => {
        options.classList.add('hidden');
        input.value = '';
    });
    select_complete.appendChild(options);
    return select_complete;
}

/** Create Optimize button */
function createOptimizerBtn() {
    setInterval(() => {
        let optimizer_btn = document.getElementById(btn_id);
        if (!optimizer_btn) {
            let content_zone = document.getElementById(mh_content_id);
            let header_zone = document.getElementById(mh_header_id);
            let last_header_child = header_zone.lastChild;
            let mhe_button = document.querySelector('#mhe_button')
            let left_position = last_header_child ? last_header_child.offsetLeft + last_header_child.offsetWidth + 5 : (mhe_button ? mhe_button.offsetLeft + mhe_button.offsetWidth + 5 : document.querySelector('#apps')?.getBoundingClientRect().width + 16);

            let img = document.createElement('img');
            img.src = mh_optimizer_icon;
            img.setAttribute('height', '16px');
            img.setAttribute('width', '16px');

            let title_hidden = document.createElement('span');
            title_hidden.classList.add('label_text');
            title_hidden.innerHTML = mho_title;

            let title = document.createElement('h1');

            let title_first_part = document.createElement('div');
            title.appendChild(title_first_part);

            let title_second_part = document.createElement('div');
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

            let mho_content_zone = document.createElement('div');
            mho_content_zone.id = content_btn_id;
            content_zone.appendChild(optimizer_btn);
            content_zone.appendChild(mho_content_zone);

            createOptimizerButtonContent();
        }
    }, 500);
}

/** Crée le contenu du bouton de l'optimizer (bouton de wiki, bouton de configuration, etc) */
function createOptimizerButtonContent() {
    let optimizer_btn = document.getElementById(btn_id);
    let content = document.getElementById(content_btn_id);
    content.innerHTML = '';

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
        wiki_btn.innerHTML = 'Wiki';
        wiki_btn.id = wiki_btn_id;

        wiki_btn.addEventListener('click', () => {
            displayWindow('wiki');
        });

        btn_content.appendChild(wiki_btn);

        let tools_btn = document.createElement('a');
        tools_btn.classList.add('button');
        tools_btn.style.marginTop = 0;
        tools_btn.style.textAlign = 'center';
        tools_btn.innerHTML = getI18N(texts.tools_btn_label);
        tools_btn.addEventListener('click', () => {
            displayWindow('tools');
        });

        btn_content.appendChild(tools_btn);

        ////////////////////////
        // SECTION PARAMETRES //
        ////////////////////////

        content.appendChild(createParams());

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
        });

        content.appendChild(informations_container);

    } else {
        let no_external_app_id = document.createElement('div');
        no_external_app_id.innerText = getI18N(texts.external_app_id_help);
        content.appendChild(no_external_app_id);
    }
    optimizer_btn.appendChild(content);
}

function createParams() {
    let params_title = document.createElement('h5');
    params_title.innerText = getI18N(texts.parameters_section_label);

    let categories_list = document.createElement('ul');

    let categories_container = document.createElement('div');
    categories_container.id = 'categories';

    categories_container.appendChild(params_title);
    categories_container.appendChild(categories_list);

    params_categories.forEach((category) => {
        let category_container = document.createElement('li');
        let category_title = document.createElement('h1');
        category_title.innerText = getI18N(category.label);
        categories_list.appendChild(category_container);
        let category_content = document.createElement('ul');
        category_content.classList.add('parameters');
        category_container.appendChild(category_title);
        category_container.appendChild(category_content);
        category.params.forEach((param) => {
            let param_children = category.params.filter((param_child) => param_child.parent_id === param.id);
            let param_input = document.createElement('input');
            param_input.type = 'checkbox';
            param_input.id = param.id + '-intput';
            param_input.checked = mho_parameters && mho_parameters[param.id] ? mho_parameters[param.id] : false;

            let param_label = document.createElement('label');
            param_label.classList.add('small');
            param_label.htmlFor = param.id + '-input';
            param_label.innerText = getI18N(param.label);

            param_input.addEventListener('change', (event) => {
                let new_params;
                if (!mho_parameters) {
                    new_params = {};
                } else {
                    new_params = mho_parameters;
                }
                new_params[param.id] = event.target.checked;
                GM.setValue(gm_parameters_key, new_params);
                GM.getValue(gm_parameters_key).then((params) => {
                    mho_parameters = params
                });

                /** Si l'option a des "enfants" alors on les affiche uniquement si elle est cochée */
                if (param_children.length > 0) {
                    param_children.forEach((param_child) => {
                        let child = document.getElementById(param_child.id);
                        if (event.target.checked) {
                            child.classList.remove('hidden');
                        } else {
                            child.classList.add('hidden');
                        }
                    });
                }

                // Quand on change une option, trigger à nouveau certaines vérifications pour ne pas avoir à les vérifier tout le temps (=> perf !)
                initOptions();
            });

            let param_container = document.createElement('li');
            param_container.id = param.id;
            param_container.appendChild(param_input);
            param_container.appendChild(param_label);

            if (param.help) {
                let param_help = createHelpButton(getI18N(param.help));
                param_help.setAttribute('style', 'float: right; margin-top: 4px');
                param_container.appendChild(param_help);
            }

            /** Si l'option a un parent, alors on ajoute une marge et on l'affiche uniquement si elle est cochée */
            if (param.parent_id) {
                param_container.setAttribute('style', 'margin-left: 1em;');
                if (!mho_parameters || !mho_parameters[param.parent_id]) {
                    param_container.classList.add('hidden');
                }
            }
            category_content.appendChild(param_container);
        });

    });
    return categories_container;
}

/** Crée la fenêtre de wiki */
function createWindow() {
    let window_content = document.createElement('div');
    window_content.id = mh_optimizer_window_id + '-content';
    let window_overlay_img = document.createElement('img');
    window_overlay_img.alt = '(X)';
    window_overlay_img.src = repo_img_hordes_url + 'icons/b_close.png';
    let window_overlay_li = document.createElement('li');
    window_overlay_li.appendChild(window_overlay_img);
    let window_overlay_ul = document.createElement('ul');
    window_overlay_ul.appendChild(window_overlay_li);

    let window_overlay = document.createElement('div');
    window_overlay.id = mh_optimizer_window_id + '-overlay';
    window_overlay.appendChild(window_overlay_ul);

    let window_box = document.createElement('div');
    window_box.id = mh_optimizer_window_id + '-box';
    window_box.appendChild(window_content);
    window_box.appendChild(window_overlay);

    let window = document.createElement('div');
    window.id = mh_optimizer_window_id;
    window.appendChild(window_box);

    let post_office = document.getElementById('post-office');
    if (post_office) {
        post_office.parentNode.insertBefore(window, post_office.nextSibling);
    }
    window_overlay_img.addEventListener('click', () => {
        window.classList.remove('visible');
        let body = document.getElementsByTagName('body')[0];
        body.removeAttribute('style', 'overflow: hidden');
    });
}

/**
 * Crée la liste des onglets de la page de wiki
 * @param {string} window_type
 */
function createTabs(window_type) {
    let window_content = document.getElementById(mh_optimizer_window_id + '-content');
    window_content.innerHTML = '';

    let tabs_ul = document.createElement('ul');

    let current_tabs_list = tabs_list[window_type]
        .filter((tab) => mh_user.townDetails.townId || !tab.needs_town)
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
            dispatchContent(window_type, tab);
        }

        tab_li.addEventListener('click', () => {
            if (!tab_li.classList.contains('selected')) {
                for (let li of tabs_ul.children) {
                    li.classList.remove('selected');
                }
                tab_li.classList.add('selected');
            }
            dispatchContent(window_type, tab);
        })

        tabs_ul.appendChild(tab_li);
    })

    let tabs_div = document.createElement('div');
    tabs_div.id = 'tabs';
    tabs_div.appendChild(tabs_ul)

    window_content.appendChild(tabs_div);

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
    createTabs(window_type);
}

/**
 * Crée le bloc de contenu de la page
 * @param {string} window_tyme     Le type de fenêtre à afficher, correspondant au nom utilisé dans la liste des onglets
 */
function createTabContent(window_type) {
    let window_content = document.getElementById(mh_optimizer_window_id + '-content');

    let tab_content = document.getElementById('tab-content');
    if (tab_content) {
        tab_content.remove();
    }
    tab_content = document.createElement('div');
    tab_content.id = 'tab-content';

    window_content.appendChild(tab_content);
}

/**
 * Détermine quelle fonction appeler en fonction de l'onglet sélectionné
 * @param {string} window_type     Le type de l'onglet
 * @param tab                      L'onglet à afficher
 */
function dispatchContent(window_type, tab) {

    createTabContent(window_type);

    let list = document.getElementById('tab-content');
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
    let tab_content = document.getElementById('tab-content');

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
    let tab_content = document.getElementById('tab-content');

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

        if ((tab_id === 'bank' || tab_id === 'items') && item.wishListCount === 0 && mh_user.townDetails.townId) {
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
        let tab_content = document.getElementById('tab-content');
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

        let tab_content = document.getElementById('tab-content');

        let camping_tab_content = document.createElement('div');
        camping_tab_content.style.padding = '0 0.5em';
        camping_tab_content.classList.add('camping-tab');
        tab_content.appendChild(camping_tab_content);

        let conf = {
            town: 'rne',
            job: 'citizen',
            distance: 1,
            campings: 0,
            pro: false,
            hidden_campers: 0,
            objects: 0,
            vest: false,
            tomb: false,
            zombies: 0,
            night: false,
            devastated: false,
            phare: false,
            improve: 0,
            object_improve: 0,
            ruin: ''
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
            conf.town = $event.srcElement.value;
            calculateCampingProbabilities(conf);
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
            calculateCampingProbabilities(conf);
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
        vest.type = 'checkbox';
        vest.id = 'vest';
        vest.checked = conf.vest;
        vest.addEventListener('change', ($event) => {
            conf.vest = $event.srcElement.checked;
            calculateCampingProbabilities(conf);
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
        pro_camper.addEventListener('change', ($event) => {
            conf.pro = $event.srcElement.checked;
            calculateCampingProbabilities(conf);
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
        tomb.addEventListener('change', ($event) => {
            conf.tomb = $event.srcElement.checked;
            calculateCampingProbabilities(conf);
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
        nb_campings.classList.add('inline');
        nb_campings.addEventListener('change', ($event) => {
            conf.campings = +$event.srcElement.value;
            calculateCampingProbabilities(conf);
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
        objects_in_bag.classList.add('inline');
        objects_in_bag.addEventListener('change', ($event) => {
            conf.objects = +$event.srcElement.value;
            calculateCampingProbabilities(conf);
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
            calculateCampingProbabilities(conf);
        })
        ruin_type_div.appendChild(select_ruin_label);
        ruin_type_div.appendChild(select_ruin);

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
        distance.classList.add('inline');
        distance.addEventListener('change', ($event) => {
            conf.distance = +$event.srcElement.value;
            calculateCampingProbabilities(conf);
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
        zombies.classList.add('inline');
        zombies.addEventListener('change', ($event) => {
            conf.zombies = +$event.srcElement.value;
            calculateCampingProbabilities(conf);
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
        improve.classList.add('inline');
        improve.addEventListener('change', ($event) => {
            conf.improve = +$event.srcElement.value;
            calculateCampingProbabilities(conf);
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
        object_improve.value = conf.object_improve;
        object_improve.classList.add('inline');
        object_improve.addEventListener('change', ($event) => {
            conf.object_improve = +$event.srcElement.value;
            calculateCampingProbabilities(conf);
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
        hidden_campers.value = conf.hidden_campers;
        hidden_campers.classList.add('inline');
        hidden_campers.addEventListener('change', ($event) => {
            conf.hidden_campers = +$event.srcElement.value;
            calculateCampingProbabilities(conf);
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
        night.addEventListener('change', ($event) => {
            conf.night = $event.srcElement.checked;
            calculateCampingProbabilities(conf);
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
        devastated.addEventListener('change', ($event) => {
            conf.devastated = $event.srcElement.checked;
            calculateCampingProbabilities(conf);
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
        phare.addEventListener('change', ($event) => {
            conf.phare = $event.srcElement.checked;
            calculateCampingProbabilities(conf);
        })
        phare_div.appendChild(phare);
        phare_div.appendChild(phare_label);


        calculateCampingProbabilities(conf);
    });
}

function calculateCampingProbabilities(conf) {
    getRuins().then((ruins) => {
        let all_ruins = [...added_ruins];
        all_ruins = all_ruins.concat(ruins);
        /** @see CitizenHandler > getCampingValues > $distance_map */
        let distance_map = {
            1: -24,
            2: -19,
            3: -14,
            4: -11,
            5: -9,
            6: -9,
            7: -9,
            8: -9,
            9: -9,
            10: -9,
            11: -9,
            12: -8,
            13: -7.6,
            14: -7,
            15: -6,
            16: -5 // 16 et +
        };

        /** @see CitizenHandler > getCampingValues > $campings_map */
        let campings_map = {
            normal: {
                nonpro: {
                    0: 0,
                    1: -4,
                    2: -9,
                    3: -13,
                    4: -16,
                    5: -26,
                    6: -36,
                    7: -50, // Totally arbitrary
                    8: -65, // Totally arbitrary
                    9: -80 // Totally arbitrary // 9 et +
                },
                pro: {
                    0: 0,
                    1: -2,
                    2: -4,
                    3: -8,
                    4: -10,
                    5: -12,
                    6: -16,
                    7: -26,
                    8: -36,
                    9: -60 // Totally arbitrary // 9 et +
                }
            },
            pande: {
                nonpro: {
                    0: 0,
                    1: -4,
                    2: -6,
                    3: -8,
                    4: -10,
                    5: -20,
                    6: -36,
                    7: -50,
                    8: -65,
                    9: -80 // 9 et +
                },
                pro: {
                    0: 0,
                    1: -1,
                    2: -2,
                    3: -4,
                    4: -6,
                    5: -8,
                    6: -10,
                    7: -20,
                    8: -36,
                    9: -60 // 9 et +
                }
            },
        };

        /** @see CitizenHandler > getCampingValues > $campers_map */
        let hidden_campers_map = {
            0: 0,
            1: 0,
            2: -2,
            3: -6,
            4: -10,
            5: -14,
            6: -20,
            7: -26
        };

        let chances = 0;
        /** Type de ville */
        chances += conf.town === 'pande' ? -14 : 0;
        /** Tombe creusée */
        chances += conf.tomb ? 1.6 : 0;
        /** Mode nuit */
        chances += conf.night ? 2 : 0;
        /** Ville devastée */
        chances += conf.devastated ? -10 : 0;
        /** Phare */
        chances += conf.phare ? 5 : 0;
        /** Zombies dans la zone */
        let zombies_factor = conf.vest ? 0.6 : 1.4;
        chances += -zombies_factor * conf.zombies;

        /** Nombre de campings */
        let nb_camping_town_type_mapping = conf.town === 'pande' ? campings_map.pande : campings_map.normal;
        let nb_camping_mapping = conf.pro ? nb_camping_town_type_mapping.pro : nb_camping_town_type_mapping.nonpro;
        chances += (conf.campings > 9 ? nb_camping_mapping[9] : nb_camping_mapping[conf.campings]);

        /** Distance de la ville */
        chances += (conf.distance > 16 ? distance_map[16] : distance_map[conf.distance]);

        /** Nombre de personnes déjà cachées */
        chances += (conf.hidden_campers > 7 ? hidden_campers_map[7] : hidden_campers_map[conf.hidden_campers]);

        /** Nombre d'objets de protection dans l'inventaire */
        chances += conf.objects;

        /**
         * Nombre d'améliorations simples sur la case
         * @see ActionDataService.php : 'improve'
         */
        chances += conf.improve;

        /**
         * Nombre d'objets de défense installés sur la case
         * @see ActionDataService.php : 'cm_campsite_improve'
         */
        chances += conf.object_improve * 1.8;

        /**
         * Bonus liés au bâtiment
         * @see RuinDataService.php
         */
        chances += parseInt(all_ruins.find((ruin) => conf.ruin.toString() === ruin.id.toString()).camping, 10);

        let probability = Math.min(Math.max((100.0 - (Math.abs(Math.min(0, chances)) * 5)) / 100.0, .1), (conf.job === 'survivalist' ? 1.0 : 0.9));
        let camping_result_text = camping_results.find((camping_result) => camping_result.string ? probability < camping_result.probability : probability <= camping_result.probability);
        let result = document.querySelector('#camping-result');
        result.innerText = `${camping_result_text ? getI18N(camping_result_text.label) : ''} (${Math.round(probability * 10000) / 100}%)`;
    });
};

/** Affiche la liste des pouvoirs */
function displaySkills() {
    getHeroSkills().then((hero_skills) => {
        let tab_content = document.getElementById('tab-content');

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
            let tab_content = document.getElementById('tab-content');

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
                            cell.innerHTML = getI18N(ruin[header_cell.id]);
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
                            cell.innerHTML = ruin[header_cell.id] + 'km';
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
            let tab_content = document.getElementById('tab-content');

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
        component_img.src = repo_img_hordes_url + compo.img.replace(/\/(\w+)\.(\w+)\.(\w+)/, '/$1.$3');
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
        result_img.src = repo_img_hordes_url + result.item.img.replace(/\/(\w+)\.(\w+)\.(\w+)/, '/$1.$3');
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
    help_button.innerHTML = getI18N(texts.external_app_id_help_label);
    help_button.classList.add('help-button');

    let help_tooltip = document.createElement('div')
    help_tooltip.classList.add('tooltip', 'help', 'hidden');
    help_tooltip.setAttribute('style', `text-transform: initial; display: block; position: absolute;`);
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

    let update_external_tools_btn = document.getElementById(mh_update_external_tools_id);
    const zone_marker = document.getElementById('zone-marker');
    const chest = document.querySelector('.inventory.chest');

    /** Cette fonction ne doit s'exécuter que si on a un id d'app externe ET au moins l'une des options qui est cochée dans les paramètres ET qu'on est hors de la ville */
    if (nb_tools_to_update > 0 && external_app_id && (zone_marker || (chest && pageIsHouse()))) {
        if (!update_external_tools_btn) {

            let el = zone_marker?.parentElement.parentElement.parentElement || chest.parentElement;

            let updater_bloc = document.createElement('div');
            updater_bloc.style.marginTop = '1em';
            updater_bloc.style.padding = '0.25em';
            updater_bloc.style.border = '1px solid #ddab76';
            el.appendChild(updater_bloc);
            let updater_title = document.createElement('h5');
            updater_title.style.margin = '0 0 0.5em'
            let updater_title_mho_img = document.createElement('img');
            updater_title_mho_img.src = mh_optimizer_icon;
            updater_title_mho_img.style.height = '24px';
            updater_title_mho_img.style.marginRight = '0.5em';
            updater_title.appendChild(updater_title_mho_img);

            let updater_title_text = document.createElement('text');
            updater_title_text.innerHTML = GM_info.script.name;
            updater_title.appendChild(updater_title_text);

            updater_bloc.appendChild(updater_title);

            let btn = document.createElement('button');

            btn.innerHTML = '<img src ="' + repo_img_hordes_url + 'emotes/arrowright.gif">' + getI18N(texts.update_external_tools_needed_btn_label);
            btn.id = mh_update_external_tools_id;

            btn.addEventListener('click', () => {
                /** Au clic sur le bouton, on appelle la fonction de mise à jour */
                btn.innerHTML = '<img src ="' + repo_img_hordes_url + 'emotes/middot.gif">' + getI18N(texts.update_external_tools_pending_btn_label);
                updateExternalTools().then();
            })

            updater_bloc.appendChild(btn);
        }

        let warn_missing_logs = document.getElementById(mho_warn_missing_logs_id);

        if (!warn_missing_logs && document.querySelector('.log-complete-link') && zone_marker && update_external_tools_btn && mho_parameters.update_mho_digs) {
            warn_missing_logs = document.createElement('div');
            warn_missing_logs.id = mho_warn_missing_logs_id;
            warn_missing_logs.classList.add('note', 'note-important');
            warn_missing_logs.innerHTML = getI18N(texts.warn_missing_logs_title);
            let warn_help = createHelpButton(getI18N(texts.warn_missing_logs_help));
            warn_missing_logs.appendChild(warn_help);

            update_external_tools_btn.parentElement.appendChild(warn_missing_logs);
        } else if (warn_missing_logs && (!document.querySelector('.log-complete-link') || !mho_parameters.update_mho_digs)) {
            warn_missing_logs.remove();
        }
    } else if (update_external_tools_btn && (nb_tools_to_update === 0 || !external_app_id || !(zone_marker && pageIsHouse()))) {
        update_external_tools_btn.parentElement.remove();
    }
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

/** Si l'option associée est activée, affiche un champ de recherche sur la page de chantiers */
function displaySearchFieldOnBuildings() {
    let search_field = document.getElementById(mho_search_building_field_id);
    if (mho_parameters.display_search_fields && pageIsConstructions()) {
        if (search_field) return;

        let tabs = document.querySelector('ul.buildings-tabs');
        if (tabs) {
            let tabs_block = tabs.parentElement;

            let search_field_container = document.createElement('div');

            search_field = document.createElement('input');
            search_field.type = 'text';
            search_field.id = mho_search_building_field_id;
            search_field.placeholder = getI18N(texts.search_building);
            search_field.classList.add('inline');
            search_field.setAttribute('style', 'min-width: 250px; margin-top: 1em; padding-left: 24px;');

            let buildings = Array.from(document.querySelectorAll('.buildings') || []);
            let building_rows = [];
            buildings.forEach((building) => {
                building_rows.push(...Array.from(building.querySelectorAll('.row-flex')));
            })
            search_field.addEventListener('keyup', (event) => {
                building_rows.forEach((building_row) => {
                    if (building_row.getElementsByTagName('span')[0].innerText.toLowerCase().indexOf(search_field.value.toLowerCase()) > -1) {
                        building_row.classList.remove('hidden');
                    } else {
                        building_row.classList.add('hidden');
                    }
                });

                buildings.forEach((building) => {
                    if (Array.from(building.children).every((child) => child.classList.contains('hidden'))) {
                        building.classList.add('hidden');
                    } else {
                        building.classList.remove('hidden');
                    }
                });
            });

            search_field_container.appendChild(search_field);

            let header_mho_img = document.createElement('img');
            header_mho_img.src = mh_optimizer_icon;
            header_mho_img.style.height = '24px';
            header_mho_img.style.position = 'relative';
            header_mho_img.style.left = '-250px';
            search_field_container.appendChild(header_mho_img);
            tabs_block.insertBefore(search_field_container, tabs);
        }
    } else if (search_field) {
        search_field.parentElement.remove();
    }
}

/** Si l'option associée est activée, affiche un champ de recherche sur la liste des destinataires d'un message */
function displaySearchFieldOnRecipientList() {
    let search_field = document.getElementById(mho_search_recipient_field_id);
    if (mho_parameters.display_search_fields && pageIsHouse()) {
        if (search_field) return;

        let recipients = document.querySelector('#recipient_list');
        if (recipients) {
            let search_field_container = document.createElement('div');

            search_field = document.createElement('input');
            search_field.type = 'text';
            search_field.id = mho_search_recipient_field_id;
            search_field.placeholder = getI18N(texts.search_recipient);
            search_field.classList.add('inline');
            search_field.setAttribute('style', 'padding-left: 24px; margin-bottom: 0.25em;');

            let recipients_list = Array.from(document.querySelectorAll('.recipient.link') || []);

            search_field.addEventListener('keyup', (event) => {
                recipients_list.forEach((recipient) => {
                    if (recipient.innerText.toLowerCase().indexOf(search_field.value.toLowerCase()) > -1) {
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

/** Si l'option associée est activée, affiche le nombre de pa nécessaires pour réparer un bâtiment suffisemment pour qu'il ne soit pas détruit lors de l'attaque */
function displayMinApOnBuildings() {
    if (mho_parameters.display_missing_ap_for_buildings_to_be_safe && pageIsConstructions()) {
        let complete_buildings = document.querySelectorAll('.row.complete');
        if (!complete_buildings || complete_buildings.length === 0) return;

        let broken_buildings = Array.from(complete_buildings).filter((complete_building) => complete_building.querySelector('.ap-bar'));

        if (!broken_buildings || broken_buildings.length === 0) return;

        broken_buildings.forEach((broken_building) => {
            let bar = broken_building.querySelector('.ap-bar');
            let tooltip = bar.querySelector('.tooltip');
            if (!tooltip || !tooltip.innerHTML) return;

            let status = tooltip.innerText.match(/[0-9]+\/[0-9]+/)[0].split('/');
            let nb_pts_per_ap = parseInt(tooltip.innerHTML.match(/<b>[0-9]+<\/b>/)[0].match(/[0-9]+/)[0], 10);
            let current = parseInt(status[0], 10);
            let total = parseInt(status[1], 10);

            let minimum_safe = Math.ceil(total * 70 / 100) + 1
            if (minimum_safe <= current) return;

            let missing_pts = minimum_safe - current;
            bar.style.display = 'flex';
            let new_ap_bar = bar.querySelector('.mho-safe-ap');
            if (!new_ap_bar) {
                new_ap_bar = document.createElement('div');
                new_ap_bar.classList.add('mho-safe-ap');
            }
            new_ap_bar.style.background = 'yellow';
            new_ap_bar.style.width = missing_pts / total * 100 + '%';
            bar.appendChild(new_ap_bar);

            let nb_ap = broken_building.querySelector('.build-req');
            let missing_ap_info = nb_ap.querySelector('.mho-missing-ap');
            if (!missing_ap_info) {
                missing_ap_info = document.createElement('span')
                missing_ap_info.classList.add('mho-missing-ap');
            }
            missing_ap_info.style.fontWeight = 'initial';
            missing_ap_info.style.fontSize = '0.8em';
            missing_ap_info.innerText = getI18N(texts.missing_ap_explanation).replace('%VAR%', Math.ceil(missing_pts / nb_pts_per_ap));
            nb_ap.appendChild(missing_ap_info);
        });
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
    let interval = setInterval(() => {
        let wishlist_section = document.getElementById('wishlist-section');

        let is_desert = pageIsDesert();
        let is_workshop = pageIsWorkshop();
        if (wishlist && mho_parameters.display_wishlist && (is_workshop || is_desert)) {
            if (wishlist_section) return;

            let used_wishlist = is_workshop ? wishlist.wishList['0'] : getWishlistForZone();

            let list_to_display = used_wishlist.filter((item) => {
                if (pageIsWorkshop()) {
                    return item.isWorkshop;
                } else {
                    return item.count - item.bankCount > 0
                }
            });
            if (pageIsWorkshop() && list_to_display.length === 0) return;

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
                    clearInterval(interval);
                    getWishlist().then(() => {
                        displayWishlistInApp();
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
                        header_cell.classList.add(header_cell_item.id === 'label' ? 'rw-5' : ((header_cell_item.id === 'priority' || header_cell_item.id === 'depot') ? 'rw-3' : 'rw-2'));
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
                        title.innerHTML = `<img src="${repo_img_hordes_url + item.item.img}" class="priority_${item.priority}"  style="margin-right: 5px" /><span class="small">${getI18N(item.item.label)}</span>`;
                        list_item.appendChild(title);

                        let item_priority = document.createElement('span');
                        item_priority.classList.add('padded', 'cell', 'rw-3');
                        item_priority.innerHTML = `<span class="small">${getI18N(wishlist_priorities.find((priority) => item.priority.toString().slice(0, 1) === priority.value.toString().slice(0, 1)).label)}</span>`;
                        list_item.appendChild(item_priority);

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
                        bank_need.innerHTML = `<span class="small">${item.count}</span>`;
                        list_item.appendChild(bank_need);

                        let needed = document.createElement('span');
                        needed.classList.add('padded', 'cell', 'rw-2');
                        needed.innerHTML = `<span class="small">${item.count - item.bankCount - item.bagCount}</span>`;
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
            };

            wishlist_section = document.createElement('div');
            wishlist_section.id = 'wishlist-section';
            wishlist_section.classList.add('row');

            if (pageIsWorkshop()) {
                let workshop_table = document.getElementsByClassName('row-table')[0];
                if (workshop_table) {
                    workshop_table.parentNode.insertBefore(wishlist_section, workshop_table.nextSibling);
                }
            } else {
                let actions_box = document.getElementsByClassName('actions-box')[0];
                if (actions_box) {
                    let main_actions = actions_box.parentNode;
                    main_actions.parentNode.insertBefore(wishlist_section, main_actions.nextSibling);
                }
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
    }, 0);
}

/** Affiche la priorité directement sur les éléments si l'option associée est cochée */
function displayPriorityOnItems() {
    if (mho_parameters.display_wishlist && pageIsDesert() && wishlist) {
        let present_items = [];
        let inventories = document.getElementsByClassName('inventory');
        if (inventories) {
            for (let inventory of inventories) {
                present_items.push(...inventory.getElementsByTagName('img'));
            }
        }

        let used_wishlist = getWishlistForZone();

        if (used_wishlist) {
            used_wishlist
                .filter((wishlist_item) => wishlist_item.priority !== 0)
                .forEach((wishlist_item) => {
                    present_items
                        .filter((present_item) => present_item.src.replace(/\/(\w+)\.(\w+)\.(\w+)/, '/$1.$3').indexOf(wishlist_item.item.img) > 0)
                        .forEach((present_item) => {
                            present_item.parentElement.parentElement.classList.add('priority_' + wishlist_item.priority);
                        });
                });
        }
    }
}

function getWishlistForZone() {

    if (!wishlist || !wishlist.wishList) return undefined;

    let position = getCurrentPosition() || 0;
    let current_zone = (Math.abs(position[0]) + Math.abs(position[1])) * 2 - 3;
    let zones = Object.keys(wishlist.wishList)
        .map((zone) => +zone)
        .filter((zone) => zone > current_zone && zone !== 0);
    zones = zones
        .sort((zone_a, zone_b) => zone_a - zone_b);
    return zones.length === 0 ? wishlist.wishList[0] : wishlist.wishList[zones[0]];
}

/** Affiche les tooltips avancés */
function displayAdvancedTooltips() {
    if (mho_parameters.enhanced_tooltips && items) {

        let tooltip_container = document.getElementById('tooltip_container');
        let advanced_tooltip_container = document.getElementById('mho-advanced-tooltip');
        if (tooltip_container.innerHTML) {
            let hovered = document.querySelectorAll(":hover");
            let hovered_item;
            for (let item of hovered) {
                if (item.classList.contains('item-icon')) {
                    let hovered_item_img = item.firstElementChild.src;
                    let index = hovered_item_img.indexOf(hordes_img_url);
                    hovered_item_img = hovered_item_img.slice(index).replace(hordes_img_url, '');
                    hovered_item = items.find((item) => item.img === hovered_item_img.replace(/\/(\w+)\.(\w+)\.(\w+)/, '/$1.$3'));
                }
            }

            if (hovered_item) {
                let tooltip_content = tooltip_container.firstElementChild;
                let item_deco = tooltip_content.getElementsByClassName('item-tag-deco')[0];
                let should_display_advanced_tooltip = hovered_item.recipes.length > 0 || hovered_item.actions || hovered_item.properties || (item_deco && hovered_item.deco > 0);

                if (should_display_advanced_tooltip) {

                    if (!advanced_tooltip_container) {
                        advanced_tooltip_container = document.createElement('div');
                        advanced_tooltip_container.id = 'mho-advanced-tooltip';
                        advanced_tooltip_container.setAttribute('style', 'margin-top: 0.5em; border-top: 1px solid;');

                        tooltip_content.appendChild(advanced_tooltip_container);
                    } else if (!advanced_tooltip_container.innerHTML) {
                        createAdvancedProperties(advanced_tooltip_container, hovered_item, tooltip_container);
                    }
                } else if (advanced_tooltip_container) {
                    advanced_tooltip_container.remove();
                }
            }
        } else if (advanced_tooltip_container) {
            advanced_tooltip_container.remove();
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
        stock_div.style.borderBottom = '1px solid white';

        let bank_div = document.createElement('div');
        bank_div.innerText = getI18N(wishlist_headers[3].label) + ' : ' + item.bankCount;
        stock_div.appendChild(bank_div);

        if (item.wishListCount && item.wishListCount > 0) {
            let wishlist_wanted_div = document.createElement('div');
            stock_div.appendChild(wishlist_wanted_div);
            wishlist_wanted_div.innerText = getI18N(wishlist_headers[5].label) + ' : ' + item.wishListCount;
        }
    }
    if ((!item_deco || item.deco === 0) && !item.properties && !item.actions && item.recipes.length === 0) return;

    if (tooltip) {
        console.log('hovered_item', item);
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
            tooltip.firstElementChild.classList.add('large-tooltip');
        }
        let item_recipes = document.createElement('div');
        item_recipes.classList.add('recipe');
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
                item_action.innerHTML = `Trouvaille`;
            } else {
                item_action.classList.remove('item-tag');
            }
            break;
        case 'hero_find_lucky':
            item_action.classList.add(`item-tag-hero`);
            item_action.innerHTML = `Trouvaille améliorée`;
            break;
        case 'ressource':
            item_action.innerHTML = `Ressource`;
            break;
        case 'flash_photo_1':
            var fail_1 = Math.round(60 / 90 * 100);
            item_action.innerHTML = `${100 - fail_1}% de chances de pouvoir fuir pendant 30 secondes`;
            break;
        case 'flash_photo_2':
            var fail_2 = Math.round(30 / 90 * 100);
            item_action.innerHTML = `${100 - fail_2}% de chances de pouvoir fuir pendant 60 secondes`;
            break;
        case 'flash_photo_3':
            var fail_3 = 1;
            item_action.innerHTML = `Succès : ${100 - fail_3}% de chances de pouvoir fuir pendant 120 secondes`;
            break;
        case 'can_cook':
            item_action.innerHTML = `Peut être cuisiné`;
            break;
        case 'pet':
            item_action.innerHTML = `Animal`;
            break;
        case 'can_poison':
            item_action.innerHTML = `Peut être empoisonné`;
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
            item_action.innerHTML = `Peut être rechargé`;
            break;
        case 'smokebomb':
            item_action.classList.add(`item-tag-smokebomb`);
            item_action.innerHTML = `Efface les entrées du registre (-3 minutes)<br />Dissimule votre prochaine entrée (+1 minute)`
            break;
        case 'improve':
            item_action.innerHTML = `Permet d'aménager un campement`
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
                var days = mh_user.townDetails.day;
                var success = Math.round((+days <= 3 ? 1 : Math.max(0.1, 1 - (+days * 0.025))) * 10000) / 100;
                item_action.innerHTML = `${success}% de chances de réussir son manuel`;
            } else {
                item_action.classList.remove('item-tag');
            }
            break;
        case 'hero_surv_2':
            // ne pas afficher
            item_action.classList.remove('item-tag');
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
        case 'prevent_night':
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

function createDisplayMapButton() {
    let interval = setInterval(() => {
        let display_map_btn = document.getElementById(mho_display_map_id);

        if (mho_parameters.display_map) {
            if (display_map_btn) return;

            let btn_container = document.createElement('div');
            btn_container.id = mho_display_map_id;
            setTimeout(() => {
                let postbox = document.getElementById('postbox');
                let position = postbox.getBoundingClientRect().width + 15;
                btn_container.setAttribute('style', `right: ${position}px`);
            }, 500);
            let btn = document.createElement('div');

            let btn_mho_img = document.createElement('img');
            btn_mho_img.src = mh_optimizer_icon;
            btn_mho_img.style.height = '16px';
            btn_mho_img.style.marginRight = '0.5em';
            btn.appendChild(btn_mho_img);

            let btn_img = document.createElement('img');
            btn_img.src = repo_img_hordes_url + 'emotes/explo.gif';
            btn.appendChild(btn_img);

            btn.addEventListener('click', (event) => {
                event.stopPropagation();
                event.preventDefault();
                displayMapContent();
            })

            btn_container.appendChild(btn);

            const header = document.getElementById('header');
            header.appendChild(btn_container);

            createMapWindow();
            clearInterval();
        } else if (display_map_btn) {
            display_map_btn.remove();
            clearInterval(interval);
        }
    }, 3000);
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
                        path.style.left = '5px';
                        path.style.top = '5px';
                        path.style.right = '5px';
                        path.style.bottom = '0';
                        td.classList.add('exit');
                    } else {
                        path.style.left = cell.borders[0] === '0' ? '5px' : '0';
                        path.style.top = cell.borders[1] === '0' ? '5px' : '0';
                        path.style.right = cell.borders[2] === '0' ? '5px' : '0';
                        path.style.bottom = cell.borders[3] === '0' ? '5px' : '0';
                    }
                    td_content.appendChild(path);
                } else {
                    td.classList.add('empty');
                }

                if (cell.zombies && cell.zombies !== '' && cell.zombies > 0) {
                    let zombies = document.createElement('div');
                    zombies.innerText = cell.zombies;
                    zombies.style.position = 'absolute';
                    zombies.style.bottom = '5px';
                    zombies.style.right = '5px';
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

    GM.getValue(mho_map_key).then((mho_map) => {
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
            // if (mho_map.map === 'ruin') {
            //     createOptimizePathButton();
            // }
        }
    });
}


function createOptimizePathButton() {
    let opti_button_parent = document.getElementById('optimizer-map-window-content');
    let opti_button = document.createElement('button');
    opti_button.setAttribute('style', 'max-width: initial');
    opti_button.innerHTML = `<span style="margin: auto; vertical-align: middle;">[i18n] Chemin optimisé</span>`;
    opti_button.id = mho_opti_map_id;
    opti_button.addEventListener('click', () => {
        opti_button.disabled = true;
        getOptimalPath(mapToOptimize()).then((optimal_path) => displayOptimalPath(optimal_path));
    });
    opti_button_parent.appendChild(opti_button);
}

function mapToOptimize() {
    let map = document.querySelector('#optimizer-map-window-content');
    let rows = Array.from(map.querySelectorAll('tr') || []).filter((row) => Array.from(row.querySelectorAll('td') || []).some((col) => {
        return !col.classList.contains('around-map') // Ligne d'index
    }));
    let final_rows = [];
    let doors_positions = [];
    let entrance = {};

    rows.forEach((row, row_index) => {
        let cols = Array.from(row.querySelectorAll('td') || []);
        let final_cols = cols
            .filter((col) => !col.classList.contains('around-map')) // Colonne d'index
            .map((col, col_index) => {
                if (col.classList.contains('empty')) {
                    // Pas de passage
                    return 0;
                } else {
                    // Porte
                    if (col.classList.contains('door')) {
                        doors_positions.push({colIndex: col_index, rowIndex: row_index});
                    }
                    // Entrée
                    if (col.classList.contains('exit')) {
                        entrance = {colIndex: col_index, rowIndex: row_index};
                    }
                    return 1;
                }
            });
        final_rows.push(final_cols);
    });
    return {
        map: final_rows,
        doors: doors_positions,
        entrance: entrance
    }
}

function displayOptimalPath(html, response) {
    console.log('display opti');
    let rows = Array.from(html.querySelectorAll('tr') || [])
        .filter((row) => Array.from(row.querySelectorAll('td') || []).some((col) => {
            return !col.classList.contains('bordCarteRuine') // Ligne d'index
        }))
        .map((row) => {
            return Array.from(row.querySelectorAll('td') || []).filter((col) => !col.classList.contains('bordCarteRuine')) // Colonne d'index
        });

    rows.forEach((row, row_index) => {
        let response_pos_in_row = response.filter((response_pos) => response_pos.row === row_index);
        if (response_pos_in_row && response_pos_in_row.length > 0) {
            console.log('response_pos_in_row', response_pos_in_row);
            row.forEach((col, col_index) => {
                let response_at_pos = response_pos_in_row.filter((response_pos) => response_pos.column === col_index);
                if (response_at_pos && response_at_pos.length > 0) {
                    let mho_path_div = document.createElement('div');
                    mho_path_div.classList.add('mho_opti_path');
                    mho_path_div.setAttribute('style', 'position: absolute; top: 0; right: 0; bottom: 0; left: 0; display: flex; justify-content: space-around;');
                    col.appendChild(mho_path_div);
                }
            });
        }
    });

    response.forEach((path, index) => {
        let path_cell = rows[path.row][path.column];

        let path_div = document.createElement('span');
        path_div.setAttribute('posPath', index);

        let next_path = response[index + 1];
        if (next_path) {

            let next_path_cell = rows[next_path.row][next_path.column];

            let next_path_div = document.createElement('span');
            next_path_div.setAttribute('posPath', index);

            path_div.setAttribute('position', 'start');
            next_path_div.setAttribute('position', 'end');

            if (next_path.column === path.column) { // Déplacement vertical
                path_div.setAttribute('orientation', 'vertical');
                next_path_div.setAttribute('orientation', 'vertical');
                if (next_path.row > path.row) { // on se déplace vers le bas
                    path_div.setAttribute('alignment', 'bottom');
                    next_path_div.setAttribute('alignment', 'top');
                } else { // on se déplace vers le haut
                    path_div.setAttribute('alignment', 'top');
                    next_path_div.setAttribute('alignment', 'bottom');
                }

                path_div.style.height = 'calc(50% - 4px)';
                path_div.style.width = '4px';
                path_div.style.display = 'inline-block';
                path_div.style.backgroundColor = 'red';
                next_path_div.style.height = 'calc(50% - 4px)';
                next_path_div.style.width = '4px';
                next_path_div.style.display = 'inline-block';
                next_path_div.style.backgroundColor = 'red';
            } else { // Déplacement horizontal
                path_div.setAttribute('orientation', 'horizontal');
                next_path_div.setAttribute('orientation', 'horizontal');

                if (next_path.column > path.column) { // on se déplace vers la gauche
                    path_div.setAttribute('alignment', 'right');
                    next_path_div.setAttribute('alignment', 'left');
                } else { // on se déplace vers la droite
                    path_div.setAttribute('alignment', 'left');
                    next_path_div.setAttribute('alignment', 'right');
                }

                path_div.style.width = 'calc(50% - 4px)';
                path_div.style.height = '4px';
                path_div.style.display = 'inline-block';
                path_div.style.backgroundColor = 'red';
                next_path_div.style.width = 'calc(50% - 4px)';
                next_path_div.style.height = '4px';
                next_path_div.style.display = 'inline-block';
                next_path_div.style.backgroundColor = 'red';
            }

            path_div.style.marginLeft = path_div.getAttribute('alignment') === 'right' ? '50%' : 'initial';
            path_div.style.marginRight = path_div.getAttribute('alignment') === 'left' ? '50%' : 'initial';
            path_div.style.marginTop = path_div.getAttribute('alignment') === 'bottom' ? '50%' : 'initial';
            path_div.style.marginBottom = path_div.getAttribute('alignment') === 'top' ? '50%' : 'initial';

            next_path_div.style.marginLeft = next_path_div.getAttribute('alignment') === 'right' ? '50%' : 'initial';
            next_path_div.style.marginRight = next_path_div.getAttribute('alignment') === 'left' ? '50%' : 'initial';
            next_path_div.style.marginTop = next_path_div.getAttribute('alignment') === 'bottom' ? '50%' : 'initial';
            next_path_div.style.marginBottom = next_path_div.getAttribute('alignment') === 'top' ? '50%' : 'initial';

            path_cell.querySelector('.mho_opti_path')?.appendChild(path_div);
            next_path_cell.querySelector('.mho_opti_path')?.appendChild(next_path_div);
        }
        console.log('cell', path_cell);
    });

    console.log('rows', rows);
    console.log('response', response);
}


/** Si l'option associée est activée, demande confirmation avant de quitter si les options d'escorte ne sont pas bonnes */
function preventFromLeaving() {
    if (mho_parameters.prevent_from_leaving && pageIsDesert()) {
        let prevent_function = (event) => {
            let e = event || window.event;

            let buttons = document.getElementsByTagName('button');
            let ae_button;
            for (let button of buttons) {
                if (button.getAttribute('x-toggle-escort') && !button.classList.contains('inline') && button.getAttribute('x-toggle-escort') === '1') {
                    ae_button = button;

                    let mho_leaving_info = document.getElementById('mho-leaving-info');
                    if (!mho_leaving_info) {
                        mho_leaving_info = document.createElement('div');
                        mho_leaving_info.id = 'mho-leaving-info';
                        mho_leaving_info.setAttribute('style', 'background-color: red; padding: 0.5em; margin-top: 0.5em; border: 1px solid;');
                        mho_leaving_info.innerHTML = getI18N(texts.prevent_from_leaving_information) + getI18N(texts.prevent_not_in_ae);
                        button.parentNode.insertBefore(mho_leaving_info, button.nextSibling);
                    }

                }
            }

            let is_escorting = document.getElementsByClassName('beyond-escort-on')[0];

            if (is_escorting) {
                let mho_leaving_info = document.getElementById('mho-leaving-info');
                if (!mho_leaving_info) {
                    mho_leaving_info = document.createElement('div');
                    mho_leaving_info.id = 'mho-leaving-info';
                    mho_leaving_info.setAttribute('style', 'background-color: red; padding: 0.5em; margin-top: 0.5em; border: 1px solid;');
                    mho_leaving_info.innerHTML = getI18N(texts.prevent_from_leaving_information) + getI18N(texts.escort_not_released);
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

/** Affiche une notification 5 secondes avant la fin de la fouille en cours */
function notifyOnSearchEnd() {
    let interval = setInterval(() => {
        if (mho_parameters.notify_on_search_end && pageIsDesert()) {
            let count = document.querySelector('span[x-countdown]');
            if (count) {
                clearInterval(interval);
                let countdown_array = count.innerText.split(':');
                if (countdown_array.length < 3) {
                    countdown_array.splice(0, 0, 0);
                }
                let countdown = (+countdown_array[0] * 60 * 60) + (+countdown_array[1] * 60) + (+countdown_array[2]);
                if (countdown < 5) {
                    if (!pageIsTown()) {
                        GM_notification({
                            text: getI18N(texts.search_ended),
                            title: GM_info.script.name,
                            highlight: true,
                            timeout: 0
                        });
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
        } else if (pageIsTown()) {
            clearInterval(interval);
            notifyOnSearchEnd();
        }
    }, 250);
}

function notifyOnNewMessage() {
    if (mho_parameters.notify_on_new_msg) {
        let counter = document.querySelector('#postbox-new-msg-counter');
        if (counter && counter.innerText !== count_pending_notifications && counter.innerText !== '0') {
            count_pending_notifications = counter.innerText;
            GM_notification({
                text: getI18N(texts.new_message).replace('%VAR%', count_pending_notifications),
                title: GM_info.script.name,
                highlight: true,
                timeout: 0
            });
        }
    }
}

/** Affiche le nombre de zombies morts aujourd'hui */
function displayNbDeadZombies() {
    if (mho_parameters.display_nb_dead_zombies && pageIsDesert()) {
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
                nb_dead_zombies.innerText = nb_dead_zombies;

                let despair_deaths_element = document.getElementById(despair_deaths_id);
                nb_dead_zombies.innerText = despair_deaths;
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

        let gma = document.getElementById('gma');
        if (!gma) return;

        let langs = [
            {value: 'de', img: '🇩🇪'},
            {value: 'en', img: '🇬🇧'},
            {value: 'es', img: '🇪🇸'},
            {value: 'fr', img: '🇫🇷'},
        ]
        let mho_display_translate_input_div = createSelectWithSearch();
        mho_display_translate_input_div.id = mho_display_translate_input_id;
        mho_display_translate_input_div.setAttribute('style', 'position: absolute; top: 45px; right: 8px; margin: 0; width: 250px; height: 25px;');
        let label = mho_display_translate_input_div.firstElementChild;

        let input = label.firstElementChild;
        input.setAttribute('style', 'width: calc(100% - 35px); display: inline-block; padding-right: 40px');

        let btn_mho_img = document.createElement('img');
        btn_mho_img.src = mh_optimizer_icon;
        btn_mho_img.style.height = '24px';
        btn_mho_img.style.float = 'right';
        btn_mho_img.style.position = 'relative';
        btn_mho_img.style.top = '-25px';
        label.insertBefore(btn_mho_img, label.lastElementChild);

        let select = document.createElement('select');
        select.classList.add('small');
        select.setAttribute('style', 'height: 25px; width: 35px; font-size: 12px');
        select.value = lang;

        langs.forEach((lang_option) => {
            let option = document.createElement('option');
            option.value = lang_option.value;
            option.setAttribute('style', 'font-size: 16px');
            option.innerHTML = lang_option.img;
            option.selected = lang_option.value === lang;
            select.appendChild(option);
        })

        label.insertBefore(select, input);

        let block_to_display = mho_display_translate_input_div.lastElementChild;
        block_to_display.setAttribute('style', 'float: right; z-index: 10; position: absolute; right: 0; min-width: 350px; background: #5c2b20; border: 1px solid #ddab76; box-shadow: 0 0 3px #000; outline: 1px solid #000; color: #ddab76; max-height: 50vh; overflow: auto;');
        input.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
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
                                display_all_text.innerHTML = getI18N(texts.display_all_search_result);
                            } else {
                                display_all_img.src = `${repo_img_hordes_url}/icons/small_less.gif`;
                                display_all_text.innerHTML = getI18N(texts.display_exact_search_result);
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
        gma.appendChild(mho_display_translate_input_div);
    } else if (display_translate_input) {
        display_translate_input.remove();
    }
}

function displayCellDetailsOnPage() {
    if (mho_parameters.display_more_informations_from_mho && pageIsDesert()) {
        let cell = getCellDetailsByPosition();
        let cell_note = document.querySelector('#cell-note');
        if (cell && (!current_cell || cell.id !== current_cell.id)) {
            current_cell = cell;
            if (!cell_note) {
                cell_note = document.createElement('div');
                cell_note.id = 'cell-note';
                cell_note.classList.add('row');

                let cell_note_div = document.createElement('div');
                cell_note_div.style.width = '100%';
                cell_note_div.classList.add('background', 'cell');
                cell_note.appendChild(cell_note_div);

                let cell_note_header = document.createElement('h5');
                cell_note_header.style.marginTop = '0';
                cell_note_header.style.display = 'flex';
                cell_note_header.style.justifyContent = 'space-between';
                cell_note_header.style.alignItems = 'center';
                cell_note_div.appendChild(cell_note_header);

                let cell_note_header_left = document.createElement('div');
                cell_note_header_left.innerHTML = `<img src="${mh_optimizer_icon}" style="width: 24px; height: 24px; margin-right: 0.5em">${getI18N(texts.note)}`;
                cell_note_header.appendChild(cell_note_header_left);

                let cell_note_header_right = document.createElement('div');
                cell_note_header_right.innerHTML = `🗘`;
                cell_note_header_right.style.fontSize = '16px';
                cell_note_header_right.style.cursor = 'pointer';
                cell_note_header.appendChild(cell_note_header_right);

                cell_note_header_right.addEventListener('click', () => {
                    cell_note.querySelector('#cell-note-content').innerText = '🗘';
                    getMap().then(() => {
                        cell = getCellDetailsByPosition();
                        cell_note.querySelector('#cell-note-content').innerText = cell.note;
                    });
                });

                let cell_note_content = document.createElement('div');
                cell_note_content.id = 'cell-note-content';
                cell_note_div.appendChild(cell_note_content);

                let map_box = document.querySelector('.map-box');

                map_box.parentElement.parentElement.appendChild(cell_note);
            }
            cell_note.querySelector('#cell-note-content').innerText = cell.note;
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

        estim_block = document.createElement('div');
        estim_block.id = mho_watchtower_estim_id;

        small_note.parentElement.insertBefore(estim_block, small_note);

        getEstimations().then((estimations) => {
            let saved_estimations = estimations;
            let updated_estimations = estimations;
            console.log('estimations', estimations);
        })

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
            forum_preview.parentElement.insertBefore(mho_anti_abuse_counter, forum_preview);
        } else {
            let actions_box = document.querySelector('.actions-box');
            if (!actions_box) return;
            actions_box.parentElement.insertBefore(mho_anti_abuse_counter, actions_box);
        }

        let header = document.createElement('h5');
        mho_anti_abuse_counter.appendChild(header);
        header.innerHTML = `<img src="${mh_optimizer_icon}" style="width: 30px !important; vertical-align: middle; margin-right: 0.5em;">${getI18N(texts.anti_abuse_title)}`;

        let content = document.createElement('div');
        mho_anti_abuse_counter.appendChild(content);

        let old_bag = document.querySelectorAll("#gma ul.rucksack li.item");

        document.addEventListener('click', () => {
            old_bag = document.querySelectorAll("#gma ul.rucksack li.item");

            document.addEventListener('mh-navigation-complete', (event) => {
                console.log('event mh-navigation-complete', event);
                let new_bag = document.querySelectorAll("#gma ul.rucksack li.item");
                if (old_bag.length < new_bag.length) {

                    GM.getValue(mho_anti_abuse_key).then((counter_values) => {
                        if (!counter_values) {
                            counter_values = [];
                        }
                        if (counter_values.length < 5) {
                            counter_values.push({item: '', take_at: new Date()});
                            GM.setValue(mho_anti_abuse_key, counter_values);
                        }
                    })
                }
                old_bag = document.querySelectorAll("#gma ul.rucksack li.item");
            }, {once: true});
        }, {signal: controller.signal})

    } else {
        controller.abort();
    }
}

function displayCampingPredict() {
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
                camping_predict_container.style.display = camping_predict_container.style.display === 'none' ? 'block' : 'none'
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
            updater_title_text.innerHTML = GM_info.script.name;
            updater_title_text.style.fontSize = '1.5em';
            updater_title.appendChild(updater_title_text);

            camping_predict_container.appendChild(updater_title);

            let zone_ruin = document.querySelector('.ruin-info b');
            let ruin = '';
            if (zone_ruin) {
                ruin = all_ruins.find((one_ruin) => getI18N(one_ruin.label).toLowerCase() === zone_ruin.innerText.toLowerCase()).id;
            }
            let conf = {
                town: mh_user.townDetails.townType.toLowerCase(),
                job: jobs.find((job) => mh_user.jobDetails.uid === job.img),
                distance: document.querySelector('.zone-dist > div > b')?.innerText.replace('km', ''), // OK
                campings: 0,
                pro: false,
                hidden_campers: 0,
                objects: 0,
                vest: false,
                tomb: false,
                zombies: document.querySelectorAll('.actor.zombie')?.length || 0,
                night: !!document.querySelector('.map.night'),
                devastated: mh_user.townDetails.isDevaste,
                phare: false,
                improve: 0,
                object_improve: 0,
                ruin: ruin
            }
            // console.log('conf', conf);

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
            vest.addEventListener('change', ($event) => {
                conf.vest = $event.srcElement.checked;
                calculateCampingProbabilities(conf);
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
            pro_camper.addEventListener('change', ($event) => {
                conf.pro = $event.srcElement.checked;
                calculateCampingProbabilities(conf);
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
            tomb.addEventListener('change', ($event) => {
                conf.tomb = $event.srcElement.checked;
                calculateCampingProbabilities(conf);
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
            nb_campings.classList.add('inline');
            nb_campings.addEventListener('change', ($event) => {
                conf.campings = +$event.srcElement.value;
                calculateCampingProbabilities(conf);
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
            objects_in_bag.classList.add('inline');
            objects_in_bag.addEventListener('change', ($event) => {
                conf.objects = +$event.srcElement.value;
                calculateCampingProbabilities(conf);
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
                calculateCampingProbabilities(conf);
            })
            ruin_type_div.appendChild(select_ruin_label);
            ruin_type_div.appendChild(select_ruin);

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
            zombies.classList.add('inline');
            zombies.addEventListener('change', ($event) => {
                conf.zombies = +$event.srcElement.value;
                calculateCampingProbabilities(conf);
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
            improve.classList.add('inline');
            improve.addEventListener('change', ($event) => {
                conf.improve = +$event.srcElement.value;
                calculateCampingProbabilities(conf);
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
            object_improve.value = conf.object_improve;
            object_improve.classList.add('inline');
            object_improve.addEventListener('change', ($event) => {
                conf.object_improve = +$event.srcElement.value;
                calculateCampingProbabilities(conf);
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
            hidden_campers.value = conf.hidden_campers;
            hidden_campers.classList.add('inline');
            hidden_campers.addEventListener('change', ($event) => {
                conf.hidden_campers = +$event.srcElement.value;
                calculateCampingProbabilities(conf);
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
            night.addEventListener('change', ($event) => {
                conf.night = $event.srcElement.checked;
                calculateCampingProbabilities(conf);
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
            phare.addEventListener('change', ($event) => {
                conf.phare = $event.srcElement.checked;
                calculateCampingProbabilities(conf);
            })
            phare_div.appendChild(phare);
            phare_div.appendChild(phare_label);


            calculateCampingProbabilities(conf);
        });

    } else if (camping_predict_container) {
        camping_predict_container.remove();
    }
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

                GM.getValue(mho_blacklist_key).then((blacklist) => {
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
                            GM.getValue(mho_blacklist_key).then((keys) => {
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
                                GM.setValue(mho_blacklist_key, [...temp_blacklist]);
                                blacklist = [...GM.getValue(mho_blacklist_key)];
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
        GM.getValue(mho_map_key).then((mho_map) => {
            GM.setValue(mho_map_key, {
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
    const btn_style = `#${btn_id} {`
        + 'background-color: #5c2b20;'
        + 'border: 1px solid #f0d79e;'
        + 'outline: 1px solid #000;'
        + 'position: absolute;'
        + 'top: 10px;'
        + 'z-index: 997;'
        + '}';

    const btn_hover_h1_span_style = `#${btn_id}:hover h1 span, #${btn_id}:hover h1 a {`
        + 'display: inline;'
        + '}';

    const btn_hover_div_style = `#${btn_id}:hover div {`
        + 'display: block;'
        + '}';

    const btn_h1_style = `#${btn_id} h1 {`
        + 'height: auto;'
        + 'font-size: 8pt;'
        + 'text-transform: none;'
        + 'font-variant: small-caps;'
        + 'background: none;'
        + 'cursor: help;'
        + 'margin: 0 5px;'
        + 'padding: 0;'
        + 'line-height: 17px;'
        + 'color: #f0d79e;'
        + 'display: flex;'
        + 'justify-content: space-between;'
        + 'align-items: center;'
        + '}';

    const btn_h1_img_style = `#${btn_id} h1 > div > img {`
        + 'vertical-align: -9%;'
        + '}';

    const btn_h1_hover_style = `#${btn_id}:hover h1 {`
        + 'border-bottom: 1px solid #b37c4a;'
        + 'margin-bottom: 5px;'
        + '}'

    const btn_h1_span_style = `#${btn_id} h1 span, #${btn_id} h1 a {`
        + 'color: #f0d79e;'
        + 'cursor: help;'
        + 'font-family: Trebuchet MS,Arial,Verdana,sans-serif;'
        + 'letter-spacing: 1px;'
        + 'line-height: 17px;'
        + 'text-align: left;'
        + 'text-transform: none;'
        + 'margin-left: 1em;'
        + 'display: none;'
        + '}';

    const btn_div_style = '#' + btn_id + ' > div {'
        + 'display: none;'
        + 'margin: 0 5px 8px 5px;'
        + 'font-size: 0.9em;'
        + 'width: 350px;'
        + '}';

    const mh_optimizer_window_style = '#' + mh_optimizer_window_id + '{'
        + 'background: url(' + repo_img_hordes_url + 'background/mask.png);'
        + 'height: 100%;'
        + 'opacity: 1;'
        + 'position: fixed;'
        + 'transition: opacity 1s ease;'
        + 'width: 100%;'
        + 'z-index: 999;'
        + 'padding: 0;'
        + '}';

    const mh_optimizer_window_hidden = `#${mh_optimizer_window_id}:not(.visible), #${mh_optimizer_map_window_id}:not(.visible) {`
        + 'opacity: 0;'
        + 'pointer-events: none;'
        + '}';

    const mh_optimizer_window_box_style_hidden = `#${mh_optimizer_window_id}:not(.visible) #${mh_optimizer_window_id}-box, #${mh_optimizer_map_window_id}:not(.visible) #${mh_optimizer_map_window_id}-box {`
        + 'transform: scale(0) translateY(1000px);'
        + '}';

    const mh_optimizer_window_box_style = `#${mh_optimizer_window_id} #${mh_optimizer_window_id}-box {`
        + 'background: url(' + repo_img_hordes_url + 'background/bg_content2.jpg) repeat-y 0 0/900px 263px,url(' + repo_img_hordes_url + 'background/bg_content2.jpg) repeat-y 100% 0/900px 263px;'
        + 'border-radius: 8px;'
        + 'box-shadow: 0 0 10px #000;'
        + 'left: calc(50% - 750px);'
        + 'position: absolute;'
        + 'top: 10px;'
        + 'bottom: 10px;'
        + 'right: 10px;'
        + 'left: 10px;'
        + 'transform: scale(1) translateY(0);'
        + 'transition: transform .5s ease;'
        + '}';

    const mh_optimizer_map_window_box_style = `#${mh_optimizer_map_window_id} #${mh_optimizer_map_window_id}-box {`
        + 'background: url(' + repo_img_hordes_url + 'background/bg_content2.jpg) repeat-y 0 0/900px 263px,url(' + repo_img_hordes_url + 'background/bg_content2.jpg) repeat-y 100% 0/900px 263px;'
        + 'border-radius: 8px;'
        + 'box-shadow: 0 0 10px #000;'
        + 'position: absolute;'
        + 'transform: scale(1) translateY(0);'
        + 'transition: transform .5s ease;'
        + 'resize: both;'
        + 'overflow: auto;'
        + 'z-index: 9999;'
        + '}';

    const mh_optimizer_window_overlay_style = `#${mh_optimizer_window_id} #${mh_optimizer_window_id}-box #${mh_optimizer_window_id}-overlay, #${mh_optimizer_map_window_id} #${mh_optimizer_map_window_id}-box #${mh_optimizer_map_window_id}-overlay {`
        + 'position: absolute;'
        + 'right: 12px;'
        + 'top: -6px;'
        + 'text-align: right;'
        + '}'

    const wiki_window_overlay_ul_style = `#${mh_optimizer_window_id} #${mh_optimizer_window_id}-box #${mh_optimizer_window_id}-overlay ul, #${mh_optimizer_map_window_id} #${mh_optimizer_map_window_id}-box #${mh_optimizer_map_window_id}-overlay ul {`
        + 'margin: 2px;'
        + 'padding: 0;'
        + '}'

    const mh_optimizer_window_overlay_ul_li_style = `#${mh_optimizer_window_id} #${mh_optimizer_window_id}-box #${mh_optimizer_window_id}-overlay ul li, #${mh_optimizer_map_window_id} #${mh_optimizer_map_window_id}-box #${mh_optimizer_map_window_id}-overlay ul li {`
        + 'cursor: pointer;'
        + 'display: inline-block;'
        + '}'

    const mh_optimizer_window_content = `#${mh_optimizer_window_id}-content, #${mh_optimizer_map_window_id}-content {`
        + 'background: #7e4d2a;'
        + 'bottom: 0;'
        + 'color: #fff;'
        + 'left: 0;'
        + 'overflow: auto;'
        + 'padding: 2px;'
        + 'position: absolute;'
        + 'right: 0;'
        + 'top: 0;'
        + 'background: url(' + repo_img_hordes_url + 'background/box/panel_00.gif) 0 0 no-repeat,url(' + repo_img_hordes_url + 'background/box/panel_02.gif) 100% 0 no-repeat,url(' + repo_img_hordes_url + 'background/box/panel_20.gif) 0 100% no-repeat,url(' + repo_img_hordes_url + 'background/box/panel_22.gif) 100% 100% no-repeat,url(' + repo_img_hordes_url + 'background/box/panel_01.gif) 0 0 repeat-x,url(' + repo_img_hordes_url + 'background/box/panel_10.gif) 0 0 repeat-y,url(' + repo_img_hordes_url + 'background/box/panel_12.gif) 100% 0 repeat-y,url(' + repo_img_hordes_url + 'background/box/panel_21.gif) 0 100% repeat-x,#7e4d2a;'
        + 'border-radius: 12px;'
        + 'left: 18px;'
        + 'padding: 8px;'
        + 'right: 5px;'
        + '}';

    const tabs_style = '#tabs {'
        + 'color: #ddab76;'
        + 'font-size: 1.2rem;'
        + 'margin-bottom: 20px;'
        + 'position: relative;'
        + 'height: 25px;'
        + 'border-bottom: 1px solid #ddab76;'
        + '}';

    const tabs_ul_style = '#tabs ul {'
        + 'display: flex;'
        + 'flex-wrap: wrap;'
        + 'padding: 0;'
        + `background: url(${repo_img_hordes_url}background/tabs-header-plain.gif) 0 100% round;`
        + 'background-size: cover;'
        + 'height: 24px;'
        + 'margin-top: 2px;'
        + 'margin-right: 20px;'
        + 'padding-left: 0.5em;'
        + '}';

    const tabs_ul_li_style = '#tabs > ul > li {'
        + 'cursor: pointer;'
        + 'display: inline-block;'
        + 'margin-top: auto;'
        + 'margin-bottom: auto;'
        + '}';

    const tabs_ul_li_spacing_style = '#tabs > ul > li > div > img {'
        + 'margin-right: 0.5em;'
        + '}';

    const tabs_ul_li_div_style = '#tabs > ul > li > div {'
        + 'background-image: url(' + repo_img_hordes_url + 'background/tab.gif);'
        + 'background-position: 0 0;'
        + 'background-repeat: no-repeat;'
        + 'border-left: 1px solid #694023;'
        + 'border-right: 1px solid #694023;'
        + 'color: #f0d79e;'
        + 'cursor: pointer;'
        + 'float: right;'
        + 'font-family: Arial,sans-serif;'
        + 'font-size: 1rem;'
        + 'font-variant: small-caps;'
        + 'height: 21px;'
        + 'margin-left: 2px;'
        + 'margin-right: 0;'
        + 'margin-top: 3px;'
        + 'padding: 2px 4px 0;'
        + 'text-decoration: underline;'
        + 'white-space: nowrap;'
        + '}';

    const tabs_ul_li_div_hover_style = '#tabs > ul > li > div:hover {'
        + 'outline: 1px solid #f0d79e;'
        + 'text-decoration: underline;'
        + '}';

    const tabs_ul_li_selected_style = '#tabs > ul > li.selected {'
        + 'position: relative;'
        + 'top: 2px;'
        + '}';

    const tab_content_style = '#tab-content {'
        + 'position: absolute;'
        + 'bottom: 10px;'
        + 'left: 10px;'
        + 'right: 8px;'
        + 'top: 40px;'
        + 'overflow: auto;'
        + '}';

    const tab_content_item_list_style = '#tab-content > ul {'
        + 'display: flex;'
        + 'flex-wrap: wrap;'
        + 'padding: 0;'
        + 'margin: 0 0.5em;'
        + '}';

    const tab_content_item_list_item_style = '#tab-content > ul > li {'
        + 'min-width: 300px;'
        + 'flex-basis: min-content;'
        + 'padding: 0.125em 0.5em;'
        + 'margin: 0;'
        + '}';

    const tab_content_item_list_item_selected_style = '#tab-content > ul > li.selected {'
        + 'flex-basis: 100%;'
        + 'padding: 0.25em;'
        + 'margin: 0.25em 1px;'
        + '}';

    const tab_content_item_list_item_not_selected_properties_style = '#tab-content > ul > li:not(.selected) .properties {'
        + 'display: none;'
        + '}';

    const item_category = '#tab-content > ul div.mho-category {'
        + 'width: 100%;'
        + 'border-bottom: 1px solid;'
        + 'margin: 1em 0 0.5em;'
        + '}';

    const parameters_informations_style = '#categories, .parameters, #informations {'
        + 'margin-top: 0.5em;'
        + '}';

    const parameters_informations_ul_style = '#categories > ul, ul.parameters, #informations > ul {'
        + 'padding: 0;'
        + 'margin: 0;'
        + 'color: #f0d79e;'
        + '}';

    const li_style = '#categories > ul > li, ul.parameters > li, #tab-content ul > li {'
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

    const recipe_style = '#tab-content #recipes-list > li, #wishlist > li {'
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

    const input_number_webkit_style = 'input::-webkit-outer-spin-button, input::-webkit-inner-spin-button {'
        + '-webkit-appearance: none;'
        + 'margin: 0;'
        + '}';

    const input_number_firefox_style = 'input[type=number] {'
        + '-moz-appearance: textfield;'
        + '}';

    const wishlist_header = '#wishlist .mho-header, #wishlist > li {'
        + 'padding: 0 8px;'
        + 'margin: 0.125em 0;'
        + 'width: 100%;'
        + '}';

    const wishlist_even = '#tab-content #recipes-list > li:nth-child(even), #wishlist > li:nth-child(even) {'
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
        + 'max-width: 400px; !important'
        + '}';

    const item_priority_30 = `li.item[class^='priority_3'], li.item[class*=' priority_3'], img[class^='priority_3'], img[class*=' priority_3'] {`
        + 'box-shadow: inset 0 0 0.30em springgreen, 0 0 0.5em springgreen;'
        + '}';
    const item_priority_20 = `li.item[class^='priority_2'], li.item[class*=' priority_2'], img[class^='priority_2'], img[class*=' priority_2'] {`
        + 'box-shadow: inset 0 0 0.30em yellowgreen, 0 0 0.5em yellowgreen;'
        + '}';
    const item_priority_10 = `li.item[class^='priority_1'], li.item[class*=' priority_1'], img[class^='priority_1'], img[class*=' priority_1'] {`
        + 'box-shadow: inset 0 0 0.30em darkgoldenrod, 0 0 0.5em darkgoldenrod;'
        + '}';
    const item_priority_trash = 'li.item.priority_-1000, img.priority_-1000 {'
        + 'box-shadow: inset 0 0 0.30em darkslategrey, 0 0 0.5em darkslategrey;'
        + '}';

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

    const display_map_btn = `#${mho_display_map_id} {`
        + 'background-color: rgba(62,36,23,.75);'
        + 'border-radius: 6px;'
        + 'color: #ddab76;'
        + 'cursor: pointer;'
        + 'font-size: 10px;'
        + 'padding: 3px 5px;'
        + 'position: absolute;'
        + 'right: 41px;'
        + 'top: 100px;'
        + 'transition: background-color .5s ease-in-out;'
        + '}'

    const mho_map_td = `.mho-map tr td {`
        + `border: 1px dotted;`
        + `width: 30px;`
        + `min-width: 30px;`
        + `height: 30px;`
        + `min-height: 30px;`
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


    let css = btn_style + btn_hover_h1_span_style + btn_h1_style + btn_h1_img_style + btn_h1_hover_style + btn_h1_span_style + btn_div_style + btn_hover_div_style
        + mh_optimizer_window_style + mh_optimizer_window_hidden + mh_optimizer_window_box_style_hidden + mh_optimizer_window_box_style
        + mh_optimizer_window_overlay_style + mh_optimizer_window_overlay_ul_li_style + mh_optimizer_window_content
        + tabs_style + tabs_ul_style + tabs_ul_li_style + tabs_ul_li_spacing_style + tabs_ul_li_div_style + tabs_ul_li_div_hover_style + tabs_ul_li_selected_style
        + tab_content_style + tab_content_item_list_style + tab_content_item_list_item_style + tab_content_item_list_item_selected_style + tab_content_item_list_item_not_selected_properties_style + item_category
        + parameters_informations_style + parameters_informations_ul_style + li_style + recipe_style + input_number_webkit_style + input_number_firefox_style
        + mho_table_style + mho_table_header_style + mho_table_row_style + mho_table_cells_style + mho_table_cells_td_style + label_text
        + item_title_style + add_to_wishlist_button_img_style + advanced_tooltip_recipe_li + item_recipe_li + advanced_tooltip_recipe_li_ul + large_tooltip + item_list_element_style
        + wishlist_label + wishlist_header + wishlist_header_cell + wishlist_cols + wishlist_delete + wishlist_in_app + wishlist_in_app_item + wishlist_even
        + item_priority_10 + item_priority_20 + item_priority_30 + item_priority_trash + item_tag_food + item_tag_load + item_tag_hero + item_tag_smokebomb + item_tag_alcohol + item_tag_drug
        + display_map_btn + mh_optimizer_map_window_box_style + mho_map_td + dotted_background + empty_bat_before_after + empty_bat_after + camping_spaced_label + citizen_list_more_info_content
        + citizen_list_more_info_header_content;

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
        startLoading();

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
        GM.getValue(mho_map_key).then((mho_map) => {
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
            endLoading();
        });
    });
}


/** Récupère la carte de Gest'Hordes */
function getGHRuin() {
    return new Promise((resolve, reject) => {
        startLoading();
        GM.getValue(mho_map_key).then((mho_map) => {
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
                                    case 'ruineCarte_0':
                                        new_cell.borders = '0101';
                                        break;
                                    case 'ruineCarte_1':
                                        new_cell.borders = '1010';
                                        break;
                                    case 'ruineCarte_2':
                                        new_cell.borders = '1100';
                                        break;
                                    case 'ruineCarte_3':
                                        new_cell.borders = '0110';
                                        break;
                                    case 'ruineCarte_4':
                                        new_cell.borders = '1001';
                                        break;
                                    case 'ruineCarte_5':
                                        new_cell.borders = '0011';
                                        break;
                                    case 'ruineCarte_6':
                                        new_cell.borders = '1111';
                                        break;
                                    case 'ruineCarte_7':
                                        new_cell.borders = '0111';
                                        break;
                                    case 'ruineCarte_8':
                                        new_cell.borders = '1101';
                                        break;
                                    case 'ruineCarte_9':
                                        new_cell.borders = '1110';
                                        break;
                                    case 'ruineCarte_10':
                                        new_cell.borders = '1011';
                                        break;
                                    case 'ruineCarte_11':
                                        new_cell.borders = '1000';
                                        break;
                                    case 'ruineCarte_12':
                                        new_cell.borders = '0100';
                                        break;
                                    case 'ruineCarte_13':
                                        new_cell.borders = '0001';
                                        break;
                                    case 'ruineCarte_14':
                                        new_cell.borders = '0010';
                                        break;
                                    case 'ruineCarte_15':
                                        new_cell.borders = 'exit';
                                        break;
                                    case 'ruineCarte_17':
                                        new_cell.borders = '1010';
                                        break;
                                    default:
                                        new_cell.borders = '0000';
                                        break;
                                }
                                ;

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
        endLoading();
    });
}


/** Récupère la carte de GH */
function getBBHMap() {
    return new Promise((resolve, reject) => {
        startLoading();

        GM.xmlHttpRequest({
            method: 'GET',
            url: `https://bbh.fred26.fr/?cid=5-${mh_user.townDetails.townId}&pg=map`,
            responseType: 'document',
            onload: function (response) {
                if (response.status === 200) {
                    let new_map = [];
                    let map = response.response.querySelector('#carte');
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
                                            zombies: cell.querySelector('.zombies') ? Array.from(cell.querySelector('.zombies').classList).find((class_name) => class_name.startsWith('z_dng_')).replace('z_dng_', '') : undefined,
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
                } else {
                    addError(response);
                    reject(response);
                }
                endLoading();
            },
            onerror: function (error) {
                endLoading();
                addError(error);
                reject(error);
            }
        });
    });
}


/** Récupère la carte de BBH */
function getBBHRuin() {
    return new Promise((resolve, reject) => {
        startLoading();
        GM.getValue(mho_map_key).then((mho_map) => {
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
                                ;

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
        endLoading();
    });
}

/** Récupère la carte de FataMorgana */
function getFMMap() {
    return new Promise((resolve, reject) => {
        startLoading();

        let map_html = document.createElement('div');

        GM.getValue(mho_map_key).then((mho_map) => {
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
            endLoading();
        });
    });
}

/** Récupère la carte de FataMorgana */
function getFMRuin() {
    return new Promise((resolve, reject) => {
        startLoading();
        GM.getValue(mho_map_key).then((mho_map) => {
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
                                ;

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
        endLoading();
    });
}

////////////////
// Appels API //
////////////////

function getItems() {
    return new Promise((resolve, reject) => {
        GM.xmlHttpRequest({
            method: 'GET',
            url: api_url + '/myhordesfetcher/items' + (mh_user && mh_user.townDetails ? ('?townId=' + mh_user.townDetails.townId) : ''),
            responseType: 'json',
            onload: function (response) {
                if (response.status === 200) {
                    items = response.response
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
                } else {
                    addError(response);
                    reject(response);
                }
            },
            onerror: function (error) {
                endLoading();
                addError(error);
                reject(error);
            }
        });
    });
}

function getRuins() {
    return new Promise((resolve, reject) => {
        if (!ruins) {
            startLoading();
            GM.xmlHttpRequest({
                method: 'GET',
                url: api_url + '/myhordesfetcher/ruins?userKey=' + external_app_id,
                responseType: 'json',
                onload: function (response) {
                    if (response.status === 200) {
                        ruins = response.response.sort((a, b) => {
                            if (getI18N(a.label) < getI18N(b.label)) {
                                return -1;
                            }
                            if (getI18N(a.label) > getI18N(b.label)) {
                                return 1;
                            }
                            return 0;
                        });
                        resolve(ruins);
                    } else {
                        addError(response);
                        reject(response);
                    }
                    endLoading();
                },
                onerror: function (error) {
                    endLoading();
                    addError(error);
                    reject(error);
                }
            });
            endLoading();
        } else {
            resolve(ruins);
            endLoading();
        }
    })
}

/** Récupère les informations de la ville */
function getMe() {
    return new Promise((resolve, reject) => {
        if (external_app_id) {
            GM.xmlHttpRequest({
                method: 'GET',
                url: api_url + '/myhordesfetcher/me?userKey=' + external_app_id,
                responseType: 'json',
                onload: function (response) {
                    if (response.status === 200) {
                        mh_user = response.response;
                        if (!mh_user || mh_user.id === 0 && mh_user.townDetails.townId === 0) {
                            mh_user = '';
                        }
                        GM.setValue(mh_user_key, mh_user);
                        console.log('MHO - I am...', mh_user);
                        getItems().then(() => {
                            resolve();
                        });

                        if (mh_user !== '' && mh_user.townDetails.townId) {
                            getWishlist().then();
                            getMap().then();
                        }
                    } else {
                        addError(response);
                        reject(response);
                    }
                },
                onerror: function (error) {
                    addError(error);
                    reject(error);
                }
            });
        } else {
            resolve();
        }
    });
}

/** Récupère les informations de la ville */
function getCitizens() {
    return new Promise((resolve, reject) => {
        getHeroSkills().then((hero_skills) => {
            startLoading();
            GM.xmlHttpRequest({
                method: 'GET',
                url: api_url + `/myhordesfetcher/citizens?userId=${mh_user.id}&townId=${mh_user.townDetails.townId}`,
                responseType: 'json',
                onload: function (response) {
                    if (response.status === 200) {
                        citizens = response.response;
                        citizens.citizens = Object.keys(citizens.citizens).map((key) => citizens.citizens[key])
                        resolve(citizens);
                    } else {
                        addError(response);
                        reject(citizens);
                    }
                    endLoading();
                },
                onerror: function (error) {
                    endLoading();
                    addError(error);
                    reject(error);
                }
            });
        });
    });
}

/** Récupère les informations de la banque */
function getBank() {
    return new Promise((resolve, reject) => {
        startLoading();
        fetch(api_url + '/myhordesfetcher/bank?userKey=' + external_app_id)
            .then((response) => {
                if (response.status === 200) {

                    endLoading();
                    return response.json();
                } else {
                    addError(response);
                    reject(response);
                    endLoading();
                }
            })
            .then((response) => {
                let bank = [];
                response.bank.forEach((bank_item) => {
                    bank_item.item.broken = bank_item.isBroken;
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
                endLoading();
                addError(error);
                reject(error);
            });
    });
}

/** Récupère les informations de liste de course */
function getWishlist() {
    return new Promise((resolve, reject) => {
        fetch(api_url + '/wishlist?townId=' + mh_user.townDetails.townId)
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    wishlist = undefined;
                    addError(response);
                    reject(response);
                }
            })
            .then((response) => {
                for (let key in response.wishList) {
                    let wishlist_zone = response.wishList[key];
                    wishlist_zone = Object.keys(wishlist_zone)
                        .map((item_key) => wishlist_zone[item_key])
                        .sort((item_a, item_b) => item_b.priority > item_a.priority);
                    wishlist_zone.forEach((item) => {
                        item.item.img = item.item.img.replace(/\/(\w+)\.(\w+)\.(\w+)/, '/$1.$3');
                    });
                    response.wishList[key] = wishlist_zone;
                }
                wishlist = response;
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
        startLoading();
        GM.xmlHttpRequest({
            method: 'POST',
            url: api_url + '/wishlist/add/' + item.id + '?userId=' + mh_user.id + '&townId=' + mh_user.townDetails.townId,
            responseType: 'json',
            onload: function (response) {
                if (response.status === 200) {
                    item.wishListCount = 1;
                    resolve(item);
                    addSuccess(getI18N(api_texts.add_to_wishlist_success));
                } else {
                    addError(response);
                    reject(response);
                }
                endLoading();
            },
            onerror: function (error) {
                endLoading();
                addError(error);
                reject(error);
            }
        });
    });
}

/** Met à jour les outils externes (BBH, GH et Fata) en fonction des paramètres sélectionnés */
function updateExternalTools() {
    return new Promise(async (resolve, reject) => {
        startLoading();

        let convertImgToItem = (img) => {
            return items.find((item) => img.src.replace(/(.*)\/(\w+)\.(\w+)\.(\w+)/, '$1/$2.$4').indexOf(item.img) >= 0);
        }

        let convertListOfSingleObjectsIntoListOfCountedObjects = (objects) => {
            let object_map = [];
            objects.forEach((object) => {
                let object_in_map = object_map.find((_object_in_map) => _object_in_map.id === object.id && _object_in_map.isBroken === object.isBroken);
                if (object_in_map) {
                    object_in_map.count += 1;
                } else {
                    object.count = 1;
                    object_map.push(object);
                }
            });
            return object_map;
        }

        let data = {};
        let nb_dead_zombies = +document.querySelectorAll('.actor.splatter').length;

        data.townDetails = {
            townX: mh_user.townDetails.townX,
            townY: mh_user.townDetails.townY,
            townid: mh_user.townDetails.townId,
            isDevaste: mh_user.townDetails.isDevaste,
        };

        data.map = {}
        data.map.toolsToUpdate = {
            isBigBrothHordes: mho_parameters && mho_parameters.update_bbh && !is_mh_beta ? 'api' : 'none',
            isFataMorgana: mho_parameters && mho_parameters.update_fata ? 'api' : 'none',
            isGestHordes: mho_parameters && mho_parameters.update_gh ? (mho_parameters.update_gh_without_api && pageIsDesert() && (nb_dead_zombies > 0 || mh_user.townDetails.isDevaste) ? 'cell' : 'api') : 'none',
            isMyHordesOptimizer: mho_parameters && mho_parameters.update_mho ? (pageIsDesert() && (nb_dead_zombies > 0 || mh_user.townDetails.isDevaste) ? 'cell' : 'api') : 'none'
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

        if ((mho_parameters.update_gh_without_api || mho_parameters.update_mho) && pageIsDesert()) {
            let objects = Array.from(document.querySelector('.inventory.desert')?.querySelectorAll('li.item') || []).map((desert_item) => {
                let item = convertImgToItem(desert_item.querySelector('img'));
                return {id: item.id, isBroken: desert_item.classList.contains('broken')};
            });

            let content = {
                x: +position[0],
                y: +position[1],
                zombies: +document.querySelectorAll('.actor.zombie').length,
                deadZombies: nb_dead_zombies,
                zoneEmpty: !!document.querySelector('#mgd-empty-zone-note'),
                objects: convertListOfSingleObjectsIntoListOfCountedObjects(objects),
                citizenId: citizen_list.map((citizen) => citizen.id)
            }
            if (nb_dead_zombies > 0 || mh_user.townDetails.isDevaste) {
                data.map.cell = content;
            }
        }

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
                return {id: item.id, isBroken: rucksack_item.classList.contains('broken')};
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
        if ((mho_parameters.update_gh && mho_parameters.update_gh_ah) || (mho_parameters.update_mho && mho_parameters.update_mho_actions)) {

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
                    locale: null,
                    label: 'Empty',
                    value: pageIsDesert() ? 0 /* 'desert' */ : 1 /* 'town' */
                }
                data.heroicActions.actions.push(action);
            }

            let apag = document.querySelector('.pointer.rucksack [src*=item_photo]');
            if (apag) {
                let action = {
                    locale: lang,
                    label: apag.parentElement.nextElementSibling.querySelector('h1')?.innerText.replace('  ', ''),
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
        if (((mho_parameters.update_gh && mho_parameters.update_gh_amelios) || (mho_parameters.update_mho && mho_parameters.update_mho_house)) && pageIsHouse()) {
            data.amelios = {}
            data.amelios.values = {};
            data.amelios.toolsToUpdate = {
                isBigBrothHordes: false,
                isFataMorgana: false,
                isGestHordes: mho_parameters && mho_parameters.update_gh_amelios,
                isMyHordesOptimizer: mho_parameters && mho_parameters.update_mho_house
            };
            let amelios = Array.from(document.querySelectorAll('[x-tab-group="home-main"][x-tab-id="build"] .row-table .row:not(.header)') || []);
            if (amelios && amelios.length > 0) {
                amelios.forEach((amelio) => {
                    let amelio_img = amelio.querySelector('img');
                    let amelio_value = amelio_img?.nextElementSibling.innerText.match(/\d+/);
                    data.amelios.values[amelio_img.src.replace(/.*\/home\/(.*)\..*\..*/, '$1')] = amelio_value ? +amelio_value[0] : 0;
                });
            }
            let house_level = +document.querySelector('[x-tab-group="home-main"][x-tab-id="values"] .town-summary')?.querySelector('.row-detail img')?.alt;
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
                day: mh_user.townDetails.day,
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

            let arrivals = logs.filter((log) => log.innerText.toLowerCase().indexOf(getI18N(arrivals_texts).toLowerCase()) > -1).map((log) => {
                return {
                    time: log.querySelector('.log-part-time')?.innerText,
                    citizen: log.querySelector('.log-part-content span')?.innerText
                };
            });

            let now = document.querySelector('.clock [x-current-time]').innerText;

            citizen_list
                .filter((citizen) => { // On ne garde que les citoyens actuellement en train de fouiller
                    let is_digging = false;
                    if (citizen.id === mh_user.id) { // Il s'agit de l'utilisateur qui a cliqué sur le bouton
                        is_digging = document.querySelector('#mgd-digging-note [x-countdown]') ? true : false
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
                    let failed_digs = Array.from(logs.filter((log) => log.innerText.toLowerCase().indexOf(getI18N(failed_texts).toLowerCase()) > -1) || []).filter((log) => log.innerText.indexOf(citizen.userName) > -1) || [];
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


        console.log('Voici ce que j\'envoie :', data);
        let btn = document.getElementById(mh_update_external_tools_id);
        GM.xmlHttpRequest({
            method: 'POST',
            url: api_url + '/externaltools/update?userKey=' + external_app_id + '&userId=' + mh_user.id,
            data: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            },
            responseType: 'json',
            onload: function (response) {
                if (response.status === 200) {
                    if (response.response.mapResponseDto.bigBrothHordesStatus.toLowerCase() === 'ok') GM.setValue(gm_bbh_updated_key, true);
                    if (response.response.mapResponseDto.gestHordesApiStatus.toLowerCase() === 'ok' || response.response.mapResponseDto.gestHordesCellsStatus.toLowerCase() === 'ok') GM.setValue(gm_gh_updated_key, true);
                    if (response.response.mapResponseDto.fataMorganaStatus.toLowerCase() === 'ok') GM.setValue(gm_fata_updated_key, true);

                    let tools_fail = [];
                    let response_items = Object.keys(response.response).map((key) => {
                        return {key: key, value: response.response[key]}
                    });
                    response_items.forEach((response_item, index) => {
                        let final = Object.keys(response_item.value).map((key) => {
                            return {key: key, value: response_item.value[key]}
                        });
                        tools_fail = [...tools_fail, ...final.filter((final_item) => !final_item.value || (final_item.value.toLowerCase() !== 'ok' && final_item.value.toLowerCase() !== 'not activated'))];
                        if (index >= response_items.length - 1) {
                            btn.innerHTML = tools_fail.length === 0 ? `<img src="${repo_img_hordes_url}icons/done.png">` + getI18N(texts.update_external_tools_success_btn_label)
                                : `<img src ="${repo_img_hordes_url}emotes/warning.gif">${getI18N(texts.update_external_tools_errors_btn_label)}<br>${tools_fail.map((item) => item.key.replace('Status', ` : ${item.value}`)).join('<br>')}`;
                        }
                    });
                    if (tools_fail.length > 0) {
                        console.error(`Erreur lors de la mise à jour de l'un des outils`, response.response);
                    }

                    getMap();
                } else {
                    addError(response);
                    btn.innerHTML = `<img src="${repo_img_hordes_url}professions/death.gif">` + getI18N(texts.update_external_tools_fail_btn_label);
                }
                endLoading();
            },
            onerror: function (error) {
                endLoading();
                addError(error);
            }
        });
    });
}

/** Récupère la liste complète des pouvoirs héros */
function getHeroSkills() {
    return new Promise((resolve, reject) => {
        if (!hero_skills) {
            startLoading();
            GM.xmlHttpRequest({
                method: 'GET',
                url: api_url + '/myhordesfetcher/heroSkills',
                responseType: 'json',
                onload: function (response) {
                    if (response.status === 200) {
                        hero_skills = response.response.sort((a, b) => {
                            if (a.daysNeeded > b.daysNeeded) {
                                return 1;
                            } else if (a.daysNeeded === b.daysNeeded) {
                                return 0;
                            } else {
                                return -1;
                            }
                        });
                        resolve(hero_skills);
                    } else {
                        addError(response);
                        reject(response);
                    }
                    endLoading();
                },
                onerror: function (error) {
                    endLoading();
                    addError(error);
                    reject(error);
                }
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
            startLoading();
            GM.xmlHttpRequest({
                method: 'GET',
                url: api_url + '/myhordestranslation?' + locale + '&' + sourceString,
                responseType: 'json',
                onload: function (response) {
                    if (response.status === 200) {
                        resolve(response.response);
                    } else {
                        addError(response);
                        reject(response);
                    }
                    endLoading();
                },
                onerror: function (error) {
                    endLoading();
                    addError(error);
                    reject(error);
                }
            });
        }
    });
}

/** Récupère la liste complète des recettes */
function getRecipes() {
    return new Promise((resolve, reject) => {
        if (!recipes) {
            startLoading();
            GM.xmlHttpRequest({
                method: 'GET',
                url: api_url + '/myhordesfetcher/recipes',
                responseType: 'json',
                onload: function (response) {
                    if (response.status === 200) {
                        recipes = response.response.map((recipe) => {
                            recipe.type = action_types.find((type) => type.id === recipe.type);
                            return recipe;
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
                        resolve(recipes);
                    } else {
                        addError(response);
                        reject(recipes);
                    }
                    endLoading();
                },
                onerror: function (error) {
                    endLoading();
                    addError(error);
                    reject(error);
                }
            });
        } else {
            resolve(recipes);
        }
    });
}

/** Récupère la liste complète des paramètres en base */
function getParameters() {
    return new Promise((resolve, reject) => {
        startLoading();
        GM.xmlHttpRequest({
            method: 'GET',
            url: api_url + '/parameters/parameters',
            responseType: 'json',
            onload: function (response) {
                if (response.status === 200) {
                    parameters = response.response
                }
                resolve();
                endLoading();
            },
            onerror: function (error) {
                endLoading();
                addError(error);
                resolve(error);
            }
        });
    });
}

function getMap() {
    return new Promise((resolve, reject) => {
        fetch(api_url + '/myhordesfetcher/map?townId=' + mh_user.townDetails.townId)
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    addError(response);
                    reject(response);
                }
            })
            .then((response) => {
                map = response;
                resolve(map);
            })
            .catch((error) => {
                endLoading();
                addError(error);
                reject(error);
            });
    });
}

function getEstimations() {
    return new Promise((resolve, reject) => {
        fetch(api_url + `/AttaqueEstimation/Estimations/${mh_user.townDetails.day}?townId=${mh_user.townDetails.townId}`)
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    addError(response);
                    reject(response);
                }
            })
            .then((response) => {
                resolve(response);
            })
            .catch((error) => {
                endLoading();
                addError(error);
                reject(error);
            });
    });
}


/** Récupère le chemin optimal à partir d'une carte */
function getOptimalPath(map, html, button) {
    return new Promise((resolve, reject) => {
        map.doors = map.doors.slice(2);
        console.log('map before send', map);
        startLoading();
        GM.xmlHttpRequest({
            method: 'POST',
            data: JSON.stringify(map),
            url: api_url + '/ruine/pathopti',
            responseType: 'json',
            headers: {
                'Content-Type': 'application/json'
            },
            onload: function (response) {
                if (response.status === 200) {
                    resolve(response.reponse);
                } else {
                    addError(response);
                    reject(response);
                }
                endLoading();
            },
            onerror: function (error) {
                console.error(`${GM_info.script.name} : Une erreur s'est produite : \n`, error);
                endLoading();
                reject(error);
            }
        });
    });
}

function getApiKey() {
    return new Promise((resolve, reject) => {
        if (!external_app_id || external_app_id === '') {
            GM.xmlHttpRequest({
                method: 'POST',
                url: location.origin + '/jx/soul/settings',
                responseType: 'document',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-Request-Intent': 'WebNavigation',
                    'X-Render-Target': 'content'
                },
                data: JSON.stringify({}),
                onload: function (response) {
                    if (response.status === 200) {
                        let manual = () => {
                            let manual_app_id_key = prompt(getI18N(texts.manually_add_app_id_key));
                            if (manual_app_id_key) {
                                external_app_id = manual_app_id_key;
                                GM.setValue(gm_mh_external_app_id_key, external_app_id);
                                resolve(external_app_id);
                            } else {
                                reject(response);
                            }
                        }

                        let temp_body = document.createElement('body');
                        if (response.response && response.response.body && response.response.body.innerHTML) {
                            temp_body.innerHTML = response.response.body.innerHTML;
                            let id = temp_body.querySelector('#app_ext');
                            if (id && id !== '' && id !== 'not set') {
                                external_app_id = id.value && id.value !== '' && id.value !== 'not set' ? id.value : undefined;
                                GM.setValue(gm_mh_external_app_id_key, external_app_id);
                                resolve(external_app_id);
                            } else {
                                manual();
                            }
                        } else {
                            manual();
                        }
                    } else {
                        reject(response);
                    }
                },
                onerror: function (error) {
                    console.error(`${GM_info.script.name} : Une erreur s'est produite : \n`, error);
                    reject(error);
                }
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
    if (document.URL.startsWith('https://bbh.fred26.fr/') || document.URL.startsWith('https://gest-hordes2.eragaming.fr/') || document.URL.startsWith('https://fatamorgana.md26.eu/')) {
        let current_key = '';
        let map_block_id = '';
        let ruin_block_id = '';
        let block_copy_map_button = '';
        let block_copy_ruin_button = '';
        let source = '';

        if (document.URL.startsWith('https://bbh.fred26.fr/')) {
            current_key = gm_bbh_updated_key;
            map_block_id = 'carte';
            ruin_block_id = 'plan';
            block_copy_map_button = 'ul_infos_1';
            block_copy_ruin_button = 'cl1';
            source = 'bbh';
        } else if (document.URL.startsWith('https://gest-hordes2.eragaming.fr/')) {
            current_key = gm_gh_updated_key;
            map_block_id = 'zoneCarte';
            ruin_block_id = 'carteRuine';
            block_copy_map_button = 'zoneInfoVilleAutre';
            block_copy_ruin_button = 'menuRuine';
            source = 'gh';
        } else {
            current_key = gm_fata_updated_key;
            map_block_id = 'map';
            ruin_block_id = 'ruinmap';
            block_copy_map_button = 'modeBar';
            block_copy_ruin_button = 'modeBar';
            source = 'fm'
        }

        // Si on est sur le site de BBH ou GH ou Fata et que BBH ou GH ou Fata a été mis à jour depuis MyHordes, alors on recharge BBH ou GH ou Fata au moment de revenir sur l'onglet
        document.addEventListener('visibilitychange', function () {
            GM.getValue(current_key).then((current) => {
                if (current && !document.hidden) {
                    GM.setValue(current_key, false);
                    if (current_key === 'gh_updated' && document.getElementById('#zoneRefresh')) {
                        document.getElementById('#zoneRefresh').click();
                    } else {
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

        /** Affiche le changelog de la version au premier chargement après la mise à jour */
        GM.getValue('version').then((version) => {
            if (!version || !version[GM_info.script.version]) {
                if (!version) {
                    version = {};
                }

                version[GM_info.script.version] = confirm(changelog);
                GM.setValue('version', version);
            }


            getParameters().then(() => {

                getApiKey().then(() => {
                    getMe().then(() => {
                        initOptions();
                        /** Gère le bouton de mise à jour des outils externes) */
                        if (!buttonOptimizerExists()) {
                            createStyles();
                            createOptimizerBtn();
                            createWindow();
                        }

                        notifyOnSearchEnd();
                        displayWishlistInApp();

                        setInterval(() => {
                            createUpdateExternalToolsButton();
                            clickOnVotedToRedirect();
                            displaySearchFieldOnBuildings();
                            displaySearchFieldOnRecipientList();
                            displayMinApOnBuildings();
                            displayPriorityOnItems();
                            displayNbDeadZombies();
                            displayTranslateTool();
                            notifyOnNewMessage();
                            displayCellDetailsOnPage();
                            // displayEstimationsOnWatchtower();
                            // displayAntiAbuseCounter();
                            // blockUsersPosts();
                        }, 200);

                        setInterval(() => {
                            displayCampingPredict();
                        }, 500)

                        setInterval(() => {
                            displayAdvancedTooltips();
                        }, 100);
                    });
                });
            });
        });
    }
})();
