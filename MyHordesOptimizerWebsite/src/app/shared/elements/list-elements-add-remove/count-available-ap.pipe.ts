import { Pipe, PipeTransform } from '@angular/core';
import { Action } from '../../../_abstract_model/enum/action.enum';
import { Property } from '../../../_abstract_model/enum/property.enum';
import { StatusEnum } from '../../../_abstract_model/enum/status.enum';
import { ListForAddRemove } from '../../../_abstract_model/types/_types';
import { Item } from '../../../_abstract_model/types/item.class';


@Pipe({
    name: 'countAvailableAp',
    pure: false
})
export class CountAvailableApPipe implements PipeTransform {
    transform(list: (Item | StatusEnum)[], all_lists: ListForAddRemove[]): number {
        if (!list) return 0;
        const typed_list: Item[] = <Item[]>list;
        // TODO ajouter citizen status blessé
        const max_ap: number = 6;
        let ap: number = 0;

        let all_items: Item[] = [];
        all_lists.forEach((list_for_add_remove: ListForAddRemove) => {
            if (list_for_add_remove.list.length > all_items.length) {
                all_items = <Item[]>[...list_for_add_remove.list];
            }
        });

        let water_counted: boolean = false;
        let ap_from_eat: number = 0;
        let alcohol_counted: boolean = false;

        const list_with_complete_items: Item[] = typed_list
            .map((list_item: Item) => <Item>(all_items.find((complete_item: Item) => complete_item.id === list_item.id)));

        list_with_complete_items.forEach((item: Item) => {
            const is_water: boolean = item?.properties?.some((property: Property) => property?.key === Property.IS_WATER.key);
            if (is_water && !water_counted) {
                ap += max_ap;
                water_counted = true;
            }

            const is_food: boolean = item?.properties?.some((property: Property) => property?.key === Property.FOOD.key);
            const max_plus_one_ap_food: boolean = item.actions.some((action: Action) => action?.key === Action.EAT_7AP.key);
            const max_ap_food: boolean = item.actions.some((action: Action) => action?.key === Action.EAT_6AP.key);
            if (is_food && ap_from_eat < max_ap + 1 && (max_plus_one_ap_food || max_ap_food)) {
                if (ap_from_eat >= 0) {
                    ap -= ap_from_eat;
                }
                ap += max_plus_one_ap_food ? max_ap + 1 : max_ap;
                ap_from_eat = max_plus_one_ap_food ? max_ap + 1 : max_ap;
            }

            // TODO ajouter citizen status !== gdb
            const is_alcohol: boolean = item.actions.some((action: Action) => action?.key === Action.ALCOHOL.key);
            if (is_alcohol && !alcohol_counted) {
                ap += max_ap;
                alcohol_counted = true;
            }

            const is_6ap: boolean = item.actions.some((action: Action) => {
                return action?.key === Action.ALCOHOL_DX.key
                    || action?.key === Action.DRUG_6AP_1.key;
            });
            if (is_6ap) {
                ap += max_ap;
            }

            const is_4ap: boolean = item.actions.some((action: Action) => {
                return action?.key === Action.COFFEE.key;
            });
            if (is_4ap) {
                ap += 4;
            }

            const is_8ap: boolean = item.actions.some((action: Action) => {
                return action?.key === Action.DRUG_8AP_1.key;
            });
            if (is_8ap) {
                ap += max_ap + 2;
            }
        });
        return ap;
    }
}
