import { CitizenExpeditionDTO, CitizenExpeditionShortDTO } from '../dto/citizen-expedition.dto';
import { CommonModel, dtoToModelArray, modelToDtoArray } from './_common.class';
import { SpRequirementOperator } from './_types';
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
    /** PA au départ ; non renseigné : 6. */
    public base_ap?: number;
    /** PE exigés au départ ; non renseigné : aucune exigence. */
    public required_sp?: number;
    /** Comparaison de `required_sp` ; non renseigné : au moins. */
    public required_sp_operator?: SpRequirementOperator;
    /** `true` : chaussures exigées, `false` : interdites, `undefined` : indifférent. */
    public requires_shoes?: boolean;

    public constructor(dto?: CitizenExpeditionDTO | null) {
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
            nombrePaDepart: this.base_ap ?? 6,
            nombrePeDepart: this.required_sp,
            nombrePeDepartOperator: this.required_sp_operator,
            isPreinscritChaussures: this.requires_shoes
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
            nombrePaDepart: this.base_ap,
            nombrePeDepart: this.required_sp,
            nombrePeDepartOperator: this.required_sp_operator,
            isPreinscritChaussures: this.requires_shoes
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
            this.base_ap = dto.nombrePaDepart ?? undefined;
            this.required_sp = dto.nombrePeDepart ?? undefined;
            this.required_sp_operator = dto.nombrePeDepartOperator ?? undefined;
            this.requires_shoes = dto.isPreinscritChaussures ?? undefined;
            this.expedition_part_id = dto.expeditionPartId;
            this.expedition_id = dto.expeditionId;
        }
    }

}
