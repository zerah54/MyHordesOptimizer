import { Pipe, PipeTransform } from '@angular/core';
import { StatusEnum } from '../../../_abstract_model/enum/status.enum';
import { Item } from '../../../_abstract_model/types/item.class';


@Pipe({
    name: 'isItems',
    standalone: true
})
export class IsItemsPipe implements PipeTransform {
    transform(list: (Item | StatusEnum)[]): boolean {
        if (!list) return false;

        return list.some((element: Item | StatusEnum) => element instanceof Item);
    }
}
