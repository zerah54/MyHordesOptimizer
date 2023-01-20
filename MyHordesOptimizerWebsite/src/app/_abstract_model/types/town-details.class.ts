import { TownDetailsDTO } from '../dto/town-details.dto';
import { CommonModel } from "./_common.class";

export class TownDetails extends CommonModel<TownDetailsDTO> {
    public town_id!: number;
    public town_x!: number;
    public town_y!: number;
    public town_max_x!: number;
    public town_max_y!: number;
    public is_devaste!: boolean;
    public day!: number;

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
            isDevaste: this.is_devaste,
            day: this.day
        };
    };

    protected dtoToModel(dto?: TownDetailsDTO): void {
        if (dto) {
            this.town_id = dto.townId;
            this.town_x = dto.townX;
            this.town_y = dto.townY;
            this.town_max_x = dto.townMaxX;
            this.town_max_y = dto.townMaxY;
            this.is_devaste = dto.isDevaste;
            this.day = dto.day;
        }
    };
}
