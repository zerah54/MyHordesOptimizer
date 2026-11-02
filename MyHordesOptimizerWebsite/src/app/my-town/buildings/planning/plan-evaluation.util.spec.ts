import { CitizenCapacity } from './budget.util';
import { BuildingProgress } from './building-progress.util';
import { RankedCandidate } from './defense.util';
import { neutralDefenseFactors } from './defense-gain.util';
import { REACTOR_UID } from './night-survival.util';
import { BuildingPlanContentDTO, emptyPlanContent, PlanStepDTO } from './plan.types';
import { advanceDay, BuildingRef, CitizenRef, DayEvaluation, DayInput, evaluateDay, evaluateDays, HomeLevelRef, WORKSHOP_UID } from './plan-evaluation.util';

function ref(overrides: Partial<BuildingRef>): BuildingRef {
    return { id: 0, uid: 'x', label: 'X', pa: 10, defence: 0, maxLife: 0, temporary: false, breakable: true, parentId: null, resources: [], ...overrides };
}

function progress(overrides: Partial<BuildingProgress>): BuildingProgress {
    return { buildingId: 0, paCurrent: 10, invested: 0, built: false, life: 0, maxLife: 0, def: 0, defMax: 0, ...overrides };
}

const WALL: BuildingRef = ref({ id: 1, uid: 'wall', label: 'Mur', pa: 40, defence: 30, maxLife: 30, resources: [{ itemId: 5, count: 2 }] });
const WORKSHOP: BuildingRef = ref({ id: 2, uid: WORKSHOP_UID, label: 'Atelier', pa: 20 });
const GATE: BuildingRef = ref({ id: 3, uid: 'gate', label: 'Porte', pa: 10, defence: 15, maxLife: 30 });
const TEMP: BuildingRef = ref({ id: 4, uid: 'temp', label: 'Temporaire', pa: 10, defence: 50, maxLife: 5, temporary: true });

const CITIZENS: CitizenRef[] = [
    { userId: 1, name: 'A', banned: false, technician: false, homeLevel: null },
    { userId: 2, name: 'B', banned: true, technician: false, homeLevel: null },
    { userId: 3, name: 'C', banned: false, technician: true, homeLevel: null }
];

function baseProgress(): Map<number, BuildingProgress> {
    return new Map<number, BuildingProgress>([
        [1, progress({ buildingId: 1, paCurrent: 40, invested: 10, maxLife: 30, defMax: 30 })],
        [2, progress({ buildingId: 2, paCurrent: 20 })],
        [3, progress({ buildingId: 3, paCurrent: 10, invested: 10, built: true, life: 10, maxLife: 30, def: 5, defMax: 15 })]
    ]);
}

function step(buildingId: number, target: number, kind: 'build' | 'repair' = 'build'): PlanStepDTO {
    return { buildingId, kind, targetRemaining: target };
}

function input(content: Partial<BuildingPlanContentDTO>, overrides: Partial<DayInput> = {}): DayInput {
    return {
        content: { ...emptyPlanContent(), ...content },
        buildings: new Map<number, BuildingRef>([[1, WALL], [2, WORKSHOP], [3, GATE], [4, TEMP]]),
        progress: baseProgress(),
        workshopLevel: 0,
        hasSlavery: false,
        citizens: CITIZENS,
        expeditionPa: new Map<number, number>(),
        bank: new Map<number, number>([[5, 1]]),
        itemValues: new Map<number, number>([[5, 2]]),
        attack: 1100,
        baseDefense: 1000,
        temporaryDefense: 0,
        homes: new Map<number, HomeLevelRef>(),
        hardMode: false,
        defenseFactors: neutralDefenseFactors(),
        defenseItemIds: new Set<number>(),
        upgrades: {},
        buildingLevels: new Map<string, number>(),
        ...overrides
    };
}

describe('plan-evaluation.util', (): void => {
    describe('evaluateDay', (): void => {
        it('signale une construction dont le parent n\'est pas construit', (): void => {
            const child: BuildingRef = ref({ id: 5, uid: 'child', label: 'Enfant', pa: 10, parentId: 2 });
            const evaluation: DayEvaluation = evaluateDay(input(
                { programs: { banned: [], regular: [step(5, 0)] } },
                {
                    buildings: new Map<number, BuildingRef>([[1, WALL], [2, WORKSHOP], [3, GATE], [5, child]]),
                    progress: new Map<number, BuildingProgress>([...baseProgress(), [5, progress({ buildingId: 5, paCurrent: 10 })]])
                }
            ));
            expect(evaluation.results[0].issues).toEqual(['parent-missing']);
            expect(evaluation.results[0].paCost).toBe(0);
        });

        it('un parent terminé plus tôt dans le programme débloque l\'enfant', (): void => {
            const child: BuildingRef = ref({ id: 5, uid: 'child', label: 'Enfant', pa: 10, parentId: 2 });
            const evaluation: DayEvaluation = evaluateDay(input(
                { programs: { banned: [], regular: [step(2, 0), step(5, 0)] } },
                {
                    buildings: new Map<number, BuildingRef>([[1, WALL], [2, WORKSHOP], [3, GATE], [5, child]]),
                    progress: new Map<number, BuildingProgress>([...baseProgress(), [5, progress({ buildingId: 5, paCurrent: 10 })]])
                }
            ));
            expect(evaluation.results[1].completes).toBe(true);
            expect(evaluation.results[1].issues).toEqual([]);
        });

        it('en Pandémonium, réparer la porte pour passer la nuit', (): void => {
            const evaluation: DayEvaluation = evaluateDay(input(
                { programs: { banned: [], regular: [{ buildingId: 3, kind: 'repair', mode: 'survive', targetRemaining: 0 }] } },
                { hardMode: true }
            ));
            expect(evaluation.nightLoss.get(3)).toBe(21);
            expect(evaluation.progressAfter.get(3)?.life).toBe(22);
        });

        it('hors Pandémonium, la porte ne perd rien la nuit', (): void => {
            expect(evaluateDay(input({})).nightLoss.get(3)).toBe(0);
        });

        it('expose l\'avancement au début de la journée', (): void => {
            const day: DayInput = input({ programs: { banned: [], regular: [step(1, 0)] } });
            const evaluation: DayEvaluation = evaluateDay(day);
            expect(evaluation.progressBefore).toBe(day.progress);
            expect(evaluation.progressBefore.get(1)?.built).toBe(false);
            expect(evaluation.progressAfter.get(1)?.built).toBe(true);
        });

        it('terminer le mur : budget par poche, ressources manquantes et écart de défense', (): void => {
            const evaluation: DayEvaluation = evaluateDay(input({
                programs: { banned: [], regular: [step(1, 0)] }, attackOverride: 1100, allowedOverflow: 20
            }));

            expect(evaluation.completedIds).toEqual([1]);
            expect(evaluation.budgets.regular.budget).toBe(44);
            expect(evaluation.budgets.regular.cost).toBe(30);
            expect(evaluation.budgets.regular.remaining).toBe(14);
            expect(evaluation.budgets.banned.remaining).toBe(19);
            expect(evaluation.needs.get(5)).toBe(2);
            expect(evaluation.missing).toEqual([{ itemId: 5, count: 1 }]);
            expect(evaluation.projectedDefense).toBe(1030);
            expect(evaluation.defenseGap).toBe(50);
            expect(evaluation.attack).toBe(1100);
            expect(evaluation.target).toBe(1080);
        });

        it('attaque inconnue : écart nul, sans exception', (): void => {
            const evaluation: DayEvaluation = evaluateDay(input({}, { attack: null }));
            expect(evaluation.defenseGap).toBeNull();
            expect(evaluation.attack).toBeNull();
            expect(evaluation.target).toBeNull();
        });

        it('utilise l\'attaque affinée quand aucune n\'est saisie', (): void => {
            expect(evaluateDay(input({}, { attack: 1200 })).defenseGap).toBe(200);
        });

        it('un citoyen sur-engagé a une capacité nulle et est signalé', (): void => {
            const evaluation: DayEvaluation = evaluateDay(input({}, { expeditionPa: new Map<number, number>([[1, 25]]) }));
            const capacity: CitizenCapacity | undefined = evaluation.capacities.find((c: CitizenCapacity): boolean => c.userId === 1);
            expect(capacity?.capacity).toBe(0);
            expect(capacity?.overCommitted).toBe(true);
            expect(evaluation.expeditionPa.get(1)).toBe(25);
        });

        it('réparer la porte : la défense restaurée s\'ajoute à la projection', (): void => {
            const evaluation: DayEvaluation = evaluateDay(input({ programs: { banned: [], regular: [step(3, 0, 'repair')] } }));
            expect(evaluation.results[0].paCost).toBe(10);
            expect(evaluation.projectedDefense).toBe(1010);
        });

        it('une tâche de maison ajoute sa défense (comptée à 40 % par la ville) et ses ressources et réduit la capacité du citoyen', (): void => {
            const homes: Map<number, HomeLevelRef> = new Map<number, HomeLevelRef>([
                [1, { level: 1, label: 'Zelt', def: 1, ap: 2, apUrbanism: 2, resources: [] }],
                [2, { level: 2, label: 'Baracke', def: 4, ap: 4, apUrbanism: 4, resources: [{ itemId: 5, count: 1 }] }]
            ]);
            const citizens: CitizenRef[] = [{ userId: 1, name: 'A', banned: false, technician: false, homeLevel: 1 }];

            const evaluation: DayEvaluation = evaluateDay(input(
                { citizens: [{ userId: 1, tasks: [{ kind: 'home', level: 2, pa: 4 }] }] },
                { homes, citizens }
            ));

            // Maison 1 → 2 : +3 de défense de maison, dont la ville compte 40 % (arrondi à l'inférieur).
            expect(evaluation.projectedDefense).toBe(1001);
            expect(evaluation.needs.get(5)).toBe(1);
            expect(evaluation.capacities[0].capacity).toBe(15);
        });

        it('une tâche de maison sans niveau actuel connu n\'invente aucune défense', (): void => {
            const homes: Map<number, HomeLevelRef> = new Map<number, HomeLevelRef>([[2, { level: 2, label: 'B', def: 4, ap: 4, apUrbanism: 4, resources: [] }]]);

            const evaluation: DayEvaluation = evaluateDay(input({ citizens: [{ userId: 1, tasks: [{ kind: 'home', level: 2, pa: 4 }] }] }, { homes }));

            expect(evaluation.projectedDefense).toBe(1000);
        });

        it('seuil gratuit : PA à laisser sur les chantiers non construits', (): void => {
            const evaluation: DayEvaluation = evaluateDay(input({}));
            expect(evaluation.freeThresholds.get(1)).toBe(2);
            expect(evaluation.freeThresholds.has(3)).toBe(false);
        });

        it('classement : une source de défense rentable passe avant le mur', (): void => {
            const evaluation: DayEvaluation = evaluateDay(input({ defenseSources: [{ label: 'OD', pa: 1, def: 2, qty: 10 }] }));
            const labels: string[] = evaluation.ranking.map((candidate: RankedCandidate): string => candidate.label);
            expect(labels[0]).toBe('OD');
            expect(labels).toContain('Mur');
        });
    });

    describe('évolution votée le soir', (): void => {
        // La Porte (id 3, construite au niveau 1) gagne 15 puis 45 de défense par niveau, comme le Portail du jeu.
        const upgrades: DayInput['upgrades'] = {
            gate: { maxLevel: 3, effects: { defenseIncrement: { levels: [0, 15, 45, 75], default: 0, source: 'BuildingUpgradeListener' } } }
        };
        const levels: Map<string, number> = new Map<string, number>([['gate', 1]]);

        it('compte le gain du niveau suivant dans la défense de la nuit même', (): void => {
            const evaluation: DayEvaluation = evaluateDay(input({ eveningVoteBuildingId: 3 }, { upgrades, buildingLevels: levels }));

            expect(evaluation.vote).toEqual({ uid: 'gate', level: 2, defense: 30 });
            expect(evaluation.projectedDefense).toBe(1030);
        });

        it('le niveau atteint se reporte au lendemain ; au niveau maximum, plus de gain', (): void => {
            const evaluation: DayEvaluation = evaluateDay(input({ eveningVoteBuildingId: 3 }, { upgrades, buildingLevels: new Map<string, number>([['gate', 3]]) }));

            expect(evaluation.vote?.defense).toBe(0);
            expect(advanceDay(evaluateDay(input({ eveningVoteBuildingId: 3 }, { upgrades, buildingLevels: levels })), input({ eveningVoteBuildingId: 3 }, { upgrades, buildingLevels: levels })).buildingLevels.get('gate')).toBe(2);
        });

        it('sans donnée d\'évolution, le vote ne change pas la défense', (): void => {
            expect(evaluateDay(input({ eveningVoteBuildingId: 3 })).vote?.defense).toBe(0);
        });
    });

    describe('pertes prévues cette nuit', (): void => {
        // La Porte (id 3, construite au niveau 1, 5 de défense actuelle) gagne 15 de défense à ce niveau.
        const upgrades: DayInput['upgrades'] = {
            gate: { maxLevel: 3, effects: { defenseIncrement: { levels: [0, 15, 45, 75], default: 0, source: 'BuildingUpgradeListener' } } }
        };
        const levels: Map<string, number> = new Map<string, number>([['gate', 1]]);

        it('bonus perdu : le bonus d\'évolution ne compte pas cette nuit et revient le lendemain', (): void => {
            const [day1, day2]: DayEvaluation[] = evaluateDays([
                input({ losses: [{ buildingId: 3, kind: 'bonus' }] }, { upgrades, buildingLevels: levels }),
                input({}, { upgrades })
            ]);

            expect(day1.losses).toEqual([{ buildingId: 3, kind: 'bonus', defense: 15 }]);
            expect(day1.projectedDefense).toBe(985);
            expect(day2.projectedDefense).toBe(1000);
        });

        it('chantier détruit : compte encore cette nuit, puis perd défense, évolution et construction le lendemain', (): void => {
            const day1_input: DayInput = input({ losses: [{ buildingId: 3, kind: 'destroyed' }] }, { upgrades, buildingLevels: levels });
            const day1: DayEvaluation = evaluateDay(day1_input);
            const carried: ReturnType<typeof advanceDay> = advanceDay(day1, day1_input);

            expect(day1.losses).toEqual([{ buildingId: 3, kind: 'destroyed', defense: 20 }]);
            expect(day1.projectedDefense).toBe(1000);
            expect(carried.baseDefense).toBe(980);
            expect(carried.progress.get(3)?.built).toBe(false);
            expect(carried.buildingLevels.has('gate')).toBe(false);
        });

        it('le bonus perdu suit le niveau voté le soir même', (): void => {
            const evaluation: DayEvaluation = evaluateDay(input(
                { eveningVoteBuildingId: 3, losses: [{ buildingId: 3, kind: 'bonus' }] },
                { upgrades, buildingLevels: levels }
            ));

            expect(evaluation.losses[0].defense).toBe(45);
            expect(evaluation.projectedDefense).toBe(985);
        });

        it('ignore un chantier non construit au soir ou temporaire', (): void => {
            const evaluation: DayEvaluation = evaluateDay(input({ losses: [{ buildingId: 1, kind: 'destroyed' }, { buildingId: 4, kind: 'bonus' }] }));

            expect(evaluation.losses).toEqual([]);
            expect(evaluation.projectedDefense).toBe(1000);
        });
    });

    describe('evaluateDays', (): void => {
        function twoDays(): DayInput[] {
            const with_temp: Map<number, BuildingProgress> = baseProgress();
            with_temp.set(4, progress({ buildingId: 4, paCurrent: 10, maxLife: 5, defMax: 50 }));
            const first: DayInput = input(
                { programs: { banned: [], regular: [step(1, 10), step(4, 0)] }, eveningVoteBuildingId: 2 },
                { progress: with_temp }
            );
            const second: DayInput = input({ programs: { banned: [], regular: [step(1, 0)] } });
            return [first, second];
        }

        it('un vote d\'atelier le soir agit sur le jour suivant seulement', (): void => {
            const [day1, day2]: DayEvaluation[] = evaluateDays(twoDays());
            expect(day1.workshopLevel).toBe(0);
            expect(day2.workshopLevel).toBe(1);
        });

        it('reporte l\'avancement : le mur laissé à 10 PA est à 8 PA de la fin avec l\'atelier niveau 1', (): void => {
            const [day1, day2]: DayEvaluation[] = evaluateDays(twoDays());
            expect(day1.results[0].points).toBe(20);
            expect(day2.results[0].points).toBe(8);
        });

        it('un chantier temporaire terminé aujourd\'hui ne compte pas dans la défense de départ du lendemain', (): void => {
            const [day1, day2]: DayEvaluation[] = evaluateDays(twoDays());
            expect(day1.projectedDefense).toBe(1050);
            expect(day2.projectedDefense).toBe(1030);
        });

        it('ne modifie pas les entrées', (): void => {
            const inputs: DayInput[] = twoDays();
            evaluateDays(inputs);
            expect(inputs[0].progress.get(1)?.invested).toBe(10);
            expect(inputs[0].workshopLevel).toBe(0);
            expect(inputs[1].workshopLevel).toBe(0);
        });
    });

    describe('evaluateDays — la nuit', (): void => {
        it('un chantier temporaire construit la veille a disparu le lendemain', (): void => {
            const day1: DayInput = input(
                { programs: { banned: [], regular: [step(4, 0)] } },
                { progress: new Map<number, BuildingProgress>([[4, progress({ buildingId: 4, paCurrent: 10, maxLife: 5, defMax: 50 })]]) }
            );
            const [, second]: DayEvaluation[] = evaluateDays([day1, input({})]);
            expect(second.progressBefore.get(4)?.built).toBe(false);
            expect(second.progressBefore.get(4)?.invested).toBe(0);
        });

        it('le réacteur perd ses PV de la nuit, et la défense projetée du lendemain en tient compte', (): void => {
            const reactor: BuildingRef = ref({ id: 6, uid: REACTOR_UID, label: 'Réacteur', pa: 100, defence: 500, maxLife: 250, breakable: false });
            const buildings: Map<number, BuildingRef> = new Map<number, BuildingRef>([[6, reactor]]);
            const day: (content: Partial<BuildingPlanContentDTO>) => DayInput = (content: Partial<BuildingPlanContentDTO>): DayInput => input(content, {
                buildings,
                progress: new Map<number, BuildingProgress>([[6, progress({ buildingId: 6, paCurrent: 100, invested: 100, built: true, life: 250, maxLife: 250, def: 500, defMax: 500 })]])
            });
            const [first, second]: DayEvaluation[] = evaluateDays([day({}), day({})]);
            expect(second.progressBefore.get(6)?.life).toBe(125);
            expect(second.progressBefore.get(6)?.def).toBe(250);
            expect(second.projectedDefense).toBe(first.projectedDefense - 250);
        });
    });

    describe('evaluateDays — coûts du jour', (): void => {
        it('evaluateDays : un chantier intact reprend le coût du jour', (): void => {
            const day1: DayInput = input({}, { progress: new Map<number, BuildingProgress>([[1, progress({ buildingId: 1, paCurrent: 40 })]]) });
            const day2: DayInput = input({}, { progress: new Map<number, BuildingProgress>([[1, progress({ buildingId: 1, paCurrent: 30 })]]) });
            const [, second]: DayEvaluation[] = evaluateDays([day1, day2]);
            expect(second.progressBefore.get(1)?.paCurrent).toBe(30);
        });

        it('evaluateDays : un chantier entamé garde le coût de la veille', (): void => {
            const day1: DayInput = input(
                { programs: { banned: [], regular: [step(1, 20)] } },
                { progress: new Map<number, BuildingProgress>([[1, progress({ buildingId: 1, paCurrent: 40 })]]) }
            );
            const day2: DayInput = input({}, { progress: new Map<number, BuildingProgress>([[1, progress({ buildingId: 1, paCurrent: 30 })]]) });
            const [, second]: DayEvaluation[] = evaluateDays([day1, day2]);
            expect(second.progressBefore.get(1)?.paCurrent).toBe(40);
            expect(second.progressBefore.get(1)?.invested).toBe(20);
        });
    });
});
