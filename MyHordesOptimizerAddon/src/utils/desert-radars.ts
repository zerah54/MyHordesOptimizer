/** Radar du Fouineur : `true` = la case voisine est épuisée, `undefined` = direction absente de la page */
export interface ScavNextCells {
    north?: boolean;
    east?: boolean;
    south?: boolean;
    west?: boolean;
}

/** Radar de l'Éclaireur : estimation du nombre de zombies sur la case voisine */
export interface ScoutNextCells {
    north?: number;
    east?: number;
    south?: number;
    west?: number;
}

/** Lit le radar du Fouineur sur la page du désert. */
export function getScavNextCells(): ScavNextCells {
    return {
        north: document.querySelector('.scavenger-sense-north') ? !document.querySelector('.scavenger-sense-north.scavenger-sense-1') : undefined,
        east: document.querySelector('.scavenger-sense-east') ? !document.querySelector('.scavenger-sense-east.scavenger-sense-1') : undefined,
        south: document.querySelector('.scavenger-sense-south') ? !document.querySelector('.scavenger-sense-south.scavenger-sense-1') : undefined,
        west: document.querySelector('.scavenger-sense-west') ? !document.querySelector('.scavenger-sense-west.scavenger-sense-1') : undefined
    };
}

/** Lit le radar de l'Éclaireur sur la page du désert. */
export function getScoutNextCells(): ScoutNextCells {
    return {
        north: document.querySelector('.scout-sense-north') ? +document.querySelector('.scout-sense-north').querySelector('text')?.innerHTML : undefined,
        east: document.querySelector('.scout-sense-east') ? +document.querySelector('.scout-sense-east').querySelector('text')?.innerHTML : undefined,
        south: document.querySelector('.scout-sense-south') ? +document.querySelector('.scout-sense-south').querySelector('text')?.innerHTML : undefined,
        west: document.querySelector('.scout-sense-west') ? +document.querySelector('.scout-sense-west').querySelector('text')?.innerHTML : undefined
    };
}
