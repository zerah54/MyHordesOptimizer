import { TestBed } from '@angular/core/testing';
import moment from 'moment';
import { Observable, of, Subject, throwError } from 'rxjs';
import type { Mock } from 'vitest';

import { DirectorySearchResultDTO, GlossaryEntryDTO } from '../../../_abstract_model/dto/search.dto';
import { ApiService } from '../../../_abstract_model/services/api.service';
import { SearchService } from '../../../_abstract_model/services/search.service';
import { TownService } from '../../../_abstract_model/services/town.service';
import { Building } from '../../../_abstract_model/types/building.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenInfo } from '../../../_abstract_model/types/citizen-info.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { Ruin } from '../../../_abstract_model/types/ruin.class';
import { TownDetails } from '../../../_abstract_model/types/town-details.class';
import { TownContextService } from '../../../_core/services/town-context.service';
import { setTown } from '../../../_core/utilities/localstorage.util';
import { GLOBAL_SEARCH_DIRECTORY_DEBOUNCE_MS, GlobalSearchService } from './global-search.service';
import { GlobalSearchEntry, GlobalSearchGroup, GlobalSearchGroupId } from './global-search.util';

function makeItem(id: number, label: string): Item {
    return Object.assign(new Item(), { id, img: 'item.gif', label: { [moment.locale()]: label } });
}

function makeTown(town_id: number): TownDetails {
    return Object.assign(new TownDetails(), { town_id, day: 1, town_type: 'RE' });
}

function makeCitizens(...names: string[]): CitizenInfo {
    const info: CitizenInfo = new CitizenInfo();
    info.citizens = names.map((name: string, index: number): Citizen => Object.assign(new Citizen(), { id: index + 1, name }));
    return info;
}

function entriesOf(groups: GlobalSearchGroup[], group: GlobalSearchGroupId): GlobalSearchEntry[] {
    return [...(groups.find((value: GlobalSearchGroup): boolean => value.id === group)?.entries ?? [])];
}

function directory(players: string[], towns: string[], towns_total: number = towns.length): DirectorySearchResultDTO {
    return {
        players: { total: players.length, items: players.map((name: string, index: number): { id: number; name: string } => ({ id: index + 1, name })) },
        towns: {
            total: towns_total,
            items: towns.map((name: string, index: number): DirectorySearchResultDTO['towns']['items'][number] => ({
                id: index + 1, mapId: 500 + index, name, isChaos: false, isDevasted: false, isFinished: false
            }))
        }
    };
}

/** L'attente de l'annuaire vaut 0 ms ici : une tâche suffit à la laisser passer. */
function flush(): Promise<void> {
    return new Promise<void>((resolve: () => void): void => {
        setTimeout(resolve, 0);
    });
}

describe('GlobalSearchService', (): void => {
    let service: GlobalSearchService;
    let get_items: Mock<() => Observable<Item[]>>;
    let get_buildings: Mock<() => Observable<Building[]>>;
    let get_ruins: Mock<() => Observable<Ruin[]>>;
    let get_citizens: Mock<() => Observable<CitizenInfo>>;
    let search_directory: Mock<(query: string, limit: number) => Observable<DirectorySearchResultDTO>>;
    let get_glossary: Mock<(locale: string) => Observable<GlossaryEntryDTO[]>>;

    beforeEach((): void => {
        setTown(null);
        get_items = vi.fn((): Observable<Item[]> => of([makeItem(1, 'Pile'), makeItem(2, 'Planche tordue')]));
        get_buildings = vi.fn((): Observable<Building[]> => of([]));
        get_ruins = vi.fn((): Observable<Ruin[]> => of([]));
        get_citizens = vi.fn((): Observable<CitizenInfo> => of(makeCitizens('Alice', 'Pilou')));
        search_directory = vi.fn((): Observable<DirectorySearchResultDTO> => of(directory([], [])));
        get_glossary = vi.fn((): Observable<GlossaryEntryDTO[]> => of([{ word: 'PT', definition: 'Planche tordue' }]));
        TestBed.configureTestingModule({
            providers: [
                { provide: ApiService, useValue: { getItems: get_items, getBuildings: get_buildings, getRuins: get_ruins } },
                { provide: TownService, useValue: { getCitizens: get_citizens } },
                { provide: SearchService, useValue: { searchDirectory: search_directory, getGlossary: get_glossary } },
                { provide: GLOBAL_SEARCH_DIRECTORY_DEBOUNCE_MS, useValue: 0 }
            ]
        });
        service = TestBed.inject(GlobalSearchService);
    });

    afterEach((): void => {
        TestBed.inject(TownContextService).clear();
        setTown(null);
    });

    it('does not request anything until the index is needed', (): void => {
        expect(get_items).not.toHaveBeenCalled();
        expect(get_buildings).not.toHaveBeenCalled();
        expect(get_ruins).not.toHaveBeenCalled();
        expect(get_citizens).not.toHaveBeenCalled();
        expect(entriesOf(service.search('pile'), 'items')).toEqual([]);
    });

    it('loads each referential once, then searches in memory', (): void => {
        service.ensureLoaded();
        service.ensureLoaded();
        service.search('pi');
        service.search('pil');

        expect(get_items).toHaveBeenCalledTimes(1);
        expect(get_buildings).toHaveBeenCalledTimes(1);
        expect(get_ruins).toHaveBeenCalledTimes(1);
        expect(entriesOf(service.search('pil'), 'items').map((entry: GlobalSearchEntry): string => entry.label)).toEqual(['Pile']);
    });

    it('reports loading until every source has answered, even one that never completes', (): void => {
        const items: Subject<Item[]> = new Subject<Item[]>();
        get_items.mockReturnValue(items.asObservable());

        service.ensureLoaded();
        expect(service.loading()).toBe(true);

        // Le Subject ne se termine jamais, comme `getRuins` servi depuis le cache.
        items.next([makeItem(1, 'Pile')]);
        expect(service.loading()).toBe(false);
    });

    it('retries a referential that failed on the next call', (): void => {
        get_items.mockReturnValueOnce(throwError((): Error => new Error('réseau')));

        service.ensureLoaded();
        expect(entriesOf(service.search('pile'), 'items')).toEqual([]);

        service.ensureLoaded();
        expect(get_items).toHaveBeenCalledTimes(2);
        expect(entriesOf(service.search('pile'), 'items').length).toBe(1);
    });

    it('does not look for citizens outside a town', (): void => {
        service.ensureLoaded();

        expect(get_citizens).not.toHaveBeenCalled();
    });

    it('indexes the citizens of the active town, linked to its citizens list', (): void => {
        setTown(makeTown(12));

        service.ensureLoaded();
        const [citizen]: GlobalSearchEntry[] = entriesOf(service.search('ali'), 'citizens');

        expect(citizen.label).toBe('Alice');
        expect(citizen.link).toEqual({ path: 'my-town/citizens/list', query_params: { citizen: 1 } });
    });

    it('never proposes the citizens of a town that is no longer active, and reloads for the new one', (): void => {
        setTown(makeTown(12));
        service.ensureLoaded();
        expect(entriesOf(service.search('ali'), 'citizens').length).toBe(1);

        TestBed.inject(TownContextService).setObservedTown(makeTown(99), 'Ville observée');
        expect(entriesOf(service.search('ali'), 'citizens')).toEqual([]);

        get_citizens.mockReturnValue(of(makeCitizens('Aline')));
        service.ensureLoaded();
        const [citizen]: GlobalSearchEntry[] = entriesOf(service.search('ali'), 'citizens');

        expect(get_citizens).toHaveBeenCalledTimes(2);
        expect(citizen.label).toBe('Aline');
        expect(citizen.link.path).toBe('town/99/citizens/list');
    });

    it('indexes the menu pages, following the observed town', (): void => {
        setTown(makeTown(12));
        expect(entriesOf(service.search('banque'), 'pages').map((entry: GlobalSearchEntry): string => entry.link.path)).toEqual(['my-town/bank']);

        TestBed.inject(TownContextService).setObservedTown(makeTown(99), 'Ville observée');

        expect(entriesOf(service.search('banque'), 'pages').map((entry: GlobalSearchEntry): string => entry.link.path)).toEqual(['town/99/bank']);
    });

    it('expands a whole acronym of the glossary into what it stands for', (): void => {
        service.ensureLoaded();

        expect(get_glossary).toHaveBeenCalledWith(moment.locale());
        expect(service.glossaryMatches('pt').map((definition: { definition: string }): string => definition.definition)).toEqual(['Planche tordue']);
        expect(entriesOf(service.search('PT'), 'items').map((entry: GlobalSearchEntry): string => entry.label)).toEqual(['Planche tordue']);
    });

    it('asks the directory once typing stops, and only answers for the query it was asked', async (): Promise<void> => {
        search_directory.mockReturnValue(of(directory(['Pilou'], ['Pilotis'], 12)));

        service.requestDirectory('pi', 5);
        service.requestDirectory('pil', 5);
        expect(service.directory_loading()).toBe(true);
        await flush();

        expect(search_directory).toHaveBeenCalledTimes(1);
        expect(search_directory).toHaveBeenCalledWith('pil', 5);
        expect(service.directory_loading()).toBe(false);
        const groups: GlobalSearchGroup[] = service.search('pil');
        expect(entriesOf(groups, 'players').map((entry: GlobalSearchEntry): string => entry.link.path)).toEqual(['profile/1']);
        expect(entriesOf(groups, 'towns').map((entry: GlobalSearchEntry): string => entry.link.path)).toEqual(['town/500/citizens/list']);
        expect(groups.find((group: GlobalSearchGroup): boolean => group.id === 'towns')?.total).toBe(12);
        // Réponse d'une autre saisie : rien de l'annuaire
        expect(entriesOf(service.search('pilo'), 'towns')).toEqual([]);
    });

    it('does not repeat a player who is already a citizen of the active town', async (): Promise<void> => {
        setTown(makeTown(12));
        service.ensureLoaded();
        // Alice est le citoyen 1 ; l'annuaire renvoie le joueur 1 (Alice) et le joueur 9 (Alicia)
        search_directory.mockReturnValue(of({
            players: { total: 2, items: [{ id: 1, name: 'Alice' }, { id: 9, name: 'Alicia' }] },
            towns: { total: 0, items: [] }
        }));

        service.requestDirectory('ali', 5);
        await flush();
        const groups: GlobalSearchGroup[] = service.search('ali');

        expect(entriesOf(groups, 'citizens').map((entry: GlobalSearchEntry): string => entry.label)).toEqual(['Alice']);
        expect(entriesOf(groups, 'players').map((entry: GlobalSearchEntry): string => entry.label)).toEqual(['Alicia']);
    });

    it('does not call the directory for a single character, and survives its failure', async (): Promise<void> => {
        service.requestDirectory('p', 5);
        await flush();
        expect(search_directory).not.toHaveBeenCalled();
        expect(service.directory_loading()).toBe(false);

        search_directory.mockReturnValue(throwError((): Error => new Error('réseau')));
        service.requestDirectory('pile', 5);
        await flush();

        expect(service.directory_loading()).toBe(false);
        expect(entriesOf(service.search('pile'), 'players')).toEqual([]);
    });

    it('shows every fetched result of an unfolded directory group', async (): Promise<void> => {
        search_directory.mockReturnValue(of(directory([], Array.from({ length: 9 }, (_: unknown, index: number): string => `Ville ${index}`), 80)));

        service.requestDirectory('ville', 50);
        await flush();

        const folded: GlobalSearchGroup | undefined = service.search('ville').find((group: GlobalSearchGroup): boolean => group.id === 'towns');
        const unfolded: GlobalSearchGroup | undefined = service.search('ville', new Set<GlobalSearchGroupId>(['towns']))
            .find((group: GlobalSearchGroup): boolean => group.id === 'towns');
        expect(folded?.entries.length).toBe(5);
        expect(folded?.available).toBe(50);
        expect(unfolded?.entries.length).toBe(9);
    });
});
