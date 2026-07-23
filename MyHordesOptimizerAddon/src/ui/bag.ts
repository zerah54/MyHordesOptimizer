import { state } from '../state';
import { cancelWaitForElement, waitForElement } from '../utils/dom-wait';
import { unwatchRendered, watchInventory } from '../utils/render-watch';

/** Clé d'attente : une seule attente du bouton en vol, quel que soit le nombre de rejeux */
const wait_key_bag_toggle: string = 'bag:action-toggle';

/** Bouton « utiliser un objet » ; masqué par le jeu (`display: none`) dès que la liste est dépliée */
const bag_toggle_selector: string = '[x-item-action-toggle="1"]';

/**
 * Déplie la liste d'actions d'objets si c'est possible et que ça n'est pas déjà fait.
 * Idempotent : une fois dépliée, le jeu masque le bouton, donc un second appel ne fait rien.
 */
function openBagIfPossible(): void {
    if (!state.mho_parameters.automatically_open_bag) return;

    const button: HTMLElement | null = document.querySelector(bag_toggle_selector);
    if (!button) return;

    /** Le jeu masque le bouton quand la liste est déjà dépliée */
    if (button.getAttribute('style')?.includes('display: none')) return;

    /**
     * Aucune vérification du contenu du sac : le jeu ne rend ce bouton que s'il existe
     * au moins une action d'objet ou une recette (`templates/ajax/game/actions.html.twig`),
     * ou qu'elles restent à charger. Sa seule présence suffit donc, et exiger en plus un
     * objet dans le sac empêchait l'ouverture sac vide alors que des actions étaient
     * pourtant disponibles — par exemple depuis le sol ou l'atelier.
     */
    button.click();
}

/**
 * Si l'option associée est activée, déplie automatiquement la liste d'actions d'objets.
 *
 * Deux déclencheurs complémentaires : l'apparition du bouton, qui couvre le premier
 * affichage de la page, et le rendu de l'inventaire, car le jeu réévalue les actions
 * disponibles après un transfert d'objet et peut alors réafficher le bouton.
 */
export function automaticallyOpenBag(): void {
    if (!state.mho_parameters.automatically_open_bag) {
        /** Option décochée : on cesse d'attendre le bouton comme d'écouter les inventaires */
        cancelWaitForElement(wait_key_bag_toggle);
        unwatchRendered('bag');
        return;
    }

    watchInventory('bag', () => openBagIfPossible());
    waitForElement(wait_key_bag_toggle, bag_toggle_selector, () => openBagIfPossible());
}
