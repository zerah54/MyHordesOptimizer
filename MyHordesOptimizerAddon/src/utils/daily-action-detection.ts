/** true = déjà faite aujourd'hui, false = disponible mais pas faite, undefined = chantier non construit. */
export function detectDailyActionDone(iconMatch: string): boolean | undefined {
    const row = document.querySelector(`.heroic_action img[src*=${iconMatch}]`)?.parentElement;
    if (!row) return undefined;
    return !!(row.attributes as any).disabled;
}
