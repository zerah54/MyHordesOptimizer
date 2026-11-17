import { Citizen } from '../_abstract_model/types/citizen.class';
import { NightwatchCitizenStateDTO } from '../my-town/nightwatch/nightwatch.types';

/** Bornes du nombre de citoyens simulés d'une pré-ville, alignées sur le serveur (80 = population max d'une ville privée). */
export const MIN_SIMULATED_CITIZENS: number = 1;
export const MAX_SIMULATED_CITIZENS: number = 80;

/**
 * Nom affiché d'un citoyen simulé.
 * @param {number} n Rang du citoyen (à partir de 1).
 * @returns {string} Nom affiché.
 */
function simulatedName(n: number): string {
    return $localize`Citoyen ${n}:n:`;
}

/**
 * Citoyens fictifs d'une pré-ville, pour chiffrer les Chantiers : identifiants -1…-N, vivants, non bannis.
 * @param {number} count Nombre de citoyens.
 * @returns {Citizen[]} Citoyens simulés.
 */
export function simulatedCitizens(count: number): Citizen[] {
    return Array.from({ length: count }, (_: unknown, index: number): Citizen =>
        Object.assign(new Citizen(), { id: -(index + 1), name: simulatedName(index + 1), is_dead: false, is_shunned: false }));
}

/**
 * Citoyens fictifs d'une pré-ville, pour les Veilles : mêmes identifiants et noms, sans état ni objets.
 * @param {number} count Nombre de citoyens.
 * @returns {NightwatchCitizenStateDTO[]} États simulés.
 */
export function simulatedNightwatchCitizens(count: number): NightwatchCitizenStateDTO[] {
    return Array.from({ length: count }, (_: unknown, index: number): NightwatchCitizenStateDTO => ({
        userId: -(index + 1), name: simulatedName(index + 1),
        isShunned: false, isGhoul: false, isDrugged: false, isDrunk: false, isThirsty: false, isImmune: false,
        bag: {}, bagBroken: {}, chest: {}, chestBroken: {}, chestUpdatedAt: null, bagUpdatedAt: null
    }));
}
