import { HeroSkillDTO } from '../../_abstract_model/dto/hero-skill.dto';
import { HeroSkill } from '../../_abstract_model/types/hero-skill.class';
import { buildHeroSkillTree, citizenBaseGroup, HeroSkillGroupView } from './hero-skills.util';

function makeSkill(dto: Partial<HeroSkillDTO>): HeroSkill {
    return new HeroSkill({ name: 'skill', description: {}, icon: '', label: {}, nbUses: 0, daysNeeded: 0, ...dto });
}

describe('hero-skills.util', (): void => {
    it('keeps only the skills of the tree, grouped in game order then by level', (): void => {
        const tree: HeroSkillGroupView[] = buildHeroSkillTree([
            makeSkill({ name: 'manipulator', legacy: true, daysNeeded: 3 }),
            makeSkill({ name: 'hero_generic_find', group: null }),
            makeSkill({ name: 'super_university_1', group: { fr: 'Universitaire', de: 'Umsicht' }, groupSort: 1, level: 1, bullets: { fr: ['B'] } }),
            makeSkill({ name: 'super_strategist_0', group: { fr: 'Stratège', de: 'Strategie' }, groupSort: 0, level: 0, bullets: { fr: ['A'] } }),
            makeSkill({ name: 'super_university_0', group: { fr: 'Universitaire', de: 'Umsicht' }, groupSort: 1, level: 0, bullets: { fr: ['C'] } })
        ], 'fr');

        expect(tree.map((group: HeroSkillGroupView): string => group.name)).toEqual(['Stratège', 'Universitaire']);
        expect(tree[1].levels.map((level: { bullets: readonly string[] }): string => level.bullets[0])).toEqual(['C', 'B']);
        expect(tree[1].levels.map((level: { name: string }): string => level.name)).toEqual(['Débutant', 'Apprenti']);
    });

    it('falls back on German, the language of the game source, when a translation is missing', (): void => {
        const tree: HeroSkillGroupView[] = buildHeroSkillTree([
            makeSkill({ name: 'super_rest_2', group: { de: 'Ruhe', fr: '' }, groupSort: 4, level: 2, daysNeeded: 40, bullets: { de: ['Etwas'], fr: [] } })
        ], 'fr');

        expect(tree[0].name).toBe('Ruhe');
        expect(tree[0].levels[0]).toEqual({ name: 'Expert', points_needed: 40, bullets: ['Etwas'] });
    });

    it('describes what every citizen has', (): void => {
        const base: HeroSkillGroupView = citizenBaseGroup();

        expect(base.levels.length).toBe(1);
        expect(base.levels[0].bullets.length).toBe(4);
    });
});
