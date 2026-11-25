/** Fourni par Firefox aux content scripts : copie un objet dans le monde d'une fenêtre de la page */
declare const cloneInto: ((value: unknown, target: Window) => unknown) | undefined;

/**
 * Rend un objet lisible par les scripts de la page : sous Firefox, un objet créé par le content
 * script (ex. `detail` d'un `CustomEvent`) est inaccessible à la page sans `cloneInto`.
 */
export function toPageWorld<T>(value: T): T {
    return typeof cloneInto === 'function' && document.defaultView ? cloneInto(value, document.defaultView) as T : value;
}
