import { StatusDTO } from '../dto/status.dto';
import { StatusEnum } from '../enum/status.enum';
import { UpdateInfo } from './update-info.class';
import { CommonModel } from './_common.class';
import { Dictionary } from './_types';

export class Status extends CommonModel<StatusDTO> {
    public content!: Dictionary<boolean>;
    public icons!: StatusEnum[];
    public update_info!: UpdateInfo;

    constructor(dto?: StatusDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): StatusDTO {
        return {
            content: this.content,
            icons: this.icons.map((status: StatusEnum) => status.key),
            lastUpdateInfo: this.update_info.modelToDto()
        };
    }

    protected dtoToModel(dto?: StatusDTO): void {
        if (dto) {
            this.content = dto.content;
            this.icons = dto.icons ? <StatusEnum[]>dto.icons.map((icon: string) => StatusEnum.getByKey(icon)) : [];
            this.update_info = new UpdateInfo(dto.lastUpdateInfo);
        }
    };

}
