import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { Entry } from '../../../../_abstract_model/interfaces';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { CitizenInfo } from '../../../../_abstract_model/types/citizen-info.class';
import { Item } from '../../../../_abstract_model/types/item.class';
import { PlaysRegistryComponent } from './plays-registry.component';

interface TestableComponent {
    entries_by_type: { (): Entry[] };
    changePlaysTab(event: MatTabChangeEvent): void;
}

describe('PlaysRegistryComponent', (): void => {
    let fixture: ComponentFixture<PlaysRegistryComponent>;

    function makeCitizen(id: number, name: string): Citizen {
        return Object.assign(new Citizen(), { id, name });
    }

    function makeCitizenList(citizens: Citizen[]): CitizenInfo {
        const list: CitizenInfo = new CitizenInfo();
        list.citizens = citizens;
        return list;
    }

    function makeItem(img: string, label: string): Item {
        return Object.assign(new Item(), { img, label: { fr: label } });
    }

    function makeTabEvent(labelClass: string): MatTabChangeEvent {
        return { index: 0, tab: { labelClass } } as unknown as MatTabChangeEvent;
    }

    // Alice a joué aux dés ET aux cartes (a un "pendant") ; Bob n'a joué qu'aux dés (pas de pendant).
    const registry: Entry[] = [
        { hour: '8:00', entry: 'Alice joue aux dés.' },
        { hour: '9:00', entry: 'Alice joue aux cartes.' },
        { hour: '10:00', entry: 'Bob joue aux dés.' }
    ];

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [PlaysRegistryComponent],
            providers: [provideNoopAnimations()]
        }).compileComponents();

        fixture = TestBed.createComponent(PlaysRegistryComponent);
        fixture.componentRef.setInput('completeCitizenList', makeCitizenList([makeCitizen(1, 'Alice'), makeCitizen(2, 'Bob')]));
        fixture.componentRef.setInput('completeItemsList', [
            makeItem('item/item_dice.gif', 'dés'), makeItem('item/item_cards.gif', 'cartes'), makeItem('item/item_soccer.gif', 'ballon')
        ]);
        fixture.componentRef.setInput('displayPseudo', 'simple');
        fixture.componentRef.setInput('registry', registry);
    });

    it('filters by "has a pendant" (dice+card same citizen) by default, no tab selected yet', (): void => {
        fixture.detectChanges();

        const entries: Entry[] = (fixture.componentInstance as unknown as TestableComponent).entries_by_type();
        expect(entries.length).toBe(2);
        expect(entries.every((entry: Entry): boolean => entry.entry.startsWith('Alice'))).toBe(true);
    });

    it('does not re-run the filter when the item list changes without a registry/tab change (matches legacy @Input setter, which only reacted to registry)', (): void => {
        fixture.detectChanges();
        const before: Entry[] = (fixture.componentInstance as unknown as TestableComponent).entries_by_type();

        fixture.componentRef.setInput('completeItemsList', []);
        fixture.detectChanges();

        expect((fixture.componentInstance as unknown as TestableComponent).entries_by_type()).toBe(before);
    });

    it('shows only dice entries when the "dice" tab is selected', fakeAsync((): void => {
        fixture.detectChanges();

        (fixture.componentInstance as unknown as TestableComponent).changePlaysTab(makeTabEvent('dice'));
        tick();

        const entries: Entry[] = (fixture.componentInstance as unknown as TestableComponent).entries_by_type();
        expect(entries.length).toBe(2);
        expect(entries.every((entry: Entry): boolean => entry.entry.includes('dés'))).toBe(true);
    }));

    it('shows only card entries when the "card" tab is selected', fakeAsync((): void => {
        fixture.detectChanges();

        (fixture.componentInstance as unknown as TestableComponent).changePlaysTab(makeTabEvent('card'));
        tick();

        const entries: Entry[] = (fixture.componentInstance as unknown as TestableComponent).entries_by_type();
        expect(entries.length).toBe(1);
        expect(entries[0].entry).toContain('cartes');
    }));

    it('shows no entries when the "soccer" tab is selected (no matching entry)', fakeAsync((): void => {
        fixture.detectChanges();

        (fixture.componentInstance as unknown as TestableComponent).changePlaysTab(makeTabEvent('soccer'));
        tick();

        expect((fixture.componentInstance as unknown as TestableComponent).entries_by_type().length).toBe(0);
    }));

    it('renders citizen-info entries for the active tab', (): void => {
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelectorAll('mho-citizen-info').length).toBeGreaterThan(0);
    });
});
