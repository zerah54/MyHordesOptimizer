import {mho_header_space_id} from '../config/constants';

export function createMhoHeaderSpace() {
    let mh_header = document.querySelector('#header');
    if (!mh_header) return;

    let postbox = document.querySelector('#postbox');
    if (!postbox) return;

    let header_space = document.querySelector(`#${mho_header_space_id}`);
    if (!header_space) {

        header_space = document.createElement('div');
        header_space.id = mho_header_space_id;
        mh_header.appendChild(header_space);

        header_space.style.position = 'absolute';
        header_space.style.display = 'none';
        header_space.style.gap = '0.5em';
        header_space.style.alignItems = 'flex-start';
        header_space.style.zIndex = '996';
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
    const config = {attributes: true, subtree: false, childList: false};

    observer.observe(postbox, config);
}
