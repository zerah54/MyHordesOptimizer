import { CommonEnum, CommonEnumData } from './_common.enum';

const SHAMAN_KEY: string = 'shaman';
const GUIDE_KEY: string = 'guide';
const CATA_KEY: string = 'cata';

// Libellés repris tels quels des traductions officielles du jeu (`translations/game+intl-icu.fr.yml`).
// `Chaman` y est genré via ICU (`Chaman` / `Chamane`) : MyHordes ne nous transmettant aucune donnée
// de genre, on retient la forme par défaut, celle que le jeu lui-même affiche hors contexte genré.
const SHAMAN_DATA: TownRoleEnumData = { img: 'roles/shaman.gif', label: $localize`Chaman` };
const GUIDE_DATA: TownRoleEnumData = { img: 'roles/guide.gif', label: $localize`Guide de l’Outre-Monde` };
const CATA_DATA: TownRoleEnumData = { img: 'roles/cata.gif', label: $localize`Responsable de la catapulte` };

/**
 * Rôles de ville attribués à un citoyen : Chaman, Guide de l'Outre-Monde, Responsable de la
 * catapulte. Un seul porteur par rôle et par ville, mais rien n'empêche un citoyen d'en cumuler
 * plusieurs — d'où une liste côté citoyen et non une valeur unique.
 */
export class TownRoleEnum extends CommonEnum {
    public static SHAMAN: TownRoleEnum = new TownRoleEnum(SHAMAN_KEY, SHAMAN_DATA);
    public static GUIDE: TownRoleEnum = new TownRoleEnum(GUIDE_KEY, GUIDE_DATA);
    public static CATA: TownRoleEnum = new TownRoleEnum(CATA_KEY, CATA_DATA);

    public constructor(public override key: string, public override value: TownRoleEnumData) {
        super(key, value);
    }

    protected getLabel(): string {
        return this.value.label;
    }

}

interface TownRoleEnumData extends CommonEnumData {
    img: string;
    label: string;
}
