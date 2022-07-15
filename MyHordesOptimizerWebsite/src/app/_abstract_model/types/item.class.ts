import { Action } from '../enum/action.enum';
import { Property } from '../enum/property.enum';
import { ItemDTO } from './../dto/item.dto';
import { Category } from './category.class';
import { Recipe } from './recipe.class';
import { CommonModel, dtoToModelArray, modelToDtoArray } from './_common.class';
import { I18nLabels } from './_types';

export class Item extends CommonModel<ItemDTO> {
    public uid!: string;
    public img!: string;
    public label!: I18nLabels;
    public description!: I18nLabels;
    public id!: number;
    public category!: Category;
    public deco!: number;
    public is_heaver!: boolean;
    public guard!: number;
    public properties: Property[] = [];
    public actions: Action[] = [];
    public recipes: Recipe[] = [];
    public bank_count!: number;
    public wishlist_count!: number;

    constructor(dto?: ItemDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): ItemDTO {
        return {
            actions: this.actions.map((action: Action) => action.key),
            bankCount: this.bank_count,
            category: this.category.modelToDto(),
            deco: this.deco,
            description: this.description,
            guard: this.guard,
            img: this.img,
            isHeaver: this.is_heaver,
            label: this.label,
            properties: this.properties.map((property: Property) => property.key),
            recipes: modelToDtoArray(this.recipes),
            wishListCount: this.wishlist_count,
            id: this.id,
            uid: this.uid
        };
    }

    protected dtoToModel(dto?: ItemDTO): void {
        if (dto) {
            this.actions = dto.actions ? <Action[]>dto.actions.map((action: string) => Action.getByKey(action)) : [];
            this.bank_count = dto.bankCount;
            this.category = new Category(dto.category);
            this.deco = dto.deco;
            this.description = dto.description;
            this.guard = dto.guard;
            this.img = dto.img ? dto.img.replace(/\..*\./, '.') : '';
            this.is_heaver = dto.isHeaver;
            this.label = dto.label;
            this.properties = dto.properties ? <Property[]>dto.properties.map((property: string) => Property.getByKey(property)) : [];
            this.recipes = dtoToModelArray(Recipe, dto.recipes);
            this.wishlist_count = dto.wishListCount;
            this.uid = dto.uid;
            this.id = dto.id;
        }
    };

}
