import { HttpRequest, provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecipeType } from '../../_abstract_model/dto/recipe.dto';
import { Action } from '../../_abstract_model/enum/action.enum';
import { Property } from '../../_abstract_model/enum/property.enum';
import { CatapultEffect } from '../../_abstract_model/types/catapult-effect.class';
import { Item } from '../../_abstract_model/types/item.class';
import { ActionOutcome, BuildingCondition, ChargeChance, ItemActionEffects } from '../../_abstract_model/types/item-action-effects.class';
import { ItemSummary } from '../../_abstract_model/types/item-summary.class';
import { Recipe } from '../../_abstract_model/types/recipe.class';
import { RecipeResultItem } from '../../_abstract_model/types/recipe-result-item.class';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { SnackbarService } from '../../_core/services/snackbar.service';
import { ItemComponent } from './item.component';

describe('ItemComponent — effet catapulte', () => {
    let fixture: ComponentFixture<ItemComponent>;
    let component: ItemComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ItemComponent],
            providers: [provideHttpClient(withXhr()), provideHttpClientTesting()]
        }).compileComponents();
        fixture = TestBed.createComponent(ItemComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('forceOpen', true);
    });

    function withCatapultEffect(overrides: Partial<CatapultEffect>): Item {
        const item = new Item();
        item.label = { fr: 'Bois' } as never;
        item.description = { fr: '' } as never;
        item.properties = [];
        item.actions = [];
        item.recipes = [];
        item.opens = [];
        item.opened_with = null;
        item.bank_count = 0;
        item.drop_rate_praf = 0;
        item.drop_rate_not_praf = 0;
        const effect = new CatapultEffect();
        Object.assign(effect, overrides);
        item.catapult_effect = effect;
        return item;
    }

    it('affiche l\'icône catapulte et la flèche', () => {
        component.item.set(withCatapultEffect({ fate: 'Broken' }));
        fixture.detectChanges();

        const images: NodeListOf<HTMLImageElement> = fixture.nativeElement.querySelectorAll('.catapult-effect img');
        expect(images[0].src).toContain('roles/cata.gif');
        expect(images[1].src).toContain('emotes/arrowright.gif');
    });

    it('affiche l\'objet transformé (icône + title), sans bordure cassée', () => {
        const locale: string = (component as unknown as {
            locale: string;
        }).locale;
        const morph_target = new ItemSummary();
        morph_target.uid = 'metal_bad_#00';
        morph_target.img = 'item/item_metal_bad.gif';
        morph_target.label = { [locale]: 'Mauvais métal' } as never;

        component.item.set(withCatapultEffect({ fate: 'Transformed', morph_target }));
        fixture.detectChanges();

        const result: HTMLImageElement | null = fixture.nativeElement.querySelector('.catapult-result img');
        expect(result).toBeTruthy();
        expect(result?.title).toBe('Mauvais métal');
        expect(fixture.nativeElement.querySelector('.catapult-result.broken')).toBeNull();
    });

    it('applique le cadre "objet cassé" (bordure rouge) pour un objet qui devient cassé', () => {
        component.item.set(withCatapultEffect({ fate: 'Broken' }));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.catapult-result.broken')).toBeTruthy();
    });

    it('n\'affiche aucun objet obtenu pour un objet détruit', () => {
        component.item.set(withCatapultEffect({ fate: 'Destroyed', kill_min: 0, kill_max: 3, radius: 'Target' }));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.catapult-result')).toBeNull();
    });

    it('n\'affiche rien pour un objet intact sans effet de zone', () => {
        component.item.set(withCatapultEffect({ fate: 'Intact' }));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.catapult-effect')).toBeNull();
    });

    it('affiche l\'icône zombie avec la plage de kills, et le rayon à côté', () => {
        component.item.set(withCatapultEffect({ fate: 'Destroyed', kill_min: 11, kill_max: 20, radius: 'Cross' }));
        fixture.detectChanges();

        const zombie_icon: Element | null = fixture.nativeElement.querySelector('img[src*="icons/small_zombie.gif"]');
        expect(zombie_icon).toBeTruthy();
        expect(fixture.nativeElement.textContent).toContain('11-20');
    });

    it('affiche la répulsion en minutes sans icône zombie', () => {
        component.item.set(withCatapultEffect({ fate: 'Destroyed', repel_seconds: 300, radius: 'Cross' }));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('img[src*="icons/small_zombie.gif"]')).toBeNull();
        expect(fixture.nativeElement.textContent).toContain('5');
    });
});

describe('ItemComponent — ajout à la liste de souhaits', () => {
    let fixture: ComponentFixture<ItemComponent>;
    let component: ItemComponent;
    let httpMock: HttpTestingController;

    function makeWishlistItem(overrides: Partial<Item> = {}): Item {
        const item: Item = new Item();
        item.uid = 'wood';
        item.img = 'item/item_wood.gif';
        item.img_broken = null;
        item.label = { fr: 'Bois' } as never;
        item.is_broken = false;
        item.bank_count = 0;
        item.wishlist_count = 0;
        item.id = 5;
        Object.assign(item, overrides);
        return item;
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ItemComponent],
            providers: [provideHttpClient(withXhr()), provideHttpClientTesting()]
        }).compileComponents();

        fixture = TestBed.createComponent(ItemComponent);
        component = fixture.componentInstance;
        httpMock = TestBed.inject(HttpTestingController);
        // Le snackbar réel nécessite un provider d'animations non fourni ici — hors périmètre de ce composant.
        vi.spyOn(TestBed.inject(SnackbarService), 'successSnackbar');
        (component as unknown as {
            town: TownDetails | null;
        }).town = { town_id: 12 } as unknown as TownDetails;
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('affiche le bouton d\'ajout tant que l\'objet n\'est pas dans la liste de souhaits', () => {
        component.item.set(makeWishlistItem());
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.add_to_wishlist button')).toBeTruthy();
    });

    it('masque le bouton d\'ajout et met à jour le compteur après un ajout réussi', () => {
        component.item.set(makeWishlistItem());
        fixture.detectChanges();

        const add_button: HTMLButtonElement = fixture.nativeElement.querySelector('.add_to_wishlist button');
        add_button.click();

        const req: TestRequest = httpMock.expectOne((r: HttpRequest<unknown>) => r.urlWithParams.includes('/wishlist/add/5'));
        req.flush(null);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.add_to_wishlist')).toBeNull();
        expect(component.item().wishlist_count).toBe(1);
    });

    it('colle la mention « Cassé » à ses parenthèses', () => {
        component.item.set(makeWishlistItem({ is_broken: true }));
        fixture.detectChanges();

        const label: string = (fixture.nativeElement.querySelector('.item_label')?.textContent ?? '').replace(/\s+/g, ' ');
        expect(label).toContain('(Cassé)');
    });

    it('mute l\'objet original en place (synchronisation avec le tableau canonique du parent) tout en notifiant le signal via une nouvelle référence', () => {
        const original_item: Item = makeWishlistItem();
        component.item.set(original_item);
        fixture.detectChanges();

        const add_button: HTMLButtonElement = fixture.nativeElement.querySelector('.add_to_wishlist button');
        add_button.click();

        const req: TestRequest = httpMock.expectOne((r: HttpRequest<unknown>) => r.urlWithParams.includes('/wishlist/add/5'));
        req.flush(null);

        // Preuve de la mutation en place : la référence externe (celle que le parent conserve dans
        // son tableau canonique, ex. `bank.component.ts`/`items.component.ts`) reflète déjà le nouveau
        // compteur, sans être passée par le signal.
        expect(original_item.wishlist_count).toBe(1);
        // Preuve de la notification OnPush : le signal expose bien une référence DIFFÉRENTE de
        // l'originale (un `.set()` sur la même référence n'aurait notifié aucun consommateur).
        expect(component.item()).not.toBe(original_item);
    });
});

describe('ItemComponent — fréquence en fouille', () => {
    let fixture: ComponentFixture<ItemComponent>;
    let component: ItemComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ItemComponent],
            providers: [provideHttpClient(withXhr()), provideHttpClientTesting()]
        }).compileComponents();
        fixture = TestBed.createComponent(ItemComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('forceOpen', true);
    });

    function renderDigFigure(drop_rate_not_praf: number, drop_rate_praf: number): { numbers: string[]; text: string } {
        const item: Item = new Item();
        item.label = { fr: 'Souche' } as never;
        item.description = { fr: '' } as never;
        item.properties = [];
        item.actions = [];
        item.recipes = [];
        item.opens = [];
        item.opened_with = null;
        item.drop_rate_not_praf = drop_rate_not_praf;
        item.drop_rate_praf = drop_rate_praf;
        component.item.set(item);
        fixture.detectChanges();

        const figure: HTMLElement = fixture.nativeElement.querySelector('.dig-figure');
        return {
            numbers: Array.from(figure.querySelectorAll('strong')).map((strong: Element): string => (strong.textContent ?? '').trim()),
            text: figure.textContent ?? ''
        };
    }

    it('exprime une forte probabilité en fraction plutôt qu\'en « 1 sur N » arrondi (souche praf : 20/32)', () => {
        const figure: { numbers: string[]; text: string } = renderDigFigure(0, 0.625);

        expect(figure.numbers).toEqual(['5', '8']);
        expect(figure.text).toContain('fouilles réussies sur');
    });

    it('exprime le débris praf (12/32) en 3 sur 8', () => {
        expect(renderDigFigure(0, 0.375).numbers).toEqual(['3', '8']);
    });

    it('garde « 1 sur N » pour un objet moins courant', () => {
        const figure: { numbers: string[]; text: string } = renderDigFigure(0.156, 0);

        expect(figure.numbers).toEqual(['6']);
        expect(figure.text).toContain('1 fouille réussie sur');
    });
});

describe('ItemComponent — libellé des propriétés', () => {
    it('affiche le libellé d\'une propriété sans icône', async () => {
        await TestBed.configureTestingModule({
            imports: [ItemComponent],
            providers: [provideHttpClient(withXhr()), provideHttpClientTesting()]
        }).compileComponents();
        const fixture: ComponentFixture<ItemComponent> = TestBed.createComponent(ItemComponent);
        fixture.componentRef.setInput('forceOpen', true);
        const item: Item = new Item();
        item.label = { fr: 'Poulet' } as never;
        item.description = { fr: '' } as never;
        item.properties = [Property.CAN_COOK];
        item.actions = [];
        item.recipes = [];
        item.opens = [];
        item.opened_with = null;
        fixture.componentInstance.item.set(item);
        fixture.detectChanges();

        const advanced: HTMLElement = fixture.nativeElement.querySelector('.advanced-part');
        expect(advanced.textContent).toContain('Peut être cuisiné');
    });
});

describe('ItemComponent — fiche enrichie', () => {
    let fixture: ComponentFixture<ItemComponent>;
    let component: ItemComponent;
    const locale: string = 'fr';

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ItemComponent],
            providers: [provideHttpClient(withXhr()), provideHttpClientTesting()]
        }).compileComponents();
        fixture = TestBed.createComponent(ItemComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('forceOpen', true);
    });

    /** Construit un objet minimal. */
    function makeItem(overrides: Partial<Item> = {}): Item {
        const item: Item = new Item();
        item.uid = 'x';
        item.img = 'item/item_x.gif';
        item.label = { fr: 'Objet' } as never;
        item.description = { fr: '' } as never;
        item.properties = [];
        item.actions = [];
        item.recipes = [];
        item.opens = [];
        item.opened_with = null;
        item.bank_count = 0;
        item.drop_rate_praf = 0;
        item.drop_rate_not_praf = 0;
        return Object.assign(item, overrides);
    }

    /** Construit un résumé d'objet. */
    function makeSummary(uid: string): ItemSummary {
        const summary: ItemSummary = new ItemSummary();
        summary.uid = uid;
        summary.img = `item/item_${uid}.gif`;
        summary.label = { [locale]: uid } as never;
        return summary;
    }

    /** Construit une issue. */
    function makeOutcome(overrides: Partial<ActionOutcome>): ActionOutcome {
        return Object.assign(new ActionOutcome(), { probability: 1, ...overrides });
    }

    /** Construit une action. */
    function makeEffects(overrides: Partial<ItemActionEffects>): ItemActionEffects {
        return Object.assign(new ItemActionEffects(), { action_name: 'a', outcomes: [], ...overrides });
    }

    /** Affiche l'objet et rend le texte normalisé de la partie avancée. */
    function render(item: Item): HTMLElement {
        component.item.set(item);
        fixture.detectChanges();
        return fixture.nativeElement.querySelector('.advanced-part');
    }

    it('affiche le contenu d\'une ouverture avec ses probabilités', () => {
        const advanced: HTMLElement = render(makeItem({
            action_effects: [makeEffects({
                kind: 'Open',
                outcomes: [
                    makeOutcome({ kind: 'Produced', item: makeSummary('wood'), quantity: 2, probability: 0.25 }),
                    makeOutcome({ kind: 'Consumed', probability: 1 })
                ]
            })]
        }));

        const text: string = (advanced.textContent ?? '').replace(/\s+/g, ' ');
        expect(text).toContain('Ouvrir');
        expect(text).toContain('2');
        expect(text).toContain('25 %');
        expect(advanced.querySelector('.action-effect img[src*="item/item_wood.gif"]')).toBeTruthy();
        expect(advanced.querySelector('.action-effect .outcome.consumed')).toBeNull();
    });

    it('n\'affiche pas le coût en PA d\'Ouvrir, déjà porté par la ligne d\'ouverture du coffre', () => {
        const advanced: HTMLElement = render(makeItem({
            action_effects: [makeEffects({ kind: 'Open', ap_cost: 1, outcomes: [makeOutcome({ kind: 'Produced', item: makeSummary('wood'), quantity: 1 })] })]
        }));

        expect(advanced.querySelector('.action-effect mho-icon-ap')).toBeNull();
    });

    it('affiche zombies tués et chance de casser', () => {
        const advanced: HTMLElement = render(makeItem({
            action_effects: [makeEffects({
                kind: 'Attack',
                outcomes: [
                    makeOutcome({ kind: 'Kill', kill_min: 2, kill_max: 4, probability: 1 }),
                    makeOutcome({ kind: 'Broken', probability: 0.3 })
                ]
            })]
        }));

        expect(advanced.querySelector('.action-effect img[src*="icons/small_zombie.gif"]')).toBeTruthy();
        expect(advanced.textContent).toContain('2-4');
        expect(advanced.querySelector('.action-effect .outcome.broken')?.textContent).toContain('30 %');
    });

    it('affiche « tous les zombies » pour une issue Kill sans bornes', () => {
        const advanced: HTMLElement = render(makeItem({
            action_effects: [makeEffects({ kind: 'Attack', outcomes: [makeOutcome({ kind: 'Kill', kill_min: null, kill_max: null, probability: 0.5 })] })]
        }));

        const text: string = (advanced.textContent ?? '').replace(/\s+/g, ' ');
        expect(text).toContain('tous les zombies');
        expect(text).not.toContain('null');
    });

    it('affiche une seule valeur quand kill_min === kill_max', () => {
        const advanced: HTMLElement = render(makeItem({
            action_effects: [makeEffects({ kind: 'Attack', outcomes: [makeOutcome({ kind: 'Kill', kill_min: 1, kill_max: 1 })] })]
        }));

        const kill: string = (advanced.querySelector('.action-effect .outcome.kill')?.textContent ?? '').replace(/\s+/g, ' ').trim();
        expect(kill).toBe('1');
    });

    it('affiche le bonus de survie en veille', () => {
        const advanced: HTMLElement = render(makeItem({ watch_impact: 5, properties: [Property.NW_IMPACT_CUMUL] }));

        const text: string = (advanced.querySelector('.watch-impact')?.textContent ?? '').replace(/\s+/g, ' ');
        expect(text).toContain('Chances de survie en veille');
        expect(text).toContain('+5 %');
        expect(text).toContain('(cumulable)');
    });

    it('affiche les charges du pointeur laser', () => {
        const advanced: HTMLElement = render(makeItem({
            reload_charges: [
                Object.assign(new ChargeChance(), { charges: 4, probability: 0.5 }),
                Object.assign(new ChargeChance(), { charges: 3, probability: 0.25 }),
                Object.assign(new ChargeChance(), { charges: 2, probability: 0.25 })
            ]
        }));

        const text: string = (advanced.querySelector('.reload-charges')?.textContent ?? '').replace(/\s+/g, ' ');
        expect(text).toContain('2 à 4');
        expect(text).toContain('4 : 50 %');
        expect(text).toContain('2 : 25 %');
    });

    it('met en retrait la variante qui ne s\'applique pas à la ville', () => {
        const advanced: HTMLElement = render(makeItem({
            action_effects: [
                makeEffects({ kind: 'Slaughter', applies_to_town: true, building_condition: Object.assign(new BuildingCondition(), { building_uid: 'b', built: true }) }),
                makeEffects({ kind: 'Slaughter', applies_to_town: false, building_condition: Object.assign(new BuildingCondition(), { building_uid: 'b', built: false }) })
            ]
        }));

        const entries: NodeListOf<HTMLElement> = advanced.querySelectorAll('.action-effect');
        expect(entries.length).toBe(2);
        expect(entries[0].classList.contains('not-current')).toBe(false);
        expect(entries[1].classList.contains('not-current')).toBe(true);
        expect(entries[0].textContent).toContain('Avec Système de Pièges des Apprivoiseurs');
        expect(entries[1].textContent).toContain('Sans Système de Pièges des Apprivoiseurs');
    });

    it('n\'affiche aucune section pour un objet sans données nouvelles', () => {
        const advanced: HTMLElement = render(makeItem());

        expect(advanced.querySelector('.watch-impact, .watch-effect, .bag-effect, .action-effect, .reload-charges')).toBeNull();
    });

    it('garde les issues d\'attaque d\'un objet cassé', () => {
        const advanced: HTMLElement = render(makeItem({
            is_broken: true,
            action_effects: [makeEffects({
                kind: 'Attack',
                outcomes: [makeOutcome({ kind: 'Kill', kill_min: 1, kill_max: 1 })]
            })]
        }));

        expect(advanced.querySelector('.action-effect img[src*="icons/small_zombie.gif"]')).toBeTruthy();
    });
    /** Rend une entrée de veille et renvoie sa ligne. */
    function renderWatch(outcomes: ActionOutcome[], overrides: Partial<Item> = {}): HTMLElement {
        const advanced: HTMLElement = render(makeItem({ action_effects: [makeEffects({ kind: 'Nightwatch', outcomes: outcomes })], ...overrides }));
        return advanced.querySelector('.watch-effect') as HTMLElement;
    }

    it('affiche la veille comme la catapulte : icône de veille puis flèche', () => {
        const row: HTMLElement = renderWatch([makeOutcome({ kind: 'Broken' })]);

        const icons: NodeListOf<HTMLImageElement> = row.querySelectorAll('img');
        expect(icons[0].src).toContain('emotes/watch.gif');
        expect(icons[1].src).toContain('emotes/arrowright.gif');
        expect(row.textContent?.trim()).toBe('');
    });

    it('montre l\'objet cassé en veille', () => {
        const row: HTMLElement = renderWatch([makeOutcome({ kind: 'Broken' })], { img_broken: 'item/item_x.b.gif' });

        expect((row.querySelector('.catapult-result.broken img') as HTMLImageElement).src).toContain('item/item_x.b.gif');
    });

    it('montre la forme vide obtenue en veille', () => {
        const row: HTMLElement = renderWatch([makeOutcome({ kind: 'Transformed', item: makeSummary('pilegun_empty_#00') })]);

        expect((row.querySelector('.catapult-result img') as HTMLImageElement).src).toContain('item_pilegun_empty_#00.gif');
    });

    it('montre l\'objet estompé quand il est détruit en veille', () => {
        const row: HTMLElement = renderWatch([makeOutcome({ kind: 'Consumed' })]);

        expect((row.querySelector('.catapult-result.vanished img') as HTMLImageElement).src).toContain('item/item_x.gif');
    });

    it('montre l\'objet intact en veille quand rien ne lui arrive', () => {
        const row: HTMLElement = renderWatch([]);

        const result: HTMLImageElement = row.querySelector('.catapult-result img') as HTMLImageElement;
        expect(result.src).toContain('item/item_x.gif');
        expect(row.querySelector('.catapult-result.broken, .catapult-result.vanished')).toBeNull();
    });

    it('place la veille juste au-dessus de la catapulte', () => {
        const catapult_effect: CatapultEffect = Object.assign(new CatapultEffect(), { fate: 'Broken', kill_min: null, repel_seconds: null });
        const advanced: HTMLElement = render(makeItem({
            catapult_effect: catapult_effect,
            action_effects: [makeEffects({ kind: 'Nightwatch', outcomes: [makeOutcome({ kind: 'Broken' })] })]
        }));

        const rows: HTMLElement[] = Array.from(advanced.querySelectorAll('.catapult-effect'));
        expect(rows.length).toBe(2);
        expect(rows[0].classList).toContain('watch-effect');
        expect(rows[1].classList).not.toContain('watch-effect');
    });
});

describe('ItemComponent — recettes et trouvailles', () => {
    let fixture: ComponentFixture<ItemComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ItemComponent],
            providers: [provideHttpClient(withXhr()), provideHttpClientTesting()]
        }).compileComponents();
        fixture = TestBed.createComponent(ItemComponent);
        fixture.componentRef.setInput('forceOpen', true);
    });

    /** Construit un objet de recette. */
    function recipeItem(uid: string): Item {
        const item: Item = new Item();
        item.uid = uid;
        item.img = `item/item_${uid}.gif`;
        item.label = { fr: uid } as never;
        return item;
    }

    /** Construit une recette. */
    function makeRecipe(name: string, type: RecipeType, components: string[], results: string[]): Recipe {
        const recipe: Recipe = new Recipe();
        recipe.name = name;
        recipe.type = type;
        recipe.components = components.map((uid: string): Item => recipeItem(uid));
        recipe.result = results.map((uid: string): RecipeResultItem => Object.assign(new RecipeResultItem(), { item: recipeItem(uid), probability: 1 / results.length }));
        return recipe;
    }

    /** Affiche un objet et rend la partie avancée. */
    function render(recipes: Recipe[], properties: Property[] = [], actions: Action[] = []): HTMLElement {
        const item: Item = recipeItem('electro_box_#00');
        item.description = { fr: '' } as never;
        item.properties = properties;
        item.actions = actions;
        item.recipes = recipes;
        item.opens = [];
        item.opened_with = null;
        fixture.componentInstance.item.set(item);
        fixture.detectChanges();
        return fixture.nativeElement.querySelector('.advanced-part');
    }

    it('masque une recette de l\'Établi des Techniciens déjà donnée par l\'Atelier', () => {
        const advanced: HTMLElement = render([
            makeRecipe('ws011', 'Recipe::WorkshopType', ['electro_box_#00'], ['pile_#00', 'deto_#00']),
            makeRecipe('ws011_ta_0', 'Recipe::WorkshopTypeTechSpecific', ['electro_box_#00'], ['pile_#00']),
            makeRecipe('ws011_ta_5', 'Recipe::WorkshopTypeTechSpecific', ['electro_box_#00'], ['deto_#00'])
        ]);

        expect(advanced.querySelectorAll('mho-recipe').length).toBe(1);
    });

    it('garde une recette de l\'Établi des Techniciens que l\'Atelier ne donne pas', () => {
        const advanced: HTMLElement = render([
            makeRecipe('ws011', 'Recipe::WorkshopType', ['electro_box_#00'], ['pile_#00']),
            makeRecipe('ws011_ta_9', 'Recipe::WorkshopTypeTechSpecific', ['electro_box_#00'], ['tagger_#00']),
            makeRecipe('ws099_ta_0', 'Recipe::WorkshopTypeTechSpecific', ['wood_bad_#00'], ['pile_#00'])
        ]);

        expect(advanced.querySelectorAll('mho-recipe').length).toBe(3);
    });

    it('masque les propriétés qui redonnent la catégorie et l\'appât', () => {
        const advanced: HTMLElement = render([], [Property.FOOD, Property.PET, Property.LURE, Property.CAN_COOK]);

        expect(advanced.textContent).toContain('Peut être cuisiné');
        expect(advanced.textContent).not.toContain('Provisions');
        expect(advanced.textContent).not.toContain('Animal');
        expect(advanced.textContent).not.toContain('appât');
    });

    it('masque les outils d\'ouverture et le cumul de veille, déjà portés par d\'autres lignes', () => {
        const advanced: HTMLElement = render([], [Property.BOX_OPENER, Property.CAN_OPENER, Property.PARCEL_OPENER, Property.NW_IMPACT_CUMUL]);

        expect(advanced.textContent).not.toContain('Outil d\'ouverture');
        expect(advanced.textContent).not.toContain('Chaque exemplaire compte');
    });

    it('affiche coffre, 1 fois par jour et chien en icônes, libellé au survol', () => {
        const advanced: HTMLElement = render([], [Property.LOCK, Property.SINGLE_USE, Property.HERO_DOG_FETCH]);

        const icons: HTMLImageElement[] = Array.from(advanced.querySelectorAll('.property-icons img'));
        expect(icons.map((icon: HTMLImageElement): string => icon.getAttribute('src') ?? '').join(' ')).toContain('icons/lock.gif');
        expect(icons.map((icon: HTMLImageElement): string => icon.getAttribute('src') ?? '').join(' ')).toContain('icons/small_once.gif');
        expect(icons.map((icon: HTMLImageElement): string => icon.getAttribute('src') ?? '').join(' ')).toContain('item/item_tamed_pet.gif');
        expect(icons.map((icon: HTMLImageElement): string => icon.title)).toContain('Sécurise le coffre dans lequel il se trouve');
        expect(advanced.textContent).not.toContain('Sécurise le coffre');
        expect(advanced.textContent).not.toContain('Utilisable 1 fois par jour');
    });

    it('affiche la trouvaille avec l\'icône de héros et son libellé', () => {
        const advanced: HTMLElement = render([], [Property.HERO_FIND_LUCKY]);

        expect(advanced.querySelector('img[src*="icons/small_hero.gif"]')).toBeTruthy();
        expect(advanced.textContent).toContain('Trouvaille améliorée');
    });

    it('n\'affiche que la plus petite trouvaille qui donne l\'objet', () => {
        const advanced: HTMLElement = render([], [Property.HERO_FIND_LUCKY3, Property.HERO_FIND_LUCKY2, Property.HERO_FIND_LUCKY]);

        expect(advanced.textContent).toContain('Trouvaille améliorée');
        expect(advanced.textContent).not.toContain('Impressionnante trouvaille');
        expect(advanced.textContent).not.toContain('Incroyable trouvaille');
    });

    it('affiche en une rangée les chantiers qui donnent le bonus de veille, nom et pourcentage au survol', () => {
        const advanced: HTMLElement = render([], [Property.NW_ARMORY, Property.NW_SHOOTING]);

        const row: HTMLElement | null = advanced.querySelector('.watch-bonus');
        const icons: HTMLImageElement[] = Array.from(row?.querySelectorAll('img') ?? []);
        expect(row?.textContent).toContain('Bonus de veille');
        expect(icons.map((icon: HTMLImageElement): string => (icon.getAttribute('src') ?? '').replace(/^.*\/(building\/)/, '$1')))
            .toEqual(['building/small_grinder2.gif', 'building/small_sewers.gif']);
        expect(icons[0].title).toContain('Meuleuse manuelle (+20 %)');
        expect(advanced.textContent).not.toContain('Compte dans le calcul');
    });

    it('affiche Désaltère en icône d\'hydratation seule, libellé au survol', () => {
        const advanced: HTMLElement = render([], [Property.IS_WATER]);

        const icon: HTMLImageElement | null = advanced.querySelector('.property-icons img[src*="status/status_hydrated.gif"]');
        expect(icon?.title).toBe('Désaltère');
        expect(advanced.textContent).not.toContain('Désaltère');
    });

    it('masque « Peut être rechargé », porté par la recette de recharge, et les actions sans libellé', () => {
        const advanced: HTMLElement = render([], [], [Action.LOAD_PILEGUN, undefined as unknown as Action, Action.COFFEE]);

        expect(advanced.textContent).not.toContain('Peut être rechargé');
        expect(advanced.textContent).toContain('Restaure 4 points d\'actions');
        expect(advanced.querySelectorAll('.item-action').length).toBe(1);
    });
});
