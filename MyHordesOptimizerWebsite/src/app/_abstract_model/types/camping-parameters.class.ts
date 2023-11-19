import { CampingParametersDTO } from '../dto/camping-parameters.dto';
import { CommonModel } from './_common.class';
import { TownTypeId } from './_types';

export class CampingParameters extends CommonModel<CampingParametersDTO> {
    public town_type: TownTypeId = 'RE';
    public job: string = 'citizen';
    public distance: number = 0;
    public campings: number = 0;
    public pro_camper: boolean = false;
    public hidden_campers: number = 0;
    public objects: number = 0;
    public vest: boolean = false;
    public tomb: boolean = false;
    public zombies: number = 0;
    public night: boolean = false;
    public devastated: boolean = false;
    public phare: boolean = false;
    public improve: number = 0;
    public object_improve: number = 0;
    public ruin_bonus: number = 0;
    public ruin_bury_count: number = 0;
    public ruin_capacity: number = 0;


    constructor(dto?: CampingParametersDTO) {
        super();
        this.dtoToModel(dto);
    }

    public override modelToDto(): CampingParametersDTO {
        return {
            townType: this.town_type,
            job: this.job,
            distance: this.distance,
            campings: this.campings,
            proCamper: this.pro_camper,
            hiddenCampers: this.hidden_campers,
            objects: this.objects,
            vest: this.vest,
            tomb: this.tomb,
            zombies: this.zombies,
            night: this.night,
            devastated: this.devastated,
            phare: this.phare,
            improve: this.improve,
            objectImprove: this.object_improve,
            ruinBonus: this.ruin_bonus,
            ruinBuryCount: this.ruin_bury_count,
            ruinCapacity: this.ruin_capacity,
        };
    }

    protected override dtoToModel(dto?: CampingParametersDTO): void {
        if (dto) {
            this.town_type = dto.townType;
            this.job = dto.job;
            this.distance = dto.distance;
            this.campings = dto.campings;
            this.pro_camper = dto.proCamper;
            this.hidden_campers = dto.hiddenCampers;
            this.objects = dto.objects;
            this.vest = dto.vest;
            this.tomb = dto.tomb;
            this.zombies = dto.zombies;
            this.night = dto.night;
            this.devastated = dto.devastated;
            this.phare = dto.phare;
            this.improve = dto.improve;
            this.object_improve = dto.objectImprove;
            this.ruin_bonus = dto.ruinBonus;
            this.ruin_bury_count = dto.ruinBuryCount;
            this.ruin_capacity = dto.ruinCapacity;
        }
    }

}
