import { CdkAccordionModule } from '@angular/cdk/accordion';
import { CommonModule } from '@angular/common';
import { Component, input, InputSignal } from '@angular/core';
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
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class AccordionComponent {

    public items: InputSignal<AccordionItem[]> = input.required();
}

export interface AccordionItem {
    title: string;
    content: string;
}
