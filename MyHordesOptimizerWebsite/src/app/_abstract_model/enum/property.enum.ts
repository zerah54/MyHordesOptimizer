import { CommonEnum, CommonEnumData } from './_common.enum';


const ESC_FIXED_KEY: string = 'esc_fixed';
const LOCK_KEY: string = 'lock';
const FOUND_POISONED_KEY: string = 'found_poisoned';
const PREVENT_TERROR_KEY: string = 'prevent_terror';
const HERO_FIND_LUCKY_KEY: string = 'hero_find_lucky';
const HERO_FIND_KEY: string = 'hero_find';
const IMPOUNDABLE_KEY: string = 'impoundable';
const PREVENT_NIGHT_KEY: string = 'prevent_night';
const IS_WATER_KEY: string = 'is_water';
const CAMP_BONUS_KEY: string = 'camp_bonus';
const SINGLE_USE_KEY: string = 'single_use';
const LURE_KEY: string = 'lure';
const HERO_FIND_LUCKY2_KEY: string = 'hero_find_lucky2';
const HERO_FIND_LUCKY3_KEY: string = 'hero_find_lucky3';
const HERO_DOG_FETCH_KEY: string = 'hero_dog_fetch';
const NO_POST_KEY: string = 'no_post';
const NOSTEAL_KEY: string = 'nosteal';
const INEDIBLE_KEY: string = 'inedible';
const HAUNTING_SOUL_KEY: string = 'haunting_soul';
const ANGRY_SOUL_KEY: string = 'angry_soul';
const DEFENCE_CP_KEY: string = 'defence_cp';
const NW_IMPACT_CUMUL_KEY: string = 'nw_impact_cumul';
const BOX_OPENER_KEY: string = 'box_opener';
const CAN_OPENER_KEY: string = 'can_opener';
const PARCEL_OPENER_KEY: string = 'parcel_opener';

/** Veille */
const NW_ARMORY_KEY: string = 'nw_armory';
const NW_IKEA_KEY: string = 'nw_ikea';
const NW_TREBUCHET_KEY: string = 'nw_trebuchet';
const NW_SHOOTING_KEY: string = 'nw_shooting';

/** Modifications possibles */
const CAN_POISON_KEY: string = 'can_poison';
const CAN_COOK_KEY: string = 'can_cook';

/** Catégories */
const FOOD_KEY: string = 'food';
const DRUG_KEY: string = 'drug';
const WEAPON_KEY: string = 'weapon';
const RESSOURCE_KEY: string = 'ressource';
const DEFENCE_KEY: string = 'defence';
const PET_KEY: string = 'pet';
const DECO_KEY: string = 'deco';


const ESC_FIXED_DATA: PropertyData = { get label(): string { return $localize`Ne peut pas être déposé par le chef d'escorte`; }, category: '', img: '' };
const LOCK_DATA: PropertyData = { get label(): string { return $localize`Sécurise le coffre dans lequel il se trouve`; }, category: '', img: 'icons/lock.gif', icon_only: true };
const FOUND_POISONED_DATA: PropertyData = { get label(): string { return $localize`Peut être trouvé empoisonné`; }, category: '', img: '' };
const PREVENT_TERROR_DATA: PropertyData = { get label(): string { return $localize`Empêche d'être terrorisé à cause d'un objet`; }, category: '', img: '' };
const HERO_FIND_LUCKY_DATA: PropertyData = { get label(): string { return $localize`Trouvaille améliorée`; }, category: '', img: 'icons/small_hero.gif' };
const HERO_FIND_DATA: PropertyData = { get label(): string { return $localize`Trouvaille`; }, category: '', img: 'icons/small_hero.gif' };
const IMPOUNDABLE_DATA: PropertyData = { get label(): string { return $localize`Perdu en cas de bannissement`; }, category: '', img: '' };
const PREVENT_NIGHT_DATA: PropertyData = { get label(): string { return $localize`Annule le malus de nuit sur la case une fois posé au sol`; }, category: '', img: '' };
const IS_WATER_DATA: PropertyData = { get label(): string { return $localize`Désaltère`; }, category: '', img: 'status/status_hydrated.gif', icon_only: true };
const CAMP_BONUS_DATA: PropertyData = { get label(): string { return $localize`Augmente les chances de camping s'il est dans le sac`; }, category: '', img: '' };
const SINGLE_USE_DATA: PropertyData = { get label(): string { return $localize`Utilisable 1 fois par jour`; }, category: '', img: 'icons/small_once.gif', icon_only: true };
const LURE_DATA: PropertyData = { get label(): string { return $localize`Sert d'appât dans le Système de Pièges des Apprivoiseurs`; }, category: '', img: '' };
const HERO_FIND_LUCKY2_DATA: PropertyData = { get label(): string { return $localize`Impressionnante trouvaille`; }, category: '', img: 'icons/small_hero.gif' };
const HERO_FIND_LUCKY3_DATA: PropertyData = { get label(): string { return $localize`Incroyable trouvaille`; }, category: '', img: 'icons/small_hero.gif' };
const HERO_DOG_FETCH_DATA: PropertyData = { get label(): string { return $localize`Le chien de l'Apprivoiseur peut le rapporter de la banque`; }, category: '', img: 'item/item_tamed_pet.gif', icon_only: true };
const NO_POST_DATA: PropertyData = { get label(): string { return $localize`Ne peut pas être envoyé par message`; }, category: '', img: '' };
const NOSTEAL_DATA: PropertyData = { get label(): string { return $localize`Ne peut pas être volé`; }, category: '', img: '' };
const INEDIBLE_DATA: PropertyData = { get label(): string { return $localize`Ne compte pas comme nourriture emportée en sortant de la ville`; }, category: '', img: '' };
const HAUNTING_SOUL_DATA: PropertyData = { get label(): string { return $localize`Halloween : dans le coffre, empêche les vols et peut terroriser son propriétaire la nuit`; }, category: '', img: '' };
const ANGRY_SOUL_DATA: PropertyData = { get label(): string { return $localize`Halloween : dans le coffre, 50 % de chances d'infecter son propriétaire la nuit`; }, category: '', img: '' };
const DEFENCE_CP_DATA: PropertyData = { get label(): string { return $localize`Dans le sac, +1 point de contrôle de zone`; }, category: '', img: '' };
const NW_IMPACT_CUMUL_DATA: PropertyData = { get label(): string { return $localize`Chaque exemplaire compte pour les chances de survie en veille`; }, category: '', img: '' };
const BOX_OPENER_DATA: PropertyData = { get label(): string { return $localize`Outil d'ouverture`; }, category: '', img: '' };
const CAN_OPENER_DATA: PropertyData = { get label(): string { return $localize`Outil d'ouverture`; }, category: '', img: '' };
const PARCEL_OPENER_DATA: PropertyData = { get label(): string { return $localize`Outil d'ouverture`; }, category: '', img: '' };

/** Veille : chantier qui multiplie la défense en veille de l'objet (BuildingQueryListener.php, entrées non nulles) */
const NW_ARMORY_DATA: PropertyData = { get label(): string { return $localize`Bonus de veille de la Meuleuse manuelle (+20 %)`; }, category: 'nightwatch', img: 'building/small_grinder2.gif' };
const NW_IKEA_DATA: PropertyData = { get label(): string { return $localize`Bonus de veille du Magasin suédois (+30 %)`; }, category: 'nightwatch', img: 'building/small_ikea.gif' };
const NW_TREBUCHET_DATA: PropertyData = { get label(): string { return $localize`Bonus de veille de l'Animalerie (+30 %)`; }, category: 'nightwatch', img: 'building/small_animfence.gif' };
const NW_SHOOTING_DATA: PropertyData = { get label(): string { return $localize`Bonus de veille des Gouttières filtrantes (+30 %)`; }, category: 'nightwatch', img: 'building/small_sewers.gif' };

/** Modifications possibles */
const CAN_POISON_DATA: PropertyData = { get label(): string { return $localize`Peut être empoisonné`; }, category: 'modification', img: '' };
const CAN_COOK_DATA: PropertyData = { get label(): string { return $localize`Peut être cuisiné`; }, category: 'modification', img: '' };

/** Catégories */
const FOOD_DATA: PropertyData = { get label(): string { return $localize`Provisions`; }, category: 'category', img: '' };
const DRUG_DATA: PropertyData = { get label(): string { return $localize`Pharmacie`; }, category: 'category', img: '' };
const WEAPON_DATA: PropertyData = { get label(): string { return $localize`Arme`; }, category: 'category', img: '' };
const RESSOURCE_DATA: PropertyData = { get label(): string { return $localize`Ressource`; }, category: 'category', img: '' };
const DEFENCE_DATA: PropertyData = { get label(): string { return $localize`Objet de défense`; }, category: 'category', img: '' };
const PET_DATA: PropertyData = { get label(): string { return $localize`Animal`; }, category: 'category', img: '' };
const DECO_DATA: PropertyData = { get label(): string { return $localize`Décoration`; }, category: 'category', img: '' };

/** Type de champs de propriétés existants */
export class Property extends CommonEnum {
    public static ESC_FIXED: Property = new Property(ESC_FIXED_KEY, ESC_FIXED_DATA);
    public static LOCK: Property = new Property(LOCK_KEY, LOCK_DATA);
    public static FOUND_POISONED: Property = new Property(FOUND_POISONED_KEY, FOUND_POISONED_DATA);
    public static ESC_FPREVENT_TERRORXED: Property = new Property(PREVENT_TERROR_KEY, PREVENT_TERROR_DATA);
    public static HERO_FIND_LUCKY: Property = new Property(HERO_FIND_LUCKY_KEY, HERO_FIND_LUCKY_DATA);
    public static HERO_FIND: Property = new Property(HERO_FIND_KEY, HERO_FIND_DATA);
    public static IMPOUNDABLE: Property = new Property(IMPOUNDABLE_KEY, IMPOUNDABLE_DATA);
    public static PREVENT_NIGHT: Property = new Property(PREVENT_NIGHT_KEY, PREVENT_NIGHT_DATA);
    public static IS_WATER: Property = new Property(IS_WATER_KEY, IS_WATER_DATA);
    public static CAMP_BONUS: Property = new Property(CAMP_BONUS_KEY, CAMP_BONUS_DATA);
    public static SINGLE_USE: Property = new Property(SINGLE_USE_KEY, SINGLE_USE_DATA);
    public static LURE: Property = new Property(LURE_KEY, LURE_DATA);
    public static HERO_FIND_LUCKY2: Property = new Property(HERO_FIND_LUCKY2_KEY, HERO_FIND_LUCKY2_DATA);
    public static HERO_FIND_LUCKY3: Property = new Property(HERO_FIND_LUCKY3_KEY, HERO_FIND_LUCKY3_DATA);
    public static HERO_DOG_FETCH: Property = new Property(HERO_DOG_FETCH_KEY, HERO_DOG_FETCH_DATA);
    public static NO_POST: Property = new Property(NO_POST_KEY, NO_POST_DATA);
    public static NOSTEAL: Property = new Property(NOSTEAL_KEY, NOSTEAL_DATA);
    public static INEDIBLE: Property = new Property(INEDIBLE_KEY, INEDIBLE_DATA);
    public static HAUNTING_SOUL: Property = new Property(HAUNTING_SOUL_KEY, HAUNTING_SOUL_DATA);
    public static ANGRY_SOUL: Property = new Property(ANGRY_SOUL_KEY, ANGRY_SOUL_DATA);
    public static DEFENCE_CP: Property = new Property(DEFENCE_CP_KEY, DEFENCE_CP_DATA);
    public static NW_IMPACT_CUMUL: Property = new Property(NW_IMPACT_CUMUL_KEY, NW_IMPACT_CUMUL_DATA);
    public static BOX_OPENER: Property = new Property(BOX_OPENER_KEY, BOX_OPENER_DATA);
    public static CAN_OPENER: Property = new Property(CAN_OPENER_KEY, CAN_OPENER_DATA);
    public static PARCEL_OPENER: Property = new Property(PARCEL_OPENER_KEY, PARCEL_OPENER_DATA);

    /** Veille */
    public static NW_ARMORY: Property = new Property(NW_ARMORY_KEY, NW_ARMORY_DATA);
    public static NW_IKEA: Property = new Property(NW_IKEA_KEY, NW_IKEA_DATA);
    public static NW_TREBUCHET: Property = new Property(NW_TREBUCHET_KEY, NW_TREBUCHET_DATA);
    public static NW_SHOOTING: Property = new Property(NW_SHOOTING_KEY, NW_SHOOTING_DATA);

    /** Modifications possibles */
    public static CAN_POISON: Property = new Property(CAN_POISON_KEY, CAN_POISON_DATA);
    public static CAN_COOK: Property = new Property(CAN_COOK_KEY, CAN_COOK_DATA);
    /** Catégories */
    public static FOOD: Property = new Property(FOOD_KEY, FOOD_DATA);
    public static DRUG: Property = new Property(DRUG_KEY, DRUG_DATA);
    public static WEAPON: Property = new Property(WEAPON_KEY, WEAPON_DATA);
    public static RESSOURCE: Property = new Property(RESSOURCE_KEY, RESSOURCE_DATA);
    public static DEFENCE: Property = new Property(DEFENCE_KEY, DEFENCE_DATA);
    public static PET: Property = new Property(PET_KEY, PET_DATA);
    public static DECO: Property = new Property(DECO_KEY, DECO_DATA);


    /**
     * Le constructeur privé empêche la création d'autres instances de cette classe.
     *
     * @param {string} key La clé de l'objet
     * @param {PropertyData} value la valeur correspondante
     */
    public constructor(public override key: string, public override value: PropertyData) {
        super(key, value);
    }

    /** @return {string} le libellé du droit */
    protected getLabel(): string {
        return this.value.label;
    }
}

interface PropertyData extends CommonEnumData {
    label: string;
    img: string;
    category: string;
    /** Affichée en icône seule sur la fiche, le libellé au survol. */
    icon_only?: boolean;
}
