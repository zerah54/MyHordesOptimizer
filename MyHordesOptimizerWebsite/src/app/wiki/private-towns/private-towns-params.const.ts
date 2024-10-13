import { I18nLabels } from '../../_abstract_model/types/_types';

export const private_town_params: PrivateTownParams[] = [
    {
        name: {
            fr: 'Type de goule',
            en: 'Ghoul type',
            es: 'Mutante',
            de: 'Ghule'
        },
        options: [
            {
                name: {
                    fr: 'Normal',
                    en: 'Normal',
                    es: 'Normal',
                    de: 'Normal'
                },
                description: {
                    fr: 'Les goules n\'apparaissent pas automatiquement, mais d\'autres choses peuvent transformer les gens en goules.',
                    en: 'No ghoul appears at midnight. Other events can trigger ghouls to appear.',
                    es: 'No hay mutantes en la noche. Pero cuidado, los mutantes podrían aparecer por otros medios.',
                    de: 'Es erscheint zwar kein Ghul um Mitternacht. Dafür können andere Ereignisse das Auftreten von Ghulen auslösen.'
                },
                default_rne: true,
                default_re: true,
                default_pande: false,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Ville de bisounours',
                    en: 'Town of cuddly toys',
                    es: 'Pueblo de los juguetes de peluche',
                    de: 'Stadt der Kuscheltiere'
                },
                description: {
                    fr: 'Pas de goule possible.',
                    en: 'Ghouls are disabled.',
                    es: 'Los mutantes están desactivados.',
                    de: 'Ghule sind deaktiviert.'
                },
                default_rne: false,
                default_re: false,
                default_pande: false,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Soif de sang',
                    en: 'Bloodthirsty',
                    es: 'Voraces',
                    de: 'Blutdurst'
                },
                description: {
                    fr: 'Le rythme d\'apparition est inchangé mais une goule ne pourra réduire sa voracité qu\'en dévorant un citoyen.',
                    en: 'The rate of appearance of the ghoul is unchanged but ghouls can only reduce their hunger by devouring a citizen.',
                    es: 'El ritmo de aparición no cambia pero un mutante solo podrá reducir su voracidad devorando un habitante.',
                    de: 'Das Auftreten von Ghulen wird nicht geändert. Allerdings kann ein Ghul seinen Hunger nur stillen, indem er einen Mitbürger verspeist.'
                },
                default_rne: false,
                default_re: false,
                default_pande: false,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Aérogène',
                    en: 'Aerogenic',
                    es: 'Aerogénico',
                    de: 'Aerogen'
                },
                description: {
                    fr: 'Selon le type de ville que vous choisissez, les goules apparaîtront naturellement au fil des jours.',
                    en: 'Depending on the town type chosen, ghouls will spawn naturally as the days go by.',
                    es: 'Dependiendo del tipo de pueblo que elijas, los mutantes aparecerán naturalmente a medida que pasan los días.',
                    de: 'Je nach gewähltem Stadttyp erscheinen Ghule im Laufe von Tagen auf natürliche Weise.'
                },
                default_rne: false,
                default_re: false,
                default_pande: true,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Soif de sang et Aérogène',
                    en: 'Bloodthirst and Aerogenic',
                    es: 'Voraces y Aerogénico',
                    de: 'Blutdurst und Aerogen'
                },
                description: {
                    fr: 'Selon le type de ville sélectionné, les goules apparaissent naturellement au fil des jours. De plus, une goule ne peut satisfaire sa faim qu\'en mangeant un concitoyen.',
                    en: 'Depending on the selected city type, ghouls appear according to the usual rules. In addition, a ghoul can only satisfy its hunger by eating a fellow citizen.',
                    es: 'Dependiendo del tipo de pueblo seleccionado, los mutantes aparecer naturalmente con el tiempo. Además, un mutante solo puede satisfacer su hambre comiéndose a un habitante.',
                    de: 'Je nach gewähltem Stadttyp erscheinen Ghule nach den üblichen Regeln. Außerdem kann ein Ghul seinen Hunger nur stillen, indem er einen Mitbürger verspeist.'
                },
                default_rne: false,
                default_re: false,
                default_pande: false,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            }
        ],
        disabled_rne: false,
        disabled_re: false,
        disabled_pande: false,
    },
    {
        name: {
            fr: 'Âmes & chamans',
            en: 'Souls & Shamans',
            es: 'Almas y Chamanes',
            de: 'Seelen & Schamane'
        },
        options: [
            {
                name: {
                    fr: 'Normal',
                    en: 'Normal',
                    es: 'Normal',
                    de: 'Normal'
                },
                description: {
                    fr: 'Le chaman est élu et les âmes deviennent torturées.',
                    en: 'The shaman is a Role and the souls are tormented.',
                    es: 'El chamán es un rol y las almas son atormentadas.',
                    de: 'Der Schamane wird gewählt und die Seelen werden gequält.'
                },
                default_rne: false,
                default_re: true,
                default_pande: true,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Métier',
                    en: 'Job',
                    es: 'Oficio',
                    de: 'Job'
                },
                description: {
                    fr: 'Le chaman est un métier, les âmes sont transformées à l\'atelier.',
                    en: 'The shaman is a Profession, souls are transformed in the workshop.',
                    es: 'El chamán es un rol, las almas son transformadas en el taller.',
                    de: 'Der Schamane ist ein Beruf, die Seelen werden in der Werkstatt verwandelt.'
                },
                default_rne: false,
                default_re: false,
                default_pande: false,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Combiné',
                    en: 'Combined',
                    es: 'Combinados',
                    de: 'Kombiniert'
                },
                description: {
                    fr: 'Les deux modes chaman sont activés en même temps (expérimental !).',
                    en: 'Both shaman modes are enabled at the same time (experimental!).',
                    es: 'Ambos tipos de Chamán estarían habilitados al mismo tiempo (¡Experimental!).',
                    de: 'Beide Schamanen-Modi sind gleichzeitig aktiviert (experimentell!).'
                },
                default_rne: false,
                default_re: false,
                default_pande: false,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Désactivé',
                    en: 'Deactivated',
                    es: 'Desactivado',
                    de: 'Deaktiviert'
                },
                description: {
                    fr: '',
                    en: 'The shaman and the souls are deactivated.',
                    es: 'El chamán y las almas están desactivadas.',
                    de: 'Der Schamane und die Seelen werden deaktiviert.'
                },
                default_rne: true,
                default_re: false,
                default_pande: false,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            }
        ],
        disabled_rne: false,
        disabled_re: false,
        disabled_pande: false
    },
    {
        name: {
            fr: 'Veille',
            en: 'Watchmen',
            es: 'Vigilia',
            de: 'Nachtwache'
        },
        options: [
            {
                name: {
                    fr: 'Normal',
                    en: 'Normal',
                    es: 'Normal',
                    de: 'Normal'
                },
                description: {
                    fr: 'La veille de nuit est disponible lorsque le bâtiment Chemin de Ronde a été érigé.',
                    en: 'The night watch is available when the "Battlements" building has been constructed.',
                    es: 'La guardia de centinelas está disponible cuando se hayan construido las \'Almenas\'.',
                    de: 'Die Nachtwache ist verfügbar, wenn das Gebäude "Brustwehr" errichtet wurde.'
                },
                default_rne: true,
                default_re: true,
                default_pande: true,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Immédiatement',
                    en: 'Immediately',
                    es: 'Inmediatamente',
                    de: 'Sofort'
                },
                description: {
                    fr: 'La veille de nuit est disponible dès le départ.',
                    en: 'The night watch is available from the start.',
                    es: 'La guardia de centinelas está disponible desde el comienzo.',
                    de: 'Die Nachtwache ist von Anfang an verfügbar.'
                },
                default_rne: false,
                default_re: false,
                default_pande: false,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Désactivé',
                    en: 'Deactivated',
                    es: 'Desactivado',
                    de: 'Deaktiviert'
                },
                description: {
                    fr: 'La veille de nuit est désactivée.',
                    en: 'The night watch is deactivated.',
                    es: 'La guardia de centinelas está desactivada.',
                    de: 'Die Nachtwache ist deaktiviert.'
                },
                default_rne: false,
                default_re: false,
                default_pande: false,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            }
        ],
        disabled_rne: false,
        disabled_re: false,
        disabled_pande: false
    },
    {
        name: {
            fr: 'Mode nuit',
            en: 'Night mode',
            es: 'Modo nocturno',
            de: 'Nachtmodus'
        },
        options: [
            {
                name: {
                    fr: 'Étendu',
                    en: 'Extended',
                    es: 'Extendido',
                    de: 'Erweitert'
                },
                description: {
                    fr: 'Le mode nuit est activé et l\'Éclairage public est disponible.',
                    en: 'Night mode is activated and Public lights are available.',
                    es: 'El modo nocturno está activado y Alumbrado Público está disponible.',
                    de: 'Der Nachtmodus ist aktiviert und die Straßenbeleuchtung ist verfügbar.'
                },
                default_rne: false,
                default_re: true,
                default_pande: true,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Normal',
                    en: 'Normal',
                    es: 'Normal',
                    de: 'Normal'
                },
                description: {
                    fr: 'Le mode nuit est activé. L\'Éclairage public n\'est pas disponible.',
                    en: 'Night mode is activated. Public lights is not available.',
                    es: 'El modo nocturno está activado pero Alumbrado Público no está disponible.',
                    de: 'Der Nachtmodus ist aktiviert. Die Straßenbeleuchtung steht nicht zur Verfügung.'
                },
                default_rne: false,
                default_re: false,
                default_pande: false,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Désactivé',
                    en: 'Deactivated',
                    es: 'Desactivado',
                    de: 'Deaktiviert'
                },
                description: {
                    fr: 'Le mode nuit est désactivé.',
                    en: 'Night mode is deactivated.',
                    es: 'El modo nocturno está desactivado.',
                    de: 'Der Nachtmodus ist deaktiviert.'
                },
                default_rne: true,
                default_re: false,
                default_pande: false,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            }
        ],
        disabled_rne: true,
        disabled_re: false,
        disabled_pande: false,
    },
    {
        name: {
            fr: 'Zone de temps',
            en: 'Timezone',
            es: 'Zona horaria',
            de: 'Zeitzone'
        },
        options: [
            {
                name: {
                    fr: 'Période de la journée',
                    en: 'Day Time Phase',
                    es: 'Hora del dia',
                    de: 'Tagesphase'
                },
                description: {
                    fr: 'L\'heure donnée contrôle la durée de la journée. Si le mode nuit est désactivé, ce paramètre est purement cosmétique.',
                    en: 'The given time controls the duration of the day. If Night Mode is disabled, this setting is purely cosmetic.',
                    es: 'La hora establecida controla la duración del día. Si el modo nocturno está desactivado, este ajuste es solo cosmético.',
                    de: 'Die eingestellte Zeit gibt die Dauer des Tages an. Ist der Nachtmodus deaktiviert, hat diese Einstellung ausschließlich kosmetischen Einfluss.'
                },
                default_rne: true,
                default_re: true,
                default_pande: true,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Phase nocturne',
                    en: 'Night Time Phase',
                    es: 'Fase nocturna',
                    de: 'Nachtphase'
                },
                description: {
                    fr: 'L\'heure donnée contrôle la durée de la nuit. Si le mode nuit est désactivé, ce paramètre est purement cosmétique.',
                    en: 'The given time controls the duration of the night. If Night Mode is disabled, this setting is purely cosmetic.',
                    es: 'La hora establecida controla la duración de la noche. Si el modo nocturno está desactivado, este ajuste es solo cosmético.',
                    de: 'Die eingestellte Zeit gibt die Dauer der Nacht an. Ist der Nachtmodus deaktiviert, hat diese Einstellung ausschließlich kosmetischen Einfluss.'
                },
                default_rne: true,
                default_re: true,
                default_pande: true,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            }
        ],
        disabled_rne: false,
        disabled_re: false,
        disabled_pande: false
    },
    {
        name: {
            fr: 'Modifications du jeu',
            en: 'Game modifications',
            es: 'Modificaciones del juego',
            de: 'Spielmodifikationen'
        },
        options: [
            {
                name: {
                    fr: 'Exploration',
                    en: 'Exploration',
                    es: 'Exploración',
                    de: 'Exploration'
                },
                description: {
                    fr: 'Active les explorations de bâtiments avancées.',
                    en: 'Activate explorable ruins',
                    es: 'Activa las exploraciones de las ruinas avanzadas',
                    de: 'Begehbare Ruinen aktivieren'
                },
                default_rne: false,
                default_re: true,
                default_pande: true,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Escortes',
                    en: 'Escort',
                    es: 'Escolta',
                    de: 'Eskorte'
                },
                description: {
                    fr: 'Active les escortes citoyennes.',
                    en: 'Activate escorts',
                    es: 'Activa las escoltas ciudadanas',
                    de: 'Eskorten aktivieren'
                },
                default_rne: true,
                default_re: true,
                default_pande: true,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Bannissements',
                    en: 'Shunning',
                    es: 'Destierros',
                    de: 'Verbannung'
                },
                description: {
                    fr: 'Active les citoyens bannis.',
                    en: 'Activate shunning',
                    es: 'Activa los habitantes desterrados',
                    de: 'Verbannung aktivieren'
                },
                default_rne: true,
                default_re: true,
                default_pande: true,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Camping',
                    en: 'Camping',
                    es: 'Acampada',
                    de: 'Camping'
                },
                description: {
                    fr: 'Active le camping sauvage.',
                    en: 'Activate camping in the wild',
                    es: 'Activa el acampe en lo salvaje',
                    de: 'Camping in der Wildnis aktivieren'
                },
                default_rne: true,
                default_re: true,
                default_pande: true,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Usure des bâtiments',
                    en: 'Construction damage',
                    es: 'Desgaste de edificios',
                    de: 'Gebäudeschaden'
                },
                description: {
                    fr: 'Active l\'usure des bâtiments en pandémonium',
                    en: 'Activate building damage',
                    es: 'Activa el daño en las construcciones',
                    de: 'Gebäudeschaden aktivieren'
                },
                default_rne: false,
                default_re: false,
                default_pande: true,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Décharge améliorée',
                    en: 'Improved Dump',
                    es: 'Vertedero Mejorado',
                    de: 'Verbesserte Müllhalde'
                },
                description: {
                    fr: 'Active la décharge améliorée.',
                    en: 'Activate improved Dump',
                    es: 'Activa el vertedero mejorado',
                    de: 'Verbesserte Müllhalde aktivieren'
                },
                default_rne: true,
                default_re: true,
                default_pande: true,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Apps externe',
                    en: 'External APIs',
                    es: 'Aplicaciones externas',
                    de: 'Externe APIs'
                },
                description: {
                    fr: 'Activez les applications externes pour cette ville.',
                    en: 'Enable external applications for this town.',
                    es: 'Habilitar aplicaciones externas para este pueblo.',
                    de: 'Externe Anwendungen für diese Stadt aktivieren.'
                },
                default_rne: true,
                default_re: true,
                default_pande: true,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            }
        ],
        disabled_rne: false,
        disabled_re: false,
        disabled_pande: false
    },
    {
        name: {
            fr: 'Règles spéciales',
            en: 'Game rules',
            es: 'Reglas especiales',
            de: 'Spezialregeln'
        },
        options: [
            {
                name: {
                    fr: 'Aucun chantier de départ',
                    en: 'No starting buildings',
                    es: 'Sin construcciones al inicio',
                    de: 'Keine Startgebäude'
                },
                description: {
                    fr: 'Aucun chantier n\'est préalablement débloqué, tout est à trouver dans le désert !',
                    en: 'No building is unlocked at the beginning. All must be found in the World Beyond!',
                    es: 'Ningún edificio está desbloqueado desde el comienzo, ¡todos deben encontrarse en el Ultramundo!',
                    de: 'Kein Gebäude ist zu Beginn freigeschaltet. Alle müssen in der Aussenwelt gefunden werden!'
                },
                default_rne: false,
                default_re: false,
                default_pande: false,
                disabled_rne: false,
                disabled_re: true,
                disabled_pande: true,
            },
            {
                name: {
                    fr: 'Zone contaminée',
                    en: 'Contamined Zone',
                    es: 'Zona contaminada',
                    de: 'Kontaminierte Zone'
                },
                description: {
                    fr: 'Chaque nourriture ou drogue avalée a une petite chance de provoquer une infection.',
                    en: 'Every food and drug you consume has a low risk of infection.',
                    es: 'Toda la comida y drogas que consumas tendrá una pequeña probabilidad de infectarte.',
                    de: 'Jedes Essen und jede Droge, die du zu dir nimmst, birgt ein geringes Infektionsrisiko.'
                },
                default_rne: false,
                default_re: false,
                default_pande: false,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Activer les fonctionnalités beta',
                    en: 'Enable Beta functions',
                    es: 'Activar funciones beta',
                    de: 'Beta-Funktionen aktivieren'
                },
                description: {
                    fr: 'Chaque joueur reçoit 1x Betapropine au démarrage de la ville.',
                    en: 'Each player receives 1x Betaprophine when joining the town.',
                    es: 'Cada jugador recibe 1x Betapropin al comienzo dl pueblo.',
                    de: 'Jeder Spieler erhält 1x Betapropin beim Start der Stadt.'
                },
                default_rne: false,
                default_re: false,
                default_pande: false,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Activer la toxine',
                    en: 'Enable toxin',
                    es: 'Habilitar Toxina',
                    de: 'Toxin aktivieren'
                },
                description: {
                    fr: 'Permet aux joueurs de trouver l\'objet «_Pansement ensanglanté_» dans des ruines, qui peut être utilisé pour créer des toxines.',
                    en: 'Enables players to find the item "Bloody Dressing" within explorable ruins, which can be used to create toxin.',
                    es: 'Permitir a los jugadores encontrar el objeto "Tirita ensangrentada", que se puede utilizar para crear una Toxina.',
                    de: 'Ermöglicht es, in begehbaren Ruinen den Gegenstand "Blutdurchtränkter Verband" zu finden, aus dem Toxin hergestellt werden kann.'
                },
                default_rne: false,
                default_re: false,
                default_pande: false,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Goules affamées',
                    en: 'Hungry Ghouls',
                    es: 'Voracidad inicial',
                    de: 'Hungrige Ghule'
                },
                description: {
                    fr: 'Si cette option est activée, les goules nouvellement transformées commencent avec un peu de voracité...',
                    en: 'When enabled, newly transformed ghouls start with a bit of hunger...',
                    es: 'Cuando esta opción está activada, los mutantes recién transformados empezarán con un poco de voracidad...',
                    de: 'Ist diese Option aktiviert, haben frisch in Ghule verwandelte Bürger bereits Hunger.'
                },
                default_rne: false,
                default_re: false,
                default_pande: false,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Paradis des empoisonneurs',
                    en: 'Poisoner\'s paradise',
                    es: 'Paraíso de los envenenadores',
                    de: 'Paradies der Giftmörder'
                },
                description: {
                    fr: 'Change la façon dont le jeu gère les objets empoisonnés pour rendre leur détection plus difficile.',
                    en: 'Changes how the game handles poisoned items to make their detection more difficult.',
                    es: 'Cambió la forma en que el juego maneja los elementos envenenados para hacerlos más difíciles de detectar.',
                    de: 'Verändert das Verhalten im Bezug auf vergiftete Gegenstände und erschwert deren Erkennung.'
                },
                default_rne: false,
                default_re: false,
                default_pande: false,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Fouilles répétées',
                    en: 'Repeated digging',
                    es: 'Excavaciones repetidas',
                    de: 'Erneutes Buddeln'
                },
                description: {
                    fr: 'Permet aux citoyens de fouiller à nouveau sur des zones qu\'ils ont précédemment visitées.',
                    en: 'Enables citizens to dig again on zones they have previously visited.',
                    es: 'Permite a los habitantes excavar de nuevo en las zonas que han visitado anteriormente.',
                    de: 'Ermöglicht es, auf bereits besuchten Zonen erneut zu buddeln.'
                },
                default_rne: false,
                default_re: false,
                default_pande: false,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Sacs Matryoshka',
                    en: 'Matryoshka Bags',
                    es: 'Bolsas de Matroska',
                    de: 'Matroschka-Taschen'
                },
                description: {
                    fr: 'Les joueurs peuvent transporter plusieurs extensions de sac en même temps, bien que le bonus d\'extension ne soit accordé qu\'une seule fois.',
                    en: 'Players can carry multiple bag extensions at the same time, although the extension bonus is only granted once.',
                    es: 'Los jugadores pueden llevar múltiples extensiones de bolsa al mismo tiempo, aunque la bonificación de extensión solo se otorga una vez.',
                    de: 'Spieler können mehrere Rucksackerweiterungen gleichzeitig tragen. Es wird jedoch kein zusätzlicher Platz im Rucksack freigeschaltet.'
                },
                default_rne: false,
                default_re: false,
                default_pande: false,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Sol étrange',
                    en: 'Strange Soil',
                    es: 'Suelo extraño',
                    de: 'Eigenartiger Boden'
                },
                description: {
                    fr: 'Le sol sur lequel la ville a été construite est contaminé par des produits chimiques. Cela a un impact sur la qualité de l\'eau du puits et donc aussi sur l\'agriculture...',
                    en: 'The soil on which the city was built is contaminated with chemicals. This has an impact on the quality of the well water and thus also on the agriculture...',
                    es: 'El suelo sobre el que se construyó el pueblo está contaminado con productos químicos muy potentes. Esto afecta a la calidad del agua del pozo y, por ende, también a la agricultura...',
                    de: 'Der Boden, auf dem die Stadt errichtet wurde, ist mit Chemikalien verseucht. Dies hat Einfluss auf die Qualität des Brunnenwassers und damit auch auf die Landwirtschaft...'
                },
                default_rne: false,
                default_re: false,
                default_pande: false,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
        ],
        disabled_rne: false,
        disabled_re: false,
        disabled_pande: false
    },
    {
        name: {
            fr: 'Réserve d\'eau',
            en: 'Water supply',
            es: 'Reserva de agua',
            de: 'Wasservorrat'
        },
        options: [
            {
                name: {
                    fr: 'Normal',
                    en: 'Normal',
                    es: 'Normal',
                    de: 'Normal'
                },
                description: {
                    fr: 'Valeur normale comprise entre 100 et 180. Valeur réduite d\'un tiers si ville Pandémonium. Valeur maximale à 300.',
                    en: '(Whole number between 100 and 180). Value reduced by a third for Pandemonium towns.',
                    es: '(Valor normal entre 100 y 180). Valor reducida en un tercio si es Pandemonio.',
                    de: 'Normale Werte liegen zwischen 100 und 180. Wert ist in Pandämonium-Städten reduziert. Maximum ist 300'
                },
                default_rne: true,
                default_re: true,
                default_pande: false,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Petit',
                    en: 'Low',
                    es: 'Pequeño',
                    de: 'Gering'
                },
                description: {
                    fr: 'Valeur normale comprise entre 100 et 180. Valeur réduite d\'un tiers si ville Pandémonium. Valeur maximale à 300.',
                    en: '(Whole number between 100 and 180). Value reduced by a third for Pandemonium towns.',
                    es: '(Valor normal entre 100 y 180). Valor reducida en un tercio si es Pandemonio.',
                    de: 'Normale Werte liegen zwischen 100 und 180. Wert ist in Pandämonium-Städten reduziert. Maximum ist 300'
                },
                default_rne: false,
                default_re: false,
                default_pande: true,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Valeur propre',
                    en: 'Custom Value',
                    es: 'Valor personalizado',
                    de: 'Eigener Wert'
                },
                description: {
                    fr: 'Valeur normale comprise entre 100 et 180. Valeur réduite d\'un tiers si ville Pandémonium. Valeur maximale à 300.',
                    en: '(Whole number between 100 and 180). Value reduced by a third for Pandemonium towns.',
                    es: '(Valor normal entre 100 y 180). Valor reducida en un tercio si es Pandemonio.',
                    de: 'Normale Werte liegen zwischen 100 und 180. Wert ist in Pandämonium-Städten reduziert. Maximum ist 300'
                },
                default_rne: false,
                default_re: false,
                default_pande: false,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Intervalle personnalisé',
                    en: 'Custom Range',
                    es: 'Rango personalizado',
                    de: 'Eigener Bereich'
                },
                description: {
                    fr: 'Valeur normale comprise entre 100 et 180. Valeur réduite d\'un tiers si ville Pandémonium. Valeur maximale à 300.',
                    en: '(Whole number between 100 and 180). Value reduced by a third for Pandemonium towns.',
                    es: '(Valor normal entre 100 y 180). Valor reducida en un tercio si es Pandemonio.',
                    de: 'Normale Werte liegen zwischen 100 und 180. Wert ist in Pandämonium-Städten reduziert. Maximum ist 300'
                },
                default_rne: false,
                default_re: false,
                default_pande: false,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            }
        ],
        disabled_rne: false,
        disabled_re: false,
        disabled_pande: false
    },
    {
        name: {
            fr: 'Taille de la carte',
            en: 'Map size',
            es: 'Tamaño del mapa',
            de: 'Kartengröße'
        },
        options: [
            {
                name: {
                    fr: 'Petite carte',
                    en: 'Small map',
                    es: 'Mapa pequeño',
                    de: 'Kleine Karte'
                },
                description: {
                    fr: '',
                    en: '',
                    es: '',
                    de: ''
                },
                default_rne: false,
                default_re: true,
                default_pande: true,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Carte normale',
                    en: 'Normal map',
                    es: 'Mapa mediano',
                    de: 'Normale Karte'
                },
                description: {
                    fr: '',
                    en: '',
                    es: '',
                    de: ''
                },
                default_rne: true,
                default_re: false,
                default_pande: false,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            }
        ],
        disabled_rne: false,
        disabled_re: false,
        disabled_pande: false
    },
    {
        name: {
            fr: 'Taille des ruines',
            en: 'Size of the e-ruins',
            es: 'Tamaño de las ruinas',
            de: 'Größe der Begehbaren Ruinen'
        },
        options: [
            {
                name: {
                    fr: 'Un étage',
                    en: '1 floor',
                    es: 'Un piso',
                    de: 'Eine Etage'
                },
                description: {
                    fr: '',
                    en: '',
                    es: '',
                    de: ''
                },
                default_rne: false,
                default_re: false,
                default_pande: false,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Deux étages',
                    en: '2 floors',
                    es: 'Dos pisos',
                    de: 'Zwei Etage'
                },
                description: {
                    fr: '',
                    en: '',
                    es: '',
                    de: ''
                },
                default_rne: false,
                default_re: false,
                default_pande: false,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Trois étages',
                    en: '3 floors',
                    es: 'Tres pisos',
                    de: 'Drei Etage'
                },
                description: {
                    fr: '',
                    en: '',
                    es: '',
                    de: ''
                },
                default_rne: false,
                default_re: false,
                default_pande: false,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            }
        ],
        disabled_rne: true,
        disabled_re: false,
        disabled_pande: false
    },
    {
        name: {
            fr: 'Gestion des attaques',
            en: 'Strength of Attacks',
            es: 'Gestión de los ataques',
            de: 'Stärke der Angriffe'
        },
        options: [
            {
                name: {
                    fr: 'Attaques douces',
                    en: 'Light attacks',
                    es: 'Ataques leves',
                    de: 'Leichte Angriff'
                },
                description: {
                    fr: '',
                    en: '',
                    es: '',
                    de: ''
                },
                default_rne: false,
                default_re: false,
                default_pande: false,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Normal',
                    en: 'Normal',
                    es: 'Normal',
                    de: 'Normal'
                },
                description: {
                    fr: '',
                    en: '',
                    es: '',
                    de: ''
                },
                default_rne: true,
                default_re: true,
                default_pande: true,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            },
            {
                name: {
                    fr: 'Attaques violentes',
                    en: 'Severe attacks',
                    es: 'Ataques severos',
                    de: 'Schwere Angriff'
                },
                description: {
                    fr: '',
                    en: '',
                    es: '',
                    de: ''
                },
                default_rne: false,
                default_re: false,
                default_pande: false,
                disabled_rne: false,
                disabled_re: false,
                disabled_pande: false,
            }
        ],
        disabled_rne: false,
        disabled_re: false,
        disabled_pande: false
    },
];

export interface PrivateTownParams {
    name: I18nLabels;
    options: PrivateTownParamOptions[];
    disabled_rne: boolean;
    disabled_re: boolean;
    disabled_pande: boolean;
}

export interface PrivateTownParamOptions {
    name: I18nLabels;
    description: I18nLabels;
    default_rne: boolean;
    default_re: boolean;
    default_pande: boolean;
    disabled_rne: boolean;
    disabled_re: boolean;
    disabled_pande: boolean;
}
