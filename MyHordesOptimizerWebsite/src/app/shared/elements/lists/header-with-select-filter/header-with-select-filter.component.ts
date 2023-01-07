import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';

@Component({
    selector: 'mho-header-with-select-filter',
    templateUrl: './header-with-select-filter.component.html',
    styleUrls: ['./header-with-select-filter.component.scss']
})
export class HeaderWithSelectFilterComponent<T> {
    @HostBinding('style.display') display: string = 'contents';

    @Input() header!: string;
    @Input() textAlign?: string = 'left';

    @Input() filterValue!: T | T[];
    @Output() filterValueChange: EventEmitter<T | T[]> = new EventEmitter<T | T[]>();


}

