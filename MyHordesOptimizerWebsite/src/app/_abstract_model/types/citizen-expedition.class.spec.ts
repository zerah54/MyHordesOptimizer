import { CitizenExpedition } from './citizen-expedition.class';

describe('CitizenExpedition', (): void => {
    it('reads any number of base action points', (): void => {
        expect(new CitizenExpedition({ nombrePaDepart: 8 } as never).base_ap).toBe(8);
        expect(new CitizenExpedition({ nombrePaDepart: 6 } as never).base_ap).toBe(6);
        expect(new CitizenExpedition({} as never).base_ap).toBeUndefined();
    });

    it('sends the base action points, 6 by default', (): void => {
        const place: CitizenExpedition = Object.assign(new CitizenExpedition(), { base_ap: 9 });

        expect(place.modelToDto().nombrePaDepart).toBe(9);
        expect(place.modelToDtoShort().nombrePaDepart).toBe(9);
        expect(new CitizenExpedition().modelToDto().nombrePaDepart).toBe(6);
        expect(new CitizenExpedition().modelToDtoShort().nombrePaDepart).toBeUndefined();
    });

    it('reads the place requirements', (): void => {
        const place: CitizenExpedition = new CitizenExpedition({ nombrePeDepart: 3, nombrePeDepartOperator: 'max', isPreinscritChaussures: false } as never);

        expect(place.required_sp).toBe(3);
        expect(place.required_sp_operator).toBe('max');
        expect(place.requires_shoes).toBe(false);
    });

    it('reads a place without requirements as undefined, null included', (): void => {
        const from_api: CitizenExpedition = new CitizenExpedition({ nombrePeDepart: null, nombrePeDepartOperator: null, isPreinscritChaussures: null } as never);
        const absent: CitizenExpedition = new CitizenExpedition({} as never);

        [from_api, absent].forEach((place: CitizenExpedition): void => {
            expect(place.required_sp).toBeUndefined();
            expect(place.required_sp_operator).toBeUndefined();
            expect(place.requires_shoes).toBeUndefined();
        });
    });

    it('sends the place requirements in both DTO shapes', (): void => {
        const place: CitizenExpedition = Object.assign(new CitizenExpedition(), { required_sp: 2, required_sp_operator: 'exact', requires_shoes: true });

        [place.modelToDto(), place.modelToDtoShort()].forEach((dto: { nombrePeDepart?: number | null; nombrePeDepartOperator?: string | null; isPreinscritChaussures?: boolean | null }): void => {
            expect(dto.nombrePeDepart).toBe(2);
            expect(dto.nombrePeDepartOperator).toBe('exact');
            expect(dto.isPreinscritChaussures).toBe(true);
        });
    });

    it('keeps forbidden shoes (false) distinct from indifferent (undefined)', (): void => {
        const forbidden: CitizenExpedition = Object.assign(new CitizenExpedition(), { requires_shoes: false });
        const indifferent: CitizenExpedition = new CitizenExpedition();

        expect(forbidden.modelToDto().isPreinscritChaussures).toBe(false);
        expect(forbidden.modelToDtoShort().isPreinscritChaussures).toBe(false);
        expect(indifferent.modelToDto().isPreinscritChaussures).toBeUndefined();
        expect(indifferent.modelToDtoShort().isPreinscritChaussures).toBeUndefined();
    });

    it('keeps the requirements through a DTO round trip', (): void => {
        const place: CitizenExpedition = new CitizenExpedition({ nombrePeDepart: 5, nombrePeDepartOperator: 'min', isPreinscritChaussures: true } as never);
        const copy: CitizenExpedition = new CitizenExpedition(place.modelToDto());

        expect(copy.required_sp).toBe(5);
        expect(copy.required_sp_operator).toBe('min');
        expect(copy.requires_shoes).toBe(true);
    });
});
