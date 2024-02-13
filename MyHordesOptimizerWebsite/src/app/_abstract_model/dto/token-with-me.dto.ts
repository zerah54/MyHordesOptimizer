import { MeDTO } from './me.dto';
import { TokenDTO } from './token.dto';

export interface TokenWithMeDTO {
    token: TokenDTO;
    simpleMe: MeDTO;
}
