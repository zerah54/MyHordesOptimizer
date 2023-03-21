import { environment } from 'src/environments/environment';
import { CommonEnum, CommonEnumData } from './_common.enum';


const EAT_6AP_KEY: string = 'eat_6ap';
const EAT_7AP_KEY: string = 'eat_7ap';

const COFFEE_KEY: string = 'coffee';

const ALCOHOL_KEY: string = 'alcohol';

const SPECIAl_GUITAR_KEY: string = 'special_guitar';

const LOAD_PILEGUN_KEY: string = 'load_pilegun';


const EAT_6AP_DATA: ActionData = {label: $localize`Restaure l'ensemble des points d'actions`, category: 'food', img: ''};
const EAT_7AP_DATA: ActionData = {label: $localize`Restaure l'ensemble des points d'actions plus un point`, category: 'food', img: ''};

const COFFEE_DATA: ActionData = {label: $localize`Restaure 4 points d'actions`, category: '', img: ''};

const ALCOHOL_DATA: ActionData = {label: $localize`Restaure l'ensemble des points d'actions`, category: 'alcohol', img: ''};

const SPECIAl_GUITAR_DATA: ActionData = {
    label: $localize`Rend un point d'action à toute personne en ville, dans la limite du nombre maximum de point d'action de chacun. Rend deux points d'action aux citoyens ayant l'état ivre ou l'état drogué`,
    category: '',
    img: ''
};

const LOAD_PILEGUN_DATA: ActionData = {label: $localize`Peut être rechargé avec une pile`, category: 'reload', img: ''};

/** Type de champs de propriétés existants */
export class Action extends CommonEnum {
    static EAT_6AP: Action = new Action(EAT_6AP_KEY, EAT_6AP_DATA);
    static EAT_7AP: Action = new Action(EAT_7AP_KEY, EAT_7AP_DATA);

    static COFFEE: Action = new Action(COFFEE_KEY, COFFEE_DATA);

    static ALCOHOL: Action = new Action(ALCOHOL_KEY, ALCOHOL_DATA);

    static SPECIAl_GUITAR: Action = new Action(SPECIAl_GUITAR_KEY, SPECIAl_GUITAR_DATA);

    static LOAD_PILEGUN: Action = new Action(LOAD_PILEGUN_KEY, LOAD_PILEGUN_DATA);


    /**
     * Le constructeur privé empêche la création d'autres instances de cette classe.
     *
     * @param {string} key La clé de l'objet
     * @param {AllowTypeData} value la valeur correspondante
     */
    protected constructor(public override key: string, public override value: ActionData) {
        super(key, value);
    }

    /**
     * Retourne l'objet correspondant à la clé fournie
     *
     * @param {string} key la clé
     *
     * @return {T} l'object correspondant.
     */
    public static override getByKey<T extends CommonEnum>(key: string): T | undefined {
        if (key && key.startsWith('load_pilegun')) {
            key = 'load_pilegun';
        }
        const elements: T[] = <T[]>this.getAllValues<CommonEnum>();
        const element: T | undefined = elements.find((_element: T) => _element.key === key);
        if (!element) {
            if (!environment.production) {
                console.error(`Aucune valeur pour "${this.name}" correspondant à la clé "${key}"`);
            }
            return;
        } else {
            return element;
        }
    }


    /** @return {string} le libellé du droit */
    public getLabel(): string {
        return this.value.label;
    }
}

interface ActionData extends CommonEnumData {
    label: string;
    img: string;
    category: string;
}
