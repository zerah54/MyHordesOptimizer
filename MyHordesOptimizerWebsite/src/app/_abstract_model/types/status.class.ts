import { StatusDTO } from '../dto/status.dto';
import { StatusEnum } from '../enum/status.enum';
import { CommonModel } from './_common.class';
import { Dictionary } from './_types';
import { UpdateInfo } from './update-info.class';

export class Status extends CommonModel<StatusDTO> {
    private content!: Dictionary<boolean>;
    public icons!: StatusEnum[];
    public update_info!: UpdateInfo;
    /** Goule : saisie à la main depuis la liste des citoyens, jamais relevée par l'addon. */
    public is_ghoul!: boolean;
    private ghoul_voracity!: number;
    public ghoul_status_update_info!: UpdateInfo;

    public constructor(dto?: StatusDTO) {
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
            const icons: StatusEnum[] = dto.icons ? <StatusEnum[]>dto.icons.filter((icon: string) => icon !== StatusEnum.GHOUL.key).map((icon: string) => StatusEnum.getByKey(icon)) : [];
            // « Goule » suit l'état renseigné à la main, pas la liste d'icônes du serveur.
            this.icons = dto.isGhoul === true ? [...icons, StatusEnum.GHOUL] : icons;
            this.update_info = new UpdateInfo(dto.lastUpdateInfo);
            this.ghoul_status_update_info = new UpdateInfo(dto.ghoulStatusLastUpdateInfo);
            this.ghoul_voracity = dto.ghoulVoracity;
            this.is_ghoul = dto.isGhoul;
        }
    }

}
