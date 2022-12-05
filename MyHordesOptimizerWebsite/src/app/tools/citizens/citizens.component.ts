import { Component, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import * as moment from 'moment';
import { getUser } from 'src/app/shared/utilities/localstorage.util';
import { HORDES_IMG_REPO } from 'src/app/_abstract_model/const';
import { ApiServices } from 'src/app/_abstract_model/services/api.services';
import { ItemCount } from 'src/app/_abstract_model/types/item-count.class';
import { Item } from 'src/app/_abstract_model/types/item.class';
import { UpdateInfo } from 'src/app/_abstract_model/types/update-info.class';
import { CitizenInfo } from './../../_abstract_model/types/citizen-info.class';
import { Citizen } from './../../_abstract_model/types/citizen.class';

@Component({
    selector: 'mho-citizens',
    templateUrl: './citizens.component.html',
    styleUrls: ['./citizens.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class CitizensComponent {
    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatTable) table!: MatTable<Citizen>;
    @ViewChild('filterInput') filterInput!: ElementRef;

    /** La liste des citoyens */
    public citizen_info!: CitizenInfo;
    /** La datasource pour le tableau */
    public datasource: MatTableDataSource<Citizen> = new MatTableDataSource();
    /** La liste complète des items */
    public all_items: Item[] = [];
    /** Le dossier dans lequel sont stockées les images */
    public HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public locale: string = moment.locale();
    /** La liste des colonnes */
    public readonly columns: CitizenColumn[] = [
        { id: 'avatar', header: $localize`Avatar` },
        { id: 'name', header: $localize`Nom du citoyen` },
        { id: 'bag', header: $localize`Sac à dos` },
        { id: 'home_message', header: $localize`Message` },
    ];
    /** La liste des colonnes */
    public readonly columns_ids: string[] = this.columns.map((column: CitizenColumn) => column.id);

    constructor(private api: ApiServices) {

    }

    ngOnInit(): void {
        this.datasource = new MatTableDataSource();
        this.datasource.sort = this.sort;
        this.datasource.filterPredicate = (data: Citizen, filter: string) => this.customFilter(data, filter);
        this.getCitizens();

        this.api.getItems().subscribe((items: Item[]) => this.all_items = items)
    }

    /** Filtre la liste à afficher */
    public applyFilter(value: string): void {
        this.datasource.filter = value.trim().toLowerCase();
    }

    /**
     * Si l'item est déjà dans la liste, on fait +1
     * Sinon on rajoute l'item à la liste
     *
     * @param {number} citizen_id
     * @param {number} item_id
     */
    public addItem(citizen_id: number, item_id: number): void {
        const citizen: Citizen | undefined = this.datasource.data.find((citizen: Citizen) => citizen.id === citizen_id);
        if (citizen) {
            const item_in_datasource: ItemCount | undefined = citizen.bag.items.find((item_in_bag: ItemCount) => item_in_bag.item.id === item_id);
            if (item_in_datasource) {
                item_in_datasource.count += 1;
            } else {
                citizen.bag.items.push(new ItemCount({
                    count: 1,
                    isBroken: false,
                    item: (<Item>this.all_items.find((item: Item) => item.id === item_id)).modelToDto()
                }))
            }

            this.api.updateBag(citizen).subscribe((update_info: UpdateInfo) => {
                citizen.bag.last_update_user_name = getUser().username;
                citizen.bag.last_update_date_update = update_info.update_time;
            });
        }
    }

    /**
     * On retire 1 au compteur de l'item
     * Si l'item tombe à 0, on le retire de la liste
     *
     * @param {number} citizen_id
     * @param {number} item_id
     */
    public removeItem(citizen_id: number, item_id: number): void {
        const citizen: Citizen | undefined = this.datasource.data.find((citizen: Citizen) => citizen.id === citizen_id);
        if (citizen) {
            const item_in_datasource_index: number | undefined = citizen.bag.items.findIndex((item_in_bag: ItemCount) => item_in_bag.item.id === item_id);
            if (item_in_datasource_index && item_in_datasource_index > -1) {
                citizen.bag.items[item_in_datasource_index].count -= 1;
                if (citizen.bag.items[item_in_datasource_index].count <= 0) {
                    citizen.bag.items.splice(item_in_datasource_index, 1);
                }
            }
            this.api.updateBag(citizen).subscribe((update_info: UpdateInfo) => {
                citizen.bag.last_update_user_name = getUser().username;
                citizen.bag.last_update_date_update = update_info.update_time;
            });
        }
    }

    /** Remplace la fonction qui vérifie si un élément doit être remonté par le filtre */
    private customFilter(data: Citizen, filter: string): boolean {
        if (data.name.toLowerCase().indexOf(filter.toLowerCase()) > -1) return true;
        return false;
    }

    private getCitizens(): void {
        this.api.getCitizens().subscribe((citizen_info: CitizenInfo) => {
            this.citizen_info = citizen_info;
            this.datasource.data = [...citizen_info.citizens];
        });
    }
}


interface CitizenColumn {
    header: string;
    id: string;
}

