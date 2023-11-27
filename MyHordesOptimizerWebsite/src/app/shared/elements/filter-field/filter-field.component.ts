import { Component, EventEmitter, HostBinding, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
    selector: 'mho-filter',
    templateUrl: './filter-field.component.html',
    styleUrls: ['./filter-field.component.scss'],
    standalone: true,
    imports: [MatFormFieldModule, MatInputModule, FormsModule]
})
export class FilterFieldComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Output() filterChange: EventEmitter<string> = new EventEmitter<string>();

    public filter_value: string = '';

    public applyFilter(value: string): void {
        this.filterChange.next(value);
    }
}

