import { CadaverDTO } from '../dto/cadaver.dto';
import { CleanUpDTO } from '../dto/clean-up.dto';
import { CommonModel } from './_common.class';
import { CauseOfDeath } from './cause-of-death.class';

export class Cadaver extends CommonModel<CadaverDTO> {
    private avatar?: string;
    public cause_of_death?: CauseOfDeath;
    private cleanup?: CleanUpDTO;
    private id!: number;
    private name!: string;
    public score!: number;
    public survival!: number;
    public msg?: string;
    public town_msg?: string;

    public constructor(dto?: CadaverDTO) {
        super();
        this.dtoToModel(dto);
    }

    /**
     * Derniers mots du joueur. MyHordes renvoie le token `{gotKilled}` quand le
     * joueur a été tué sans laisser de message : on l'affiche alors en « -- ».
     */
    public getMsg(): string | undefined {
        return this.msg === '{gotKilled}' ? '--' : this.msg;
    }

    public modelToDto(): CadaverDTO {
        return {
            avatar: this.avatar,
            causeOfDeath: this.cause_of_death?.modelToDto(),
            cleanUp: this.cleanup,
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
            this.cause_of_death = dto.causeOfDeath ? new CauseOfDeath(dto.causeOfDeath) : undefined;
            this.cleanup = dto.cleanUp;
            this.id = dto.id;
            this.name = dto.name;
            this.score = dto.score;
            this.survival = dto.survival;
            this.msg = dto.msg;
            this.town_msg = dto.townMsg;
        }
    }
}
