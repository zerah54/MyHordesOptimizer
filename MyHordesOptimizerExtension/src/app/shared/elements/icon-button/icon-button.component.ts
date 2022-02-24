import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';

/** Le bouton est un bouton utilisant une icône font-awesome et sans aucun texte */
@Component({
    selector: 'mho-icon-button',
    templateUrl: './icon-button.component.html',
    styleUrls: ['./icon-button.component.scss']
})
export class IconButtonComponent {

    @Input() icon!: IconDefinition;
    @Input() color: string | 'unset' = 'unset';

    @Output() action: EventEmitter<void> = new EventEmitter<void>();

    sendAction(): void {
        this.action.emit();
    }

}
