import { CdkAccordionModule } from '@angular/cdk/accordion';
import { NgFor } from '@angular/common';
import { Component, HostBinding, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'mho-accordion',
    templateUrl: './accordion.component.html',
    styleUrls: ['./accordion.component.scss'],
    standalone: true,
    imports: [CdkAccordionModule, NgFor, MatIconModule]
})
export class AccordionComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input() items: AccordionItem[] = [];
}

export interface AccordionItem {
    title: string;
    content: string;
}
