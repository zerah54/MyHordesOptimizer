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
});
