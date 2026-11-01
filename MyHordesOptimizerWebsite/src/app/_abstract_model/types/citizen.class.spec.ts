import { Citizen } from './citizen.class';

describe('Citizen', (): void => {
    it('reads the declared shoes', (): void => {
        expect(new Citizen({ shoesEquipped: true } as never).shoes_equipped).toBe(true);
        expect(new Citizen({ shoesEquipped: false } as never).shoes_equipped).toBe(false);
    });

    it('defaults to no shoes when the DTO omits them', (): void => {
        expect(new Citizen({} as never).shoes_equipped).toBe(false);
        expect(new Citizen().shoes_equipped).toBe(false);
    });

    it('applies the job to the hero skill levels read from the API', (): void => {
        const levels: object = { s: 2, u: 0, p: null, e: 4, r: 1 };

        expect(new Citizen({ jobUid: 'basic', heroSkills: levels } as never).hero_skills).toEqual({ s: 0, u: 0, p: 0, e: 0, r: 0 });
        expect(new Citizen({ jobUid: 'vest', heroSkills: levels } as never).hero_skills).toEqual({ s: 2, u: null, p: null, e: 4, r: 1 });
    });
});
