import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import moment from 'moment';
import { catchError, EMPTY, Observable, Subject, Subscriber, Subscription, switchMap, tap, throwError } from 'rxjs';

import { BANK_CONDENSED_DISPLAY_KEY, HORDES_IMG_REPO } from '../../_abstract_model/const';
import { Action } from '../../_abstract_model/enum/action.enum';
import { Property } from '../../_abstract_model/enum/property.enum';
import { TownService } from '../../_abstract_model/services/town.service';
import { Imports } from '../../_abstract_model/types/_types';
import { BankInfo } from '../../_abstract_model/types/bank-info.class';
import { BankVersion } from '../../_abstract_model/types/bank-version.class';
import { Item } from '../../_abstract_model/types/item.class';
import { ItemImgPipe } from '../../_core/pipes/item-img.pipe';
import { ItemsGroupByCategoryPipe } from '../../_core/pipes/items-group-by-category.pipe';
import { LocalizedLabelPipe } from '../../_core/pipes/localized-label.pipe';
import { DEEP_LINK_PARAMS, linkedDay, replaceDeepLinkParams } from '../../_core/utilities/deep-link.util';
import { getTown } from '../../_core/utilities/localstorage.util';
import { localizedLabel, normalizeString } from '../../_core/utilities/string.utils';
import { DaySelectorComponent } from '../../_shared/day-selector/day-selector.component';
import { FilterFieldComponent } from '../../_shared/filter-field/filter-field.component';
import { ItemComponent } from '../../_shared/item/item.component';
import { PageTitleComponent } from '../../_shared/page-title/page-title.component';
import { SelectComponent } from '../../_shared/select/select.component';
import { BankVersionSelectorComponent } from './version-selector/bank-version-selector.component';

const angular_common: Imports = [CommonModule, FormsModule, NgOptimizedImage];
const components: Imports = [BankVersionSelectorComponent, DaySelectorComponent, FilterFieldComponent, ItemComponent, SelectComponent, PageTitleComponent];
const pipes: Imports = [ItemImgPipe, ItemsGroupByCategoryPipe, LocalizedLabelPipe];
const material_modules: Imports = [MatButtonToggleModule, MatCardModule, MatFormFieldModule, MatIconModule, MatTooltipModule];

@Component({
    selector: 'mho-bank',
    templateUrl: './bank.component.html',
    styleUrls: ['./bank.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class BankComponent implements OnInit {

    /** Les objets affichés par le filtre. Signal : réassigné depuis le subscribe de getBank() et lu par le template. */
    protected readonly displayed_bank_items: WritableSignal<Item[] | undefined> = signal(undefined);
    /** L'objet dont le détail est affiché */
    protected detailed_item: Item | undefined;
    /** Le champ de filtre sur les objets */
    protected filter_value: string = '';
    /** Le champ de filtres sur les propriétés */
    protected select_value: (Property | Action)[] = [];
    protected condensed_display: boolean = JSON.parse(localStorage.getItem(BANK_CONDENSED_DISPLAY_KEY) || 'false');
    /** La liste des filtres */
    protected options: (Property | Action)[] = [...<Property[]>Property.getAllValues(), ...<Action[]>Action.getAllValues()];
    protected readonly locale: string = moment.locale();
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La banque remontée par l'appel */
    private bank!: BankInfo;
    private town_service: TownService = inject(TownService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);
    private readonly router: Router = inject(Router);

    /** Versions de la banque, par `last_update_id` croissant. */
    protected readonly versions: WritableSignal<BankVersion[]> = signal([]);
    /** Jour sélectionné. */
    protected readonly selected_day: WritableSignal<number> = signal(0);
    /** `last_update_id` de la version sélectionnée. */
    protected readonly selected_version_id: WritableSignal<number> = signal(0);
    /** Jours distincts des versions. */
    protected readonly days: Signal<number[]> = computed((): number[] =>
        [...new Set(this.versions().map((version: BankVersion): number => version.day))]);
    /** Jour courant de la ville. */
    protected readonly today: Signal<number> = computed((): number => getTown()?.day ?? 0);
    /** Versions du jour le plus récent, seul jour encore modifiable. */
    protected readonly latest_day_versions: Signal<BankVersion[]> = computed((): BankVersion[] => {
        const days: number[] = this.days();
        const max_day: number = days[days.length - 1];
        return this.versions().filter((version: BankVersion): boolean => version.day === max_day);
    });
    /** Vrai sur le jour le plus récent s'il a plusieurs versions. */
    protected readonly show_version_selector: Signal<boolean> = computed((): boolean =>
        this.latest_day_versions().length > 1 && this.selected_day() === this.days()[this.days().length - 1]);
    /** Demandes de contenu : `null` = ouverture, sinon `last_update_id` ; la dernière annule les précédentes. */
    private readonly content_requests: Subject<number | null> = new Subject<number | null>();
    /** `last_update_id` de la version réellement affichée. */
    private displayed_version_id: number = 0;

    /** Branche le flux de chargement unique puis lance l'ouverture. */
    public ngOnInit(): void {
        this.content_requests
            .pipe(
                switchMap((last_update_id: number | null): Observable<BankInfo> =>
                    (last_update_id === null ? this.open() : this.loadVersion(last_update_id, true)).pipe(
                        catchError((): Observable<never> => {
                            this.restoreSelection();
                            return EMPTY;
                        })
                    )),
                takeUntilDestroyed(this.destroy_ref)
            )
            .subscribe((bank: BankInfo): void => this.setBank(bank));
        this.content_requests.next(null);
    }

    /** Sélectionne la dernière version d'un jour (repris dans l'URL) et charge son contenu. */
    protected selectDay(day: number): void {
        const of_day: BankVersion[] = this.versions().filter((version: BankVersion): boolean => version.day === day);
        if (of_day.length === 0) {
            return;
        }
        this.selected_day.set(day);
        replaceDeepLinkParams(this.router, { [DEEP_LINK_PARAMS.day]: day });
        this.selectVersion(of_day[of_day.length - 1].last_update_id);
    }

    /** Sélectionne une version et charge son contenu. */
    protected selectVersion(last_update_id: number): void {
        this.selected_version_id.set(last_update_id);
        this.content_requests.next(last_update_id);
    }

    /** Affiche la banque courante (avec synchro), charge les versions, listées après la synchro, puis le jour du lien de la page. */
    private open(): Observable<BankInfo> {
        return new Observable<BankInfo>((subscriber: Subscriber<BankInfo>): (() => void) => {
            const subscription: Subscription = this.town_service.getBank(true)
                .pipe(
                    tap((bank: BankInfo): void => subscriber.next(bank)),
                    switchMap((): Observable<BankInfo> => this.fetchVersions().pipe(
                        tap((): void => { this.displayed_version_id = this.selected_version_id(); }),
                        switchMap((): Observable<BankInfo> => this.linkedDayVersion())
                    ))
                )
                .subscribe({
                    next: (bank: BankInfo): void => subscriber.next(bank),
                    error: (error: unknown): void => subscriber.error(error),
                    complete: (): void => subscriber.complete()
                });
            return (): void => subscription.unsubscribe();
        });
    }

    /** Dernière version du jour demandé par le lien de la page (`?day=`), si ce jour en a et n'est pas déjà affiché. */
    private linkedDayVersion(): Observable<BankInfo> {
        const day: number | null = linkedDay(this.router);
        const of_day: BankVersion[] = this.versions().filter((version: BankVersion): boolean => version.day === day);
        if (day === null || day === this.selected_day() || of_day.length === 0) {
            return EMPTY;
        }
        const version_id: number = of_day[of_day.length - 1].last_update_id;
        this.selected_day.set(day);
        this.selected_version_id.set(version_id);
        return this.loadVersion(version_id, true);
    }

    /** Charge une version ; sur 404, un seul repli vers la plus récente, sans nouvelle tentative ; toute autre erreur est propagée. */
    private loadVersion(last_update_id: number, allow_fallback: boolean): Observable<BankInfo> {
        const town_id: number | undefined = getTown()?.town_id;
        if (town_id === undefined) {
            return EMPTY;
        }
        return this.town_service.getBankVersion(town_id, last_update_id).pipe(
            tap((): void => { this.displayed_version_id = last_update_id; }),
            catchError((error: { status?: number }): Observable<BankInfo> => {
                if (error?.status !== 404 || !allow_fallback) {
                    return throwError((): unknown => error);
                }
                return this.fetchVersions().pipe(
                    switchMap((versions: BankVersion[]): Observable<BankInfo> =>
                        versions.length === 0 ? EMPTY : this.loadVersion(versions[versions.length - 1].last_update_id, false))
                );
            })
        );
    }

    /** Recharge les versions et sélectionne la plus récente. */
    private fetchVersions(): Observable<BankVersion[]> {
        const town_id: number | undefined = getTown()?.town_id;
        if (town_id === undefined) {
            return EMPTY;
        }
        return this.town_service.getBankVersions(town_id).pipe(
            tap((versions: BankVersion[]): void => {
                this.versions.set(versions);
                if (versions.length > 0) {
                    const latest: BankVersion = versions[versions.length - 1];
                    this.selected_day.set(latest.day);
                    this.selected_version_id.set(latest.last_update_id);
                }
            })
        );
    }

    /** Remet le jour et la version sélectionnés sur la version affichée, si elle est encore listée. */
    private restoreSelection(): void {
        const displayed: BankVersion | undefined = this.versions().find((version: BankVersion): boolean => version.last_update_id === this.displayed_version_id);
        if (displayed !== undefined) {
            this.selected_day.set(displayed.day);
            this.selected_version_id.set(displayed.last_update_id);
        }
    }

    /** Trie la banque par catégorie et l'affiche en gardant les filtres. */
    private setBank(bank: BankInfo): void {
        this.bank = bank;
        if (this.bank) {
            this.bank.items = this.bank.items.sort((a: Item, b: Item): number => a.category.ordering - b.category.ordering);
            this.applyFilters();
        }
    }

    protected applyFilters(): void {
        let filtered: Item[];
        if (this.filter_value !== null && this.filter_value !== undefined && this.filter_value !== '') {
            filtered = [...this.bank.items.filter((bank_item: Item) => normalizeString(localizedLabel(bank_item.label, this.locale)).indexOf(normalizeString(this.filter_value)) > -1)];
        } else {
            filtered = [...this.bank.items];
        }

        if (this.select_value && this.select_value.length > 0) {
            filtered = filtered.filter((item: Item) => {
                const item_actions_and_properties: (Action | Property)[] = [
                    ...item.actions.filter((action: Action) => action),
                    ...item.properties.filter((property: Property) => property)
                ];
                const item_has_action_or_property: boolean = item_actions_and_properties.some((action_or_property: Action | Property) => {
                    return this.select_value.some((selected: Action | Property) => selected?.key === action_or_property?.key);
                });
                const item_has_key: boolean = this.select_value.some((filter: Property | Action) => (<{ [key: string]: unknown }><unknown>item)[filter?.key]);
                return item_has_action_or_property || item_has_key;
            });
        }
        this.displayed_bank_items.set(filtered);
    }

    /** Enregistre le mode d'affichage de la banque. */
    protected changeCondensedDisplay(): void {
        localStorage.setItem(BANK_CONDENSED_DISPLAY_KEY, JSON.stringify(this.condensed_display));
    }
}
