import { RuinDTO } from './dto/ruin.dto';
import { Dictionary } from './types/_types';

export const EXTERNAL_APP_ID_KEY: string = 'external_app_id';
export const BANK_CONDENSED_DISPLAY_KEY: string = 'bank_condensed_display';
export const WISHLIST_EDITION_MODE_KEY: string = 'wishlist_edition_mode';
export const EXPEDITIONS_EDITION_MODE_KEY: string = 'expeditions_edition_mode';
export const MINESWEEPER_OPTIONS_KEY: string = 'minesweeper_options';
export const USER_KEY: string = 'user';
export const TOWN_KEY: string = 'town';
export const ITEMS_KEY: string = 'all_items';
export const BANK_KEY: string = 'bank_cache';
export const RUINS_KEY: string = 'all_ruins';
export const TOKEN_KEY: string = 'MHO_TOKEN';
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
    id: -1000, camping: 0, label: {en: 'None', fr: 'Aucun', de: 'Kein', es: 'Nada'}, chance: 0, description: {en: '', fr: '', de: '', es: ''},
    explorable: false, img: '', minDist: 1, maxDist: 1000, drops: [], capacity: -1
};

export const TDG_VALUES: number[] = [33, 38, 42, 46, 50, 54, 58, 63, 67, 71, 75, 79, 83, 88, 92, 96, 100];
export const PLANIF_VALUES: number[] = [0, 4, 8, 13, 17, 21, 25, 29, 33, 38, 42, 46, 50, 54, 58, 63, 67, 71, 75, 79, 83, 88, 92, 96, 100];

export const FAVORITE_EXPEDITION_ITEMS_UID: string[] = ['cart_#00', 'bag_#00', 'dish_tasty_#00', 'water_#00', 'lamp_on_#00', 'lamp_#00', 'pile_#00',
    'pilegun_up_#00', 'pilegun_#00', 'pilegun_up_empty_#00', 'pilegun_empty_#00', 'maglite_2_#00', 'maglite_1_#00', 'drug_hero_#00', 'drug_#00', 'coffee_#00',
    'rhum_#00', 'lpoint_#00', 'lpoint4_#00', 'lpoint3_#00', 'lpoint2_#00', 'lpoint1_#00', 'lilboo_#00', 'dice_#00', 'cards_#00', 'vegetable_#00', 'tekel_#00',
    'pet_cat_#00', 'angryc_#00', 'bandage_#00', 'sport_elec_empty_#00', 'sport_elec_#00', 'maglite_off_#00', 'bumpKey_#00', 'magneticKey_#00',
    'classicKey_#00', 'pocket_belt_#00', 'screw_#00', 'can_opener_#00', 'big_pgun_empty_#00'];
