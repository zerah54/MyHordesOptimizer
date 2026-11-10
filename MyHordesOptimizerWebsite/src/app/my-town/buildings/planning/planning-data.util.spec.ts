import { BuildingDTO } from '../../../_abstract_model/dto/building.dto';
import { HomeEnum } from '../../../_abstract_model/enum/home.enum';
import { JobEnum } from '../../../_abstract_model/enum/job.enum';
import { Building } from '../../../_abstract_model/types/building.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenExpedition } from '../../../_abstract_model/types/citizen-expedition.class';
import { Expedition } from '../../../_abstract_model/types/expedition.class';
import { ExpeditionPart, ExpeditionPartRoute } from '../../../_abstract_model/types/expedition-part.class';
import { Home } from '../../../_abstract_model/types/home.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { ExpeditionPartPa } from './budget.util';
import { BuildingProgress } from './building-progress.util';
import { HomeReferentialDTO } from './home-referential.types';
import { TownBuildingStateDTO } from './plan.types';
import { BuildingRef, CitizenRef, HomeLevelRef, SLAVERY_UID, WORKSHOP_UID } from './plan-evaluation.util';
import {
    bankMap,
    buildingProgressMap,
    buildingRefs,
    citizenRefs,
    expeditionParts,
    hasSlaveryOf,
    homeLevelRefs,
    homeUpgradeResources,
    itemValueMap,
    PlanTier,
    planTierMap,
    workshopLevelOf
} from './planning-data.util';
import { ResourceCount } from './resources.util';

function building(overrides: Partial<BuildingDTO> = {}): Building {
    return new Building({
        id: 1, uid: 'wall', img: '', label: { fr: 'Mur' }, description: { fr: '' }, parentId: null, displayOrder: 0,
        pa: 40, defence: 30, maxLife: 30, breakable: true, temporary: false, hasUpgrade: false, rarity: 0,
        resources: [{ itemId: 5, uid: 'wood', img: '', label: { fr: 'Bois' }, count: 2 }],
        hasHardMode: true, tier0Ap: 60, tier1Ap: 50, tier2Ap: 40,
        tier0Resources: [{ itemId: 5, uid: 'wood', img: '', label: { fr: 'Bois' }, count: 6 }],
        tier1Resources: [{ itemId: 5, uid: 'wood', img: '', label: { fr: 'Bois' }, count: 4 }],
        hardBlueprintLevel: null, availability: {},
        ...overrides
    });
}

function state(overrides: Partial<TownBuildingStateDTO> = {}): TownBuildingStateDTO {
    return {
        buildingId: 1, isBuilt: false, paCurrent: null, apRemaining: null, life: null, maxLife: null, def: null,
        level: null, difficulty: null, resources: [], ...overrides
    };
}

describe('planning-data.util', (): void => {
    describe('buildingRefs', (): void => {
        it('sans état synchronisé, replie sur le palier 0 du référentiel', (): void => {
            const refs: Map<number, BuildingRef> = buildingRefs([building()], [], true, 'fr');
            expect(refs.get(1)?.pa).toBe(60);
            expect(refs.get(1)?.resources).toEqual([{ itemId: 5, count: 6 }]);
            expect(refs.get(1)?.label).toBe('Mur');
        });

        it('hors Pandémonium, replie sur le jeu par défaut', (): void => {
            expect(buildingRefs([building()], [], false, 'fr').get(1)?.pa).toBe(40);
        });

        it('l\'état synchronisé prime sur le référentiel', (): void => {
            const refs: Map<number, BuildingRef> = buildingRefs(
                [building()],
                [state({ paCurrent: 33, resources: [{ itemId: 7, count: 1 }] })],
                true,
                'fr'
            );
            expect(refs.get(1)?.pa).toBe(33);
            expect(refs.get(1)?.resources).toEqual([{ itemId: 7, count: 1 }]);
        });

        it('un état sans ressources garde celles du référentiel', (): void => {
            expect(buildingRefs([building()], [state({ paCurrent: 33 })], false, 'fr').get(1)?.resources).toEqual([{ itemId: 5, count: 2 }]);
        });

        it('un libellé absent de la langue retombe sur l\'uid', (): void => {
            expect(buildingRefs([building({ label: { en: 'Wall' } })], [], false, 'fr').get(1)?.label).toBe('wall');
        });
        it('en Pandémonium, un chantier sans état prend le coût du niveau de plan estimé', (): void => {
            const refs: Map<number, BuildingRef> = buildingRefs([building()], [], true, 'fr', new Map<number, PlanTier>([[1, 1]]));
            expect(refs.get(1)?.pa).toBe(50);
            expect(refs.get(1)?.resources).toEqual([{ itemId: 5, count: 4 }]);
        });

        it('le niveau de plan estimé est sans effet hors Pandémonium ou avec un état synchronisé', (): void => {
            expect(buildingRefs([building()], [], false, 'fr', new Map<number, PlanTier>([[1, 1]])).get(1)?.pa).toBe(40);
            expect(buildingRefs([building()], [state({ paCurrent: 33 })], true, 'fr', new Map<number, PlanTier>([[1, 1]])).get(1)?.pa).toBe(33);
        });

        it('reprend le parent et le caractère cassable du référentiel', (): void => {
            const refs: Map<number, BuildingRef> = buildingRefs([building({ parentId: 9, breakable: false })], [], false, 'fr');
            expect(refs.get(1)?.parentId).toBe(9);
            expect(refs.get(1)?.breakable).toBe(false);
        });
    });

    describe('buildingProgressMap', (): void => {
        it('en Pandémonium, le coût d\'un chantier sans état suit le niveau de plan estimé', (): void => {
            expect(buildingProgressMap([building()], [], true, new Map<number, PlanTier>([[1, 2]])).get(1)?.paCurrent).toBe(40);
            expect(buildingProgressMap([building()], [], true).get(1)?.paCurrent).toBe(60);
        });

        it('un chantier sans état n\'a rien d\'investi', (): void => {
            const map: Map<number, BuildingProgress> = buildingProgressMap([building()], [], false);
            expect(map.get(1)?.invested).toBe(0);
            expect(map.get(1)?.built).toBe(false);
            expect(map.get(1)?.defMax).toBe(30);
        });

        it('déduit l\'investi des PA restants bruts', (): void => {
            const map: Map<number, BuildingProgress> = buildingProgressMap([building()], [state({ paCurrent: 40, apRemaining: 12 })], false);
            expect(map.get(1)?.invested).toBe(28);
        });

        it('un chantier construit garde ses PV et sa défense', (): void => {
            const map: Map<number, BuildingProgress> = buildingProgressMap(
                [building()],
                [state({ isBuilt: true, life: 10, maxLife: 30, def: 5, paCurrent: 40, apRemaining: 0 })],
                false
            );
            expect(map.get(1)?.built).toBe(true);
            expect(map.get(1)?.life).toBe(10);
            expect(map.get(1)?.def).toBe(5);
        });
    });

    describe('planTierMap', (): void => {
        it('un contenu enregistré avant les niveaux de plan (champ absent) donne une table vide', (): void => {
            expect(planTierMap(undefined).size).toBe(0);
            expect(planTierMap(null).size).toBe(0);
        });

        it('garde les niveaux 0 à 2 aux clés numériques', (): void => {
            expect(Array.from(planTierMap({ '1': 2, '2': 0, x: 1, '3': 5, '4': -1, '5': 1.5 }).entries())).toEqual([[1, 2], [2, 0]]);
        });
    });

    describe('workshopLevelOf / hasSlaveryOf', (): void => {
        const workshop: Building = building({ id: 2, uid: WORKSHOP_UID });
        const slavery: Building = building({ id: 3, uid: SLAVERY_UID });

        it('niveau de l\'atelier construit, 0 sinon', (): void => {
            expect(workshopLevelOf([workshop], [state({ buildingId: 2, isBuilt: true, level: 3 })])).toBe(3);
            expect(workshopLevelOf([workshop], [state({ buildingId: 2, isBuilt: false, level: 3 })])).toBe(0);
            expect(workshopLevelOf([workshop], [])).toBe(0);
            expect(workshopLevelOf([workshop], [state({ buildingId: 2, isBuilt: true, level: null })])).toBe(0);
        });

        it('BDE présent seulement s\'il est construit', (): void => {
            expect(hasSlaveryOf([slavery], [state({ buildingId: 3, isBuilt: true })])).toBe(true);
            expect(hasSlaveryOf([slavery], [state({ buildingId: 3, isBuilt: false })])).toBe(false);
            expect(hasSlaveryOf([slavery], [])).toBe(false);
        });
    });

    describe('citizenRefs', (): void => {
        function citizen(overrides: Partial<Citizen>): Citizen {
            return Object.assign(new Citizen(), { id: 1, name: 'A', is_dead: false, is_shunned: false }, overrides);
        }

        it('exclut les morts, reconnaît le banni et le technicien', (): void => {
            const refs: CitizenRef[] = citizenRefs([
                citizen({ id: 1 }),
                citizen({ id: 2, is_shunned: true }),
                citizen({ id: 3, job: JobEnum.TECHNICIAN }),
                citizen({ id: 4, is_dead: true })
            ]);
            expect(refs.map((ref: CitizenRef): number => ref.userId)).toEqual([1, 2, 3]);
            expect(refs[1].banned).toBe(true);
            expect(refs[2].technician).toBe(true);
            expect(refs[0].technician).toBe(false);
        });

        it('lit le niveau de maison, null quand il est absent', (): void => {
            const home: Home = Object.assign(new Home(), { content: [{ element: HomeEnum.HOUSE_LEVEL, value: 3 }] });
            expect(citizenRefs([citizen({ home })])[0].homeLevel).toBe(3);
            expect(citizenRefs([citizen({})])[0].homeLevel).toBeNull();
        });

        it('niveaux négatifs (non définis) = niveau 0, habitation comme améliorations', (): void => {
            const home: Home = Object.assign(new Home(), { content: [{ element: HomeEnum.HOUSE_LEVEL, value: -1 }, { element: HomeEnum.KITCHEN_LEVEL, value: -1 }] });
            const ref: CitizenRef = citizenRefs([citizen({ home })])[0];
            expect(ref.homeLevel).toBe(0);
            expect(ref.upgradeLevels?.get(HomeEnum.KITCHEN_LEVEL.key)).toBe(0);
        });

        it('lit le niveau des améliorations (booléen = 0 ou 1), null sans données de maison', (): void => {
            const home: Home = Object.assign(new Home(), {
                content: [{ element: HomeEnum.HOUSE_LEVEL, value: 3 }, { element: HomeEnum.LAB_LEVEL, value: 2 }, { element: HomeEnum.HAS_FENCE, value: true }]
            });
            const levels: ReadonlyMap<string, number> | null = citizenRefs([citizen({ home })])[0].upgradeLevels;
            expect(levels?.get(HomeEnum.LAB_LEVEL.key)).toBe(2);
            expect(levels?.get(HomeEnum.HAS_FENCE.key)).toBe(1);
            expect(levels?.has(HomeEnum.HOUSE_LEVEL.key)).toBe(false);
            expect(citizenRefs([citizen({})])[0].upgradeLevels).toBeNull();
        });
    });

    describe('expeditionParts', (): void => {
        it('longueur du tracé et citoyens inscrits ; sans tracé : longueur nulle', (): void => {
            const route: ExpeditionPartRoute = { length: 6 } as ExpeditionPartRoute;
            const registered: CitizenExpedition = Object.assign(new CitizenExpedition(), { citizen_id: 1 });
            const placeholder: CitizenExpedition = Object.assign(new CitizenExpedition(), { citizen_id: undefined });
            const expedition: Expedition = Object.assign(new Expedition(), {
                parts: [
                    Object.assign(new ExpeditionPart(), { map_route: route, citizens: [registered, placeholder] }),
                    Object.assign(new ExpeditionPart(), { map_route: null, citizens: [registered] })
                ]
            });

            const parts: ExpeditionPartPa[] = expeditionParts([expedition]);

            expect(parts).toEqual([{ routeLength: 6, seats: [{ citizenId: 1, startPe: 0 }] }, { routeLength: null, seats: [{ citizenId: 1, startPe: 0 }] }]);
        });

        it('parties d\'expédition : PE de départ de chaque place, 0 sans PE exigés', (): void => {
            const with_pe: CitizenExpedition = Object.assign(new CitizenExpedition(), { citizen_id: 1, required_sp: 3, required_sp_operator: 'max' });
            const without_pe: CitizenExpedition = Object.assign(new CitizenExpedition(), { citizen_id: 2 });
            const expedition: Expedition = Object.assign(new Expedition(), {
                parts: [Object.assign(new ExpeditionPart(), { map_route: { length: 8 } as ExpeditionPartRoute, citizens: [with_pe, without_pe] })]
            });

            expect(expeditionParts([expedition])).toEqual([{ routeLength: 8, seats: [{ citizenId: 1, startPe: 3 }, { citizenId: 2, startPe: 0 }] }]);
        });
    });

    describe('bankMap', (): void => {
        it('additionne les quantités par objet et ignore les objets cassés', (): void => {
            const bank: Map<number, number> = bankMap([
                Object.assign(new Item(), { id: 5, bank_count: 3 }),
                Object.assign(new Item(), { id: 5, bank_count: 2, is_broken: true }),
                Object.assign(new Item(), { id: 7, bank_count: 1 }),
                Object.assign(new Item(), { id: 5, bank_count: 4 })
            ]);
            expect(bank.get(5)).toBe(7);
            expect(bank.get(7)).toBe(1);
        });
    });

    describe('itemValueMap', (): void => {
        it('convertit les clés en nombres et ignore les clés invalides', (): void => {
            const values: Map<number, number> = itemValueMap({ '5': 2, abc: 3, '7': 0 });
            expect(values.get(5)).toBe(2);
            expect(values.get(7)).toBe(0);
            expect(values.size).toBe(2);
        });
    });

    describe('homeUpgradeResources', (): void => {
        it('indexe par clé HomeEnum puis par niveau, en ignorant les améliorations et uid inconnus', (): void => {
            const referential: HomeReferentialDTO = {
                levels: [],
                upgrades: [
                    { name: 'lock', label: 'Schloss', description: '', levels: [{ level: 1, ap: 3, resources: [{ itemUid: 'wood_bad_#00', count: 2 }, { itemUid: 'inconnu', count: 9 }] }] },
                    { name: 'inconnue', label: '?', description: '', levels: [{ level: 1, ap: 1, resources: [{ itemUid: 'wood_bad_#00', count: 1 }] }] }
                ]
            };

            const resources: Map<string, ReadonlyMap<number, ResourceCount[]>> = homeUpgradeResources(referential, new Map<string, number>([['wood_bad_#00', 12]]));

            expect(Array.from(resources.keys())).toEqual([HomeEnum.HAS_LOCK.key]);
            expect(resources.get(HomeEnum.HAS_LOCK.key)?.get(1)).toEqual([{ itemId: 12, count: 2 }]);
        });
    });

    describe('homeLevelRefs', (): void => {
        it('indexe par niveau et résout les ressources, en ignorant les uid inconnus', (): void => {
            const referential: HomeReferentialDTO = {
                levels: [
                    { level: 0, label: 'Feldbett', icon: '', def: 0, ap: 0, apUrbanism: 0, resources: [], resourcesUrbanism: [], buildingUid: null, allowsUpgrades: false, theft: false },
                    {
                        level: 2, label: 'Baracke', icon: '', def: 4, ap: 4, apUrbanism: 3, buildingUid: null, allowsUpgrades: true, theft: false,
                        resources: [{ itemUid: 'wood_bad_#00', count: 1 }, { itemUid: 'inconnu', count: 9 }], resourcesUrbanism: [{ itemUid: 'wood_bad_#00', count: 2 }]
                    }
                ],
                upgrades: []
            };

            const refs: Map<number, HomeLevelRef> = homeLevelRefs(referential, new Map<string, number>([['wood_bad_#00', 12]]), 'fr');

            expect(refs.get(2)?.resources).toEqual([{ itemId: 12, count: 1 }]);
            expect(refs.get(2)?.def).toBe(4);
            expect(refs.get(2)?.apUrbanism).toBe(3);
            expect(refs.get(2)?.resourcesUrbanism).toEqual([{ itemId: 12, count: 2 }]);
            expect(refs.get(0)?.resources).toEqual([]);
        });

        it('le libellé suit la langue du site, avec repli sur le référentiel', (): void => {
            const referential: HomeReferentialDTO = {
                levels: [
                    { level: 1, label: 'Zelt', icon: '', def: 1, ap: 2, apUrbanism: 2, resources: [], resourcesUrbanism: [], buildingUid: null, allowsUpgrades: true, theft: false },
                    { level: 99, label: 'Palast', icon: '', def: 50, ap: 9, apUrbanism: 9, resources: [], resourcesUrbanism: [], buildingUid: null, allowsUpgrades: true, theft: false }
                ],
                upgrades: []
            };

            expect(homeLevelRefs(referential, new Map<string, number>(), 'fr').get(1)?.label).toBe('Tente');
            expect(homeLevelRefs(referential, new Map<string, number>(), 'en').get(1)?.label).toBe('Tent');
            expect(homeLevelRefs(referential, new Map<string, number>(), 'xx').get(1)?.label).toBe('Zelt');
            expect(homeLevelRefs(referential, new Map<string, number>(), 'fr').get(99)?.label).toBe('Palast');
        });
    });
});
