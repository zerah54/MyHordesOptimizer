import { NgIf } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostBinding, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
    selector: 'mho-header-with-number-previous-next-filter',
    templateUrl: './header-with-number-previous-next-filter.component.html',
    styleUrls: ['./header-with-number-previous-next-filter.component.scss'],
    standalone: true,
    imports: [NgIf, MatIconModule, MatFormFieldModule, MatButtonModule, MatInputModule, FormsModule]
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

