import { CitizenExpeditionBagDTO, CitizenExpeditionBagShortDTO } from '../dto/citizen-expedition-bag.dto';
import { ItemCountShortDTO } from '../dto/item-count-short.dto';
import { ItemCountDTO } from '../dto/item-count.dto';
import { CommonModel } from './_common.class';
import { Item } from './item.class';

export class CitizenExpeditionBag extends CommonModel<CitizenExpeditionBagDTO> {
    public bag_id!: number;
    public items: Item[] = [];


    constructor(dto?: CitizenExpeditionBagDTO) {
        super();
        this.dtoToModel(dto);
    }

    public override modelToDto(): CitizenExpeditionBagDTO {
        return {
            id: this.bag_id,
            items: this.toShortItemCountList(),
        };
    }

    public modelToDtoShort(): CitizenExpeditionBagShortDTO {
        return {
            id: this.bag_id,
            items: this.toShortItemCountListShort(),
        };
    }

    public toShortItemCountList(): ItemCountDTO[] {
        const short_items_count: ItemCountDTO[] = [];
        this.items?.forEach((item: Item) => {
            const item_in_existing_list: ItemCountDTO | undefined = short_items_count.find((short_item_count: ItemCountDTO) => {
                return short_item_count.item.id === item.id && short_item_count.isBroken === item.is_broken;
            });
            if (item_in_existing_list) {
                item_in_existing_list.count += 1;
            } else {
                short_items_count.push({
                    count: 1,
                    item: item.modelToDto(),
                    isBroken: !!item.is_broken
                });
            }
        });
        return short_items_count;
    }

    public toShortItemCountListShort(): ItemCountShortDTO[] {
        const short_items_count: ItemCountShortDTO[] = [];
        this.items?.forEach((item: Item) => {
            const item_in_existing_list: ItemCountShortDTO | undefined = short_items_count.find((short_item_count: ItemCountShortDTO) => {
                return short_item_count.id === item.id && ((short_item_count.isBroken && item.is_broken) || (!short_item_count.isBroken && !item.is_broken));
            });
            if (item_in_existing_list) {
                item_in_existing_list.count += 1;
            } else {
                short_items_count.push({
                    count: 1,
                    id: item.id,
                    isBroken: !!item.is_broken
                });
            }
        });
        return short_items_count;
    }


    protected override dtoToModel(dto?: CitizenExpeditionBagDTO): void {
        if (dto) {
            this.bag_id = dto.id;
            this.items = [];
            dto.items.forEach((item_count: ItemCountDTO) => {
                for (let i: number = 0; i < item_count.count; i++) {
                    const item: Item = new Item(item_count.item);
                    item.is_broken = item_count.isBroken;
                    this.items.push(item);
                }
            });
        }
    }

}
