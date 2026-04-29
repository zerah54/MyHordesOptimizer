import { ItemCountDTO } from '../dto/item-count.dto';
import { ItemDTO } from '../dto/item.dto';
import { RecipeDTO } from '../dto/recipe.dto';
import { CommonModel, dtoToModelArray, modelToDtoArray } from './_common.class';
import { I18nLabels } from './_types';
import { ItemCount } from './item-count.class';
import { Item } from './item.class';
import { RecipeResultItem } from './recipe-result-item.class';

export class Recipe extends CommonModel<RecipeDTO> {
    public actions!: I18nLabels;
    public components!: Item[];
    public name!: string;
    public result!: RecipeResultItem[];
    public type!: 'WORKSHOP' | 'MANUAL_ANYWHERE' | 'WORKSHOP_SHAMAN';
    public stealthy?: boolean;
    public provoking?: Item;

    constructor(dto?: RecipeDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): RecipeDTO {
        return {
            actions: this.actions,
            components: modelToDtoArray(this.components.map((component: Item) => {
                return new ItemCount({item: component.modelToDto(), count: 1, isBroken: false});
            })),
            name: this.name,
            result: modelToDtoArray(this.result),
            type: this.type,
            stealthy: this.stealthy,
            provoking: this.provoking?.modelToDto()
        };
    }

    protected dtoToModel(dto?: RecipeDTO | null): void {
        if (dto) {
            const complete_component_list: ItemDTO[] = [];
            dto?.components
                .forEach((component: ItemCountDTO) => {
                    for (let i = 0; i < component.count; i++) {
                        complete_component_list.push(component.item);
                    }
                });

            this.actions = dto.actions;
            this.components = dtoToModelArray(Item, complete_component_list);
            this.name = dto.name;
            this.result = dtoToModelArray(RecipeResultItem, dto.result);
            this.type = dto.type;
            this.stealthy = dto.stealthy;
            this.provoking = dto.provoking ? new Item(dto.provoking) : undefined;
        }
    }

}
