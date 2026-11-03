import { PlanningDay, PlanningStatic } from '../../../_abstract_model/services/planning-data.service';
import { Building } from '../../../_abstract_model/types/building.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenExpedition } from '../../../_abstract_model/types/citizen-expedition.class';
import { Expedition } from '../../../_abstract_model/types/expedition.class';
import { ExpeditionPart, ExpeditionPartRoute } from '../../../_abstract_model/types/expedition-part.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { BuildingPlanContentDTO, emptyPlanContent } from './plan.types';
import { CitizenRef, DayInput } from './plan-evaluation.util';
import { buildDayInputs, PlanningContext } from './plan-inputs.util';

function wall(): Building {
    return new Building({
        id: 1, uid: 'wall', img: '', label: { fr: 'Mur' }, description: { fr: '' }, parentId: null, displayOrder: 0,
        pa: 40, defence: 30, maxLife: 30, breakable: true, temporary: false, hasUpgrade: false, rarity: 0,
        resources: [{ itemId: 5, uid: 'wood', img: '', label: { fr: 'Bois' }, count: 2 }],
        hasHardMode: false, tier0Ap: null, tier1Ap: null, tier2Ap: null, tier0Resources: [], tier1Resources: [],
        hardBlueprintLevel: null, availability: {}
    });
}

function expedition(route_length: number, citizen_id: number): Expedition {
    const citizen: CitizenExpedition = Object.assign(new CitizenExpedition(), { citizen_id });
    const part: ExpeditionPart = Object.assign(new ExpeditionPart(), { map_route: { length: route_length } as ExpeditionPartRoute, citizens: [citizen] });
    return Object.assign(new Expedition(), { parts: [part] });
}

function context(overrides: Partial<PlanningContext> = {}, data_overrides: Partial<PlanningStatic> = {}): PlanningContext {
    const data: PlanningStatic = {
        plans: { access: { isCitizen: true, canEdit: true }, plans: [], itemValues: { '5': 2 }, settingsVersion: 1 },
        state: {
            buildings: [{ buildingId: 1, isBuilt: false, paCurrent: 40, apRemaining: 12, life: null, maxLife: null, def: null, level: null, difficulty: null, resources: [] }],
            defense: { total: 1000, base: null, buildings: null, upgrades: null, items: null, itemsMul: null, citizenHomes: null, citizenGuardians: null, watchmen: null, souls: null, temp: 20, cadavers: null, bonus: null }
        },
        buildings: [wall()],
        items: [Object.assign(new Item(), { id: 5, uid: 'wood' })],
        homes: { levels: [{ level: 1, label: 'Zelt', icon: '', def: 1, ap: 2, apUrbanism: 2, resources: [{ itemUid: 'wood', count: 1 }], resourcesUrbanism: [], buildingUid: null, allowsUpgrades: true, theft: false }], upgrades: [] },
        citizens: [Object.assign(new Citizen(), { id: 1, name: 'A', is_dead: false })],
        bank: [Object.assign(new Item(), { id: 5, bank_count: 3 })],
        upgrades: {},
        item_emotes: {},
        ...data_overrides
    };
    const days: Map<number, PlanningDay> = new Map<number, PlanningDay>([[10, { expeditions: [expedition(6, 1)], attack: 1400 }]]);
    return { data, days, hard_mode: false, locale: 'fr', ...overrides };
}

describe('buildDayInputs', (): void => {
    const empty: BuildingPlanContentDTO = emptyPlanContent();

    it('chaque jour applique les niveaux de plan de sa propre proposition', (): void => {
        const hard_wall: Building = new Building({
            id: 1, uid: 'wall', img: '', label: { fr: 'Mur' }, description: { fr: '' }, parentId: null, displayOrder: 0,
            pa: 40, defence: 30, maxLife: 30, breakable: true, temporary: false, hasUpgrade: false, rarity: 0, resources: [],
            hasHardMode: true, tier0Ap: 60, tier1Ap: 50, tier2Ap: 40, tier0Resources: [], tier1Resources: [],
            hardBlueprintLevel: null, availability: {}
        });
        const data: Partial<PlanningStatic> = { buildings: [hard_wall], state: { buildings: [], defense: null } };
        const [first, second]: DayInput[] = buildDayInputs(
            context({ hard_mode: true }, data),
            10,
            [empty, { ...empty, planTiers: { '1': 1 } }]
        );
        expect(first.progress.get(1)?.paCurrent).toBe(60);
        expect(second.progress.get(1)?.paCurrent).toBe(50);
        expect(second.buildings.get(1)?.pa).toBe(50);
    });

    it('renvoie une entrée par contenu', (): void => {
        expect(buildDayInputs(context(), 10, [empty, empty, empty]).length).toBe(3);
    });

    it('le premier jour porte l\'avancement, la défense et la défense temporaire synchronisés', (): void => {
        const [first]: DayInput[] = buildDayInputs(context(), 10, [empty]);
        expect(first.progress.get(1)?.invested).toBe(28);
        expect(first.baseDefense).toBe(1000);
        expect(first.temporaryDefense).toBe(20);
        expect(first.workshopLevel).toBe(0);
        expect(first.hasSlavery).toBe(false);
    });

    it('l\'attaque et les PA d\'expédition viennent du jour correspondant', (): void => {
        const [day10, day11]: DayInput[] = buildDayInputs(context(), 10, [empty, empty]);
        expect(day10.attack).toBe(1400);
        expect(day10.expeditionPa.get(1)).toBe(6);
        expect(day11.attack).toBeNull();
        expect(day11.expeditionPa.size).toBe(0);
    });

    it('défense absente : base 0', (): void => {
        const [first]: DayInput[] = buildDayInputs(context({}, { state: { buildings: [], defense: null } }), 10, [empty]);
        expect(first.baseDefense).toBe(0);
        expect(first.temporaryDefense).toBe(0);
    });

    it('banque, valeurs d\'objets, citoyens, chantiers et habitations sont fournis', (): void => {
        const [first]: DayInput[] = buildDayInputs(context(), 10, [empty]);
        expect(first.bank.get(5)).toBe(3);
        expect(first.itemValues.get(5)).toBe(2);
        expect(first.citizens.map((citizen: CitizenRef): number => citizen.userId)).toEqual([1]);
        expect(first.buildings.get(1)?.label).toBe('Mur');
        expect(first.homes.get(1)?.resources).toEqual([{ itemId: 5, count: 1 }]);
        expect(first.content).toBe(empty);
    });
});
