import { Component, ElementRef, EventEmitter, HostBinding, Input, OnInit, Output, ViewChild } from '@angular/core';

@Component({
    selector: 'mho-header-with-number-previous-next-filter',
    templateUrl: './header-with-number-previous-next-filter.component.html',
    styleUrls: ['./header-with-number-previous-next-filter.component.scss']
})
export class HeaderWithNumberPreviousNextFilterComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    @ViewChild('filter') filter!: ElementRef<HTMLInputElement>;

    @Input() header!: string;
    @Input() textAlign?: string = 'left';

    @Input() min: number = 1;
    @Input() max: number = 1;

    @Input() filterValue!: number;
    @Output() filterValueChange: EventEmitter<number> = new EventEmitter<number>();

    public visible: boolean = false;

    public ngOnInit(): void {
        this.checkVisibility();
    }

    /** Affiche le filtre */
    public displayFilter(): void {
        this.visible = true;
        setTimeout(() => {
            this.filter.nativeElement.focus();
        });
    }

    /** Vérifie si le filtre doit toujours être affiché */
    public checkVisibility(): void {
        this.visible = this.filterValue !== null && this.filterValue !== undefined;
    }
}

