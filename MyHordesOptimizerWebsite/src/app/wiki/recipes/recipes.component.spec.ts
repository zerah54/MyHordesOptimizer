import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import moment from 'moment';
import { Subject } from 'rxjs';

import { ApiService } from '../../_abstract_model/services/api.service';
import { Item } from '../../_abstract_model/types/item.class';
import { Recipe } from '../../_abstract_model/types/recipe.class';
import { RecipeResultItem } from '../../_abstract_model/types/recipe-result-item.class';
import { RecipesComponent } from './recipes.component';

describe('RecipesComponent', (): void => {
    let fixture: ComponentFixture<RecipesComponent>;
    let component: RecipesComponent;
    let recipes_subject: Subject<Recipe[]>;

    function makeItem(id: number, label: string): Item {
        const item: Item = new Item();
        item.id = id;
        item.label = { [moment.locale()]: label };
        item.img = 'item.gif';
        return item;
    }

    function makeRecipe(component_label: string, result_label: string): Recipe {
        const recipe: Recipe = new Recipe();
        recipe.type = 'Recipe::ManualAnywhere';
        recipe.components = [makeItem(1, component_label)];
        const result_item: RecipeResultItem = new RecipeResultItem();
        result_item.item = makeItem(2, result_label);
        result_item.probability = 1;
        recipe.result = [result_item];
        return recipe;
    }

    beforeEach(async (): Promise<void> => {
        recipes_subject = new Subject<Recipe[]>();
        await TestBed.configureTestingModule({
            imports: [RecipesComponent],
            providers: [{ provide: ApiService, useValue: { getRecipes: (): unknown => recipes_subject.asObservable() } }]
        }).compileComponents();

        fixture = TestBed.createComponent(RecipesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('renders an empty table until the recipes have arrived', (): void => {
        // `recipes` démarre à `[]` (truthy), donc @if(recipes) affiche déjà le tableau, vide.
        expect(fixture.debugElement.query(By.css('table'))).not.toBeNull();
        expect(fixture.debugElement.queryAll(By.css('tr[mat-row]')).length).toBe(0);
    });

    it('renders one row per recipe once the API responds', (): void => {
        recipes_subject.next([makeRecipe('Bois', 'Planche'), makeRecipe('Fer', 'Clou')]);
        fixture.detectChanges();

        const rows = fixture.debugElement.queryAll(By.css('tr[mat-row]'));
        expect(rows.length).toBe(2);
        expect(fixture.debugElement.nativeElement.textContent).toContain('Planche');
        expect(fixture.debugElement.nativeElement.textContent).toContain('Clou');
    });

    it('applyFilter narrows the table to recipes whose component or result matches', (): void => {
        recipes_subject.next([makeRecipe('Bois', 'Planche'), makeRecipe('Fer', 'Clou')]);
        fixture.detectChanges();

        component['applyFilter']('clou');
        fixture.detectChanges();

        const rows = fixture.debugElement.queryAll(By.css('tr[mat-row]'));
        expect(rows.length).toBe(1);
        expect(fixture.debugElement.nativeElement.textContent).toContain('Clou');
        expect(fixture.debugElement.nativeElement.textContent).not.toContain('Planche');
    });
});
