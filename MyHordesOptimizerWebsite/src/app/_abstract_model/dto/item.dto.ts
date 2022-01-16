import { I18nLabels } from '../types/_types';
import { Item } from './../types/item.class';
import { RecipeDTO, RecipeDtoTransform } from './recipe.dto';

export class ItemDtoTransform {

    public static transformDtoArray(array: ItemDTO[]): Item[] {
        return array.map((dto: ItemDTO) => this.dtoToClass(dto))
    }

    public static dtoToClass(dto: ItemDTO): Item {
        return {
            actions: dto.actions,
            bank_count: dto.bankCount,
            category: dto.category,
            deco: dto.deco,
            description: dto.description,
            guard: dto.guard,
            img: dto.img,
            is_heaver: dto.isHeaver,
            json_id_name: dto.jsonIdName,
            label: dto.label,
            properties: dto.properties,
            recipes: RecipeDtoTransform.transformDtoArray(dto.recipes),
            wishlist_count: dto.wishListCount,
            xml_id: dto.xmlId,
            xml_name: dto.xmlName
        };
    }

}

export interface ItemDTO {
    actions: string[];
    bankCount: number;
    category: string;
    deco: number;
    description: I18nLabels;
    guard: number;
    img: string;
    isHeaver: boolean;
    jsonIdName: string;
    label: I18nLabels;
    properties: string[];
    recipes: RecipeDTO[];
    wishListCount: number;
    xmlId: number;
    xmlName: string;
}
