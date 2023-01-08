import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';

@Component({
    selector: 'mho-header-with-string-filter',
    templateUrl: './header-with-string-filter.component.html',
    styleUrls: ['./header-with-string-filter.component.scss']
})
export class HeaderWithStringFilterComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input() header!: string;
    @Input() textAlign?: string = 'left';

    @Input() filterValue!: string;
    @Output() filterValueChange: EventEmitter<string> = new EventEmitter<string>();


}

