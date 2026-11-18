import { describe, expect, it } from 'vitest';

import { readActiveHeroSkills, readOnboardingHeroSkills } from './hero-skills';

/** Onglet « Capacités actives » (templates/ajax/soul/heroskills_new.html.twig) : niveaux inférieurs puis niveau actif. */
function activeTab(groups: [string, string[]][]): HTMLElement {
    const root: HTMLElement = document.createElement('div');
    root.innerHTML = `<div class="row" x-tab-group="skill-page" x-tab-id="current" x-tab-target>
        <div class="row"><div class="help">…</div></div>
        ${groups.map(([group, levels]) => `<div class="padded cell rw-12"><div class="skills-history">
            <div class="row header"><div class="cell padded rw-12 center">
                ${group}
            </div></div>
            <div class="skills-container">${levels.length === 0 ? '' : `<div class="row-flex v-top gap unlocked"><div class="padded cell rw-12 ability-indicator">
                ${levels.map((level) => `<div><b class="small">${level}</b></div><ul><li>…</li></ul>`).join('<hr class="full-width" />')}
            </div></div>`}</div>
        </div></div>`).join('')}
    </div>`;
    return root;
}

/** Récapitulatif d'entrée en ville (WrapperTownOnboarding.tsx) : métier, puis une ligne par capacité. */
function onboardingDialog(skills: [string, string][]): HTMLElement {
    const dialog: HTMLElement = document.createElement('dialog');
    dialog.innerHTML = `<form method="dialog">
        <div class="row"><div class="padded cell rw-12"><h5>Métier</h5>
            <div class="note note-lightest flex gap"><img alt="Gardien" src="x.gif"/><span><b>Gardien</b></span></div>
        </div></div>
        <div class="row"><div class="padded cell rw-12"><h5>Capacités</h5><div class="flex column gap">
            ${skills.map(([group, level]) => `<div class="note note-lightest flex gap center"><span>${group}</span><span><b>${level}</b></span></div>`).join('')}
            <div class="note note-lightest flex middle center"><span><b>Point non utilisé</b></span></div>
        </div></div></div>
    </form>`;
    return dialog;
}

describe('readActiveHeroSkills', () => {
    it('lit le dernier niveau de chaque groupe, +1, et 0 pour un groupe vide', () => {
        const root: HTMLElement = activeTab([
            ['Stratège', ['Débutant', 'Apprenti', 'Expert']],
            ['Universitaire', ['Débutant']],
            ['Préparé', []],
            ['Endurant', ['Débutant', 'Apprenti', 'Expert', 'Maître']],
            ['Reclus', ['Débutant', 'Apprenti']]
        ]);

        expect(readActiveHeroSkills(root)).toEqual({ S: 3, U: 1, P: 0, E: 4, R: 2 });
    });

    it('reconnaît les groupes et niveaux des autres langues', () => {
        expect(readActiveHeroSkills(activeTab([['Sabio', ['Novato', 'Aprendiz']], ['Eifer', ['Anfänger', 'Lehrling', 'Experte', 'Meister']]])))
            .toEqual({ S: 2, U: 0, P: 0, E: 4, R: 0 });
    });

    it('n\'envoie rien hors ville (onglet absent)', () => {
        expect(readActiveHeroSkills(document.createElement('div'))).toBeUndefined();
    });

    it('n\'envoie rien sur un niveau inconnu', () => {
        expect(readActiveHeroSkills(activeTab([['Stratège', ['Légende']]]))).toBeUndefined();
    });
});

describe('readOnboardingHeroSkills', () => {
    it('lit chaque ligne « groupe | niveau » sans confondre le métier ni les points inutilisés', () => {
        const dialog: HTMLElement = onboardingDialog([
            ['Strategist', 'Beginner'],
            ['University', 'Master'],
            ['Prepared', 'Apprentice'],
            ['Enduring', 'Beginner']
        ]);

        expect(readOnboardingHeroSkills(dialog)).toEqual({ S: 1, U: 4, P: 2, E: 1, R: 0 });
    });

    it('n\'envoie rien sans capacité affichée (métier non héros)', () => {
        expect(readOnboardingHeroSkills(onboardingDialog([]))).toBeUndefined();
    });
});
