import { BuildingUpgradesDTO, CEMETERY_RATIO_EFFECT, TOWN_DEFENSE_SCALE_EFFECT } from './building-upgrades.types';
import {
    buildingDefenseGain,
    defenseGain,
    DefenseGainContext,
    DefenseGainResult,
    neutralDefenseFactors,
    PlannedDefense,
    plannedDefenseGains,
    TownDefenseFactors
} from './defense-gain.util';
import {
    CEMETERY_UID,
    CIRCULAR_QUARTERS_UID,
    COFFINS_UID,
    DEFENSE_ADJUSTMENT_UID,
    DEFENSE_FIXINGS_STEP,
    DEFENSE_FIXINGS_UID,
    FORTIFIED_HOMES_UID
} from './defense-rules.const';
import { BuildingRef } from './plan-evaluation.util';

/** Objet de défense de test (tôle). */
const PLATE: number = 50;

/** Évolutions de test, aux valeurs du jeu. */
const UPGRADES: BuildingUpgradesDTO = {
    [CEMETERY_UID]: { maxLevel: 2, effects: { [CEMETERY_RATIO_EFFECT]: { levels: [3, 7, 14], default: 14, source: 'TownHandler' } } },
    [DEFENSE_ADJUSTMENT_UID]: { maxLevel: 3, effects: { [TOWN_DEFENSE_SCALE_EFFECT]: { levels: [1.1, 1.11, 1.12, 1.13], default: 1, source: 'BuildingQueryListener' } } }
};

/**
 * Chantier de test.
 * @param {string} uid Uid.
 * @param {number} defence Défense propre.
 * @param {BuildingRef['resources']} resources Ressources.
 * @returns {BuildingRef} Chantier.
 */
function building(uid: string, defence: number, resources: BuildingRef['resources'] = []): BuildingRef {
    return { id: uid.length, uid, label: uid, pa: 10, defence, maxLife: 10, temporary: false, breakable: true, parentId: null, resources };
}

/**
 * Contexte de test : 10 tôles en banque, maisons à 100 de défense brute, 20 vivants, 5 morts.
 * @param {Partial<TownDefenseFactors>} factors Composantes à remplacer.
 * @param {string[]} built Uids déjà construits.
 * @returns {DefenseGainContext} Contexte.
 */
function context(factors: Partial<TownDefenseFactors> = {}, built: string[] = []): DefenseGainContext {
    return {
        builtBefore: new Set<string>(built),
        factors: { ...neutralDefenseFactors(), defenseItems: 10, itemFactor: 1, homeRaw: 100, alive: 20, dead: 5, ...factors },
        defenseItemIds: new Set<number>([PLATE]),
        upgrades: UPGRADES,
        baseDefense: 0
    };
}

describe('defense-gain.util', (): void => {
    it('un chantier ordinaire apporte sa défense propre', (): void => {
        expect(buildingDefenseGain(building('wall', 30), context())).toBe(30);
    });

    it('la défense des objets de défense consommés est retirée (multiplicateur et arrondi de la banque)', (): void => {
        const pit: BuildingRef = building('pit', 25, [{ itemId: PLATE, count: 3 }, { itemId: 1, count: 4 }]);

        expect(buildingDefenseGain(pit, context())).toBe(22);
        expect(buildingDefenseGain(pit, context({ itemFactor: 1.5 }))).toBe(20);
        expect(buildingDefenseGain(pit, context({ defenseItems: 2 }))).toBe(23);
    });

    it('Habitations fortifiées : +4 par maison de vivant, comptées à 40 %, 80 % avec Quartiers circulaires', (): void => {
        expect(buildingDefenseGain(building(FORTIFIED_HOMES_UID, 0), context())).toBe(32);
        expect(buildingDefenseGain(building(FORTIFIED_HOMES_UID, 0), context({}, [CIRCULAR_QUARTERS_UID]))).toBe(64);
    });

    it('Quartiers circulaires : la défense des maisons passe de 40 % à 80 %', (): void => {
        expect(buildingDefenseGain(building(CIRCULAR_QUARTERS_UID, 0), context())).toBe(40);
    });

    it('les deux le même jour se cumulent', (): void => {
        const result: DefenseGainResult = defenseGain([building(FORTIFIED_HOMES_UID, 0), building(CIRCULAR_QUARTERS_UID, 0)], 0, context());

        expect(result.total).toBe(104);
        expect(result.factorsAfter.homeRaw).toBe(180);
    });

    it('Fixations de défenses : les objets de défense valent 0,5 de plus', (): void => {
        const result: DefenseGainResult = defenseGain([building(DEFENSE_FIXINGS_UID, 0)], 0, context());

        expect(result.total).toBe(5);
        expect(result.factorsAfter.itemFactor).toBe(1.5);
    });

    it('Cercueils sur ressorts : +10 par mort, seulement avec le cimetière', (): void => {
        expect(buildingDefenseGain(building(COFFINS_UID, 0), context({}, [CEMETERY_UID]))).toBe(50);
        expect(buildingDefenseGain(building(COFFINS_UID, 0), context())).toBe(0);
    });

    it('une montée de maison compte au pourcentage de la ville ; l\'échelle globale s\'applique à tout', (): void => {
        expect(defenseGain([], 10, context()).total).toBe(4);
        expect(buildingDefenseGain(building('wall', 30), context({ scale: 1.1 }))).toBe(33);
    });

    it('Cimetière cadenassé construit : défense par mort de son niveau 0 (donnée extraite)', (): void => {
        expect(buildingDefenseGain(building(CEMETERY_UID, 0), context())).toBe(15);
    });

    it('Cimetière et Cercueils le même jour se cumulent', (): void => {
        expect(defenseGain([building(CEMETERY_UID, 0), building(COFFINS_UID, 0)], 0, context()).total).toBe(65);
    });

    it('Ajustement défensif construit : toute la défense de la ville passe à l\'échelle de son niveau 0', (): void => {
        const result: DefenseGainResult = defenseGain([building(DEFENSE_ADJUSTMENT_UID, 0)], 0, { ...context(), baseDefense: 1000 });

        expect(result.total).toBe(100);
        expect(result.factorsAfter.scale).toBe(1.1);
    });

    it('sans donnée d\'évolution, Cimetière et Ajustement défensif n\'ajoutent rien', (): void => {
        expect(buildingDefenseGain(building(CEMETERY_UID, 0), { ...context(), upgrades: {} })).toBe(0);
        expect(buildingDefenseGain(building(DEFENSE_ADJUSTMENT_UID, 0), { ...context(), upgrades: {}, baseDefense: 1000 })).toBe(0);
    });

    it('un chantier déjà construit ne compte pas deux fois ses effets', (): void => {
        expect(buildingDefenseGain(building(CIRCULAR_QUARTERS_UID, 0), context({}, [CIRCULAR_QUARTERS_UID]))).toBe(0);
    });

    it('le vote sur les Fixations relève le multiplicateur des objets de défense', (): void => {
        const result: DefenseGainResult = defenseGain([], 0, context({ itemFactor: 1.5 }), DEFENSE_FIXINGS_STEP);

        expect(result.total).toBe(5);
        expect(result.factorsAfter.itemFactor).toBe(2);
    });

    describe('plannedDefenseGains', (): void => {
        const scouts: BuildingRef = building('scouts', 0, [{ itemId: PLATE, count: 1 }]);
        const fixings: BuildingRef = building(DEFENSE_FIXINGS_UID, 0);
        const fortified: BuildingRef = building(FORTIFIED_HOMES_UID, 0);
        const circular: BuildingRef = building(CIRCULAR_QUARTERS_UID, 0);

        it('un objet consommé compte au multiplicateur du soir, les Fixations sur la banque actuelle', (): void => {
            const planned: PlannedDefense = plannedDefenseGains([scouts, fixings], [], 0, context({ defenseItems: 8 }), 0);

            expect(planned.buildings.get(fixings.id)).toBe(4);
            expect(planned.buildings.get(scouts.id)).toBe(-2);
        });

        it('la banque est arrondie à l\'inférieur : à 1,5, un objet consommé fait perdre 1 ou 2', (): void => {
            const planned: PlannedDefense = plannedDefenseGains([scouts, fixings], [], 0, context({ defenseItems: 7 }), 0);

            expect(planned.buildings.get(fixings.id)).toBe(3);
            expect(planned.buildings.get(scouts.id)).toBe(-1);
        });

        it('le vote sur les Fixations compte sur la banque actuelle ; la somme égale le gain de la journée', (): void => {
            const day: DefenseGainContext = context({ defenseItems: 8 });
            const planned: PlannedDefense = plannedDefenseGains([scouts, fixings], [], 0, day, DEFENSE_FIXINGS_STEP);

            expect(planned.buildings.get(fixings.id)).toBe(4);
            expect(planned.vote).toBe(4);
            expect(planned.buildings.get(scouts.id)).toBe(-2);
            expect(planned.vote + 4 - 2).toBe(defenseGain([scouts, fixings], 0, day, DEFENSE_FIXINGS_STEP).total);
        });

        it('Quartiers circulaires reprennent les Habitations fortifiées du jour, qui restent au facteur actuel', (): void => {
            const planned: PlannedDefense = plannedDefenseGains([circular, fortified], [], 0, context(), 0);

            expect(planned.buildings.get(fortified.id)).toBe(32);
            expect(planned.buildings.get(circular.id)).toBe(72);
        });

        it('Quartiers circulaires reprennent les montées de maison du jour', (): void => {
            expect(plannedDefenseGains([circular], [], 10, context(), 0).buildings.get(circular.id)).toBe(44);
        });

        it('Cercueils sur ressorts comptent avec le Cimetière construit le même jour', (): void => {
            const coffins: BuildingRef = building(COFFINS_UID, 0);
            const cemetery: BuildingRef = building(CEMETERY_UID, 0);
            const planned: PlannedDefense = plannedDefenseGains([coffins, cemetery], [], 0, context(), 0);

            expect(planned.buildings.get(coffins.id)).toBe(50);
            expect(planned.buildings.get(cemetery.id)).toBe(15);
        });

        it('Ajustement défensif compte sur la défense actuelle, les autres chantiers du jour à sa nouvelle échelle', (): void => {
            const adjustment: BuildingRef = building(DEFENSE_ADJUSTMENT_UID, 0);
            const wall: BuildingRef = building('wall', 30);
            const planned: PlannedDefense = plannedDefenseGains([wall, adjustment], [], 0, { ...context(), baseDefense: 1000 }, 0);

            expect(planned.buildings.get(adjustment.id)).toBe(100);
            expect(planned.buildings.get(wall.id)).toBe(33);
        });

        it('un chantier non terminé dans la journée compte comme ajouté à l\'état du soir', (): void => {
            expect(plannedDefenseGains([fixings], [scouts], 0, context({ defenseItems: 8 }), 0).buildings.get(scouts.id)).toBe(-2);
            expect(plannedDefenseGains([circular], [fortified], 0, context(), 0).buildings.get(fortified.id)).toBe(64);
        });
    });
});
