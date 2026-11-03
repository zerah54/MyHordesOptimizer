import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuildingProgress } from '../building-progress.util';
import { BuildingPlanContentDTO, emptyPlanContent, isBuildingStep, PlanItemDTO, PlanPool, PlanStepDTO } from '../plan.types';
import { BuildingRef, DayEvaluation } from '../plan-evaluation.util';
import { PlanningStore } from '../planning.store';
import { createFakeStore, FAKE_REGULAR_CITIZENS, fakeEvaluation, FakePlanningStore } from '../planning.store.fake';
import { PlanningProgramComponent } from './planning-program.component';

function content(): BuildingPlanContentDTO {
    return {
        ...emptyPlanContent(),
        programs: {
            banned: [{ buildingId: 1, kind: 'build', targetRemaining: 10 }],
            regular: [
                { buildingId: 1, kind: 'build', mode: 'finish', targetRemaining: 0 },
                { kind: 'instruction', text: 'Attendre l\'expé' },
                { buildingId: 3, kind: 'repair', mode: 'finish', targetRemaining: 0 }
            ]
        }
    };
}

interface TestableProgram {
    voteOptions: () => BuildingRef[];
    secondVoteOptions: () => BuildingRef[];
    onVote: (building_id: number | null) => void;
    onSecondVote: (building_id: number | null) => void;
    onDrop: (event: CdkDragDrop<PlanPool>) => void;
}

describe('PlanningProgramComponent', (): void => {
    let fake: FakePlanningStore;
    let fixture: ComponentFixture<PlanningProgramComponent>;

    async function render(plan: BuildingPlanContentDTO = content()): Promise<void> {
        fake = createFakeStore(plan);
        await TestBed.configureTestingModule({
            imports: [PlanningProgramComponent],
            providers: [
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                { provide: PlanningStore, useValue: fake.store }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(PlanningProgramComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function root(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    function items(pool: PlanPool): HTMLElement[] {
        return Array.from(root().querySelectorAll<HTMLElement>(`section.pool[data-pool="${pool}"] .item`));
    }

    function regular(): PlanItemDTO[] {
        return fake.draft()?.programs.regular ?? [];
    }

    function type(input: HTMLInputElement | HTMLTextAreaElement, value: string): void {
        input.value = value;
        input.dispatchEvent(new Event('input'));
    }

    function chooseMode(row: HTMLElement, value: string): void {
        row.querySelector<HTMLElement>('mat-select[data-field="mode"] .mat-mdc-select-trigger')?.click();
        fixture.detectChanges();
        document.querySelector<HTMLElement>(`mat-option[data-mode="${value}"]`)?.click();
        fixture.detectChanges();
    }

    afterEach((): void => {
        vi.useRealTimers();
    });

    it('une ligne par élément et par section, avec le nom du chantier et les consignes', async (): Promise<void> => {
        await render();

        expect(items('regular').length).toBe(3);
        expect(items('banned').length).toBe(1);
        expect(items('regular')[0].textContent).toContain('Mur');
        expect(items('regular')[1].classList.contains('instruction')).toBe(true);
        expect(items('regular')[2].textContent).toContain('Porte');
        expect(items('regular')[0].id).toBe('plan-item-regular-0');
    });

    it('affiche les bannis avant les non-bannis (ordre d\'exécution)', async (): Promise<void> => {
        await render();

        const order: (string | null)[] = Array.from(root().querySelectorAll<HTMLElement>('section.pool'))
            .map((section: HTMLElement): string | null => section.getAttribute('data-pool'));
        expect(order).toEqual(['banned', 'regular']);
    });

    describe('sans poche des bannis affichée', (): void => {
        async function renderRegularOnly(manage_banned: boolean = false): Promise<void> {
            await render({ ...content(), manageBanned: manage_banned, programs: { banned: [], regular: content().programs.regular } });
            fake.citizens.set(FAKE_REGULAR_CITIZENS);
            fixture.detectChanges();
        }

        it('une seule section, sans titre de poche', async (): Promise<void> => {
            await renderRegularOnly();

            expect(root().querySelector('section.pool[data-pool="banned"]')).toBeNull();
            expect(root().querySelector('section.pool[data-pool="regular"] h3')).toBeNull();
            expect(items('regular').length).toBe(3);
        });

        it('le vote du soir reste disponible', async (): Promise<void> => {
            await renderRegularOnly();

            expect(root().querySelector('section.pool[data-pool="regular"] mat-form-field.vote')).not.toBeNull();
        });

        it('le menu d\'une ligne ne propose pas de changer de poche', async (): Promise<void> => {
            await renderRegularOnly();

            items('regular')[0].querySelector<HTMLButtonElement>('button[data-action="item-menu"]')?.click();
            fixture.detectChanges();

            expect(document.querySelector('.mat-mdc-menu-panel button[data-action="remove"]')).not.toBeNull();
            expect(document.querySelector('.mat-mdc-menu-panel button[data-action="switch-pool"]')).toBeNull();
        });

        it('l\'activation sur la proposition rétablit les deux sections titrées', async (): Promise<void> => {
            await renderRegularOnly(true);

            expect(root().querySelector('section.pool[data-pool="banned"] h3')?.textContent).toContain('Bannis');
            expect(root().querySelector('section.pool[data-pool="regular"] h3')?.textContent).toContain('Non-bannis');
        });
    });

    it('un chantier introuvable est affiché par son identifiant', async (): Promise<void> => {
        const plan: BuildingPlanContentDTO = content();
        plan.programs.regular.push({ buildingId: 99, kind: 'build', mode: 'finish', targetRemaining: 0 });
        await render(plan);

        expect(items('regular')[3].textContent).toContain('#99');
    });

    it('affiche le coût et le résultat de chaque étape', async (): Promise<void> => {
        await render();

        expect(items('regular')[0].querySelector('.cost')?.textContent).toContain('30');
        expect(items('regular')[0].querySelector('.result')?.getAttribute('data-done')).toBe('true');
        expect(items('regular')[2].querySelector('.result')?.textContent).toMatch(/10\s*→\s*30\s*\/\s*30/);
    });

    it('signale les problèmes d\'une étape (bannis sans BDE)', async (): Promise<void> => {
        await render();

        expect(items('banned')[0].querySelector('[data-issue="banned-cannot-build"]')).not.toBeNull();
        expect(items('regular')[0].querySelector('[data-issue]')).toBeNull();
    });

    it('marque « non débloqué » un chantier absent de l\'état synchronisé', async (): Promise<void> => {
        const plan: BuildingPlanContentDTO = content();
        plan.programs.regular.push({ buildingId: 2, kind: 'build', mode: 'finish', targetRemaining: 0 });
        await render(plan);

        expect(items('regular')[3].querySelector('.badge-locked')).not.toBeNull();
        expect(items('regular')[0].querySelector('.badge-locked')).toBeNull();
    });

    it('le menu d\'action ne propose que ce qui a un sens pour l\'état du chantier', async (): Promise<void> => {
        await render();

        items('regular')[0].querySelector<HTMLElement>('mat-select[data-field="mode"] .mat-mdc-select-trigger')?.click();
        fixture.detectChanges();
        expect(document.querySelector('mat-option[data-mode="repair:finish"]')).toBeNull();
        document.querySelector<HTMLElement>('mat-option[data-mode="build:finish"]')?.click();
        fixture.detectChanges();

        items('regular')[2].querySelector<HTMLElement>('mat-select[data-field="mode"] .mat-mdc-select-trigger')?.click();
        fixture.detectChanges();
        expect(document.querySelector('mat-option[data-mode="build:leave"]')).toBeNull();
        document.querySelector<HTMLElement>('mat-option[data-mode="repair:finish"]')?.click();
    });

    it('une construction affiche ses PA restants avant et après l\'étape', async (): Promise<void> => {
        const plan: BuildingPlanContentDTO = content();
        plan.programs.regular[0] = { buildingId: 1, kind: 'build', mode: 'leave', targetRemaining: 5 };
        await render(plan);

        expect(items('regular')[0].querySelector('.result')?.textContent).toMatch(/30\s*→\s*5/);
    });

    it('change le mode d\'une étape', async (): Promise<void> => {
        await render();

        chooseMode(items('regular')[0], 'build:leave');

        expect(regular()[0]).toMatchObject({ kind: 'build', mode: 'leave' });
    });

    it('« passer la nuit » n\'est proposé que pour un chantier qui peut perdre des PV', async (): Promise<void> => {
        await render();
        items('regular')[2].querySelector<HTMLElement>('mat-select[data-field="mode"] .mat-mdc-select-trigger')?.click();
        fixture.detectChanges();
        expect(document.querySelector('mat-option[data-mode="repair:survive"]')).toBeNull();
        document.querySelector<HTMLElement>('mat-option[data-mode="repair:finish"]')?.click();
        fixture.detectChanges();

        fake.evaluation.set(fakeEvaluation(content(), { hardMode: true }));
        fixture.detectChanges();
        chooseMode(items('regular')[2], 'repair:survive');

        expect(regular()[2]).toMatchObject({ kind: 'repair', mode: 'survive' });
    });

    it('laisser à N PA : la cible est appliquée après un court délai', async (): Promise<void> => {
        const plan: BuildingPlanContentDTO = content();
        plan.programs.regular[0] = { buildingId: 1, kind: 'build', mode: 'leave', targetRemaining: 5 };
        await render(plan);
        vi.useFakeTimers();

        type(items('regular')[0].querySelector<HTMLInputElement>('input[data-field="target"]') as HTMLInputElement, '12');
        vi.advanceTimersByTime(400);

        expect(regular()[0]).toMatchObject({ mode: 'leave', targetRemaining: 12 });
    });

    it('réparer jusqu\'à : saisir les PV ou les PA règle la même cible', async (): Promise<void> => {
        const plan: BuildingPlanContentDTO = content();
        plan.programs.regular[2] = { buildingId: 3, kind: 'repair', mode: 'leave', targetRemaining: 10 };
        await render(plan);
        vi.useFakeTimers();

        const row: HTMLElement = items('regular')[2];
        expect((row.querySelector<HTMLInputElement>('input[data-field="target-life"]') as HTMLInputElement).value).toBe('20');
        expect((row.querySelector<HTMLInputElement>('input[data-field="target-pa"]') as HTMLInputElement).value).toBe('5');

        type(row.querySelector<HTMLInputElement>('input[data-field="target-life"]') as HTMLInputElement, '24');
        vi.advanceTimersByTime(400);
        expect(regular()[2]).toMatchObject({ mode: 'leave', targetRemaining: 6 });

        type(row.querySelector<HTMLInputElement>('input[data-field="target-pa"]') as HTMLInputElement, '3');
        vi.advanceTimersByTime(400);
        expect(regular()[2]).toMatchObject({ mode: 'leave', targetRemaining: 14 });
    });

    it('les PV max affichés sont ceux de l\'état de la ville utilisé par le calcul', async (): Promise<void> => {
        await render();
        const progress: Map<number, BuildingProgress> = new Map<number, BuildingProgress>([
            [1, { buildingId: 1, paCurrent: 40, invested: 10, built: false, life: 0, maxLife: 30, def: 0, defMax: 30 }],
            [3, { buildingId: 3, paCurrent: 10, invested: 10, built: true, life: 10, maxLife: 40, def: 5, defMax: 15 }]
        ]);
        fake.evaluation.set(fakeEvaluation(content(), { progress }));
        fixture.detectChanges();

        expect(items('regular')[2].querySelector('.result')?.textContent).toMatch(/10\s*→\s*40\s*\/\s*40/);
    });

    it('ajoute une note à une étape', async (): Promise<void> => {
        await render();
        items('regular')[0].querySelector<HTMLButtonElement>('button[data-action="note"]')?.click();
        fixture.detectChanges();
        vi.useFakeTimers();

        type(items('regular')[0].querySelector<HTMLInputElement>('input[data-field="note"]') as HTMLInputElement, 'après 20h');
        vi.advanceTimersByTime(400);

        expect((regular()[0] as PlanStepDTO).note).toBe('après 20h');
    });

    it('un champ de note ouvert ne passe pas à une autre étape quand les rangs changent', async (): Promise<void> => {
        await render();
        items('regular')[2].querySelector<HTMLButtonElement>('button[data-action="note"]')?.click();
        fixture.detectChanges();

        items('regular')[0].querySelector<HTMLButtonElement>('button[data-action="item-menu"]')?.click();
        fixture.detectChanges();
        document.querySelector<HTMLButtonElement>('.mat-mdc-menu-panel button[data-action="remove"]')?.click();
        fixture.detectChanges();

        expect(root().querySelector('input[data-field="note"]')).toBeNull();
    });

    it('les consignes du jour sont limitées à 2000 caractères (limite de l\'API)', async (): Promise<void> => {
        await render();

        expect(root().querySelector('textarea[data-field="instructions"]')?.getAttribute('maxlength')).toBe('2000');
    });

    it('le menu d\'une ligne la passe dans l\'autre section ou la supprime', async (): Promise<void> => {
        await render();

        items('regular')[0].querySelector<HTMLButtonElement>('button[data-action="item-menu"]')?.click();
        fixture.detectChanges();
        document.querySelector<HTMLButtonElement>('.mat-mdc-menu-panel button[data-action="switch-pool"]')?.click();
        fixture.detectChanges();
        expect(fake.draft()?.programs.banned.length).toBe(2);
        expect(regular().length).toBe(2);

        items('regular')[0].querySelector<HTMLButtonElement>('button[data-action="item-menu"]')?.click();
        fixture.detectChanges();
        document.querySelector<HTMLButtonElement>('.mat-mdc-menu-panel button[data-action="remove"]')?.click();
        expect(regular().map((item: PlanItemDTO): number => (isBuildingStep(item) ? item.buildingId : -1))).toEqual([3]);
    });

    it('le glisser-déposer réordonne et change de section', async (): Promise<void> => {
        await render();
        const testable: TestableProgram = fixture.componentInstance as unknown as TestableProgram;

        testable.onDrop({ previousContainer: { data: 'regular' }, container: { data: 'banned' }, previousIndex: 2, currentIndex: 0 } as unknown as CdkDragDrop<PlanPool>);

        expect(fake.draft()?.programs.banned[0]).toMatchObject({ buildingId: 3 });
        expect(regular().length).toBe(2);
    });

    it('« ＋ Chantiers » demande l\'ouverture du tiroir pour la section', async (): Promise<void> => {
        await render();
        const asked: PlanPool[] = [];
        fixture.componentInstance.choose.subscribe((pool: PlanPool): void => {
            asked.push(pool);
        });

        root().querySelector<HTMLButtonElement>('section.pool[data-pool="banned"] button[data-action="choose"]')?.click();

        expect(asked).toEqual(['banned']);
    });

    it('« ＋ Consigne » ajoute une consigne saisie', async (): Promise<void> => {
        await render();
        root().querySelector<HTMLButtonElement>('section.pool[data-pool="banned"] button[data-action="add-instruction"]')?.click();
        fixture.detectChanges();

        const input: HTMLInputElement = root().querySelector<HTMLInputElement>('section.pool[data-pool="banned"] input[data-field="new-instruction"]') as HTMLInputElement;
        input.value = 'Réparer en priorité';
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

        expect(fake.draft()?.programs.banned[1]).toEqual({ kind: 'instruction', text: 'Réparer en priorité' });
    });

    it('modifie le texte d\'une consigne après un court délai', async (): Promise<void> => {
        await render();
        vi.useFakeTimers();

        type(items('regular')[1].querySelector<HTMLInputElement>('input[data-field="instruction"]') as HTMLInputElement, 'Nouveau texte');
        vi.advanceTimersByTime(400);

        expect(regular()[1]).toEqual({ kind: 'instruction', text: 'Nouveau texte' });
    });

    it('les consignes du jour sont enregistrées dans la proposition', async (): Promise<void> => {
        await render();
        vi.useFakeTimers();

        type(root().querySelector<HTMLTextAreaElement>('textarea[data-field="instructions"]') as HTMLTextAreaElement, 'Planches en banque');
        vi.advanceTimersByTime(400);

        expect(fake.draft()?.instructions).toBe('Planches en banque');
    });

    it('lecture seule : ni poignée, ni menu, ni ajout ; champs désactivés', async (): Promise<void> => {
        await render();
        fake.can_edit.set(false);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(root().querySelector('[data-action="item-menu"]')).toBeNull();
        expect(root().querySelector('[data-action="choose"]')).toBeNull();
        expect(root().querySelector('.handle')).toBeNull();
        const inputs: HTMLInputElement[] = Array.from(root().querySelectorAll<HTMLInputElement>('input, textarea'));
        expect(inputs.length).toBeGreaterThan(0);
        expect(inputs.every((input: HTMLInputElement): boolean => input.disabled)).toBe(true);
    });

    it('le vote du soir ne propose que des chantiers construits ou terminés par le programme', async (): Promise<void> => {
        await render();

        const completed: number[] = fake.store.evaluation()?.completedIds ?? [];
        const ids: number[] = (fixture.componentInstance as unknown as TestableProgram).voteOptions().map((building: BuildingRef): number => building.id);
        expect(completed).toContain(1);
        expect(ids).toContain(3);
        expect(ids).not.toContain(1);
        expect(ids).not.toContain(2);
    });

    it('le vote du soir garde le chantier déjà voté même s\'il n\'est pas construit', async (): Promise<void> => {
        const plan: BuildingPlanContentDTO = content();
        plan.eveningVoteBuildingId = 2;
        await render(plan);

        const ids: number[] = (fixture.componentInstance as unknown as TestableProgram).voteOptions().map((building: BuildingRef): number => building.id);
        expect(ids).toContain(2);
    });

    it('une construction rappelle la défense apportée par le chantier, pas une réparation', async (): Promise<void> => {
        await render();

        expect(items('regular')[0].querySelector('.def')?.textContent).toContain('+30');
        expect(items('regular')[2].querySelector('.def')).toBeNull();
    });

    it('la défense affichée est le gain réel : objets de défense consommés retirés', async (): Promise<void> => {
        await render();
        fake.evaluation.set(fakeEvaluation(content(), {
            defenseFactors: { defenseItems: 4, itemFactor: 1, homeRaw: 0, alive: 3, dead: 0, scale: 1 },
            defenseItemIds: new Set<number>([5])
        }));
        fixture.detectChanges();

        expect(items('regular')[0].querySelector('.def')?.getAttribute('data-real')).toBe('28');
    });

    it('le libellé du vote porte l\'icône d\'évolution et le chantier voté son icône', async (): Promise<void> => {
        const plan: BuildingPlanContentDTO = content();
        plan.eveningVoteBuildingId = 2;
        await render(plan);

        const field: HTMLElement = fixture.nativeElement.querySelector('mat-form-field.vote') as HTMLElement;
        expect(field.querySelector('mat-label img')?.getAttribute('src')).toContain('emotes/fortify.gif');
        expect(field.querySelector('.mat-mdc-select-value img')?.getAttribute('src')).toContain('building/');
        expect(field.querySelector('.mat-mdc-select-value')?.textContent).toContain('Atelier');
    });

    it('le vote affiche le niveau atteint, la défense gagnée pour la nuit et le texte d\'évolution', async (): Promise<void> => {
        const plan: BuildingPlanContentDTO = content();
        plan.eveningVoteBuildingId = 3;
        await render(plan);
        fake.upgrades.set({
            gate: {
                maxLevel: 2,
                texts: {
                    base: null,
                    levels: [
                        { de: 'Stufe 1', fr: 'La porte apporte 15 points de défense.', en: 'La porte apporte 15 points de défense.' },
                        { de: 'Stufe 2', fr: 'Niveau 2', en: 'Level 2' }
                    ]
                },
                effects: { defenseIncrement: { levels: [0, 15, 45], default: 0, source: 'BuildingUpgradeListener' } }
            }
        });
        fake.evaluation.set(fakeEvaluation(plan, { upgrades: fake.upgrades() }));
        fixture.detectChanges();

        const gain: HTMLElement | null = fixture.nativeElement.querySelector('[data-field="vote-gain"]');
        expect(gain?.textContent).toContain('Niveau 1');
        expect(gain?.textContent).toContain('+15');
        expect(gain?.textContent).toContain('La porte apporte 15 points de défense.');
    });

    it('le vote du soir sur l\'atelier affiche le seuil gratuit des chantiers restants', async (): Promise<void> => {
        const plan: BuildingPlanContentDTO = content();
        plan.eveningVoteBuildingId = 2;
        plan.programs.regular[0] = { buildingId: 1, kind: 'build', mode: 'leave', targetRemaining: 5 };
        await render(plan);

        expect(items('regular')[0].querySelector<HTMLElement>('.free-threshold')?.textContent).toContain('2');
    });

    describe('second vote (Brasier Sacrificiel)', (): void => {
        /**
         * Rend le plan avec une évaluation où le Brasier est construit au soir.
         * @param {BuildingPlanContentDTO} plan Contenu du plan.
         * @param {Partial<DayEvaluation>} overrides Champs d'évaluation à remplacer.
         */
        async function renderDouble(plan: BuildingPlanContentDTO, overrides: Partial<DayEvaluation> = {}): Promise<void> {
            await render(plan);
            fake.evaluation.set({ ...fakeEvaluation(plan), doubleVote: true, ...overrides });
            fixture.detectChanges();
        }

        it('sans Brasier, un seul vote', async (): Promise<void> => {
            await render();

            expect(root().querySelector('mat-select[data-field="second-vote"]')).toBeNull();
        });

        it('avec le Brasier, le second vote exclut le premier chantier et garde celui déjà choisi', async (): Promise<void> => {
            const plan: BuildingPlanContentDTO = { ...content(), eveningVoteBuildingId: 3, eveningSecondVoteBuildingId: 2 };
            await renderDouble(plan);

            expect(root().querySelector('mat-select[data-field="second-vote"]')).not.toBeNull();
            const ids: number[] = (fixture.componentInstance as unknown as TestableProgram).secondVoteOptions().map((building: BuildingRef): number => building.id);
            expect(ids).toContain(2);
            expect(ids).not.toContain(3);
        });

        it('le second vote affiche sa défense gagnée pour la nuit', async (): Promise<void> => {
            await renderDouble({ ...content(), eveningSecondVoteBuildingId: 3 }, { secondVote: { uid: 'gate', level: 2, defense: 30 } });

            expect(root().querySelector('[data-field="second-vote-gain"]')?.textContent).toContain('+30');
        });

        it('choisir le second chantier l\'enregistre dans le plan', async (): Promise<void> => {
            await renderDouble(content());

            (fixture.componentInstance as unknown as TestableProgram).onSecondVote(3);

            expect(fake.draft()?.eveningSecondVoteBuildingId).toBe(3);
        });

        it('voter en premier le second chantier vide le second vote', async (): Promise<void> => {
            await renderDouble({ ...content(), eveningVoteBuildingId: 2, eveningSecondVoteBuildingId: 3 });

            (fixture.componentInstance as unknown as TestableProgram).onVote(3);

            expect(fake.draft()?.eveningVoteBuildingId).toBe(3);
            expect(fake.draft()?.eveningSecondVoteBuildingId).toBeNull();
        });
    });
});
