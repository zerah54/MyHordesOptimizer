import { Building, BuildingResource } from '../../_abstract_model/types/building.class';

/**
 * Coût d'un chantier au palier demandé. Replie sur le jeu par défaut hors Pandémonium ou si le chantier n'a pas de jeu Pandémonium.
 * @param {Building} building Chantier du référentiel.
 * @param {boolean} hard_mode Vrai en Pandémonium.
 * @param {0 | 1 | 2} tier Nombre de plans lus (0 à 2), sans effet hors Pandémonium.
 * @returns {{ ap: number | null; resources: BuildingResource[] }} Coût en PA et ressources.
 */
export function buildingCost(building: Building, hard_mode: boolean, tier: 0 | 1 | 2): { ap: number | null; resources: BuildingResource[] } {
    if (!hard_mode || !building.has_hard_mode) {
        return { ap: building.pa, resources: building.resources };
    }
    switch (tier) {
        case 0:
            return { ap: building.tier0_ap, resources: building.tier0_resources };
        case 1:
            return { ap: building.tier1_ap, resources: building.tier1_resources };
        case 2:
            return { ap: building.tier2_ap, resources: building.tier1_resources };
    }
}
