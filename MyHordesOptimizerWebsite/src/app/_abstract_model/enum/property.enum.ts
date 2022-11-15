import { CommonEnum, CommonEnumData } from "./_common.enum";


const ESC_FIXED_KEY: string = 'esc_fixed';
const LOCK_KEY: string = 'lock';
const FOUND_POISONED_KEY: string = 'found_poisoned';
const PREVENT_TERROR_KEY: string = 'prevent_terror';
const HERO_FIND_LUCKY_KEY: string = 'hero_find_lucky';
const HERO_FIND_KEY: string = 'hero_find';
const IMPOUNDABLE_KEY: string = 'impoundable';
const PREVENT_NIGHT_KEY: string = 'prevent_night';
const IS_WATER_KEY: string = 'is_water';

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


const ESC_FIXED_DATA: PropertyData = { label: $localize`Ne peut pas être déposé par le chef d'escorte`, category: '', img: '' };
const LOCK_DATA: PropertyData = { label: $localize`Sécurise le coffre dans lequel il se trouve`, category: '', img: '' };
const FOUND_POISONED_DATA: PropertyData = { label: $localize`Peut être trouvé empoisonné`, category: '', img: '' };
const PREVENT_TERROR_DATA: PropertyData = { label: $localize`Empêche d'être terrorisé à cause d'un objet`, category: '', img: '' };
const HERO_FIND_LUCKY_DATA: PropertyData = { label: $localize`Trouvaille améliorée`, category: '', img: '' };
const HERO_FIND_DATA: PropertyData = { label: $localize`Trouvaille`, category: '', img: '' };
const IMPOUNDABLE_DATA: PropertyData = { label: $localize`Conservé en cas de banissement`, category: '', img: '' };
const PREVENT_NIGHT_DATA: PropertyData = { label: $localize`Annule le malus de nuit sur la case une fois posé au sol`, category: '', img: '' };
const IS_WATER_DATA: PropertyData = { label: $localize`Désaltère`, category: '', img: 'status/status_hasdrunk.gif' };

/** Veille */
const NW_ARMORY_DATA: PropertyData = { label: $localize`Compte dans le calcul du bonus de veille donné par l'armurerie`, category: 'nightwatch', img: '' };
const NW_IKEA_DATA: PropertyData = { label: $localize`Compte dans le calcul du bonus de veille donné par le magasin suédois`, category: 'nightwatch', img: '' };
const NW_TREBUCHET_DATA: PropertyData = { label: $localize`Compte dans le calcul du bonus de veille donné par le lance-bête`, category: 'nightwatch', img: '' };
const NW_SHOOTING_DATA: PropertyData = { label: $localize`Compte dans le calcul du bonus de veille donné par la tourelle lance-eau`, category: 'nightwatch', img: '' };

/** Modifications possibles */
const CAN_POISON_DATA: PropertyData = { label: $localize`Peut être empoisonné`, category: 'modification', img: '' };
const CAN_COOK_DATA: PropertyData = { label: $localize`Peut être cuisiné`, category: 'modification', img: '' };

/** Catégories */
const FOOD_DATA: PropertyData = { label: $localize`Provisions`, category: 'category', img: '' };
const DRUG_DATA: PropertyData = { label: $localize`Pharmacie`, category: 'category', img: '' };
const WEAPON_DATA: PropertyData = { label: $localize`Arme`, category: 'category', img: '' };
const RESSOURCE_DATA: PropertyData = { label: $localize`Ressource`, category: 'category', img: '' };
const DEFENCE_DATA: PropertyData = { label: $localize`Objet de défense`, category: 'category', img: '' };
const PET_DATA: PropertyData = { label: $localize`Animal`, category: 'category', img: '' };
const DECO_DATA: PropertyData = { label: $localize`Décoration`, category: 'category', img: '' };

/** Type de champs de propriétés existants */
export class Property extends CommonEnum {
    static ESC_FIXED: Property = new Property(ESC_FIXED_KEY, ESC_FIXED_DATA);
    static LOCK: Property = new Property(LOCK_KEY, LOCK_DATA);
    static FOUND_POISONED: Property = new Property(FOUND_POISONED_KEY, FOUND_POISONED_DATA);
    static ESC_FPREVENT_TERRORXED: Property = new Property(PREVENT_TERROR_KEY, PREVENT_TERROR_DATA);
    static HERO_FIND_LUCKY: Property = new Property(HERO_FIND_LUCKY_KEY, HERO_FIND_LUCKY_DATA);
    static HERO_FIND: Property = new Property(HERO_FIND_KEY, HERO_FIND_DATA);
    static IMPOUNDABLE: Property = new Property(IMPOUNDABLE_KEY, IMPOUNDABLE_DATA);
    static PREVENT_NIGHT: Property = new Property(PREVENT_NIGHT_KEY, PREVENT_NIGHT_DATA);
    static IS_WATER: Property = new Property(IS_WATER_KEY, IS_WATER_DATA);

    /** Veille */
    static NW_ARMORY: Property = new Property(NW_ARMORY_KEY, NW_ARMORY_DATA);
    static NW_IKEA: Property = new Property(NW_IKEA_KEY, NW_IKEA_DATA);
    static NW_TREBUCHET: Property = new Property(NW_TREBUCHET_KEY, NW_TREBUCHET_DATA);
    static NW_SHOOTING: Property = new Property(NW_SHOOTING_KEY, NW_SHOOTING_DATA);

    /** Modifications possibles */
    static CAN_POISON: Property = new Property(CAN_POISON_KEY, CAN_POISON_DATA);
    static CAN_COOK: Property = new Property(CAN_COOK_KEY, CAN_COOK_DATA);
    /** Catégories */
    static FOOD: Property = new Property(FOOD_KEY, FOOD_DATA);
    static DRUG: Property = new Property(DRUG_KEY, DRUG_DATA);
    static WEAPON: Property = new Property(WEAPON_KEY, WEAPON_DATA);
    static RESSOURCE: Property = new Property(RESSOURCE_KEY, RESSOURCE_DATA);
    static DEFENCE: Property = new Property(DEFENCE_KEY, DEFENCE_DATA);
    static PET: Property = new Property(PET_KEY, PET_DATA);
    static DECO: Property = new Property(DECO_KEY, DECO_DATA);


    /**
     * Le constructeur privé empêche la création d'autres instances de cette classe.
     *
     * @param {string} key La clé de l'objet
     * @param {AllowTypeData} value la valeur correspondante
     */
    protected constructor(public override key: string, public override value: PropertyData) {
        super(key, value);
    }

    /** @return {string} le libellé du droit */
    public getLabel(): string {
        return this.value.label;
    }
}

interface PropertyData extends CommonEnumData {
    label: string;
    img: string;
    category: string;
}
