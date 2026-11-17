import { HeroSkillLevels, UNKNOWN_HERO_SKILL_LEVELS } from '../types/hero-skill-levels';
import { Home } from '../types/home.class';
import {
    dailyActionAp,
    dailyActionDefaultUses,
    DailyActionEnum,
    dailyActionMaxUses,
    displayableDailyActions,
    isDailyActionAvailable,
    isPlannableAction,
    planningDailyActions
} from './daily-action.enum';
import { HomeEnum } from './home.enum';
import { JobEnum } from './job.enum';

describe('DailyActionEnum', (): void => {
    it('resolves HOME_SHOWER by key', (): void => {
        expect(DailyActionEnum.getByKey<DailyActionEnum>('home_shower')).toBe(DailyActionEnum.HOME_SHOWER);
    });

    it('returns undefined for an unknown key', (): void => {
        expect(DailyActionEnum.getByKey<DailyActionEnum>('unknown_key')).toBeUndefined();
    });

    it('liste les actions de maison puis les actions de chantier', (): void => {
        expect(DailyActionEnum.getAllValues<DailyActionEnum>().map((action: DailyActionEnum): string => action.key)).toEqual([
            'home_pool', 'home_shower', 'home_clean', 'home_rest',
            'home_defbuff', 'home_crows', 'home_survivalist', 'home_contemplate', 'home_scavenge', 'trash', 'home_heal',
            'item_dice', 'item_cards', 'item_soccer'
        ]);
    });

    it('exposes label and icon for each entry', (): void => {
        expect(DailyActionEnum.HOME_SHOWER.getLabel()).toBeTruthy();
        expect(DailyActionEnum.HOME_SHOWER.value.img).toBe('building/small_shower.gif');
    });

    it('resolves HOME_REST by key', (): void => {
        expect(DailyActionEnum.getByKey<DailyActionEnum>('home_rest')).toBe(DailyActionEnum.HOME_REST);
    });

    it('exposes label and icon for HOME_REST', (): void => {
        expect(DailyActionEnum.HOME_REST.getLabel()).toBeTruthy();
        expect(DailyActionEnum.HOME_REST.value.img).toBe('home/rest.gif');
    });

    it('reprend les libellés officiels du jeu', (): void => {
        expect(DailyActionEnum.getAllValues<DailyActionEnum>().map((action: DailyActionEnum): string => action.getLabel())).toEqual([
            'Prendre un bain', 'Se doucher', 'Ranger mon habitat', 'Faire une sieste',
            'Organiser les défenses', 'Cartographier le désert', 'Trouver de l’eau', 'Se recueillir', 'Creuser dans les galeries',
            'Fouiller les déchets', 'Se soigner', 'Lancer : Dés', 'Piocher : Jeu de cartes incomplet', 'Utiliser : Ballon de foot'
        ]);
    });

    it('rattache chaque action de chantier à son chantier', (): void => {
        expect(DailyActionEnum.HOME_DEFBUFF.value.building).toBe('small_watchmen_#00');
        expect(DailyActionEnum.HOME_CROWS.value.building).toBe('small_watchmen_#01');
        expect(DailyActionEnum.HOME_SURVIVALIST.value.building).toBe('small_survarea_#00');
        expect(DailyActionEnum.HOME_CONTEMPLATE.value.building).toBe('small_spa4souls_#01');
        expect(DailyActionEnum.HOME_SCAVENGE.value.building).toBe('small_gallery_#00');
        expect(DailyActionEnum.HOME_POOL.value.building).toBe('small_pool_#00');
        expect(DailyActionEnum.HOME_SHOWER.value.building).toBe('small_shower_#00');
        expect(DailyActionEnum.HOME_CLEAN.value.building).toBeUndefined();
    });
});

describe('dailyActionAp', (): void => {
    it('coût propre au métier spécialiste (Gardien : 1 PA ; Fouineur : 3 fouilles à 1 PA)', (): void => {
        expect(dailyActionAp(DailyActionEnum.HOME_DEFBUFF, JobEnum.GUARDIAN.key)).toBe(1);
        expect(dailyActionAp(DailyActionEnum.HOME_DEFBUFF, JobEnum.SCOUT.key)).toBe(2);
        expect(dailyActionAp(DailyActionEnum.HOME_SCAVENGE, JobEnum.SCAVENGER.key)).toBe(3);
        expect(dailyActionAp(DailyActionEnum.HOME_SCAVENGE, null)).toBe(2);
    });

    it('coût fixe sinon, 0 sans coût', (): void => {
        expect(dailyActionAp(DailyActionEnum.HOME_CROWS, JobEnum.SCOUT.key)).toBe(1);
        expect(dailyActionAp(DailyActionEnum.HOME_SURVIVALIST, JobEnum.SURVIVALIST.key)).toBe(3);
        expect(dailyActionAp(DailyActionEnum.HOME_CONTEMPLATE, null)).toBe(2);
        expect(dailyActionAp(DailyActionEnum.HOME_POOL, null)).toBe(0);
    });
});

describe('displayableDailyActions', (): void => {
    it('seulement les actions sans chantier si les chantiers construits sont inconnus', (): void => {
        expect(displayableDailyActions(null).map((action: DailyActionEnum): string => action.key)).toEqual(['home_clean', 'home_rest', 'item_dice', 'item_cards', 'item_soccer']);
    });

    it('les actions sans chantier, et celles dont le chantier est construit', (): void => {
        expect(displayableDailyActions(new Set<string>(['small_gallery_#00'])).map((action: DailyActionEnum): string => action.key))
            .toEqual(['home_clean', 'home_rest', 'home_scavenge', 'item_dice', 'item_cards', 'item_soccer']);
    });

    it('Fouiller les déchets et Se soigner : seulement pour l\'outil Chantiers, Se soigner avec l\'Infirmerie', (): void => {
        const built: Set<string> = new Set<string>(['small_infirmary_#00']);
        expect(displayableDailyActions(built).map((action: DailyActionEnum): string => action.key)).toEqual(['home_clean', 'home_rest', 'item_dice', 'item_cards', 'item_soccer']);
        expect(planningDailyActions(built).map((action: DailyActionEnum): string => action.key)).toEqual(['home_clean', 'home_rest', 'trash', 'home_heal', 'item_dice', 'item_cards', 'item_soccer']);
        expect(planningDailyActions(null).map((action: DailyActionEnum): string => action.key)).toEqual(['home_clean', 'home_rest', 'trash', 'item_dice', 'item_cards', 'item_soccer']);
    });
});

describe('isDailyActionAvailable', (): void => {
    const home = (rest: number | boolean | null): Home => Object.assign(new Home(), {
        content: rest === null ? [] : [{ element: HomeEnum.REST_LEVEL, value: rest }]
    });

    it('la sieste exige un Coin sieste construit : niveau 0, négatif (inconnu), absent ou maison inconnue la masquent', (): void => {
        expect(isDailyActionAvailable(DailyActionEnum.HOME_REST, { home: home(1) })).toBe(true);
        expect(isDailyActionAvailable(DailyActionEnum.HOME_REST, { home: home(3) })).toBe(true);
        expect(isDailyActionAvailable(DailyActionEnum.HOME_REST, { home: home(0) })).toBe(false);
        expect(isDailyActionAvailable(DailyActionEnum.HOME_REST, { home: home(-1) })).toBe(false);
        expect(isDailyActionAvailable(DailyActionEnum.HOME_REST, { home: home(null) })).toBe(false);
        expect(isDailyActionAvailable(DailyActionEnum.HOME_REST, {})).toBe(false);
    });

    it('les actions sans exigence restent disponibles, même sans maison ni sac connus', (): void => {
        expect(isDailyActionAvailable(DailyActionEnum.HOME_CLEAN, {})).toBe(true);
        expect(isDailyActionAvailable(DailyActionEnum.HOME_POOL, { home: home(0) })).toBe(true);
    });

    it('les actions d’objet sont toujours disponibles', (): void => {
        expect(isDailyActionAvailable(DailyActionEnum.ITEM_DICE, {})).toBe(true);
        expect(isDailyActionAvailable(DailyActionEnum.ITEM_SOCCER, {})).toBe(true);
    });
});

describe('dailyActionMaxUses', (): void => {
    it('le Fouineur creuse jusqu\'à 3 fois dans les galeries, les autres une fois', (): void => {
        expect(dailyActionMaxUses(DailyActionEnum.HOME_SCAVENGE, JobEnum.SCAVENGER.key)).toBe(3);
        expect(dailyActionMaxUses(DailyActionEnum.HOME_SCAVENGE, JobEnum.SCOUT.key)).toBe(1);
        expect(dailyActionMaxUses(DailyActionEnum.HOME_DEFBUFF, JobEnum.GUARDIAN.key)).toBe(1);
    });

    it('le coût suit le nombre de fouilles prévues, ramené entre 1 et le maximum', (): void => {
        expect(dailyActionAp(DailyActionEnum.HOME_SCAVENGE, JobEnum.SCAVENGER.key, 1)).toBe(1);
        expect(dailyActionAp(DailyActionEnum.HOME_SCAVENGE, JobEnum.SCAVENGER.key, 2)).toBe(2);
        expect(dailyActionAp(DailyActionEnum.HOME_SCAVENGE, JobEnum.SCAVENGER.key, 5)).toBe(3);
        expect(dailyActionAp(DailyActionEnum.HOME_SCAVENGE, JobEnum.SCAVENGER.key, 0)).toBe(1);
        expect(dailyActionAp(DailyActionEnum.HOME_SCAVENGE, JobEnum.SCOUT.key, 3)).toBe(2);
    });
});

describe('Fouiller les déchets et Se soigner', (): void => {
    const levels = (r: number | null): HeroSkillLevels => ({ ...UNKNOWN_HERO_SKILL_LEVELS, r });

    it('Fouiller les déchets : 3 par jour, +1 Fouineur, +1 au niveau Expert du groupe R, ou s\'il est inconnu', (): void => {
        expect(dailyActionMaxUses(DailyActionEnum.TRASH, null, levels(0))).toBe(3);
        expect(dailyActionMaxUses(DailyActionEnum.TRASH, JobEnum.SCAVENGER.key, levels(2))).toBe(4);
        expect(dailyActionMaxUses(DailyActionEnum.TRASH, null, levels(3))).toBe(4);
        expect(dailyActionMaxUses(DailyActionEnum.TRASH, JobEnum.SCAVENGER.key, levels(null))).toBe(5);
        expect(dailyActionAp(DailyActionEnum.TRASH, null, 2, levels(0))).toBe(2);
    });

    it('Se soigner : 5 PA, 2 au plus, 1 proposée', (): void => {
        expect(dailyActionMaxUses(DailyActionEnum.HOME_HEAL, null)).toBe(2);
        expect(dailyActionDefaultUses(DailyActionEnum.HOME_HEAL, null)).toBe(1);
        expect(dailyActionAp(DailyActionEnum.HOME_HEAL, null, 1)).toBe(5);
        expect(DailyActionEnum.HOME_HEAL.value.building).toBe('small_infirmary_#00');
    });

    it('utilisations proposées : toutes sans valeur par défaut', (): void => {
        expect(dailyActionDefaultUses(DailyActionEnum.HOME_SCAVENGE, JobEnum.SCAVENGER.key)).toBe(3);
        expect(dailyActionDefaultUses(DailyActionEnum.TRASH, null, levels(0))).toBe(3);
    });

    it('actions planifiables : avec chantier ou PA', (): void => {
        expect(isPlannableAction(DailyActionEnum.TRASH)).toBe(true);
        expect(isPlannableAction(DailyActionEnum.HOME_POOL)).toBe(true);
        expect(isPlannableAction(DailyActionEnum.HOME_CLEAN)).toBe(false);
        expect(isPlannableAction(DailyActionEnum.HOME_REST)).toBe(false);
    });
});
