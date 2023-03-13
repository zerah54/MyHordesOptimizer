import { Component, HostBinding, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import * as moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { AutoDestroy } from 'src/app/shared/decorators/autodestroy.decorator';
import { HORDES_IMG_REPO } from 'src/app/_abstract_model/const';
import { ApiServices } from 'src/app/_abstract_model/services/api.services';
import { Item } from 'src/app/_abstract_model/types/item.class';
import { RecipeResultItem } from 'src/app/_abstract_model/types/recipe-result-item.class';
import { Recipe } from 'src/app/_abstract_model/types/recipe.class';

@Component({
    selector: 'mho-recipes',
    templateUrl: './recipes.component.html',
    styleUrls: ['./recipes.component.scss']
})
export class RecipesComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    public recipes: Recipe[] = [];
    /** La datasource pour le tableau */
    public datasource: MatTableDataSource<Recipe> = new MatTableDataSource();

    /** Le dossier dans lequel sont stockées les images */
    public HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public readonly locale: string = moment.locale();

    /** La liste des colonnes */
    public readonly columns: RecipeColumns[] = [
        { id: 'type', header: $localize`Type de recette` },
        { id: 'components', header: $localize`Composants` },
        { id: 'transformation', header: `` },
        { id: 'result', header: $localize`Résultat` },
    ];
    /** La liste des colonnes */
    public readonly columns_ids: string[] = this.columns.map((column: RecipeColumns) => column.id);

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    constructor(private api: ApiServices) { }

    ngOnInit(): void {
        this.api.getRecipes()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((recipes: Recipe[]) => {
                this.recipes = recipes;
                this.datasource.data = [...recipes];
                this.datasource.filterPredicate = this.customFilter;
            });
    }

    /** Filtre la liste à afficher */
    public applyFilter(value: string): void {
        this.datasource.filter = value.trim().toLowerCase();
    }

    private customFilter(data: Recipe, filter: string): boolean {
        let locale: string = moment.locale();
        return data.components.some((component: Item) => component.label[locale].toLowerCase().indexOf(filter) > -1)
            || data.result.some((result: RecipeResultItem) => result.item.label[locale].toLowerCase().indexOf(filter) > -1)
    }
}

interface RecipeColumns {
    header: string;
    id: string;
}
