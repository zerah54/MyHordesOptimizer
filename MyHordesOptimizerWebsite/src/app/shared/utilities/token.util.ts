import moment from 'moment-timezone';
import { TokenWithMe } from '../../_abstract_model/types/token-with-me.class';

export function isValidToken(token: TokenWithMe | null): boolean {

    // TODO rajouter une vérification si on n'est pas le même jour que le token ET qu'il est plus de minuit 20
    if (!token || !token.token.valid_to || moment(token.token.valid_to).isBefore(moment())) {
        return false;
    }
    return true;
}
