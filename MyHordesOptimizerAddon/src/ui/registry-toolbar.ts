import { mh_optimizer_icon_flat } from '../config/constants';

export const mho_registry_toolbar_id: string = 'mho-registry-toolbar';

/**
 * Retourne l'encadré MHO du titre du registre (icône unique), en le créant s'il manque.
 * Retourne null sans `hordes-log` ou sans titre.
 */
export function ensureRegistryToolbar(): HTMLElement | null {
    const title: Element | null | undefined = document.querySelector('hordes-log')?.parentElement?.previousElementSibling;
    if (!title) return null;

    const existing: HTMLElement | null = title.querySelector<HTMLElement>(`#${mho_registry_toolbar_id}`);
    if (existing) return existing;

    const toolbar: HTMLDivElement = document.createElement('div');
    toolbar.id = mho_registry_toolbar_id;

    const icon: HTMLImageElement = document.createElement('img');
    icon.src = mh_optimizer_icon_flat;
    icon.style.height = '16px';
    toolbar.appendChild(icon);

    if (title.tagName.toLowerCase() === 'h5') {
        toolbar.style.marginRight = '0.5em';
        toolbar.style.float = 'right';
        toolbar.style.position = 'relative';
        toolbar.style.bottom = '7px';

        const first_link: HTMLElement | null = title.querySelector('a');
        if (first_link) {
            first_link.style.marginLeft = 'auto';
        }
    } else {
        toolbar.style.display = 'flex';
        toolbar.style.justifyContent = 'center';
        toolbar.style.margin = '0 auto';
    }

    title.appendChild(toolbar);
    return toolbar;
}
