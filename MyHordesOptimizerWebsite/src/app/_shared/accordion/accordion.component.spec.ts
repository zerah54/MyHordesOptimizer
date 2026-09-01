import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { AccordionComponent, AccordionItem } from './accordion.component';

function headers(fixture: ComponentFixture<AccordionComponent>): HTMLElement[] {
    return fixture.debugElement.queryAll(By.css('.mho-accordion-item-header')).map((debugEl): HTMLElement => debugEl.nativeElement);
}

function contents(fixture: ComponentFixture<AccordionComponent>): HTMLElement[] {
    return fixture.debugElement.queryAll(By.css('.mho-accordion-item-content')).map((debugEl): HTMLElement => debugEl.nativeElement);
}

function icons(fixture: ComponentFixture<AccordionComponent>): HTMLElement[] {
    return fixture.debugElement.queryAll(By.css('mat-icon')).map((debugEl): HTMLElement => debugEl.nativeElement);
}

function items(fixture: ComponentFixture<AccordionComponent>): HTMLElement[] {
    return fixture.debugElement.queryAll(By.css('.mho-accordion-item')).map((debugEl): HTMLElement => debugEl.nativeElement);
}

describe('AccordionComponent', (): void => {
    let fixture: ComponentFixture<AccordionComponent>;

    const twoItems: AccordionItem[] = [
        { title: 'Titre 1', content: '<b>Contenu 1</b>' },
        { title: 'Titre 2', content: 'Contenu 2' }
    ];

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [AccordionComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(AccordionComponent);
    });

    it('renders one item per entry of the required items input', (): void => {
        fixture.componentRef.setInput('items', twoItems);
        fixture.detectChanges();

        expect(items(fixture).length).toBe(2);
    });

    it('shows the title of each item as text', (): void => {
        fixture.componentRef.setInput('items', twoItems);
        fixture.detectChanges();

        const headerTexts: string[] = headers(fixture).map((el): string => el.childNodes[0].textContent?.trim() ?? '');
        expect(headerTexts[0]).toBe('Titre 1');
        expect(headerTexts[1]).toBe('Titre 2');
    });

    it('renders the content of each item as HTML', (): void => {
        fixture.componentRef.setInput('items', twoItems);
        fixture.detectChanges();

        expect(contents(fixture)[0].innerHTML.trim()).toBe('<b>Contenu 1</b>');
        expect(contents(fixture)[1].innerHTML.trim()).toBe('Contenu 2');
    });

    it('starts with every item collapsed', (): void => {
        fixture.componentRef.setInput('items', twoItems);
        fixture.detectChanges();

        const itemElements: HTMLElement[] = items(fixture);
        expect(itemElements[0].classList.contains('expanded')).toBe(false);
        expect(itemElements[1].classList.contains('expanded')).toBe(false);
        expect(icons(fixture)[0].textContent?.trim()).toBe('chevron_right');
        expect(contents(fixture)[0].style.display).toBe('none');
        expect(itemElements[0].getAttribute('aria-expanded')).toBe('false');
    });

    it('expands an item and shows its content on header click', (): void => {
        fixture.componentRef.setInput('items', twoItems);
        fixture.detectChanges();

        headers(fixture)[0].click();
        fixture.detectChanges();

        expect(items(fixture)[0].classList.contains('expanded')).toBe(true);
        expect(icons(fixture)[0].textContent?.trim()).toBe('expand_more');
        expect(contents(fixture)[0].style.display).toBe('');
        expect(items(fixture)[0].getAttribute('aria-expanded')).toBe('true');
    });

    it('collapses an expanded item on a second header click', (): void => {
        fixture.componentRef.setInput('items', twoItems);
        fixture.detectChanges();

        headers(fixture)[0].click();
        fixture.detectChanges();
        headers(fixture)[0].click();
        fixture.detectChanges();

        expect(items(fixture)[0].classList.contains('expanded')).toBe(false);
        expect(icons(fixture)[0].textContent?.trim()).toBe('chevron_right');
        expect(contents(fixture)[0].style.display).toBe('none');
    });

    it('collapses the previously expanded item when another one is expanded (single-open accordion)', (): void => {
        fixture.componentRef.setInput('items', twoItems);
        fixture.detectChanges();

        headers(fixture)[0].click();
        fixture.detectChanges();
        headers(fixture)[1].click();
        fixture.detectChanges();

        expect(items(fixture)[0].classList.contains('expanded')).toBe(false);
        expect(items(fixture)[1].classList.contains('expanded')).toBe(true);
    });

    it('assigns index-based ids and aria attributes linking header and content', (): void => {
        fixture.componentRef.setInput('items', twoItems);
        fixture.detectChanges();

        const itemElements: HTMLElement[] = items(fixture);
        expect(itemElements[0].getAttribute('id')).toBe('accordion-header-0');
        expect(itemElements[0].getAttribute('aria-controls')).toBe('accordion-body-0');
        expect(contents(fixture)[0].getAttribute('id')).toBe('accordion-body-0');
        expect(contents(fixture)[0].getAttribute('aria-labelledby')).toBe('accordion-header-0');
        expect(itemElements[1].getAttribute('id')).toBe('accordion-header-1');
    });
});
