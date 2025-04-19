import { I18nLabels } from '../../_abstract_model/types/_types';

export const skills: NewHeroSkill[] = [
    {
        name: {
            fr: 'Compétences disponibles',
            en: 'Allgemein verfügbar',
            es: 'Allgemein verfügbar',
            de: 'Allgemein verfügbar'
        },
        levels: [
            {
                name: {
                    fr: 'Habitant',
                    en: 'Citizen',
                    es: 'Habitante',
                    de: 'Einwohner'
                },
                skills: [
                    {
                        fr: '4 places dans le sac à dos',
                        en: '4 places in the rucksack',
                        es: '4 Plätze im Rucksack',
                        de: '4 Plätze im Rucksack'
                    },
                    {
                        fr: '4 places dans le coffre',
                        en: '4 places in the chest',
                        es: '4 Plätze in der Truhe',
                        de: '4 Plätze in der Truhe'
                    },
                    {
                        fr: '10 points de défense durant la Veille',
                        en: '10 defense points during Watch',
                        es: '10 Verteidigung bei der Nachtwache',
                        de: '10 Verteidigung bei der Nachtwache'
                    },
                    {
                        fr: 'Écrire sur le forum de la ville',
                        en: 'Write on the city forum',
                        es: 'Redactar en el foro del pueblo',
                        de: 'Im Stadtforum schreiben'
                    }
                ]
            },
        ]
    },
    {
        name: {
            fr: 'Stratège',
            en: 'Strategist',
            es: 'Sábio',
            de: 'Strategie'
        },
        levels: [
            {
                name: {
                    fr: 'Débutant',
                    en: 'Beginner',
                    es: 'Novato',
                    de: 'Anfänger'
                },
                skills: [
                    {
                        fr: '+10 points de défense durant la veille',
                        en: '+10 defense on the Watch',
                        es: '+10 defensa para guardia centinela',
                        de: '+10 Verteidigung bei der Nachtwache'
                    },
                    {
                        fr: 'Accès au tableau noir',
                        en: 'Access to the Blackboard',
                        es: 'Acceso al tablón de anuncios',
                        de: 'Zugang zum Schwarzen Brett'
                    },
                    {
                        fr: 'Envoyer des messages à tous les citoyens',
                        en: 'Send messages to all citizens',
                        es: 'Envío de mensajes a todos los habitantes',
                        de: 'Versenden von Nachrichten an alle Bürger'
                    },
                    {
                        fr: 'Recommander un chantier',
                        en: 'Recommend a construction site',
                        es: 'Recomendar construcciones',
                        de: 'Konstruktionen empfehlen'
                    }
                ]
            },
            {
                name: {
                    fr: 'Apprenti',
                    en: 'Apprentice',
                    es: 'Aprendiz',
                    de: 'Lehrling'
                },
                skills: [
                    {
                        fr: 'Ration d\'eau au début de la ville',
                        en: 'Water ration at the start of town',
                        es: 'Ración de agua al principio del pueblo',
                        de: 'Ration Wasser beim Start der Stadt'
                    },
                    {
                        fr: 'Appareil photo d\'avant-guerre (2 charges)',
                        en: 'Pre-War Camera (2 charges)',
                        es: 'Cámara de la post-guerra (2 cargas)',
                        de: 'Kamera aus Vorkriegstagen (2 Ladungen)'
                    },
                    {
                        fr: 'Écrire 1 message de forum anonyme',
                        en: 'Write 1 anonymous forum message',
                        es: '1 mensaje de foro anónimo',
                        de: '1 anonymen Foren-Post verfassen'
                    }
                ]
            },
            {
                name: {
                    fr: 'Expert',
                    en: 'Expert',
                    es: 'Experto',
                    de: 'Experte'
                },
                pointsNeeded: 40,
                skills: [
                    {
                        fr: 'Gardien professionnel : vos chances de survie durant la Veille diminuent plus lentement',
                        en: 'Pro-watchman: Your chances of surviving on the Watch decrease more slowly',
                        es: 'Centinela Experto: la penalización de vigilias sucesivas disminuye más lentamente.',
                        de: 'Profi-Wächter: Deine Überlebenschancen bei der Nachtwache reduzieren sich langsamer'
                    },
                    {
                        fr: 'Appareil photo d\'avant-guerre (3 charges)',
                        en: 'Pre-War Camera (3 charges)',
                        es: 'Cámara de la post-guerra (3 cargas)',
                        de: 'Kamera aus Vorkriegstagen (3 Ladungen)'
                    },
                    {
                        fr: 'Écrire des messages de forum anonymes illimités',
                        en: 'Write unlimited anonymous forum messages',
                        es: 'Escribir mensajes anónimos ilimitados en el foro',
                        de: 'Unbegrenzt anonyme Foren-Posts verfassen'
                    },
                    {
                        fr: 'Une plainte supplémentaire par jour possible',
                        en: 'One additional complaint per day possible',
                        es: 'Posibilidad de enviar una denuncia adicional al día',
                        de: 'Eine zusätzliche Beschwerde pro Tag möglich'
                    }
                ]
            },
            {
                name: {
                    fr: 'Élite',
                    en: 'Master',
                    es: 'Elite',
                    de: 'Meister'
                },
                pointsNeeded: 80,
                skills: [
                    {
                        fr: '2% de chances supplémentaires de survie pendant la Veille',
                        en: '',
                        es: '',
                        de: ''
                    },
                    {
                        fr: 'Écrire des messages anonymes illimités',
                        en: '',
                        es: '',
                        de: ''
                    },
                    {
                        fr: 'Appareil photo d\'avant-guerre (4 charges)',
                        en: '',
                        es: '',
                        de: ''
                    },
                    {
                        fr: 'Vous pouvez voler chez vos voisins même si ils sont en ville',
                        en: '',
                        es: '',
                        de: ''
                    }
                ]
            }
        ]
    },
    {
        name: {
            fr: 'Universitaire',
            en: 'University',
            es: 'Universitario',
            de: 'Umsicht'
        },
        levels: [
            {
                name: {
                    fr: 'Débutant',
                    en: 'Beginner',
                    es: 'Novato',
                    de: 'Anfänger'
                },
                skills: [
                    {
                        fr: 'Sauvetage d\'un autre citoyen (distance : 1 km)',
                        en: 'Rescue another citizen (distance: 1km)',
                        es: 'Rescate de otro habitante (Distancia: 1km)',
                        de: 'Rettung eines anderen Bürgers (Distanz: 1km)'
                    },
                    {
                        fr: 'Vaincre la mort (déshydratation et infection)',
                        en: 'Cheat Death (dehydration & infection)',
                        es: 'Vencer a la muerte (deshidratación e infección)',
                        de: 'Den Tod besiegen (Dehydration & Infektion)'
                    },
                    {
                        fr: 'Falsification des entrées de registre (max. 1)',
                        en: 'Falsify registry entries (max. 1)',
                        es: 'Manipulación de entradas de registro (max. 1)',
                        de: 'Manipulieren von Registereinträgen (max. 1)'
                    }
                ]
            },
            {
                name: {
                    fr: 'Apprenti',
                    en: 'Apprentice',
                    es: 'Aprendiz',
                    de: 'Lehrling'
                },
                skills: [
                    {
                        fr: 'Sauvetage d\'un autre citoyen (distance : 2 km)',
                        en: 'Rescue another citizen (distance: 2km)',
                        es: 'Rescate de otro habitante (Distancia: 2km)',
                        de: 'Rettung eines anderen Bürgers (Distanz: 2km)'
                    },
                    {
                        fr: 'Vaincre la mort (protection supplémentaire contre la dépendance)',
                        en: 'Cheat Death (additional protection against drug addiction)',
                        es: 'Vencer a la muerte (protección adicional contra la addicción)',
                        de: 'Den Tod besiegen (zusätzlicher Schutz vor Drogenentzug)'
                    },
                    {
                        fr: 'Falsification des entrées de registre (max. 2)',
                        en: 'Falsify registry entries (max. 2)',
                        es: 'Manipulación de entradas de registro (max. 2)',
                        de: 'Manipulieren von Registereinträgen (max. 2)'
                    }
                ]
            },
            {
                name: {
                    fr: 'Expert',
                    en: 'Expert',
                    es: 'Experto',
                    de: 'Experte'
                },
                pointsNeeded: 40,
                skills: [
                    {
                        fr: 'Sauvetage d\'un autre citoyen (distance : 3 km)',
                        en: 'Rescue another citizen (distance: 3km)',
                        es: 'Rescate de otro habitante (Distancia: 3km)',
                        de: 'Rettung eines anderen Bürgers (Distanz: 3km)'
                    },
                    {
                        fr: 'Vaincre la mort (protection supplémentaire contre la famine en tant que goule)',
                        en: 'Cheat Death (additional protection against starvation as a ghoul)',
                        es: 'Den Tod besiegen (zusätzlicher Schutz vor Hungertod als Ghul)',
                        de: 'Den Tod besiegen (zusätzlicher Schutz vor Hungertod als Ghul)'
                    },
                    {
                        fr: 'Falsification des entrées de registre (max. 3)',
                        en: 'Falsify registry entries (max. 3)',
                        es: 'Manipulación de entradas de registro (max. 3)',
                        de: 'Manipulieren von Registereinträgen (max. 3)'
                    },
                    {
                        fr: 'Une place supplémentaire dans votre coffre',
                        en: 'An additional space in your chest',
                        es: 'Un espacio extra en el baúl',
                        de: 'Ein zusätzlicher Platz in der Truhe'
                    }
                ]
            },
            {
                name: {
                    fr: 'Élite',
                    en: 'Master',
                    es: 'Elite',
                    de: 'Meister'
                },
                pointsNeeded: 80,
                skills: [
                    {
                        fr: 'Vaincre la mort (soigne la terreur, gueule de bois et convalescence)',
                        en: '',
                        es: '',
                        de: ''
                    },
                    {
                        fr: 'Soins rudimentaires pour vos voisins',
                        en: '',
                        es: '',
                        de: ''
                    },
                    {
                        fr: 'Supprimer des entrées du registre (max. 1)',
                        en: '',
                        es: '',
                        de: ''
                    }
                ]
            }
        ]
    },
    {
        name: {
            fr: 'Préparé',
            en: 'Prepared',
            es: 'Planificador',
            de: 'Planung'
        },
        levels: [
            {
                name: {
                    fr: 'Débutant',
                    en: 'Beginner',
                    es: 'Novato',
                    de: 'Anfänger'
                },
                skills: [
                    {
                        fr: '1 point de contrôle de zone supplémentaire si vous êtes "clair"',
                        en: '1 additional zone control point if you are "clean"',
                        es: '1 punto de control de zona adicional si estas "limpio"',
                        de: '1 zusätzlicher Zonenkontrollpunkt wenn "clean"'
                    },
                    {
                        fr: 'Clairvoyance : Vous découvrez à quel point un certain citoyen joue activement dans votre ville.',
                        en: 'Clairvoyance: You learn how actively a certain citizen in your town is participating.',
                        es: 'Clarividencia: Averigua lo activo que es un determinado habitante en tu pueblo.',
                        de: 'Hellseherei: Du erfährst, wie aktiv ein bestimmter Bürger in deiner Stadt spielt.'
                    },
                    {
                        fr: 'Doggy-bag au début de la ville',
                        en: 'Doggybag at the start of town',
                        es: 'Doggy-bag al principio del pueblo',
                        de: 'Doggybag beim Start der Stadt'
                    }
                ]
            },
            {
                name: {
                    fr: 'Apprenti',
                    en: 'Apprentice',
                    es: 'Aprendiz',
                    de: 'Lehrling'
                },
                skills: [
                    {
                        fr: '1 point de contrôle de zone supplémentaire dans l\'Outre-Monde',
                        en: '1 additional zone control point in the World-Beyond',
                        es: '1 punto de control de zona adicional',
                        de: '1 zusätzlicher Zonenkontrollpunkt in der Außenwelt'
                    },
                    {
                        fr: 'Omniscience : Comme la Clairvoyance, sauf que maintenant vous avez un aperçu de l\'activité de tous les citoyens',
                        en: 'Omniscience: like Clairvoyance, except that you now get an overview of the activity of all town’s citizens',
                        es: 'Omnisciencia: Como la clarividencia, salvo que ahora obtienes una visión general de la actividad de todos los habitantes del pueblo.',
                        de: 'Allwissenheit: Wie Hellseherei, außer, dass du jetzt eine Übersicht zur Aktivität aller Stadteinwohner bekommst'
                    },
                    {
                        fr: 'Réserves d’un citoyen avisé au début de la ville',
                        en: 'Shrewd Citizen\'s Stash at the start of town',
                        es: 'Suministros de un habitante prudente al principio del pueblo',
                        de: 'Vorräte eines umsichtigen Bürgers'
                    },
                    {
                        fr: 'Boîte à pharmacie au début de la ville',
                        en: 'First aid kit at the start of town',
                        es: 'Estuche de medicamentos al principio del pueblo',
                        de: 'Erste Hilfe Tasche beim Start der Stadt'
                    }
                ]
            },
            {
                name: {
                    fr: 'Expert',
                    en: 'Expert',
                    es: 'Experto',
                    de: 'Experte'
                },
                pointsNeeded: 40,
                skills: [
                    {
                        fr: '1 point de contrôle de zone supplémentaire si non "assoiffé" ou "déshydraté"',
                        en: '1 additional zone control point if you are not "thirsty" or "dehydrated"',
                        es: '1 punto de control de zona adicional si no estas «sediento» o «deshidratado»',
                        de: '1 zusätzlicher Zonenkontrollpunkt wenn nicht "durstig" oder "dehydriert"'
                    },
                    {
                        fr: 'Plan de chantier commun au début de la ville',
                        en: 'Common blueprint at the start of the city',
                        es: 'Plan de construcción común al principio del pueblo',
                        de: 'Gewöhnlicher Bauplan beim Start der Stadt'
                    },
                    {
                        fr: 'Boîte-déjeuner (au lieu de Doggybag) au début de la ville',
                        en: 'Lunch Box (instead of Doggybag) at the start of the city',
                        es: 'Fiambrera (en lugar de doggybag) al principio del pueblo',
                        de: 'Lunchbox (statt Doggybag) beim Start der Stadt'
                    }
                ]
            },
            {
                name: {
                    fr: 'Élite',
                    en: 'Master',
                    es: 'Elite',
                    de: 'Meister'
                },
                pointsNeeded: 80,
                skills: [
                    {
                        fr: '1 point de contrôle supplémentaire si pas "ivre" ou "gueule de bois"',
                        en: '1 additional zone control point if you are not "drunk" or "hungover"',
                        es: '1 punto de control de zona adicional si no estas «borracho» o «resacoso»',
                        de: '1 zusätzlicher Zonenkontrollpunkt wenn nicht "betrunken" oder "verkatert"'
                    },
                    {
                        fr: 'Sacoche usée (au lieu d\'un plan) au début de la ville',
                        en: 'Worn Leather Bag (instead of a blueprint) at the start of the city',
                        es: 'Maletín usado (en lugar del plano de construcción) al principio del pueblo',
                        de: 'Abgenutzte Kuriertasche (statt Bauplan) beim Start der Stadt'
                    },
                    {
                        fr: 'Étui pour violoncelle au début de la ville',
                        en: 'Cello case at the start of the city',
                        es: 'Estuche para cello al principio del pueblo',
                        de: 'Cellokasten beim Start der Stadt'
                    }
                ]
            }
        ]
    },
    {
        name: {
            fr: 'Endurant',
            en: 'Enduring',
            es: 'Exuberante',
            de: 'Eifer'
        },
        levels: [
            {
                name: {
                    fr: 'Débutant',
                    en: 'Beginner',
                    es: 'Novato',
                    de: 'Anfänger'
                },
                skills: [
                    {
                        fr: 'Une place supplémentaire dans votre sac à dos',
                        en: 'An additional space in your rucksack',
                        es: 'Un espacio extra en la mochila',
                        de: 'Ein zusätzlicher Platz im Rucksack'
                    },
                    {
                        fr: 'Une place supplémentaire dans votre coffre',
                        en: 'An additional space in your chest',
                        es: 'Un espacio extra en el baúl',
                        de: 'Ein zusätzlicher Platz in der Truhe'
                    },
                    {
                        fr: 'Uppercut sauvage : permet de tuer 2 zombies',
                        en: 'Vicious Uppercut : allows you to kill 2 zombies',
                        es: 'Uppercut salvaje',
                        de: 'Wildstyle Uppercut : ermöglicht das Töten von 2 Zombies'
                    },
                    {
                        fr: 'Second Souffle (4 PE)',
                        en: 'Second Wind (4 EP)',
                        es: 'segundo aliento (4 PE)',
                        de: 'Zweite Lunge (4 EP)'
                    }
                ]
            },
            {
                name: {
                    fr: 'Apprenti',
                    en: 'Apprentice',
                    es: 'Aprendiz',
                    de: 'Lehrling'
                },
                skills: [
                    {
                        fr: 'Une autre place supplémentaire dans votre sac à dos',
                        en: 'Another additional space in your rucksack',
                        es: 'Otro espacio adicional en la mochila',
                        de: 'Ein weiterer zusätzlicher Platz im Rucksack'
                    },
                    {
                        fr: 'Une autre place supplémentaire dans votre coffre',
                        en: 'Another additional space in your chest',
                        es: 'Otro espacio adicional en el baúl',
                        de: 'Ein weiterer zusätzlicher Platz in der Truhe'
                    },
                    {
                        fr: 'Uppercut sauvage amélioré : permet de tuer 3 zombies',
                        en: 'Improved Vicious Uppercut : allows you to kill 3 zombies',
                        es: 'Mejora Uppercut salvaje (3 zombis)',
                        de: 'Verbesserung Wildstyle Uppercut : ermöglicht das Töten von 3 Zombies'
                    },
                    {
                        fr: 'Amélioration du Second Souffle (6 PE)',
                        en: 'Improved Second Wind (6 EP)',
                        es: 'Mejora Segundo aliento (6 PE)',
                        de: 'Verbesserung Zweite Lunge (6 EP)'
                    }
                ]
            },
            {
                name: {
                    fr: 'Expert',
                    en: 'Expert',
                    es: 'Experto',
                    de: 'Experte'
                },
                pointsNeeded: 40,
                skills: [
                    {
                        fr: '1 objet dans votre coffre est caché',
                        en: '1 item in your chest is hidden',
                        es: '1 objeto oculto en tu baúl',
                        de: '1 Gegenstand in der Truhe ist versteckt'
                    },
                    {
                        fr: 'Uppercut sauvage amélioré : permet de tuer 4 zombies',
                        en: 'Improved Vicious Uppercut : allows you to kill 4 zombies',
                        es: 'Mejora Uppercut salvaje (4 zombis)',
                        de: 'Verbesserung Wildstyle Uppercut : ermöglicht das Töten von 4 Zombies'
                    },
                    {
                        fr: 'Amélioration du Second Souffle (2 PA, 6 PE)',
                        en: 'Improved Second Wind (2 AP, 6 EP)',
                        es: 'Mejora Segundo aliento (2 PA, 6 PE)',
                        de: 'Verbesserung Zweite Lunge (2 AP, 6 EP)'
                    },
                    {
                        fr: '15 O² supplémentaires dans les ruines explorables',
                        en: '15 extra O² in explorable ruins',
                        es: '15 O² extra en las ruinas explorables',
                        de: '15 Extra-O² in begehbaren Ruinen'
                    }
                ]
            },
            {
                name: {
                    fr: 'Élite',
                    en: 'Master',
                    es: 'Elite',
                    de: 'Meister'
                },
                pointsNeeded: 80,
                skills: [
                    {
                        fr: 'Une autre place supplémentaire dans votre sac à dos',
                        en: 'Another additional space in your rucksack',
                        es: 'Otro espacio adicional en la mochila',
                        de: 'Ein weiterer zusätzlicher Platz im Rucksack'
                    },
                    {
                        fr: 'Contrôle de zone temporaire de 30 secondes pour l\'Uppercut sauvage',
                        en: '30 second temporary zone control through Vicious Uppercut',
                        es: '30 segundos de control temporal de la zona mediante Uppercut salvaje',
                        de: '30 Sekunden temporäre Zonencontrolle durch Wildstyle Uppercut'
                    },
                    {
                        fr: 'Amélioration du Second Souffle (4 PA, 6 PE)',
                        en: 'Improved Second Wind (4 AP, 6 EP)',
                        es: 'Majora Segundo aliento (4 PA, 6 PE)',
                        de: 'Verbesserung Zweite Lunge (4 AP, 6 EP)'
                    },
                    {
                        fr: '30 O² supplémentaires dans les ruines explorables',
                        en: '30 extra O² in explorable ruins',
                        es: '30 O² extra en las ruinas explorables',
                        de: '30 Extra-O² in begehbaren Ruinen'
                    }
                ]
            }
        ]
    },
    {
        name: {
            fr: 'Reclus',
            en: 'Reclusive',
            es: 'Recluso',
            de: 'Ruhe'
        },
        levels: [
            {
                name: {
                    fr: 'Débutant',
                    en: 'Beginner',
                    es: 'Novato',
                    de: 'Anfänger'
                },
                skills: [
                    {
                        fr: 'Retour du Héros (9 km)',
                        en: 'Heroic Return (9km)',
                        es: 'Retorno del héroe (9km)',
                        de: 'Rückkehr des Helden (9km)'
                    },
                    {
                        fr: 'Camping professionnel (limité à 6 campings)',
                        en: 'Pro-Camper (limited to 6 campings)',
                        es: 'Campista experto (limitado a 6)',
                        de: 'Proficamper (auf 6 Campings begrenzt)'
                    },
                    {
                        fr: 'Trouvaille',
                        en: 'Seeker',
                        es: 'Hallazgo',
                        de: 'Fund'
                    }
                ]
            },
            {
                name: {
                    fr: 'Apprenti',
                    en: 'Apprentice',
                    es: 'Aprendiz',
                    de: 'Lehrling'
                },
                skills: [
                    {
                        fr: 'Retour du Héros (11 km)',
                        en: 'Heroic Return (11km)',
                        es: 'Retorno del héroe (11km)',
                        de: 'Rückkehr des Helden (11km)'
                    },
                    {
                        fr: 'Camping professionnel (limité à 8 campings)',
                        en: 'Pro-Camper (limited to 8 campings)',
                        es: 'Campista experto (limitado a 8)',
                        de: 'Proficamper (auf 8 Campings begrenzt)'
                    },
                    {
                        fr: 'Jolie trouvaille (remplace la trouvaille normale)',
                        en: 'Lucky Find (replaces Seeker)',
                        es: 'Buen hallazgo (sustituye al hallazgo)',
                        de: 'Schönes Fundstück (ersetzt Fund)'
                    },
                    {
                        fr: 'Si vous êtes banni(e) au jour 3 ou après, vous recevez automatiquement du poison pour vous donner l\'opportunité de vous venger... Et oui, il ne fallait pas vous embêter !',
                        en: 'If you are shunned on day 3 or later, you will automatically receive 2 vials of poison with which to exact your revenge... Yeah, they\'d better not **** with you now!',
                        es: 'Si te destierran el día 3 o posteriores, recibirás automáticamente dos frascos de veneno para que así tengas la oportunidad de vengarte... Y sí, ¡no deberían haberse metido contigo!',
                        de: 'Solltest du am dritten Tag oder an einem späteren Zeitpunkt verbannt werden, bekommst du automatisch etwas Gift geschenkt, das du nach Belieben einsetzen kannst... Tja, man hätte dich besser nicht ärgern sollen!'
                    }
                ]
            },
            {
                name: {
                    fr: 'Expert',
                    en: 'Expert',
                    es: 'Experto',
                    de: 'Experte'
                },
                pointsNeeded: 40,
                skills: [
                    {
                        fr: 'Retour du Héros (13 km)',
                        en: 'Heroic Return (13km)',
                        es: 'Retorno del héroe (13km)',
                        de: 'Rückkehr des Helden (13km)'
                    },
                    {
                        fr: 'Impressionnante trouvaille (remplace Jolie trouvaille)',
                        en: 'Impressive Find (replace Lucky Find)',
                        es: 'Impresionante hallazgo (sustituye a Buen hallazgo)',
                        de: 'Beeindruckendes Fundstück (ersetzt Schönes Fundstück)'
                    },
                    {
                        fr: 'Si vous êtes banni(e) au jour 3 ou après, vous recevez automatiquement 2 fioles de poison ainsi qu\'une Toxine pour vous donner l\'opportunité de vous venger... Et oui, il ne fallait pas vous embêter !',
                        en: 'If you are shunned on day 3 or later, you will automatically receive 2 vials of poison and one Toxin with which to exact your revenge... Yeah, they\'d better not **** with you now!',
                        es: 'Si te destierran el día 3 o posteriores, recibirás automáticamente dos frascos de veneno y una Toxina para que así tengas la oportunidad de vengarte... Y sí, ¡no deberían haberse metido contigo!',
                        de: 'Solltest du am dritten Tag oder an einem späteren Zeitpunkt verbannt werden, bekommst du automatisch etwas Toxin geschenkt, das du nach Belieben einsetzen kannst... Tja, man hätte dich besser nicht ärgern sollen!'
                    },
                    {
                        fr: '1 recherche dans la poubelle de la ville supplémentaire par jour',
                        en: '1 additional garbage rummaging per day',
                        es: '1 Escarbo en los desechos del pueblo adicional al día',
                        de: '1 zusätzliche Mülldurchwühlung pro Tag'
                    }
                ]
            },
            {
                name: {
                    fr: 'Élite',
                    en: 'Master',
                    es: 'Elite',
                    de: 'Meister'
                },
                pointsNeeded: 80,
                skills: [
                    {
                        fr: 'Retour du Héros (15 km)',
                        en: 'Heroic Return (15km)',
                        es: 'Retorno del héroe (15km)',
                        de: 'Rückkehr des Helden (15km)'
                    },
                    {
                        fr: 'Permet jusqu\'à 99% de chances de survie en camping',
                        en: 'Allows survival chance to be up to 99% when camping',
                        es: 'Permite alcanzar un maximo de 99% de probabilidad de supervivencia al acampar',
                        de: 'Ermöglicht Überlebenschance beim Camping von bis zu 99%'
                    },
                    {
                        fr: 'Incroyable trouvaille (remplace Impressionnante trouvaille)',
                        en: 'Incredible Find (replaces Impressive Find)',
                        es: 'Asombroso hallazgo (sustituye a Impresionante hallazgo)',
                        de: 'Erstaunliches Fundstück (ersetzt Beeindruckendes Fundstück)'
                    }
                ]
            }
        ]
    }
];

export interface NewHeroSkill {
    name: I18nLabels;
    levels: NewHeroSkillLevel[];
}

export interface NewHeroSkillLevel {
    skills: I18nLabels[];
    name: I18nLabels;
    pointsNeeded?: number;
}
