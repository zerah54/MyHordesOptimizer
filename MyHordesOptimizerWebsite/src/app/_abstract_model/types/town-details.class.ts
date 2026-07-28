import { TownDetailsDTO } from '../dto/town-details.dto';
import { CommonModel } from './_common.class';
import { TownTypeId } from './_types';

export class TownDetails extends CommonModel<TownDetailsDTO> {
    public town_id!: number;
    public town_x!: number;
    public town_y!: number;
    public town_max_x!: number;
    public town_max_y!: number;
    public is_chaos!: boolean;
    public is_devaste!: boolean;
    public day!: number;
    public town_type!: TownTypeId;
    /** La ville a-t-elle activé l option d API externe ? Null tant qu on ne l a pas constaté. */
    public has_external_api: boolean | null = null;

    public constructor(dto?: TownDetailsDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): TownDetailsDTO {
        return {
            townId: this.town_id,
            townX: this.town_x,
            townY: this.town_y,
            townMaxX: this.town_max_x,
            townMaxY: this.town_max_y,
            isChaos: this.is_chaos,
            isDevaste: this.is_devaste,
            day: this.day,
            townType: this.town_type,
            hasExternalApi: this.has_external_api
        };
    }

    protected dtoToModel(dto?: TownDetailsDTO): void {
        if (dto) {
            this.town_id = dto.townId;
            this.town_x = dto.townX;
            this.town_y = dto.townY;
            this.town_max_x = dto.townMaxX;
            this.town_max_y = dto.townMaxY;
            this.is_chaos = dto.isChaos;
            this.is_devaste = dto.isDevaste;
            this.day = dto.day;
            this.town_type = dto.townType;
            this.has_external_api = dto.hasExternalApi ?? null;
        }
    }
}

/**
 * Le niveau de maison est-il saisissable à la main dans cette ville ?
 *
 * En principe non : MyHordes le donne pour tous les citoyens via `baseDef`, dont il se déduit
 * exactement (0, 1, 4, 9, 16, 25, 36, 49, 64 — soit n²), et le back le renseigne à chaque
 * synchronisation. Une saisie ne pourrait qu'être écrasée au passage suivant.
 *
 * L'exception : les villes ayant désactivé l'option d'API externe de MyHordes. Elles ne
 * transmettent aucune donnée de carte, donc jamais `baseDef` — la saisie manuelle y reste le seul
 * moyen de connaître le niveau.
 *
 * Une ville dont l'option n'a pas encore été constatée (`null`) est traitée comme ayant l'API :
 * mieux vaut un champ absent qu'un champ promettant une saisie aussitôt écrasée.
 *
 * Fonction libre et non méthode : `getTown()` renvoie un `JSON.parse` du localStorage, donc un
 * objet nu — une méthode de classe n'existerait pas à l'exécution.
 */
export function isHouseLevelEditable(town: TownDetails | null | undefined): boolean {
    return town?.has_external_api === false;
}
