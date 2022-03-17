import { Component, Input } from '@angular/core';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';

/** Le tooltip est un icone affichant un message au survol */
@Component({
    selector: 'mho-tooltip-icon',
    templateUrl: './tooltip-icon.component.html',
    styleUrls: ['./tooltip-icon.component.scss']
})
export class TooltipIconComponent {

    @Input() icon!: IconDefinition;
    @Input() text!: string;
}
