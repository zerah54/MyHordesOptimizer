import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

@Component({
    selector: 'mho-despair-deaths',
    templateUrl: './despair-deaths.component.html',
    styleUrls: ['./despair-deaths.component.scss']
})
export class DespairDeathsComponent {
    public datasource: MatTableDataSource<DespairDeaths> = new MatTableDataSource<DespairDeaths>(Array.from({ length: 30 }, (_, i) => { return { killed_zombies: i + 1, despair_deaths: i + 1 } }));
    /** La liste des colonnes */
    public readonly columns: DespairDeathsColumn[] = [
        { id: 'killed_zombies', header: $localize`Zombies morts sur la case depuis la dernière attaque` },
        { id: 'despair_deaths', header: $localize`Zombies qui vont mourir par désespoir` },
    ];
    /** La liste des colonnes */
    public readonly columns_ids: string[] = this.columns.map((column: DespairDeathsColumn) => column.id);

    constructor() {
        console.log('datasource', this.datasource);
    }
}

interface DespairDeathsColumn {
    header: string;
    id: string;
}

interface DespairDeaths {
    killed_zombies: number;
    despair_deaths: number;
}
