import { mh_optimizer_icon, mho_display_expeditions_id, mho_expeditions_window_id, mho_header_space_id, repo_img_hordes_url } from '../config/constants';
import { state } from '../state';
import { openMyProgram } from './my-program';
import { createWindow } from './window';

export function createExpeditionsBtn() {
    const expeditions_btn = document.getElementById(mho_display_expeditions_id);
    if (state.mho_parameters.display_my_expeditions) {
        createWindow(mho_expeditions_window_id, false);

        const mho_header_space = document.getElementById(mho_header_space_id);
        if (expeditions_btn || !mho_header_space) return;

        const btn_container = document.createElement('div');
        btn_container.id = mho_display_expeditions_id;

        const postbox_img = document.querySelector('#postbox img');

        const btn_mho_img = document.createElement('img');
        btn_mho_img.src = mh_optimizer_icon;
        btn_mho_img.style.height = postbox_img && postbox_img.height ? postbox_img.height + 'px' : '16px';
        btn_container.appendChild(btn_mho_img);

        const btn_img = document.createElement('img');
        btn_img.src = repo_img_hordes_url + '/icons/planner.gif';
        btn_img.style.height = postbox_img && postbox_img.height ? postbox_img.height + 'px' : '16px';
        btn_container.appendChild(btn_img);
        mho_header_space.appendChild(btn_container);

        btn_container.addEventListener('click', (event) => {
            event.stopPropagation();
            event.preventDefault();
            document.getElementById(mho_expeditions_window_id).classList.add('visible');
            void openMyProgram(true);
        });

    } else if (expeditions_btn) {
        expeditions_btn.remove();
    }
}
