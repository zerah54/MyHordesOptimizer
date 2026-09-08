import { beforeEach, describe, expect, it } from 'vitest';

import { state } from '../state';
import { shouldRefreshMe } from './page';

beforeEach(() => {
    document.body.innerHTML = '';
    state.mh_user = undefined;
});

describe('shouldRefreshMe()', () => {
    /**
     * `state.mh_user` ne provient plus du stockage au démarrage (chantier cycle de vie de
     * session) : il reste `undefined` tant qu'aucun `getToken()` n'a résolu. `isValidToken()`
     * (utils/misc.ts) appelle `shouldRefreshMe()` avant de connaître le résultat de ce premier
     * appel — dès qu'une horloge de jeu est présente dans le DOM, ce qui est le cas sur toute
     * page en ville, l'accès direct à `state.mh_user.townDetails` plantait.
     */
    it('renvoie true sans planter quand state.mh_user est undefined et qu\'une horloge de jeu est présente', () => {
        document.body.innerHTML = '<div class="game-clock" data-town-id="5"><span class="day-number">3</span></div>';
        state.mh_user = undefined;

        expect(() => shouldRefreshMe()).not.toThrow();
        expect(shouldRefreshMe()).toBe(true);
    });
});
