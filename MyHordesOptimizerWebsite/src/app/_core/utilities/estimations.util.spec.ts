import { getSoulFactor } from './estimations.util';

describe('estimations.util (âmes)', (): void => {
    it('getSoulFactor applies 4 % per soul up to the 1.2 cap', (): void => {
        expect(getSoulFactor(0, 'RE')).toBe(1);
        expect(getSoulFactor(1, 'RE')).toBeCloseTo(1.04, 10);
        expect(getSoulFactor(5, 'RNE')).toBeCloseTo(1.2, 10);
        expect(getSoulFactor(9, 'RE')).toBeCloseTo(1.2, 10);
        expect(getSoulFactor(9, 'CUSTOM')).toBeCloseTo(1.2, 10);
    });

    it('getSoulFactor is uncapped (666) in a PANDE town', (): void => {
        expect(getSoulFactor(6, 'PANDE')).toBeCloseTo(1.24, 10);
    });

    it('getSoulFactor uses the reduced 2 % penalty from SPA level 2', (): void => {
        expect(getSoulFactor(1, 'RE', 0)).toBeCloseTo(1.04, 10);
        expect(getSoulFactor(1, 'RE', 1)).toBeCloseTo(1.04, 10);
        expect(getSoulFactor(1, 'RE', 2)).toBeCloseTo(1.02, 10);
        expect(getSoulFactor(1, 'RE', 3)).toBeCloseTo(1.02, 10);
        expect(getSoulFactor(50, 'RNE', 2)).toBeCloseTo(1.2, 10);
        expect(getSoulFactor(50, 'PANDE', 2)).toBeCloseTo(2, 10);
    });

    it('getSoulFactor defaults the SPA level to 0 when omitted', (): void => {
        expect(getSoulFactor(1, 'RE')).toBeCloseTo(1.04, 10);
    });
});
