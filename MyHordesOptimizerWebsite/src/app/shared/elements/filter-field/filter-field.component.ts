import { Component, EventEmitter, HostBinding, Output } from '@angular/core';

@Component({
    selector: 'mho-filter',
    templateUrl: './filter-field.component.html',
    styleUrls: ['./filter-field.component.scss']
})
export class FilterFieldComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Output() filterChange: EventEmitter<string> = new EventEmitter<string>();

    public filter_value: string = '';

    public applyFilter(value: string): void {
        this.filterChange.next(value);
    }
}

