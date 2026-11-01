import { JobEnum } from '../enum/job.enum';
import { hasHeroSkills, heroSkillGroupNames, heroSkillLevelForJob, heroSkillSummary } from './hero-skill-levels';

describe('hasHeroSkills', (): void => {
    it('vrai pour tout métier sauf Habitant', (): void => {
        expect(hasHeroSkills(JobEnum.CITIZEN)).toBe(false);
        expect(hasHeroSkills(JobEnum.SCOUT)).toBe(true);
        expect(hasHeroSkills(undefined)).toBe(true);
    });
});

describe('heroSkillLevelForJob', (): void => {
    it('force 0 pour un habitant, quel que soit le niveau enregistré', (): void => {
        expect(heroSkillLevelForJob(JobEnum.CITIZEN, null)).toBe(0);
        expect(heroSkillLevelForJob(JobEnum.CITIZEN, 3)).toBe(0);
    });

    it('un héros n\'a jamais 0 : inconnu à la place, ses niveaux 1 à 4 inchangés', (): void => {
        expect(heroSkillLevelForJob(JobEnum.SCOUT, 0)).toBeNull();
        expect(heroSkillLevelForJob(JobEnum.SCOUT, null)).toBeNull();
        expect(heroSkillLevelForJob(JobEnum.SCOUT, 4)).toBe(4);
    });
});

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
