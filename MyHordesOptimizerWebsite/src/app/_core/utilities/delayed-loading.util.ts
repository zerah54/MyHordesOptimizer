export interface DelayedLoadingController {
    start(): void;
    stop(): void;
}

/**
 * Un chargement qui dure moins que `delayMs` ne s'affiche jamais : évite le flash de spinner sur les
 * appels rapides (perçus comme instantanés en dessous de ~100-200ms), tout en gardant un vrai retour
 * visuel sur les appels lents. `setLoading` reste un simple callback (pas couplé à un WritableSignal)
 * pour rester réutilisable avec un BehaviorSubject ou tout autre porteur d'état.
 */
export function createDelayedLoadingController(setLoading: (loading: boolean) => void, delayMs: number = 200): DelayedLoadingController {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    return {
        start(): void {
            timeoutId = setTimeout(() => setLoading(true), delayMs);
        },
        stop(): void {
            if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
                timeoutId = undefined;
            }
            setLoading(false);
        }
    };
}
