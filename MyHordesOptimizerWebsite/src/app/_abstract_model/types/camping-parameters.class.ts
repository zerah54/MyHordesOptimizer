import { CampingParametersDTO } from '../dto/camping-parameters.dto';
import { CommonModel } from './_common.class';
import { TownTypeId } from './_types';

export class CampingParameters extends CommonModel<CampingParametersDTO> {
    private town_type: TownTypeId = 'RE';
    private job: string = 'citizen';
    private distance: number = 0;
    private campings: number = 0;
    private pro_camper: boolean = false;
    private hidden_campers: number = 0;
    private objects: number = 0;
    private vest: boolean = false;
    private tomb: boolean = false;
    private r4: boolean = false;
    private zombies: number = 0;
    private night: boolean = false;
    private devastated: boolean = false;
    private phare: boolean = false;
    private improve: number = 0;
    private object_improve: number = 0;
    private ruin_bonus: number = 0;
    private ruin_bury_count: number = 0;
    private ruin_capacity: number = 0;


    public constructor(dto?: CampingParametersDTO) {
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
            r4: this.r4,
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
            this.r4 = dto.r4;
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
