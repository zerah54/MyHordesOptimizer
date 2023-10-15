import { CadaverDTO } from '../dto/cadaver.dto';
import { CommonModel } from './_common.class';

export class Cadaver extends CommonModel<CadaverDTO> {
    public avatar?: string;
    public cause_of_death?: undefined;
    public cleanup?: undefined;
    public id!: number;
    public name!: string;
    public score!: number;
    public survival!: number;
    public msg?: string;
    public town_msg?: string;

    constructor(dto?: CadaverDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): CadaverDTO {
        return {
            avatar: this.avatar,
            causeOfDeath: this.cause_of_death,
            cleanup: this.cleanup,
            id: this.id,
            name: this.name,
            score: this.score,
            survival: this.survival,
            msg: this.msg,
            townMsg: this.town_msg,
        };
    }

    protected dtoToModel(dto?: CadaverDTO): void {
        if (dto) {
            this.avatar = dto.avatar;
            this.cause_of_death = dto.causeOfDeath;
            this.cleanup = dto.cleanup;
            this.id = dto.id;
            this.name = dto.name;
            this.score = dto.score;
            this.survival = dto.survival;
            this.msg = dto.msg;
            this.town_msg = dto.townMsg;
        }
    }
}
