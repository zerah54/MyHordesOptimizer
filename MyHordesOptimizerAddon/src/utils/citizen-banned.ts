/** Le jeu marque un citoyen banni par l'icône `banished.gif` à côté de son nom. */
export function isCitizenRowBanned(row: Element): boolean {
    return row.querySelector('.userCell img[src*="banished"]') !== null;
}
