import { Pipe, PipeTransform } from '@angular/core';

import { DailyAction } from '../../_abstract_model/types/daily-action.class';

@Pipe({
    name: 'dailyActionForDay'
})
export class DailyActionForDayPipe implements PipeTransform {
    public transform(actions: DailyAction[], day: number, actionKey: string): DailyAction | undefined {
        if (!actions || actions.length === 0) return undefined;
        return actions.find((action: DailyAction) => action.day === day && action.action_key === actionKey && action.update_info);
    }
}
