import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { environment } from '../../../environments/environment';
import { AvatarComponent } from './avatar.component';

function picture(fixture: ComponentFixture<AvatarComponent>): HTMLElement | null {
    return fixture.debugElement.query(By.css('picture'))?.nativeElement ?? null;
}

function img(fixture: ComponentFixture<AvatarComponent>): HTMLImageElement | null {
    return fixture.debugElement.query(By.css('img'))?.nativeElement ?? null;
}

describe('AvatarComponent', (): void => {
    let fixture: ComponentFixture<AvatarComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [AvatarComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(AvatarComponent);
    });

    it('renders nothing when src is not set', (): void => {
        fixture.detectChanges();

        expect(picture(fixture)).toBeNull();
    });

    it('renders nothing when src is the string "False" returned by the API for players without an avatar', (): void => {
        fixture.componentRef.setInput('src', 'False');
        fixture.detectChanges();

        expect(picture(fixture)).toBeNull();
    });

    it('prefixes a relative path with the MyHordes base URL', (): void => {
        fixture.componentRef.setInput('src', '/storage/avatar1.png');
        fixture.detectChanges();

        expect(img(fixture)?.getAttribute('src')).toBe(`${environment.myhordes_url.replace(/\/$/, '')}/storage/avatar1.png`);
    });

    it('leaves an absolute URL untouched', (): void => {
        fixture.componentRef.setInput('src', 'http://legacy.example.com/avatar.jpg');
        fixture.detectChanges();

        expect(img(fixture)?.getAttribute('src')).toBe('http://legacy.example.com/avatar.jpg');
    });

    it('sets an empty alt attribute on the image', (): void => {
        fixture.componentRef.setInput('src', '/storage/avatar1.png');
        fixture.detectChanges();

        expect(img(fixture)?.getAttribute('alt')).toBe('');
    });

    it('does not apply the rounded class by default', (): void => {
        fixture.componentRef.setInput('src', '/storage/avatar1.png');
        fixture.detectChanges();

        expect(picture(fixture)?.classList.contains('rounded')).toBe(false);
    });

    it('applies the rounded class when rounded is true', (): void => {
        fixture.componentRef.setInput('src', '/storage/avatar1.png');
        fixture.componentRef.setInput('rounded', true);
        fixture.detectChanges();

        expect(picture(fixture)?.classList.contains('rounded')).toBe(true);
    });

    it('treats the literal string "false" as false through the booleanAttribute transform', (): void => {
        fixture.componentRef.setInput('src', '/storage/avatar1.png');
        fixture.componentRef.setInput('rounded', 'false');
        fixture.detectChanges();

        expect(picture(fixture)?.classList.contains('rounded')).toBe(false);
    });

    it('treats an empty string as true through the booleanAttribute transform (HTML boolean attribute semantics)', (): void => {
        fixture.componentRef.setInput('src', '/storage/avatar1.png');
        fixture.componentRef.setInput('rounded', '');
        fixture.detectChanges();

        expect(picture(fixture)?.classList.contains('rounded')).toBe(true);
    });

    it('leaves the size custom property unset so the stylesheet default applies', (): void => {
        fixture.componentRef.setInput('src', '/storage/avatar1.png');
        fixture.detectChanges();

        expect(fixture.nativeElement.style.getPropertyValue('--mho-avatar-size')).toBe('');
    });

    it('exposes the requested size as a pixel custom property', (): void => {
        fixture.componentRef.setInput('src', '/storage/avatar1.png');
        fixture.componentRef.setInput('size', 26);
        fixture.detectChanges();

        expect(fixture.nativeElement.style.getPropertyValue('--mho-avatar-size')).toBe('26px');
    });

    it('collapses the host when there is no avatar to show, so no space is reserved', (): void => {
        fixture.detectChanges();

        expect(fixture.nativeElement.classList.contains('is-empty')).toBe(true);
    });

    it('does not collapse the host once an avatar is shown', (): void => {
        fixture.componentRef.setInput('src', '/storage/avatar1.png');
        fixture.detectChanges();

        expect(fixture.nativeElement.classList.contains('is-empty')).toBe(false);
    });

    it('drops the broken image and collapses the host when the avatar fails to load', (): void => {
        fixture.componentRef.setInput('src', 'https://staging.example.com/cdn/avatars/93.webp');
        fixture.detectChanges();

        img(fixture)?.dispatchEvent(new Event('error'));
        fixture.detectChanges();

        expect(picture(fixture)).toBeNull();
        expect(fixture.nativeElement.classList.contains('is-empty')).toBe(true);
    });

    it('shows the avatar again when src changes after a load failure', (): void => {
        fixture.componentRef.setInput('src', 'https://staging.example.com/cdn/avatars/93.webp');
        fixture.detectChanges();
        img(fixture)?.dispatchEvent(new Event('error'));
        fixture.detectChanges();

        fixture.componentRef.setInput('src', '/storage/avatar1.png');
        fixture.detectChanges();

        expect(img(fixture)?.getAttribute('src')).toBe(`${environment.myhordes_url.replace(/\/$/, '')}/storage/avatar1.png`);
    });
});
