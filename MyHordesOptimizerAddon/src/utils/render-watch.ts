import { cancelWaitForElement, waitForElement } from './dom-wait';

/**
 * Surveillance des zones rendues par React.
 *
 * Les composants du jeu (`hordes-inventory`, `hordes-map`, …) sont montés APRÈS
 * l'injection du HTML, et leur contenu est remplacé au fil de la partie : transfert
 * d'objet, déplacement sur la carte, chargement différé. Tout ce que l'addon lit ou
 * greffe dessus doit donc être rejoué à chaque re-rendu.
 *
 * Les signaux `sig-*` du jeu ne conviennent pas pour cela : ils sont émis depuis le
 * gestionnaire d'action, donc AVANT que React n'ait commité son rendu. Observer la
 * mutation elle-même supprime toute dépendance à l'ordre d'exécution.
 *
 * ATTENTION en s'abonnant : ne jamais surveiller une zone qui CONTIENT ce que le
 * traitement écrit, sinon chaque écriture relance le traitement indéfiniment. Seul
 * `childList` est observé, ce qui met déjà à l'abri des simples changements de classe
 * ou d'attribut, mais pas d'une insertion de nœud.
 */

/** Abonnés d'une même zone surveillée */
interface WatchGroup {
    /** Observateur partagé par le groupe, créé à la première installation */
    observer?: MutationObserver;
    /** Éléments actuellement observés, comparés par référence */
    observed: Element[];
    /** Traitements à rejouer, indexés par clé d'appelant */
    subscribers: Map<string, () => void>;
    /** Un rejeu est déjà programmé pour la salve de mutations en cours */
    refresh_scheduled: boolean;
}

/** Groupes de surveillance, indexés par sélecteur de zone */
const watch_groups: Map<string, WatchGroup> = new Map();

/** Rejoue les abonnés d'un groupe, en isolant leurs erreurs */
function runSubscribers(group: WatchGroup): void {
    group.subscribers.forEach((callback: () => void, key: string) => {
        try {
            callback();
        } catch (error) {
            console.error(`MHO - rejeu après rendu en échec : ${key}`, error);
        }
    });
}

/**
 * Programme un rejeu des abonnés du groupe.
 * Différé d'une frame et regroupé par salve : un re-rendu produit de nombreuses
 * mutations, qui n'ont besoin que d'un seul rejeu.
 */
function scheduleRefresh(group: WatchGroup): void {
    if (group.refresh_scheduled) return;
    group.refresh_scheduled = true;

    requestAnimationFrame(() => {
        group.refresh_scheduled = false;
        runSubscribers(group);
    });
}

/**
 * (Ré)installe l'observateur du groupe sur les zones présentes, si elles ont changé.
 * @returns true si l'observateur a été réinstallé
 */
function syncObservedElements(group: WatchGroup, target_selector: string): boolean {
    const targets: Element[] = Array.from(document.querySelectorAll(target_selector));
    if (targets.length === 0) return false;

    const unchanged: boolean = group.observed.length === targets.length
        && group.observed.every((observed: Element, index: number) => observed === targets[index]);
    if (unchanged) return false;

    if (!group.observer) {
        group.observer = new MutationObserver(() => scheduleRefresh(group));
    }

    group.observer.disconnect();
    targets.forEach((target: Element) => group.observer.observe(target, { childList: true, subtree: true }));
    group.observed = targets;
    return true;
}

/**
 * Rejoue `onRendered` à chaque fois que le jeu (re)rend la zone visée.
 *
 * L'appel est sûr à répéter à chaque rejeu des initialisations : l'abonnement est
 * remplacé sous la même clé et l'observateur n'est réinstallé que si les zones ont
 * réellement changé. Le traitement est également joué une première fois dès que la
 * zone apparaît, ce qui couvre le premier rendu de la page.
 *
 * @param key              Identifiant stable de l'appelant
 * @param target_selector  Sélecteur de la zone rendue à surveiller
 * @param onRendered       Traitement à rejouer après chaque rendu
 */
export function watchRendered(key: string, target_selector: string, onRendered: () => void): void {
    let group: WatchGroup | undefined = watch_groups.get(target_selector);
    if (!group) {
        group = { observed: [], subscribers: new Map(), refresh_scheduled: false };
        watch_groups.set(target_selector, group);
    }

    /**
     * Un abonné déjà connu ne doit PAS reprogrammer de rejeu : son traitement le
     * rappelle en général lui-même (il repose l'affichage, qui se réabonne), ce qui
     * bouclerait indéfiniment d'une frame à l'autre. Seuls un nouvel abonnement ou un
     * changement des zones observées justifient un rejeu.
     */
    const is_new_subscriber: boolean = !group.subscribers.has(key);
    group.subscribers.set(key, onRendered);

    const watched_group: WatchGroup = group;
    waitForElement(`render-watch:${target_selector}:${key}`, target_selector, () => {
        const reinstalled: boolean = syncObservedElements(watched_group, target_selector);
        if (is_new_subscriber || reinstalled) scheduleRefresh(watched_group);
    });
}

/**
 * Retire l'abonnement enregistré sous `key`, dans quelque zone que ce soit.
 *
 * À appeler dès qu'une fonctionnalité n'a plus lieu d'être — option décochée, page
 * quittée : le dernier abonné parti, l'observateur de la zone est arrêté et cesse
 * donc de réagir aux rendus du jeu.
 */
export function unwatchRendered(key: string): void {
    watch_groups.forEach((group: WatchGroup, target_selector: string) => {
        if (!group.subscribers.delete(key)) return;

        /** Une attente pouvait rester en vol si la zone n'était jamais apparue */
        cancelWaitForElement(`render-watch:${target_selector}:${key}`);

        if (group.subscribers.size > 0) return;

        group.observer?.disconnect();
        group.observer = undefined;
        /** Vidé pour qu'un futur abonnement réinstalle l'observateur */
        group.observed = [];
    });
}

/** Surveille les inventaires du jeu (sac, sol, coffres, escortes) */
export function watchInventory(key: string, onRendered: () => void): void {
    watchRendered(key, 'hordes-inventory', onRendered);
}

/** Surveille la carte du désert (position, zombies au sol, chargement différé) */
export function watchMap(key: string, onRendered: () => void): void {
    watchRendered(key, 'hordes-map', onRendered);
}
