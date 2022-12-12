import { Component, HostBinding, Input } from '@angular/core';

@Component({
    selector: 'mho-accordion',
    templateUrl: './accordion.component.html',
    styleUrls: ['./accordion.component.scss']
})
export class AccordionComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input() items: AccordionItem[] = [];
}

export interface AccordionItem {
    title: string;
    content: string;
}
