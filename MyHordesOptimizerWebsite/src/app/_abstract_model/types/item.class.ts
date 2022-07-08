import { Property } from '../enum/property.enum';
import { ItemDTO } from './../dto/item.dto';
import { Recipe } from './recipe.class';
import { CommonModel, dtoToModelArray, modelToDtoArray } from './_common.class';
import { I18nLabels } from './_types';

export class Item extends CommonModel<ItemDTO> {
    public actions: string[] = [];
    public bank_count!: number;
    public category!: string;
    public deco!: number;
    public description!: I18nLabels;
    public guard!: number;
    public img!: string;
    public is_heaver!: boolean;
    public json_id_name!: string;
    public label!: I18nLabels;
    public properties: Property[] = [];
    public recipes: Recipe[] = [];
    public wishlist_count!: number;
    public xml_id!: number;
    public xml_name!: string;

    constructor(dto?: ItemDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): ItemDTO {
        return {
            actions: this.actions,
            bankCount: this.bank_count,
            category: this.category,
            deco: this.deco,
            description: this.description,
            guard: this.guard,
            img: this.img,
            isHeaver: this.is_heaver,
            jsonIdName: this.json_id_name,
            label: this.label,
            properties: this.properties.map((property: Property) => property.key),
            recipes: modelToDtoArray(this.recipes),
            wishListCount: this.wishlist_count,
            xmlId: this.xml_id,
            xmlName: this.xml_name
        }
    };

    protected dtoToModel(dto?: ItemDTO): void {
        if (dto) {
            this.actions = dto.actions;
            this.bank_count = dto.bankCount;
            this.category = dto.category;
            this.deco = dto.deco;
            this.description = dto.description;
            this.guard = dto.guard;
            this.img = dto.img ? dto.img.replace(/\..*\./, '.') : '';
            this.is_heaver = dto.isHeaver;
            this.json_id_name = dto.jsonIdName;
            this.label = dto.label;
            this.properties = dto.properties ? <Property[]>dto.properties.map((property: string) => Property.getByKey(property)) : [];
            this.recipes = dtoToModelArray(Recipe, dto.recipes);
            this.wishlist_count = dto.wishListCount;
            this.xml_id = dto.xmlId;
            this.xml_name = dto.xmlName
        }
    };

}
