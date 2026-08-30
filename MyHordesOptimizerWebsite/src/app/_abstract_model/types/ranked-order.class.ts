import { RankedOrderDTO } from '../dto/ranked-order.dto';
import { CommonModel } from './_common.class';
import { CitizenState } from './citizen-state.class';

/** Un ordre de consommation possible du sac et la gravité qu'il atteint — réponse serveur uniquement, jamais renvoyé. */
export class RankedOrder extends CommonModel<RankedOrderDTO> {
    public order: number[] = [];
    /** Clé stable (none/drugged/drunk/thirsty/wounded/addicted/dehydrated/dead), jamais un libellé affichable. */
    public tier: string = '';
    public tier_reached_at_distance: number | null = null;
    public total_distance: number = 0;
    public final_state!: CitizenState;

    public constructor(dto?: RankedOrderDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): RankedOrderDTO {
        return {
            order: this.order,
            tier: this.tier,
            tierReachedAtDistance: this.tier_reached_at_distance,
            totalDistance: this.total_distance,
            finalState: this.final_state.modelToDto(),
        };
    }

    protected dtoToModel(dto?: RankedOrderDTO): void {
        if (dto) {
            this.order = dto.order;
            this.tier = dto.tier;
            this.tier_reached_at_distance = dto.tierReachedAtDistance;
            this.total_distance = dto.totalDistance;
            this.final_state = new CitizenState(dto.finalState);
        }
    }
}
