
import { Pipe, PipeTransform } from '@angular/core';
import { HeroicActionEnum } from 'src/app/_abstract_model/enum/heroic-action.enum';
import { HeroicActions, HeroicActionsWithValue } from 'src/app/_abstract_model/types/heroic-actions.class';


@Pipe({
    name: 'hasStillHeroic',
})
export class HasStillHeroicPipe implements PipeTransform {
    transform(heroics: HeroicActions, cell_action: HeroicActionEnum): number {
        return heroics.content.find((heroic: HeroicActionsWithValue) => heroic.element.key === cell_action.key)?.value || 0;
    }
}
