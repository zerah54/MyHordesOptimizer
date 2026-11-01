import { budgetPost, FORUM_POST_LIMIT, mention, PostContext, programPost, splitForum } from './forum-post.util';
import { BuildingPlanContentDTO, emptyPlanContent } from './plan.types';
import { DayInput } from './plan-evaluation.util';
import { FAKE_BUILDINGS, FAKE_CITIZENS, FAKE_HOMES, FAKE_REGULAR_CITIZENS, fakeEvaluation } from './planning.store.fake';

function context(content: BuildingPlanContentDTO, evaluation_overrides: Partial<DayInput> = {}): PostContext {
    return {
        day: 10,
        plan_name: 'Plan A',
        content,
        evaluation: fakeEvaluation(content, evaluation_overrides),
        buildings: FAKE_BUILDINGS,
        citizens: FAKE_CITIZENS,
        homes: FAKE_HOMES,
        item_label: (item_id: number): string => (item_id === 5 ? 'Bois' : `#${item_id}`),
        website_url: 'https://site.test/'
    };
}

function joined(parts: string[]): string {
    return parts.join('\n');
}

function balanced(text: string): boolean {
    return (text.match(/\[collapse=/g) ?? []).length === (text.match(/\[\/collapse\]/g) ?? []).length;
}

describe('forum-post.util', (): void => {
    describe('sans poche des bannis affichée', (): void => {
        const STEP: BuildingPlanContentDTO = { ...emptyPlanContent(), programs: { banned: [], regular: [{ buildingId: 1, kind: 'build', mode: 'finish', targetRemaining: 0 }] } };

        it('le post budget ne nomme aucune poche et garde les chiffres', (): void => {
            const text: string = joined(budgetPost({ ...context(STEP), citizens: FAKE_REGULAR_CITIZENS }));
            expect(text).not.toMatch(/bannis/i);
            expect(text).toContain('Citoyens');
            expect(text).toContain('Mur');
        });

        it('le post programme ne nomme aucune poche et garde les étapes', (): void => {
            const text: string = joined(programPost({ ...context(STEP), citizens: FAKE_REGULAR_CITIZENS }));
            expect(text).not.toMatch(/bannis/i);
            expect(text).not.toContain(':arrowright:');
            expect(text).toContain('Mur');
        });

        it('l\'activation sur la proposition rétablit les poches', (): void => {
            const text: string = joined(budgetPost({ ...context({ ...STEP, manageBanned: true }), citizens: FAKE_REGULAR_CITIZENS }));
            expect(text).toContain('[b]Bannis[/b]');
            expect(text).toContain('[b]Non-bannis[/b]');
        });
    });

    describe('mention', (): void => {
        it('nom nettoyé des caractères hors lettres, chiffres, tiret et souligné', (): void => {
            expect(mention('Alice', 12)).toBe('@Alice:12');
            expect(mention('Jean-Luc_2', 3)).toBe('@Jean-Luc_2:3');
            expect(mention('A b!c', 4)).toBe('@Abc:4');
            expect(mention('Chloé', 5)).toBe('@Chloé:5');
        });

        it('un nom vide après nettoyage donne une mention valide', (): void => {
            expect(mention('!!! ???', 7)).toBe('@joueur:7');
            expect(mention('', 8)).toBe('@joueur:8');
        });
    });

    describe('splitForum', (): void => {
        it('tient en un seul message sans préfixe', (): void => {
            expect(splitForum(['abc', 'def'])).toEqual(['abc\n\ndef']);
        });

        it('ignore les blocs vides, liste vide = aucun message', (): void => {
            expect(splitForum(['', '  ', 'abc'])).toEqual(['abc']);
            expect(splitForum([])).toEqual([]);
        });

        it('découpe en messages numérotés qui respectent la limite', (): void => {
            const block: string = 'a'.repeat(40);

            const parts: string[] = splitForum([block, block, block], 100);

            expect(parts.length).toBe(2);
            expect(parts[0].startsWith('(1/2)\n')).toBe(true);
            expect(parts[1].startsWith('(2/2)\n')).toBe(true);
            expect(parts.every((part: string): boolean => part.length <= 100)).toBe(true);
        });

        it('coupe un bloc trop long aux sauts de ligne', (): void => {
            const block: string = Array.from({ length: 10 }, (): string => 'b'.repeat(30)).join('\n');

            const parts: string[] = splitForum([block], 100);

            expect(parts.length).toBeGreaterThan(1);
            expect(parts.every((part: string): boolean => part.length <= 100)).toBe(true);
        });

        it('un [collapse] coupé est refermé puis rouvert dans chaque message', (): void => {
            const lines: string = Array.from({ length: 20 }, (): string => 'c'.repeat(30)).join('\n');

            const parts: string[] = splitForum([`[collapse=Titre]\n${lines}\n[/collapse]`], 150);

            expect(parts.length).toBeGreaterThan(1);
            expect(parts.every((part: string): boolean => balanced(part) && part.length <= 150)).toBe(true);
            expect(parts.every((part: string): boolean => part.includes('[collapse=Titre]'))).toBe(true);
        });

        it('une ligne plus longue que la limite est coupée', (): void => {
            const parts: string[] = splitForum(['d'.repeat(300)], 100);

            expect(parts.every((part: string): boolean => part.length <= 100)).toBe(true);
            expect(parts.join('').replace(/\(\d+\/\d+\)\n/g, '').length).toBe(300);
        });

        it('la limite par défaut est inférieure à celle du jeu', (): void => {
            expect(FORUM_POST_LIMIT).toBeLessThan(16384);
        });
    });

    describe('budgetPost', (): void => {
        function plan(): BuildingPlanContentDTO {
            return {
                ...emptyPlanContent(),
                townLines: [{ label: 'Guitare', pool: 'regular', pa: 40 }, { label: 'Portes', pool: 'regular', pa: -2 }],
                programs: { banned: [], regular: [{ buildingId: 1, kind: 'build', targetRemaining: 0 }, { buildingId: 3, kind: 'repair', targetRemaining: 0 }] },
                defenseSources: [{ label: 'OD', pa: 1, def: 2, qty: 10 }],
                allowedOverflow: 20
            };
        }

        it('titre avec le jour et le nom, tous les [collapse] sont refermés', (): void => {
            const text: string = joined(budgetPost(context(plan())));

            expect(text).toContain('[big][b][i]Budget J10 — Plan A[/i][/b][/big]');
            expect(balanced(text)).toBe(true);
            for (const title of ['Budget', 'Plan', 'Défense', 'Ressources']) {
                expect(text).toContain(`[collapse=${title}]`);
            }
        });

        it('lignes ville signées et budget par poche', (): void => {
            const text: string = joined(budgetPost(context(plan())));

            expect(text).toContain('Guitare : +40 :ap:');
            expect(text).toContain('Portes : -2 :ap:');
            expect(text).toContain('Budget : 82 :ap: · Coût : 40 :ap: · Reste : 42 :ap:');
        });

        it('budget et plan : bannis avant non-bannis', (): void => {
            const content: BuildingPlanContentDTO = { ...plan(), programs: { ...plan().programs, banned: [{ buildingId: 1, kind: 'build', targetRemaining: 10 }] } };
            const text: string = joined(budgetPost(context(content)));

            for (const title of ['Budget', 'Plan']) {
                const start: number = text.indexOf(`[collapse=${title}]`);
                const block: string = text.slice(start, text.indexOf('[/collapse]', start));
                expect(block.indexOf('[b]Bannis[/b]')).toBeGreaterThanOrEqual(0);
                expect(block.indexOf('[b]Bannis[/b]')).toBeLessThan(block.indexOf('[b]Non-bannis[/b]'));
            }
        });

        it('étapes du plan : terminer, réparer, coût en PA', (): void => {
            const text: string = joined(budgetPost(context(plan())));

            expect(text).toContain('Terminer Mur');
            expect(text).toContain('Réparer entièrement Porte');
            expect(text).toContain('30 :ap:');
        });

        it('le bloc Plan annonce le chantier à voter ce soir', (): void => {
            expect(joined(budgetPost(context({ ...plan(), eveningVoteBuildingId: 2 })))).toContain('Évolution votée ce soir : Atelier');
        });

        it('le bloc Plan reprend les notes d\'étape', (): void => {
            const content: BuildingPlanContentDTO = {
                ...plan(),
                programs: { banned: [], regular: [{ buildingId: 1, kind: 'build', mode: 'finish', targetRemaining: 0, note: 'après 20h' }] }
            };

            expect(joined(budgetPost(context(content)))).toContain('Terminer Mur — [i]après 20h[/i] → 30 :ap:');
        });

        it('« laisser à N PA » pour une cible non nulle', (): void => {
            const content: BuildingPlanContentDTO = { ...plan(), programs: { banned: [], regular: [{ buildingId: 1, kind: 'build', targetRemaining: 5 }] } };

            expect(joined(budgetPost(context(content)))).toContain('Laisser Mur à 5 :ap:');
        });

        it('défense : attaque, cible, projetée, reste à couvrir et meilleur rapport', (): void => {
            const text: string = joined(budgetPost(context(plan())));

            expect(text).toContain('Attaque : 1100');
            expect(text).toContain('Cible : 1080');
            expect(text).toContain('Reste à couvrir');
            expect(text).toContain('OD');
        });

        it('surplus de défense', (): void => {
            const text: string = joined(budgetPost(context({ ...emptyPlanContent() }, { baseDefense: 1300 })));

            expect(text).toContain('Surplus : 200');
        });

        it('attaque inconnue : mention explicite, sans NaN ni undefined', (): void => {
            const text: string = joined(budgetPost(context(plan(), { attack: null })));

            expect(text).toContain('Attaque : inconnue');
            expect(text).not.toMatch(/NaN|undefined|null/);
        });

        it('plan sans étape', (): void => {
            expect(joined(budgetPost(context(emptyPlanContent())))).toContain('Aucune étape.');
        });

        it('ressources : besoin et manque, ou banque suffisante', (): void => {
            const missing: string = joined(budgetPost(context(plan())));
            expect(missing).toContain('Bois × 2');
            expect(missing).toContain('manque 1');

            const covered: string = joined(budgetPost(context(plan(), { bank: new Map<number, number>([[5, 9]]) })));
            expect(covered).toContain('La banque couvre tout.');
        });

        it('reste négatif ou citoyen sur-engagé : avertissement', (): void => {
            const text: string = joined(budgetPost(context(plan(), { expeditionPa: new Map<number, number>([[1, 30]]) })));

            expect(text).toContain(':warning: Alice');
        });

        it('pied avec le lien vers la page', (): void => {
            const text: string = joined(budgetPost(context(plan())));

            expect(text).toContain('[aparte]');
            expect(text).toContain('[link=https://site.test/my-town/buildings]');
        });
    });

    describe('programPost', (): void => {
        function plan(): BuildingPlanContentDTO {
            return {
                ...emptyPlanContent(),
                citizens: [
                    { userId: 1, tasks: [{ kind: 'free', label: 'RDE', pa: 0 }, { kind: 'home', level: 2, pa: 4 }] },
                    { userId: 3, tasks: [{ kind: 'free', label: 'RDE', pa: 0 }, { kind: 'home', level: 2, pa: 4 }] },
                    { userId: 2, tasks: [{ kind: 'homeUpgrade', label: 'Cuisine 1', pa: 3 }] }
                ],
                programs: { banned: [{ buildingId: 1, kind: 'build', targetRemaining: 0 }], regular: [{ buildingId: 1, kind: 'build', targetRemaining: 10 }, { buildingId: 3, kind: 'repair', targetRemaining: 0 }, { buildingId: 99, kind: 'build', targetRemaining: 0 }] }
            };
        }

        it('titre et section des consignes spéciales', (): void => {
            const text: string = joined(programPost(context(plan())));

            expect(text).toContain('[big][b]Programme chantiers · J10[/b][/big]');
            expect(text).toContain('[b]Consignes individuelles[/b]');
        });

        it('les citoyens aux mêmes consignes sont regroupés sur une ligne de mentions', (): void => {
            const text: string = joined(programPost(context(plan())));

            expect(text).toMatch(/@Alice:1 @Chloé:3/);
            expect(text.match(/RDE/g)?.length).toBe(1);
            expect(text).toContain('@Bob:2');
        });

        it('tâches : maison avec son libellé et son coût, tâche libre', (): void => {
            const text: string = joined(programPost(context(plan())));

            expect(text).toContain(':home: Baracke (4 :ap:)');
            expect(text).toContain(':middot: RDE');
            expect(text).toContain(':home: Cuisine 1 (3 :ap:)');
        });

        it('actions de chantier et améliorations structurées : libellés officiels, distinguées par leur référence', (): void => {
            const content: BuildingPlanContentDTO = {
                ...plan(),
                citizens: [
                    { userId: 1, tasks: [{ kind: 'action', ref: 'home_crows', pa: 1 }] },
                    { userId: 3, tasks: [{ kind: 'action', ref: 'home_scavenge', pa: 1 }] },
                    { userId: 2, tasks: [{ kind: 'homeUpgrade', ref: 'kitchenLevel', level: 2, pa: 3 }] }
                ]
            };

            const text: string = joined(programPost(context(content)));

            expect(text).toContain(':middot: Cartographier le désert (1 :ap:)');
            expect(text).toContain(':middot: Creuser dans les galeries (1 :ap:)');
            expect(text).toContain(':home: Cuisine niv. 2 (3 :ap:)');
            expect(text).not.toMatch(/@Alice:1 @Chloé:3/);
        });

        it('un citoyen sans consigne n\'apparaît pas', (): void => {
            const content: BuildingPlanContentDTO = { ...plan(), citizens: [{ userId: 1, tasks: [] }] };

            const text: string = joined(programPost(context(content)));

            expect(text).not.toContain('@Alice');
            expect(text).toContain('Aucune consigne individuelle.');
        });

        it('programme dans l\'ordre d\'exécution : bannis puis non-bannis, cibles et inconnus', (): void => {
            const text: string = joined(programPost(context(plan())));

            expect(text).toContain('[b]Programme chantiers dans l\'ordre[/b]');
            expect(text.indexOf(':arrowright: [b]Bannis')).toBeLessThan(text.indexOf(':arrowright: [b]Non-bannis'));
            expect(text).toContain('Laisser Mur à 10 :ap:');
            expect(text).toContain('Réparer entièrement Porte');
            expect(text).toContain('Terminer #99');
        });

        it('consignes du jour en tête, consignes intercalées et notes d\'étape dans l\'ordre du programme', (): void => {
            const content: BuildingPlanContentDTO = {
                ...plan(),
                instructions: 'Planches en banque avant 18h.',
                programs: {
                    banned: [],
                    regular: [
                        { buildingId: 1, kind: 'build', mode: 'finish', targetRemaining: 0, note: 'après 20h' },
                        { kind: 'instruction', text: 'Attendre le retour de l\'expé' },
                        { buildingId: 3, kind: 'repair', mode: 'finish', targetRemaining: 0 }
                    ]
                }
            };

            const text: string = joined(programPost(context(content)));

            expect(text).toContain('[b]Consignes du jour[/b]\nPlanches en banque avant 18h.');
            expect(text.indexOf('Consignes du jour')).toBeLessThan(text.indexOf('Consignes individuelles'));
            expect(text).toContain(':middot: Terminer Mur — [i]après 20h[/i]');
            expect(text).toContain('» [i]Attendre le retour de l\'expé[/i]');
            expect(text.indexOf('Terminer Mur')).toBeLessThan(text.indexOf('Attendre le retour'));
            expect(text.indexOf('Attendre le retour')).toBeLessThan(text.indexOf('Réparer entièrement Porte'));
        });

        it('rappelle la défense visée et la défense projetée par le plan', (): void => {
            const text: string = joined(programPost(context(plan())));

            expect(text).toMatch(/\[b\]Défense\[\/b\] : \d+ \/ \d+/);
        });

        it('annonce le chantier à voter ce soir', (): void => {
            const text: string = joined(programPost(context({ ...plan(), eveningVoteBuildingId: 2 })));

            expect(text).toContain('[b]Évolution votée ce soir[/b] : Atelier');
        });

        it('sans vote prévu, pas de ligne de vote', (): void => {
            expect(joined(programPost(context(plan())))).not.toContain('Évolution votée ce soir');
        });

        it('sans consignes du jour, pas de bloc vide', (): void => {
            expect(joined(programPost(context(plan())))).not.toContain('Consignes du jour');
        });

        it('rappelle l\'investissement par paires quand le BDE sert aux bannis', (): void => {
            const text: string = joined(programPost(context(plan(), { hasSlavery: true })));

            expect(text).toContain('par paires de PA');
        });

        it('pied avec le lien vers « Mon programme »', (): void => {
            const text: string = joined(programPost(context(plan())));

            expect(text).toContain('[link=https://site.test/my-town/program]');
            expect(balanced(text)).toBe(true);
        });
    });
});
