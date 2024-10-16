import { StatusDTO } from '../dto/status.dto';
import { StatusEnum } from '../enum/status.enum';
import { CommonModel } from './_common.class';
import { Dictionary } from './_types';
import { UpdateInfo } from './update-info.class';

export class Status extends CommonModel<StatusDTO> {
    public content!: Dictionary<boolean>;
    public icons!: StatusEnum[];
    public update_info!: UpdateInfo;
    public is_ghoul!: boolean;
    public ghoul_voracity!: number;
    public ghoul_status_update_info!: UpdateInfo;

    constructor(dto?: StatusDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): StatusDTO {
        return {
            content: this.content,
            icons: this.icons?.map((status: StatusEnum) => status?.key),
            lastUpdateInfo: this.update_info?.modelToDto(),
            ghoulStatusLastUpdateInfo: this.ghoul_status_update_info?.modelToDto(),
            isGhoul: this.is_ghoul,
            ghoulVoracity: this.ghoul_voracity,
        };
    }

    protected dtoToModel(dto?: StatusDTO): void {
        if (dto) {
            this.content = dto.content;
            this.icons = dto.icons ? <StatusEnum[]>dto.icons.filter((icon: string) => icon !== 'ghoul').map((icon: string) => StatusEnum.getByKey(icon)) : [];
            this.update_info = new UpdateInfo(dto.lastUpdateInfo);
            this.ghoul_status_update_info = new UpdateInfo(dto.ghoulStatusLastUpdateInfo);
            this.ghoul_voracity = dto.ghoulVoracity;
            this.is_ghoul = dto.isGhoul;
        }
    }

}
