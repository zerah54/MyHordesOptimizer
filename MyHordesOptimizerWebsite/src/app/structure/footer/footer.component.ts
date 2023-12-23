import { NgTemplateOutlet } from '@angular/common';
import { Component, HostBinding, inject, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatToolbar, MatToolbarModule } from '@angular/material/toolbar';
import { ThanksComponent } from '../../thanks/thanks.component';

@Component({
    selector: 'mho-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [MatToolbarModule, NgTemplateOutlet]
})
export class FooterComponent {
    @HostBinding('style.display') display: string = 'contents';

    @ViewChild(MatToolbar) mat_toolbar!: MatToolbar;

    private dialog: MatDialog = inject(MatDialog);

    public openThanks(): void {
        this.dialog.open(ThanksComponent, {
            width: '50%',
            minWidth: '250px',
        });
    }
}
