import { RuinDTO } from './dto/ruin.dto';
import { Dictionary } from './types/_types';

export const EXTERNAL_APP_ID_KEY: string = 'external_app_id';
export const BANK_CONDENSED_DISPLAY_KEY: string = 'bank_condensed_display';
export const USER_KEY: string = 'user';
export const TOWN_KEY: string = 'town';
export const ITEMS_KEY: string = 'all_items';
export const RUINS_KEY: string = 'all_ruins';
export const HORDES_IMG_REPO: string = 'assets/img/hordes_img/';

export const BREAKPOINTS: Dictionary<string> = {
    'xs': 'screen and (max-width: 599px)',
    'sm': 'screen and (min-width: 600px) and (max-width: 959px)',
    'md': 'screen and (min-width: 960px) and (max-width: 1279px)',
    'lg': 'screen and (min-width: 1280px) and (max-width: 1919px)',
    'xl': 'screen and (min-width: 1920px) and (max-width: 5000px)',
    'lt-sm': 'screen and (max-width: 599px)',
    'lt-md': 'screen and (max-width: 959px)',
    'lt-lg': 'screen and (max-width: 1279px)',
    'lt-xl': 'screen and (max-width: 1919px)',
    'gt-xs': 'screen and (min-width: 600px)',
    'gt-sm': 'screen and (min-width: 960px)',
    'gt-md': 'screen and (min-width: 1280px)',
    'gt-lg': 'screen and (min-width: 1920px)',
};


export const NO_RUIN: RuinDTO = {
    id: 'none', camping: 0, label: {en: 'None', fr: 'Aucun', de: 'Kein', es: 'TODO'}, chance: 0, description: {en: '', fr: '', de: '', es: ''},
    explorable: false, img: '', minDist: 1, maxDist: 1000, drops: []
};


/** @see CitizenHandler > getCampingValues > $distance_map */
export const DISTANCE_MAP: Dictionary<number> = {
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


export const CAMPING_BONUS: Record<string, number> = {
    tomb: 1.6,
    night: 2,
    devastated: -10,
    phare: 5,
    zombie_with_vest: -0.6,
    zombie_without_vest: -1.4,
    simple_amelio: 1,
    OD_amelio: 1.8,
    camping_objects_in_inventory: 1
};

/** @see CitizenHandler > getCampingValues > $campings_map */
export const CAMPINGS_MAP: Dictionary<Dictionary<Dictionary<number>>> = {
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
export const HIDDEN_CAMPERS_MAP: Dictionary<number> = {
    0: 0,
    1: 0,
    2: -2,
    3: -6,
    4: -10,
    5: -14,
    6: -20,
    7: -26
};

export const TDG_VALUES: number[] = [33, 38, 42, 46, 50, 54, 58, 63, 67, 71, 75, 79, 83, 88, 92, 96, 100];
export const PLANIF_VALUES: number[] = [0, 4, 8, 13, 17, 21, 25, 29, 33, 38, 42, 46, 50, 54, 58, 63, 67, 71, 75, 79, 83, 88, 92, 96, 100];
