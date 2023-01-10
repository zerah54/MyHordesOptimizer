import { Component, ElementRef, EventEmitter, HostBinding, Input, Output, ViewChild } from '@angular/core';
import { SelectComponent } from '../../select/select.component';

@Component({
    selector: 'mho-header-with-select-filter',
    templateUrl: './header-with-select-filter.component.html',
    styleUrls: ['./header-with-select-filter.component.scss']
})
export class HeaderWithSelectFilterComponent<T> {
    @HostBinding('style.display') display: string = 'contents';

    @ViewChild('filter') filter!: SelectComponent<T>;

    @Input() header!: string;
    @Input() textAlign?: string = 'left';

    @Input() options: T[] = [];
    @Input() bindLabel: string = 'label';

    @Input() filterValue!: T[];
    @Output() filterValueChange: EventEmitter<T[]> = new EventEmitter<T[]>();


    public visible: boolean = false;

    /** Affiche le filtre */
    public displayFilter() {
        this.visible = true;
        setTimeout(() => {
            this.filter.select.open();
        });
    }

    /** Vérifie si le filtre doit toujours être affiché */
    public checkVisibility() {
        setTimeout(() => {
            if (this.filter.select.panelOpen) {
                this.visible = true;
            } else {
                this.visible = this.filterValue !== null && this.filterValue !== undefined && this.filterValue.length > 0;
            }
        })
    }

}

