import type { I18nLabel } from '../types';

/** Libellés des actions quotidiennes, indexés par clé d'action. */
export const DAILY_ACTION_LABELS: Readonly<Record<string, I18nLabel>> = {
    home_pool: { fr: 'Prendre un bain', en: 'Take a bath', de: 'Ein Bad nehmen', es: 'Darse un baño' },
    home_shower: { fr: 'Se doucher', en: 'Take a shower', de: 'Duschen', es: 'Tomar una ducha' },
    home_clean: { fr: 'Ranger mon habitat', en: 'Clean and tidy my house', de: 'Haus aufräumen und putzen', es: 'Ordenar mi casa' },
    home_rest: { fr: 'Faire une sieste', en: 'Take a nap', de: 'Nickerchen machen', es: 'Echarse una siesta' },
    home_defbuff: { fr: 'Organiser les défenses', en: 'Organize defence', de: 'Verteidigung organisieren', es: 'Organizar defensas' },
    home_crows: { fr: 'Cartographier le désert', en: 'Mapping the desert', de: 'Die Wüste kartographieren', es: 'Cartografiar el Ultramundo' },
    home_survivalist: { fr: 'Trouver de l’eau', en: 'Find water', de: 'Wasser finden', es: 'Encontrar agua' },
    home_contemplate: { fr: 'Se recueillir', en: 'Reflect', de: 'Besinnen', es: 'Meditar' },
    home_scavenge: { fr: 'Creuser dans les galeries', en: 'Dig in the Gallery', de: 'In den Buddelgruben graben', es: 'Excavar en la Galería' },
    trash: { fr: 'Fouiller les déchets', en: 'Search the refuse', de: 'Müll durchwühlen', es: 'Buscar en los deshechos' },
    home_heal: { fr: 'Se soigner', en: 'Heal', de: 'Heilen', es: 'Curar' }
};
