import { mh_optimizer_icon, mho_copy_logs_id, repo_img_hordes_url } from '../config/constants';
import { texts } from '../i18n/texts';
import { state } from '../state';
import { getI18N } from '../utils/i18n';
import { copyToClipboard } from '../utils/misc';

export function addCopyRegistryButton() {
    if (state.mho_parameters.copy_registry) {
        const logs = document.querySelector('hordes-log');
        const logs_complete_links = document.querySelector('log-complete-link');
        const copy_button = document.querySelector(`#${mho_copy_logs_id}`);

        const createCopyRegistryButtonContent = (value) => {
            return `<div style="display: flex; gap: 0.5em; align-items: center;"><img src="${mh_optimizer_icon}" style="width: 16px !important;">${value}</div>`;
        };

        if (logs && !copy_button && !logs_complete_links) {
            const title = logs.parentElement.previousElementSibling;
            const copy_button = document.createElement('a');
            title.appendChild(copy_button);

            copy_button.innerHTML = createCopyRegistryButtonContent('⧉');
            copy_button.id = mho_copy_logs_id;
            copy_button.style.backgroundColor = 'rgba(62,36,23,.75)';
            copy_button.style.borderRadius = '6px';
            copy_button.style.padding = '3px 5px';
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
            if (title) {
                if (title.tagName.toLowerCase() === 'H5'.toLowerCase()) {

                    copy_button.style.marginRight = '0.5em';
                    copy_button.style.float = 'right';
                    copy_button.style.position = 'relative';
                    copy_button.style.bottom = '7px';


                    const first_link = title.querySelector('a');
                    if (first_link) {
                        first_link.style.marginLeft = 'auto';
                    }
                } else {
                    copy_button.style.display = 'flex';
                    copy_button.style.justifyContent = 'center';
                }

            }
        }
    }
}
