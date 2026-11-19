import { HomeEnum } from '../../../_abstract_model/enum/home.enum';
import { CitizenRef } from './plan-evaluation.util';
import { BuildingPlanContentDTO, emptyPlanContent, PlanTownLineDTO } from './plan.types';
import { resolveTownLinePa, sourcePa } from './town-line-source.util';

/** Citoyen de test, avec un niveau de Coin sieste (nul = pas de données de maison). */
function citizen(userId: number, banned: boolean = false, rest: number | null = 0): CitizenRef {
    return {
        userId,
        name: `c${userId}`,
        banned,
        technician: false,
        homeLevel: null,
        upgradeLevels: rest === null ? null : new Map<string, number>([[HomeEnum.REST_LEVEL.key, rest]])
    };
}

/** Plusieurs citoyens non bannis sans Coin sieste. */
function many(count: number, banned: boolean = false, offset: number = 0): CitizenRef[] {
    return Array.from({ length: count }, (_: unknown, index: number): CitizenRef => citizen(offset + index + 1, banned));
}

describe('town-line-source.util', (): void => {
    describe('sourcePa', (): void => {
        it('dés, cartes et guitare : moyenne arrondie en dessous sur le nombre de citoyens', (): void => {
            expect(sourcePa('dice', many(12))).toBe(2);
            expect(sourcePa('cards', many(12))).toBe(1);
            expect(sourcePa('guitar', many(12))).toBe(12);
            expect(sourcePa('dice', many(5))).toBe(0);
            expect(sourcePa('cards', many(5))).toBe(0);
        });

        it('Coin sieste : 2 PA × chance de réussite selon le niveau, arrondi sur le total', (): void => {
            expect(sourcePa('rest', [citizen(1, false, 1), citizen(2, false, 1), citizen(3, false, 2), citizen(4, false, 3)])).toBe(4);
            expect(sourcePa('rest', [citizen(1, false, 1), citizen(2, false, 1), citizen(3, false, 1)])).toBe(2);
        });

        it('Coin sieste : niveau 0 ou maison inconnue = 0', (): void => {
            expect(sourcePa('rest', [citizen(1, false, 0), citizen(2, false, null)])).toBe(0);
        });
    });

    describe('resolveTownLinePa', (): void => {
        const content: BuildingPlanContentDTO = emptyPlanContent();
        const town: CitizenRef[] = [...many(2, true), ...many(5, false, 10)];

        it('ligne libre : valeur saisie', (): void => {
            const line: PlanTownLineDTO = { label: 'x', pool: 'regular', pa: 7 };
            expect(resolveTownLinePa(line, town, content)).toBe(7);
        });

        it('ligne liée : calcul sur les citoyens de sa poche', (): void => {
            expect(resolveTownLinePa({ label: 'g', pool: 'banned', pa: 0, source: 'guitar' }, town, content)).toBe(2);
            expect(resolveTownLinePa({ label: 'g', pool: 'regular', pa: 0, source: 'guitar' }, town, content)).toBe(5);
        });

        it('ligne liée : bannissement simulé dans le plan', (): void => {
            const simulated: BuildingPlanContentDTO = { ...emptyPlanContent(), citizens: [{ userId: 11, tasks: [], banned: true }] };
            expect(resolveTownLinePa({ label: 'g', pool: 'banned', pa: 0, source: 'guitar' }, town, simulated)).toBe(3);
        });

        it('ligne forcée : valeur saisie quelle que soit la population', (): void => {
            expect(resolveTownLinePa({ label: 'g', pool: 'regular', pa: 9, source: 'guitar', manual: true }, town, content)).toBe(9);
        });
    });
});
