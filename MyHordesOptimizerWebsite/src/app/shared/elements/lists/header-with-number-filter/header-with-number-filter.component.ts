import { Component, ElementRef, EventEmitter, HostBinding, Input, Output, ViewChild } from '@angular/core';

@Component({
    selector: 'mho-header-with-number-filter',
    templateUrl: './header-with-number-filter.component.html',
    styleUrls: ['./header-with-number-filter.component.scss']
})
export class HeaderWithNumberFilterComponent {
    @HostBinding('style.display') display: string = 'contents';

    @ViewChild('filter') filter!: ElementRef<HTMLInputElement>;

    @Input() header!: string;
    @Input() textAlign?: string = 'left';

    @Input() filterValue!: number | string;
    @Output() filterValueChange: EventEmitter<number | string> = new EventEmitter<number | string>();


    public visible: boolean = false;

    /** Affiche le filtre */
    public displayFilter() {
        this.visible = true;
        setTimeout(() => {
            this.filter.nativeElement.focus();
        });
    }

    /** Vérifie si le filtre doit toujours être affiché */
    public checkVisibility() {
        this.visible = this.filterValue !== '' && this.filterValue !== null && this.filterValue !== undefined;
    }
}

