import { Component, HostBinding, Input, OnInit, ViewEncapsulation } from '@angular/core';
import * as moment from 'moment';
import { HORDES_IMG_REPO } from 'src/app/_abstract_model/const';
import { ApiServices } from 'src/app/_abstract_model/services/api.services';
import { Cell } from 'src/app/_abstract_model/types/cell.class';
import { Citizen } from 'src/app/_abstract_model/types/citizen.class';
import { ItemCountShort } from 'src/app/_abstract_model/types/item-count-short.class';
import { Item } from 'src/app/_abstract_model/types/item.class';

@Component({
    selector: 'mho-map-update-cell',
    templateUrl: './map-update-cell.component.html',
    styleUrls: ['./map-update-cell.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class MapUpdateCellComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    @Input() cell!: Cell;
    @Input() citizens!: Citizen[];

    public all_items: Item[] = [];

    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    public readonly locale: string = moment.locale();

    constructor(private api: ApiServices) {

    }

    public ngOnInit(): void {
        this.api.getItems().subscribe((all_items: Item[]) => {
            this.all_items = all_items;
        })
    }


    /**
     * Si l'item est déjà dans la liste, on fait +1
     * Sinon on rajoute l'item à la liste
     *
     * @param {Cell} cell
     * @param {number} item_id
     */
    public addItem(cell: Cell, item_id: number): void {
        if (cell) {
            const item_in_list_index: number | undefined = cell.items.findIndex((item_in_cell: ItemCountShort) => item_in_cell.item_id === item_id);
            if (item_in_list_index !== undefined && item_in_list_index !== null && item_in_list_index > -1) {
                cell.items[item_in_list_index].count++;
            } else {
                let item: Item = <Item>this.all_items.find((item: Item) => item.id === item_id);
                let short_item: ItemCountShort = new ItemCountShort({
                    isItemBroken: item.is_broken,
                    itemCount: 1,
                    itemId: item.id
                })
                cell.items.push(short_item);
                cell.items = [...cell.items];
            }
        }
    }

    /**
     * On retire 1 au compteur de l'item
     * Si l'item tombe à 0, on le retire de la liste
     *
     * @param {Cell} cell
     * @param {number} item_id
     */
    public removeItem(cell: Cell, item_id: number): void {
        if (cell) {
            const item_in_list_index: number | undefined = cell.items.findIndex((item_in_cell: ItemCountShort) => item_in_cell.item_id === item_id);

            if (item_in_list_index !== undefined && item_in_list_index !== null && item_in_list_index > -1 && cell.items[item_in_list_index].count <= 1) {
                cell.items.splice(item_in_list_index, 1);
            } else {
                cell.items[item_in_list_index].count--;
            }
            cell.items = [...cell.items];
        }
    }

    /**
     * On vide complètement les objets de la case
     *
     * @param {Cell} cell
     */
    public emptyItems(cell: Cell): void {
        if (cell) {
            cell.items = [];
        }
    }

}

