import { inject } from '@angular/core';
import { LocalStorageService } from '../../shared/services/localstorage.service';
import { getArrayXFromDisplayedX, getArrayYFromDisplayedY, getDisplayedXFromArrayX, getDisplayedYFromArrayY } from '../../shared/utilities/coordinates.util';
import { getTown } from '../../shared/utilities/localstorage.util';
import { DigDTO } from '../dto/dig.dto';
import { CommonModel } from './_common.class';
import { UpdateInfo } from './update-info.class';

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

    private local_storage: LocalStorageService = inject(LocalStorageService);

    constructor(dto?: DigDTO) {
        super();
        this.dtoToModel(dto);
    }

    public override modelToDto(): DigDTO {
        return {
            cellId: this.cell_id,
            diggerId: +this.digger_id,
            diggerName: this.digger_name,
            x: getArrayXFromDisplayedX(+this.x, getTown(this.local_storage)),
            y: getArrayYFromDisplayedY(+this.y, getTown(this.local_storage)),
            day: +this.day,
            nbSucces: +this.nb_success,
            nbTotalDig: +this.nb_total_dig,
        };
    }

    protected override dtoToModel(dto?: DigDTO): void {
        if (dto) {
            this.cell_id = dto.cellId;
            this.x = getDisplayedXFromArrayX(dto.x, getTown(this.local_storage));
            this.y = getDisplayedYFromArrayY(dto.y, getTown(this.local_storage));
            this.digger_id = dto.diggerId;
            this.digger_name = dto.diggerName;
            this.day = dto.day;
            this.nb_success = dto.nbSucces;
            this.nb_total_dig = dto.nbTotalDig;
            this.update_info = new UpdateInfo(dto.lastUpdateInfo);
        }
    }

}
