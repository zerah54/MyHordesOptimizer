import { BuildingUpgradesDTO, CEMETERY_RATIO_EFFECT, TOWN_DEFENSE_SCALE_EFFECT } from './building-upgrades.types';
import { buildingDefenseGain, defenseGain, DefenseGainContext, DefenseGainResult, neutralDefenseFactors, TownDefenseFactors } from './defense-gain.util';
import { CEMETERY_UID, CIRCULAR_QUARTERS_UID, COFFINS_UID, DEFENSE_ADJUSTMENT_UID, DEFENSE_FIXINGS_UID, FORTIFIED_HOMES_UID } from './defense-rules.const';
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
});
