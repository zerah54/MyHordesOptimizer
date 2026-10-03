import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';

import { WikiComponent } from './wiki.component';

describe('WikiComponent', (): void => {
    let fixture: ComponentFixture<WikiComponent>;
    let router: Router;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [WikiComponent],
            providers: [
                provideRouter([{ path: 'wiki/:section', component: WikiComponent }]),
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' }
            ]
        }).compileComponents();
        router = TestBed.inject(Router);
        fixture = TestBed.createComponent(WikiComponent);
    });

    it('has no tab bar: sections are reached through the side menu, which also carries the Spoil badges', (): void => {
        fixture.detectChanges();

        expect(fixture.debugElement.queryAll(By.css('a[mat-tab-link], nav[mat-tab-nav-bar]')).length).toBe(0);
        expect(fixture.debugElement.query(By.css('.wiki-page router-outlet'))).not.toBeNull();
    });

    it('titles the page after the open section, and follows navigation', async (): Promise<void> => {
        await router.navigateByUrl('/wiki/recipes');
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('mat-card-title')).nativeElement.textContent.trim()).toBe('Recettes');

        await router.navigateByUrl('/wiki/private-towns');
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('mat-card-title')).nativeElement.textContent.trim()).toBe('Villes privées');
    });

    it('falls back to "Wiki" on an url that matches no section', async (): Promise<void> => {
        await router.navigateByUrl('/wiki/unknown-section');
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('mat-card-title')).nativeElement.textContent.trim()).toBe('Wiki');
    });
});
