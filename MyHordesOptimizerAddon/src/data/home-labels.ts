import type { I18nLabel } from '../types';

/** Clé de l'habitation dans le contenu de la maison. */
export const HOUSE_LEVEL_KEY: string = 'houseLevel';

/** Libellés des niveaux d'habitation (indice = niveau). */
export const HOUSE_LEVEL_LABELS: readonly I18nLabel[] = [
    { fr: 'Lit de camp', en: 'Camp Bed', de: 'Feldbett', es: 'Camastro' },
    { fr: 'Tente', en: 'Tent', de: 'Zelt', es: 'Tienda' },
    { fr: 'Taudis', en: 'Hovel', de: 'Baracke', es: 'Cuchitril' },
    { fr: 'Baraque', en: 'Shack', de: 'Hütte', es: 'Barraca' },
    { fr: 'Maison', en: 'House', de: 'Haus', es: 'Casa' },
    { fr: 'Maison clôturée', en: 'Safehouse', de: 'Umzäuntes Haus', es: 'Casa enrejada' },
    { fr: 'Abri fortifié', en: 'Stronghold', de: 'Befestigte Unterkunft', es: 'Fuerte' },
    { fr: 'Bunker', en: 'Nuclear Bunker', de: 'Bunker', es: 'Bunker nuclear' },
    { fr: 'Château', en: 'Palace', de: 'Schloss', es: 'Castillo' }
];

/** Améliorations de maison indexées par clé du contenu de la maison, avec leur niveau maximal. */
export const HOME_UPGRADES: Readonly<Record<string, { label: I18nLabel; max_lvl: number }>> = {
    hasAlarm: { label: { fr: 'Alarme rudimentaire', en: 'Rudimentary Alarm', de: 'Primitives Alarmsystem', es: 'Alarma rudimentaria' }, max_lvl: 1 },
    chestLevel: { label: { fr: 'Rangements', en: 'Storage', de: 'Stauraum', es: 'Compartimentos' }, max_lvl: 13 },
    hasCurtain: { label: { fr: 'Gros rideau', en: 'Large Curtain', de: 'Großer Vorhang', es: 'Gran cortina' }, max_lvl: 1 },
    renfortLevel: { label: { fr: 'Renforts', en: 'Reinforcements', de: 'Verstärkung', es: 'Refuerzos' }, max_lvl: 10 },
    kitchenLevel: { label: { fr: 'Cuisine', en: 'Kitchen', de: 'Küche', es: 'Cocina' }, max_lvl: 4 },
    laboLevel: { label: { fr: 'Cave-laboratoire', en: 'Laboratory', de: 'Hobbylabor', es: 'Sótano laboratorio' }, max_lvl: 4 },
    restLevel: { label: { fr: 'Coin sieste', en: 'Siesta Time™', de: 'Ruheecke', es: 'Rincón para siesta' }, max_lvl: 3 },
    hasLock: { label: { fr: 'Verrou', en: 'Lock', de: 'Türschloss', es: 'Cerrojo' }, max_lvl: 1 },
    hasFence: { label: { fr: 'Clôture', en: 'Fence', de: 'Zaun', es: 'Valla' }, max_lvl: 1 }
};
