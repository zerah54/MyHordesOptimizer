import { state } from '../state';
import { shouldRefreshMe } from './page';

export function isTouchScreen() {
    return 'ontouchstart' in window || navigator.msMaxTouchPoints;
}

/** Calcule le nombre de zombies qui vont mourir par désespoir */

export function calculateDespairDeaths(nb_killed_zombies) {
    return Math.floor(Math.max(0, (nb_killed_zombies - 1) / 2));
}


export function fixMhCompiledImg(img) {
    if (!img) return;
    return img.replace(/\/(\w+)\.(\w+)\.(\w+)/, '/$1.$3');
}


export function isValidToken() {
    if (!state.token || !state.token.token || !state.token.token.accessToken) return false;
    const expiration_date = new Date(state.token.token.validTo).getTime();
    const current_date = new Date().getTime();
    return !shouldRefreshMe() && current_date < expiration_date;
}


export function copyToClipboard(text) {
    const input = document.createElement('textarea');
    input.value = text;

    document.body.appendChild(input);
    input.select();

    document.execCommand('copy');
    input.remove();
}
