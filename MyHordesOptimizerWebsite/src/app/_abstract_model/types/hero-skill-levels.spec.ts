import { heroSkillGroupNames, heroSkillSummary } from './hero-skill-levels';

describe('heroSkillGroupNames', (): void => {
    it('nom de chaque groupe d\'après les compétences actuelles, repli sur l\'allemand puis sur la lettre', (): void => {
        const names: Record<string, string> = heroSkillGroupNames([
            { legacy: true, group: { fr: 'Ancien' }, group_sort: 0 },
            { legacy: false, group: { fr: 'Stratégie' }, group_sort: 0 },
            { legacy: false, group: { de: 'Vorsicht' }, group_sort: 1 }
        ], 'fr');

        expect(names).toEqual({ s: 'Stratégie', u: 'Vorsicht', p: 'P', e: 'E', r: 'R' });
    });
});

describe('heroSkillSummary', (): void => {
    it('groupe et nom du niveau ; rien pour un niveau nul ou inconnu', (): void => {
        expect(heroSkillSummary('Stratégie', 3)).toBe('Stratégie : Expert');
        expect(heroSkillSummary('Stratégie', 0)).toBeNull();
        expect(heroSkillSummary('Stratégie', null)).toBeNull();
    });
});
