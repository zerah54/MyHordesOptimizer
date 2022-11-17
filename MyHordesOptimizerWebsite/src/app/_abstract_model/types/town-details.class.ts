import { MeDTO } from '../dto/me.dto';
import { TownDetailsDTO } from '../dto/town-details.dto';
import { CommonModel } from "./_common.class";
import { I18nLabels } from "./_types";

export class TownDetails extends CommonModel<TownDetailsDTO> {
    public town_id!: number;
    public town_x!: number;
    public town_y!: number;
    public town_max_x!: number;
    public town_max_y!: number;
    public is_devaste!: boolean;

    constructor(dto?: TownDetailsDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): TownDetailsDTO {
        return {
            townId: this.town_id,
            townX: this.town_x,
            townY: this.town_y,
            townMaxX: this.town_max_x,
            townMaxY: this.town_max_y,
            isDevaste: this.is_devaste
        };
    };

    protected dtoToModel(dto?: TownDetailsDTO): void {
        if (dto) {
            this.town_id = this.town_id;
            this.town_x = this.town_x;
            this.town_y = this.town_y;
            this.town_max_x = this.town_max_x;
            this.town_max_y = this.town_max_y;
            this.is_devaste = this.is_devaste;
        }
    };
}
