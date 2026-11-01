import { BuildingDTO } from '../../_abstract_model/dto/building.dto';
import { Building } from '../../_abstract_model/types/building.class';
import { buildingCost } from './building-cost.util';

function dto(overrides: Partial<BuildingDTO> = {}): BuildingDTO {
    return {
        id: 1, uid: 'b', img: '', label: { fr: 'B' }, description: { fr: '' }, parentId: null, displayOrder: 0,
        pa: 40, defence: 0, maxLife: 30, breakable: true, temporary: false, hasUpgrade: false, rarity: 0,
        resources: [{ itemId: 5, uid: 'wood', img: '', label: { fr: 'Bois' }, count: 2 }],
        hasHardMode: true, tier0Ap: 60, tier1Ap: 50, tier2Ap: 40,
        tier0Resources: [{ itemId: 5, uid: 'wood', img: '', label: { fr: 'Bois' }, count: 6 }],
        tier1Resources: [{ itemId: 5, uid: 'wood', img: '', label: { fr: 'Bois' }, count: 4 }],
        hardBlueprintLevel: null, availability: {},
        ...overrides
    };
}

describe('buildingCost', (): void => {
    it('hors Pandémonium, renvoie le jeu par défaut quel que soit le palier', (): void => {
        const cost: { ap: number | null; resources: { count: number }[] } = buildingCost(new Building(dto()), false, 2);
        expect(cost.ap).toBe(40);
        expect(cost.resources[0].count).toBe(2);
    });

    it('en Pandémonium, lit le palier demandé (le palier 2 garde les ressources du palier 1)', (): void => {
        const building: Building = new Building(dto());
        expect(buildingCost(building, true, 0).ap).toBe(60);
        expect(buildingCost(building, true, 0).resources[0].count).toBe(6);
        expect(buildingCost(building, true, 1).ap).toBe(50);
        expect(buildingCost(building, true, 2).ap).toBe(40);
        expect(buildingCost(building, true, 2).resources[0].count).toBe(4);
    });

    it('en Pandémonium sans jeu Pandémonium, replie sur le jeu par défaut', (): void => {
        const building: Building = new Building(dto({ hasHardMode: false, tier0Ap: null, tier1Ap: null, tier2Ap: null }));
        expect(buildingCost(building, true, 1).ap).toBe(40);
    });
});
