import { getTown } from 'src/app/shared/utilities/localstorage.util';
import { DigDTO } from '../dto/dig.dto';
import { UpdateInfo } from './update-info.class';
import { CommonModel } from './_common.class';

export class Dig extends CommonModel<DigDTO> {
    public cell_id?: number;
    public digger_id!: number;
    public digger_name!: string;
    public x!: number;
    public y!: number;
    public day!: number;
    public nb_success!: number;
    public nb_total_dig!: number;
    public update_info!: UpdateInfo;

    constructor(dto?: DigDTO) {
        super();
        this.dtoToModel(dto);
    }

    public override modelToDto(): DigDTO {
        return {
            cellId: this.cell_id,
            diggerId: +this.digger_id,
            diggerName: this.digger_name,
            x: +this.x + (getTown()?.town_x || 0),
            y: (getTown()?.town_y || 0) - +this.y,
            day: +this.day,
            nbSucces: +this.nb_success,
            nbTotalDig: +this.nb_total_dig,
        };
    }

    protected override dtoToModel(dto?: DigDTO): void {
        if (dto) {
            this.cell_id = dto.cellId;

            this.x = dto.x - (getTown()?.town_x || 0);
            this.y = (getTown()?.town_y || 0) - dto.y;
            this.digger_id = dto.diggerId;
            this.digger_name = dto.diggerName;
            this.day = dto.day;
            this.nb_success = dto.nbSucces;
            this.nb_total_dig = dto.nbTotalDig;
            this.update_info = new UpdateInfo(dto.lastUpdateInfo);
        }
    };

}
