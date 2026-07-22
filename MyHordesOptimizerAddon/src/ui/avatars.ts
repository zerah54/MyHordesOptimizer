import { state } from '../state';

/** Sélecteur des images d'avatars susceptibles d'être animées */
const avatar_img_selector: string = 'div.avatar img';
/** Classe posée sur les canvas de gel, pour pouvoir les retrouver et les supprimer */
const frozen_canvas_class: string = 'mho-frozen-avatar';

/** Observer unique : évite d'en empiler un à chaque ré-initialisation des options */
let avatars_observer: MutationObserver | undefined;
/** Permet de retirer d'un seul coup tous les listeners posés sur les images */
let listeners_controller: AbortController | undefined;

/**
 * Fige les avatars animés (WebP) en superposant à l'image un canvas contenant sa première frame,
 * et masque ce canvas au survol pour laisser l'animation reprendre.
 */
export function freezeAvatarsAnimations(): void {
    if (!state.mho_parameters?.freeze_avatars_animations) {
        unfreezeAllAvatars();
        return;
    }

    if (!listeners_controller) {
        listeners_controller = new AbortController();
    }

    freezeAllAvatars();

    /** L'observer n'est posé qu'une seule fois, il gère ensuite tous les avatars ajoutés dynamiquement */
    if (avatars_observer) return;

    avatars_observer = new MutationObserver((mutations: MutationRecord[]) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (!(node instanceof Element)) continue;

                if (node instanceof HTMLImageElement) {
                    if (node.closest('div.avatar')) {
                        freezeImage(node);
                    }
                    continue;
                }

                node.querySelectorAll<HTMLImageElement>(avatar_img_selector).forEach(freezeImage);
            }
        }
    });
    avatars_observer.observe(document.body, { childList: true, subtree: true });
}


function freezeAllAvatars(): void {
    document.querySelectorAll<HTMLImageElement>(avatar_img_selector).forEach(freezeImage);
}


function freezeImage(img: HTMLImageElement): void {
    if (!isWebP(img) || img.dataset.mhoAnimFrozen) return;
    img.dataset.mhoAnimFrozen = 'true';

    const signal: AbortSignal | undefined = listeners_controller?.signal;

    const applyFreeze = (): void => {
        /** L'option a pu être décochée entre le chargement de l'image et son traitement */
        if (!state.mho_parameters?.freeze_avatars_animations || signal?.aborted) return;

        const rect: DOMRect = img.getBoundingClientRect();
        const display_width: number = rect.width || img.offsetWidth || img.naturalWidth || 40;
        const display_height: number = rect.height || img.offsetHeight || img.naturalHeight || 40;

        const canvas: HTMLCanvasElement = document.createElement('canvas');
        canvas.classList.add(frozen_canvas_class);
        canvas.width = img.naturalWidth || display_width;
        canvas.height = img.naturalHeight || display_height;
        canvas.style.cssText = [
            'position:absolute',
            'left:0',
            'top:0',
            `width:${display_width}px`,
            `height:${display_height}px`,
            'margin:0',
            'padding:0',
            'pointer-events:none',
        ].join(';');

        const context: CanvasRenderingContext2D | null = canvas.getContext('2d');
        if (!context) return;

        if (window.getComputedStyle(img).getPropertyValue('position') === 'static') {
            img.style.position = 'relative';
            img.dataset.mhoAnimPositioned = 'true';
        }

        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        img.insertAdjacentElement('afterend', canvas);

        img.addEventListener('mouseenter', () => {
            canvas.style.visibility = 'hidden';
        }, { signal });

        img.addEventListener('mouseleave', () => {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.style.visibility = 'visible';
        }, { signal });
    };

    if (img.complete && img.naturalWidth > 0) {
        applyFreeze();
    } else {
        img.addEventListener('load', applyFreeze, { once: true, signal });
    }
}


function isWebP(img: HTMLImageElement): boolean {
    return (img.getAttribute('src') || '').toLowerCase().includes('.webp');
}


/** Retire tout ce qui a été posé par l'option : canvas, listeners, observer et styles */
function unfreezeAllAvatars(): void {
    avatars_observer?.disconnect();
    avatars_observer = undefined;

    listeners_controller?.abort();
    listeners_controller = undefined;

    document.querySelectorAll<HTMLCanvasElement>(`canvas.${frozen_canvas_class}`).forEach((canvas: HTMLCanvasElement) => canvas.remove());

    document.querySelectorAll<HTMLImageElement>('img[data-mho-anim-frozen]').forEach((img: HTMLImageElement) => {
        if (img.dataset.mhoAnimPositioned) {
            img.style.position = '';
            delete img.dataset.mhoAnimPositioned;
        }
        delete img.dataset.mhoAnimFrozen;
    });
}
