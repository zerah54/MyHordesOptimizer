let jsonp_counter: number = 0;

/**
 * Appelle une API en JSONP (contourne l'absence d'en-têtes CORS sur certains endpoints publics,
 * ex. l'oEmbed Dailymotion) via une balise `<script>` injectée, jamais un `fetch`.
 */
export function fetchJsonp(baseUrl: string, timeoutMs: number = 5000): Promise<unknown> {
    return new Promise((resolve: (value: unknown) => void) => {
        const callback_name: string = `mho_jsonp_${jsonp_counter++}`;
        const script: HTMLScriptElement = document.createElement('script');
        let settled: boolean = false;

        const cleanup = (): void => {
            delete (window as unknown as Record<string, unknown>)[callback_name];
            script.remove();
        };

        const settle = (value: unknown): void => {
            if (settled) return;
            settled = true;
            cleanup();
            resolve(value);
        };

        (window as unknown as Record<string, (data: unknown) => void>)[callback_name] = (data: unknown): void => settle(data);

        const separator: string = baseUrl.includes('?') ? '&' : '?';
        script.src = `${baseUrl}${separator}callback=${callback_name}`;
        script.addEventListener('error', () => settle(undefined));
        setTimeout(() => settle(undefined), timeoutMs);

        document.head.appendChild(script);
    });
}
