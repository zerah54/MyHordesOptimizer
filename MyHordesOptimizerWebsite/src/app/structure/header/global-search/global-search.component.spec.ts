import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter, Router } from '@angular/router';
import moment from 'moment';
import { Observable, of } from 'rxjs';
import type { Mock, MockInstance } from 'vitest';

import { DirectorySearchResultDTO, GlossaryEntryDTO } from '../../../_abstract_model/dto/search.dto';
import { ApiService } from '../../../_abstract_model/services/api.service';
import { SearchService } from '../../../_abstract_model/services/search.service';
import { TownService } from '../../../_abstract_model/services/town.service';
import { Building } from '../../../_abstract_model/types/building.class';
import { CitizenInfo } from '../../../_abstract_model/types/citizen-info.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { Ruin } from '../../../_abstract_model/types/ruin.class';
import { setTown } from '../../../_core/utilities/localstorage.util';
import { GlobalSearchComponent } from './global-search.component';
import { GLOBAL_SEARCH_DIRECTORY_DEBOUNCE_MS, GlobalSearchService } from './global-search.service';

function makeItem(id: number, label: string): Item {
    return Object.assign(new Item(), { id, img: `item/item_${id}.gif`, label: { [moment.locale()]: label } });
}

function makeBuilding(id: number, label: string): Building {
    return Object.assign(new Building(), { id, img: 'building/b.gif', label: { [moment.locale()]: label } });
}

function emptyDirectory(): DirectorySearchResultDTO {
    return { players: { total: 0, items: [] }, towns: { total: 0, items: [] } };
}

describe('GlobalSearchComponent', (): void => {
    let fixture: ComponentFixture<GlobalSearchComponent>;
    let navigate: MockInstance<Router['navigate']>;
    let get_items: Mock<() => Observable<Item[]>>;
    let search_directory: Mock<(query: string, limit: number) => Observable<DirectorySearchResultDTO>>;
    let get_glossary: Mock<(locale: string) => Observable<GlossaryEntryDTO[]>>;

    async function createComponent(compact: boolean = false): Promise<void> {
        fixture = TestBed.createComponent(GlobalSearchComponent);
        fixture.componentRef.setInput('compact', compact);
        fixture.detectChanges();
        await fixture.whenStable();
    }

    function input(): HTMLInputElement {
        return fixture.nativeElement.querySelector('input');
    }

    async function type(text: string): Promise<void> {
        const field: HTMLInputElement = input();
        field.focus();
        field.value = text;
        field.dispatchEvent(new Event('input'));
        await settle();
    }

    /** Laisse passer l'attente de l'annuaire (0 ms ici) et sa réponse, puis rend. */
    async function settle(): Promise<void> {
        fixture.detectChanges();
        await new Promise<void>((resolve: () => void): void => {
            setTimeout(resolve, 0);
        });
        fixture.detectChanges();
        await fixture.whenStable();
    }

    function labels(): string[] {
        return options().map((option: HTMLElement): string => option.querySelector('.label')?.textContent?.trim() ?? '');
    }

    async function press(key: string, target: EventTarget = input(), init: KeyboardEventInit = {}): Promise<KeyboardEvent> {
        const event: KeyboardEvent = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
        target.dispatchEvent(event);
        fixture.detectChanges();
        await fixture.whenStable();
        return event;
    }

    function options(): HTMLElement[] {
        return Array.from(document.querySelectorAll<HTMLElement>('.mho-global-search-pane [role="option"]'));
    }

    beforeEach(async (): Promise<void> => {
        setTown(null);
        get_items = vi.fn((): Observable<Item[]> => of([makeItem(42, 'Pile'), makeItem(43, 'Lampe à pile'), makeItem(44, 'Planche')]));
        search_directory = vi.fn((): Observable<DirectorySearchResultDTO> => of(emptyDirectory()));
        get_glossary = vi.fn((): Observable<GlossaryEntryDTO[]> => of([]));
        await TestBed.configureTestingModule({
            imports: [GlobalSearchComponent],
            providers: [
                provideRouter([]),
                {
                    provide: ApiService,
                    useValue: {
                        getItems: get_items,
                        getBuildings: (): Observable<Building[]> => of([makeBuilding(7, 'Pilier renforcé')]),
                        getRuins: (): Observable<Ruin[]> => of([])
                    }
                },
                { provide: TownService, useValue: { getCitizens: (): Observable<CitizenInfo> => of(new CitizenInfo()) } },
                { provide: SearchService, useValue: { searchDirectory: search_directory, getGlossary: get_glossary } },
                { provide: GLOBAL_SEARCH_DIRECTORY_DEBOUNCE_MS, useValue: 0 }
            ]
        }).compileComponents();
        navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    });

    afterEach((): void => {
        fixture?.destroy();
        setTown(null);
    });

    it('exposes an ARIA combobox and loads nothing before the first focus', async (): Promise<void> => {
        const ensure_loaded: MockInstance<() => void> = vi.spyOn(TestBed.inject(GlobalSearchService), 'ensureLoaded');
        await createComponent();

        expect(input().getAttribute('role')).toBe('combobox');
        expect(input().getAttribute('aria-expanded')).toBe('false');
        expect(ensure_loaded).not.toHaveBeenCalled();
        expect(get_items).not.toHaveBeenCalled();

        input().focus();
        fixture.detectChanges();

        expect(ensure_loaded).toHaveBeenCalledTimes(1);
    });

    it('shows the results grouped, best matches first, and links the listbox to the field', async (): Promise<void> => {
        await createComponent();
        await type('pil');

        const titles: string[] = Array.from(document.querySelectorAll('.mho-global-search-pane .group-title span:first-child'))
            .map((element: Element): string => element.textContent?.trim() ?? '');
        expect(titles).toEqual(['Objets', 'Chantiers']);
        expect(options().map((option: HTMLElement): string => option.querySelector('.label')?.textContent?.trim() ?? ''))
            .toEqual(['Pile', 'Lampe à pile', 'Pilier renforcé']);

        const listbox: HTMLElement | null = document.querySelector('.mho-global-search-pane [role="listbox"]');
        expect(input().getAttribute('aria-expanded')).toBe('true');
        expect(input().getAttribute('aria-controls')).toBe(listbox?.id);
        expect(input().getAttribute('aria-activedescendant')).toBe(options()[0].id);
        expect(options()[0].getAttribute('aria-selected')).toBe('true');
    });

    it('moves the active option with the arrows, wrapping around, and opens it with Enter', async (): Promise<void> => {
        await createComponent();
        await type('pil');

        await press('ArrowDown');
        expect(input().getAttribute('aria-activedescendant')).toBe(options()[1].id);

        await press('ArrowUp');
        await press('ArrowUp');
        expect(input().getAttribute('aria-activedescendant')).toBe(options()[2].id);

        const enter: KeyboardEvent = await press('Enter');

        expect(enter.defaultPrevented).toBe(true);
        expect(navigate).toHaveBeenCalledWith(['/wiki/buildings'], { queryParams: { building: 7 } });
        expect(input().value).toBe('');
    });

    it('opens a result on click, on the item itself', async (): Promise<void> => {
        await createComponent();
        await type('planche');

        options()[0].click();

        expect(navigate).toHaveBeenCalledWith(['/wiki/items'], { queryParams: { item: 44 } });
    });

    it('says so when nothing matches', async (): Promise<void> => {
        await createComponent();
        await type('zzz');

        expect(options()).toEqual([]);
        expect(document.querySelector('.mho-global-search-pane .note')?.textContent).toContain('zzz');
        expect(input().getAttribute('aria-expanded')).toBe('false');
    });

    it('closes the list with Escape, then clears the query', async (): Promise<void> => {
        await createComponent();
        await type('pil');

        await press('Escape');
        expect(options()).toEqual([]);
        expect(input().value).toBe('pil');

        await press('Escape');
        expect(input().value).toBe('');
    });

    it('focuses the field with "/" or Ctrl+K, but not from another text field', async (): Promise<void> => {
        await createComponent();

        const slash: KeyboardEvent = await press('/', document.body);
        expect(document.activeElement).toBe(input());
        expect(slash.defaultPrevented).toBe(true);

        input().blur();
        await press('k', document.body, { ctrlKey: true });
        expect(document.activeElement).toBe(input());

        input().blur();
        const other: HTMLInputElement = document.createElement('input');
        document.body.appendChild(other);
        other.focus();
        const typed: KeyboardEvent = await press('/', other);
        expect(document.activeElement).toBe(other);
        expect(typed.defaultPrevented).toBe(false);
        other.remove();
    });

    it('ignores the shortcut while a dialog is open', async (): Promise<void> => {
        await createComponent();
        Object.defineProperty(TestBed.inject(MatDialog), 'openDialogs', { get: (): unknown[] => [{}], configurable: true });

        await press('/', document.body);

        expect(document.activeElement).not.toBe(input());
    });

    it('collapses to a button on small screens and opens over the bar', async (): Promise<void> => {
        await createComponent(true);
        expect(input()).toBeNull();

        (fixture.nativeElement.querySelector('.open-button') as HTMLButtonElement).click();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.nativeElement.classList).toContain('is-expanded');
        expect(document.activeElement).toBe(input());

        input().blur();
        fixture.detectChanges();

        expect(fixture.nativeElement.classList).not.toContain('is-expanded');
        expect(input()).toBeNull();
    });

    it('unfolds a crowded group from its last line, with the keyboard or the mouse', async (): Promise<void> => {
        get_items.mockReturnValue(of(Array.from({ length: 8 }, (_: unknown, index: number): Item => makeItem(index + 1, `Caisse ${index + 1}`))));
        await createComponent();
        await type('caisse');

        expect(labels()).toEqual(['Caisse 1', 'Caisse 2', 'Caisse 3', 'Caisse 4', 'Caisse 5', 'Afficher 3 résultats de plus']);
        expect(document.querySelector('.mho-global-search-pane .count')?.textContent).toContain('5');

        for (let step: number = 0; step < 5; step++) {
            await press('ArrowDown');
        }
        const enter: KeyboardEvent = await press('Enter');

        expect(enter.defaultPrevented).toBe(true);
        expect(navigate).not.toHaveBeenCalled();
        expect(labels().length).toBe(8);
        // L'option active reste au même rang : le premier résultat révélé
        expect(input().getAttribute('aria-activedescendant')).toBe(options()[5].id);
        expect(document.querySelector('.mho-global-search-pane .count')).toBeNull();

        await type('caiss');
        expect(labels().length).toBe(6);

        (document.querySelector('.mho-global-search-pane .count.is-link') as HTMLElement).click();
        await settle();
        expect(labels().length).toBe(8);
    });

    it('recalls the definition of a glossary acronym and finds what it stands for', async (): Promise<void> => {
        get_items.mockReturnValue(of([makeItem(50, 'Gros coffre en métal'), makeItem(51, 'Pile')]));
        get_glossary.mockReturnValue(of([{ word: 'GCEM', definition: 'Gros Coffre En Métal' }]));
        await createComponent();
        await type('gcem');

        expect(get_glossary).toHaveBeenCalledWith(moment.locale());
        expect(document.querySelector('.mho-global-search-pane .glossary-note')?.textContent).toContain('Gros Coffre En Métal');
        expect(labels()).toEqual(['Gros coffre en métal']);
    });

    it('adds the players and towns of the directory once typing stops, below the other results', async (): Promise<void> => {
        search_directory.mockReturnValue(of({
            players: { total: 1, items: [{ id: 9, name: 'Pilou', avatar: '/storage/avatar.png' }] },
            towns: { total: 12, items: [{ id: 3, mapId: 777, name: 'Pilotis', townType: 'RE', season: 17, language: 'fr', isChaos: false, isDevasted: false, isFinished: true }] }
        }));
        await createComponent();
        await type('pil');

        expect(search_directory).toHaveBeenCalledWith('pil', 5);
        const titles: string[] = Array.from(document.querySelectorAll('.mho-global-search-pane .group-title span:first-child'))
            .map((element: Element): string => element.textContent?.trim() ?? '');
        expect(titles).toEqual(['Objets', 'Chantiers', 'Joueurs', 'Villes']);
        expect(document.querySelector('.mho-global-search-pane mho-avatar')).not.toBeNull();

        const town: HTMLElement | undefined = options().find((option: HTMLElement): boolean => option.textContent?.includes('Pilotis') ?? false);
        expect(town?.querySelector('.context')?.textContent).toContain('17');
        town?.click();
        expect(navigate).toHaveBeenCalledWith(['/town/777/citizens/list'], { queryParams: undefined });
    });

    it('asks the directory for more results when one of its groups is unfolded', async (): Promise<void> => {
        search_directory.mockReturnValue(of({
            players: { total: 0, items: [] },
            towns: {
                total: 80,
                items: Array.from({ length: 5 }, (_: unknown, index: number): DirectorySearchResultDTO['towns']['items'][number] => ({
                    id: index + 1, mapId: 100 + index, name: `Ville ${index + 1}`, isChaos: false, isDevasted: false, isFinished: false
                }))
            }
        }));
        await createComponent();
        await type('ville');

        expect(labels()).toContain('Afficher 45 résultats de plus');
        options()[options().length - 1].click();
        await settle();

        expect(search_directory).toHaveBeenLastCalledWith('ville', 50);
    });

    it('does not query the directory for a single character', async (): Promise<void> => {
        await createComponent();
        await type('p');

        expect(search_directory).not.toHaveBeenCalled();
    });
});
