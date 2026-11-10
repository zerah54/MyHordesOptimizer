import { BUILDING_EMOTES } from './building-emotes.const';
import { budgetPost, FORUM_POST_LIMIT, mention, PostContext, programPost, splitForum } from './forum-post.util';
import { BuildingPlanContentDTO, emptyPlanContent } from './plan.types';
import { BuildingRef, DayInput } from './plan-evaluation.util';
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
        item_emote: (): undefined => undefined,
        website_url: 'https://site.test/',
        job_emotes: new Map<number, string>()
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

            expect(text).toContain('Guitare : +40:ap:');
            expect(text).toContain('Portes : -2:ap:');
            expect(text).toContain('Budget : 82:ap: · Coût : 40:ap: · Reste : 42:ap:');
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

        it('étapes du plan : chantier à terminer par son seul nom, réparer, coût en PA', (): void => {
            const text: string = joined(budgetPost(context(plan())));

            expect(text).toMatch(/:middot: Mur → \d+:ap:/);
            expect(text).not.toContain('Terminer');
            expect(text).toContain('Réparer entièrement Porte');
            expect(text).toContain('30:ap:');
        });

        it('le bloc Plan annonce le chantier à voter ce soir', (): void => {
            expect(joined(budgetPost(context({ ...plan(), eveningVoteBuildingId: 2 })))).toContain(':fortify: Évolution votée ce soir : :refine: Atelier');
        });

        it('le bloc Plan reprend les notes d\'étape', (): void => {
            const content: BuildingPlanContentDTO = {
                ...plan(),
                programs: { banned: [], regular: [{ buildingId: 1, kind: 'build', mode: 'finish', targetRemaining: 0, note: 'après 20h' }] }
            };

            expect(joined(budgetPost(context(content)))).toContain(':middot: Mur — [i]après 20h[/i] → 30:ap:');
        });

        it('« laisser à N PA » pour une cible non nulle', (): void => {
            const content: BuildingPlanContentDTO = { ...plan(), programs: { banned: [], regular: [{ buildingId: 1, kind: 'build', targetRemaining: 5 }] } };

            expect(joined(budgetPost(context(content)))).toContain('Laisser Mur à 5:ap:');
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

        it('ressources : l\'emote de l\'objet précède son nom quand le jeu en a une', (): void => {
            const text: string = joined(budgetPost({ ...context(plan()), item_emote: (item_id: number): string | undefined => (item_id === 5 ? ':item_wood2:' : undefined) }));

            expect(text).toContain(':middot: :item_wood2: Bois × 2');
        });

        it('ressources : un objet sans emote garde son seul nom', (): void => {
            expect(joined(budgetPost(context(plan())))).toContain(':middot: Bois × 2');
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

    describe('emote des chantiers', (): void => {
        /** Contexte où Mur a l'icône de la pompe (`small_water_#00`) et Porte n'a aucune entrée. */
        function iconContext(content: BuildingPlanContentDTO): PostContext {
            const buildings: ReadonlyMap<number, BuildingRef> = new Map<number, BuildingRef>(Array.from(FAKE_BUILDINGS.entries())
                .map(([id, ref]: [number, BuildingRef]): [number, BuildingRef] => [id, id === 1 ? { ...ref, uid: 'small_water_#00', label: 'Pompe' } : ref]));
            return { ...context(content), buildings };
        }
        const base: BuildingPlanContentDTO = {
            ...emptyPlanContent(),
            programs: { banned: [], regular: [{ buildingId: 1, kind: 'build', targetRemaining: 0 }, { buildingId: 3, kind: 'repair', mode: 'finish', targetRemaining: 0 }] }
        };

        it('précède le nom d\'un chantier du programme, pas celui d\'un chantier sans entrée', (): void => {
            const text: string = joined(programPost(iconContext(base)));

            expect(text).toContain(':middot: :water: Pompe');
            expect(text).toContain('Réparer entièrement Porte');
            expect(text).not.toContain(':gate: Porte');
        });

        it('précède le chantier voté', (): void => {
            const text: string = joined(programPost(iconContext({ ...base, eveningVoteBuildingId: 1 })));

            expect(text).toContain('Évolution votée ce soir[/b] : :water: Pompe');
        });

        it('précède le chantier d\'une perte prévue', (): void => {
            const text: string = joined(programPost(iconContext({ ...base, losses: [{ buildingId: 1, kind: 'destroyed' }] })));

            expect(text).toContain(':middot: :water: Pompe : laissé détruire');
        });

        it('précède le chantier du classement défense / coût, pas une source de défense', (): void => {
            const text: string = joined(budgetPost(iconContext({ ...base, defenseSources: [{ label: 'OD', pa: 1, def: 2, qty: 10 }] })));

            expect(text).toMatch(/:middot: :water: Pompe : /);
            expect(text).toMatch(/:middot: OD : /);
        });

        it('chaque balise de la table a la forme :nom:', (): void => {
            for (const tag of Object.values(BUILDING_EMOTES)) {
                expect(tag).toMatch(/^:[a-z_]+:$/);
            }
        });

        it('Grande roue et Château de sable ont leur icône', (): void => {
            expect(BUILDING_EMOTES['small_wheel_#00']).toBe(':wheel:');
            expect(BUILDING_EMOTES['small_castle_#00']).toBe(':castle:');
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
            expect(text).toContain('[collapse=Consignes individuelles pour @Alice:1 @Chloé:3]');
            expect(text).toContain('[collapse=Consignes individuelles pour @Bob:2]');
            expect(balanced(text)).toBe(true);
        });

        it('sans consigne : aucun bloc « Consignes individuelles »', (): void => {
            const text: string = joined(programPost(context({ ...plan(), citizens: [] })));

            expect(text).not.toContain('Consignes individuelles');
            expect(balanced(text)).toBe(true);
        });

        it('l\'emote du métier précède aussi le pseudo d\'un citoyen sur-engagé', (): void => {
            const content: BuildingPlanContentDTO = { ...plan(), basePa: 1 };
            const job_emotes: ReadonlyMap<number, string> = new Map<number, string>([[1, ':scav:'], [2, ':scout:'], [3, ':tech:']]);

            const text: string = joined(budgetPost({ ...context(content), job_emotes }));

            expect(text).toMatch(/:warning: :(scav|scout|tech): (Alice|Bob|Chloé) : /);
        });

        it('sans ping : pseudos simples, avec leur emote, et aucune mention', (): void => {
            const job_emotes: ReadonlyMap<number, string> = new Map<number, string>([[1, ':scav:'], [3, ':tech:']]);

            const text: string = joined(programPost({ ...context(plan()), job_emotes }, false));

            expect(text).toContain(':scav: Alice, :tech: Chloé');
            expect(text).not.toMatch(/@\S+:\d+/);
        });

        it('l\'emote du métier précède la mention quand elle est fournie', (): void => {
            const job_emotes: ReadonlyMap<number, string> = new Map<number, string>([[1, ':scav:'], [3, ':tech:']]);

            const text: string = joined(programPost({ ...context(plan()), job_emotes }));

            expect(text).toContain(':scav: @Alice:1 :tech: @Chloé:3');
        });

        it('les citoyens aux mêmes consignes sont regroupés sur une ligne de mentions', (): void => {
            const text: string = joined(programPost(context(plan())));

            expect(text).toMatch(/@Alice:1 @Chloé:3/);
            expect(text.match(/RDE/g)?.length).toBe(1);
            expect(text).not.toMatch(/@Alice:1 @Chloé:3\n/);
            expect(text).toContain('@Bob:2');
        });

        it('tâches : maison avec son libellé et son coût, tâche libre', (): void => {
            const text: string = joined(programPost(context(plan())));

            expect(text).toContain(':home: Baracke (4:ap:)');
            expect(text).toContain(':middot: RDE');
            expect(text).toContain(':home: Cuisine 1 (3:ap:)');
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

            expect(text).toContain(':middot: Cartographier le désert (1:ap:)');
            expect(text).toContain(':middot: Creuser dans les galeries (1:ap:)');
            expect(text).toContain(':home: Cuisine niv. 2 (3:ap:)');
            expect(text).not.toMatch(/@Alice:1 @Chloé:3/);
        });

        it('un citoyen sans consigne n\'apparaît pas', (): void => {
            const content: BuildingPlanContentDTO = { ...plan(), citizens: [{ userId: 1, tasks: [] }] };

            const text: string = joined(programPost(context(content)));

            expect(text).not.toContain('@Alice');
            expect(text).not.toContain('Consignes individuelles');
        });

        it('programme dans l\'ordre d\'exécution : bannis puis non-bannis, cibles et inconnus', (): void => {
            const text: string = joined(programPost(context(plan())));

            expect(text).toContain('[b]Programme chantiers dans l\'ordre[/b]');
            expect(text.indexOf(':arrowright: [b]Bannis')).toBeLessThan(text.indexOf(':arrowright: [b]Non-bannis'));
            expect(text).toContain('Laisser Mur à 10:ap:');
            expect(text).toContain('Réparer entièrement Porte');
            expect(text).toContain(':middot: #99');
            expect(text).not.toContain('Terminer');
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
            expect(text).toContain(':middot: Mur — [i]après 20h[/i]');
            expect(text).toContain('» [i]Attendre le retour de l\'expé[/i]');
            expect(text.indexOf(':middot: Mur')).toBeLessThan(text.indexOf('Attendre le retour'));
            expect(text.indexOf('Attendre le retour')).toBeLessThan(text.indexOf('Réparer entièrement Porte'));
        });

        it('rappelle la défense visée et la défense projetée par le plan', (): void => {
            const text: string = joined(programPost(context(plan())));

            expect(text).toMatch(/\[b\]Défense\[\/b\] : \d+ \/ \d+/);
        });

        it('annonce le chantier à voter ce soir', (): void => {
            const text: string = joined(programPost(context({ ...plan(), eveningVoteBuildingId: 2 })));

            expect(text).toContain(':fortify: [b]Évolution votée ce soir[/b] : :refine: Atelier');
        });

        it('sans vote prévu, pas de ligne de vote', (): void => {
            expect(joined(programPost(context(plan())))).not.toContain('Évolution votée ce soir');
        });

        it('avec le Brasier Sacrificiel, annonce les deux évolutions du soir', (): void => {
            const base: PostContext = context({ ...plan(), eveningVoteBuildingId: 2, eveningSecondVoteBuildingId: 3 });
            const text: string = joined(programPost({ ...base, evaluation: { ...base.evaluation, doubleVote: true, secondVote: { uid: 'gate', level: 1, defense: 0 } } }));

            expect(text).toContain(':fortify: [b]Évolutions votées ce soir[/b] : :refine: Atelier, Porte');
        });

        it('sans Brasier, le second vote n\'est pas annoncé', (): void => {
            const text: string = joined(programPost(context({ ...plan(), eveningVoteBuildingId: 2, eveningSecondVoteBuildingId: 3 })));

            expect(text).toContain(':fortify: [b]Évolution votée ce soir[/b] : :refine: Atelier');
            expect(text).not.toContain(', Porte');
        });

        it('pertes prévues : défense du chantier au soir (Porte réparée par le plan), aussi dans le bloc Défense du budget', (): void => {
            const content: BuildingPlanContentDTO = { ...plan(), losses: [{ buildingId: 3, kind: 'destroyed' }] };
            const line: string = ':middot: Porte : laissé détruire, ne pas réparer (−15 dès demain)';

            expect(joined(programPost(context(content)))).toContain(`:warning: [b]Pertes prévues cette nuit[/b]\n${line}`);
            expect(joined(budgetPost(context(content)))).toContain(line);
        });

        it('sans perte prévue, pas de bloc de pertes', (): void => {
            expect(joined(programPost(context(plan())))).not.toContain('Pertes prévues');
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
