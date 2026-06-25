import {
    btn_id,
    mh_optimizer_map_window_id,
    mho_display_expeditions_id,
    mho_display_map_id,
    mho_store_notifications_id,
    repo_img_hordes_url
} from '../config/constants';

import styleTemplate from '../main.scss';

const STYLE_PLACEHOLDERS: ReadonlyMap<string, string> = new Map([
    ['__BTN_ID__', btn_id],
    ['__MH_OPTIMIZER_MAP_WINDOW_ID__', mh_optimizer_map_window_id],
    ['__MHO_DISPLAY_EXPEDITIONS_ID__', mho_display_expeditions_id],
    ['__MHO_DISPLAY_MAP_ID__', mho_display_map_id],
    ['__MHO_STORE_NOTIFICATIONS_ID__', mho_store_notifications_id],
    ['__REPO_IMG_HORDES_URL__', repo_img_hordes_url]
]);

export function createStyles(): void {
    let css: string = styleTemplate;

    for (const [placeholder, value] of STYLE_PLACEHOLDERS) {
        css = css.replaceAll(placeholder, value);
    }

    const style: HTMLStyleElement = document.createElement('style');
    style.appendChild(document.createTextNode(css));
    document.getElementsByTagName('head')[0].appendChild(style);
}
