import { CitizenExpeditionDTO } from '../dto/citizen-expedition.dto';
import { JobEnum } from '../enum/job.enum';
import { CommonModel } from './_common.class';
import { Bag } from './bag.class';
import { Citizen } from './citizen.class';

export class CitizenExpedition extends CommonModel<CitizenExpeditionDTO> {
    public citizen!: Citizen;
    public bag: Bag = new Bag();
    public consigne!: string;
    public preinscrit!: boolean;
    public preinscrit_job?: JobEnum;
    public pdc!: number;
    public soif!: boolean;


    constructor(dto?: CitizenExpeditionDTO) {
        super();
        this.dtoToModel(dto);
    }

    public override modelToDto(): CitizenExpeditionDTO {
        return {
            citizen: this.citizen ? this.citizen.modelToDto() : undefined,
            bag: this.bag ? this.bag.modelToDto() : undefined,
            consigne: this.consigne,
            preinscrit: this.preinscrit,
            preinscrit_job: this.preinscrit_job?.value.id,
            pdc: this.pdc,
            soif: this.soif
        };
    }

    protected override dtoToModel(dto?: CitizenExpeditionDTO): void {
        if (dto) {
            this.citizen = new Citizen(dto.citizen);
            this.bag = new Bag(dto.bag);
            this.consigne = dto.consigne;
            this.preinscrit = dto.preinscrit;
            this.preinscrit_job = dto.preinscrit_job ? <JobEnum>JobEnum.getByKey(dto.preinscrit_job) : undefined;
            this.pdc = dto.pdc;
            this.soif = dto.soif;
        }
    }

}
