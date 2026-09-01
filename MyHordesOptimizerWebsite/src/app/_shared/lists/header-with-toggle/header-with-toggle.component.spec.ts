import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTooltip } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { HeaderWithToggleComponent } from './header-with-toggle.component';

describe('HeaderWithToggleComponent', (): void => {
    let fixture: ComponentFixture<HeaderWithToggleComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [HeaderWithToggleComponent],
            providers: [provideNoopAnimations()]
        }).compileComponents();
        fixture = TestBed.createComponent(HeaderWithToggleComponent);
        fixture.componentRef.setInput('filterValue', null);
    });

    /** Clique sur le libellé du bouton du groupe correspondant à `label` (« Tous »/« Oui »/« Non »). */
    function clickToggle(label: string): void {
        const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('.mat-button-toggle-button'));
        const button: HTMLButtonElement | undefined = buttons.find((candidate: HTMLButtonElement) => candidate.textContent?.trim() === label);
        button?.click();
        fixture.detectChanges();
    }

    it('renders the header text by default', (): void => {
        fixture.componentRef.setInput('header', 'Poids');
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('img.header-icon'))).toBeNull();
        expect(fixture.debugElement.query(By.css('mat-icon.header-icon'))).toBeNull();
        expect(fixture.nativeElement.textContent).toContain('Poids');
    });

    it('renders a sprite image (headerImg) instead of the text header, with alt/tooltip from headerTooltip', (): void => {
        fixture.componentRef.setInput('header', 'Poids');
        fixture.componentRef.setInput('headerImg', 'icons/weight.gif');
        fixture.componentRef.setInput('headerTooltip', 'Poids en kg');
        fixture.detectChanges();

        const img: HTMLImageElement = fixture.debugElement.query(By.css('img.header-icon')).nativeElement;
        expect(img.src).toContain(HORDES_IMG_REPO + 'icons/weight.gif');
        expect(img.alt).toBe('Poids en kg');
        const tooltip: MatTooltip = fixture.debugElement.query(By.css('img.header-icon')).injector.get(MatTooltip);
        expect(tooltip.message).toBe('Poids en kg');
    });

    it('falls back to the header text for the sprite alt when no headerTooltip is provided', (): void => {
        fixture.componentRef.setInput('header', 'Poids');
        fixture.componentRef.setInput('headerImg', 'icons/weight.gif');
        fixture.detectChanges();

        const img: HTMLImageElement = fixture.debugElement.query(By.css('img.header-icon')).nativeElement;
        expect(img.alt).toBe('Poids');
    });

    it('renders a Material icon (headerIconName) when no headerImg is provided', (): void => {
        fixture.componentRef.setInput('headerIconName', 'star');
        fixture.componentRef.setInput('headerTooltip', 'Favori');
        fixture.detectChanges();

        const icon = fixture.debugElement.query(By.css('mat-icon.header-icon'));
        expect(icon.nativeElement.textContent.trim()).toBe('star');
        const tooltip: MatTooltip = icon.injector.get(MatTooltip);
        expect(tooltip.message).toBe('Favori');
    });

    it('prefers headerImg over headerIconName when both are provided', (): void => {
        fixture.componentRef.setInput('headerImg', 'icons/weight.gif');
        fixture.componentRef.setInput('headerIconName', 'star');
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('img.header-icon'))).toBeTruthy();
        expect(fixture.debugElement.query(By.css('mat-icon.header-icon'))).toBeNull();
    });

    it('applies textAlign to the header container style', (): void => {
        fixture.componentRef.setInput('textAlign', 'center');
        fixture.detectChanges();

        const container: HTMLElement = fixture.debugElement.query(By.css('.mho-header-with-toggle > div')).nativeElement;
        expect(container.style.textAlign).toBe('center');
    });

    it('shows the filter icon and hides the toggle group by default (filterValue null, not opened)', (): void => {
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('.open-menu-icon'))).toBeTruthy();
        expect(fixture.debugElement.query(By.css('.toggle-filter'))).toBeNull();
    });

    it('hides the filter icon and shows the toggle group when filterValue is already set', (): void => {
        fixture.componentRef.setInput('filterValue', true);
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('.open-menu-icon'))).toBeNull();
        expect(fixture.debugElement.query(By.css('.toggle-filter'))).toBeTruthy();
    });

    it('opens the toggle group and hides the filter icon when the filter icon is clicked', (): void => {
        fixture.detectChanges();

        fixture.debugElement.query(By.css('.open-menu-icon')).nativeElement.click();
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('.toggle-filter'))).toBeTruthy();
        expect(fixture.debugElement.query(By.css('.open-menu-icon'))).toBeNull();
    });

    it('stops propagation of the filter icon click', (): void => {
        fixture.detectChanges();
        const parentClickSpy = jasmine.createSpy('parentClick');
        fixture.nativeElement.addEventListener('click', parentClickSpy);

        fixture.debugElement.query(By.css('.open-menu-icon')).nativeElement.click();

        expect(parentClickSpy).not.toHaveBeenCalled();
    });

    it('emits filterValueChange(true) when "Oui" is selected, and keeps the toggle group visible', (): void => {
        fixture.detectChanges();
        const emitted: (boolean | null)[] = [];
        fixture.componentInstance.filterValueChange.subscribe((value: boolean | null) => emitted.push(value));

        fixture.debugElement.query(By.css('.open-menu-icon')).nativeElement.click();
        fixture.detectChanges();
        clickToggle('Oui');

        expect(emitted).toEqual([true]);
        expect(fixture.debugElement.query(By.css('.toggle-filter'))).toBeTruthy();
    });

    it('emits filterValueChange(false) when "Non" is selected, and keeps the toggle group visible', (): void => {
        fixture.detectChanges();
        const emitted: (boolean | null)[] = [];
        fixture.componentInstance.filterValueChange.subscribe((value: boolean | null) => emitted.push(value));

        fixture.debugElement.query(By.css('.open-menu-icon')).nativeElement.click();
        fixture.detectChanges();
        clickToggle('Non');

        expect(emitted).toEqual([false]);
        expect(fixture.debugElement.query(By.css('.toggle-filter'))).toBeTruthy();
    });

    it('emits filterValueChange(null) when "Tous" is selected, but the toggle group stays visible until the parent feeds filterValue back to null', (): void => {
        fixture.componentRef.setInput('filterValue', true);
        fixture.detectChanges();
        const emitted: (boolean | null)[] = [];
        fixture.componentInstance.filterValueChange.subscribe((value: boolean | null) => emitted.push(value));

        clickToggle('Tous');

        expect(emitted).toEqual([null]);
        // filterValue() n'a pas été remis à jour par ce test (pas de vraie liaison bidirectionnelle ici) :
        // le groupe reste affiché car filterValue() vaut toujours `true`.
        expect(fixture.debugElement.query(By.css('.toggle-filter'))).toBeTruthy();
    });

    it('hides the toggle group and shows the filter icon again once the parent feeds filterValue back to null', (): void => {
        fixture.componentRef.setInput('filterValue', true);
        fixture.detectChanges();
        fixture.componentInstance.filterValueChange.subscribe((value: boolean | null) => fixture.componentRef.setInput('filterValue', value));

        clickToggle('Tous');
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('.toggle-filter'))).toBeNull();
        expect(fixture.debugElement.query(By.css('.open-menu-icon'))).toBeTruthy();
    });
});
