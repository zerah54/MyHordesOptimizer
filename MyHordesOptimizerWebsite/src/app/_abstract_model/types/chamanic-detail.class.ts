import { ChamanicDetailDTO } from '../dto/chamanic-detail.dto';
import { CommonModel } from './_common.class';
import { UpdateInfo } from './update-info.class';

export class ChamanicDetail extends CommonModel<ChamanicDetailDTO> {
    public nb_potion_shaman!: number;
    public is_immune_to_soul!: boolean;
    public update_info!: UpdateInfo;


    constructor(dto?: ChamanicDetailDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): ChamanicDetailDTO {
        return {
            nbPotionChaman: this.nb_potion_shaman,
            isImmuneToSoul: this.is_immune_to_soul
        };
    }

    protected dtoToModel(dto?: ChamanicDetailDTO): void {
        if (dto) {
            this.nb_potion_shaman = dto.nbPotionChaman;
            this.is_immune_to_soul = dto.isImmuneToSoul;
            this.update_info = new UpdateInfo(dto.lastUpdateInfo);
        }
    }
}
