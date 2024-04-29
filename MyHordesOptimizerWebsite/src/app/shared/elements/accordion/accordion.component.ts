import { CdkAccordionModule } from '@angular/cdk/accordion';
import { CommonModule } from '@angular/common';
import { Component, HostBinding, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Imports } from '../../../_abstract_model/types/_types';

const angular_common: Imports = [CommonModule];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [CdkAccordionModule, MatIconModule];

@Component({
    selector: 'mho-accordion',
    templateUrl: './accordion.component.html',
    styleUrls: ['./accordion.component.scss'],
    standalone: true,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class AccordionComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input() items: AccordionItem[] = [];
}

export interface AccordionItem {
    title: string;
    content: string;
}
