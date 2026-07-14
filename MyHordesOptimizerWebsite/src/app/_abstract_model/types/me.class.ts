import { MeDTO } from '../dto/me.dto';
import { TownDetails } from './town-details.class';
import { CommonModel } from './_common.class';

export class Me extends CommonModel<MeDTO> {
    public id!: number;
    public username!: string;
    public avatar!: string | null;
    public town_details!: TownDetails;

    constructor(dto?: MeDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): MeDTO {
        return {
            id: this.id,
            userName: this.username,
            avatar: this.avatar,
            townDetails: this.town_details.modelToDto()
        };
    }

    protected dtoToModel(dto?: MeDTO): void {
        if (dto) {
            this.id = dto.id;
            this.username = dto.userName;
            this.avatar = dto.avatar ?? null;
            this.town_details = new TownDetails(dto.townDetails);
        }
    }
}
