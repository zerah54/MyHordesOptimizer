import { CommonEnum, CommonEnumData } from './_common.enum';
import { Property } from './property.enum';


const WEAPONS_TRASH_KEY: string = 'WEAPONS_TRASH';
const DEFENSE_TRASH_KEY: string = 'DEFENSE_TRASH';
const FOOD_TRASH_KEY: string = 'FOOD_TRASH';
const WOOD_TRASH_KEY: string = 'WOOD_TRASH';
const METAL_TRASH_KEY: string = 'METAL_TRASH';
const ANIMALS_TRASH_KEY: string = 'ANIMALS_TRASH';

const WEAPONS_TRASH_DATA: TrashData = {
    label: $localize`Décharge piégée`,
    property: Property.WEAPON,
    add_items_uid: ['machine_gun_#00', 'gun_#00', 'chair_basic_#00', 'machine_1_#00', 'machine_2_#00', 'machine_3_#00', 'pc_#00'],
    value: 1,
    improved_value: 2,
    specialized_trash_add_value: 5
};
const DEFENSE_TRASH_DATA: TrashData = {
    label: $localize`Décharge blindée`,
    property: Property.DEFENCE,
    exclude_items_uid: ['tekel_#00', 'pet_dog_#00', 'concrete_wall_#00', 'table_#00'],
    value: 4,
    improved_value: 5,
    specialized_trash_add_value: 2
};
const FOOD_TRASH_DATA: TrashData = {label: $localize`Appâts odorants`, property: Property.FOOD, value: 1, improved_value: 2, specialized_trash_add_value: 3};
const WOOD_TRASH_DATA: TrashData = {
    label: $localize`Déchardes de bois`,
    add_items_uid: ['wood_bad_#00', 'wood2_#00'],
    value: 1,
    improved_value: 2,
    specialized_trash_add_value: 1
};
const METAL_TRASH_DATA: TrashData = {
    label: $localize`Ferraillerie`,
    add_items_uid: ['metal_bad_#00', 'metal_#00'],
    value: 1,
    improved_value: 2,
    specialized_trash_add_value: 1
};
const ANIMALS_TRASH_DATA: TrashData = {label: $localize`Enclos`, property: Property.PET, value: 1, improved_value: 2, specialized_trash_add_value: 6};

/** Type de champs de propriétés existants */
export class Trash extends CommonEnum {

    static WEAPONS_TRASH: Trash = new Trash(WEAPONS_TRASH_KEY, WEAPONS_TRASH_DATA);
    static DEFENSE_TRASH: Trash = new Trash(DEFENSE_TRASH_KEY, DEFENSE_TRASH_DATA);
    static FOOD_TRASH: Trash = new Trash(FOOD_TRASH_KEY, FOOD_TRASH_DATA);
    static WOOD_TRASH: Trash = new Trash(WOOD_TRASH_KEY, WOOD_TRASH_DATA);
    static METAL_TRASH: Trash = new Trash(METAL_TRASH_KEY, METAL_TRASH_DATA);
    static ANIMALS_TRASH: Trash = new Trash(ANIMALS_TRASH_KEY, ANIMALS_TRASH_DATA);

    /**
     * Le constructeur privé empêche la création d'autres instances de cette classe.
     *
     * @param {string} key La clé de l'objet
     * @param {TrashData} value la valeur correspondante
     */
    protected constructor(public override key: string, public override value: TrashData) {
        super(key, value);
    }

    /** @return {string} le libellé du droit */
    public getLabel(): string {
        return this.value.label;
    }
}

interface TrashData extends CommonEnumData {
    /** Le nom de la décharge */
    label: string;
    /** La catégorie concernée */
    property?: Property;
    /** Les objets à ajouter */
    add_items_uid?: string[];
    /** Les objets à retirer */
    exclude_items_uid?: string[];
    /** Valeur de base */
    value: number;
    /** Valeur de base à utiliser en cas de DH */
    improved_value: number;
    /** Valeur à ajouter en cas de décharge spécialisée construite */
    specialized_trash_add_value: number;
}
