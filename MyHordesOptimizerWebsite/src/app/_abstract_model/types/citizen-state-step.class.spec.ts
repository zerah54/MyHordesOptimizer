import { CitizenStateStep } from './citizen-state-step.class';

describe('CitizenStateStep', (): void => {
    it('secondWind builds a "second_wind" step carrying its level', (): void => {
        const step: CitizenStateStep = CitizenStateStep.secondWind(2);

        expect(step.type).toBe('second_wind');
        expect(step.level).toBe(2);
    });

    it('round-trips level through modelToDto', (): void => {
        const step: CitizenStateStep = CitizenStateStep.secondWind(3);

        expect(step.modelToDto()).toEqual({ type: 'second_wind', itemId: undefined, isNearZone: undefined, level: 3 });
    });
});
