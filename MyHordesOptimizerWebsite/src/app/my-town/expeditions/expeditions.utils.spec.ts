import { isDayEditable } from './expeditions.utils';

describe('isDayEditable', () => {
    it('locks a day strictly before the current day', () => {
        expect(isDayEditable(4, 5)).toBe(false);
    });

    it('keeps the current day editable', () => {
        expect(isDayEditable(5, 5)).toBe(true);
    });

    it('keeps future days editable', () => {
        expect(isDayEditable(6, 5)).toBe(true);
    });
});
