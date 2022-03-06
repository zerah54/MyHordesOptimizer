import { Component, Input } from '@angular/core';

@Component({
    selector: 'mho-help-tooltip',
    templateUrl: './help-tooltip.component.html',
    styleUrls: ['./help-tooltip.component.scss']
})
export class HelpTooltipComponent {
    @Input() message!: string;

}
