import { DailyActionEnum } from '../../../_abstract_model/enum/daily-action.enum';
import { actionAllowedFor } from './task-edit.util';

describe('task-edit.util', (): void => {
    describe('actionAllowedFor', (): void => {
        it('Fouiller les déchets : réservé aux bannis, ou à tous en chaos', (): void => {
            expect(actionAllowedFor(DailyActionEnum.TRASH, false, false)).toBe(false);
            expect(actionAllowedFor(DailyActionEnum.TRASH, true, false)).toBe(true);
            expect(actionAllowedFor(DailyActionEnum.TRASH, false, true)).toBe(true);
        });

        it('les autres actions restent permises à tous', (): void => {
            expect(actionAllowedFor(DailyActionEnum.HOME_SCAVENGE, false, false)).toBe(true);
        });
    });
});
