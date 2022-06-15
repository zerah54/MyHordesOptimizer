import { ApiServices } from 'src/app/_abstract_model/services/api.services';
import { Component, OnInit } from '@angular/core';
import { Recipe } from 'src/app/_abstract_model/types/recipe.class';

@Component({
    selector: 'mho-recipes',
    templateUrl: './recipes.component.html',
    styleUrls: ['./recipes.component.scss']
})
export class RecipesComponent implements OnInit {

    private recipes: Recipe[] = [];

    constructor(private api: ApiServices) {}

    ngOnInit(): void {
    this.api.getRecipes().subscribe((recipes: Recipe[]) => {
        console.log('recipes', recipes);
        this.recipes = recipes;
    });
}
}
