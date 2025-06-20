import { CommonModule, DecimalPipe, NgOptimizedImage } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { StandardColumn } from '../../_abstract_model/interfaces';
import { ApiService } from '../../_abstract_model/services/api.service';
import { Imports } from '../../_abstract_model/types/_types';
import { Item } from '../../_abstract_model/types/item.class';
import { RecipeResultItem } from '../../_abstract_model/types/recipe-result-item.class';
import { Recipe } from '../../_abstract_model/types/recipe.class';
import { AutoDestroy } from '../../shared/decorators/autodestroy.decorator';
import { FilterFieldComponent } from '../../shared/elements/filter-field/filter-field.component';
import { ColumnIdPipe } from '../../shared/pipes/column-id.pipe';
import { normalizeString } from '../../shared/utilities/string.utils';

const angular_common: Imports = [CommonModule, NgOptimizedImage];
const components: Imports = [FilterFieldComponent];
const pipes: Imports = [DecimalPipe, ColumnIdPipe];
const material_modules: Imports = [MatCardModule, MatSortModule, MatTableModule];

@Component({
    selector: 'mho-recipes',
    templateUrl: './recipes.component.html',
    styleUrls: ['./recipes.component.scss'],
    host: { style: 'display: contents' },
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class RecipesComponent implements OnInit {

    public recipes: Recipe[] = [];
    /** La datasource pour le tableau */
    public datasource: MatTableDataSource<Recipe> = new MatTableDataSource();

    /** Le dossier dans lequel sont stockées les images */
    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public readonly locale: string = moment.locale();

    /** La liste des colonnes */
    public readonly columns: StandardColumn[] = [
        {id: 'type', header: $localize`Type de recette`},
        {id: 'components', header: $localize`Composants`},
        {id: 'transformation', header: ''},
        {id: 'result', header: $localize`Résultat`},
    ];

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    constructor(private api: ApiService) {
    }

    ngOnInit(): void {
        this.api.getRecipes()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((recipes: Recipe[]): void => {
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
        const locale: string = moment.locale();
        return data.components.some((component: Item): boolean => normalizeString(component.label[locale]).indexOf(normalizeString(filter)) > -1)
            || data.result.some((result: RecipeResultItem): boolean => normalizeString(result.item.label[locale]).indexOf(normalizeString(filter)) > -1);
    }
}

