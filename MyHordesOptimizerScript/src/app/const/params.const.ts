//////////////////////////////////////////////
// La liste des paramètres de l'application //
//////////////////////////////////////////////

export const params_categories = [
  {
    id: 'external_tools',
    label: {
      en: 'External tools',
      fr: 'Outils externes',
      de: 'Externen Tool',
      es: 'Aplicaciones externas'
    },
    params: [
      {
        id: 'update_mho',
        label: {
          en: 'Update MHO',
          fr: 'Mettre à jour MHO',
          de: 'MHO Aktualisieren',
          es: 'Actualizar MHO'
        },
        parent_id: null
      },
      {
        id: 'update_bbh',
        label: {
          en: 'Update BigBroth’Hordes',
          fr: 'Mettre à jour BigBroth\'Hordes',
          de: 'BigBroth’Hordes Aktualisieren',
          es: 'Actualizar BigBroth\'Hordes'
        },
        parent_id: null
      },
      {
        id: 'update_gh',
        label: {
          en: 'Update Gest’Hordes',
          fr: 'Mettre à jour Gest\'Hordes',
          de: 'Gest’Hordes aktualisieren',
          es: 'Actualizar Gest\'Hordes'
        },
        parent_id: null
      },
      {
        id: 'update_gh_without_api',
        label: {
          en: 'Add zombie markers to the GH box to indicate zombies killed. Update when the city is devastated.',
          fr: 'Ajouter des marqueurs zombies sur la case GH pour indiquer les zombies tués. Mettre à jour quand la ville est dévastée.',
          de: 'TODO',
          es: 'TODO'
        },
        parent_id: 'update_gh'
      },
      {
        id: 'update_fata',
        label: {
          en: 'Update Fata Morgana',
          fr: 'Mettre à jour Fata Morgana',
          de: 'Fata Morgana aktualisieren',
          es: 'Actualizar Fata Morgana'
        },
        parent_id: null
      },
      {
        id: 'display_map',
        label: {
          en: 'Allow to show a map from external tools',
          fr: 'Permettre d\'afficher une carte issue des outils externes',
          de: 'Anzeigen einer Karte von externen Tools ermöglichen',
          es: 'Permitir que se muestre un mapa proveniente de las aplicaciones externas'
        },
        help: {
          en: 'In any external tool, it will be possible to copy the town or ruin map and to paste it into MyHordes',
          fr: 'Dans les outils externes, il sera possible de copier la carte de la ville ou de la ruine, et une fois copiée de l\'afficher dans MyHordes',
          de: 'In jedem externen Tool wird es möglich sein, die Stadt- oder Ruinenkarte zu kopieren und in MyHordes einzufügen',
          es: 'En toda aplicación externa, es posible copiar el mapa del pueblo o de la ruina y pegarlo en MyHordes'
        },
        parent_id: null
      }
    ]
  },
  {
    id: 'display',
    label: {
      en: 'Interface improvements',
      fr: 'Améliorations de l\'interface',
      de: 'Benutzeroberfläche Verbesserungen',
      es: 'Mejoras de la interfaz'
    },
    params: [
      {
        id: 'enhanced_tooltips',
        label: {
          en: 'Show detailed tooltips',
          fr: 'Afficher des tooltips détaillés',
          de: 'Detaillierte Tooltips anzeigen',
          es: 'Mostrar tooltips detallados'
        },
        parent_id: null
      },
      {
        id: 'click_on_voted',
        label: {
          en: 'Quick navigation to recommended construction site',
          fr: 'Navigation rapide vers le chantier recommandé',
          de: 'Schnelle Navigation zur empfohlenen Baustelle',
          es: 'Navegación rápida hacia la construcción recomendada'
        },
        parent_id: null
      },
      {
        id: 'display_search_field_on_buildings',
        label: {
          en: 'Show a search field for construction sites',
          fr: 'Afficher un champ de recherche pour les chantiers',
          de: 'Ein Suchfeld für Baustellen anzeigen',
          es: 'Mostrar la barra buscadora para construcciones'
        },
        parent_id: null
      },
      {
        id: 'display_wishlist',
        label: {
          en: 'Display wishlist in interface',
          fr: 'Afficher la liste de courses dans l\'interface',
          de: 'Wunschzettel in der Benutzeroberfläche anzeigen',
          es: 'Mostrar la lista de deseos en la interfaz'
        },
        parent_id: null
      },
      {
        id: 'display_wishlist_closed',
        label: {
          en: 'Wishlish folded by default',
          fr: 'Liste de courses repliée par défaut',
          de: 'Wunschzettel standardmäßig gefaltet',
          es: 'Lista de deseos minimizada por defecto'
        },
        parent_id: 'display_wishlist'
      },
      {
        id: 'display_nb_dead_zombies',
        label: {
          en: 'Show the number of zombie that died today',
          fr: 'Afficher le nombre de zombies morts aujourd\'hui',
          de: 'Anzahl der Zombies die heute hier gestorben sind anzeigen',
          es: 'Mostrar la cantidad de zombis que murieron hoy'
        },
        help: {
          en: 'Allows to display the number of blood splatters on the map',
          fr: 'Permet d\'afficher le nombre de taches de sang sur la carte',
          de: 'Ermöglicht die Anzeige der Anzahl der Blutfleck auf der Karte',
          es: 'Permite mostrar la cantidad de manchas de sangre en el mapa'
        },
        parent_id: null
      },
      {
        id: 'display_translate_tool',
        label: {
          en: 'Show MyHordes\' item translation bar',
          fr: 'Afficher la barre de traduction des éléments de MyHordes',
          de: 'Übersetzungsleiste für MyHordes Elemente anzeigen',
          es: 'Mostrar la barra de traducción de elementos de MyHordes'
        },
        help: {
          en: 'Shows a translation bar. You must choose the initial language, then type the searched element to get the other translations.',
          fr: 'Affiche une barre de traduction. Vous devez choisir la langue initiale, puis saisir l\'élément recherché pour en récupérer les différentes traductions.',
          de: 'Zeigt eine Übersetzungsleiste an. Sie müssen die Ausgangssprache auswählen, und dann die Zielelemente eingeben um die Übersetzungen zu generieren.',
          es: 'Muestra una barra de traducción. Primero se debe escoger el idioma inicial, y luego ingresar el elemento buscado en la barra para obtener las distintas traducciones.'
        },
        parent_id: null
      },
      {
        id: 'display_missing_ap_for_buildings_to_be_safe',
        label: {
          en: 'Show missing AP to repair construction sites',
          fr: 'Afficher les PA manquants pour réparer les chantiers',
          de: 'Fehlende AP anzeigen, um Konstruktionen zu reparieren',
          es: 'Mostrar los PA faltantes para reparar las construcciones'
        },
        help: {
          en: 'In Pandemonium (Hardcore towns), the construction sites are damaged during the attack. The damages can amount to 70% max of the construction\'s life points (rounded up to the nearest whole number). This option displays over the constructions the number of AP needed to keep them safe.',
          fr: 'En Pandémonium, les bâtiments prennent des dégâts lors de l\'attaque. Ces dégâts équivalent à un maximum de 70% des points de vie du bâtiment (arrondi à l\'entier supérieur). Cette option affiche sur les bâtiments les PA à investir pour que le bâtiment soit en sécurité.',
          de: 'TODO',
          es: 'En Pandemonio, las construcciones sufren daños durante el ataque. Estos daños equivalen a un máximo de 70% de los puntos de vida de la construcción (redondeados al entero superior). Esta opción muestra sobre las construcciones la cantidad de PA a invertir para evitar que puedan ser destruidas.'
        },
        parent_id: null
      },
      {
        id: 'more_citizens_info',
        label: {
          en: 'Display a tab with additional information on the citizens page in town',
          fr: 'Afficher un onglet contenant des informations supplémentaires sur la page des citoyens',
          de: 'TODO',
          es: 'TODO'
        },
        parent_id: null
      },
      {
        id: 'display_camping_predict',
        label: {
          en: 'TODO',
          fr: 'Dans le désert, afficher des prédictions de camping directement dans la page',
          de: 'TODO',
          es: 'TODO'
        },
        parent_id: null
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
      //     parent_id: null
      // }
    ]
  },
  {
    id: 'notifications',
    label: {
      en: 'Notifications and warnings',
      fr: 'Notifications et avertissements',
      de: 'Hinweise und Warnungen',
      es: 'Notificaciones y advertencias'
    },
    params: [
      {
        id: 'prevent_from_leaving',
        label: {
          en: 'Request confirmation before leaving without automatic escort',
          fr: 'Demander confirmation avant de quitter en l\'absence d\'escorte automatique',
          de: 'Bestätigung anfordern bevor Abreise ohne automatische Eskorte',
          es: 'Pedir confirmación antes de cerrar la página sin haber puesto la escolta automática'
        },
        parent_id: null
      },
      {
        id: 'notify_on_search_end',
        label: {
          en: 'Notify me at the end of a search ',
          fr: 'Me notifier à la fin de la fouille',
          de: 'Mich Benachrichtigen am Ende einer Grabungsaktion',
          es: 'Notificarme al final de la búsquedas'
        },
        help: {
          en: 'Allows to receive a notification when a search ends if the page was not closed in the meantime',
          fr: 'Permet de recevoir une notification lorsque la fouille est terminée si la page n\'a pas été quittée entre temps',
          de: 'Ermöglicht den Erhalt einer Benachrichtigung wann eine Grabungsaktion endet wenn die Seite in der Zwischenzeit nicht geschlossen wurde',
          es: 'Permite recibir una notificación al terminar una búsqueda si la página no ha sido cerrada entre tanto'
        },
        parent_id: null
      }
    ]
  }
];


// const informations = [
//   {
//       id: `website`,
//       label: {
//           en: `Website`,
//           fr: `Site web`,
//           de: `Webseite`,
//           es: `Sitio web`
//       },
//       src: `https://myhordes-optimizer.web.app/`,
//       action: () => {},
//       img: `emotes/explo.gif`
//   },
//   {
//       id: `version`,
//       label: {
//           en: `Changelog ${GM_info.script.version}`,
//           fr: `Notes de version ${GM_info.script.version}`,
//           de: `Changelog ${GM_info.script.version}`,
//           es: `Notas de la versión ${GM_info.script.version}`
//       },
//       src: undefined,
//       action: () => {alert(changelog)},
//       img: `emotes/rptext.gif`
//   },
//   {
//       id: `discord-url-id`,
//       label: {
//           en: `Bugs? Ideas?`,
//           fr: `Des bugs ? Des idées ?`,
//           de: `Fehler ? Ideen ?`,
//           es: `¿Bugs? ¿Ideas?`
//       },
//       src: `https://discord.gg/ZQH7ZPWcCm`,
//       action: undefined,
//       img: `${repo_img_url}discord.ico`
//   },
//   {
//       id: `clean-app-id`,
//       label: {
//           en: `TODO`,
//           fr: `Réinitialiser mon ID d'app externe`,
//           de: `TODO`,
//           es: `TODO`
//       },
//       src: undefined,
//       action: () => {
//           GM.setValue(gm_mh_external_app_id_key, undefined);
//           external_app_id = undefined;
//       },
//       img: `icons/small_remove.gif`
//   }
// ];
