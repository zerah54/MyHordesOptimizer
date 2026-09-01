import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { Item } from '../../_abstract_model/types/item.class';
import { Recipe } from '../../_abstract_model/types/recipe.class';
import { RecipeResultItem } from '../../_abstract_model/types/recipe-result-item.class';
import { RecipeComponent } from './recipe.component';

describe('RecipeComponent', (): void => {
    let fixture: ComponentFixture<RecipeComponent>;
    let locale: string;

    function createItem(id: number, labelText: string): Item {
        const item = new Item();
        item.id = id;
        item.uid = `item_${id}`;
        item.img = `item/item_${id}.gif`;
        item.label = { [locale]: labelText } as never;
        return item;
    }

    function createResult(item: Item, probability: number): RecipeResultItem {
        const result = new RecipeResultItem();
        result.item = item;
        result.probability = probability;
        return result;
    }

    function createRecipe(overrides: Partial<Recipe>): Recipe {
        const recipe = new Recipe();
        recipe.components = overrides.components ?? [];
        recipe.result = overrides.result ?? [];
        recipe.provoking = overrides.provoking;
        return recipe;
    }

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [RecipeComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(RecipeComponent);
        locale = (fixture.componentInstance as unknown as { locale: string }).locale;
    });

    it('renders one component entry (icon + label) per item of recipe().components', (): void => {
        const wood = createItem(1, 'Bois');
        const nail = createItem(2, 'Clou');
        fixture.componentRef.setInput('recipe', createRecipe({ components: [wood, nail] }));
        fixture.detectChanges();

        const items: HTMLLIElement[] = fixture.debugElement.queryAll(By.css('.components li')).map((debugElement) => debugElement.nativeElement);
        expect(items.length).toBe(2);
        expect(items[0].querySelector('img')?.src).toContain(HORDES_IMG_REPO + wood.img);
        expect(items[0].textContent).toContain('Bois');
        expect(items[1].textContent).toContain('Clou');
    });

    it('marks the component matching recipe().provoking with the provoking class', (): void => {
        const wood = createItem(1, 'Bois');
        const nail = createItem(2, 'Clou');
        fixture.componentRef.setInput('recipe', createRecipe({ components: [wood, nail], provoking: nail }));
        fixture.detectChanges();

        const items: HTMLLIElement[] = fixture.debugElement.queryAll(By.css('.components li')).map((debugElement) => debugElement.nativeElement);
        expect(items[0].classList.contains('provoking')).toBeFalse();
        expect(items[1].classList.contains('provoking')).toBeTrue();
    });

    it('marks no component as provoking when recipe().provoking is undefined', (): void => {
        fixture.componentRef.setInput('recipe', createRecipe({ components: [createItem(1, 'Bois')] }));
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('.components li.provoking'))).toBeNull();
    });

    it('always renders the transformation arrow icon', (): void => {
        fixture.componentRef.setInput('recipe', createRecipe({}));
        fixture.detectChanges();

        const img: HTMLImageElement = fixture.debugElement.query(By.css('.transformation img')).nativeElement;
        expect(img.src).toContain(HORDES_IMG_REPO + 'icons/small_move.gif');
    });

    it('renders one result entry (icon + label) per item of recipe().result', (): void => {
        const plank = createItem(3, 'Planche');
        fixture.componentRef.setInput('recipe', createRecipe({ result: [createResult(plank, 1)] }));
        fixture.detectChanges();

        const result: HTMLLIElement = fixture.debugElement.query(By.css('.results li')).nativeElement;
        expect(result.querySelector('img')?.src).toContain(HORDES_IMG_REPO + plank.img);
        expect(result.textContent).toContain('Planche');
    });

    it('hides the probability percentage when probability is 1', (): void => {
        const plank = createItem(3, 'Planche');
        fixture.componentRef.setInput('recipe', createRecipe({ result: [createResult(plank, 1)] }));
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('.results li small'))).toBeNull();
    });

    it('shows the probability as a percentage when probability is not 1', (): void => {
        const plank = createItem(3, 'Planche');
        fixture.componentRef.setInput('recipe', createRecipe({ result: [createResult(plank, 0.5)] }));
        fixture.detectChanges();

        const small: HTMLElement = fixture.debugElement.query(By.css('.results li small')).nativeElement;
        expect(small.textContent).toContain('50');
        expect(small.textContent).toContain('%');
    });

    it('renders several results independently, each with its own probability display', (): void => {
        const plank = createItem(3, 'Planche');
        const nail = createItem(4, 'Clou tordu');
        fixture.componentRef.setInput('recipe', createRecipe({ result: [createResult(plank, 1), createResult(nail, 0.25)] }));
        fixture.detectChanges();

        const results: HTMLLIElement[] = fixture.debugElement.queryAll(By.css('.results li')).map((debugElement) => debugElement.nativeElement);
        expect(results.length).toBe(2);
        expect(results[0].querySelector('small')).toBeNull();
        expect(results[1].querySelector('small')?.textContent).toContain('25');
    });
});
