import { Component, HostBinding, Input } from '@angular/core';
import * as moment from 'moment';
import { RecipeResultItem } from 'src/app/_abstract_model/types/recipe-result-item.class';
import { Recipe } from 'src/app/_abstract_model/types/recipe.class';
import { HORDES_IMG_REPO } from './../../../_abstract_model/const';

@Component({
    selector: 'mho-recipe',
    templateUrl: './recipe.component.html',
    styleUrls: ['./recipe.component.scss']
})
export class RecipeComponent {
    @HostBinding('style.display') display: string = 'contents';

    /** La recette à afficher */
    @Input() recipe!: Recipe;

    /** Le dossier dans lequel sont stockées les images */
    public HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public locale: string = moment.locale();

    public roundProbability(result: RecipeResultItem): number {
        return Math.round(result.probability * 10000) / 100;
    }

}

