import { CommonModel } from './_common.class';
import { TokenWithMeDTO } from '../dto/token-with-me.dto';
import { Me } from './me.class';
import { Token } from './token.class';

export class TokenWithMe extends CommonModel<TokenWithMeDTO> {

    public token!: Token;
    public simple_me!: Me;

    constructor(dto?: TokenWithMeDTO | null) {
        super();
        this.dtoToModel(dto);
    }

    public override modelToDto(): TokenWithMeDTO {
        return {
            token: this.token.modelToDto(),
            simpleMe: this.simple_me.modelToDto()
        };
    }

    protected override dtoToModel(dto?: TokenWithMeDTO | null): void {
        if (dto) {
            this.token = new Token(dto.token);
            this.simple_me = new Me(dto.simpleMe);
        }
    }

}
