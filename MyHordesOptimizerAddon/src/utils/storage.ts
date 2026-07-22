/**
 * Exécute un accès au stockage en ramenant tous ses modes d'échec à un rejet de promesse.
 *
 * Les backends ne signalent pas leurs erreurs de la même façon : un gestionnaire de
 * userscript absent lève une `ReferenceError` synchrone, tandis qu'un stockage présent
 * mais indisponible (quota, permission) rejette sa promesse. Les deux doivent conduire
 * au backend suivant, faute de quoi la promesse retournée à l'appelant reste en attente
 * indéfiniment — et `bootstrap()` étant attendu au démarrage, l'addon ne démarre alors
 * jamais, silencieusement.
 */
function tryStorageBackend<T>(access: () => Promise<T>): Promise<T> {
    try {
        return Promise.resolve(access());
    } catch (error) {
        return Promise.reject(error);
    }
}

/**
 * Lit une valeur persistée, en essayant successivement le gestionnaire de userscript
 * puis les API d'extension.
 * @param {string} key    La clé à lire
 * @returns {Promise<any>}    La valeur lue, ou undefined si aucun backend n'a répondu
 */
export function getStorageItem(key: string): Promise<any> {
    return tryStorageBackend(() => GM.getValue(key))
        .catch(() => tryStorageBackend(() => browser.storage.local.get(key).then((result: Record<string, unknown>) => result[key])))
        .catch(() => tryStorageBackend(() => chrome.storage.local.get(key).then((result: Record<string, unknown>) => result[key])))
        .catch((error: unknown) => {
            // Aucun backend de stockage disponible : on résout quand même
            // pour ne jamais laisser la promesse en attente indéfiniment
            console.error('MHO - lecture du stockage impossible', error);
            return undefined;
        });
}

/**
 * Écrit une valeur persistée, en essayant successivement le gestionnaire de userscript
 * puis les API d'extension.
 * @param {string} key    La clé à écrire
 * @param {any} value    La valeur à persister
 * @returns {Promise<void>}    Résolue même en cas d'échec : aucun appelant ne doit rester bloqué
 */
export function setStorageItem(key: string, value: unknown): Promise<void> {
    return tryStorageBackend<void>(() => GM.setValue(key, value))
        .catch((): Promise<void> => tryStorageBackend<void>(() => browser.storage.local.set({ [key]: value })))
        .catch((): Promise<void> => tryStorageBackend<void>(() => chrome.storage.local.set({ [key]: value })))
        .catch((error: unknown): void => {
            console.error('MHO - écriture dans le stockage impossible', error);
        });
}
