import { WatchmanDTO } from '../dto/watchman.dto';
import { CommonModel } from './_common.class';
import { Citizen } from './citizen.class';

export class Watchman extends CommonModel<WatchmanDTO> {
    public id?: number;
    public citizen!: Citizen;

    constructor(watchman?: WatchmanDTO) {
        super();
        this.dtoToModel(watchman);
    }

    public override modelToDto(): WatchmanDTO {
        return {
            id: this.id, citizen: this.citizen?.modelToDto()
        };
    }

    protected override dtoToModel(dto?: WatchmanDTO | null): void {
        if (dto) {
            this.id = dto.id;
            this.citizen = new Citizen(dto.citizen);
        }
    }
}
