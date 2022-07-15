import { I18nLabels } from "../types/_types";

export interface CategoryDTO {
    idCategory: number;
    name: string;
    label: I18nLabels
    ordering: number;
}
