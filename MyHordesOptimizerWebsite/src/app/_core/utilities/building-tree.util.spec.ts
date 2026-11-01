import { Building, BuildingResource } from '../../_abstract_model/types/building.class';
import { availabilityIn, buildBuildingTree, flattenBuildingTree, hasReachablePlanLevel, planStepperIcon, usefulPlanReadings } from './building-tree.util';

function building(id: number, label: string, parent_id: number | null = null, display_order: number = 0): Building {
    const result: Building = new Building();
    result.id = id;
    result.uid = `b${id}`;
    result.label = { fr: label };
    result.parent_id = parent_id;
    result.display_order = display_order;
    return result;
}

function names(list: Building[]): string[] {
    return list.map((entry: Building): string => entry.label['fr']);
}

describe('building-tree.util', (): void => {
    describe('buildBuildingTree', (): void => {
        it('rattache les enfants, calcule la profondeur et trie par rang puis nom', (): void => {
            const { roots, by_id }: { roots: Building[]; by_id: Map<number, Building> } = buildBuildingTree([
                building(1, 'Mur', null, 1),
                building(2, 'Porte', null, 0),
                building(3, 'Zèbre', 1),
                building(4, 'Abri', 1)
            ], 'fr');
            expect(names(roots)).toEqual(['Porte', 'Mur']);
            expect(names(roots[1].children)).toEqual(['Abri', 'Zèbre']);
            expect(by_id.get(3)?.depth).toBe(1);
        });

        it('un enfant dont le parent est absent remonte à la racine', (): void => {
            expect(names(buildBuildingTree([building(3, 'Orphelin', 99)], 'fr').roots)).toEqual(['Orphelin']);
        });
    });

    describe('flattenBuildingTree', (): void => {
        const tree: () => Building[] = (): Building[] => buildBuildingTree([building(1, 'Mur'), building(3, 'Barbelés', 1), building(5, 'Rasoir', 3)], 'fr').roots;
        const shown: () => boolean = (): boolean => true;

        it('aplatit en profondeur d\'abord', (): void => {
            expect(names(flattenBuildingTree(tree(), { collapsed: new Set<number>(), filter: '', locale: 'fr', isShown: shown }))).toEqual(['Mur', 'Barbelés', 'Rasoir']);
        });

        it('un chantier replié masque ses évolutions', (): void => {
            expect(names(flattenBuildingTree(tree(), { collapsed: new Set<number>([3]), filter: '', locale: 'fr', isShown: shown }))).toEqual(['Mur', 'Barbelés']);
        });

        it('la recherche garde la branche ascendante et ignore les replis', (): void => {
            expect(names(flattenBuildingTree(tree(), { collapsed: new Set<number>([1]), filter: 'rasoi', locale: 'fr', isShown: shown }))).toEqual(['Mur', 'Barbelés', 'Rasoir']);
        });

        it('un chantier masqué est omis, ses évolutions restent parcourues', (): void => {
            const result: Building[] = flattenBuildingTree(tree(), { collapsed: new Set<number>(), filter: '', locale: 'fr', isShown: (entry: Building): boolean => entry.id !== 3 });
            expect(names(result)).toEqual(['Mur', 'Rasoir']);
        });
    });

    describe('availabilityIn', (): void => {
        it('lit la disponibilité du type de ville, nulle sans type', (): void => {
            const entry: Building = building(1, 'Mur');
            entry.availability = { RNE: 'Disabled', PANDE: 'Initial' };
            expect(availabilityIn(entry, 'RNE')).toBe('Disabled');
            expect(availabilityIn(entry, 'PANDE')).toBe('Initial');
            expect(availabilityIn(entry, 'RE')).toBeNull();
            expect(availabilityIn(entry, null)).toBeNull();
        });
    });

    describe('niveaux de plan', (): void => {
        it('usefulPlanReadings : 0 sans mécanique Pandémonium, 2 quand la 2e lecture baisse encore les PA', (): void => {
            const plain: Building = building(1, 'Mur');
            plain.has_hard_mode = false;
            expect(usefulPlanReadings(plain)).toBe(0);

            const evolutive: Building = building(2, 'Muraille évolutive');
            evolutive.has_hard_mode = true;
            evolutive.tier0_ap = 40;
            evolutive.tier1_ap = 40;
            evolutive.tier2_ap = 28;
            const hard: BuildingResource = Object.assign(new BuildingResource(), { item_id: 1, count: 6 });
            const easy: BuildingResource = Object.assign(new BuildingResource(), { item_id: 1, count: 1 });
            evolutive.tier0_resources = [hard];
            evolutive.tier1_resources = [easy];
            expect(usefulPlanReadings(evolutive)).toBe(2);
        });

        it('hasReachablePlanLevel : faux pour une rareté 0 sans niveau nommé', (): void => {
            const entry: Building = building(1, 'Portail');
            entry.rarity = 0;
            entry.hard_blueprint_level = null;
            expect(hasReachablePlanLevel(entry)).toBe(false);
            entry.hard_blueprint_level = 1;
            expect(hasReachablePlanLevel(entry)).toBe(true);
        });

        it('planStepperIcon : icône du niveau nommé, rien pour la rareté 0, icône générique pour un niveau inconnu', (): void => {
            const entry: Building = building(1, 'X');
            entry.rarity = 0;
            entry.hard_blueprint_level = 2;
            expect(planStepperIcon(entry)).toBe('item/item_bplan_u.gif');
            entry.hard_blueprint_level = null;
            expect(planStepperIcon(entry)).toBe('');
            entry.rarity = 99;
            expect(planStepperIcon(entry)).toBe('item/item_bplan_c.gif');
        });
    });
});
