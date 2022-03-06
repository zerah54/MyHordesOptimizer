import { DOCUMENT } from '@angular/common';
import { Component, Inject, Input } from '@angular/core';
import { browser } from 'webextension-polyfill-ts';
import { MH_TOOLTIP_CONTAINER_ID } from './../../const';

@Component({
    selector: 'mho-help-button',
    templateUrl: './help-button.component.html',
    styleUrls: ['./help-button.component.scss']
})
export class HelpButtonComponent {
    @Input() message!: string;

    public readonly HELP: string = browser.i18n.getMessage('HELP');

    constructor(@Inject(DOCUMENT) private document: Document) {
    }

    public showHelp(): void {
        let tooltip_container: HTMLDivElement | null = this.document.querySelector(`#${MH_TOOLTIP_CONTAINER_ID}`);
        if (tooltip_container) {
            tooltip_container.innerHTML = `<mho-help-tooltip [message]="${this.message}"></mho-help-tooltip>`;
        }
    }

    public hideHelp(): void {
        let tooltip_container: HTMLDivElement | null = this.document.querySelector(`#${MH_TOOLTIP_CONTAINER_ID}`);
        if (tooltip_container) {
            tooltip_container.innerHTML = '';
        }
    }
}
