import { CitizenExpeditionDTO, CitizenExpeditionShortDTO } from '../dto/citizen-expedition.dto';
import { CommonModel, dtoToModelArray, modelToDtoArray } from './_common.class';
import { CitizenExpeditionBag } from './citizen-expedition-bag.class';
import { ExpeditionOrder } from './expedition-order.class';

export class CitizenExpedition extends CommonModel<CitizenExpeditionDTO> {
    public id?: number;
    public citizen_id?: number;
    public expedition_part_id?: number;
    public expedition_id?: number;
    public bag: CitizenExpeditionBag = new CitizenExpeditionBag();
    public orders!: ExpeditionOrder[];
    public preinscrit!: boolean;
    public is_preinscrit_soif?: boolean;
    public preinscrit_job?: string;
    public preinscrit_heroic_skill?: string;
    public pdc!: number;
    public is_thirsty?: boolean;
    public starts_7_ap?: boolean;

    constructor(dto?: CitizenExpeditionDTO | null) {
        super();
        this.dtoToModel(dto);
    }

    public override modelToDto(): CitizenExpeditionDTO {
        return {
            id: this.id,
            idUser: this.citizen_id ? this.citizen_id : undefined,
            bag: this.bag ? this.bag.modelToDto() : undefined,
            orders: modelToDtoArray(this.orders),
            preinscrit: this.preinscrit,
            isPreinscritSoif: this.is_preinscrit_soif,
            preinscritJob: this.preinscrit_job,
            preinscritHeroicSkillName: this.preinscrit_heroic_skill,
            pdc: this.pdc,
            isThirsty: this.is_thirsty,
            nombrePaDepart: this.starts_7_ap ? 7 : 6
        };
    }

    public modelToDtoShort(): CitizenExpeditionShortDTO {
        return {
            id: this.id,
            idUser: this.citizen_id ? this.citizen_id : undefined,
            bagId: this.bag?.bag_id,
            ordersId: this.orders ? this.orders
                .filter((order: ExpeditionOrder) => order.id !== undefined && order.id !== null)
                .map((order: ExpeditionOrder) => <number>order.id) : [],
            preinscrit: this.preinscrit,
            isPreinscritSoif: this.is_preinscrit_soif,
            preinscritJob: this.preinscrit_job,
            preinscritHeroicSkillName: this.preinscrit_heroic_skill,
            pdc: this.pdc,
            isThirsty: this.is_thirsty,
            nombrePaDepart: this.starts_7_ap === true ? 7 : (this.starts_7_ap === false ? 6 : undefined)
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
            this.is_preinscrit_soif = dto.isPreinscritSoif;
            this.preinscrit_job = dto.preinscritJob;
            this.preinscrit_heroic_skill = dto.preinscritHeroicSkillName;
            this.pdc = dto.pdc;
            this.is_thirsty = dto.isThirsty;
            this.starts_7_ap = dto.nombrePaDepart === 7 ? true : (dto.nombrePaDepart === 6 ? false : undefined);
            this.expedition_part_id = dto.expeditionPartId;
            this.expedition_id = dto.expeditionId;
        }
    }

}
