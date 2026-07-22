import { state } from '../state';

export function automaticallyOpenBag(count = 0) {
    if (!state.mho_parameters.automatically_open_bag) return;

    const button = document.querySelector('[x-item-action-toggle="1"]');
    const inventories = document.querySelectorAll('hordes-inventory .inventory li.item:not(.locked)');

    if (!button || inventories?.length === 0) {
        if (count < 3) setTimeout(() => automaticallyOpenBag(count + 1), 250);
        return;
    }

    const isVisible = !button.getAttribute('style')?.includes('display: none');
    if (!isVisible) return;

    // Attendre que le bouton soit prêt via rAF + microtask
    requestAnimationFrame(() => {
        Promise.resolve().then(() => {
            button.click();

            const observer = new MutationObserver(() => {
                const btn = document.querySelector('[x-item-action-toggle="1"]');
                if (btn && !btn.getAttribute('style')?.includes('display: none')) {
                    btn.click();
                }
            });

            inventories.forEach(item => observer.observe(item, { attributes: true }));
        });
    });
}
