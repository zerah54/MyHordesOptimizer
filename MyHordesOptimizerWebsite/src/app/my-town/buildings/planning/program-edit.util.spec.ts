import { BuildingProgress } from './building-progress.util';
import { BuildingPlanContentDTO, emptyPlanContent, isBuildingStep, PlanItemDTO, PlanStepDTO } from './plan.types';
import {
    addInstruction,
    canToggleBuilding,
    defaultStep,
    hasBuilding,
    moveItem,
    removeItem,
    sanitizeContent,
    setInstructions,
    setInstructionText,
    setPlanTier,
    setStepMode,
    setStepNote,
    toggleBuilding,
    ToggleContext
} from './program-edit.util';

function progress(overrides: Partial<BuildingProgress>): BuildingProgress {
    return { buildingId: 0, paCurrent: 10, invested: 0, built: false, life: 0, maxLife: 0, def: 0, defMax: 0, ...overrides };
}

/** 1 (construit) → 2 → 3 → 4 ; 5 construit et abîmé, perd des PV la nuit ; 6 construit, ne perd rien. */
function context(): ToggleContext {
    return {
        parents: new Map<number, number | null>([[1, null], [2, 1], [3, 2], [4, 3], [5, null], [6, null]]),
        progress: new Map<number, BuildingProgress>([
            [1, progress({ buildingId: 1, built: true })],
            [2, progress({ buildingId: 2 })],
            [3, progress({ buildingId: 3 })],
            [4, progress({ buildingId: 4 })],
            [5, progress({ buildingId: 5, built: true, life: 10, maxLife: 30 })],
            [6, progress({ buildingId: 6, built: true, life: 10, maxLife: 30 })]
        ]),
        nightLoss: new Map<number, number>([[5, 21], [6, 0]])
    };
}

function ids(content: BuildingPlanContentDTO, pool: 'banned' | 'regular'): number[] {
    return content.programs[pool].map((item: PlanItemDTO): number => (isBuildingStep(item) ? item.buildingId : -1));
}

describe('program-edit.util', (): void => {
    describe('defaultStep', (): void => {
        it('un chantier non construit : terminer', (): void => {
            expect(defaultStep(2, context())).toEqual({ buildingId: 2, kind: 'build', mode: 'finish', targetRemaining: 0 });
        });

        it('un chantier construit qui peut perdre des PV : réparer pour passer la nuit', (): void => {
            expect(defaultStep(5, context())).toEqual({ buildingId: 5, kind: 'repair', mode: 'survive', targetRemaining: 0 });
        });

        it('un chantier construit qui ne perd rien la nuit : réparer entièrement', (): void => {
            expect(defaultStep(6, context())).toEqual({ buildingId: 6, kind: 'repair', mode: 'finish', targetRemaining: 0 });
        });
    });

    describe('toggleBuilding', (): void => {
        it('cocher ajoute en fin de section, précédé des ancêtres non construits, racine d\'abord', (): void => {
            const content: BuildingPlanContentDTO = { ...emptyPlanContent(), programs: { banned: [], regular: [{ kind: 'instruction', text: 'x' }] } };
            toggleBuilding(content, 'regular', 4, context());
            expect(ids(content, 'regular')).toEqual([-1, 2, 3, 4]);
        });

        it('toggleBuilding n\'ajoute pas un ancêtre déjà planifié dans l\'autre section', (): void => {
            const content: BuildingPlanContentDTO = { ...emptyPlanContent(), programs: { banned: [defaultStep(2, context())], regular: [] } };
            toggleBuilding(content, 'regular', 4, context());
            expect(ids(content, 'regular')).toEqual([3, 4]);
        });

        it('décocher retire toutes les étapes du chantier de la section, sans toucher aux autres', (): void => {
            const content: BuildingPlanContentDTO = {
                ...emptyPlanContent(),
                programs: { banned: [defaultStep(3, context())], regular: [defaultStep(3, context()), defaultStep(4, context()), defaultStep(3, context())] }
            };
            toggleBuilding(content, 'regular', 3, context());
            expect(ids(content, 'regular')).toEqual([4]);
            expect(ids(content, 'banned')).toEqual([3]);
        });

        it('un chantier construit sans dégâts ne se coche pas ; il se décoche s\'il est déjà au programme', (): void => {
            const intact: ToggleContext = { ...context(), progress: new Map<number, BuildingProgress>([...context().progress, [7, progress({ buildingId: 7, built: true, life: 30, maxLife: 30 })], [8, progress({ buildingId: 8, built: true })]]) };
            const content: BuildingPlanContentDTO = emptyPlanContent();

            expect(canToggleBuilding(content, 'regular', 2, intact)).toBe(true);
            expect(canToggleBuilding(content, 'regular', 5, intact)).toBe(true);
            expect(canToggleBuilding(content, 'regular', 7, intact)).toBe(false);
            expect(canToggleBuilding(content, 'regular', 8, intact)).toBe(false);

            toggleBuilding(content, 'regular', 7, intact);
            expect(ids(content, 'regular')).toEqual([]);

            const planned: BuildingPlanContentDTO = { ...emptyPlanContent(), programs: { banned: [], regular: [{ buildingId: 7, kind: 'repair', targetRemaining: 0 }] } };
            expect(canToggleBuilding(planned, 'regular', 7, intact)).toBe(true);
            toggleBuilding(planned, 'regular', 7, intact);
            expect(ids(planned, 'regular')).toEqual([]);
        });

        it('hasBuilding ignore les consignes', (): void => {
            expect(hasBuilding([{ kind: 'instruction', text: '3' }], 3)).toBe(false);
            expect(hasBuilding([defaultStep(3, context())], 3)).toBe(true);
        });
    });

    describe('éditions', (): void => {
        function sample(): BuildingPlanContentDTO {
            return {
                ...emptyPlanContent(),
                programs: {
                    banned: [defaultStep(5, context())],
                    regular: [defaultStep(2, context()), { kind: 'instruction', text: 'Attendre' }, defaultStep(3, context())]
                }
            };
        }

        it('setStepMode : laisser à N garde la cible, les autres modes la remettent à 0', (): void => {
            const content: BuildingPlanContentDTO = sample();
            setStepMode(content, { pool: 'regular', index: 0 }, 'leave', 12.7);
            expect(content.programs.regular[0]).toEqual({ buildingId: 2, kind: 'build', mode: 'leave', targetRemaining: 12 });
            setStepMode(content, { pool: 'regular', index: 0 }, 'finish', 12);
            expect(content.programs.regular[0]).toEqual({ buildingId: 2, kind: 'build', mode: 'finish', targetRemaining: 0 });
        });

        it('setStepMode et setStepNote ignorent une consigne ou un rang absent', (): void => {
            const content: BuildingPlanContentDTO = sample();
            setStepMode(content, { pool: 'regular', index: 1 }, 'leave', 3);
            setStepNote(content, { pool: 'regular', index: 9 }, 'x');
            expect(content).toEqual(sample());
        });

        it('setStepNote enregistre la note, une note vide l\'efface', (): void => {
            const content: BuildingPlanContentDTO = sample();
            setStepNote(content, { pool: 'regular', index: 0 }, 'après 20h');
            expect((content.programs.regular[0] as PlanStepDTO).note).toBe('après 20h');
            setStepNote(content, { pool: 'regular', index: 0 }, '   ');
            expect((content.programs.regular[0] as PlanStepDTO).note).toBeNull();
        });

        it('addInstruction ajoute une consigne non vide en fin de section', (): void => {
            const content: BuildingPlanContentDTO = sample();
            addInstruction(content, 'banned', '  Réparer en priorité  ');
            addInstruction(content, 'banned', '   ');
            expect(content.programs.banned.length).toBe(2);
            expect(content.programs.banned[1]).toEqual({ kind: 'instruction', text: 'Réparer en priorité' });
        });

        it('setInstructionText modifie le texte d\'une consigne seulement', (): void => {
            const content: BuildingPlanContentDTO = sample();
            setInstructionText(content, { pool: 'regular', index: 1 }, 'Nouveau');
            setInstructionText(content, { pool: 'regular', index: 0 }, 'Ignoré');
            expect(content.programs.regular[1]).toEqual({ kind: 'instruction', text: 'Nouveau' });
            expect(hasBuilding(content.programs.regular, 2)).toBe(true);
        });

        it('removeItem retire l\'élément désigné', (): void => {
            const content: BuildingPlanContentDTO = sample();
            removeItem(content, { pool: 'regular', index: 1 });
            expect(ids(content, 'regular')).toEqual([2, 3]);
        });

        it('moveItem réordonne dans une section et passe d\'une section à l\'autre', (): void => {
            const content: BuildingPlanContentDTO = sample();
            moveItem(content, { pool: 'regular', index: 2 }, { pool: 'regular', index: 0 });
            expect(ids(content, 'regular')).toEqual([3, 2, -1]);
            moveItem(content, { pool: 'regular', index: 0 }, { pool: 'banned', index: 99 });
            expect(ids(content, 'banned')).toEqual([5, 3]);
            expect(ids(content, 'regular')).toEqual([2, -1]);
        });

        it('setPlanTier enregistre le niveau, 0 retire l\'entrée', (): void => {
            const content: BuildingPlanContentDTO = sample();
            setPlanTier(content, 4, 2);
            expect(content.planTiers).toEqual({ '4': 2 });
            setPlanTier(content, 4, 0);
            expect(content.planTiers).toEqual({});
        });

        it('setInstructions : texte vide → null', (): void => {
            const content: BuildingPlanContentDTO = sample();
            setInstructions(content, 'Planches en banque');
            expect(content.instructions).toBe('Planches en banque');
            setInstructions(content, '  ');
            expect(content.instructions).toBeNull();
        });

        it('sanitizeContent retire les consignes vides et rogne textes et notes, sans modifier l\'original', (): void => {
            const content: BuildingPlanContentDTO = {
                ...emptyPlanContent(),
                instructions: '   ',
                programs: {
                    banned: [],
                    regular: [{ kind: 'instruction', text: '  ' }, { kind: 'instruction', text: ' Go ' }, { ...defaultStep(2, context()), note: '  ' }, { ...defaultStep(3, context()), note: ' ok ' }]
                }
            };
            const clean: BuildingPlanContentDTO = sanitizeContent(content);
            expect(clean.instructions).toBeNull();
            expect(clean.programs.regular).toEqual([
                { kind: 'instruction', text: 'Go' },
                { ...defaultStep(2, context()), note: null },
                { ...defaultStep(3, context()), note: 'ok' }
            ]);
            expect(content.programs.regular.length).toBe(4);
        });

        it('sanitizeContent ne garde qu\'une perte par chantier et par type (doublons refusés par l\'API)', (): void => {
            const content: BuildingPlanContentDTO = {
                ...emptyPlanContent(),
                losses: [{ buildingId: 3, kind: 'destroyed' }, { buildingId: 3, kind: 'bonus' }, { buildingId: 3, kind: 'destroyed' }]
            };

            expect(sanitizeContent(content).losses).toEqual([{ buildingId: 3, kind: 'destroyed' }, { buildingId: 3, kind: 'bonus' }]);
            expect(content.losses?.length).toBe(3);
        });

        it('sanitizeContent retire les consignes « action » sans action (refusées par l\'API)', (): void => {
            const content: BuildingPlanContentDTO = {
                ...emptyPlanContent(),
                citizens: [{ userId: 1, tasks: [{ id: 'a', kind: 'action', pa: 0 }, { id: 'b', kind: 'action', ref: 'home_crows', pa: 1 }, { id: 'c', kind: 'free', label: 'x', pa: 0 }] }]
            };

            expect(sanitizeContent(content).citizens[0].tasks.map((task: { id?: string | null }): string | null | undefined => task.id)).toEqual(['b', 'c']);
            expect(content.citizens[0].tasks.length).toBe(3);
        });
    });
});
