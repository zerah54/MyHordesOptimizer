import { defenseGap, projectedDefense, rankByDefPerPa, RankCandidate, RankedCandidate } from './defense.util';

describe('defense.util', (): void => {
    it('projectedDefense additionne la base, les chantiers, les réparations, les maisons et les sources', (): void => {
        expect(projectedDefense({
            baseDefense: 1000, completedBuildingsDef: 100, repairsDef: 20, homesDef: 30,
            sources: [{ def: 2, qty: 10 }, { def: 5, qty: 0 }]
        })).toBe(1170);
    });

    it('defenseGap : reste à couvrir positif, surplus négatif', (): void => {
        expect(defenseGap(1443, 21, 1352)).toBe(70);
        expect(defenseGap(1000, 0, 1100)).toBe(-100);
    });

    describe('rankByDefPerPa', (): void => {
        const values: Map<number, number> = new Map([[5, 2]]);

        it('coût réel = PA + valeur des ressources, tri par déf/coût décroissant', (): void => {
            const ranked: RankedCandidate[] = rankByDefPerPa([
                { label: 'Mur', kind: 'building', def: 30, pa: 20, resources: [{ itemId: 5, count: 5 }] },
                { label: 'Fossé', kind: 'building', def: 60, pa: 20, resources: [] },
                { label: 'OD', kind: 'source', def: 2, pa: 1, resources: [] }
            ], values);

            expect(ranked.map((r: RankedCandidate): string => r.label)).toEqual(['Fossé', 'OD', 'Mur']);
            expect(ranked[0].ratio).toBe(3);
            expect(ranked[1].ratio).toBe(2);
            expect(ranked[2].realCost).toBe(30);
            expect(ranked[2].ratio).toBe(1);
        });

        it('un objet sans valeur compte 0 et est listé', (): void => {
            const ranked: RankedCandidate[] = rankByDefPerPa([{ label: 'X', kind: 'building', def: 10, pa: 10, resources: [{ itemId: 9, count: 3 }] }], values);
            expect(ranked[0].realCost).toBe(10);
            expect(ranked[0].missingValueItemIds).toEqual([9]);
        });

        it('coût nul : ratio infini avec de la défense, nul sans', (): void => {
            const candidates: RankCandidate[] = [
                { label: 'Gratuit', kind: 'home', def: 5, pa: 0, resources: [] },
                { label: 'Rien', kind: 'home', def: 0, pa: 0, resources: [] },
                { label: 'Normal', kind: 'building', def: 10, pa: 10, resources: [] }
            ];
            const ranked: RankedCandidate[] = rankByDefPerPa(candidates, values);
            expect(ranked.map((r: RankedCandidate): string => r.label)).toEqual(['Gratuit', 'Normal', 'Rien']);
            expect(ranked[0].ratio).toBe(Infinity);
            expect(ranked[2].ratio).toBeNull();
        });

        it('à ratio égal, trie par libellé', (): void => {
            const ranked: RankedCandidate[] = rankByDefPerPa([
                { label: 'B', kind: 'building', def: 10, pa: 10, resources: [] },
                { label: 'A', kind: 'building', def: 10, pa: 10, resources: [] }
            ], values);
            expect(ranked.map((r: RankedCandidate): string => r.label)).toEqual(['A', 'B']);
        });
    });
});
