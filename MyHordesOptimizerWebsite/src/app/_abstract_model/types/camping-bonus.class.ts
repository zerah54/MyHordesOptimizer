import { CampingBonusDTO } from '../dto/camping-bonus.dto';
import { CommonModel } from './_common.class';

export class CampingBonus extends CommonModel<CampingBonusDTO> {
    public tomb!: number;
    public pande!: number;
    public improve!: number;
    public object_improve!: number;
    public lighthouse!: number;
    public camp_items!: number;
    public zombie_vest!: number;
    public zombie_no_vest!: number;
    public night!: number;
    public devastated!: number;
    public dist_chances!: number[];
    public crowd_chances!: number[];
    public panda_pro_camper_by_already_camped!: number[];
    public panda_no_pro_camper_by_already_camped!: number[];
    public normal_pro_camper_by_already_camped!: number[];
    public normal_no_pro_camper_by_already_camped!: number[];


    constructor(dto?: CampingBonusDTO) {
        super();
        this.dtoToModel(dto);
    }

    public override modelToDto(): CampingBonusDTO {
        return {
            tomb: this.tomb,
            pande: this.pande,
            improve: this.improve,
            objectImprove: this.object_improve,
            lighthouse: this.lighthouse,
            campItems: this.camp_items,
            zombieVest: this.zombie_vest,
            zombieNoVest: this.zombie_no_vest,
            night: this.night,
            devastated: this.devastated,
            distChances: this.dist_chances,
            crowdChances: this.crowd_chances,
            pandaProCamperByAlreadyCamped: this.panda_pro_camper_by_already_camped,
            pandaNoProCamperByAlreadyCamped: this.panda_no_pro_camper_by_already_camped,
            normalProCamperByAlreadyCamped: this.normal_pro_camper_by_already_camped,
            normalNoProCamperByAlreadyCamped: this.normal_no_pro_camper_by_already_camped,
        };
    }

    protected override dtoToModel(dto?: CampingBonusDTO): void {
        if (dto) {
            this.tomb = dto.tomb;
            this.pande = dto.pande;
            this.improve = dto.improve;
            this.object_improve = dto.objectImprove;
            this.lighthouse = dto.lighthouse;
            this.camp_items = dto.campItems;
            this.zombie_vest = dto.zombieVest;
            this.zombie_no_vest = dto.zombieNoVest;
            this.night = dto.night;
            this.devastated = dto.devastated;
            this.dist_chances = dto.distChances;
            this.crowd_chances = dto.crowdChances;
            this.panda_pro_camper_by_already_camped = dto.pandaProCamperByAlreadyCamped;
            this.panda_no_pro_camper_by_already_camped = dto.pandaNoProCamperByAlreadyCamped;
            this.normal_pro_camper_by_already_camped = dto.normalProCamperByAlreadyCamped;
            this.normal_no_pro_camper_by_already_camped = dto.normalNoProCamperByAlreadyCamped;
        }
    }

}
