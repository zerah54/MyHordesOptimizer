import { CommonEnum, CommonEnumData } from './_common.enum';

/**
 * Ce qu'il faut pour débloquer un chantier, d'après son niveau de plan.
 *
 * Les niveaux 0 à 4 sont de vraies raretés de plan et ont leur icône. Les niveaux 5 et 6, eux,
 * n'en sont pas : relevé le 2026-07-28, le 5 ne contient que la Croix en chocolat (événement de
 * Pâques) et le 6 les cinq niveaux de Décharge plus l'Enclos — tous obtenus autrement qu'avec un
 * plan distribué. Leur coller une icône épique donnerait une information fausse ; ils reçoivent
 * donc un traitement à part.
 */
export class BlueprintEnum extends CommonEnum {
    public static NONE: BlueprintEnum = new BlueprintEnum('0', { img: null, label: $localize`Constructible sans plan` });
    public static COMMON: BlueprintEnum = new BlueprintEnum('1', { img: 'item/item_bplan_c.gif', label: $localize`Plan commun` });
    public static UNCOMMON: BlueprintEnum = new BlueprintEnum('2', { img: 'item/item_bplan_u.gif', label: $localize`Plan peu commun` });
    public static RARE: BlueprintEnum = new BlueprintEnum('3', { img: 'item/item_bplan_r.gif', label: $localize`Plan rare` });
    public static EPIC: BlueprintEnum = new BlueprintEnum('4', { img: 'item/item_bplan_e.gif', label: $localize`Plan épique` });
    public static EVENT: BlueprintEnum = new BlueprintEnum('5', { img: null, label: $localize`Chantier d’événement` });
    public static SPECIAL: BlueprintEnum = new BlueprintEnum('6', { img: null, label: $localize`Débloqué autrement qu’avec un plan` });

    public constructor(public override key: string, public override value: BlueprintEnumData) {
        super(key, value);
    }

    /**
     * Le niveau correspondant, ou `undefined` s'il est inconnu.
     *
     * On ne devine pas : si MyHordes ajoute un niveau 7, mieux vaut que l'affichage le signale
     * que de le rattacher au hasard au plus proche.
     */
    public static fromRarity(rarity: number | null | undefined): BlueprintEnum | undefined {
        return rarity === null || rarity === undefined
            ? undefined
            : BlueprintEnum.getByKey<BlueprintEnum>(String(rarity));
    }

    protected getLabel(): string {
        return this.value.label;
    }

}

interface BlueprintEnumData extends CommonEnumData {
    /** Icône du plan, ou `null` quand le déblocage ne passe pas par un plan. */
    img: string | null;
    label: string;
}
