import { mho_display_expeditions_id, mho_expeditions_window_id, repo_img_hordes_url } from '../config/constants';
import { program_texts } from '../i18n/texts';
import { state } from '../state';
import { getI18N } from '../utils/i18n';
import { createHeaderButton, getHeaderButtonsContainer } from './header-space';
import { openMyProgram } from './my-program';
import { createWindow } from './window';

export function createExpeditionsBtn() {
    const expeditions_btn = document.getElementById(mho_display_expeditions_id);
    if (state.mho_parameters.display_my_expeditions) {
        createWindow(mho_expeditions_window_id, false);

        const mho_header_space = getHeaderButtonsContainer();
        if (expeditions_btn || !mho_header_space) return;

        const btn_container = createHeaderButton(mho_display_expeditions_id, repo_img_hordes_url + '/icons/planner.gif', getI18N(program_texts.title));
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
