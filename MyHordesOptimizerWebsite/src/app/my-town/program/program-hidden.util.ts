/** Bloc masquable de la page « Mon programme ». */
export type ProgramBlock = 'expedition' | 'buildings';

/** Clé de stockage du masquage d'un bloc pour une ville et un jour. */
// ponytail: les clés des jours passés ne sont jamais purgées (quelques octets par jour), purge à l'ouverture si besoin
export function hiddenKey(town_id: number, day: number, block: ProgramBlock): string {
    return `mho-program-hidden-${town_id}-${day}-${block}`;
}

/** Stockage du navigateur, nul s'il est inaccessible. */
export function safeStorage(): Storage | null {
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

/** Vrai si le bloc est masqué ; toute erreur de stockage compte comme non masqué. */
export function isHidden(storage: Storage | null, key: string): boolean {
    if (storage === null) {
        return false;
    }
    try {
        return storage.getItem(key) === '1';
    } catch {
        return false;
    }
}

/** Mémorise ou oublie le masquage ; une erreur de stockage est ignorée. */
export function setHidden(storage: Storage | null, key: string, hidden: boolean): void {
    if (storage === null) {
        return;
    }
    try {
        if (hidden) {
            storage.setItem(key, '1');
        } else {
            storage.removeItem(key);
        }
    } catch {
        // stockage indisponible : le bloc reste affiché
    }
}
