import { Component, EventEmitter, HostBinding, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import * as moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { AutoDestroy } from 'src/app/shared/decorators/autodestroy.decorator';
import { ApiServices } from 'src/app/_abstract_model/services/api.services';
import { Ruin } from 'src/app/_abstract_model/types/ruin.class';
import { HORDES_IMG_REPO } from './../../_abstract_model/const';
import { RuinItem } from './../../_abstract_model/types/ruin-item.class';

@Component({
    selector: 'mho-ruins',
    templateUrl: './ruins.component.html',
    styleUrls: ['./ruins.component.scss']
})
export class RuinsComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    @ViewChild(MatSort) sort!: MatSort;

    /** Le dossier dans lequel sont stockées les images */
    public HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public readonly locale: string = moment.locale();

    /** La liste des bâtiments du jeu */
    public ruins!: Ruin[];
    /** La liste des objets du jeu */
    public items: RuinItem[] = [];
    /** La datasource pour le tableau */
    public datasource: MatTableDataSource<Ruin> = new MatTableDataSource();
    /** La liste des colonnes */
    public readonly columns: RuinColumns[] = [
        { id: 'label', header: $localize`Nom du bâtiment`, sortable: true },
        { id: 'description', header: $localize`Description`, sortable: false },
        { id: 'min_dist', header: $localize`Distance minimum`, sortable: true },
        { id: 'max_dist', header: $localize`Distance maximum`, sortable: true },
        { id: 'camping', header: $localize`Bonus en camping`, sortable: true },
        { id: 'drops', header: $localize`Objets`, sortable: false }
    ];

    public ruins_filters: RuinFilters = {
        label: '',
        min_dist: '',
        max_dist: '',
        objects: []
    };

    public ruins_filters_change: EventEmitter<void> = new EventEmitter();

    /** La liste des colonnes */
    public readonly columns_ids: string[] = this.columns.map((column: RuinColumns) => column.id);

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    constructor(private api: ApiServices, private fb: FormBuilder) {
    }

    ngOnInit(): void {
        this.api.getRuins()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((ruins: Ruin[]) => {
                this.ruins = ruins;
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
                    })
                })

                this.datasource = new MatTableDataSource(this.ruins);
                this.datasource.filterPredicate = this.customFilter;
                this.datasource.sortingDataAccessor = (item: Ruin, property: string): any => {
                    switch (property) {
                        case 'label':
                            return item.label[this.locale];
                        default:
                            return item[property as keyof Ruin];
                    }
                };
                setTimeout(() => {
                    this.datasource.sort = this.sort;
                });
            });
    }

    /** Filtre la liste à afficher */
    public applyFilter(value: string): void {
        this.datasource.filter = value.trim().toLowerCase();
    }

    private customFilter(data: Ruin, filter: string): boolean {
        let filter_object: RuinFilters = JSON.parse(filter.toLowerCase());
        let locale: string = moment.locale();
        if (filter_object.label === '' && filter_object.min_dist === '' && filter_object.max_dist === '' && filter_object.objects.length === 0) {
            return true;
        }
        return (filter_object.label !== '' && filter_object.label !== undefined && data.label[locale].toLowerCase().indexOf(filter_object.label) > -1)
            || (filter_object.min_dist !== '' && filter_object.min_dist !== undefined && +data.min_dist >= +filter_object.min_dist)
            || (filter_object.max_dist !== '' && filter_object.max_dist !== undefined && +data.max_dist <= +filter_object.max_dist)
            || (filter_object.objects.length > 0 && data.drops.some((drop: RuinItem) => filter_object.objects.some((object: RuinItem) => drop.item.label[locale].toLowerCase() === object.item.label[locale])));
    }
}

interface RuinColumns {
    header: string;
    id: string;
    sortable: boolean;
}

interface RuinFilters {
    label: string;
    min_dist: string | number;
    max_dist: string | number;
    objects: RuinItem[]
}
