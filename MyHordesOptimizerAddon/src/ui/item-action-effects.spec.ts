import { describe, expect, it, vi } from 'vitest';

import type { MhoActionOutcome, MhoItem, MhoItemActionEffects, MhoItemSummary } from '../types';
import { getItemExtraSections } from './item-action-effects';

vi.hoisted((): void => {
    document.documentElement.lang = 'fr';
});

function summary(uid: string, img: string): MhoItemSummary {
    return { uid, img, label: { fr: uid, en: uid, de: uid, es: uid } };
}

function baseItem(overrides: Partial<MhoItem> = {}): MhoItem {
    return { id: 1, img: 'item/item_x.gif', label: { fr: 'X', en: 'X', de: 'X', es: 'X' }, ...overrides };
}

function text(sections: HTMLDivElement[]): string {
    return sections.map((s: HTMLDivElement) => s.textContent).join('|');
}

describe('getItemExtraSections', () => {
    it('renvoie un tableau vide sans données nouvelles', () => {
        expect(getItemExtraSections(baseItem())).toEqual([]);
    });

    it('affiche le contenu d\'un contenant', () => {
        const effect: MhoItemActionEffects = {
            actionName: 'open', kind: 'Open', outcomes: [
                { kind: 'Produced', probability: 0.255, item: summary('wood', 'item/item_wood.gif'), quantity: 2 },
                { kind: 'Consumed', probability: 1 }
            ]
        };
        const sections: HTMLDivElement[] = getItemExtraSections(baseItem({ actionEffects: [effect] }));
        expect(sections.length).toBe(1);
        expect(sections[0].querySelector('img[src*="item/item_wood.gif"]')).not.toBeNull();
        expect(sections[0].textContent).toContain('25,5 %');
        expect(sections[0].textContent).toContain('2');
    });

    it('n\'affiche que la variante d\'animal qui s\'applique', () => {
        const mk = (built: boolean, applies: boolean | null, img: string): MhoItemActionEffects => ({
            actionName: 'slaughter', kind: 'Slaughter', appliesToTown: applies,
            buildingCondition: { buildingUid: 'trap', built },
            outcomes: [{ kind: 'Produced', probability: 1, item: summary(img, img), quantity: 1 }]
        });
        const sections: HTMLDivElement[] = getItemExtraSections(baseItem({ actionEffects: [mk(true, false, 'item/a.gif'), mk(false, true, 'item/b.gif')] }));
        expect(sections.length).toBe(1);
        expect(sections[0].querySelector('img[src*="item/b.gif"]')).not.toBeNull();
        expect(sections[0].querySelector('img[src*="item/a.gif"]')).toBeNull();
    });

    describe('variantes d animal à noms différents', () => {
        const mk = (name: string, built: boolean, applies: boolean | null, img: string): MhoItemActionEffects => ({
            actionName: name, kind: 'Attack', appliesToTown: applies,
            buildingCondition: { buildingUid: 'small_pet_#00', built },
            outcomes: [{ kind: 'Produced', probability: 1, item: summary(img, img), quantity: 1 }]
        });

        it('chantier construit : seule la variante construite', () => {
            const sections: HTMLDivElement[] = getItemExtraSections(baseItem({ actionEffects: [mk('throw_animal', false, false, 'item/a.gif'), mk('throw_animal_t1', true, true, 'item/b.gif')] }));
            expect(sections.length).toBe(1);
            expect(sections[0].querySelector('img[src*="item/b.gif"]')).not.toBeNull();
        });

        it('chantier absent : seule la variante sans chantier', () => {
            const sections: HTMLDivElement[] = getItemExtraSections(baseItem({ actionEffects: [mk('throw_animal', false, true, 'item/a.gif'), mk('throw_animal_t1', true, false, 'item/b.gif')] }));
            expect(sections.length).toBe(1);
            expect(sections[0].querySelector('img[src*="item/a.gif"]')).not.toBeNull();
        });

        it('ville inconnue : seule la variante sans chantier', () => {
            const sections: HTMLDivElement[] = getItemExtraSections(baseItem({ actionEffects: [mk('throw_animal', false, null, 'item/a.gif'), mk('throw_animal_t1', true, null, 'item/b.gif')] }));
            expect(sections.length).toBe(1);
            expect(sections[0].querySelector('img[src*="item/a.gif"]')).not.toBeNull();
        });
    });

    it('sans marquage, suppose le chantier non construit', () => {
        const mk = (built: boolean, img: string): MhoItemActionEffects => ({
            actionName: 'slaughter', kind: 'Slaughter',
            buildingCondition: { buildingUid: 'trap', built },
            outcomes: [{ kind: 'Produced', probability: 1, item: summary(img, img), quantity: 1 }]
        });
        const sections: HTMLDivElement[] = getItemExtraSections(baseItem({ actionEffects: [mk(true, 'item/a.gif'), mk(false, 'item/b.gif')] }));
        expect(sections.length).toBe(1);
        expect(sections[0].querySelector('img[src*="item/b.gif"]')).not.toBeNull();
    });

    it('affiche les charges de l\'Aqua-Splash', () => {
        const sections: HTMLDivElement[] = getItemExtraSections(baseItem({
            reloadCharges: [{ charges: 2, probability: 0.25 }, { charges: 4, probability: 0.5 }, { charges: 3, probability: 0.25 }]
        }));
        expect(text(sections)).toContain('2 à 4 (4 : 50 %, 3 : 25 %, 2 : 25 %)');
    });

    it('affiche le bonus de survie en veille', () => {
        const sections: HTMLDivElement[] = getItemExtraSections(baseItem({ watchImpact: 5, properties: ['nw_impact_cumul'] }));
        expect(text(sections)).toContain('+5 %');
        expect(text(sections)).toContain('(cumulable)');
    });

    const consumed: MhoActionOutcome = { kind: 'Consumed', probability: 1 };
    const transformed: MhoActionOutcome = { kind: 'Transformed', probability: 1, item: summary('empty', 'item/empty.gif') };

    it('affiche les libellés Ouvrir, Découper et Attaquer avec', () => {
        const sections: HTMLDivElement[] = getItemExtraSections(baseItem({
            actionEffects: [
                { actionName: 'a', kind: 'Open', outcomes: [] },
                { actionName: 'b', kind: 'Slaughter', outcomes: [] },
                { actionName: 'c', kind: 'Attack', outcomes: [] }
            ]
        }));
        expect(sections.map((s: HTMLDivElement) => s.textContent)).toEqual(['Ouvrir', 'Découper', 'Attaquer avec']);
    });

    it('affiche Purifier (1PA) quand le coût est 1 PA', () => {
        const sections: HTMLDivElement[] = getItemExtraSections(baseItem({ actionEffects: [{ actionName: 'p', kind: 'Purify', apCost: 1, outcomes: [] }] }));
        expect(sections[0].textContent).toBe('Purifier (1PA)');
    });

    it('masque Consumed pour Open et Transformed pour Attack quand l objet a des charges', () => {
        const sections: HTMLDivElement[] = getItemExtraSections(baseItem({
            reloadCharges: [{ charges: 3, probability: 1 }],
            actionEffects: [
                { actionName: 'a', kind: 'Open', outcomes: [consumed] },
                { actionName: 'c', kind: 'Attack', outcomes: [transformed] }
            ]
        }));
        expect(sections[0].textContent).toBe('Ouvrir');
        expect(sections[1].textContent).toBe('Attaquer avec');
        expect(sections[1].querySelector('img')).toBeNull();
    });

    it('masque toujours Consumed pour Open, même sans charges', () => {
        const sections: HTMLDivElement[] = getItemExtraSections(baseItem({ actionEffects: [{ actionName: 'a', kind: 'Open', outcomes: [consumed] }] }));
        expect(sections[0].textContent).toBe('Ouvrir');
    });

    it('garde Consumed pour une attaque (grenade)', () => {
        const sections: HTMLDivElement[] = getItemExtraSections(baseItem({ actionEffects: [{ actionName: 'c', kind: 'Attack', outcomes: [consumed] }] }));
        expect(sections[0].textContent).toBe('Attaquer avecConsommé100 %');
    });

    it('affiche « tous les zombies » pour une issue Kill sans bornes', () => {
        const sections: HTMLDivElement[] = getItemExtraSections(baseItem({
            actionEffects: [{ actionName: 'c', kind: 'Attack', outcomes: [{ kind: 'Kill', probability: 0.5, killMin: null, killMax: null }] }]
        }));
        expect(sections[0].textContent).toContain('tous les zombies');
        expect(sections[0].textContent).toContain('50 %');
    });

    it('affiche « Une fois chargé » pour viaLoadedForm', () => {
        const sections: HTMLDivElement[] = getItemExtraSections(baseItem({
            actionEffects: [{ actionName: 'c', kind: 'Attack', viaLoadedForm: summary('loaded', 'item/loaded.gif'), outcomes: [] }]
        }));
        expect(sections[0].textContent).toContain('Une fois chargé :');
        expect(sections[0].querySelector('img[src*="item/loaded.gif"]')).not.toBeNull();
    });

    /** Rend l'entrée de veille d'un objet avec les issues données. */
    function watchRow(outcomes: MhoActionOutcome[], overrides: Partial<MhoItem> = {}): HTMLDivElement {
        const sections: HTMLDivElement[] = getItemExtraSections(baseItem({
            actionEffects: [{ actionName: 'n', kind: 'Nightwatch', outcomes: outcomes }],
            ...overrides
        }));
        expect(sections.length).toBe(1);
        return sections[0];
    }

    it('affiche la veille comme la catapulte : icône de veille, flèche, sans texte', () => {
        const row: HTMLDivElement = watchRow([{ kind: 'Broken', probability: 1 }]);
        const icons: NodeListOf<HTMLImageElement> = row.querySelectorAll('img');
        expect(icons[0].src).toContain('emotes/watch.gif');
        expect(icons[0].title).toBe('En veille');
        expect(icons[1].src).toContain('emotes/arrowright.gif');
        expect(row.textContent).toBe('');
    });

    it('montre l objet cassé en veille avec une bordure', () => {
        const row: HTMLDivElement = watchRow([{ kind: 'Broken', probability: 1 }], { imgBroken: 'item/item_x.b.gif' });
        const result: HTMLImageElement = row.querySelector('.item img') as HTMLImageElement;
        expect(result.src).toContain('item/item_x.b.gif');
        expect(result.style.border).toBe('1px dashed red');
    });

    it('montre la forme vide obtenue en veille', () => {
        const row: HTMLDivElement = watchRow([{ kind: 'Transformed', probability: 1, item: summary('empty', 'item/empty.gif') }]);
        expect((row.querySelector('.item img') as HTMLImageElement).src).toContain('item/empty.gif');
    });

    it('montre l objet estompé quand il est détruit en veille', () => {
        const row: HTMLDivElement = watchRow([{ kind: 'Consumed', probability: 1 }]);
        const result: HTMLImageElement = row.querySelector('.item img') as HTMLImageElement;
        expect(result.src).toContain('item/item_x.gif');
        expect(result.style.opacity).toBe('0.2');
    });

    it('place la veille en dernier, juste au-dessus de la catapulte', () => {
        const sections: HTMLDivElement[] = getItemExtraSections(baseItem({
            watchImpact: 5,
            bagCapacityBonus: 2,
            reloadCharges: [{ charges: 3, probability: 1 }],
            actionEffects: [{ actionName: 'n', kind: 'Nightwatch', outcomes: [] }]
        }));
        expect(sections.length).toBe(4);
        expect(sections[3].querySelector('img[src*="emotes/watch.gif"]')).not.toBeNull();
    });

    it('montre l objet intact en veille quand rien ne lui arrive', () => {
        const row: HTMLDivElement = watchRow([]);
        const result: HTMLImageElement = row.querySelector('.item img') as HTMLImageElement;
        expect(result.src).toContain('item/item_x.gif');
        expect(result.style.border).toBe('');
        expect(result.style.opacity).toBe('');
    });

    it('affiche le groupe exclusif du sac seulement au-delà d un objet', () => {
        const group: MhoItemSummary[] = [summary('bag1', 'item/bag1.gif'), summary('bag2', 'item/bag2.gif')];
        const several: HTMLDivElement[] = getItemExtraSections(baseItem({ bagCapacityBonus: 2, bagExclusiveGroup: group }));
        expect(several.map((s: HTMLDivElement) => s.textContent)).toEqual(['+2 places', 'Un seul à la fois parmi :']);
        expect(several[1].querySelectorAll('img').length).toBe(2);
        expect(getItemExtraSections(baseItem({ bagExclusiveGroup: [group[0]] }))).toEqual([]);
    });

    it('ne montre pas undefined quand killMin/killMax manquent', () => {
        const sections: HTMLDivElement[] = getItemExtraSections(baseItem({
            actionEffects: [{ actionName: 'c', kind: 'Attack', outcomes: [{ kind: 'Kill', probability: 0.5, killMin: null, killMax: 3 }] }]
        }));
        expect(sections[0].textContent).not.toContain('undefined');
        expect(sections[0].textContent).not.toContain('null');
        expect(sections[0].textContent).toContain('3');
    });

    it('affiche la fréquence en fouille sur une zone non épuisée', () => {
        const sections: HTMLDivElement[] = getItemExtraSections(baseItem({ dropRateNotPraf: 0.004, dropRatePraf: 0 }));
        expect(text(sections)).toBe('Fréquence en fouille : Peu courant, ≈ 1 fouille réussie sur 250');
    });

    it('exprime une forte probabilité en fraction et signale la zone épuisée', () => {
        const sections: HTMLDivElement[] = getItemExtraSections(baseItem({ dropRateNotPraf: 0, dropRatePraf: 0.625 }));
        expect(text(sections)).toBe('Fréquence en fouille : Très courant, ≈ 5 fouilles réussies sur 8 (zone épuisée)');
    });

    it('n\'affiche pas le coût en PA d\'Ouvrir, déjà porté par la ligne d\'ouverture du coffre', () => {
        const open: HTMLDivElement = getItemExtraSections(baseItem({
            actionEffects: [{ actionName: 'open_safe', kind: 'Open', apCost: 1, outcomes: [{ kind: 'Produced', probability: 1, item: summary('w', 'item/w.gif'), quantity: 1 }] }]
        }))[0];
        expect(open.querySelector('img[src*="emotes/ap"]')).toBeNull();
    });

    it('montre l\'icône de l\'objet cassé devant « Se casse »', () => {
        const row: HTMLDivElement = getItemExtraSections(baseItem({
            imgBroken: 'item/item_x.b.gif',
            actionEffects: [{ actionName: 'a', kind: 'Attack', outcomes: [{ kind: 'Broken', probability: 0.5 }] }]
        }))[0];
        expect(row.querySelector('img[src*="item/item_x.b.gif"]')).not.toBeNull();
        expect(row.textContent).toContain('Se casse');
    });
});
