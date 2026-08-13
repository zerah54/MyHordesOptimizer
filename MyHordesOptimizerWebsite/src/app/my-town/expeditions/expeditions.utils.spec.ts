import { isDayEditable } from './expeditions.utils';

describe('isDayEditable', () => {
    it('locks a day strictly before the current day', () => {
        expect(isDayEditable(4, 5)).toBeFalse();
    });

    it('keeps the current day editable', () => {
        expect(isDayEditable(5, 5)).toBeTrue();
    });

    it('keeps future days editable', () => {
        expect(isDayEditable(6, 5)).toBeTrue();
    });
});
