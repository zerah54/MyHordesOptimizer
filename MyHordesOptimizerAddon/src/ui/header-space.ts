import { mh_optimizer_icon_flat, mho_header_space_id } from '../config/constants';

export const mho_header_logo_class: string = 'mho-header-logo';
export const mho_header_inner_class: string = 'mho-header-inner';
export const mho_header_frame_id: string = 'mho-header-frame';

/** Conteneur des boutons MHO (logo compris) dans l'en-tête, ou null si l'espace d'en-tête n'existe pas. */
export function getHeaderButtonsContainer(): HTMLElement | null {
    return document.querySelector(`#${mho_header_space_id} .${mho_header_inner_class}`);
}

/** Crée un bouton de l'encadré MHO : un conteneur d'`id` avec un unique pictogramme. */
export function createHeaderButton(id: string, pictogram_src: string): HTMLDivElement {
    const btn_container: HTMLDivElement = document.createElement('div');
    btn_container.id = id;

    const btn_img: HTMLImageElement = document.createElement('img');
    btn_img.src = pictogram_src;
    btn_img.style.imageRendering = 'pixelated';
    btn_img.style.cursor = 'pointer';
    btn_container.appendChild(btn_img);
    return btn_container;
}

export function createMhoHeaderSpace() {
    const mh_header = document.querySelector('#header');
    if (!mh_header) return;

    const postbox = document.querySelector('#postbox');
    if (!postbox) return;

    let header_space = document.querySelector(`#${mho_header_space_id}`);
    if (!header_space) {

        header_space = document.createElement('div');
        header_space.id = mho_header_space_id;
        mh_header.appendChild(header_space);

        const logo: HTMLDivElement = document.createElement('div');
        logo.className = mho_header_logo_class;
        const logo_img: HTMLImageElement = document.createElement('img');
        logo_img.src = mh_optimizer_icon_flat;
        logo.appendChild(logo_img);

        const frame: HTMLDivElement = document.createElement('div');
        frame.id = mho_header_frame_id;
        frame.className = 'header-icon';
        const inner: HTMLDivElement = document.createElement('div');
        inner.className = mho_header_inner_class;
        inner.appendChild(logo);
        frame.appendChild(inner);
        header_space.appendChild(frame);

        header_space.style.position = 'absolute';
        header_space.style.display = 'none';
        header_space.style.gap = '0.5em';
        header_space.style.alignItems = 'center';
        header_space.style.zIndex = '994';
    }

    const callback = function (mutationsList, observer) {
        if (postbox.clientWidth && postbox.clientWidth > 0) {
            header_space.style.display = 'flex';
            header_space.style.right = `calc(${postbox.clientWidth}px + 10px + 0.5em)`;
            header_space.style.top = postbox.getBoundingClientRect().y + 'px';
            observer.disconnect();
        }
    };

    const observer = new MutationObserver(callback);
    const config = { attributes: true, subtree: false, childList: false };

    observer.observe(postbox, config);
}
