import { TownDTO } from '../dto/town.dto';
import { Cell } from './cell.class';
import { CommonModel, dtoToModelArray, modelToDtoArray } from './_common.class';

export class Town extends CommonModel<TownDTO> {

    public town_id!: number;
    public town_x!: number;
    public town_y!: number;
    public map_height!: number;
    public map_width!: number;
    public is_chaos!: boolean;
    public is_devasted!: boolean;
    public is_door_open!: boolean;
    public water_well!: number;
    public day!: number;
    public cells!: Cell[];

    constructor(dto?: TownDTO | null) {
        super();
        this.dtoToModel(dto);
    }

    public override modelToDto(): TownDTO {
        return {
            townId: this.town_id,
            townX: this.town_x,
            townY: this.town_y,
            mapHeight: this.map_height,
            mapWidth: this.map_width,
            isChaos: this.is_chaos,
            isDevasted: this.is_devasted,
            isDoorOpen: this.is_door_open,
            waterWell: this.water_well,
            day: this.day,
            cells: modelToDtoArray(this.cells)
        };
    }

    protected override dtoToModel(dto?: TownDTO | null): void {
        if (dto) {

            this.town_id = dto.townId;
            this.town_x = dto.townX;
            this.town_y = dto.townY;
            this.map_height = dto.mapHeight;
            this.map_width = dto.mapWidth;
            this.is_chaos = dto.isChaos;
            this.is_devasted = dto.isDevasted;
            this.is_door_open = dto.isDoorOpen;
            this.water_well = dto.waterWell;
            this.day = dto.day;
            this.cells = dtoToModelArray(Cell, dto.cells);
        }
    };

}
