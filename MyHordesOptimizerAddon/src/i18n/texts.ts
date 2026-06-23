import {getScriptInfo} from '../utils/version';

////////////////
// Les textes //
////////////////

export const texts = {
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
};

export const status_texts = {
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
}

export const jobs = [
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

export const status_list = [
    {id: "clean", img: "status/status_clean.gif", pdc: 1, terror: -3}, // Jamais drogué
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
    {id: "drunk", img: "status/status_drunk.gif", watch_def: 15, watch_death: -0.02, searches: '-20%'}, // Ivre
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
    {id: "sober", img: "status/status_sober.gif", pdc: 1}, // Sobre
    {
        id: "good_smell",
        img: "status/status_good_smell.gif",
        terror: -25,
        fatal_infection: -0.25,
        prevent_infection: 0.25
    } // Bonne odeur
];

export const api_texts = {
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

export const action_types = [
    {
        id: `Recipe::ManualAnywhere`,
        label: {en: `Citizen actions`, fr: `Actions du citoyen`, de: `Bürgeraktionen`, es: `Acciones del habitante`},
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
    {id: `Recipe::WorkshopType`, label: {en: `Workshop`, fr: `Atelier`, de: `Werkstatt`, es: `Taller`}, ordering: 0},
    {
        id: `Recipe::WorkshopTypeShamanSpecific`,
        label: {en: `Workshop - Shaman`, fr: `Atelier - Chaman`, de: `Werkstatt - Schamane`, es: `Taller - Chamán`},
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

export const wishlist_depot = [
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

export const wishlist_title = {
    en: `Wishlist`,
    fr: `Liste de courses`,
    de: `Wunschzettel`,
    es: `Lista de deseos`
}

export const wishlist_headers = [
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
