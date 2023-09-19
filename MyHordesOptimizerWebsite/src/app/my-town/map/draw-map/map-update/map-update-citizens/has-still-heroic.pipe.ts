import { Pipe, PipeTransform } from '@angular/core';
import { HeroicActionEnum } from '../../../../../_abstract_model/enum/heroic-action.enum';
import { HeroicActions, HeroicActionsWithValue } from '../../../../../_abstract_model/types/heroic-actions.class';


@Pipe({
    name: 'remainingHeroicAction',
})
export class HasStillHeroicPipe implements PipeTransform {
    transform(heroics: HeroicActions | undefined, cell_action: HeroicActionEnum): number {
        if (!heroics) return 0;
        const heroic_actions_with_value: HeroicActionsWithValue | undefined = heroics.content
            .find((heroic: HeroicActionsWithValue): boolean => heroic.element.key === cell_action.key);
        let remaining: number;
        if (!heroic_actions_with_value) {
            remaining = 0;
        } else if (typeof heroic_actions_with_value.value === 'boolean') {
            remaining = heroic_actions_with_value.value ? 1 : 0;
        } else {
            remaining = heroic_actions_with_value.value;
        }
        return remaining;
    }
}
