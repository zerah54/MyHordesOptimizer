import { ChangeDetectionStrategy, Component, computed, inject, input, InputSignal, LOCALE_ID, Signal, signal, WritableSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';
import { catchError, Observable, of } from 'rxjs';

import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import { ApiService } from '../../../../_abstract_model/services/api.service';
import { Imports, ListForAddRemove } from '../../../../_abstract_model/types/_types';
import { Item } from '../../../../_abstract_model/types/item.class';
import { localizedLabel } from '../../../../_core/utilities/string.utils';
import { BAG_SPACE_UIDS, maxBagCapacity } from '../../../../_shared/bag/bag-capacity.util';
import { ListElementAddRemoveComponent } from '../../../../_shared/list-elements-add-remove/list-element-add-remove.component';
import { itemIcon, itemLabel } from '../../../buildings/planning/planning-labels.util';
import { NightwatchStore, SimulationDayView, SimulationWatcherView } from '../../nightwatch.store';
import { NightwatchCitizenStateDTO, NightwatchItemDefDTO, NightwatchWatcherDTO } from '../../nightwatch.types';
import { AddableCitizen, addableCitizens } from '../../nightwatch-addable-citizens.util';
import { bagItems, bagItemUids, bagUsed } from '../../nightwatch-bag.util';
import { isHeavy } from '../../nightwatch-heavy.util';
import { cityDefenseTotal, CityDefenseValues } from '../../nightwatch-simulation.util';
import { NightwatchStatusesComponent } from '../../statuses/nightwatch-statuses.component';

const material_modules: Imports = [
    MatButtonModule, MatButtonToggleModule, MatCardModule, MatExpansionModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, MatTooltipModule
];

/** Poste de défense saisi par un champ numérique. */
type DefenseField = Exclude<keyof CityDefenseValues, 'adLevel'>;

/** Poste de défense affiché. */
interface DefensePost {
    key: DefenseField;
    label: string;
}

/** Fiche d'un veilleur du jour : citoyen inscrit avec sa défense et son risque calculés. */
interface WatcherCard extends AddableCitizen {
    defense: number;
    risk: number;
}

/** Ligne du stock restant. */
interface StockRow {
    item_id: number;
    label: string;
    icon: string;
    quantity: number;
}

/** Catégorie du stock restant et ses objets. */
interface StockGroup {
    label: string;
    ordering: number;
    rows: StockRow[];
}

/** Objets montrés dans le stock restant : objets de veille seulement, ou tous. */
type StockFilter = 'watch' | 'all';

/** Vue du jour sélectionné d'une simulation : attaque, postes de défense, veilleurs, stuff global, stock restant et verdict. */
@Component({
    selector: 'mho-nightwatch-simulation-day',
    templateUrl: './nightwatch-simulation-day.component.html',
    styleUrls: ['./nightwatch-simulation-day.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ListElementAddRemoveComponent, NightwatchStatusesComponent, ...material_modules]
})
export class NightwatchSimulationDayComponent {

    public readonly day: InputSignal<SimulationDayView> = input.required<SimulationDayView>();

    protected readonly store: NightwatchStore = inject(NightwatchStore);
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    protected readonly ad_levels: readonly number[] = [-1, 0, 1, 2, 3];
    protected readonly posts: readonly DefensePost[] = [
        { key: 'buildings', label: $localize`Chantiers` },
        { key: 'upgrades', label: $localize`Évolutions` },
        { key: 'wall', label: $localize`Muraille de base` },
        { key: 'bankDefenseItems', label: $localize`Objets de défense` },
        { key: 'fddCoefficient', label: $localize`Coefficient FDD` },
        { key: 'homes', label: $localize`Maisons citoyens` },
        { key: 'guardians', label: $localize`Gardiens` },
        { key: 'guardTowerPa', label: $localize`PA de la Tour des Gardiens` },
        { key: 'souls', label: $localize`Âmes purifiées` },
        { key: 'cemetery', label: $localize`Bonus cadavres` },
        { key: 'eveningVote', label: $localize`Vote du soir` },
        { key: 'dumpContribution', label: $localize`Apport des décharges` }
    ];

    /** Objets du jeu (libellés, icônes, encombrants). */
    protected readonly items: Signal<readonly Item[]> = toSignal(inject(ApiService).getItems().pipe(catchError((): Observable<Item[]> => of([]))),
                                                                 { initialValue: [] as Item[] });

    private readonly locale: string = moment.locale();
    private readonly site_locale: string = inject(LOCALE_ID);

    /** Saisie permise : droits d'édition et proposition sélectionnée = celle du jour affiché. */
    protected readonly editable: Signal<boolean> = computed((): boolean => this.store.can_edit() && this.store.selected_plan()?.id === this.day().plan_id);

    /** Stuff global du jour. */
    private readonly globals: Signal<Record<number, number>> = computed((): Record<number, number> => this.store.draft()?.globalItems ?? {});

    /** Veilleurs du jour par citoyen. */
    private readonly watchers: Signal<ReadonlyMap<number, NightwatchWatcherDTO>> = computed((): ReadonlyMap<number, NightwatchWatcherDTO> =>
        new Map<number, NightwatchWatcherDTO>((this.store.draft()?.watchers ?? []).map((watcher: NightwatchWatcherDTO): [number, NightwatchWatcherDTO] => [watcher.userId, watcher])));

    /** Citoyens pas encore inscrits, avec leur métier, par ordre alphabétique. */
    protected readonly addable_citizens: Signal<AddableCitizen[]> = computed((): AddableCitizen[] =>
        addableCitizens(this.store.state()?.citizens ?? [], [...this.watchers().values()], this.site_locale));

    /** Veilleurs inscrits, par ordre alphabétique, avec la défense et le risque du jour. */
    protected readonly watcher_cards: Signal<WatcherCard[]> = computed((): WatcherCard[] => {
        const enrolled: NightwatchCitizenStateDTO[] = (this.store.state()?.citizens ?? [])
            .filter((citizen: NightwatchCitizenStateDTO): boolean => this.watchers().has(citizen.userId));
        return addableCitizens(enrolled, [], this.site_locale).map((citizen: AddableCitizen): WatcherCard => {
            const view: SimulationWatcherView | undefined = this.day().watchers.find((watcher: SimulationWatcherView): boolean => watcher.user_id === citizen.user_id);
            return { ...citizen, defense: view?.defense ?? 0, risk: view?.risk ?? 0 };
        });
    });

    /** Défense de la ville hors veille. */
    protected readonly city_defense_total: Signal<number> = computed((): number => Math.round(cityDefenseTotal(this.day().defense) * 100) / 100);

    /** Objets de survie : ceux du référentiel à `watchImpact` non nul. */
    private readonly survival_items: Signal<Item[]> = computed((): Item[] => {
        const known: Record<number, NightwatchItemDefDTO> = this.store.referential()?.items ?? {};
        return this.items()
            .filter((item: Item): boolean => (known[item.id]?.watchImpact ?? 0) !== 0)
            .sort((a: Item, b: Item): number => itemLabel(this.items(), a.id, this.locale).localeCompare(itemLabel(this.items(), b.id, this.locale)));
    });

    /** Liste d'ajout des objets de survie. */
    protected readonly survival_lists: Signal<ListForAddRemove[]> = computed((): ListForAddRemove[] =>
        [{ label: $localize`Objets de survie`, list: this.survival_items() }]);

    /** Objets de survie portés par chaque veilleur. */
    protected readonly survival_bags: Signal<ReadonlyMap<number, Item[]>> = computed((): ReadonlyMap<number, Item[]> => {
        const survival_ids: ReadonlySet<number> = new Set<number>(this.survival_items().map((item: Item): number => item.id));
        return new Map<number, Item[]>([...this.watchers().values()].map((watcher: NightwatchWatcherDTO): [number, Item[]] => {
            const carried: Record<number, number> = Object.fromEntries(Object.entries(watcher.items)
                .filter(([item_id]: [string, number]): boolean => survival_ids.has(Number(item_id))));
            return [watcher.userId, bagItems(carried, this.items(), false)];
        }));
    });

    /** Stuff global pour le composant de sac. */
    protected readonly global_bag: Signal<Item[]> = computed((): Item[] => bagItems(this.globals(), this.items(), false));

    /** Onglets d'ajout au stuff global : objets de veille, stock restant du jour et tous, avec la quantité en stock. */
    protected readonly global_lists: Signal<ListForAddRemove[]> = computed((): ListForAddRemove[] => {
        const known: Record<number, NightwatchItemDefDTO> = this.store.referential()?.items ?? {};
        const stock: Record<number, number> = this.day().stock;
        const stock_counts: ReadonlyMap<number, number> = new Map<number, number>(Object.entries(stock)
            .map(([item_id, count]: [string, number]): [number, number] => [Number(item_id), count]));
        return [
            { label: $localize`Objets de veille`, list: this.items().filter((item: Item): boolean => known[item.id] !== undefined || BAG_SPACE_UIDS.includes(item.uid)), counts: stock_counts },
            { label: $localize`Stock`, list: this.items().filter((item: Item): boolean => (stock[item.id] ?? 0) > 0), counts: stock_counts },
            { label: $localize`Tous`, list: [...this.items()] }
        ];
    });

    /** Le stuff global (Discours rassurant porté compris) dépasse les places offertes ; places inconnues jugées au bonus Endurant maximal. */
    protected readonly slots_overflow: Signal<boolean> = computed((): boolean => {
        const essential_ids: ReadonlySet<number> = new Set<number>(Object.entries(this.store.referential()?.items ?? {})
            .filter(([, def]: [string, NightwatchItemDefDTO]): boolean => def.isEssential)
            .map(([item_id]: [string, NightwatchItemDefDTO]): number => Number(item_id)));
        const watchers: NightwatchWatcherDTO[] = [...this.watchers().values()];
        const used: number = bagUsed(this.globals(), essential_ids, false) + watchers.filter((watcher: NightwatchWatcherDTO): boolean => watcher.hasDiscourse).length;
        const offered: SimulationDayView['offered'] = this.day().offered;
        const capacity: number = offered.slots_known ? offered.slots : watchers.reduce((sum: number, watcher: NightwatchWatcherDTO): number =>
            sum + maxBagCapacity(this.store.enduranceLevel(watcher.userId), bagItemUids(watcher.items, this.items())), 0);
        return used > capacity;
    });

    /** Les encombrants du stuff global dépassent ceux qu'acceptent les veilleurs. */
    protected readonly heavy_overflow: Signal<boolean> = computed((): boolean =>
        Object.entries(this.globals())
            .filter(([item_id]: [string, number]): boolean => isHeavy(this.items(), Number(item_id)))
            .reduce((sum: number, [, quantity]: [string, number]): number => sum + quantity, 0) > this.day().offered.heavy);

    /** Stock restant du jour, objets inconnus du catalogue ignorés. */
    protected readonly stock_rows: Signal<StockRow[]> = computed((): StockRow[] =>
        Object.entries(this.day().stock)
            .map(([item_id, quantity]: [string, number]): StockRow => ({
                item_id: Number(item_id), label: itemLabel(this.items(), Number(item_id), this.locale), icon: itemIcon(this.items(), Number(item_id)), quantity
            }))
            .filter((row: StockRow): boolean => this.items().some((item: Item): boolean => item.id === row.item_id)));

    /** Filtre du stock restant. */
    protected readonly stock_filter: WritableSignal<StockFilter> = signal<StockFilter>('watch');

    /** Stock restant par catégorie (ordre du jeu), filtré ; objets par libellé. */
    protected readonly stock_groups: Signal<StockGroup[]> = computed((): StockGroup[] => {
        const known: Record<number, NightwatchItemDefDTO> = this.store.referential()?.items ?? {};
        const groups: Map<number, StockGroup> = new Map<number, StockGroup>();
        for (const row of this.stock_rows()) {
            const item: Item | undefined = this.items().find((candidate: Item): boolean => candidate.id === row.item_id);
            if (item === undefined || (this.stock_filter() === 'watch' && known[item.id] === undefined && !BAG_SPACE_UIDS.includes(item.uid))) {
                continue;
            }
            const key: number = item.category?.id_category ?? -1;
            const group: StockGroup = groups.get(key) ?? {
                label: localizedLabel(item.category?.label, this.locale) || $localize`Sans catégorie`,
                ordering: item.category?.ordering ?? Number.MAX_SAFE_INTEGER,
                rows: []
            };
            group.rows.push(row);
            groups.set(key, group);
        }
        return [...groups.values()]
            .sort((a: StockGroup, b: StockGroup): number => a.ordering - b.ordering)
            .map((group: StockGroup): StockGroup => ({ ...group, rows: group.rows.sort((a: StockRow, b: StockRow): number => a.label.localeCompare(b.label, this.site_locale)) }));
    });

    /**
     * Valeur saisie d'un poste de défense, nulle s'il est pré-rempli.
     * @param {keyof CityDefenseValues} key Poste.
     * @returns {number | null} Valeur saisie.
     */
    protected entered(key: keyof CityDefenseValues): number | null {
        return this.store.draft()?.cityDefense?.[key] ?? null;
    }

    /**
     * Libellé d'un niveau AD.
     * @param {number} level Niveau, -1 = non construit.
     * @returns {string} Libellé.
     */
    protected adLabel(level: number): string {
        return level === -1 ? $localize`Non construit` : `${level}`;
    }

    /**
     * Veilleur du jour, nul si le citoyen ne veille pas.
     * @param {number} user_id Citoyen.
     * @returns {NightwatchWatcherDTO | null} Veilleur.
     */
    protected watcher(user_id: number): NightwatchWatcherDTO | null {
        return this.watchers().get(user_id) ?? null;
    }

    /**
     * Inscrit le citoyen choisi comme veilleur et remet la liste à vide.
     * @param {MatSelect} select Liste de choix.
     * @param {number | null} user_id Citoyen choisi.
     */
    protected addWatcher(select: MatSelect, user_id: number | null): void {
        if (user_id !== null && user_id !== undefined) {
            this.store.addWatcher(user_id);
            select.value = null;
        }
    }

    /**
     * Risque en pourcentage, au centième.
     * @param {number} risk Risque entre 0 et 1.
     * @returns {number} Pourcentage arrondi.
     */
    protected percent(risk: number): number {
        return Math.round(risk * 10000) / 100;
    }



    /**
     * Ajoute ou retire un exemplaire d'objet de survie à un veilleur (le stuff global suit dans le store).
     * @param {number} user_id Citoyen.
     * @param {number} item_id Objet.
     * @param {number} delta +1 ou -1.
     */
    protected changeSurvival(user_id: number, item_id: number, delta: number): void {
        this.store.setSurvivalItem(user_id, item_id, Math.max(0, (this.watcher(user_id)?.items[item_id] ?? 0) + delta));
    }

    /**
     * Retire tous les objets de survie d'un veilleur.
     * @param {number} user_id Citoyen.
     */
    protected emptySurvival(user_id: number): void {
        (this.survival_bags().get(user_id) ?? []).forEach((item: Item): void => this.store.setSurvivalItem(user_id, item.id, 0));
    }

    /**
     * Ajoute ou retire un exemplaire au stuff global.
     * @param {number} item_id Objet.
     * @param {number} delta +1 ou -1.
     */
    protected changeGlobal(item_id: number, delta: number): void {
        this.store.setGlobalItem(item_id, Math.max(0, (this.globals()[item_id] ?? 0) + delta));
    }

    /** Vide le stuff global. */
    protected emptyGlobal(): void {
        Object.keys(this.globals()).forEach((item_id: string): void => this.store.setGlobalItem(Number(item_id), 0));
    }

    /**
     * Nombre saisi ; vide ou invalide = nul.
     * @param {string} value Saisie.
     * @returns {number | null} Nombre.
     */
    protected toNumber(value: string): number | null {
        const parsed: number = Number(value);
        return value.trim() === '' || !Number.isFinite(parsed) ? null : parsed;
    }
}
