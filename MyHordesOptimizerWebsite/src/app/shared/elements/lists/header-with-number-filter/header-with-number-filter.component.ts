import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';

@Component({
    selector: 'mho-header-with-number-filter',
    templateUrl: './header-with-number-filter.component.html',
    styleUrls: ['./header-with-number-filter.component.scss']
})
export class HeaderWithNumberFilterComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input() header!: string;
    @Input() textAlign?: string = 'left';

    @Input() filterValue!: number | string;
    @Output() filterValueChange: EventEmitter<number | string> = new EventEmitter<number | string>();


}

