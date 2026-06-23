import {state} from '../state';

export function displayGhoulVoracityPercent() {
    if (state.mho_parameters.display_ghoul_voracity_percent) {
        let ghoul_voracity_node = document.querySelector('.status-ghoul');

        if (!ghoul_voracity_node) return;

        let voracite = ghoul_voracity_node.querySelector('.ghoul-hunger-bar').style.width;
        ghoul_voracity_node.firstChild.textContent = ghoul_voracity_node.firstChild.textContent.replace(':\n', `: ${voracite}\n`);
    }
}
