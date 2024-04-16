import { CommonModule, DecimalPipe, NgClass, NgOptimizedImage } from '@angular/common';
import { Component, EventEmitter, HostBinding, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import * as moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { StandardColumn } from '../../_abstract_model/interfaces';
import { ApiService } from '../../_abstract_model/services/api.service';
import { TownService } from '../../_abstract_model/services/town.service';
import { RuinItem } from '../../_abstract_model/types/ruin-item.class';
import { Ruin } from '../../_abstract_model/types/ruin.class';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { AutoDestroy } from '../../shared/decorators/autodestroy.decorator';
import { HeaderWithNumberFilterComponent } from '../../shared/elements/lists/header-with-number-filter/header-with-number-filter.component';
import { HeaderWithSelectFilterComponent } from '../../shared/elements/lists/header-with-select-filter/header-with-select-filter.component';
import { HeaderWithStringFilterComponent } from '../../shared/elements/lists/header-with-string-filter/header-with-string-filter.component';
import { ColumnIdPipe } from '../../shared/pipes/column-id.pipe';
import { getTown } from '../../shared/utilities/localstorage.util';
import { normalizeString } from '../../shared/utilities/string.utils';

@Component({
    selector: 'mho-ruins',
    templateUrl: './ruins.component.html',
    styleUrls: ['./ruins.component.scss'],
    standalone: true,
    imports: [MatCardModule, CommonModule, MatTableModule, MatSortModule, HeaderWithStringFilterComponent, HeaderWithNumberFilterComponent, HeaderWithSelectFilterComponent, NgClass, NgOptimizedImage, DecimalPipe, ColumnIdPipe, FormsModule, MatSlideToggleModule, MatButtonModule, MatIconModule, MatTooltipModule, MatMenuModule]
})
export class RuinsComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    @ViewChild(MatSort) sort!: MatSort;

    /** Le dossier dans lequel sont stockées les images */
    public HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public readonly locale: string = moment.locale();
    /** La ville actuelle */
    public readonly town: TownDetails | null = getTown();

    /** La liste des bâtiments du jeu */
    public ruins!: Ruin[];
    /** La liste des bâtiments de la ville */
    public town_ruins!: Ruin[];
    /** La liste des objets du jeu */
    public items: RuinItem[] = [];
    /** La datasource pour le tableau */
    public datasource: MatTableDataSource<Ruin> = new MatTableDataSource();
    /** La liste des colonnes */
    public readonly columns: RuinColumns[] = [
        {id: 'label', header: $localize`Nom du bâtiment`, sortable: true, sticky: true},
        {id: 'description', header: $localize`Description`, sortable: false},
        {id: 'min_dist', header: $localize`Distance minimum`, sortable: true},
        {id: 'max_dist', header: $localize`Distance maximum`, sortable: true},
        {id: 'camping', header: $localize`Bonus en camping`, sortable: true},
        {id: 'capacity', header: $localize`Capacité`, sortable: true},
        {id: 'drops', header: $localize`Objets`, sortable: false}
    ];

    public ruins_filters: RuinFilters = {
        label: '',
        min_dist: '',
        max_dist: '',
        objects: [],
        inside_town: false
    };

    public ruins_filters_change: EventEmitter<void> = new EventEmitter();

    private town_service: TownService = inject(TownService);
    private api_service: ApiService = inject(ApiService);

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    public ngOnInit(): void {
        this.api_service
            .getRuins()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe({
                next: (ruins: Ruin[]) => {
                    this.ruins = ruins;
                    getTown();
                    this.ruins_filters_change
                        .pipe(takeUntil(this.destroy_sub))
                        .subscribe(() => {
                            this.datasource.filter = JSON.stringify(this.ruins_filters);
                        });

                    this.items = [];
                    this.ruins.forEach((ruin: Ruin) => {
                        ruin.drops.forEach((ruin_item: RuinItem) => {
                            if (!this.items.some((item: RuinItem) => item.item.id === ruin_item.item.id)) {
                                this.items.push(ruin_item);
                            }
                        });
                    });

                    this.datasource = new MatTableDataSource(this.ruins);
                    this.datasource.filterPredicate = this.customFilter.bind(this);
                    this.datasource.sortingDataAccessor = (item: Ruin, property: string): string | number => {
                        switch (property) {
                            case 'label':
                                return item.label[this.locale];
                            default:
                                return <string>item[property as keyof Ruin];
                        }
                    };
                    setTimeout(() => {
                        this.datasource.sort = this.sort;
                    });
                }
            });

        if (this.town) {
            this.town_service.getTownRuins()
                .pipe(takeUntil(this.destroy_sub))
                .subscribe({
                    next: (town_ruins: Ruin[]) => {
                        this.town_ruins = town_ruins;
                    }
                });
        }
    }

    private customFilter(data: Ruin, filter: string): boolean {
        const filter_object: RuinFilters = JSON.parse(filter.toLowerCase());

        if (filter_object.label === '' && filter_object.min_dist === '' && filter_object.max_dist === '' && filter_object.objects.length === 0) return true;

        return (filter_object.label !== '' && filter_object.label !== undefined && normalizeString(data.label[this.locale]).indexOf(normalizeString(filter_object.label)) > -1)
            || (filter_object.min_dist !== '' && filter_object.min_dist !== undefined && +data.min_dist >= +filter_object.min_dist)
            || (filter_object.max_dist !== '' && filter_object.max_dist !== undefined && +data.max_dist <= +filter_object.max_dist)
            || (filter_object.objects.length > 0 && data.drops.some((drop: RuinItem) => filter_object.objects.some((object: RuinItem) => normalizeString(drop.item.label[this.locale]) === normalizeString(object.item.label[this.locale]))));
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
