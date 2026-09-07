import { SuggestedOrderDTO } from '../dto/suggested-order.dto';
import { CommonModel } from './_common.class';
import { CitizenState } from './citizen-state.class';

/** Un ordre de consommation suggéré (par ids d'item) et l'état final qu'il produit — réponse serveur uniquement, jamais renvoyé. */
export class SuggestedOrder extends CommonModel<SuggestedOrderDTO> {
    public label: string = '';
    public order: number[] = [];
    public final_state!: CitizenState;

    public constructor(dto?: SuggestedOrderDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): SuggestedOrderDTO {
        return { label: this.label, order: this.order, finalState: this.final_state.modelToDto() };
    }

    protected dtoToModel(dto?: SuggestedOrderDTO): void {
        if (dto) {
            this.label = dto.label;
            this.order = dto.order;
            this.final_state = new CitizenState(dto.finalState);
        }
    }
}
