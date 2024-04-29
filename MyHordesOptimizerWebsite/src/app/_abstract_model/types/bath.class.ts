import { BathDTO } from '../dto/bath.dto';
import { CommonModel } from './_common.class';
import { UpdateInfo } from './update-info.class';

export class Bath extends CommonModel<BathDTO> {
    public day!: number;
    public update_info!: UpdateInfo;

    constructor(dto?: BathDTO | null) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): BathDTO {
        return {
            day: this.day,
            lastUpdateInfo: this.update_info?.modelToDto()
        };
    }

    protected dtoToModel(dto?: BathDTO | null): void {
        if (dto) {
            this.day = dto.day;
            this.update_info = new UpdateInfo(dto.lastUpdateInfo);
        }
    }
}
