import { CategoryDTO } from '../dto/category.dto';
import { CommonModel } from './_common.class';
import { I18nLabels } from './_types';

export class Category extends CommonModel<CategoryDTO> {

    public id_category!: number;
    public label!: I18nLabels;
    public name!: string;
    public ordering!: number;

    constructor(dto?: CategoryDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): CategoryDTO {
        return {
            idCategory: this.id_category,
            label: this.label,
            name: this.name,
            ordering: this.ordering
        };
    }

    protected dtoToModel(dto?: CategoryDTO): void {
        if (dto) {
            this.id_category = dto.idCategory;
            this.name = dto.name;
            this.label = dto.label;
            this.ordering = dto.ordering;
        }
    }

}
