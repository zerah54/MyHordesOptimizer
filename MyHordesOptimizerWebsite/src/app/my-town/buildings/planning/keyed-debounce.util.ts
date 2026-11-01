/** Retarde des actions par clé : seule la dernière action planifiée pour une clé s'exécute, après le délai. */
export class KeyedDebounce {

    private readonly pending: Map<string, { timer: ReturnType<typeof setTimeout>; action: () => void }> = new Map<string, { timer: ReturnType<typeof setTimeout>; action: () => void }>();

    public constructor(private readonly delay_ms: number = 400) {
    }

    /**
     * Planifie une action ; une action déjà planifiée pour la même clé est remplacée.
     * @param {string} key Clé de regroupement (un champ de saisie).
     * @param {() => void} action Action à exécuter après le délai.
     */
    public schedule(key: string, action: () => void): void {
        const existing: { timer: ReturnType<typeof setTimeout>; action: () => void } | undefined = this.pending.get(key);
        if (existing !== undefined) {
            clearTimeout(existing.timer);
        }
        const timer: ReturnType<typeof setTimeout> = setTimeout((): void => {
            this.pending.delete(key);
            action();
        }, this.delay_ms);
        this.pending.set(key, { timer, action });
    }

    /** Exécute immédiatement toutes les actions en attente. */
    public flush(): void {
        const actions: (() => void)[] = Array.from(this.pending.values()).map((entry: { timer: ReturnType<typeof setTimeout>; action: () => void }): () => void => {
            clearTimeout(entry.timer);
            return entry.action;
        });
        this.pending.clear();
        actions.forEach((action: () => void): void => action());
    }

    /** Annule toutes les actions en attente. */
    public cancelAll(): void {
        this.pending.forEach((entry: { timer: ReturnType<typeof setTimeout>; action: () => void }): void => clearTimeout(entry.timer));
        this.pending.clear();
    }
}
