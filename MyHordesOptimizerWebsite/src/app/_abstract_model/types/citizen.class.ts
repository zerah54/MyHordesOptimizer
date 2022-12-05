import { CitizenDTO } from '../dto/citizen.dto';
import { Bag } from './bag.class';
import { CommonModel } from './_common.class';

export class Citizen extends CommonModel<CitizenDTO> {
    public avatar!: string;
    public home_message!: string;
    public id!: number;
    public is_ghost: boolean = false;
    public job_name!: string;
    public name!: string;
    public nombre_jour_hero!: number;
    public x!: number;
    public y!: number;
    public bag!: Bag;

    constructor(dto?: CitizenDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): CitizenDTO {
        return {
            avatar: this.avatar,
            homeMessage: this.home_message,
            id: this.id,
            isGhost: this.is_ghost,
            jobName: this.job_name,
            nombreJourHero: this.nombre_jour_hero,
            x: this.x,
            y: this.y,
            name: this.name,
            bag: this.bag.modelToDto()
        }
    };

    protected dtoToModel(dto?: CitizenDTO): void {
        if (dto) {
            this.avatar = dto.avatar;
            this.home_message = dto.homeMessage;
            this.id = dto.id;
            this.is_ghost = dto.isGhost;
            this.job_name = dto.jobName;
            this.nombre_jour_hero = dto.nombreJourHero;
            this.x = dto.x;
            this.y = dto.y;
            this.name = dto.name;
            this.bag = new Bag(dto.bag);
        }
    };
}
