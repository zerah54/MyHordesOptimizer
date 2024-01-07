import { CitizenExpeditionDTO } from '../dto/citizen-expedition.dto';
import { HeroicActionEnum } from '../enum/heroic-action.enum';
import { JobEnum } from '../enum/job.enum';
import { CommonModel, dtoToModelArray, modelToDtoArray } from './_common.class';
import { Bag } from './bag.class';
import { Citizen } from './citizen.class';
import { ExpeditionOrder } from './expedition-order.class';

export class CitizenExpedition extends CommonModel<CitizenExpeditionDTO> {
    public id!: number;
    public citizen!: Citizen;
    public bag: Bag = new Bag();
    public orders!: ExpeditionOrder[];
    public preinscrit!: boolean;
    public preinscrit_job?: JobEnum;
    public preinscrit_heroic?: HeroicActionEnum;
    public pdc!: number;
    public soif?: boolean;


    constructor(dto?: CitizenExpeditionDTO | null) {
        super();
        this.dtoToModel(dto);
    }

    public override modelToDto(): CitizenExpeditionDTO {
        return {
            id: this.id,
            citizen: this.citizen ? this.citizen.modelToDto() : undefined,
            bag: this.bag ? this.bag.modelToDto() : undefined,
            orders: modelToDtoArray(this.orders),
            preinscrit: this.preinscrit,
            preinscritJob: this.preinscrit_job?.value.id,
            preinscritHeroic: this.preinscrit_heroic?.key,
            pdc: this.pdc,
            soif: this.soif
        };
    }

    protected override dtoToModel(dto?: CitizenExpeditionDTO | null): void {
        if (dto) {
            this.id = dto.id;
            this.citizen = new Citizen(dto.citizen);
            this.bag = new Bag(dto.bag);
            this.orders = dtoToModelArray(ExpeditionOrder, dto.orders);
            this.preinscrit = dto.preinscrit;
            this.preinscrit_job = dto.preinscritJob ? <JobEnum>JobEnum.getByKey(dto.preinscritJob) : undefined;
            this.preinscrit_heroic = dto.preinscritHeroic ? <HeroicActionEnum>HeroicActionEnum.getByKey(dto.preinscritHeroic) : undefined;
            this.pdc = dto.pdc;
            this.soif = dto.soif;
        }
    }

}
