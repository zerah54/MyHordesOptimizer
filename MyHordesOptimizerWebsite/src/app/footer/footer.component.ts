import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'mho-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class FooterComponent {
    @ViewChild(MatToolbar) mat_toolbar!: MatToolbar;

    public title: string = '';

    public constructor(private title_service: Title) {
        this.title = this.title_service.getTitle();
    }
}

