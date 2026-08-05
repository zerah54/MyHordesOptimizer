import { Building } from './building.class';

describe('Building', (): void => {
    it('reads the three Pandémonium tiers when hasHardMode is true', (): void => {
        const building: Building = new Building({
            id: 1, uid: 'small_wallimprove_#00', img: '', label: {}, description: {},
            parentId: null, displayOrder: null,
            pa: 25, defence: 30, maxLife: 25, breakable: true, temporary: false, hasUpgrade: false, rarity: 0,
            resources: [],
            hasHardMode: true,
            tier0Ap: 25, tier0Resources: [],
            tier1Ap: 20, tier1Resources: [],
            tier2Ap: 13,
            hardBlueprintLevel: null,
            availability: { PANDE: 'Disabled' }
        });

        expect(building.has_hard_mode).toBe(true);
        expect(building.tier0_ap).toBe(25);
        expect(building.tier1_ap).toBe(20);
        expect(building.tier2_ap).toBe(13);
        expect(building.availability.PANDE).toBe('Disabled');
    });

    it('reads hardBlueprintLevel when the building is named-overridden in Pandémonium', (): void => {
        const building: Building = new Building({
            id: 1, uid: 'small_wallimprove_#00', img: '', label: {}, description: {},
            parentId: null, displayOrder: null,
            pa: 25, defence: 30, maxLife: 25, breakable: true, temporary: false, hasUpgrade: false, rarity: 0,
            resources: [],
            hasHardMode: true,
            tier0Ap: 25, tier0Resources: [],
            tier1Ap: 20, tier1Resources: [],
            tier2Ap: 13,
            hardBlueprintLevel: 1,
            availability: {}
        });

        expect(building.hard_blueprint_level).toBe(1);
    });

    it('defaults hardBlueprintLevel to null when the DTO omits it', (): void => {
        const building: Building = new Building({
            id: 1, uid: 'x', img: '', label: {}, description: {},
            parentId: null, displayOrder: null,
            pa: 1, defence: 0, maxLife: 0, breakable: false, temporary: false, hasUpgrade: false, rarity: 0,
            resources: [],
            hasHardMode: false,
            tier0Ap: null, tier0Resources: [],
            tier1Ap: null, tier1Resources: [],
            tier2Ap: null,
            hardBlueprintLevel: null,
            availability: {}
        });

        expect(building.hard_blueprint_level).toBeNull();
    });

    it('defaults availability to an empty object when the DTO omits it', (): void => {
        const building: Building = new Building({
            id: 1, uid: 'x', img: '', label: {}, description: {},
            parentId: null, displayOrder: null,
            pa: 1, defence: 0, maxLife: 0, breakable: false, temporary: false, hasUpgrade: false, rarity: 0,
            resources: [],
            hasHardMode: false,
            tier0Ap: null, tier0Resources: [],
            tier1Ap: null, tier1Resources: [],
            tier2Ap: null,
            hardBlueprintLevel: null,
            availability: {}
        });

        expect(building.availability).toEqual({});
    });
});
