import type { I18nLabel } from '../types';

////////////////
// Les textes //
////////////////

export const texts = {
    website: {
        en: 'Website',
        fr: 'Site web',
        de: 'Webseite',
        es: 'Sitio web'
    },
    save_external_app_id: {
        en: 'Save your external ID for apps',
        fr: 'Enregistrez votre ID d\'app externe',
        de: 'Speichern Sie Ihre externe ID für Apps',
        es: 'Guarde su identificador externo para aplicaciones'
    },
    external_app_id_help: {
        en: 'You must have an external ID for apps. <br />You can create it by following “My soul” > “Settings” > “Advanced” > “External Applications” ',
        fr: 'Vous devez posséder un ID externe pour les apps. <br />Vous pouvez la créer dans "Votre âme" > "Réglages" > "Avancés" > "Applications externes"',
        de: 'Sie haben eine externe ID für Apps entwickelt. <br />Sie können es wie folgt erstellen “Deine Seele” > “Einstellungen” > “Erweitert” > “Externe Anwendungen” ',
        es: 'Debe tener una identificación externa para las aplicaciones. <br />Puedes crearlo siguiendo “Tu alma” > “Configuración” > “Avanzada” > “Aplicaciones Externas”'
    },
    external_app_id_help_label: {
        en: 'Help',
        fr: 'Aide',
        de: 'Hilfe',
        es: 'Ayuda'
    },
    tools_btn_label: {
        en: 'Tools',
        fr: 'Outils',
        de: 'Werkzeugen',
        es: 'Herramientas'
    },
    parameters_section_label: {
        en: 'Parameters',
        fr: 'Paramètres',
        de: 'Einstellungen',
        es: 'Parámetros'
    },
    informations_section_label: {
        en: 'Informations',
        fr: 'Informations',
        de: 'Informationen',
        es: 'Informaciones'
    },
    update_external_tools_needed_btn_label: {
        en: 'Update external tools',
        fr: 'Mettre à jour les outils externes',
        de: 'Externe Tools Aktualisieren',
        es: 'Actualizar aplicaciones externas'
    },
    update_available_toast_script: {
        en: 'A new version of the script is available. Click here to update.',
        fr: 'Une nouvelle version du script est disponible. Cliquez ici pour la mettre à jour.',
        de: 'Eine neue Version des Skripts ist verfügbar. Klicken Sie hier, um zu aktualisieren.',
        es: 'Hay una nueva versión del script disponible. Haga clic aquí para actualizarla.'
    },
    update_available_toast_chrome: {
        en: 'A new version of the extension is available. Click here to check and update.',
        fr: 'Une nouvelle version de l\'extension est disponible. Cliquez ici pour vérifier et mettre à jour.',
        de: 'Eine neue Version der Erweiterung ist verfügbar. Klicken Sie hier, um zu prüfen und zu aktualisieren.',
        es: 'Hay una nueva versión de la extensión disponible. Haga clic aquí para comprobar y actualizar.'
    },
    update_available_toast_firefox: {
        en: 'A new version of the extension is available. Click here to open the extension page.',
        fr: 'Une nouvelle version de l\'extension est disponible. Cliquez ici pour ouvrir la page de l\'extension.',
        de: 'Eine neue Version der Erweiterung ist verfügbar. Klicken Sie hier, um die Erweiterungsseite zu öffnen.',
        es: 'Hay una nueva versión de la extensión disponible. Haga clic aquí para abrir la página de la extensión.'
    },
    update_checking_toast: {
        en: 'Checking for an update...',
        fr: 'Vérification de la disponibilité d\'une mise à jour...',
        de: 'Suche nach einem Update...',
        es: 'Buscando una actualización...'
    },
    update_not_yet_on_store_toast: {
        en: 'The update is not yet available on the store. Try again later.',
        fr: 'La mise à jour n\'est pas encore disponible sur le store. Réessayez plus tard.',
        de: 'Das Update ist im Store noch nicht verfügbar. Versuchen Sie es später erneut.',
        es: 'La actualización aún no está disponible en la tienda. Inténtalo de nuevo más tarde.'
    },
    update_check_unknown_toast: {
        en: 'Unable to check right now. Try again later.',
        fr: 'Impossible de vérifier pour le moment. Réessayez plus tard.',
        de: 'Überprüfung derzeit nicht möglich. Versuchen Sie es später erneut.',
        es: 'No se puede comprobar en este momento. Inténtalo de nuevo más tarde.'
    },
    update_throttled_toast: {
        en: 'Too many recent checks. Try again later.',
        fr: 'Trop de vérifications récentes. Réessayez plus tard.',
        de: 'Zu viele kürzliche Überprüfungen. Versuchen Sie es später erneut.',
        es: 'Demasiadas comprobaciones recientes. Inténtalo de nuevo más tarde.'
    },
    update_ready_refresh_toast: {
        en: 'Update ready: refresh the game page to apply it.',
        fr: 'Mise à jour prête : rafraîchissez la page du jeu pour l\'appliquer.',
        de: 'Update bereit: aktualisieren Sie die Spielseite, um es anzuwenden.',
        es: 'Actualización lista: actualice la página del juego para aplicarla.'
    },
    just_updated_toast: {
        en: 'MyHordes Optimizer has just been updated to version $version$. Click here to see what\'s new.',
        fr: 'MyHordes Optimizer vient d\'être mis à jour vers la version $version$. Cliquez ici pour voir les nouveautés.',
        de: 'MyHordes Optimizer wurde gerade auf Version $version$ aktualisiert. Klicken Sie hier, um die Neuigkeiten zu sehen.',
        es: 'MyHordes Optimizer se acaba de actualizar a la versión $version$. Haga clic aquí para ver las novedades.'
    },
    update_external_tools_pending_btn_label: {
        en: 'Updating...',
        fr: 'Mise à jour en cours...',
        de: 'Aktualisierung...',
        es: 'Actualizando...'
    },
    update_external_tools_fail_btn_label: {
        en: 'Can not update.',
        fr: 'Impossible de mettre à jour.',
        de: 'Aktualisierung unmöglich',
        es: 'No se puede actualizar.'
    },
    update_external_tools_tool_pending: {
        en: 'updating',
        fr: 'mise à jour en cours',
        de: 'wird aktualisiert',
        es: 'actualizando'
    },
    update_external_tools_tool_success: {
        en: 'up to date',
        fr: 'à jour',
        de: 'aktuell',
        es: 'actualizado'
    },
    update_external_tools_tool_error: {
        en: 'failed',
        fr: 'échec',
        de: 'fehlgeschlagen',
        es: 'error'
    },
    update_external_tools_timeout: {
        en: 'Timed out',
        fr: 'Délai dépassé',
        de: 'Zeitüberschreitung',
        es: 'Tiempo agotado'
    },
    prevent_from_leaving_information: {
        en: 'You asked to be notified before leaving if your escort options were not good: ',
        fr: 'Vous avez demandé à être prévenu avant de quitter la page si vos options d\'escorte ne sont pas les bonnes : ',
        de: 'Sie haben dafür gewählt vor der Abreise benachrichtigt zu werden wenn Ihre Eskorte-Optionen nicht gut waren:',
        es: 'Ha pedido ser notificado antes de cerrar la página si sus opciones de escolta son incorrectas: '
    },
    prevent_not_in_ae: {
        en: 'You are not waiting for an escort.',
        fr: 'Vous n\'êtes pas en attente d\'escorte.',
        de: 'Sie warten nicht auf eine Eskorte.',
        es: 'Su escolta no está activada.'
    },
    escort_not_released: {
        en: 'You did not let go of your escort',
        fr: 'Vous n\'avez pas relâché votre escorte.',
        de: 'Sie haben Ihre Eskorte nicht losgelassen',
        es: 'No ha soltado a sus acompañantes en escolta.'
    },
    save: {
        en: 'Save',
        fr: 'Enregistrer',
        de: 'Speichern',
        es: 'Guardar'
    },
    update: {
        en: 'Refresh wishlist',
        fr: 'Rafraîchir la liste',
        de: 'Aktualisieren',
        es: 'Actualizar'
    },
    search_ended: {
        en: 'Search completed',
        fr: 'La fouille est terminée',
        de: 'Grabungsaktion fertig',
        es: 'La búsqueda ha finalizado'
    },
    new_message: {
        en: 'You have %VAR% new message(s)',
        fr: 'Vous avez %VAR% nouveau(x) message(s)',
        de: 'Sie haben %VAR% neue Nachricht(en)',
        es: 'Tienes %VAR% mensaje(s) nuevo(s)'
    },
    nb_dead_zombies: {
        en: 'Number of zombies that died here today',
        fr: 'Nombre de zombies morts sur cette case aujourd\'hui',
        de: 'Anzahl der Zombies die heute hier gestorben sind',
        es: 'Número de zombis que han muerto aquí el día de hoy'
    },
    nb_despair_deaths: {
        en: 'Amount of zombies that will die from despair',
        fr: 'Nombre de zombies qui vont mourir de désespoir',
        de: 'Anzahl von Zombies, die abwandern werden',
        es: 'Número de zombis que morirán por desesperación'
    },
    copy_map: {
        en: 'Copy map',
        fr: 'Copier la carte',
        de: 'Karte kopieren',
        es: 'Copiar el mapa'
    },
    copy_map_end: {
        en: 'The map has been copied',
        fr: 'La carte a été copiée',
        de: 'Die Karte wurde kopiert',
        es: 'El mapa ha sido copiado'
    },
    copy_map_end_more: {
        en: 'The previous map has been replaced',
        fr: 'La carte précédente a été remplacée',
        de: 'Die vorherige Karte wurde ersetzt',
        es: 'El mapa anterior ha sido reemplazada'
    },
    copy_registry: {
        en: 'Copy visible town registry entries',
        fr: 'Copier les entrées visibles du registre',
        de: 'Kopieren Sie sichtbare Stadtregister',
        es: 'Copiar entradas de registro del pueblo visibles'
    },
    translation_file_context: {
        en: 'Context (translation file)',
        fr: 'Contexte (fichier de traduction)',
        de: 'Kontext (Übersetzungsdatei)',
        es: 'Contexto (archivo de traducción)',
    },
    display_all_search_result: {
        en: 'Display all results',
        fr: 'Afficher tous les résultats',
        de: 'Alle Ergebnisse anzeigen',
        es: 'Mostrar todos los resultados'
    },
    display_exact_search_result: {
        en: 'Only display exact results',
        fr: 'Afficher uniquement les résultats exacts',
        de: 'Nur exakte Ergebnisse anzeigen',
        es: 'Mostrar sólo los resultados exactos'
    },
    missing_ap_explanation: {
        en: '(including %VAR% for the building to stay overnight)',
        fr: '(dont %VAR% pour que le bâtiment passe la nuit)',
        de: '(einschließlich %VAR% für das Gebäude zum Übernachten)',
        es: '(incluyendo %VAR% para que el edificio resista el ataque)',
    },
    job: {
        en: 'Profession',
        fr: 'Métier',
        de: 'Beruf',
        es: 'Oficio',
    },
    pseudo: {
        en: 'Username',
        fr: 'Pseudo',
        de: 'Benutzername',
        es: 'Usuario',
    },
    defense: {
        en: 'Def.',
        fr: 'Déf.',
        de: 'Vert.',
        es: 'Def.',
    },
    town_type: {
        en: 'Town type',
        fr: 'Type de ville',
        de: 'Stadttyp',
        es: 'Tipo de pueblo',
    },
    ruin: {
        en: 'Ruin',
        fr: 'Bâtiment',
        de: 'Ruine',
        es: 'Ruina',
    },
    pro_camper: {
        en: 'Pro Camper',
        fr: 'Campeur professionnel',
        de: 'Proficamper',
        es: 'Campista Experto',
    },
    distance: {
        en: 'Distance from town (in km)',
        fr: 'Distance de la ville (en km)',
        de: 'Entfernung von der Stadt (in km)',
        es: 'Distancia con respecto al pueblo (en km)',
    },
    digs: {
        en: 'Number of piles on the ruin',
        fr: 'Nombre de tas sur le bâtiment',
        de: 'Anzahl der Pfähle am Gebäude',
        es: 'Número de pilotes en el edificio',
    },
    nb_campings: {
        en: 'Number of campsites already made',
        fr: 'Nombre de campings déjà effectués',
        de: 'Anzahl der bereits gemachten Campingplätze',
        es: 'Cantidad de acampes ya realizados',
    },
    hidden_campers: {
        en: 'Number of campers already hidden on the zone',
        fr: 'Nombre de campeurs déjà cachés sur la case',
        de: 'Anzahl der Camper, die bereits auf der Zelle versteckt sind',
        es: 'Cantidad de campistas ya escondidos en la zona',
    },
    vest: {
        en: 'Camouflage Vest',
        fr: 'Tenue de camouflage',
        de: 'Tarnanzug',
        es: 'Camuflaje',
    },
    tomb: {
        en: 'Tomb',
        fr: 'Tombe',
        de: 'Grab',
        es: 'Tumba',
    },
    night: {
        en: 'Night',
        fr: 'Nuit',
        de: 'Nacht',
        es: 'Noche',
    },
    devastated: {
        en: 'Devastated town',
        fr: 'Ville dévastée',
        de: 'Zerstörte Stadt',
        es: 'Pueblo devastado',
    },
    phare: {
        en: 'Lighthouse',
        fr: 'Phare',
        de: 'Leuchtturm',
        es: 'Faro',
    },
    zombies_on_cell: {
        en: 'Zombies on the zone',
        fr: 'Zombies sur la case',
        de: 'Zombies auf der Zelle',
        es: 'Zombis en la zona',
    },
    objects_in_bag: {
        en: 'Skins and tents in the bag',
        fr: 'Pelures et toiles dans le sac',
        de: 'Felle und Zelte in der Tasche',
        es: 'Pellejos y telas en el bolso',
    },
    improve: {
        en: 'Simple improvements (must subtract 3 after each attack)',
        fr: 'Améliorations simples (il faut en soustraire 3 après chaque attaque)',
        de: 'Einfachen Verbesserungen (muss nach jedem Angriff 3 abziehen)',
        es: 'Mejoras simples (hay que restar 3 luego de cada ataque)',
    },
    object_improve: {
        en: 'Defense objects',
        fr: 'Objets de défense',
        de: 'Verteidigungsobjekte',
        es: 'Objetos defensivos',
    },
    camping_town: {
        en: 'The town',
        fr: 'La ville',
        de: 'Die Stadt',
        es: 'El pueblo',
    },
    camping_citizen: {
        en: 'The citizen',
        fr: 'Le citoyen',
        de: 'Der Bürger',
        es: 'El habitante',
    },
    camping_ruin: {
        en: 'The ruin',
        fr: 'Le bâtiment',
        de: 'Die Ruine',
        es: 'La ruina',
    },
    result: {
        en: 'Result',
        fr: 'Résultat',
        de: 'Ergebnis',
        es: 'Resultado',
    },
    searchObjectToAdd: {
        en: 'Find an object to add',
        fr: 'Rechercher un objet à ajouter',
        de: 'Suchen Sie ein hinzuzufügendes Objekt',
        es: 'Encuentre un objeto para agregar',
    },
    broken: {
        en: 'Broken',
        fr: 'Cassé',
        de: 'Kaputt',
        es: 'Roto/a',
    },
    manually_add_app_id_key: {
        en: 'Your external ID could not be retrieved automatically. You can enter it manually here.',
        fr: 'Votre identifiant n\'a pas pu être récupéré automatiquement. Vous pouvez le saisir manuellement ici.',
        de: 'Ihr externe ID konnte nicht automatisch abgerufen werden. Sie können ihn hier manuell eingeben.',
        es: 'Ihr Benutzername konnte nicht automatisch abgerufen werden. Sie können ihn hier manuell eingeben.',
    },
    edit_add_app_id_key: {
        en: 'Enter your external ID here.\nYou can also clear the form field to remove it.',
        fr: 'Saisissez votre identifiant externe pour les applications ici.\nVous pouvez vider le champ pour le supprimer.',
        de: 'Bitte hier Deine externe ID eintragen oder den Inhalt des Felds entfernen, um sie zu löschen.',
        es: 'Introduzca su ID externo aquí. También puede borrar el campo del formulario para eliminarlo.',
    },
    wishlist_moved: {
        en: 'Due to too much complexity, the shopping list has been moved to the website.',
        fr: 'Du fait d\'une trop grande complexité, la liste de courses a été déplacée sur le site web.',
        de: 'Aufgrund zu großer Komplexität wurde die Einkaufsliste auf die Website verschoben.',
        es: 'Debido a demasiada complejidad, la lista de compras se ha movido al sitio web.'
    },
    go_to_website: {
        en: 'Go to website',
        fr: 'Aller sur le site',
        de: 'Gehen Sie zur Website',
        es: 'Ir al sitio'
    },
    note: {
        en: 'Box note',
        fr: 'Note de la case',
        de: 'Box-Hinweis',
        es: 'Nota de caja'
    },
    no_note: {
        en: 'No note for this box',
        fr: 'Pas de note pour cette case',
        de: 'Keine Hinweis für diese Box',
        es: 'No hay nota para esta caja'
    },
    note_label: {
        en: 'Note',
        fr: 'Note',
        de: 'Notiz',
        es: 'Nota'
    },
    note_empty: {
        en: 'No note',
        fr: 'Aucune note',
        de: 'Keine Notiz',
        es: 'Sin nota'
    },
    ruin_dried: {
        en: 'The ruin is empty',
        fr: 'Le bâtiment est vide',
        de: 'Die Ruine ist leer',
        es: 'La ruina esta vacia'
    },
    ruin_not_dried: {
        en: 'The ruin is not empty',
        fr: 'Le bâtiment n\'est pas vide',
        de: 'Die Ruine ist nicht leer',
        es: 'La ruina no está vacía'
    },
    additional_informations: {
        en: 'Further information',
        fr: 'Informations complémentaires',
        de: 'Weitere Informationen',
        es: 'Informaciones complementarias'
    },
    anti_abuse_title: {
        en: 'Anti-abuse counter',
        fr: 'Compteur anti-abus',
        de: 'Zähler gegen Missbrauch',
        es: 'Contador anti-abuso'
    },
    anti_abuse_takes_remaining: {
        en: 'Available',
        fr: 'Disponible',
        de: 'Verfügbar',
        es: 'Disponible'
    },
    anti_abuse_limit_reached: {
        en: 'Limit reached: the next take will trigger the anti-abuse system',
        fr: 'Limite atteinte : la prochaine prise déclenchera l\'anti-abus',
        de: 'Limit erreicht: Die nächste Entnahme löst das Missbrauchssystem aus',
        es: 'Límite alcanzado: la próxima toma activará el sistema anti-abuso'
    },
    anti_abuse_uncertain_take: {
        en: 'Uncertain take: several items appeared at once, unable to tell which one',
        fr: 'Prise incertaine : plusieurs objets sont apparus en même temps, impossible de savoir lequel',
        de: 'Unsichere Entnahme: mehrere Gegenstände sind gleichzeitig aufgetaucht, nicht zu bestimmen welcher',
        es: 'Toma incierta: aparecieron varios objetos a la vez, imposible saber cuál'
    },
    warn_missing_logs_title: {
        en: 'Warning: Missing searches data',
        fr: 'Attention : Données de fouilles manquantes',
        de: 'Warnung: Fehlende Ausgrabungsdaten',
        es: 'Advertencia: Faltan datos de excavación',
    },
    warn_missing_logs_help: {
        en: 'This message appears because you checked the option <strong>"Record successful searches"</strong> and not all of today\'s entries of your zone\'s registry (<strong>"Discussions"</strong> block) are displayed.<br /><br />Scroll down to the registry so that it loads. If the <strong>"View all registry entries"</strong> button is still at the bottom of the registry, click it. This message disappears as soon as the information is complete.',
        fr: 'Ce message s\'affiche parce que vous avez coché l\'option <strong>"Enregistrer les fouilles réussies"</strong> et que les entrées du jour du registre de votre case (bloc <strong>"Discussions"</strong>) ne sont pas toutes affichées.<br /><br />Faites défiler la page jusqu\'au registre pour qu\'il se charge. Si le bouton <strong>"Afficher toutes les entrées"</strong> est toujours présent en bas du registre, cliquez dessus. Ce message disparaît dès que les informations sont complètes.',
        de: 'Diese Meldung wird angezeigt, weil Sie die Option <strong>"Zeichnen Sie erfolgreiche Ausgrabungen auf"</strong> aktiviert haben und nicht alle heutigen Einträge im <strong>Zonenregister</strong> angezeigt werden.<br /><br />Scrollen Sie bis zum Zonenregister, damit es geladen wird. Wenn die Schaltfläche <strong>"Alle Einträge anzeigen"</strong> unten im Register noch vorhanden ist, klicken Sie darauf. Diese Meldung verschwindet, sobald die Informationen vollständig sind.',
        es: 'Este mensaje aparece porque seleccionó la opción <strong>"Grabar excavaciones exitosas"</strong> y no se muestran todas las entradas de hoy del <strong>Registro de la Zona</strong>.<br /><br />Desplácese hasta el registro para que se cargue. Si el botón <strong>"Mostrar todas las entradas"</strong> sigue en la parte inferior del registro, haga clic en él. Este mensaje desaparece en cuanto la información esté completa.',
    },
    estim_title: {
        en: 'Today\'s attack',
        fr: 'Attaque du jour',
        de: 'Heutiger Angriff',
        es: 'Ataque del día',
    },
    planif_title: {
        en: 'Tomorrow\'s attack',
        fr: 'Attaque du lendemain',
        de: 'Morgige Abschätzung',
        es: 'Ataque de la noche siguiente',
    },
    copy_forum: {
        en: 'Copy to forum format',
        fr: 'Copier au format forum',
        de: 'In Forumformat kopieren',
        es: 'Copiar al formato del foro'
    },
    copy_forum_watchtower_tooltip: {
        en: 'Make sure you save before copying',
        fr: 'Assurez-vous d\'avoir enregistré avant de copier',
        de: 'Stellen Sie sicher, dass Sie vor dem Kopieren speichern',
        es: 'Asegúrate de guardar antes de copiar'
    },
    digs_state_header: {
        en: 'Digs state',
        fr: 'État des fouilles',
        de: 'Stand der Ausgrabungen',
        es: 'Estado de las excavaciones'
    },
    ruin_state_header: {
        en: 'Ruin',
        fr: 'Bâtiment',
        de: 'Ruine',
        es: 'Ruina'
    },
    digs_average: {
        en: 'Average remaining digs',
        fr: 'Fouilles moyennes restantes',
        de: 'Verbleibende mittlere Ausgrabungen',
        es: 'Restos de excavaciones medianas'
    },
    digs_max: {
        en: 'Maximum remaining digs',
        fr: 'Fouilles maximum restantes',
        de: 'Maximal verbleibende Ausgrabungen',
        es: 'Máximas excavaciones restantes'
    },
    check_all: {
        en: 'Check all',
        fr: 'Tout cocher',
        de: 'Alle überprüfen',
        es: 'Comprobar todo'
    },
    can_be_dumped: {
        en: 'Can be dumped',
        fr: 'Peut être jeté',
        de: 'Kann weggeworfen werden',
        es: 'Se puede tirar',
    },
    can_be_recovered: {
        en: 'Can be recovered',
        fr: 'Peut être récupéré',
        de: 'Kann wiederhergestellt werden',
        es: 'Se puede recuperar',
    },
    calculated_attack: {
        en: 'Calculated',
        fr: 'Calculée',
        de: 'Berechnet',
        es: 'Calculado'
    },
    refined_attack: {
        en: 'Refined',
        fr: 'Affinée',
        de: 'Verfeinert',
        es: 'Refinado'
    },
    external_profiles: {
        en: 'External profiles',
        fr: 'Profils externes',
        de: 'Externe Profile',
        es: 'Perfiles externos',
    },
    external_links: {
        en: 'External links',
        fr: 'Liens externes',
        de: 'Externe Links',
        es: 'Enlaces externos',
    },
    filter_search_name: {
        en: 'Search a citizen',
        fr: 'Rechercher un citoyen',
        de: 'Bürger suchen',
        es: 'Buscar ciudadano'
    },
    filter_all: {
        en: 'All',
        fr: 'Tous',
        de: 'Alle',
        es: 'Todos'
    },
    filter_online_label: {
        en: 'Online status',
        fr: 'Connexion',
        de: 'Status',
        es: 'Estado'
    },
    filter_online_online: {
        en: 'Online',
        fr: 'En ligne',
        de: 'Online',
        es: 'En línea'
    },
    filter_online_offline: {
        en: 'Offline',
        fr: 'Hors ligne',
        de: 'Offline',
        es: 'Sin conexión'
    },
    filter_location_label: {
        en: 'Location',
        fr: 'Emplacement',
        de: 'Ort',
        es: 'Ubicación'
    },
    filter_location_outside: {
        en: 'Outside',
        fr: 'Dehors',
        de: 'Draußen',
        es: 'Fuera'
    },
    filter_location_inside: {
        en: 'In town',
        fr: 'En ville',
        de: 'In der Stadt',
        es: 'En la ciudad'
    },
    filter_house_level_label: {
        en: 'Habitation',
        fr: 'Habitation',
        de: 'Haus',
        es: 'Casa'
    },
    filter_stars_label: {
        en: 'Activity',
        fr: 'Activité',
        de: 'Aktivität',
        es: 'Actividad'
    },
    filter_chest_items_label: {
        en: 'Chest',
        fr: 'Coffre',
        de: 'Truhe',
        es: 'Cofre'
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
    },
    /** Chance de camping avant plafond et plancher */
    camping_raw_probability: {
        en: 'raw',
        fr: 'brut',
        de: 'roh',
        es: 'bruto'
    },
    forum_styles_configure: {
        en: 'Configure',
        fr: 'Configurer',
        de: 'Konfigurieren',
        es: 'Configurar'
    },
    forum_styles_title: {
        en: 'Style of forum thread titles',
        fr: 'Style des noms de sujets du forum',
        de: 'Stil der Forenthemen-Titel',
        es: 'Estilo de los títulos de los temas del foro'
    },
    forum_styles_rule: {
        en: 'Rule',
        fr: 'Règle',
        de: 'Regel',
        es: 'Regla'
    },
    forum_styles_add_rule: {
        en: 'Add a rule',
        fr: 'Ajouter une règle',
        de: 'Regel hinzufügen',
        es: 'Añadir una regla'
    },
    forum_styles_reset: {
        en: 'Restore default rules',
        fr: 'Restaurer les règles par défaut',
        de: 'Standardregeln wiederherstellen',
        es: 'Restaurar las reglas por defecto'
    },
    forum_styles_save: {
        en: 'Save',
        fr: 'Enregistrer',
        de: 'Speichern',
        es: 'Guardar'
    },
    forum_styles_cancel: {
        en: 'Cancel',
        fr: 'Annuler',
        de: 'Abbrechen',
        es: 'Cancelar'
    },
    forum_styles_tags: {
        en: 'Tags',
        fr: 'Tags',
        de: 'Tags',
        es: 'Etiquetas'
    },
    forum_styles_regex: {
        en: 'Words or regex in the title',
        fr: 'Mots ou regex sur le titre',
        de: 'Wörter oder Regex im Titel',
        es: 'Palabras o regex en el título'
    },
    forum_styles_regex_placeholder: {
        en: 'words or regex separated by commas',
        fr: 'mots ou regex séparés par des virgules',
        de: 'Wörter oder Regex durch Kommas getrennt',
        es: 'palabras o regex separados por comas'
    },
    forum_styles_regex_help: {
        en: 'A plain word is enough, searched as-is in the title. Entries are separated by commas.<br /><br /><strong>.</strong> = any character<br /><strong>*</strong> = 0 or more of what precedes<br /><strong>+</strong> = 1 or more of what precedes<br /><strong>?</strong> = makes what precedes optional<br /><strong>^</strong> = start of the title<br /><strong>$</strong> = end of the title<br /><strong>|</strong> = or, between two patterns<br /><strong>\\d</strong> = a digit<br /><strong>\\w</strong> = a letter, digit or _<br /><strong>%DAY%</strong> = current town day<br /><br />( ) [ ] { } are literal, no need to escape them. One match anywhere in the title is enough, case is ignored.',
        fr: 'Un simple mot suffit, il est recherché tel quel dans le titre. Les entrées sont séparées par des virgules.<br /><br /><strong>.</strong> = un caractère quelconque<br /><strong>*</strong> = 0 ou plusieurs fois ce qui précède<br /><strong>+</strong> = 1 ou plusieurs fois ce qui précède<br /><strong>?</strong> = rend optionnel ce qui précède<br /><strong>^</strong> = début du titre<br /><strong>$</strong> = fin du titre<br /><strong>|</strong> = ou, entre deux motifs<br /><strong>\\d</strong> = un chiffre<br /><strong>\\w</strong> = une lettre, un chiffre ou _<br /><strong>%DAY%</strong> = jour de ville actuel<br /><br />( ) [ ] { } sont littéraux, pas besoin de les échapper. Une seule correspondance dans le titre suffit, la casse n’est pas prise en compte.',
        de: 'Ein einfaches Wort genügt, es wird so wie geschrieben im Titel gesucht. Einträge werden durch Kommas getrennt.<br /><br /><strong>.</strong> = ein beliebiges Zeichen<br /><strong>*</strong> = 0 oder mehr Mal das Vorhergehende<br /><strong>+</strong> = 1 oder mehr Mal das Vorhergehende<br /><strong>?</strong> = macht das Vorhergehende optional<br /><strong>^</strong> = Anfang des Titels<br /><strong>$</strong> = Ende des Titels<br /><strong>|</strong> = oder, zwischen zwei Mustern<br /><strong>\\d</strong> = eine Ziffer<br /><strong>\\w</strong> = ein Buchstabe, eine Ziffer oder _<br /><strong>%DAY%</strong> = aktueller Stadttag<br /><br />( ) [ ] { } sind wörtlich, kein Escaping nötig. Eine Übereinstimmung irgendwo im Titel genügt, Groß-/Kleinschreibung wird ignoriert.',
        es: 'Basta una palabra simple, se busca tal cual en el título. Las entradas se separan por comas.<br /><br /><strong>.</strong> = cualquier carácter<br /><strong>*</strong> = 0 o más veces lo anterior<br /><strong>+</strong> = 1 o más veces lo anterior<br /><strong>?</strong> = hace opcional lo anterior<br /><strong>^</strong> = inicio del título<br /><strong>$</strong> = fin del título<br /><strong>|</strong> = o, entre dos patrones<br /><strong>\\d</strong> = un dígito<br /><strong>\\w</strong> = una letra, dígito o _<br /><strong>%DAY%</strong> = día actual de la ciudad<br /><br />( ) [ ] { } son literales, no hace falta escaparlos. Basta una coincidencia en cualquier parte del título, no se distingue mayúsculas/minúsculas.'
    },
    forum_styles_no_criteria: {
        en: 'Without any criterion, this rule applies to no thread.',
        fr: 'Sans aucun critère, cette règle ne s\'applique à aucun sujet.',
        de: 'Ohne Kriterium gilt diese Regel für kein Thema.',
        es: 'Sin ningún criterio, esta regla no se aplica a ningún tema.'
    },
    forum_styles_text_color: {
        en: 'Text color',
        fr: 'Couleur du texte',
        de: 'Textfarbe',
        es: 'Color del texto'
    },
    forum_styles_background: {
        en: 'Background',
        fr: 'Fond',
        de: 'Hintergrund',
        es: 'Fondo'
    },
    forum_styles_border: {
        en: 'Left border',
        fr: 'Bordure gauche',
        de: 'Linker Rand',
        es: 'Borde izquierdo'
    },
    forum_styles_size: {
        en: 'Size',
        fr: 'Taille',
        de: 'Größe',
        es: 'Tamaño'
    },
    forum_styles_opacity: {
        en: 'Opacity',
        fr: 'Opacité',
        de: 'Deckkraft',
        es: 'Opacidad'
    },
    forum_styles_prefix: {
        en: 'Prefix',
        fr: 'Préfixe',
        de: 'Präfix',
        es: 'Prefijo'
    },
    forum_styles_preview_text: {
        en: 'Thread title',
        fr: 'Titre de sujet',
        de: 'Themen-Titel',
        es: 'Título del tema'
    },
    forum_styles_move_up: {
        en: 'Move up',
        fr: 'Monter',
        de: 'Nach oben',
        es: 'Subir'
    },
    forum_styles_move_down: {
        en: 'Move down',
        fr: 'Descendre',
        de: 'Nach unten',
        es: 'Bajar'
    },
    forum_styles_delete: {
        en: 'Delete',
        fr: 'Supprimer',
        de: 'Löschen',
        es: 'Eliminar'
    },
    forum_styles_export: {
        en: 'Export',
        fr: 'Exporter',
        de: 'Exportieren',
        es: 'Exportar'
    },
    forum_styles_export_done: {
        en: 'The configuration has been copied : you can now paste it to another player.',
        fr: 'La configuration a été copiée : vous pouvez la coller à un autre joueur.',
        de: 'Die Konfiguration wurde kopiert: Sie können sie einem anderen Spieler einfügen.',
        es: 'La configuración ha sido copiada: puede pegarla a otro jugador.'
    },
    forum_styles_import: {
        en: 'Import',
        fr: 'Importer',
        de: 'Importieren',
        es: 'Importar'
    },
    forum_styles_import_confirm: {
        en: 'Replace my rules',
        fr: 'Remplacer mes règles',
        de: 'Meine Regeln ersetzen',
        es: 'Reemplazar mis reglas'
    },
    forum_styles_import_placeholder: {
        en: 'Paste here the configuration exported by another player',
        fr: 'Collez ici la configuration exportée par un autre joueur',
        de: 'Fügen Sie hier die von einem anderen Spieler exportierte Konfiguration ein',
        es: 'Pegue aquí la configuración exportada por otro jugador'
    },
    forum_styles_import_error: {
        en: 'This configuration cannot be read. Paste the exported text as is, without altering it.',
        fr: 'Cette configuration est illisible. Collez le texte exporté tel quel, sans le modifier.',
        de: 'Diese Konfiguration ist unlesbar. Fügen Sie den exportierten Text unverändert ein.',
        es: 'Esta configuración es ilegible. Pegue el texto exportado tal cual, sin modificarlo.'
    },
    forum_styles_empty: {
        en: 'No rule yet : add one to style the thread titles.',
        fr: 'Aucune règle : ajoutez-en une pour styler les noms de sujets.',
        de: 'Keine Regel: Fügen Sie eine hinzu, um die Themen-Titel zu gestalten.',
        es: 'Ninguna regla: añada una para dar estilo a los títulos de los temas.'
    },
    double_install_title: {
        en: 'MHO Addon: duplicate installation detected',
        fr: 'MHO Addon : double installation détectée',
        de: 'MHO Addon: doppelte Installation erkannt',
        es: 'MHO Addon: instalación duplicada detectada'
    },
    double_install_help: {
        en: 'You have both the Tampermonkey script and the browser extension installed. This can cause instability. It is recommended to keep the browser extension and uninstall the Tampermonkey script.',
        fr: 'Vous avez à la fois le script Tampermonkey et l\'extension navigateur installés. Cela peut provoquer des instabilités. Il est recommandé de privilégier l\'extension navigateur et de désinstaller le script Tampermonkey.',
        de: 'Sie haben sowohl das Tampermonkey-Skript als auch die Browser-Erweiterung installiert. Dies kann zu Instabilität führen. Es wird empfohlen, die Browser-Erweiterung zu behalten und das Tampermonkey-Skript zu deinstallieren.',
        es: 'Tienes instalados tanto el script de Tampermonkey como la extensión del navegador. Esto puede causar inestabilidad. Se recomienda mantener la extensión del navegador y desinstalar el script de Tampermonkey.'
    },
    older_changelogs: {
        en: 'Show older changelogs',
        fr: 'Voir les notes de versions plus anciennes',
        de: 'Ältere Changelogs anzeigen',
        es: 'Ver las notas de versiones anteriores'
    },
    hero_find: {
        en: 'Seeker',
        fr: 'Trouvaille',
        de: 'Fund',
        es: 'Hallazgo'
    },
    hero_find_lucky: {
        en: 'Lucky Find',
        fr: 'Jolie trouvaille',
        de: 'Schönes Fundstück',
        es: 'Hallazgo mejorado'
    },
    hero_find_lucky2: {
        en: 'Impressive Find',
        fr: 'Impressionnante trouvaille',
        de: 'Beeindruckendes Fundstück',
        es: 'Hallazgo perfeccionado'
    },
    hero_find_lucky3: {
        en: 'Incredible Find',
        fr: 'Incroyable trouvaille',
        de: 'Erstaunliches Fundstück',
        es: 'Hallazgo milagroso'
    },
    flash_photo: {
        en: '{chance}% chance of being able to flee for {seconds} seconds',
        fr: '{chance}% de chances de pouvoir fuir pendant {seconds} secondes',
        de: '{chance}% Chance, {seconds} Sekunden lang fliehen zu können',
        es: '{chance}% de probabilidad de poder huir durante {seconds} segundos'
    },
    can_cook: {
        en: 'Can be cooked',
        fr: 'Peut être cuisiné',
        de: 'Kann gekocht werden',
        es: 'Se puede cocinar'
    },
    hero_dog_fetch: {
        en: 'The Tamer\'s dog can fetch it from the Bank',
        fr: 'Le chien de l\'Apprivoiseur peut le rapporter de la banque',
        de: 'Der Hund des Dompteurs kann es aus der Bank holen',
        es: 'El perro del Domador puede traerlo del Almacén'
    },
    nosteal: {
        en: 'Cannot be stolen',
        fr: 'Ne peut pas être volé',
        de: 'Kann nicht gestohlen werden',
        es: 'No se puede robar'
    },
    inedible: {
        en: 'Does not count as food carried when leaving the town',
        fr: 'Ne compte pas comme nourriture emportée en sortant de la ville',
        de: 'Zählt nicht als mitgenommene Nahrung beim Verlassen der Stadt',
        es: 'No cuenta como comida llevada al salir de la ciudad'
    },
    haunting_soul: {
        en: 'Halloween: in the Chest, prevents thefts and can terrorise its owner at night',
        fr: 'Halloween : dans le coffre, empêche les vols et peut terroriser son propriétaire la nuit',
        de: 'Halloween: in der Truhe verhindert es Diebstähle und kann den Besitzer nachts in Angststarre versetzen',
        es: 'Halloween: en el cofre, impide los robos y puede aterrorizar a su propietario por la noche'
    },
    angry_soul: {
        en: 'Halloween: in the Chest, 50% chance of infecting its owner at night',
        fr: 'Halloween : dans le coffre, 50 % de chances d\'infecter son propriétaire la nuit',
        de: 'Halloween: in der Truhe infiziert es den Besitzer nachts mit 50 % Wahrscheinlichkeit',
        es: 'Halloween: en el cofre, 50 % de probabilidades de infectar a su propietario por la noche'
    },
    defence_cp: {
        en: 'In the Backpack, +1 zone control point',
        fr: 'Dans le sac, +1 point de contrôle de zone',
        de: 'Im Rucksack: +1 Zonenkontrollpunkt',
        es: 'En la mochila, +1 punto de control de zona'
    },
    watch_bonus: {
        en: 'Watch bonus:',
        fr: 'Bonus de veille :',
        de: 'Wachbonus:',
        es: 'Bono de vigilancia:'
    },
    nw_armory: {
        en: 'Watch bonus from the Manual grinder (+20%)',
        fr: 'Bonus de veille de la Meuleuse manuelle (+20 %)',
        de: 'Wachbonus des Handschleifers (+20 %)',
        es: 'Bono de vigilancia de la Afiladora manual (+20 %)'
    },
    nw_ikea: {
        en: 'Watch bonus from the Swedish Workshop (+30%)',
        fr: 'Bonus de veille du Magasin suédois (+30 %)',
        de: 'Wachbonus der Schwedischen Schreinerei (+30 %)',
        es: 'Bono de vigilancia del Taller sueco (+30 %)'
    },
    nw_trebuchet: {
        en: 'Watch bonus from the Pet Shop (+30%)',
        fr: 'Bonus de veille de l\'Animalerie (+30 %)',
        de: 'Wachbonus der Tierhandlung (+30 %)',
        es: 'Bono de vigilancia de la Tienda de Mascotas (+30 %)'
    },
    nw_shooting: {
        en: 'Watch bonus from the Filtering gutters (+30%)',
        fr: 'Bonus de veille des Gouttières filtrantes (+30 %)',
        de: 'Wachbonus der Filtrierenden Rinnen (+30 %)',
        es: 'Bono de vigilancia de los Canalones de filtro (+30 %)'
    },
    special_guitar: {
        en: 'Gives 1 AP to every citizen in town, within their maximum AP; 2 AP to drunk or drugged citizens',
        fr: 'Rend 1 PA à chaque citoyen en ville, dans la limite de son maximum ; 2 PA aux citoyens ivres ou drogués',
        de: 'Gibt jedem Bürger in der Stadt 1 AP, bis zu seinem Maximum; 2 AP für betrunkene oder unter Drogen stehende Bürger',
        es: 'Da 1 PA a cada habitante en la ciudad, sin superar su máximo; 2 PA a los habitantes borrachos o drogados'
    },
    lock: {
        en: 'Secures the Chest it is stored in',
        fr: 'Sécurise le coffre dans lequel il se trouve',
        de: 'Sichert die Truhe, in der er sich befindet',
        es: 'Asegura el cofre en el que se encuentra'
    },
    prevent_terror: {
        en: 'Prevents being terrorised because of an item',
        fr: 'Empêche d\'être terrorisé à cause d\'un objet',
        de: 'Verhindert die Angststarre durch einen Gegenstand',
        es: 'Evita quedar aterrorizado por culpa de un objeto'
    },
    found_poisoned: {
        en: 'Can be found poisoned',
        fr: 'Peut être trouvé empoisonné',
        de: 'Kann vergiftet gefunden werden',
        es: 'Se puede encontrar envenenado'
    },
    is_water: {
        en: 'Quenches thirst',
        fr: 'Désaltère',
        de: 'Löscht den Durst',
        es: 'Quita la sed'
    },
    can_poison: {
        en: 'Can be poisoned',
        fr: 'Peut être empoisonné',
        de: 'Kann vergiftet werden',
        es: 'Se puede envenenar'
    },
    camp_bonus: {
        en: 'In the bag, increases camping survival chances by 5%',
        fr: 'Dans le sac, augmente de 5% les chances de survie en camping',
        de: 'Im Rucksack: erhöht die Überlebenschancen beim Verstecken um 5%',
        es: 'En la mochila, aumenta un 5% las probabilidades de supervivencia al acampar'
    },
    smokebomb: {
        en: 'Erases log entries (-3 minutes)<br />Hides your next entry (+1 minute)',
        fr: 'Efface les entrées du registre (-3 minutes)<br />Dissimule votre prochaine entrée (+1 minute)',
        de: 'Löscht Einträge im Register (-3 Minuten)<br />Verbirgt deinen nächsten Eintrag (+1 Minute)',
        es: 'Borra las entradas del registro (-3 minutos)<br />Oculta tu próxima entrada (+1 minuto)'
    },
    camp_improve_property: {
        en: 'Allows you to set up a camp',
        fr: 'Permet d\'aménager un campement',
        de: 'Ermöglicht es, ein Lager auszubauen',
        es: 'Permite acondicionar un campamento'
    },
    manual_success: {
        en: '{chance}% chance of succeeding with the manual',
        fr: '{chance}% de chances de réussir son manuel',
        de: '{chance}% Chance, das Handbuch erfolgreich zu nutzen',
        es: '{chance}% de probabilidad de tener éxito con el manual'
    },
    prevent_night: {
        en: 'Night penalty divided by 4',
        fr: 'Malus de nuit divisé par 4',
        de: 'Nacht-Malus durch 4 geteilt',
        es: 'Penalización nocturna dividida por 4'
    },
    no_post: {
        en: 'Cannot be sent by message',
        fr: 'Ne peut pas être envoyé par message',
        de: 'Kann nicht per Nachricht verschickt werden',
        es: 'No se puede enviar por mensaje'
    },
    wagging_flag: {
        en: 'Attracts 2.5% of the overflow zombies',
        fr: 'Attire 2.5% des zombies du débordement',
        de: 'Zieht 2.5% der Zombies des Überlaufs an',
        es: 'Atrae al 2.5% de los zombis del desborde'
    },
    esc_fixed: {
        en: 'Cannot be dropped by the escort leader',
        fr: 'Ne peut pas être déposé par le chef d\'escorte',
        de: 'Kann vom Eskortenführer nicht abgelegt werden',
        es: 'No puede ser depositado por el jefe de escolta'
    },
    impoundable: {
        en: 'Lost when banished',
        fr: 'Perdu en cas de bannissement',
        de: 'Geht bei einer Verbannung verloren',
        es: 'Se pierde en caso de destierro'
    }
} satisfies Record<string, I18nLabel>;

export const status_texts = {
    head_wounded: {
        en: 'Alters messages on the Town Forum',
        fr: 'Déforme les messages sur le Forum Ville',
        de: 'Verändert Nachrichten im Stadtforum',
        es: 'Deforma los mensajes en el Foro del Pueblo',
    },
    hand_wounded: {
        en: 'Prevents the use of certain items',
        fr: 'Empêche l\'utilisation de certains objets',
        de: 'Verhindert die Nutzung bestimmter Gegenstände',
        es: 'Impide el uso de ciertos objetos',
    },
    arm_wounded: {
        en: 'Prevents working on projects or handling the gate',
        fr: 'Empêche de travailler aux chantiers ou de manipuler la porte',
        de: 'Verhindert Arbeiten an Projekten oder das Bedienen des Tors',
        es: 'Impide trabajar en proyectos o manipular la puerta',
    },
    leg_wounded: {
        en: '20% chance to prevent movement in the desert while consuming the AP',
        fr: '20% de chances d\'empêcher un déplacement dans le désert tout en consommant le PA',
        de: '20% Chance, Bewegung in der Wüste zu verhindern, während AP verbraucht werden',
        es: '20% de probabilidad de impedir el movimiento en el desierto mientras se consume el PA',
    },
    zombies_killed: {
        en: 'Zombies killed while on watch',
        fr: 'Zombies tués en veille',
        de: 'Zombies, die während der Wache getötet wurden',
        es: 'Zombis eliminados mientras estás de guardia',
    },
    watch_survival_chances: {
        en: 'Survival chances while on watch',
        fr: 'Chances de survie en veille',
        de: 'Überlebenschancen während der Wache',
        es: 'Probabilidades de supervivencia mientras estás de guardia',
    },
    success_digs_changes: {
        en: 'Success chances for digging',
        fr: 'Chances de réussite des fouilles',
        de: 'Erfolgsaussichten der Ausgrabungen',
        es: 'Probabilidades de éxito de las excavaciones',
    },
    terror: {
        en: 'Chances of being terrorized in case of an overflow',
        fr: 'Chances d\'être terrorisé en cas de débordement',
        de: 'Wahrscheinlichkeit, im Falle eines Überlaufs terrorisiert zu werden',
        es: 'Posibilidades de ser aterrorizado en caso de desbordamiento',
    },
    prevent_infection: {
        en: 'Chances of not becoming infected following an injury',
        fr: 'Chances de ne pas être infecté des suites d\'une blessure',
        de: 'Chancen, sich nach einer Verletzung nicht zu infizieren',
        es: 'Probabilidades de no infectarse tras una lesión',
    },
    fatal_infection: {
        en: 'Chances of dying from an infection',
        fr: 'Chances de mourir d\'une infection',
        de: 'Sterblichkeitsrisiko durch eine Infektion',
        es: 'Probabilidades de morir por una infección',
    }
} satisfies Record<string, I18nLabel>;

export const jobs: { id: string; img: string; label: I18nLabel; camping_factor: number }[] = [
    {
        id: 'citizen',
        img: 'basic',
        label: {
            de: 'Einwohner',
            en: 'Citizen',
            es: 'Resident',
            fr: 'Habitant'
        },
        camping_factor: 0.9
    },
    {
        id: 'scavenger',
        img: 'dig',
        label: {
            de: 'Buddler',
            en: 'Scavenger',
            es: 'Excavador',
            fr: 'Fouineur'
        },
        camping_factor: 0.9
    },
    {
        id: 'scout',
        img: 'vest',
        label: {
            de: 'Aufklärer',
            en: 'Scout',
            es: 'Explorador',
            fr: 'Éclaireur'
        },
        camping_factor: 0.9
    },
    {
        id: 'guardian',
        img: 'shield',
        label: {
            de: 'Wächter',
            en: 'Guardian',
            es: 'Guardián',
            fr: 'Gardien'
        },
        camping_factor: 0.9
    },
    {
        id: 'survivalist',
        img: 'book',
        label: {
            de: 'Einsiedler',
            en: 'Survivalist',
            es: 'Ermitaño',
            fr: 'Ermite'
        },
        camping_factor: 1
    },
    {
        id: 'tamer',
        img: 'tamer',
        label: {
            de: 'Dompteur',
            en: 'Tamer',
            es: 'Domador',
            fr: 'Apprivoiseur'
        },
        camping_factor: 0.9
    },
    {
        id: 'technician',
        img: 'tech',
        label: {
            de: 'Techniker',
            en: 'Technician',
            es: 'Técnico',
            fr: 'Technicien'
        },
        camping_factor: 0.9
    },
];

export const status_list = [
    { id: 'clean', img: 'status/status_clean.gif', pdc: 1, terror: -3 }, // Jamais drogué
    { id: 'hasdrunk', img: 'status/status_hasdrunk.gif' }, // A bu
    { id: 'haseaten', img: 'status/status_haseaten.gif' }, // A mangé
    { id: 'camper', img: 'status/status_camper.gif', searches: '+10%' }, // A campé
    { id: 'immune', img: 'status/status_immune.gif', watch_death: -0.01 }, // Immunisé
    { id: 'hsurvive', img: 'status/status_hsurvive.gif' }, // VLM niveau 1
    { id: 'hsurvive2', img: 'status/status_hsurvive2.gif' }, // VLM niveau 2
    { id: 'hsurvive3', img: 'status/status_hsurvive3.gif' }, // VLM niveau 3
    { id: 'tired', img: 'status/status_tired.gif' }, // Fatigué
    { id: 'terror', img: 'status/status_terror.gif', watch_def: -30, watch_death: 0.05 }, // Terrorisé
    { id: 'thirst1', img: 'status/status_thirst1.gif', watch_def: -5 }, // Soif
    { id: 'thirst2', img: 'status/status_thirst2.gif', watch_def: -10, wath_death: 0.03 }, // Deshy
    { id: 'drugged', img: 'status/status_drugged.gif', watch_def: 10 }, // Drogué
    { id: 'addict', img: 'status/status_addict.gif', watch_def: 10, watch_death: 0.06 }, // Dépendant
    { id: 'infection', img: 'status/status_infection.gif', watch_def: -15, watch_death: 0.1 }, // Infecté
    { id: 'drunk', img: 'status/status_drunk.gif', watch_def: 15, watch_death: -0.02, searches: '-20%' }, // Ivre
    { id: 'hungover', img: 'status/status_hungover.gif', watch_def: -15, watch_death: 0.06 }, // Gueule de bois
    {
        id: 'wound1',
        img: 'status/status_wound1.gif',
        watch_def: -15,
        watch_death: 0.10,
        properties: ['wounded', 'head_wounded']
    }, // Blessure à la tête
    {
        id: 'wound2',
        img: 'status/status_wound2.gif',
        watch_def: -15,
        watch_death: 0.10,
        properties: ['wounded', 'hand_wounded']
    }, // Blessure à la main
    {
        id: 'wound3',
        img: 'status/status_wound3.gif',
        watch_def: -15,
        watch_death: 0.10,
        properties: ['wounded', 'arm_wounded']
    }, // Blessure au bras
    {
        id: 'wound4',
        img: 'status/status_wound4.gif',
        watch_def: -15,
        watch_death: 0.10,
        properties: ['wounded', 'leg_wounded']
    }, // Blessure à la jambe
    {
        id: 'wound5',
        img: 'status/status_wound5.gif',
        watch_def: -15,
        watch_death: 0.10,
        properties: ['wounded'],
        searches: '/2'
    }, // Blessure à l'oeil
    { id: 'wound6', img: 'status/status_wound6.gif', watch_def: -15, watch_death: 0.10, properties: ['wounded'] }, // Blessure au pied
    { id: 'healed', img: 'status/status_healed.gif', watch_def: -15, watch_death: 0.05 }, // Convalescent
    { id: 'hydrated', img: 'status/status_hydrated.gif', pdc: 1 }, // Hydraté
    { id: 'sober', img: 'status/status_sober.gif', pdc: 1 }, // Sobre
    {
        id: 'good_smell',
        img: 'status/status_good_smell.gif',
        terror: -25,
        fatal_infection: -0.25,
        prevent_infection: 0.25
    } // Bonne odeur
];

export const api_texts = {
    error: {
        en: 'An error occured. (Error : $error$)',
        fr: 'Une erreur s\'est produite. (Erreur : $error$)',
        de: 'Fehler aufgetreten. (Fehler : $error$)',
        es: 'Ha ocurrido un error. (Error: $error$)'
    },
    error_version: {
        en: 'Your script is not up to date (your version: $your_version$ / most recent version: $recent_version$). Update the script, then try again.',
        fr: 'Votre script n\'est pas à jour (votre version : $your_version$ / version la plus récente : $recent_version$). Mettez le script à jour, puis réessayez.',
        de: 'Ihr Skript ist nicht aktuell (Ihre Version: $your_version$ / neueste Version: $recent_version$). Aktualisieren Sie das Skript und versuchen Sie es erneut.',
        es: 'Tu script no está actualizado (tu versión: $your_version$ / versión más reciente: $recent_version$). Actualice el script y vuelva a intentarlo.'
    },
    error_version_startup: {
        en: 'Your script is not up to date (your version: $your_version$ / most recent version: $recent_version$).<br /><br />Some features may not work.<br /><br />Update the script to no longer see this error.',
        fr: 'Votre script n\'est pas à jour (votre version : $your_version$ / version la plus récente : $recent_version$).<br /><br />Certaines fonctionnalités risquent de ne pas fonctionner.<br /><br />Mettez le script à jour pour ne plus voir cette erreur.',
        de: 'Ihr Skript ist nicht aktuell (Ihre Version: $your_version$ / aktuellste Version: $recent_version$).<br /><br />Einige Funktionen funktionieren möglicherweise nicht.<br /><br />Aktualisieren Sie das Skript, damit dieser Fehler nicht mehr angezeigt wird.',
        es: 'Tu script no está actualizado (su versión: $your_version$ / versión más reciente: $recent_version$).<br /><br />Es posible que algunas funciones no funcionen.<br /><br />Actualice el script para que ya no vea este error.'
    },
    error_version_unavailable: {
        en: 'Unable to read the extension version: reload the page (the extension may have just been updated).',
        fr: 'Impossible de lire la version de l\'extension : rechargez la page (l\'extension a peut-être été mise à jour).',
        de: 'Die Erweiterungsversion konnte nicht gelesen werden: Laden Sie die Seite neu (die Erweiterung wurde möglicherweise gerade aktualisiert).',
        es: 'No se puede leer la versión de la extensión: recargue la página (es posible que la extensión se acabe de actualizar).'
    },
    update_script: {
        en: 'To update your script, you can use your extension\'s update functionality or <a target="_blank" href="$update_url$" style="text-decoration: underline;"><i >click on this link</i></a>, then refresh the game page.',
        fr: 'Pour mettre votre script à jour, vous pouvez utiliser la fonctionnalité de mise à jour de votre extension ou <a target="_blank" href="$update_url$" style="text-decoration: underline;"><i>cliquer sur ce lien</i></a>, puis rafraîchir la page du jeu.',
        de: 'Um Ihr Skript zu aktualisieren, können Sie die Aktualisierungsfunktion Ihrer Erweiterung verwenden oder <a target="_blank" href="$update_url$" style="text-decoration: underline;"><i >auf diesen Link klicken</ i></a>, dann aktualisiere die Spieleseite.',
        es: 'Para actualizar su secuencia de comandos, puede utilizar la función de actualización de su extensión o <a target="_blank" href="$update_url$" style="text-decoration: underline;"><i >haga clic en este enlace</ i></a>, luego actualiza la página del juego.'
    },
    update_script_via_menu: {
        en: 'To update your extension, open the addon menu and use the "Update available" entry, or wait: it installs automatically.',
        fr: 'Pour mettre à jour votre extension, ouvrez le menu de l\'addon et utilisez l\'entrée « Mise à jour disponible », ou patientez : elle s\'installe automatiquement.',
        de: 'Um Ihre Erweiterung zu aktualisieren, öffnen Sie das Add-on-Menü und verwenden Sie den Eintrag „Update verfügbar“, oder warten Sie: sie installiert sich automatisch.',
        es: 'Para actualizar tu extensión, abre el menú del addon y utiliza la entrada "Actualización disponible", o espera: se instala automáticamente.'
    },
    error_discord: {
        en: 'If the error persists, please let us know on <a href="https://discord.gg/ZQH7ZPWcCm">Discord</a>.',
        fr: 'Si l\'erreur persiste, n\'hésitez pas à nous la signaler sur <a href="https://discord.gg/ZQH7ZPWcCm">Discord</a>.',
        de: 'Wenn der Fehler weiterhin besteht, teilen Sie uns dies bitte auf <a href="https://discord.gg/ZQH7ZPWcCm">Discord</a> mit.',
        es: 'Si el error persiste, infórmanos en <a href="https://discord.gg/ZQH7ZPWcCm">Discord</a>.'
    },
    update_wishlist_success: {
        en: 'Shopping list updated.',
        fr: 'La liste de courses a bien été mise à jour.',
        de: 'Einkaufsliste aktualisiert.',
        es: 'La lista de deseos ha sido actualizada.'
    },
    add_to_wishlist_success: {
        en: 'Item has been added to the shopping list.',
        fr: 'L\'objet a bien été ajouté à la liste de courses.',
        de: 'Gegenstand wurde der Einkaufsliste hinzugefügt.',
        es: 'El objeto ha sido añadido a la lista de deseos.'
    },
} satisfies Record<string, I18nLabel>;

export const action_types: { id: string; label: I18nLabel; ordering: number }[] = [
    {
        id: 'Recipe::ManualAnywhere',
        label: { en: 'Citizen actions', fr: 'Actions du citoyen', de: 'Bürgeraktionen', es: 'Acciones del habitante' },
        ordering: 1
    },
    {
        id: 'Recipe::ManualInside',
        label: {
            en: 'Citizen actions in the town',
            fr: 'Actions du citoyen en ville',
            de: 'Bürgeraktionen in der Stadt',
            es: 'Acciones del habitante en el pueblo'
        },
        ordering: 2
    },
    {
        id: 'Recipe::ManualOutside',
        label: {
            en: 'Citizen actions in the World Beyond',
            fr: 'Actions du citoyen dans l\'Outre-Monde',
            de: 'Bürgeraktionen in der Außenwelt',
            es: 'Acciones del habitante en el ultramundo'
        },
        ordering: 3
    },
    { id: 'Recipe::WorkshopType', label: { en: 'Workshop', fr: 'Atelier', de: 'Werkstatt', es: 'Taller' }, ordering: 0 },
    {
        id: 'Recipe::WorkshopTypeShamanSpecific',
        label: { en: 'Workshop - Shaman', fr: 'Atelier - Chaman', de: 'Werkstatt - Schamane', es: 'Taller - Chamán' },
        ordering: 4
    },
    {
        id: 'Recipe::WorkshopTypeTechSpecific',
        label: {
            en: 'Technicians Workbench',
            fr: 'Établi des Techniciens',
            de: 'Techniker-Werkstatte',
            es: 'Mesa de Trabajo de Técnicos'
        },
        ordering: 5
    },
];

export const wishlist_depot: { value: number; label: I18nLabel }[] = [
    {
        value: -1000,
        label: {
            en: 'Do not bring back',
            fr: 'Ne pas ramener',
            de: 'Nicht zurückbringen',
            es: 'No traer de vuelta'
        }
    },
    {
        value: -1,
        label: {
            en: 'Not defined',
            fr: 'Non défini',
            de: 'Nicht definiert',
            es: 'Indefinida'
        }
    },
    {
        value: 0,
        label: {
            en: 'Bank',
            fr: 'Banque',
            de: 'Bank',
            es: 'Almacén'
        }
    },
    {
        value: 1,
        label: {
            en: 'Teleport area',
            fr: 'Zone de rapatriement',
            de: 'Rettungs-Bereich',
            es: 'Zona de volver'
        }
    }
];

export const wishlist_title: I18nLabel = {
    en: 'Wishlist',
    fr: 'Liste de courses',
    de: 'Wunschzettel',
    es: 'Lista de deseos'
};

export const wishlist_headers: { label: I18nLabel; id: string; class_width: string }[] = [
    {
        label: {
            en: 'Item',
            fr: 'Objet',
            de: 'Gegenstand',
            es: 'Objeto'
        },
        id: 'label',
        class_width: 'rw-5'
    },
    {
        label: {
            en: 'Location',
            fr: 'Dépôt',
            de: 'Ort',
            es: 'Depósito'
        },
        id: 'depot',
        class_width: 'rw-3'
    },
    {
        label: {
            en: 'In bank',
            fr: 'En banque',
            de: 'In der Bank',
            es: 'En el almacén'
        },
        id: 'bank_count',
        class_width: 'rw-1'
    },
    {
        label: {
            en: 'In rucksack',
            fr: 'En sacs',
            de: 'In den Rucksäcken',
            es: 'En las mochilas'
        },
        id: 'bag_count',
        class_width: 'rw-1'
    },
    {
        label: {
            en: 'In chests',
            fr: 'En coffres',
            de: 'In den Truhen',
            es: 'En los cofres'
        },
        id: 'chest_count',
        class_width: 'rw-1'
    },
    {
        label: {
            en: 'On the map',
            fr: 'Sur la carte',
            de: 'Auf der Karte',
            es: 'En el mapa'
        },
        id: 'map_cell_item_count',
        class_width: 'rw-1'
    },
    {
        label: {
            en: 'Desired',
            fr: 'Souhaité',
            de: 'Gewünschter',
            es: 'Deseada'
        },
        id: 'bank_needed',
        class_width: 'rw-2'
    },
    {
        label: {
            en: 'Missing',
            fr: 'Manquant',
            de: 'Fehlen',
            es: 'Necesario'
        },
        id: 'diff',
        class_width: 'rw-2'
    }
];

export const opener_relation_texts = {
    opened_with: {
        en: 'Opened by',
        fr: 'Ouvert par',
        de: 'Geöffnet von',
        es: 'Abierto por'
    },
    free_to_open: {
        en: 'Can be opened for free',
        fr: 'Peut être ouvert gratuitement',
        de: 'Kann kostenlos geöffnet werden',
        es: 'Se puede abrir gratis'
    },
    open_cost: {
        en: 'Opening',
        fr: 'Ouverture',
        de: 'Öffnen',
        es: 'Apertura'
    },
    technician_alternative: {
        en: 'or',
        fr: 'ou',
        de: 'oder',
        es: 'o'
    },
    opens: {
        en: 'Opens',
        fr: 'Ouvre',
        de: 'Öffnet',
        es: 'Abre'
    }
};

export const catapult_effect_texts = {
    repel: {
        en: 'Repels zombies for $minutes$ minutes',
        fr: 'Repousse les zombies pendant $minutes$ minutes',
        de: 'Vertreibt Zombies für $minutes$ Minuten',
        es: 'Repele a los zombis durante $minutes$ minutos'
    },
    radius_target: {
        en: 'on the targeted zone',
        fr: 'sur la zone visée',
        de: 'auf der Zielzone',
        es: 'en la zona objetivo'
    },
    radius_cross: {
        en: 'on the targeted zone and its neighbors',
        fr: 'sur la zone visée et les cases adjacentes',
        de: 'auf der Zielzone und den angrenzenden Feldern',
        es: 'en la zona objetivo y las casillas adyacentes'
    },
    radius_square: {
        en: 'in a 3×3 area',
        fr: 'dans un rayon de 3×3 cases',
        de: 'in einem Bereich von 3×3 Feldern',
        es: 'en un área de 3×3 casillas'
    }
};

export const item_action_effects_texts = {
    watch_survival: {
        en: 'Survival chances while on watch',
        fr: 'Chances de survie en veille',
        de: 'Überlebenschancen während der Wache',
        es: 'Probabilidades de supervivencia mientras estás de guardia'
    },
    outcome_all_zombies: {
        en: 'all zombies',
        fr: 'tous les zombies',
        de: 'alle Zombies',
        es: 'todos los zombis'
    },
    watch_cumulative: {
        en: '(stackable)',
        fr: '(cumulable)',
        de: '(kumulierbar)',
        es: '(acumulable)'
    },
    on_watch: {
        en: 'On watch',
        fr: 'En veille',
        de: 'Während der Wache',
        es: 'De guardia'
    },
    bag_slots: {
        en: '+$n$ slots',
        fr: '+$n$ places',
        de: '+$n$ Plätze',
        es: '+$n$ plazas'
    },
    bag_exclusive: {
        en: 'Only one at a time among:',
        fr: 'Un seul à la fois parmi :',
        de: 'Nur einer gleichzeitig von:',
        es: 'Solo uno a la vez entre:'
    },
    action_open: {
        en: 'Open',
        fr: 'Ouvrir',
        de: 'Öffnen',
        es: 'Abrir'
    },
    action_slaughter: {
        en: 'Carve',
        fr: 'Découper',
        de: 'Ausweiden',
        es: 'Cortar'
    },
    action_purify: {
        en: 'Clean',
        fr: 'Purifier',
        de: 'Reinigen (Wasser)',
        es: 'Purificar'
    },
    action_purify_ap: {
        en: 'Clean (1AP)',
        fr: 'Purifier (1PA)',
        de: 'Reinigen (1AP) (Wasser)',
        es: 'Purificar (1PA)'
    },
    action_attack: {
        en: 'Attack',
        fr: 'Attaquer avec',
        de: 'Waffe einsetzen',
        es: 'Atacar con'
    },
    loaded_form: {
        en: 'Once loaded:',
        fr: 'Une fois chargé :',
        de: 'Wenn geladen:',
        es: 'Una vez cargado:'
    },
    outcome_broken: {
        en: 'Breaks',
        fr: 'Se casse',
        de: 'Geht kaputt',
        es: 'Se rompe'
    },
    outcome_consumed: {
        en: 'Consumed',
        fr: 'Consommé',
        de: 'Verbraucht',
        es: 'Consumido'
    },
    reload_charges: {
        en: 'Charges on reload:',
        fr: 'Charges à la recharge :',
        de: 'Ladungen beim Aufladen:',
        es: 'Cargas al recargar:'
    },
    reload_charges_range: {
        en: '$min$ to $max$',
        fr: '$min$ à $max$',
        de: '$min$ bis $max$',
        es: '$min$ a $max$'
    },
    dig_frequency: {
        en: 'Search frequency:',
        fr: 'Fréquence en fouille :',
        de: 'Häufigkeit beim Graben:',
        es: 'Frecuencia al excavar:'
    },
    dig_one: {
        en: '≈ 1 successful search in $n$',
        fr: '≈ 1 fouille réussie sur $n$',
        de: '≈ 1 erfolgreiche Grabung von $n$',
        es: '≈ 1 excavación exitosa de cada $n$'
    },
    dig_many: {
        en: '≈ $hits$ successful searches in $n$',
        fr: '≈ $hits$ fouilles réussies sur $n$',
        de: '≈ $hits$ erfolgreiche Grabungen von $n$',
        es: '≈ $hits$ excavaciones exitosas de cada $n$'
    },
    dig_depleted: {
        en: '(depleted zone)',
        fr: '(zone épuisée)',
        de: '(erschöpfte Zone)',
        es: '(zona agotada)'
    },
    dig_very_common: { en: 'Very common', fr: 'Très courant', de: 'Sehr häufig', es: 'Muy común' },
    dig_common: { en: 'Common', fr: 'Courant', de: 'Häufig', es: 'Común' },
    dig_uncommon: { en: 'Uncommon', fr: 'Peu courant', de: 'Gelegentlich', es: 'Poco común' },
    dig_rare: { en: 'Rare', fr: 'Rare', de: 'Selten', es: 'Raro' },
    dig_very_rare: { en: 'Very rare', fr: 'Très rare', de: 'Sehr selten', es: 'Muy raro' }
};

/** Clés des textes de `expedition_texts` */
type ExpeditionTextKey =
    | 'my_expedition_title'
    | 'expedition_part'
    | 'reload_my_expedition'
    | 'route_follow'
    | 'route_back'
    | 'route_arrived'
    | 'route_none'
    | 'route_unknown_position'
    | 'direction_north'
    | 'direction_east'
    | 'direction_south'
    | 'direction_west'
    | 'or'
    | 'ap_short'
    | 'cell_orders_header'
    | 'no_cell_orders'
    | 'other_members_orders'
    | 'next_orders_cell'
    | 'order_kind_pick'
    | 'order_kind_drop'
    | 'order_kind_use'
    | 'order_kind_clear'
    | 'order_kind_explore'
    | 'order_kind_excavate'
    | 'order_kind_camp'
    | 'order_kind_hero'
    | 'order_kind_wait'
    | 'order_wait_group'
    | 'order_wait_expedition'
    | 'order_clear_piles'
    | 'route_choice'
    | 'no_route_followed'
    | 'my_expeditions_group'
    | 'routes_without_expedition'
    | 'passage_first'
    | 'passage_nth';

/** Mon expédition dans le désert : tracé à suivre et consignes (`ui/expedition-route.ts`, `ui/expedition-order.ts`) */
export const expedition_texts: Readonly<Record<ExpeditionTextKey, I18nLabel>> = {
    my_expedition_title: {
        en: 'My expedition',
        fr: 'Mon expédition',
        de: 'Meine Expedition',
        es: 'Mi expedición'
    },
    expedition_part: {
        en: 'part',
        fr: 'partie',
        de: 'Teil',
        es: 'parte'
    },
    reload_my_expedition: {
        en: 'Reload my expedition',
        fr: 'Recharger mon expédition',
        de: 'Meine Expedition neu laden',
        es: 'Recargar mi expedición'
    },
    route_follow: {
        en: 'Follow the route:',
        fr: 'Suivez le tracé :',
        de: 'Folge der Route:',
        es: 'Sigue la ruta:'
    },
    route_back: {
        en: 'Off the route, go back:',
        fr: 'Hors du tracé, rejoignez-le :',
        de: 'Abseits der Route, kehre zurück:',
        es: 'Fuera de la ruta, vuelve a ella:'
    },
    route_arrived: {
        en: 'End of the route',
        fr: 'Fin du tracé',
        de: 'Ende der Route',
        es: 'Fin de la ruta'
    },
    route_none: {
        en: 'No route linked to this expedition',
        fr: 'Aucun tracé lié à cette expédition',
        de: 'Keine Route mit dieser Expedition verknüpft',
        es: 'Ninguna ruta vinculada a esta expedición'
    },
    route_unknown_position: {
        en: 'Position unknown: no direction',
        fr: 'Position inconnue : pas de direction',
        de: 'Position unbekannt: keine Richtung',
        es: 'Posición desconocida: sin dirección'
    },
    direction_north: {
        en: 'north',
        fr: 'nord',
        de: 'Norden',
        es: 'norte'
    },
    direction_east: {
        en: 'east',
        fr: 'est',
        de: 'Osten',
        es: 'este'
    },
    direction_south: {
        en: 'south',
        fr: 'sud',
        de: 'Süden',
        es: 'sur'
    },
    direction_west: {
        en: 'west',
        fr: 'ouest',
        de: 'Westen',
        es: 'oeste'
    },
    or: {
        en: 'or',
        fr: 'ou',
        de: 'oder',
        es: 'o'
    },
    ap_short: {
        en: 'AP',
        fr: 'PA',
        de: 'AP',
        es: 'PA'
    },
    cell_orders_header: {
        en: 'Instructions for this zone',
        fr: 'Consignes de la case',
        de: 'Anweisungen für diese Zone',
        es: 'Instrucciones de esta zona'
    },
    no_cell_orders: {
        en: 'No instruction for this zone',
        fr: 'Aucune consigne sur cette case',
        de: 'Keine Anweisung für diese Zone',
        es: 'Ninguna instrucción para esta zona'
    },
    other_members_orders: {
        en: 'For other members',
        fr: 'Pour d\'autres membres',
        de: 'Für andere Mitglieder',
        es: 'Para otros miembros'
    },
    next_orders_cell: {
        en: 'Next zone with instructions:',
        fr: 'Prochaine case à consignes :',
        de: 'Nächste Zone mit Anweisungen:',
        es: 'Próxima zona con instrucciones:'
    },
    order_kind_pick: {
        en: 'Pick up',
        fr: 'Ramasser',
        de: 'Aufheben',
        es: 'Recoger'
    },
    order_kind_drop: {
        en: 'Drop',
        fr: 'Déposer',
        de: 'Ablegen',
        es: 'Dejar'
    },
    order_kind_use: {
        en: 'Consume',
        fr: 'Consommer',
        de: 'Verbrauchen',
        es: 'Consumir'
    },
    order_kind_clear: {
        en: 'Clear',
        fr: 'Déblayer',
        de: 'Freiräumen',
        es: 'Despejar'
    },
    order_kind_explore: {
        en: 'Explore the ruin',
        fr: 'Explorer la ruine',
        de: 'Die Ruine erkunden',
        es: 'Explorar la ruina'
    },
    order_kind_excavate: {
        en: 'Excavate the zone',
        fr: 'Excaver la zone',
        de: 'Zone ausheben',
        es: 'Excavar la zona'
    },
    order_kind_camp: {
        en: 'Camp',
        fr: 'Camper',
        de: 'Campen',
        es: 'Acampar'
    },
    order_kind_hero: {
        en: 'Heroic action',
        fr: 'Action héroïque',
        de: 'Heldentat',
        es: 'Acción heroica'
    },
    order_kind_wait: {
        en: 'Wait for',
        fr: 'Attendre',
        de: 'Warten auf',
        es: 'Esperar a'
    },
    order_wait_group: {
        en: 'the group',
        fr: 'le groupe',
        de: 'die Gruppe',
        es: 'al grupo'
    },
    order_wait_expedition: {
        en: 'another expedition',
        fr: 'une autre expédition',
        de: 'eine andere Expedition',
        es: 'otra expedición'
    },
    order_clear_piles: {
        en: 'pile(s)',
        fr: 'tas',
        de: 'Haufen',
        es: 'montón(es)'
    },
    route_choice: {
        en: 'Route to follow in the desert',
        fr: 'Tracé à suivre dans le désert',
        de: 'In der Wüste zu folgende Route',
        es: 'Ruta a seguir en el desierto'
    },
    no_route_followed: {
        en: '— No route —',
        fr: '— Aucun tracé —',
        de: '— Keine Route —',
        es: '— Ninguna ruta —'
    },
    my_expeditions_group: {
        en: 'My expeditions',
        fr: 'Mes expéditions',
        de: 'Meine Expeditionen',
        es: 'Mis expediciones'
    },
    routes_without_expedition: {
        en: 'Routes without expedition',
        fr: 'Tracés sans expédition',
        de: 'Routen ohne Expedition',
        es: 'Rutas sin expedición'
    },
    passage_first: {
        en: 'Pass 1',
        fr: '1er passage',
        de: '1. Durchgang',
        es: 'Paso 1'
    },
    passage_nth: {
        en: 'Pass {n}',
        fr: '{n}e passage',
        de: '{n}. Durchgang',
        es: 'Paso {n}'
    }
};

/** Clés des textes de `program_texts` */
type ProgramTextKey =
    | 'title'
    | 'day_label'
    | 'tab_expedition'
    | 'tab_buildings'
    | 'day_instructions'
    | 'evening_vote'
    | 'evening_votes'
    | 'my_tasks'
    | 'program_steps'
    | 'detected'
    | 'refresh'
    | 'step_leave'
    | 'repair_survive'
    | 'repair_until'
    | 'repair_full'
    | 'level_short'
    | 'not_registered'
    | 'no_cell'
    | 'not_citizen'
    | 'no_plan'
    | 'nothing';

/** Mon programme : expédition et chantiers du jour (`utils/my-program.ts`) */
export const program_texts: Readonly<Record<ProgramTextKey, I18nLabel>> = {
    title: {
        en: 'My program',
        fr: 'Mon programme',
        de: 'Mein Programm',
        es: 'Mi programa'
    },
    /** Jour abrégé, comme sur le site */
    day_label: {
        en: 'D{day}',
        fr: 'J{day}',
        de: 'T{day}',
        es: 'D{day}'
    },
    tab_expedition: {
        en: 'Expedition',
        fr: 'Expédition',
        de: 'Expedition',
        es: 'Expedición'
    },
    tab_buildings: {
        en: 'Construction sites',
        fr: 'Chantiers',
        de: 'Konstruktionen',
        es: 'Construcciones'
    },
    day_instructions: {
        en: 'Instructions of the day',
        fr: 'Consignes du jour',
        de: 'Anweisungen des Tages',
        es: 'Consignas del día'
    },
    evening_vote: {
        en: 'Upgrade voted tonight',
        fr: 'Évolution votée ce soir',
        de: 'Heute Abend gewählte Verbesserung',
        es: 'Mejora votada esta noche'
    },
    evening_votes: {
        en: 'Upgrades voted tonight',
        fr: 'Évolutions votées ce soir',
        de: 'Heute Abend gewählte Ausbaustufen',
        es: 'Mejoras votadas esta noche'
    },
    my_tasks: {
        en: 'Individual instructions',
        fr: 'Consignes individuelles',
        de: 'Persönliche Anweisungen',
        es: 'Consignas individuales'
    },
    program_steps: {
        en: 'Construction site program, in order',
        fr: 'Programme chantiers dans l\'ordre',
        de: 'Konstruktionsprogramm in Reihenfolge',
        es: 'Programa de construcciones en orden'
    },
    detected: {
        en: 'read in game',
        fr: 'relevé en jeu',
        de: 'im Spiel erfasst',
        es: 'leído en el juego'
    },
    refresh: {
        en: 'Refresh',
        fr: 'Actualiser',
        de: 'Aktualisieren',
        es: 'Actualizar'
    },
    step_leave: {
        en: 'Leave {label} at {n}AP',
        fr: 'Laisser {label} à {n}PA',
        de: '{label} bei {n}AP lassen',
        es: 'Dejar {label} en {n}PA'
    },
    repair_survive: {
        en: 'Repair {label} to survive the night',
        fr: 'Réparer {label} pour passer la nuit',
        de: '{label} reparieren, um die Nacht zu überstehen',
        es: 'Reparar {label} para pasar la noche'
    },
    repair_until: {
        en: 'Repair {label} up to {life}/{max} HP',
        fr: 'Réparer {label} jusqu\'à {life}/{max} PV',
        de: '{label} bis {life}/{max} LP reparieren',
        es: 'Reparar {label} hasta {life}/{max} PV'
    },
    repair_full: {
        en: 'Fully repair {label}',
        fr: 'Réparer entièrement {label}',
        de: '{label} vollständig reparieren',
        es: 'Reparar por completo {label}'
    },
    level_short: {
        en: 'lvl',
        fr: 'niv.',
        de: 'Stufe',
        es: 'niv.'
    },
    not_registered: {
        en: 'You are not registered on any expedition today.',
        fr: 'Vous n\'êtes inscrit sur aucune expédition aujourd\'hui.',
        de: 'Du bist heute in keiner Expedition eingetragen.',
        es: 'No estás inscrito en ninguna expedición hoy.'
    },
    no_cell: {
        en: 'No cell',
        fr: 'Sans case',
        de: 'Ohne Feld',
        es: 'Sin casilla'
    },
    not_citizen: {
        en: 'You are not a citizen of this town.',
        fr: 'Vous n\'êtes pas citoyen de cette ville.',
        de: 'Du bist kein Bürger dieser Stadt.',
        es: 'No eres ciudadano de esta ciudad.'
    },
    no_plan: {
        en: 'No program in effect for this day.',
        fr: 'Aucun programme effectif pour ce jour.',
        de: 'Für diesen Tag gilt kein Programm.',
        es: 'Ningún programa vigente para este día.'
    },
    nothing: {
        en: 'Nothing to do today.',
        fr: 'Rien à faire aujourd\'hui.',
        de: 'Heute gibt es nichts zu tun.',
        es: 'Nada que hacer hoy.'
    }
};
