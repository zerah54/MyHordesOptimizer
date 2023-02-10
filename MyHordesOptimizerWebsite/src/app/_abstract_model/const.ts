import { RuinDTO } from "./dto/ruin.dto";
import { Dictionary } from "./types/_types";

export const EXTERNAL_APP_ID_KEY: string = 'external_app_id';
export const USER_ID_KEY: string = 'user_id';
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
}


export const NO_RUIN: RuinDTO = {
    id: 'none', camping: 0, label: { en: `None`, fr: `Aucun`, de: `Kein`, es: `TODO` }, chance: 0, description: { en: ``, fr: ``, de: ``, es: `` },
    explorable: false, img: '', minDist: 1, maxDist: 1000, drops: []
};

