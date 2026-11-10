import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { PageTitleComponent } from './page-title.component';

describe('PageTitleComponent', (): void => {
    let fixture: ComponentFixture<PageTitleComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({ imports: [PageTitleComponent] }).compileComponents();
        fixture = TestBed.createComponent(PageTitleComponent);
    });

    it('affiche le libellé de la page, sans image tant que son icône n\'est pas définie', (): void => {
        fixture.componentRef.setInput('page', 'townBank');
        fixture.detectChanges();

        expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('Banque');
        expect(fixture.debugElement.query(By.css('img'))).toBeNull();
    });
});
