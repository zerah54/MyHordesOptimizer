import { CommonModule, DecimalPipe, NgOptimizedImage } from '@angular/common';
import { Component, input, InputSignal } from '@angular/core';
import moment from 'moment';
import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { Imports } from '../../../_abstract_model/types/_types';
import { Recipe } from '../../../_abstract_model/types/recipe.class';

const angular_common: Imports = [CommonModule, NgOptimizedImage];
const components: Imports = [];
const pipes: Imports = [DecimalPipe];
const material_modules: Imports = [];

@Component({
    selector: 'mho-recipe',
    templateUrl: './recipe.component.html',
    styleUrls: ['./recipe.component.scss'],
    host: { style: 'display: contents' },
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class RecipeComponent {

    /** La recette à afficher */
    public recipe: InputSignal<Recipe> = input.required();

    /** Le dossier dans lequel sont stockées les images */
    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public readonly locale: string = moment.locale();

}

