import { CommonModule, DecimalPipe } from '@angular/common';
import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    ElementRef,
    EventEmitter,
    inject,
    Injector,
    OnInit,
    Signal,
    signal,
    viewChild,
    WritableSignal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import moment from 'moment';

import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { StandardColumn } from '../../_abstract_model/interfaces';
import { ApiService } from '../../_abstract_model/services/api.service';
import { TownService } from '../../_abstract_model/services/town.service';
import { Imports } from '../../_abstract_model/types/_types';
import { Ruin } from '../../_abstract_model/types/ruin.class';
import { RuinItem } from '../../_abstract_model/types/ruin-item.class';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { TypedCellDefDirective } from '../../_core/directives/typed-cell-def.directive';
import { ColumnIdPipe } from '../../_core/pipes/column-id.pipe';
import { ItemImgPipe } from '../../_core/pipes/item-img.pipe';
import { LocalizedLabelPipe } from '../../_core/pipes/localized-label.pipe';
import { DEEP_LINK_PARAMS, deepLinkTargets } from '../../_core/utilities/deep-link.util';
import { getTown } from '../../_core/utilities/localstorage.util';
import { normalizeString } from '../../_core/utilities/string.utils';
import { HeaderWithNumberFilterComponent } from '../../_shared/lists/header-with-number-filter/header-with-number-filter.component';
import { HeaderWithSelectFilterComponent } from '../../_shared/lists/header-with-select-filter/header-with-select-filter.component';
import { HeaderWithStringFilterComponent } from '../../_shared/lists/header-with-string-filter/header-with-string-filter.component';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [HeaderWithStringFilterComponent, HeaderWithNumberFilterComponent, HeaderWithSelectFilterComponent];
const directives: Imports = [TypedCellDefDirective];
const pipes: Imports = [DecimalPipe, ColumnIdPipe, ItemImgPipe, LocalizedLabelPipe];
const material_modules: Imports = [MatButtonModule, MatIconModule, MatMenuModule, MatSlideToggleModule, MatSortModule, MatTableModule, MatTooltipModule];

@Component({
    selector: 'mho-ruins',
    templateUrl: './ruins.component.html',
    styleUrls: ['./ruins.component.scss'],
    imports: [...angular_common, ...components, ...directives, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RuinsComponent implements OnInit {

    /** Le dossier dans lequel sont stockées les images */
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    protected readonly locale: string = moment.locale();
    /** La ville actuelle */
    protected readonly town: TownDetails | null = getTown();
    /** La liste des bâtiments du jeu */
    protected readonly ruins: WritableSignal<Ruin[] | undefined> = signal(undefined);
    /** La liste des bâtiments de la ville */
    protected readonly town_ruins: WritableSignal<Ruin[]> = signal([]);
    /** La liste des objets du jeu */
    protected readonly items: WritableSignal<RuinItem[]> = signal([]);
    /** La datasource pour le tableau */
    protected readonly datasource: WritableSignal<MatTableDataSource<Ruin>> = signal(new MatTableDataSource());
    /** La liste des colonnes */
    protected readonly columns: RuinColumns[] = [
        { id: 'label', header: $localize`Nom du bâtiment`, sortable: true, sticky: true },
        { id: 'min_dist', header: $localize`Distance minimum`, sortable: true },
        { id: 'max_dist', header: $localize`Distance maximum`, sortable: true },
        { id: 'camping', header: $localize`Bonus en camping`, sortable: true },
        { id: 'capacity', header: $localize`Capacité`, sortable: true },
        { id: 'drops', header: $localize`Objets`, sortable: false }
    ];
    protected ruins_filters: RuinFilters = {
        label: '',
        min_dist: '',
        max_dist: '',
        objects: [],
        inside_town: false
    };
    protected ruins_filters_change: EventEmitter<void> = new EventEmitter();
    /** Bâtiment désigné par un lien profond (`?ruin=`, recherche globale) : sa ligne est surlignée. */
    protected readonly targeted_id: WritableSignal<number | null> = signal(null);
    private readonly sort: Signal<MatSort> = viewChild.required(MatSort);
    private town_service: TownService = inject(TownService);
    private api_service: ApiService = inject(ApiService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);
    private readonly router: Router = inject(Router);
    private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
    private readonly injector: Injector = inject(Injector);
    /** Bâtiment demandé, en attente du tableau (données ET tri : trier après coup déplacerait la ligne). */
    private requested_ruin_id: number | null = null;

    public ngOnInit(): void {
        deepLinkTargets(this.router, DEEP_LINK_PARAMS.ruin)
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((id: number): void => {
                this.requested_ruin_id = id;
                this.revealRequestedRuin();
            });

        this.api_service
            .getRuins()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (ruins: Ruin[]) => {
                    this.ruins.set(ruins);
                    getTown();
                    this.ruins_filters_change
                        .pipe(takeUntilDestroyed(this.destroy_ref))
                        .subscribe(() => {
                            this.datasource().filter = JSON.stringify(this.ruins_filters);
                        });

                    const items: RuinItem[] = [];
                    ruins.forEach((ruin: Ruin) => {
                        ruin.drops.forEach((ruin_item: RuinItem) => {
                            if (!items.some((item: RuinItem) => item.item.id === ruin_item.item.id)) {
                                items.push(ruin_item);
                            }
                        });
                    });
                    this.items.set(items);

                    const new_datasource: MatTableDataSource<Ruin> = new MatTableDataSource(ruins);
                    new_datasource.filterPredicate = this.customFilter.bind(this);
                    new_datasource.sortingDataAccessor = (item: Ruin, property: string): string | number => {
                        switch (property) {
                            case 'label':
                                return item.label[this.locale];
                            default:
                                return <string>item[property as keyof Ruin];
                        }
                    };
                    this.datasource.set(new_datasource);
                    setTimeout(() => {
                        this.datasource().sort = this.sort();
                        this.revealRequestedRuin();
                    });
                }
            });

        if (this.town) {
            this.town_service.getTownRuins()
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe({
                    next: (town_ruins: Ruin[]) => {
                        this.town_ruins.set(town_ruins);
                    }
                });
        }
    }

    /** Bascule la datasource entre les ruines du jeu et celles de la ville active. */
    protected applyInsideTownFilter(): void {
        this.datasource().data = this.ruins_filters.inside_town ? this.town_ruins() : (this.ruins() ?? []);
    }

    /**
     * Montre le bâtiment demandé par un lien profond (`/wiki/ruins?ruin=12`) : les filtres qui le
     * masqueraient (en-têtes, « Dans ma ville ») sont levés, puis sa ligne est surlignée et amenée
     * à l'écran.
     */
    private revealRequestedRuin(): void {
        const ruins: Ruin[] | undefined = this.ruins();
        const datasource: MatTableDataSource<Ruin> = this.datasource();
        if (this.requested_ruin_id === null || !ruins || !datasource.sort) {
            return;
        }
        const requested_id: number = this.requested_ruin_id;
        this.requested_ruin_id = null;
        if (!ruins.some((ruin: Ruin): boolean => ruin.id === requested_id)) {
            return;
        }
        // Par identifiant : « Dans ma ville » affiche d'autres instances (ruines de la ville).
        if (!datasource.filteredData.some((ruin: Ruin): boolean => ruin.id === requested_id)) {
            this.ruins_filters = { label: '', min_dist: '', max_dist: '', objects: [], inside_town: false };
            this.applyInsideTownFilter();
            datasource.filter = JSON.stringify(this.ruins_filters);
        }
        this.targeted_id.set(requested_id);
        afterNextRender({
            read: (): void => {
                this.host.nativeElement.querySelector<HTMLElement>('tr.mho-row-targeted')?.scrollIntoView?.({ block: 'center' });
            }
        }, { injector: this.injector });
    }

    /**
     * Chaque filtre renseigné restreint la liste : un bâtiment doit tous les satisfaire. Dans le filtre
     * des objets, il suffit qu'il donne l'un des objets choisis.
     */
    private customFilter(data: Ruin, filter: string): boolean {
        const filter_object: RuinFilters = JSON.parse(filter.toLowerCase());

        if (filter_object.label && normalizeString(data.label[this.locale]).indexOf(normalizeString(filter_object.label)) === -1) {
            return false;
        }
        if (filter_object.min_dist !== '' && filter_object.min_dist !== undefined && +data.min_dist < +filter_object.min_dist) {
            return false;
        }
        if (filter_object.max_dist !== '' && filter_object.max_dist !== undefined && +data.max_dist > +filter_object.max_dist) {
            return false;
        }
        if (filter_object.objects?.length > 0) {
            const wanted: Set<string> = new Set<string>(filter_object.objects.map((object: RuinItem): string => normalizeString(object.item.label[this.locale])));
            return data.drops.some((drop: RuinItem): boolean => wanted.has(normalizeString(drop.item.label[this.locale])));
        }
        return true;
    }
}

interface RuinColumns extends StandardColumn {
    sortable: boolean;
}

interface RuinFilters {
    label: string;
    min_dist: string | number;
    max_dist: string | number;
    objects: RuinItem[];
    inside_town: boolean;
}
