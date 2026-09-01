import { HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatapultEffect } from '../../_abstract_model/types/catapult-effect.class';
import { Item } from '../../_abstract_model/types/item.class';
import { ItemSummary } from '../../_abstract_model/types/item-summary.class';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { SnackbarService } from '../../_core/services/snackbar.service';
import { ItemComponent } from './item.component';

describe('ItemComponent — effet catapulte', () => {
    let fixture: ComponentFixture<ItemComponent>;
    let component: ItemComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ItemComponent],
            providers: [provideHttpClient(), provideHttpClientTesting()]
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
        const locale: string = (component as unknown as { locale: string }).locale;
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
            providers: [provideHttpClient(), provideHttpClientTesting()]
        }).compileComponents();

        fixture = TestBed.createComponent(ItemComponent);
        component = fixture.componentInstance;
        httpMock = TestBed.inject(HttpTestingController);
        // Le snackbar réel nécessite un provider d'animations non fourni ici — hors périmètre de ce composant.
        spyOn(TestBed.inject(SnackbarService), 'successSnackbar');
        (component as unknown as { town: TownDetails | null }).town = { town_id: 12 } as unknown as TownDetails;
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
