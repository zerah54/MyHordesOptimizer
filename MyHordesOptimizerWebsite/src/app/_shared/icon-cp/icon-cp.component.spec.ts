import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import moment from 'moment';

import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { IconCpComponent } from './icon-cp.component';

describe('IconCpComponent', (): void => {
    let fixture: ComponentFixture<IconCpComponent>;
    let originalLocale: string;

    beforeEach(async (): Promise<void> => {
        originalLocale = moment.locale();
        await TestBed.configureTestingModule({
            imports: [IconCpComponent]
        }).compileComponents();
    });

    afterEach((): void => {
        moment.locale(originalLocale);
    });

    it('renders a single 16x16 image', (): void => {
        fixture = TestBed.createComponent(IconCpComponent);
        fixture.detectChanges();

        const img: HTMLImageElement = fixture.debugElement.query(By.css('img')).nativeElement;
        expect(img.width).toBe(16);
        expect(img.height).toBe(16);
    });

    it('uses the unsuffixed icon for the German locale', (): void => {
        moment.locale('de');
        fixture = TestBed.createComponent(IconCpComponent);
        fixture.detectChanges();

        const img: HTMLImageElement = fixture.debugElement.query(By.css('img')).nativeElement;
        expect(img.src).toContain(`${HORDES_IMG_REPO}icons/bp_small.gif`);
        expect(img.src).not.toContain('bp_small_de');
    });

    it('suffixes the icon with the locale for a non-German locale', (): void => {
        moment.locale('fr');
        fixture = TestBed.createComponent(IconCpComponent);
        fixture.detectChanges();

        const img: HTMLImageElement = fixture.debugElement.query(By.css('img')).nativeElement;
        expect(img.src).toContain(`${HORDES_IMG_REPO}icons/bp_small_fr.gif`);
    });
});
