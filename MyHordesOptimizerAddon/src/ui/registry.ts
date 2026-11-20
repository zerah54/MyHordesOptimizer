import { mho_copy_logs_id, repo_img_hordes_url } from '../config/constants';
import { texts } from '../i18n/texts';
import { state } from '../state';
import { getI18N } from '../utils/i18n';
import { copyToClipboard } from '../utils/misc';
import { ensureRegistryToolbar } from './registry-toolbar';

export function addCopyRegistryButton() {
    if (state.mho_parameters.copy_registry) {
        const logs = document.querySelector('hordes-log');
        const copy_button = document.querySelector(`#${mho_copy_logs_id}`);

        const createCopyRegistryButtonContent = (value) => value;

        /** Affiché même quand le registre est incomplet : la copie porte alors sur les entrées visibles */
        const toolbar: HTMLElement | null = logs && !copy_button ? ensureRegistryToolbar() : null;
        if (toolbar) {
            const copy_button = document.createElement('a');
            /** Juste après l'icône, devant le champ de recherche */
            toolbar.querySelector('img').after(copy_button);

            copy_button.innerHTML = createCopyRegistryButtonContent('⧉');
            copy_button.id = mho_copy_logs_id;
            copy_button.style.cursor = 'pointer';
            copy_button.title = getI18N(texts.copy_registry);

            copy_button.addEventListener('click', () => {
                const entries = logs.querySelectorAll('.log-entry:not(.hidden)');
                const soft_entries = Array.from(entries).map((entry) => {
                    const time = entry.querySelector('.log-part-time').innerText.trim();
                    const separator = ' [X] ';
                    const content = entry.querySelector('.log-part-content').innerText.trim();
                    return time + separator + content;
                });

                const final_text = soft_entries.join('\n');
                copyToClipboard(final_text);
                copy_button.innerHTML = createCopyRegistryButtonContent(`<img src="${repo_img_hordes_url}icons/done.png">`);
                setTimeout(() => {
                    copy_button.innerHTML = createCopyRegistryButtonContent('⧉');
                }, 5000);
            });
        }
    }
}
