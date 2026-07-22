import type { ParamCategory } from '../types';

//////////////////////////////////////////////
// La liste des paramètres de l'application //
//////////////////////////////////////////////
export const params_categories: ParamCategory[] = [
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
                id: 'synchronize_external_tools',
                label: {
                    en: 'External tools update',
                    fr: 'Mise à jour des outils externes',
                    de: 'Aktualisierung externer Tools',
                    es: 'Actualización de herramientas externas'
                },
                children: [
                    {
                        id: 'update_mho',
                        label: {
                            en: 'Update MyHordes Optimiser',
                            fr: 'Mettre à jour MyHordes Optimiser',
                            de: 'MyHordes Optimiser Aktualisieren',
                            es: 'Actualizar MyHordes Optimiser'
                        },
                        children: [
                            {
                                id: 'update_mho_killed_zombies',
                                label: {
                                    en: 'Record the number of zombies killed',
                                    fr: 'Enregistrer le nombre de zombies tués',
                                    de: 'Notieren Sie die Anzahl der getöteten Zombies',
                                    es: 'Registrar el número de zombis asesinados'
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
                                id: 'update_mho_devastated',
                                label: {
                                    en: 'Zone update even after the town is in Chaos',
                                    fr: 'Mise à jour même quand la ville est en Chaos',
                                    de: 'Zonen-Update, nachdem die Stadt bereits zerstört wurde',
                                    es: 'Actualización de zona cuando los pueblo está sumida en el caos'
                                },
                            },
                            {
                                id: 'update_mho_actions',
                                label: {
                                    en: 'Heroic Actions',
                                    fr: 'Actions héroïques',
                                    de: 'Heldentaten',
                                    es: 'Acciones heroicas'
                                },
                            },
                            {
                                id: 'update_mho_house',
                                label: {
                                    en: 'Home upgrades',
                                    fr: 'Améliorations de la maison',
                                    de: 'Hausverbesserungen',
                                    es: 'Mejoras de la casa'
                                },
                                help: {
                                    en: 'A new button will be placed on the improvements page',
                                    fr: 'Un nouveau bouton sera placé sur la page des améliorations',
                                    de: 'Auf der Verbesserungsseite wird eine neue Schaltfläche platziert',
                                    es: 'Se colocará un nuevo botón en la página de mejoras.'
                                },
                            },
                            {
                                id: 'update_mho_bags',
                                label: {
                                    en: 'Details of my rucksack and those of my escort',
                                    fr: 'Détail de mon sac et de ceux de mon escorte',
                                    de: 'Details meines Inventars und des Inventars meiner Eskorte',
                                    es: 'Detalles de mi mochila y las de mi escolta'
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
                                id: 'update_mho_status',
                                label: {
                                    en: 'Status',
                                    fr: 'États',
                                    de: 'Status',
                                    es: 'Estatus'
                                },
                            },
                            {
                                id: 'update_mho_digs',
                                label: {
                                    en: 'Record successful searches',
                                    fr: 'Enregistrer les fouilles réussies',
                                    de: 'Zeichnen Sie erfolgreiche Ausgrabungen auf',
                                    es: 'Grabar excavaciones exitosas'
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
                                id: 'refresh_mho_after_update',
                                label: {
                                    en: 'Refresh tab after update',
                                    fr: 'Rafraîchir l\'onglet après la mise à jour',
                                    de: 'Registerkarte „Aktualisieren“ nach dem Update',
                                    es: 'Actualizar pestaña después de la actualización'
                                },
                                help: {
                                    en: 'Will only work if the page is opened in a tab in the same browser window',
                                    fr: 'Ne fonctionnera que si la page est ouverte dans un onglet dans la même fenêtre du navigateur',
                                    de: 'Funktioniert nur, wenn die Seite in einem Tab im selben Browserfenster geöffnet wird',
                                    es: 'Solo funcionará si la página se abre en una pestaña en la misma ventana del navegador.'
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
                        id: 'update_gh',
                        label: {
                            en: 'Update Gest’Hordes',
                            fr: 'Mettre à jour Gest\'Hordes',
                            de: 'Gest’Hordes aktualisieren',
                            es: 'Actualizar Gest\'Hordes'
                        },
                        children: [
                            {
                                id: 'update_gh_killed_zombies',
                                label: {
                                    en: 'Record the number of zombies killed',
                                    fr: 'Enregistrer le nombre de zombies tués',
                                    de: 'Notieren Sie die Anzahl der getöteten Zombies',
                                    es: 'Registrar el número de zombis asesinados'
                                },
                            },
                            {
                                id: 'update_gh_devastated',
                                label: {
                                    en: 'Zone update even after the town is in Chaos',
                                    fr: 'Mise à jour quand la ville est en Chaos',
                                    de: 'Zonen-Update, nachdem die Stadt bereits zerstört wurde',
                                    es: 'Actualización de zona cuando los pueblo está sumida en el caos'
                                },
                            },
                            {
                                id: 'update_gh_ah',
                                label: {
                                    en: 'Heroic Actions',
                                    fr: 'Actions héroïques',
                                    de: 'Heldentaten',
                                    es: 'Acciones heroicas'
                                },
                            },
                            {
                                id: 'update_gh_amelios',
                                label: {
                                    en: 'Home upgrades',
                                    fr: 'Améliorations de la maison',
                                    de: 'Hausverbesserungen',
                                    es: 'Mejoras de la casa'
                                },
                                help: {
                                    en: 'A new button will be placed on the improvements page',
                                    fr: 'Un nouveau bouton sera placé sur la page des améliorations',
                                    de: 'Auf der Verbesserungsseite wird eine neue Schaltfläche platziert',
                                    es: 'Se colocará un nuevo botón en la página de mejoras.'
                                },
                            },
                            {
                                id: 'update_gh_status',
                                label: {
                                    en: 'Status',
                                    fr: 'États',
                                    de: 'Status',
                                    es: 'Estatus'
                                },
                            },
                            {
                                id: 'refresh_gh_after_update',
                                label: {
                                    en: 'Refresh tab after update',
                                    fr: 'Rafraîchir l\'onglet après la mise à jour',
                                    de: 'Registerkarte „Aktualisieren“ nach dem Update',
                                    es: 'Actualizar pestaña después de la actualización'
                                },
                                help: {
                                    en: 'Will only work if the page is opened in a tab in the same browser window',
                                    fr: 'Ne fonctionnera que si la page est ouverte dans un onglet dans la même fenêtre du navigateur',
                                    de: 'Funktioniert nur, wenn die Seite in einem Tab im selben Browserfenster geöffnet wird',
                                    es: 'Solo funcionará si la página se abre en una pestaña en la misma ventana del navegador.'
                                }
                            }
                        ]
                    },
                    {
                        id: 'update_fata',
                        label: {
                            en: 'Update Fata Morgana',
                            fr: 'Mettre à jour Fata Morgana',
                            de: 'Fata Morgana aktualisieren',
                            es: 'Actualizar Fata Morgana'
                        },
                        children: [
                            {
                                id: 'update_fata_killed_zombies',
                                label: {
                                    en: 'Record the number of zombies killed',
                                    fr: 'Enregistrer le nombre de zombies tués',
                                    de: 'Notieren Sie die Anzahl der getöteten Zombies',
                                    es: 'Registrar el número de zombis asesinados'
                                },
                            },
                            {
                                id: 'update_fata_job_markers',
                                label: {
                                    en: 'Updates information from job markers',
                                    fr: 'Met à jour les informations issues des marqueurs de métiers',
                                    de: 'Aktualisiert Informationen von Jobmarkierungen',
                                    es: 'Actualiza la información de los marcadores de trabajo.'
                                },
                            },
                            {
                                id: 'update_fata_devastated',
                                label: {
                                    en: 'Update even when the town is in Chaos or when the quota is exceeded',
                                    fr: 'Mise à jour même quand la ville est en Chaos ou quand le quota est dépassé',
                                    de: 'Aktualisierung auch dann, wenn in der Stadt Chaos herrscht oder das Kontingent überschritten wird',
                                    es: 'Actualizar incluso cuando la ciudad esté en Caos o cuando se exceda la cuota'
                                },
                            },
                            {
                                id: 'refresh_fm_after_update',
                                label: {
                                    en: 'Refresh tab after update',
                                    fr: 'Rafraîchir l\'onglet après la mise à jour',
                                    de: 'Registerkarte „Aktualisieren“ nach dem Update',
                                    es: 'Actualizar pestaña después de la actualización'
                                },
                                help: {
                                    en: 'Will only work if the page is opened in a tab in the same browser window',
                                    fr: 'Ne fonctionnera que si la page est ouverte dans un onglet dans la même fenêtre du navigateur',
                                    de: 'Funktioniert nur, wenn die Seite in einem Tab im selben Browserfenster geöffnet wird',
                                    es: 'Solo funcionará si la página se abre en una pestaña en la misma ventana del navegador.'
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
                id: 'display_more_informations_from_mho',
                label: {
                    en: 'Shows miscellaneous information from MyHordes Optimizer',
                    fr: 'Affiche des informations diverses issues de MyHordes Optimizer',
                    de: 'Zeigt Verschiedene Informationen von MyHordes Optimizer',
                    es: 'Muestra Información miscelánea de MyHordes Optimizer'
                },
                help: {
                    en: 'Displays the note of the box, if it exists.',
                    fr: 'Affiche la note de la case, si elle existe.',
                    de: 'Zeigt die Notiz der Box an, falls vorhanden.',
                    es: 'Muestra la nota de la caja, si existe.'
                },
            },
            {
                id: 'display_my_expeditions',
                label: {
                    en: 'Shows details of the MyHordes Optimizer expeditions I am registered for',
                    fr: 'Affiche les détails des expéditions de MyHordes Optimizer auxquelles je suis inscrit',
                    de: 'Zeigt Details zu MyHordes Optimizer-Expeditionen an, für die ich registriert bin',
                    es: 'Muestra los detalles de las expediciones de MyHordes Optimizer a las que estoy registrado'
                },
            },
            {
                id: 'display_external_links',
                label: {
                    en: 'Shows links to external profiles and towns',
                    fr: 'Affiche des liens vers les profils et villes externes',
                    de: 'Zeigt Links zu externen Profilen und Städten an',
                    es: 'Muestra enlaces a perfiles y ciudades externos'
                },
            }
        ]
    },
    {
        id: 'additionnal_info',
        label: {
            en: 'Further information',
            fr: 'Informations complémentaires',
            de: 'Weitere Informationen',
            es: 'Informaciones complementarias'
        },
        params: [
            {
                id: 'enhanced_tooltips',
                label: {
                    en: 'Detailed tooltips',
                    fr: 'Tooltips détaillés',
                    de: 'Detaillierte Tooltips',
                    es: 'Tooltips detallados'
                },
                children: [
                    {
                        id: 'enhanced_tooltips_items',
                        label: {
                            en: 'Items',
                            fr: 'Objets',
                            de: 'Gegenstände',
                            es: 'Objetos'
                        },
                        children: [
                            {
                                id: 'enhanced_tooltips_item_quantities',
                                label: {
                                    en: 'Bank quantity & wishlist',
                                    fr: 'Quantité en banque & liste de courses',
                                    de: 'Bankbestand & Wunschzettel',
                                    es: 'Cantidad en banco & lista de deseos'
                                },
                            },
                            {
                                id: 'enhanced_tooltips_item_properties',
                                label: {
                                    en: 'Properties',
                                    fr: 'Propriétés',
                                    de: 'Eigenschaften',
                                    es: 'Propiedades'
                                },
                            },
                            {
                                id: 'enhanced_tooltips_item_actions',
                                label: {
                                    en: 'Actions',
                                    fr: 'Actions',
                                    de: 'Aktionen',
                                    es: 'Acciones'
                                },
                            },
                            {
                                id: 'enhanced_tooltips_item_recipes',
                                label: {
                                    en: 'Recipes',
                                    fr: 'Recettes',
                                    de: 'Rezepte',
                                    es: 'Transformaciones'
                                },
                            },
                            {
                                id: 'enhanced_tooltips_item_translations',
                                label: {
                                    en: 'Translations',
                                    fr: 'Traductions',
                                    de: 'Übersetzungen',
                                    es: 'Traducciones'
                                },
                            },
                        ]
                    },
                    {
                        id: 'enhanced_tooltips_statuses',
                        label: {
                            en: 'Statuses',
                            fr: 'États',
                            de: 'Status',
                            es: 'Estatus'
                        },
                    },
                ]
            },
            {
                id: 'display_wishlist',
                label: {
                    en: 'Wishlist in interface',
                    fr: 'Liste de courses dans l\'interface',
                    de: 'Wunschzettel in der Benutzeroberfläche',
                    es: 'Lista de deseos en la interfaz'
                },
            },
            {
                id: 'display_estimations_on_watchtower',
                label: {
                    en: 'Estimates saved on the watchtower page',
                    fr: 'Estimations enregistrées sur la page de la tour de guet',
                    de: 'Schätzungen, die auf der Wachturm aufgezeichnet wurden',
                    es: 'Estimaciones registradas en la página de la torre de vigilancia'
                },
            },
            {
                id: 'display_camping_predict',
                label: {
                    en: 'Camping predictions in area information',
                    fr: 'Prédictions de camping dans les informations du secteur',
                    de: 'Campingvorhersagen in Gebietsinformationen',
                    es: 'Predicciones para acampar en la información del área'
                },
            },
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
                id: 'sort_and_filter',
                label: {
                    en: 'Sorts and filters',
                    fr: 'Tris et filtres',
                    de: 'Sortierungen und Filter',
                    es: 'Ordena y filtra'
                },
                children: [
                    {
                        id: 'display_search_fields',
                        label: {
                            en: 'Additional filters',
                            fr: 'Filtres supplémentaires',
                            de: 'Zusätzliche Filter',
                            es: 'Filtros adicionales'
                        },
                        children: [
                            {
                                id: 'hide_completed_buildings_field',
                                label: {
                                    en: 'Hide completed projects',
                                    fr: 'Masquer les chantiers terminés',
                                    de: 'Abgeschlossene Bauprojekte ausblenden',
                                    es: 'Ocultar obras completados'
                                },
                            },
                            {
                                id: 'display_search_field_buildings',
                                label: {
                                    en: 'Search for a construction site',
                                    fr: 'Rechercher un chantier',
                                    de: 'Baustelle suchen',
                                    es: 'Buscar una construcción'
                                },
                            },
                            {
                                id: 'display_search_field_recipients',
                                label: {
                                    en: 'Find a recipient',
                                    fr: 'Rechercher un destinataire',
                                    de: 'Finden Sie einen Empfänger',
                                    es: 'Encuentra un destinatario'
                                }
                            },
                            {
                                id: 'display_search_field_dump',
                                label: {
                                    en: 'Search for an object in the landfill',
                                    fr: 'Rechercher un objet de la décharge',
                                    de: 'Suchen Sie nach einem Objekt auf der Mülldeponie',
                                    es: 'Buscar un objeto en el vertedero'
                                }
                            },
                            {
                                id: 'display_search_field_trap',
                                label: {
                                    en: 'Search for a bait',
                                    fr: 'Rechercher un appât',
                                    de: 'Nach einem Köder suchen',
                                    es: 'Buscar un cebo'
                                }
                            },
                            {
                                id: 'display_search_field_registry',
                                label: {
                                    en: 'Search the registry',
                                    fr: 'Rechercher dans le registre',
                                    de: 'Durchsuchen Sie die Registrierung',
                                    es: 'Buscar en el registro'
                                },
                                help: {
                                    en: 'The search will only be done in the displayed lines of the registry',
                                    fr: 'La recherche ne se fera que dans les lignes affichées du registre',
                                    de: 'Die Suche erfolgt nur in den angezeigten Zeilen des Registers',
                                    es: 'La búsqueda sólo se realizará en las líneas desplegadas del registro'
                                }
                            },
                            {
                                id: 'display_filters_citizen_list',
                                label: {
                                    en: 'Search the citizens list',
                                    fr: 'Rechercher dans la liste des citoyens',
                                    de: 'Durchsuchen Sie die Bürgerliste',
                                    es: 'Buscar en el lista ciudadanos'
                                }
                            },
                            {
                                id: 'display_filters_omniscience',
                                label: {
                                    en: 'Search the omniscience',
                                    fr: 'Rechercher dans l\'omniscience',
                                    de: 'Durchsuchen Sie die Omniscience',
                                    es: 'Buscar en el omnisciencia'
                                }
                            },
                        ]
                    },
                    {
                        id: 'sort_lists',
                        label: {
                            en: 'Additional sorts',
                            fr: 'Tris supplémentaires',
                            de: 'Zusätzliche Sorten',
                            es: 'Tipos adicionales'
                        },
                        children: [
                            {
                                id: 'sort_citizen_list',
                                label: {
                                    en: 'List of citizens',
                                    fr: 'Liste des citoyens',
                                    de: 'Liste der Bürger',
                                    es: 'Lista de ciudadanos',
                                }
                            },
                            {
                                id: 'sort_omniscience_list',
                                label: {
                                    en: 'Omniscience',
                                    fr: 'Omniscience',
                                    de: 'Allwissenheit',
                                    es: 'Omnisciencia',
                                }
                            },
                            {
                                id: 'sort_nightwatch_list',
                                label: {
                                    en: 'Night watch',
                                    fr: 'Veille',
                                    de: 'Nachtwache',
                                    es: 'Guardia nocturna',
                                }
                            },
                            {
                                id: 'sort_trap_list',
                                label: {
                                    en: 'Traps',
                                    fr: 'Pièges',
                                    de: 'Fallensystem',
                                    es: 'Trampas',
                                }
                            },
                            {
                                id: 'sort_dump_list',
                                label: {
                                    en: 'Dump',
                                    fr: 'Décharge',
                                    de: 'Müllhalde',
                                    es: 'Vertedero',
                                }
                            }
                        ]
                    },
                ]
            },
            {
                id: 'default_escort_options',
                label: {
                    en: 'Set default escort options',
                    fr: 'Définir des options d\'escorte par défaut',
                    de: 'Legen Sie Standard-Escort-Optionen fest',
                    es: 'Establecer opciones de acompañamiento predeterminadas'
                },
                children: [
                    {
                        id: 'default_escort_force_return',
                        label: {
                            en: 'Don\'t allow my escort to take me further away from the town',
                            fr: 'Interdire au chef d\'escorte de m\'éloigner de la ville',
                            de: 'Ich will auf direktem Weg zurück zur Stadt',
                            es: 'Prohibir al jefe de la escolta alejarme del pueblo'
                        },
                    },
                    {
                        id: 'default_escort_allow_rucksack',
                        label: {
                            en: 'Allow the objects in my rucksack to be viewed and used',
                            fr: 'Permettre de voir et de manipuler les objets de mon sac',
                            de: 'Zugriff auf meinen Rucksack zulassen',
                            es: 'Permitir ver y manipular los objetos en mi mochila'
                        },
                    }
                ]
            },
            {
                id: 'automatically_open_bag',
                label: {
                    en: 'Automatically opens the "Use an object from my rucksack" menu',
                    fr: 'Ouvre automatiquement le menu "Utiliser un objet de mon sac"',
                    de: 'Öffnet automatisch das Menü "Gegenstand verwenden"',
                    es: 'Abre automáticamente el menú "Usar un objeto de mi mochila"'
                },
            },
            {
                id: 'display_nb_dead_zombies',
                label: {
                    en: 'Number of zombie that died today',
                    fr: 'Nombre de zombies morts aujourd\'hui',
                    de: 'Anzahl der Zombies die heute hier gestorben sind',
                    es: 'Cantidad de zombis que murieron hoy'
                },
                help: {
                    en: 'Allows to display the number of blood splatters on the map',
                    fr: 'Permet d\'afficher le nombre de taches de sang sur la carte',
                    de: 'Ermöglicht die Anzeige der Anzahl der Blutfleck auf der Karte',
                    es: 'Permite mostrar la cantidad de manchas de sangre en el mapa'
                },
            },
            {
                id: 'display_missing_ap_for_buildings_to_be_safe',
                label: {
                    en: 'Missing AP to repair construction sites',
                    fr: 'PA manquants pour réparer les chantiers',
                    de: 'Fehlende AP, um Konstruktionen zu reparieren',
                    es: 'PA faltantes para reparar las construcciones'
                },
                help: {
                    en: 'In Pandemonium (Hardcore towns), the construction sites are damaged during the attack. The damages can amount to 70% max of the construction\'s life points (rounded up to the nearest whole number). This option displays over the constructions the number of AP needed to keep them safe.',
                    fr: 'En Pandémonium, les bâtiments prennent des dégâts lors de l\'attaque. Ces dégâts équivalent à un maximum de 70% des points de vie du bâtiment (arrondi à l\'entier supérieur). Cette option affiche sur les bâtiments les PA à investir pour que le bâtiment soit en sécurité.',
                    de: 'In Pandämonium-Städten nehmen Gebäude während des nächtlichen Angriffs Schaden. Diese Schäden können bis zu 70% eines Gebäudes ausmachen (aufgerundet zur nächsten ganzen Zahl). Diese Einstellung zeigt oberhalb der Bau-AP an, wieviele AP benötigt werden, um das Gebäude für die Nacht zu schützen.',
                    es: 'En Pandemonio, las construcciones sufren daños durante el ataque. Estos daños equivalen a un máximo de 70% de los puntos de vida de la construcción (redondeados al entero superior). Esta opción muestra sobre las construcciones la cantidad de PA a invertir para evitar que puedan ser destruidas.'
                },
            },
            {
                id: 'display_translate_tool',
                label: {
                    en: 'MyHordes\' item translation bar',
                    fr: 'Barre de traduction des éléments de MyHordes',
                    de: 'Übersetzungsleiste für MyHordes Elemente',
                    es: 'Barra de traducción de elementos de MyHordes'
                },
                help: {
                    en: 'Shows a translation bar. You must choose the initial language, then type the searched element to get the other translations.',
                    fr: 'Affiche une barre de traduction. Vous devez choisir la langue initiale, puis saisir l\'élément recherché pour en récupérer les différentes traductions.',
                    de: 'Zeigt eine Übersetzungsleiste an. Sie müssen die Ausgangssprache auswählen, und dann die Zielelemente eingeben um die Übersetzungen zu generieren.',
                    es: 'Muestra una barra de traducción. Primero se debe escoger el idioma inicial, y luego ingresar el elemento buscado en la barra para obtener las distintas traducciones.'
                },
            },
            {
                id: 'copy_registry',
                label: {
                    en: 'Button to copy registry contents',
                    fr: 'Bouton permettant de copier le contenu du registre',
                    de: 'Schaltfläche zum Kopieren von Registrierungsinhalten hinzu',
                    es: 'Botón para copiar el contenido del registro'
                },
            },
            {
                id: 'display_anti_abuse',
                label: {
                    en: 'Counter to manage anti-abuse',
                    fr: 'Compteur pour gérer l\'anti-abus',
                    de: 'Zähler zur Verwaltung der Missbrauchsbekämpfung an',
                    es: 'Contador para gestionar anti-abuso'
                },
            },
            {
                id: 'display_ghoul_voracity_percent',
                label: {
                    en: 'Percentage on the voracity gauge',
                    fr: 'Pourcentage sur la jauge de voracité',
                    de: 'Prozentsatz der Unersättlichkeitsanzeige an',
                    es: 'Porcentaje en el indicador de voracidad'
                },
            },
            {
                id: 'store_notifications',
                label: {
                    en: 'Stores notifications until cleared or page refreshed',
                    fr: 'Stocke les notifications jusqu\'à effacement ou rafraichissement de la page',
                    de: 'Speichert Benachrichtigungen, bis sie gelöscht oder die Seite aktualisiert wird',
                    es: 'Almacena notificaciones hasta que se borran o se actualiza la página'
                },
            },
            {
                id: 'display_counter_on_input_registry',
                label: {
                    en: 'Character counter on the chatcase.',
                    fr: 'Compteur de caractères sur le chatcase',
                    de: 'Zeichenzähler im Chatcase an',
                    es: 'Contador de caracteres en el caso de chat'
                },
            },
            {
                id: 'fill_items_messages',
                label: {
                    en: 'Pre-populate the contents of empty messages containing items',
                    fr: 'Pré-remplir le contenu des messages vides contenant des objets',
                    de: 'Füllen Sie den Inhalt leerer Nachrichten mit Gegenstand vorab aus',
                    es: 'Complete previamente el contenido de mensajes vacíos que contengan objetos'
                },
            },
            {
                id: 'freeze_avatars_animations',
                label: {
                    en: 'Freeze animated avatars',
                    fr: 'Figer les avatars animés',
                    de: 'Animierte Avatare einfrieren',
                    es: 'Congelar los avatares animados'
                },
                help: {
                    en: 'Animated avatars are displayed as a still image, and play again when hovered over',
                    fr: 'Les avatars animés sont affichés fixes, et se réaniment au survol de la souris',
                    de: 'Animierte Avatare werden als Standbild angezeigt und werden beim Überfahren mit der Maus wieder animiert',
                    es: 'Los avatares animados se muestran fijos y vuelven a animarse al pasar el ratón por encima'
                },
            },
            {
                id: 'custom_forum_thread_styles',
                label: {
                    en: 'Apply a custom style to forum thread titles',
                    fr: 'Appliquer un style personnalisé aux noms de sujets du forum',
                    de: 'Einen benutzerdefinierten Stil auf die Titel der Forenthemen anwenden',
                    es: 'Aplicar un estilo personalizado a los títulos de los temas del foro'
                },
                help: {
                    en: 'Colors, highlights or dims the thread titles of the forum list according to their tag and / or the words they contain. The styles are configured through the button next to this option.',
                    fr: 'Colore, met en avant ou atténue les noms de sujets de la liste du forum selon leur tag et / ou les mots qu\'ils contiennent. Les styles se configurent via le bouton à côté de cette option.',
                    de: 'Färbt, hebt hervor oder dämpft die Themen-Titel der Forenliste je nach Tag und / oder enthaltenen Wörtern. Die Stile werden über die Schaltfläche neben dieser Option konfiguriert.',
                    es: 'Colorea, destaca o atenúa los títulos de los temas de la lista del foro según su etiqueta y / o las palabras que contienen. Los estilos se configuran mediante el botón junto a esta opción.'
                },
                action: 'forum_thread_styles'
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
        id: 'notifications',
        label: {
            en: 'Notifications and warnings',
            fr: 'Notifications et avertissements',
            de: 'Hinweise und Warnungen',
            es: 'Notificaciones y advertencias'
        },
        params: [
            {
                id: 'alert_if_no_escort',
                label: {
                    en: 'Notify me when there is no escort or if you have not released your escort',
                    fr: 'Me notifier en l\'absence d\'escorte ou si vous n\'avez pas relâché votre escorte',
                    de: 'Benachrichtigen Sie mich, wenn keine Begleitung da ist oder wenn Sie Ihre Begleitperson nicht freigegeben haben',
                    es: 'Pavísame cuando no haya escolta o si no has soltado tu escolta'
                },
                children: [
                    {
                        id: 'prevent_from_leaving',
                        label: {
                            en: 'Ask for confirmation before leaving the page',
                            fr: 'Demander confirmation avant de quitter la page',
                            de: 'Bitten Sie um eine Bestätigung, bevor Sie die Seite verlassen',
                            es: 'Pide confirmación antes de salir de la página'
                        },
                    },
                    {
                        id: 'alert_if_inactive',
                        label: {
                            en: 'Notify me if I\'m inactive for more than 5 minutes on the page',
                            fr: 'Me notifier si je suis inactif depuis 5 minutes sur la page',
                            de: 'Benachrichtigen Sie mich, wenn ich länger als 5 Minuten auf der Seite inaktiv bin',
                            es: 'Notificarme si estoy inactivo por más de 5 minutos en la página'
                        },
                    }
                ]
            },
            {
                id: 'notify_on_search_end',
                label: {
                    en: 'Notify me at the end of a search',
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
            }
        ]
    }
];

