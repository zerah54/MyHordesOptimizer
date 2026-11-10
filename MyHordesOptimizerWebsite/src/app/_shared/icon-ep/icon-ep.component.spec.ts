import 'moment/locale/de';
import 'moment/locale/en-gb';
import 'moment/locale/es';
import 'moment/locale/fr';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import moment from 'moment';

import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { IconEpComponent } from './icon-ep.component';

// Charger un fichier de langue de moment en fait la langue globale (effet de bord de defineLocale) : on rend
// la langue par défaut, sinon elle fuit vers les fichiers de test suivants (Vitest tourne en mode non isolé)
// et dépend de l'ordre de chargement des modules.
moment.locale('en');

describe('IconEpComponent', (): void => {
    let fixture: ComponentFixture<IconEpComponent>;
    let originalLocale: string;

    beforeEach(async (): Promise<void> => {
        originalLocale = moment.locale();
        await TestBed.configureTestingModule({
            imports: [IconEpComponent]
        }).compileComponents();
    });

    afterEach((): void => {
        moment.locale(originalLocale);
    });

    it('renders the image at its native size', (): void => {
        fixture = TestBed.createComponent(IconEpComponent);
        fixture.detectChanges();

        const img: HTMLImageElement = fixture.debugElement.query(By.css('img')).nativeElement;
        expect(img.hasAttribute('width')).toBe(false);
        expect(img.hasAttribute('height')).toBe(false);
    });

    it('renders the value right against the image, with no space', (): void => {
        fixture = TestBed.createComponent(IconEpComponent);
        fixture.componentRef.setInput('value', 3);
        fixture.detectChanges();

        const img: HTMLImageElement = fixture.debugElement.query(By.css('img')).nativeElement;
        expect(img.previousSibling?.textContent).toBe('3');
    });

    it('renders only the image without a value', (): void => {
        fixture = TestBed.createComponent(IconEpComponent);
        fixture.detectChanges();

        expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('');
        expect(fixture.debugElement.query(By.css('img'))).not.toBeNull();
    });

    it('uses the unsuffixed icon for the German locale', (): void => {
        moment.locale('de');
        fixture = TestBed.createComponent(IconEpComponent);
        fixture.detectChanges();

        const img: HTMLImageElement = fixture.debugElement.query(By.css('img')).nativeElement;
        expect(img.src).toContain(`${HORDES_IMG_REPO}icons/sp_small.gif`);
        expect(img.src).not.toContain('sp_small_de');
    });

    it('suffixes the icon with the locale for a non-German locale', (): void => {
        moment.locale('fr');
        fixture = TestBed.createComponent(IconEpComponent);
        fixture.detectChanges();

        const img: HTMLImageElement = fixture.debugElement.query(By.css('img')).nativeElement;
        expect(img.src).toContain(`${HORDES_IMG_REPO}icons/sp_small_fr.gif`);
    });
});
