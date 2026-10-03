import { beforeEach, describe, expect, it } from 'vitest';

import { state } from '../state';
import { isMhoWebsite, shouldRefreshMe } from './page';

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

describe('isMhoWebsite()', () => {
    const prod_website: string = 'https://myhordes-optimizer.web.app/';

    it('reconnaît le site de production', () => {
        expect(isMhoWebsite('https://myhordes-optimizer.web.app/my-town/citizens', prod_website)).toBe(true);
    });

    /** Sur le site bêta, `state.website` vaut la production : l'URL ne contient pas « staging » */
    it('reconnaît le site bêta même quand state.website pointe la production', () => {
        expect(isMhoWebsite('https://myhordes-optimizer-beta.web.app/map', prod_website)).toBe(true);
    });

    it('reconnaît le site local passé en paramètre', () => {
        expect(isMhoWebsite('http://localhost:4200/tutorials', 'http://localhost:4200/')).toBe(true);
    });

    it('compare l\'origine exacte, pas un simple préfixe', () => {
        expect(isMhoWebsite('https://myhordes-optimizer.web.app.example.com/', prod_website)).toBe(false);
    });

    it('ignore les autres sites et un website vide', () => {
        expect(isMhoWebsite('https://myhordes.eu/jx/town/dashboard', prod_website)).toBe(false);
        expect(isMhoWebsite('https://gesthordes.fr/', '')).toBe(false);
    });
});
