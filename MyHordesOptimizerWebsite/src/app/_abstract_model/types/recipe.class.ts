import { Item } from './item.class';
import { RecipeResultItem } from './recipe-result-item.class';
import { I18nLabels } from './_types';
import { CommonModel, dtoToModelArray, modelToDtoArray } from './_common.class';
import { RecipeDTO } from '../dto/recipe.dto';
import { ItemDTO } from '../dto/item.dto';
import { ItemCountDTO } from '../dto/item-count.dto';
import { ItemCount } from './item-count.class';

export class Recipe extends CommonModel<RecipeDTO> {
    public actions!: I18nLabels;
    public components!: Item[];
    public is_shaman_only!: boolean;
    public name!: string;
    public result!: RecipeResultItem[];
    public type!: 'WORKSHOP' | 'MANUAL_ANYWHERE' | 'WORKSHOP_SHAMAN';

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
            type: this.type
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
        }
    }

}
