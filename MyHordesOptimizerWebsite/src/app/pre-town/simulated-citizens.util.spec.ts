import { Citizen } from '../_abstract_model/types/citizen.class';
import { NightwatchCitizenStateDTO } from '../my-town/nightwatch/nightwatch.types';
import { simulatedCitizens, simulatedNightwatchCitizens } from './simulated-citizens.util';

describe('simulated-citizens.util', (): void => {
    it('simulatedCitizens : citoyens vivants non bannis d\'identifiants -1…-N, nommés', (): void => {
        const citizens: Citizen[] = simulatedCitizens(3);

        expect(citizens.map((citizen: Citizen): number => citizen.id)).toEqual([-1, -2, -3]);
        expect(citizens[1].name).toContain('2');
        expect(citizens.every((citizen: Citizen): boolean => citizen.is_dead === false && citizen.is_shunned === false)).toBe(true);
        expect(citizens.every((citizen: Citizen): boolean => citizen.job === undefined && citizen.home === undefined)).toBe(true);
    });

    it('simulatedNightwatchCitizens : mêmes identifiants et noms, sans état ni objets', (): void => {
        const citizens: NightwatchCitizenStateDTO[] = simulatedNightwatchCitizens(2);

        expect(citizens.map((citizen: NightwatchCitizenStateDTO): number => citizen.userId)).toEqual([-1, -2]);
        expect(citizens[0].name).toBe(simulatedCitizens(1)[0].name);
        expect(citizens[1].isShunned || citizens[1].isGhoul || citizens[1].isDrugged || citizens[1].isDrunk || citizens[1].isThirsty || citizens[1].isImmune).toBe(false);
        expect(citizens[1].bag).toEqual({});
        expect(citizens[1].chest).toEqual({});
    });
});
