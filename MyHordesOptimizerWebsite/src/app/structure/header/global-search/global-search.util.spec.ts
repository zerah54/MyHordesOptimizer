import { JobEnum } from '../../../_abstract_model/enum/job.enum';
import { Building } from '../../../_abstract_model/types/building.class';
import { Category } from '../../../_abstract_model/types/category.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { Ruin } from '../../../_abstract_model/types/ruin.class';
import { SidenavLinks } from '../../menu/sidenav-links';
import {
    buildGlossaryIndex,
    buildingEntries,
    citizenEntries,
    foldForSearch,
    GLOBAL_SEARCH_GROUP_LIMIT,
    GlobalSearchEntry,
    GlobalSearchGroup,
    GlobalSearchGroupId,
    GlobalSearchIndex,
    GlossaryIndex,
    glossaryMatches,
    itemEntries,
    MatchRank,
    matchRank,
    pageEntries,
    playerEntries,
    ruinEntries,
    searchIndex,
    townEntries
} from './global-search.util';

const LOCALE: string = 'fr';

function makeItem(id: number, label: string, category: string = 'Divers'): Item {
    const item: Item = new Item();
    item.id = id;
    item.img = `item/item_${id}.gif`;
    item.label = { [LOCALE]: label };
    item.category = Object.assign(new Category(), { id_category: 1, ordering: 1, label: { [LOCALE]: category } });
    return item;
}

function indexOf(entries: GlobalSearchEntry[]): GlobalSearchIndex {
    return new Map<GlobalSearchGroupId, readonly GlobalSearchEntry[]>([['items', entries]]);
}

function labelsOf(groups: GlobalSearchGroup[], group: GlobalSearchGroupId): string[] {
    return groups.find((value: GlobalSearchGroup): boolean => value.id === group)?.entries.map((entry: GlobalSearchEntry): string => entry.label) ?? [];
}

describe('global-search.util', (): void => {
    describe('foldForSearch', (): void => {
        it('ignores case, accents, ligatures and extra spaces', (): void => {
            expect(foldForSearch('  Éclaireur   ÂGÉ ')).toBe('eclaireur age');
            expect(foldForSearch('Œil de bœuf')).toBe('oeil de boeuf');
            expect(foldForSearch('Straße')).toBe('strasse');
        });

        it('tolerates missing labels', (): void => {
            expect(foldForSearch(null)).toBe('');
            expect(foldForSearch(undefined)).toBe('');
        });
    });

    describe('matchRank', (): void => {
        it('ranks a label prefix before a word start, and a word start before the middle of a word', (): void => {
            expect(matchRank('pile', 'pil')).toBe(MatchRank.Prefix);
            expect(matchRank('lampe a pile', 'pil')).toBe(MatchRank.WordStart);
            expect(matchRank('papille', 'pil')).toBe(MatchRank.Inside);
            expect(matchRank('lampe', 'pil')).toBe(MatchRank.None);
        });

        it('keeps the best occurrence when the text appears several times', (): void => {
            // « ar » est au milieu de « barre » puis en tête de « armes ».
            expect(matchRank('barre d\'armes', 'ar')).toBe(MatchRank.WordStart);
        });

        it('treats apostrophes, hyphens and parentheses as word separators', (): void => {
            expect(matchRank('barre d\'armes', 'armes')).toBe(MatchRank.WordStart);
            expect(matchRank('porte-voix', 'voix')).toBe(MatchRank.WordStart);
            expect(matchRank('sac (ameliore)', 'amel')).toBe(MatchRank.WordStart);
        });
    });

    describe('searchIndex', (): void => {
        it('returns nothing for an empty or blank query', (): void => {
            const index: GlobalSearchIndex = indexOf(itemEntries([makeItem(1, 'Pile')], LOCALE));

            expect(searchIndex(index, '')).toEqual([]);
            expect(searchIndex(index, '   ')).toEqual([]);
        });

        it('matches without case nor accents', (): void => {
            const index: GlobalSearchIndex = indexOf(itemEntries([makeItem(1, 'Éclat de pierre'), makeItem(2, 'Planche')], LOCALE));

            expect(labelsOf(searchIndex(index, 'ECLAT'), 'items')).toEqual(['Éclat de pierre']);
        });

        it('ranks word starts before the rest, then shorter labels first', (): void => {
            const index: GlobalSearchIndex = indexOf(itemEntries([
                makeItem(1, 'Papille'),
                makeItem(2, 'Lampe à pile'),
                makeItem(3, 'Pile usagée'),
                makeItem(4, 'Pile')
            ], LOCALE));

            expect(labelsOf(searchIndex(index, 'pil'), 'items')).toEqual(['Pile', 'Pile usagée', 'Lampe à pile', 'Papille']);
        });

        it('keeps the best results of each group and reports the total', (): void => {
            const items: Item[] = Array.from({ length: 8 }, (_: unknown, index: number): Item => makeItem(index + 1, `Caisse ${index + 1}`));
            const groups: GlobalSearchGroup[] = searchIndex(indexOf(itemEntries(items, LOCALE)), 'caisse');

            expect(groups[0].entries.length).toBe(GLOBAL_SEARCH_GROUP_LIMIT);
            expect(groups[0].total).toBe(8);
            expect(groups[0].available).toBe(8);
        });

        it('shows every result of an unfolded group', (): void => {
            const items: Item[] = Array.from({ length: 8 }, (_: unknown, index: number): Item => makeItem(index + 1, `Caisse ${index + 1}`));
            const groups: GlobalSearchGroup[] = searchIndex(indexOf(itemEntries(items, LOCALE)), 'caisse', {
                limit: (group: GlobalSearchGroupId): number => group === 'items' ? Number.POSITIVE_INFINITY : GLOBAL_SEARCH_GROUP_LIMIT
            });

            expect(groups[0].entries.length).toBe(8);
        });

        it('also looks for the other forms of the query, ranked just after the query itself', (): void => {
            const index: GlobalSearchIndex = indexOf(itemEntries([makeItem(1, 'Gros coffre en métal'), makeItem(2, 'Gcem de test'), makeItem(3, 'Pile')], LOCALE));

            expect(labelsOf(searchIndex(index, 'gcem', { aliases: ['Gros Coffre En Métal'] }), 'items')).toEqual(['Gcem de test', 'Gros coffre en métal']);
            expect(labelsOf(searchIndex(index, 'gcem'), 'items')).toEqual(['Gcem de test']);
        });

        it('returns the groups in display order and omits the empty ones', (): void => {
            const ruin: Ruin = Object.assign(new Ruin(), { id: 3, label: { [LOCALE]: 'Bunker abandonné' }, min_dist: 5, max_dist: 9 });
            const building: Building = Object.assign(new Building(), { id: 4, label: { [LOCALE]: 'Abri' }, img: 'building/abri.gif' });
            const index: GlobalSearchIndex = new Map<GlobalSearchGroupId, readonly GlobalSearchEntry[]>([
                ['ruins', ruinEntries([ruin], LOCALE)],
                ['items', itemEntries([makeItem(1, 'Abricot')], LOCALE)],
                ['buildings', buildingEntries([building], LOCALE)],
                ['citizens', []]
            ]);

            expect(searchIndex(index, 'ab').map((group: GlobalSearchGroup): GlobalSearchGroupId => group.id)).toEqual(['items', 'buildings', 'ruins']);
        });
    });

    describe('entry builders', (): void => {
        it('links an item to its wiki card, with its category as context', (): void => {
            const [entry]: GlobalSearchEntry[] = itemEntries([makeItem(42, 'Pile', 'Divers')], LOCALE);

            expect(entry.link).toEqual({ path: 'wiki/items', query_params: { item: 42 } });
            expect(entry.context).toBe('Divers');
            expect(entry.img).toBe('item/item_42.gif');
        });

        it('drops entries without a label in any language', (): void => {
            const unnamed: Item = makeItem(7, '');
            unnamed.label = {};

            expect(itemEntries([unnamed], LOCALE)).toEqual([]);
        });

        it('falls back to another language when the current one is missing', (): void => {
            const item: Item = makeItem(8, '');
            item.label = { en: 'Battery' };

            expect(itemEntries([item], LOCALE)[0].label).toBe('Battery');
        });

        it('names the parent of an evolution and links to the buildings tree', (): void => {
            const parent: Building = Object.assign(new Building(), { id: 1, parent_id: null, label: { [LOCALE]: 'Muraille' }, img: 'a.gif' });
            const child: Building = Object.assign(new Building(), { id: 2, parent_id: 1, label: { [LOCALE]: 'Grand fossé' }, img: 'b.gif' });
            const entries: GlobalSearchEntry[] = buildingEntries([parent, child], LOCALE);

            expect(entries[0].context).toBe('');
            expect(entries[1].context).toBe('Muraille');
            expect(entries[1].link).toEqual({ path: 'wiki/buildings', query_params: { building: 2 } });
        });

        it('gives a ruin its distance range and no illustration', (): void => {
            const ruin: Ruin = Object.assign(new Ruin(), { id: 5, label: { [LOCALE]: 'Motel' }, min_dist: 3, max_dist: 7, formatted_img: 'ruin/motel.gif' });
            const [entry]: GlobalSearchEntry[] = ruinEntries([ruin], LOCALE);

            expect(entry.context).toBe('3–7 km');
            expect(entry.img).toBeNull();
            expect(entry.link).toEqual({ path: 'wiki/ruins', query_params: { ruin: 5 } });
        });

        it('links a citizen to the citizens list of the given town, and flags the dead', (): void => {
            const alive: Citizen = Object.assign(new Citizen(), { id: 10, name: 'Alice', job: JobEnum.SCOUT, is_dead: false });
            const dead: Citizen = Object.assign(new Citizen(), { id: 11, name: 'Bob', job: JobEnum.GUARDIAN, is_dead: true });
            const entries: GlobalSearchEntry[] = citizenEntries([alive, dead], 'town/123');

            expect(entries[0].link).toEqual({ path: 'town/123/citizens/list', query_params: { citizen: 10 } });
            expect(entries[0].img).toBe(JobEnum.SCOUT.value.img);
            expect(entries[0].context).toBe(JobEnum.SCOUT.value.label);
            expect(entries[1].context).toContain(JobEnum.GUARDIAN.value.label);
            expect(entries[1].context).not.toBe(JobEnum.GUARDIAN.value.label);
        });

        it('indexes the authorized leaves of the menu, with their section as context', (): void => {
            const routes: SidenavLinks[] = [
                {
                    label: 'Wiki', displayed: true, authorized: (): boolean => true, spoil: false, children: [
                        { label: 'Objets', path: 'wiki/items', displayed: false, authorized: (): boolean => true, spoil: true },
                        { label: 'Secret', path: 'wiki/secret', displayed: false, authorized: (): boolean => false, spoil: false }
                    ]
                },
                {
                    label: 'Ma ville', displayed: true, authorized: (): boolean => false, spoil: false, children: [
                        { label: 'Banque', townSuffix: 'bank', displayed: true, authorized: (): boolean => true, spoil: false }
                    ]
                },
                { label: 'Groupe vide', displayed: true, authorized: (): boolean => true, spoil: false, children: [] }
            ];
            const entries: GlobalSearchEntry[] = pageEntries(routes, (route: SidenavLinks): string | undefined => route.path, (route: SidenavLinks): string => route.label);

            expect(entries.map((entry: GlobalSearchEntry): string => entry.label)).toEqual(['Objets']);
            expect(entries[0].context).toBe('Wiki');
            expect(entries[0].link).toEqual({ path: 'wiki/items', query_params: null });
        });

        it('links the players of the directory to their profile, without the missing avatars', (): void => {
            const entries: GlobalSearchEntry[] = playerEntries([
                { id: 5, name: 'Zerah', avatar: '/storage/zerah.png' },
                { id: 6, name: 'Sans avatar', avatar: 'False' },
                { id: 7, name: '' }
            ]);

            expect(entries.map((entry: GlobalSearchEntry): string => entry.label)).toEqual(['Zerah', 'Sans avatar']);
            expect(entries[0].link).toEqual({ path: 'profile/5', query_params: null });
            expect(entries[0].avatar).toBe('/storage/zerah.png');
            expect(entries[1].avatar).toBeNull();
        });

        it('opens its own town normally and any other town as an observer, with what tells homonyms apart', (): void => {
            const entries: GlobalSearchEntry[] = townEntries([
                { id: 1, mapId: 100, name: 'Ville à moi', townType: 'RE', season: 17, language: 'fr', isChaos: true, isDevasted: false, isFinished: false },
                { id: 2, mapId: 200, name: 'Ville finie', townType: 'PANDE', season: 16, language: 'de', isChaos: true, isDevasted: true, isFinished: true }
            ], 100);

            expect(entries[0].link).toEqual({ path: 'my-town', query_params: null });
            expect(entries[1].link).toEqual({ path: 'town/200/citizens/list', query_params: null });
            expect(entries[0].context).toBe('Saison 17 · RE · FR · Chaos');
            // Une ville terminée n'est que « Terminée »
            expect(entries[1].context).toBe('Saison 16 · PANDE · DE · Terminée');
            expect(entries[1].img).toBe('icons/small_arma.gif');
        });
    });

    describe('glossary', (): void => {
        const glossary: GlossaryIndex = buildGlossaryIndex([
            { word: 'GCEM', definition: 'Gros Coffre En Métal' },
            { word: 'HR', definition: 'Heroic Return' },
            { word: 'hr', definition: 'Heroic Rescue' },
            { word: 'HR', definition: 'heroic return' },
            { word: ' ', definition: 'Vide' },
            { word: 'X', definition: '' }
        ]);

        it('matches a whole acronym, whatever its case, and keeps every distinct definition', (): void => {
            expect(glossaryMatches(glossary, 'gcem').map((match: { definition: string }): string => match.definition)).toEqual(['Gros Coffre En Métal']);
            expect(glossaryMatches(glossary, ' GCEM ').length).toBe(1);
            expect(glossaryMatches(glossary, 'Hr').map((match: { definition: string }): string => match.definition)).toEqual(['Heroic Return', 'Heroic Rescue']);
        });

        it('does not expand the beginning of an acronym, nor blank entries', (): void => {
            expect(glossaryMatches(glossary, 'gce')).toEqual([]);
            expect(glossaryMatches(glossary, 'x')).toEqual([]);
            expect(glossary.size).toBe(2);
        });
    });
});
