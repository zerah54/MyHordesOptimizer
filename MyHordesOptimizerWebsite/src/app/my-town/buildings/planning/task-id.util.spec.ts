import { BuildingPlanContentDTO, emptyPlanContent } from './plan.types';
import { newTaskId, withTaskIds } from './task-id.util';

describe('newTaskId', (): void => {
    it('produit un identifiant court accepté par l\'API, différent à chaque appel', (): void => {
        const first: string = newTaskId();

        expect(first).toMatch(/^[a-z0-9]{10}$/);
        expect(newTaskId()).not.toBe(first);
    });
});

describe('withTaskIds', (): void => {
    /**
     * Contenu avec deux consignes pour le citoyen 4, la seconde déjà identifiée.
     * @returns {BuildingPlanContentDTO} Contenu.
     */
    function content(): BuildingPlanContentDTO {
        return {
            ...emptyPlanContent(),
            citizens: [{ userId: 4, tasks: [{ kind: 'free', label: 'a', pa: 0 }, { id: 'abc', kind: 'free', label: 'b', pa: 0 }] }]
        };
    }

    it('donne un identifiant déterministe (proposition, citoyen, rang) aux consignes qui n\'en ont pas, garde les autres', (): void => {
        const result: BuildingPlanContentDTO = withTaskIds(content(), 7);

        expect(result.citizens[0].tasks.map((task: { id?: string | null }): string | null | undefined => task.id)).toEqual(['p7u4t0', 'abc']);
        expect(withTaskIds(content(), 7).citizens[0].tasks[0].id).toBe('p7u4t0');
    });

    it('ne modifie pas le contenu reçu et le renvoie tel quel s\'il est complet', (): void => {
        const source: BuildingPlanContentDTO = content();
        withTaskIds(source, 7);

        expect(source.citizens[0].tasks[0].id).toBeUndefined();
        const complete: BuildingPlanContentDTO = withTaskIds(source, 7);
        expect(withTaskIds(complete, 7)).toBe(complete);
    });
});
