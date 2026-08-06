import { DailyActionDTO } from '../dto/daily-action.dto';
import { CommonModel } from './_common.class';
import { UpdateInfo } from './update-info.class';

export class DailyAction extends CommonModel<DailyActionDTO> {
    public day!: number;
    public action_key!: string;
    public update_info!: UpdateInfo;

    public constructor(dto?: DailyActionDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): DailyActionDTO {
        return {
            day: this.day,
            actionKey: this.action_key,
            lastUpdateInfo: this.update_info?.modelToDto()
        };
    }

    protected dtoToModel(dto?: DailyActionDTO): void {
        if (dto) {
            this.day = dto.day;
            this.action_key = dto.actionKey;
            this.update_info = new UpdateInfo(dto.lastUpdateInfo);
        }
    }
}
