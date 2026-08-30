import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatapultEffect } from '../../_abstract_model/types/catapult-effect.class';
import { Item } from '../../_abstract_model/types/item.class';
import { ItemSummary } from '../../_abstract_model/types/item-summary.class';
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
