import { CommonModel } from './_common.class';
import { TokenDTO } from '../dto/token.dto';
import * as moment from 'moment';
import { Moment } from 'moment';

export class Token extends CommonModel<TokenDTO> {

    public acces_token!: string;
    public valid_from!: Moment;
    public valid_to!: Moment;

    constructor(dto?: TokenDTO | null) {
        super();
        this.dtoToModel(dto);
    }

    public override modelToDto(): TokenDTO {
        return {
            accessToken: this.acces_token,
            validFrom: this.valid_from.toDate(),
            validTo: this.valid_to.toDate(),
        };
    }

    protected override dtoToModel(dto?: TokenDTO | null): void {
        if (dto) {
            this.acces_token = dto.accessToken;
            this.valid_from = moment(dto.validFrom);
            this.valid_to = moment(dto.validTo);
        }
    }

}
