import { computed, inject, Injectable, InjectionToken, Signal, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import moment from 'moment';
import { catchError, debounceTime, finalize, map, Observable, of, Subject, switchMap, take } from 'rxjs';

import { DirectorySearchResultDTO, GlossaryEntryDTO } from '../../../_abstract_model/dto/search.dto';
import { ApiService } from '../../../_abstract_model/services/api.service';
import { SearchService } from '../../../_abstract_model/services/search.service';
import { TownService } from '../../../_abstract_model/services/town.service';
import { Building } from '../../../_abstract_model/types/building.class';
import { CitizenInfo } from '../../../_abstract_model/types/citizen-info.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { Ruin } from '../../../_abstract_model/types/ruin.class';
import { TownContextService } from '../../../_core/services/town-context.service';
import { getOwnTown, town } from '../../../_core/utilities/localstorage.util';
import { buildSidenavLinks, resolveSidenavLabel, resolveSidenavPath, SidenavLinks, townBasePath } from '../../menu/sidenav-links';
import {
    buildGlossaryIndex,
    buildingEntries,
    citizenEntries,
    foldForSearch,
    GLOBAL_SEARCH_DIRECTORY_EXPANDED_LIMIT,
    GLOBAL_SEARCH_DIRECTORY_MIN_LENGTH,
    GLOBAL_SEARCH_GROUP_LIMIT,
    GlobalSearchEntry,
    GlobalSearchGroup,
    GlobalSearchGroupId,
    GlobalSearchIndex,
    GlossaryDefinition,
    GlossaryIndex,
    glossaryMatches,
    itemEntries,
    pageEntries,
    playerEntries,
    ruinEntries,
    searchIndex,
    townEntries
} from './global-search.util';

/** Attente après la dernière frappe avant d'interroger l'annuaire (0 dans les tests). */
export const GLOBAL_SEARCH_DIRECTORY_DEBOUNCE_MS: InjectionToken<number> = new InjectionToken<number>('GLOBAL_SEARCH_DIRECTORY_DEBOUNCE_MS', {
    providedIn: 'root',
    factory: (): number => 250
});

/** Référentiels communs à toutes les villes : chargés une fois par session. */
type SharedSource = 'items' | 'buildings' | 'ruins' | 'glossary';

/** Demande à l'annuaire : saisie nettoyée et nombre de résultats par groupe. */
interface DirectoryRequest {
    readonly query: string;
    readonly limit: number;
}

/** Réponse de l'annuaire (vide en cas d'échec), rattachée à la saisie pliée et au nombre demandé. */
interface DirectoryAnswer {
    readonly query: string;
    readonly limit: number;
    readonly players: readonly GlobalSearchEntry[];
    readonly players_total: number;
    readonly towns: readonly GlobalSearchEntry[];
    readonly towns_total: number;
}

/** Citoyens indexés, avec la ville (et le mode d'observation) pour lesquels ils valent. */
interface CitizensIndex {
    readonly town_key: string;
    readonly entries: readonly GlobalSearchEntry[];
}

/**
 * Index de la recherche globale de l'en-tête.
 *
 * Rien n'est chargé au démarrage : {@link ensureLoaded} est appelé au premier focus du champ, puis
 * à chaque focus pour ce qui manque encore (échec réseau, changement de ville). Les sources sont
 * les référentiels que les pages chargent déjà — objets et bâtiments sont en cache local, les
 * chantiers sont une petite liste —, le glossaire des sigles et, en ville, les citoyens de la ville
 * active. Cette recherche se fait en mémoire.
 *
 * L'annuaire (joueurs, villes) est trop grand pour le navigateur : il est cherché par l'API, une
 * fois la frappe arrêtée ({@link requestDirectory}), une seule requête à la fois.
 */
@Injectable({ providedIn: 'root' })
export class GlobalSearchService {
    private readonly api: ApiService = inject(ApiService);
    private readonly search_api: SearchService = inject(SearchService);
    private readonly town_service: TownService = inject(TownService);
    private readonly town_context: TownContextService = inject(TownContextService);
    private readonly locale: string = moment.locale();

    /** Exemplaire propre du menu : celui du menu latéral voit ses groupes pliés et dépliés. */
    private readonly sidenav_links: SidenavLinks[] = buildSidenavLinks(this.town_context);

    private readonly items: WritableSignal<readonly GlobalSearchEntry[]> = signal([]);
    private readonly buildings: WritableSignal<readonly GlobalSearchEntry[]> = signal([]);
    private readonly ruins: WritableSignal<readonly GlobalSearchEntry[]> = signal([]);
    private readonly citizens: WritableSignal<CitizensIndex | null> = signal(null);
    private readonly glossary: WritableSignal<GlossaryIndex> = signal(new Map<string, readonly GlossaryDefinition[]>());

    /** Dernière demande faite à l'annuaire, et dernière réponse reçue. */
    private readonly directory_request: WritableSignal<DirectoryRequest> = signal({ query: '', limit: GLOBAL_SEARCH_GROUP_LIMIT });
    private readonly directory_answer: WritableSignal<DirectoryAnswer | null> = signal(null);
    private readonly directory_requests: Subject<DirectoryRequest> = new Subject<DirectoryRequest>();

    /** Vrai tant que l'annuaire n'a pas répondu à la dernière demande. */
    public readonly directory_loading: Signal<boolean> = computed((): boolean => {
        const request: DirectoryRequest = this.directory_request();
        if (request.query.length < GLOBAL_SEARCH_DIRECTORY_MIN_LENGTH) {
            return false;
        }
        const answer: DirectoryAnswer | null = this.directory_answer();
        return !answer || answer.query !== foldForSearch(request.query) || answer.limit < request.limit;
    });

    /**
     * Pages : recalculées quand la ville change. `authorized()` et les chemins de la section
     * « Ma ville » lisent des signaux (ville active, ville observée), que ce `computed` suit.
     */
    private readonly pages: Signal<readonly GlobalSearchEntry[]> = computed((): GlobalSearchEntry[] => pageEntries(
        this.sidenav_links,
        (route: SidenavLinks): string | undefined => resolveSidenavPath(route, this.town_context),
        (route: SidenavLinks): string => resolveSidenavLabel(route, this.town_context)
    ));

    /** Ville dont les citoyens doivent être proposés, `null` hors ville. */
    private readonly town_key: Signal<string | null> = computed((): string | null => {
        const town_id: number | undefined = town()?.town_id;
        return town_id ? `${town_id}:${this.town_context.isReadonly()}` : null;
    });

    /** Chargements en cours ou réussis : un référentiel n'est demandé qu'une fois. */
    private readonly requested: Set<SharedSource> = new Set<SharedSource>();
    /** Ville dont les citoyens sont en cours de chargement ou chargés. */
    private requested_citizens_key: string | null = null;
    private readonly pending: WritableSignal<number> = signal(0);

    /** Vrai tant qu'une source de l'index est en cours de chargement. */
    public readonly loading: Signal<boolean> = computed((): boolean => this.pending() > 0);

    public readonly index: Signal<GlobalSearchIndex> = computed((): GlobalSearchIndex => {
        const citizens: CitizensIndex | null = this.citizens();
        // Des citoyens chargés pour une autre ville (ou avant de la quitter) ne sont jamais proposés.
        const citizen_entries: readonly GlobalSearchEntry[] = citizens && citizens.town_key === this.town_key() ? citizens.entries : [];
        return new Map<GlobalSearchGroupId, readonly GlobalSearchEntry[]>([
            ['pages', this.pages()],
            ['items', this.items()],
            ['buildings', this.buildings()],
            ['ruins', this.ruins()],
            ['citizens', citizen_entries]
        ]);
    });

    public constructor() {
        this.directory_requests
            .pipe(
                debounceTime(inject(GLOBAL_SEARCH_DIRECTORY_DEBOUNCE_MS)),
                // Une nouvelle saisie annule la requête précédente : seule la dernière réponse compte.
                switchMap((request: DirectoryRequest): Observable<DirectoryAnswer | null> => {
                    if (request.query.length < GLOBAL_SEARCH_DIRECTORY_MIN_LENGTH) {
                        return of(null);
                    }
                    return this.search_api.searchDirectory(request.query, request.limit).pipe(
                        map((result: DirectorySearchResultDTO): DirectoryAnswer => this.toAnswer(request, result)),
                        // L'annuaire manque, la recherche locale reste utilisable.
                        catchError((): Observable<DirectoryAnswer> => of(this.toAnswer(request, null)))
                    );
                }),
                takeUntilDestroyed()
            )
            .subscribe((answer: DirectoryAnswer | null): void => this.directory_answer.set(answer));
    }

    /**
     * Résultats groupés pour une saisie, dans l'ordre d'affichage : l'index en mémoire (avec les
     * définitions d'un sigle du glossaire saisi en entier), puis l'annuaire s'il a répondu pour
     * cette saisie. Un groupe de `expanded` montre tous ses résultats.
     */
    public search(query: string, expanded: ReadonlySet<GlobalSearchGroupId> = new Set<GlobalSearchGroupId>()): GlobalSearchGroup[] {
        const groups: GlobalSearchGroup[] = searchIndex(this.index(), query, {
            aliases: this.glossaryMatches(query).map((definition: GlossaryDefinition): string => definition.definition),
            limit: (group: GlobalSearchGroupId): number => expanded.has(group) ? Number.POSITIVE_INFINITY : GLOBAL_SEARCH_GROUP_LIMIT
        });
        return [...groups, ...this.directoryGroups(query, expanded)];
    }

    /** Définitions du sigle saisi, s'il est au glossaire. */
    public glossaryMatches(query: string): readonly GlossaryDefinition[] {
        return glossaryMatches(this.glossary(), query);
    }

    /**
     * Interroge l'annuaire pour cette saisie, une fois la frappe arrêtée. `limit` : résultats par
     * groupe ({@link GLOBAL_SEARCH_DIRECTORY_EXPANDED_LIMIT} quand un groupe de l'annuaire est déplié).
     * Une saisie trop courte vide les résultats de l'annuaire sans appel.
     */
    public requestDirectory(query: string, limit: number): void {
        const request: DirectoryRequest = { query: query.trim(), limit: Math.min(limit, GLOBAL_SEARCH_DIRECTORY_EXPANDED_LIMIT) };
        this.directory_request.set(request);
        this.directory_requests.next(request);
    }

    /** Charge ce qui manque à l'index. Sans effet pour ce qui est déjà chargé ou en cours. */
    public ensureLoaded(): void {
        this.loadShared('items', (): Observable<Item[]> => this.api.getItems(),
                        (items: Item[]): void => this.items.set(itemEntries(items, this.locale)));
        this.loadShared('buildings', (): Observable<Building[]> => this.api.getBuildings(),
                        (buildings: Building[]): void => this.buildings.set(buildingEntries(buildings, this.locale)));
        this.loadShared('ruins', (): Observable<Ruin[]> => this.api.getRuins(),
                        (ruins: Ruin[]): void => this.ruins.set(ruinEntries(ruins, this.locale)));
        this.loadShared('glossary', (): Observable<GlossaryEntryDTO[]> => this.search_api.getGlossary(this.locale),
                        (entries: GlossaryEntryDTO[]): void => this.glossary.set(buildGlossaryIndex(entries)));
        this.loadCitizens();
    }

    /**
     * Groupes de l'annuaire, seulement si sa réponse vaut pour cette saisie. Un joueur déjà citoyen
     * de la ville active est proposé parmi les citoyens et n'est pas répété.
     */
    private directoryGroups(query: string, expanded: ReadonlySet<GlobalSearchGroupId>): GlobalSearchGroup[] {
        const answer: DirectoryAnswer | null = this.directory_answer();
        if (!answer || answer.query !== foldForSearch(query)) {
            return [];
        }
        const citizen_keys: Set<string> = new Set<string>((this.index().get('citizens') ?? []).map((entry: GlobalSearchEntry): string => entry.key));
        const players: GlobalSearchEntry[] = answer.players.filter((entry: GlobalSearchEntry): boolean => !citizen_keys.has(entry.key));
        const removed: number = answer.players.length - players.length;
        return [
            this.directoryGroup('players', players, Math.max(players.length, answer.players_total - removed), expanded),
            this.directoryGroup('towns', answer.towns, answer.towns_total, expanded)
        ].filter((group: GlobalSearchGroup | null): group is GlobalSearchGroup => group !== null);
    }

    private directoryGroup(id: GlobalSearchGroupId, entries: readonly GlobalSearchEntry[], total: number,
                           expanded: ReadonlySet<GlobalSearchGroupId>): GlobalSearchGroup | null {
        if (entries.length === 0) {
            return null;
        }
        return {
            id,
            entries: expanded.has(id) ? entries : entries.slice(0, GLOBAL_SEARCH_GROUP_LIMIT),
            total,
            available: Math.min(total, GLOBAL_SEARCH_DIRECTORY_EXPANDED_LIMIT)
        };
    }

    /** Réponse de l'annuaire en entrées de recherche ; `null` (échec) donne une réponse vide. */
    private toAnswer(request: DirectoryRequest, result: DirectorySearchResultDTO | null): DirectoryAnswer {
        return {
            query: foldForSearch(request.query),
            limit: request.limit,
            players: playerEntries(result?.players?.items ?? []),
            players_total: result?.players?.total ?? 0,
            towns: townEntries(result?.towns?.items ?? [], getOwnTown()?.town_id ?? null),
            towns_total: result?.towns?.total ?? 0
        };
    }

    private loadShared<T>(source: SharedSource, request: () => Observable<T>, apply: (value: T) => void): void {
        if (this.requested.has(source)) {
            return;
        }
        this.requested.add(source);
        this.track(request(), apply, (): void => {
            // Réessayé au prochain focus : un échec passager ne doit pas priver la session de ce groupe.
            this.requested.delete(source);
        });
    }

    private loadCitizens(): void {
        const town_key: string | null = this.town_key();
        if (town_key === null || town_key === this.requested_citizens_key) {
            return;
        }
        this.requested_citizens_key = town_key;
        // Relevé maintenant : c'est la ville du moment de la demande que désignent les liens.
        const base_path: string = townBasePath(this.town_context);
        this.track(this.town_service.getCitizens(),
                   (info: CitizenInfo): void => this.citizens.set({ town_key, entries: citizenEntries(info.citizens, base_path) }),
                   (): void => {
                       if (this.requested_citizens_key === town_key) {
                           this.requested_citizens_key = null;
                       }
                   });
    }

    /**
     * Souscrit une source. `take(1)` : plusieurs méthodes de l'API ne complètent jamais leur
     * observable (`getBuildings`, `getRuins` servi depuis le cache) — sans lui, le compteur de
     * chargement ne redescendrait pas.
     */
    private track<T>(source: Observable<T>, apply: (value: T) => void, onError: () => void): void {
        this.pending.update((count: number): number => count + 1);
        source
            .pipe(take(1), finalize((): void => this.pending.update((count: number): number => count - 1)))
            .subscribe({
                next: apply,
                // L'intercepteur HTTP a déjà signalé l'échec à l'utilisateur.
                error: onError
            });
    }
}
