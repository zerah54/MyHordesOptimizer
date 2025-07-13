import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatToolbar, MatToolbarModule } from '@angular/material/toolbar';
import { environment } from '../../../environments/environment';
import { Imports } from '../../_abstract_model/types/_types';
import { ThanksComponent } from '../../thanks/thanks.component';

const angular_common: Imports = [NgTemplateOutlet];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatToolbarModule];

@Component({
    selector: 'mho-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    encapsulation: ViewEncapsulation.None,
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class FooterComponent {

    @ViewChild(MatToolbar) mat_toolbar!: MatToolbar;

    public readonly myhordes_url: string = environment.myhordes_url;

    private dialog: MatDialog = inject(MatDialog);

    public openThanks(): void {
        this.dialog.open(ThanksComponent, {
            width: '50%',
            minWidth: '250px',
        });
    }
}
