import { RuinItem } from './../../_abstract_model/types/ruin-item.class';
import { HORDES_IMG_REPO } from './../../_abstract_model/const';
import { MatTableDataSource } from '@angular/material/table';
import { Component, OnInit } from '@angular/core';
import { ApiServices } from 'src/app/_abstract_model/services/api.services';
import { Ruin } from 'src/app/_abstract_model/types/ruin.class';
import * as moment from 'moment';

@Component({
    selector: 'mho-ruins',
    templateUrl: './ruins.component.html',
    styleUrls: ['./ruins.component.scss']
})
export class RuinsComponent implements OnInit {

    /** Le dossier dans lequel sont stockées les images */
    public HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public locale: string = moment.locale();

    /** La liste des bâtiments du jeu */
    public ruins!: Ruin[];
    /** La datasource pour le tableau */
    public datasource: MatTableDataSource<Ruin> = new MatTableDataSource();
    /** La liste des colonnes */
    public readonly columns: RuinColumns[] = [
        { id: 'img', header: `` },
        { id: 'label', header: $localize`Nom de l'objet` },
        { id: 'description', header: $localize`Description` },
        { id: 'min_dist', header: $localize`Distance minimum` },
        { id: 'max_dist', header: $localize`Distance maximum` },
        { id: 'drops', header: $localize`Objets` }
    ];
    /** La liste des colonnes */
    public readonly columns_ids: string[] = this.columns.map((column: RuinColumns) => column.id);

    constructor(private api: ApiServices) {
    }

    ngOnInit(): void {
        this.api.getRuins().subscribe((ruins: Ruin[]) => {
            this.ruins = ruins;
            this.datasource.data = [...ruins];
            this.datasource.filterPredicate = this.customFilter;
        });
    }

    /** Filtre la liste à afficher */
    public applyFilter(event: Event): void {
        const value: string = (event.target as HTMLInputElement).value;
        this.datasource.filter = value.trim().toLowerCase();

    }

    private customFilter(data: Ruin, filter: string): boolean {
        let locale: string = moment.locale();
        return data.drops.some((drop: RuinItem) => drop.item.label[locale].toLowerCase().indexOf(filter) > -1)
        || data.label[locale].toLowerCase().indexOf(filter) > -1
        || data.description[locale].toLowerCase().indexOf(filter) > -1;
    }
}

interface RuinColumns {
    header: string;
    id: string;
}
