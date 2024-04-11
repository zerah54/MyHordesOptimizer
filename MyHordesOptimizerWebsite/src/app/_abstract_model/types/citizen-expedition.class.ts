import { CitizenExpeditionDTO, CitizenExpeditionShortDTO } from '../dto/citizen-expedition.dto';
import { HeroicActionEnum } from '../enum/heroic-action.enum';
import { JobEnum } from '../enum/job.enum';
import { CommonModel, dtoToModelArray, modelToDtoArray } from './_common.class';
import { CitizenExpeditionBag } from './citizen-expedition-bag.class';
import { ExpeditionOrder } from './expedition-order.class';

export class CitizenExpedition extends CommonModel<CitizenExpeditionDTO> {
    public id?: number;
    public citizen_id?: number;
    public bag: CitizenExpeditionBag = new CitizenExpeditionBag();
    public orders!: ExpeditionOrder[];
    public preinscrit!: boolean;
    public preinscrit_job?: JobEnum;
    public preinscrit_heroic_skill?: HeroicActionEnum;
    public pdc!: number;
    public is_thirsty?: boolean;


    constructor(dto?: CitizenExpeditionDTO | null) {
        super();
        this.dtoToModel(dto);
    }

    public override modelToDto(): CitizenExpeditionDTO {
        console.log('bag', this.bag);
        return {
            id: this.id,
            idUser: this.citizen_id ? this.citizen_id : undefined,
            bag: this.bag ? this.bag.modelToDto() : undefined,
            orders: modelToDtoArray(this.orders),
            preinscrit: this.preinscrit,
            preinscritJob: this.preinscrit_job?.value.id,
            preinscritHeroicSkillName: this.preinscrit_heroic_skill?.key,
            pdc: this.pdc,
            isThirsty: this.is_thirsty
        };
    }

    public modelToDtoShort(): CitizenExpeditionShortDTO {
        console.log('bag', this.bag);
        return {
            id: this.id,
            idUser: this.citizen_id ? this.citizen_id : undefined,
            bagId: this.bag?.bag_id,
            ordersId: this.orders ? this.orders
                .filter((order: ExpeditionOrder) => order.id !== undefined && order.id !== null)
                .map((order: ExpeditionOrder) => <number>order.id) : [],
            preinscrit: this.preinscrit,
            preinscritJob: this.preinscrit_job?.value.id,
            preinscritHeroicSkillName: this.preinscrit_heroic_skill?.key,
            pdc: this.pdc,
            isThirsty: this.is_thirsty
        };
    }

    protected override dtoToModel(dto?: CitizenExpeditionDTO | null): void {
        if (dto) {
            this.id = dto.id;
            this.citizen_id = dto.idUser;
            this.bag = new CitizenExpeditionBag(dto.bag);
            this.orders = dtoToModelArray(ExpeditionOrder, dto.orders);
            this.orders.sort((order_a: ExpeditionOrder, order_b: ExpeditionOrder) => {
                if (order_a.position < order_b.position) return -1;
                if (order_a.position > order_b.position) return 1;
                return 0;
            });
            this.preinscrit = dto.preinscrit;
            this.preinscrit_job = dto.preinscritJob ? <JobEnum>JobEnum.getByKey(dto.preinscritJob) : undefined;
            this.preinscrit_heroic_skill = dto.preinscritHeroicSkillName ? <HeroicActionEnum>HeroicActionEnum.getByKey(dto.preinscritHeroicSkillName) : undefined;
            this.pdc = dto.pdc;
            this.is_thirsty = dto.isThirsty;
        }
    }

}
