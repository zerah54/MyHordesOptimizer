import { Component, HostBinding, Input } from '@angular/core';
import * as moment from 'moment';
import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { Recipe } from '../../../_abstract_model/types/recipe.class';

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
    public readonly locale: string = moment.locale();

}

