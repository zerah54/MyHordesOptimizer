import { CampingOddsDTO } from '../dto/camping-odds.dto';
import { CommonModel } from './_common.class';
import { I18nLabels } from './_types';

/** Contribution d'un facteur au pourcentage brut, telle que l'API la calcule. */
export interface CampingFactor {
    /** Clé de l'API : previous, tomb, town, zone, zoneBuilding, lighthouse, campItems, zombies, campers, night, distance, devastated. */
    key: string;
    value: number;
}

export class CampingOdds extends CommonModel<CampingOddsDTO> {
    public probability!: number;
    public bounded_probability!: number;
    public label!: I18nLabels;
    /** Leur somme vaut `probability`. Vide si l'API ne renvoie pas le détail. */
    public details: CampingFactor[] = [];


    public constructor(dto?: CampingOddsDTO) {
        super();
        this.dtoToModel(dto);
    }

    public override modelToDto(): CampingOddsDTO {
        return {
            probability: this.probability,
            boundedProbability: this.bounded_probability,
            label: this.label,
            details: Object.fromEntries(this.details.map((factor: CampingFactor): [string, number] => [factor.key, factor.value]))
        };
    }

    protected override dtoToModel(dto?: CampingOddsDTO): void {
        if (dto) {
            this.probability = dto.probability;
            this.bounded_probability = dto.boundedProbability;
            this.label = dto.label;
            this.details = Object.entries(dto.details ?? {})
                .map(([key, value]: [string, number]): CampingFactor => ({ key, value }));
        }
    }

}
