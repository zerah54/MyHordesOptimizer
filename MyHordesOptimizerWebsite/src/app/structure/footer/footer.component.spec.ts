import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';

import { environment } from '../../../environments/environment';
import { ThanksComponent } from '../../thanks/thanks.component';
import { FooterComponent } from './footer.component';

describe('FooterComponent', (): void => {
    let fixture: ComponentFixture<FooterComponent>;
    let dialog: jasmine.SpyObj<MatDialog>;

    beforeEach(async (): Promise<void> => {
        dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

        await TestBed.configureTestingModule({
            imports: [FooterComponent],
            providers: [{ provide: MatDialog, useValue: dialog }]
        }).compileComponents();
        fixture = TestBed.createComponent(FooterComponent);
        fixture.detectChanges();
    });

    it('links to the MyHordes profile using the configured MyHordes URL', (): void => {
        const link: HTMLAnchorElement = fixture.debugElement.query(By.css('a[href*="jx/soul/6042"]')).nativeElement;

        expect(link.getAttribute('href')).toBe(`${environment.myhordes_url}jx/soul/6042`);
    });

    it('opens the thanks dialog when the "Remerciements" link is clicked', (): void => {
        const links: HTMLAnchorElement[] = fixture.debugElement.queryAll(By.css('a')).map((debugEl: DebugElement) => debugEl.nativeElement);
        const thanksLink: HTMLAnchorElement | undefined = links.find((link: HTMLAnchorElement) => link.textContent?.trim() === 'Remerciements');

        thanksLink?.click();

        expect(dialog.open).toHaveBeenCalledOnceWith(ThanksComponent, { width: '50%', minWidth: '250px' });
    });
});
