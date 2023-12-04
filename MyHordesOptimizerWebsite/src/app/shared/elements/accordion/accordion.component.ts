import { CdkAccordionModule } from '@angular/cdk/accordion';
import { CommonModule } from '@angular/common';
import { Component, HostBinding, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'mho-accordion',
    templateUrl: './accordion.component.html',
    styleUrls: ['./accordion.component.scss'],
    standalone: true,
    imports: [CdkAccordionModule, CommonModule, MatIconModule]
})
export class AccordionComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input() items: AccordionItem[] = [];
}

export interface AccordionItem {
    title: string;
    content: string;
}
