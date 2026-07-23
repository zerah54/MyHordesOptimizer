/**
 * Attente d'apparition d'un élément dans le document.
 *
 * MyHordes émet `mh-navigation-complete` dès que le HTML de la page est injecté,
 * mais ses composants React (`hordes-inventory`, `#zone-marker`, `hordes-log`, …)
 * sont montés APRÈS. Les initialisations de l'addon rejouées sur cet évènement ne
 * trouvent donc pas toujours leur cible.
 *
 * Les deux compensations historiques sont coûteuses : une cascade de
 * `setTimeout(…, 250)` bornée à quelques essais (qui abandonne trop tôt et
 * réinjecte trop tard), ou un `MutationObserver` sur `document.body` recréé à
 * chaque passage et déconnecté seulement en cas de succès (qui s'accumule).
 *
 * Ce module fournit un point d'attente unique : UN SEUL observateur pour tout
 * l'addon, une attente par clé (la nouvelle remplace l'ancienne, donc aucune
 * accumulation au fil des navigations), et un arrêt automatique de l'observateur
 * dès qu'il n'y a plus rien à attendre.
 */

/** Délai au-delà duquel une attente est abandonnée : la cible ne viendra plus */
const default_wait_timeout: number = 15000;

/** Une attente en cours, identifiée par sa clé */
interface PendingWait {
    /** Sélecteur CSS de la cible */
    selector: string;
    /** Appelé une seule fois, dès que la cible existe */
    onFound: (element: Element) => void;
    /** Appelé si la cible n'est jamais apparue avant la fin du délai */
    onTimeout?: () => void;
    /** Échéance absolue de l'attente */
    expires_at: number;
}

/** Attentes en cours, indexées par clé d'appelant */
const pending_waits: Map<string, PendingWait> = new Map();

/** Observateur unique, créé à la première attente et arrêté dès que la file est vide */
let shared_observer: MutationObserver | undefined;

/** Une évaluation de la file est déjà programmée pour la salve de mutations en cours */
let flush_scheduled: boolean = false;

/** Minuterie d'expiration, réarmée sur la plus proche échéance de la file */
let expiry_timeout: ReturnType<typeof setTimeout> | undefined;

/**
 * Évalue toutes les attentes en cours.
 * Les sélecteurs sont rejoués plutôt que les mutations inspectées : `querySelector`
 * est natif et la file compte au plus quelques entrées, alors qu'une salve de
 * mutations peut contenir des centaines de nœuds sans rapport avec les cibles.
 */
function flushPendingWaits(): void {
    flush_scheduled = false;

    pending_waits.forEach((wait: PendingWait, key: string) => {
        const element: Element | null = document.querySelector(wait.selector);
        if (!element) return;

        pending_waits.delete(key);
        try {
            wait.onFound(element);
        } catch (error) {
            console.error(`MHO - attente d'élément en échec : ${wait.selector}`, error);
        }
    });

    syncObserverState();
}

/** Abandonne les attentes dont l'échéance est passée, puis réarme la minuterie */
function dropExpiredWaits(): void {
    expiry_timeout = undefined;
    const now: number = Date.now();

    pending_waits.forEach((wait: PendingWait, key: string) => {
        if (wait.expires_at > now) return;

        pending_waits.delete(key);
        try {
            wait.onTimeout?.();
        } catch (error) {
            console.error(`MHO - abandon d'attente en échec : ${wait.selector}`, error);
        }
    });

    syncObserverState();
}

/**
 * Aligne l'observateur et la minuterie sur le contenu réel de la file :
 * rien à attendre => plus rien ne tourne.
 */
function syncObserverState(): void {
    if (pending_waits.size === 0) {
        shared_observer?.disconnect();
        shared_observer = undefined;
        if (expiry_timeout !== undefined) {
            clearTimeout(expiry_timeout);
            expiry_timeout = undefined;
        }
        return;
    }

    if (!shared_observer) {
        shared_observer = new MutationObserver(() => {
            /** Une salve de mutations produit des dizaines d'appels : on n'évalue la file qu'une fois par salve */
            if (flush_scheduled) return;
            flush_scheduled = true;
            queueMicrotask(flushPendingWaits);
        });
        shared_observer.observe(document.body, { childList: true, subtree: true });
    }

    /** Minuterie réarmée sur la plus proche échéance restante */
    if (expiry_timeout !== undefined) clearTimeout(expiry_timeout);
    let next_expiry: number = Number.POSITIVE_INFINITY;
    pending_waits.forEach((wait: PendingWait) => {
        if (wait.expires_at < next_expiry) next_expiry = wait.expires_at;
    });
    expiry_timeout = setTimeout(dropExpiredWaits, Math.max(0, next_expiry - Date.now()));
}

/**
 * Exécute `onFound` dès que `selector` correspond à un élément du document.
 *
 * Si la cible est déjà présente, l'appel est immédiat et synchrone : aucun
 * observateur n'est créé. Sinon l'attente est mise en file sous `key` ; une
 * attente déjà enregistrée sous la même clé est remplacée, ce qui rend l'appel
 * sûr à répéter à chaque rejeu des initialisations.
 *
 * @param key       Identifiant stable de l'appelant (une attente au plus par clé)
 * @param selector  Sélecteur CSS de la cible
 * @param onFound   Traitement à exécuter avec la cible
 * @param options   `timeout_ms` : délai d'abandon, `onTimeout` : traitement de repli
 */
export function waitForElement(
    key: string,
    selector: string,
    onFound: (element: Element) => void,
    options: { timeout_ms?: number; onTimeout?: () => void } = {}
): void {
    const existing: Element | null = document.querySelector(selector);
    if (existing) {
        pending_waits.delete(key);
        syncObserverState();
        onFound(existing);
        return;
    }

    /**
     * Une attente identique déjà en file conserve son échéance d'origine : sans cela,
     * les rejeux d'initialisations la repousseraient indéfiniment et l'observateur
     * tournerait sans fin sur une page où la cible n'apparaîtra jamais.
     */
    const previous: PendingWait | undefined = pending_waits.get(key);
    const expires_at: number = previous?.selector === selector
        ? previous.expires_at
        : Date.now() + (options.timeout_ms ?? default_wait_timeout);

    pending_waits.set(key, { selector, onFound, onTimeout: options.onTimeout, expires_at });
    syncObserverState();
}

/**
 * Annule l'attente enregistrée sous `key`, s'il y en a une.
 * À appeler quand la fonctionnalité correspondante est désactivée ou n'a plus
 * lieu d'être sur la page courante.
 */
export function cancelWaitForElement(key: string): void {
    if (!pending_waits.delete(key)) return;
    syncObserverState();
}
