import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSidenavContainer } from '@angular/material/sidenav';
import { of } from 'rxjs';

import { AdminService } from '../../_abstract_model/services/admin.service';
import { TownContextService } from '../../_core/services/town-context.service';
import { MenuComponent } from './menu.component';

interface SidenavLink {
    label: string;
    path?: string;
    townSuffix?: string;
    isTownRoot?: boolean;
    returnHome?: boolean;
    children?: SidenavLink[];
    displayed: boolean;
    authorized: () => boolean;
    expanded?: boolean;
    spoil: boolean;
}

interface Theme {
    label: string;
    class: string;
}

interface TestableComponent {
    selected_theme: { (): Theme | undefined };
    site_language: { code: string; label: string; default?: boolean } | undefined;
    routes: SidenavLink[];
    sidenavContainer: { set(value: MatSidenavContainer): void };
    ngOnInit(): void;
    changeTheme(theme: Theme): void;
    changeLanguage(language: { code: string; label: string }): void;
    toggleDisplayChildren(route: SidenavLink): void;
    resolvePath(route: SidenavLink): string | undefined;
    resolveLabel(route: SidenavLink): string;
    reloadPage(): void;
}

describe('MenuComponent', (): void => {
    let component: MenuComponent;
    let fixture: ComponentFixture<MenuComponent>;
    let testable: TestableComponent;
    let townContext: TownContextService;

    beforeEach(async (): Promise<void> => {
        localStorage.clear();
        // `changeTheme`/`changeLanguage`/`resizeSidenav` planifient un `setTimeout` : avec un timer réel,
        // le callback peut s'exécuter après le teardown Jasmine (spies restaurés) et déclencher un vrai
        // rechargement de page pendant un AUTRE test. Horloge falsifiée pour rester synchrone.
        jasmine.clock().install();
        await TestBed.configureTestingModule({
            imports: [MenuComponent],
            providers: [provideHttpClient(), provideHttpClientTesting()]
        }).compileComponents();

        fixture = TestBed.createComponent(MenuComponent);
        component = fixture.componentInstance;
        testable = component as unknown as TestableComponent;
        testable.sidenavContainer.set({ autosize: false } as unknown as MatSidenavContainer);
        townContext = TestBed.inject(TownContextService);
        spyOn(TestBed.inject(AdminService), 'checkIsAdmin').and.returnValue(of(false));
        // `changeTheme`/`changeLanguage` planifient `this.document.location.reload()` : `location.reload`
        // n'est ni espionnable ni redéfinissable sous Chrome Headless (voir header.component.spec.ts).
        spyOn(testable, 'reloadPage' as never);
    });

    afterEach((): void => {
        jasmine.clock().tick(1);
        jasmine.clock().uninstall();
        localStorage.clear();
    });

    describe('changeTheme', (): void => {
        it('sets the selected theme and persists the choice', (): void => {
            const theme: Theme = { label: 'Rose', class: 'pink' };

            testable.changeTheme(theme);
            jasmine.clock().tick(1);

            expect(testable.selected_theme()).toBe(theme);
            expect(localStorage.getItem('theme')).toBe('pink');
            expect(testable.reloadPage).toHaveBeenCalled();
        });
    });

    describe('changeLanguage', (): void => {
        it('sets the selected language and persists the choice', (): void => {
            const language: { code: string; label: string } = { code: 'de', label: 'Deutsch' };

            testable.changeLanguage(language);
            jasmine.clock().tick(1);

            expect(testable.site_language).toBe(language as never);
            expect(localStorage.getItem('mho-locale')).toBe('de');
            expect(testable.reloadPage).toHaveBeenCalled();
        });
    });

    describe('toggleDisplayChildren', (): void => {
        it('propagates the expanded state to displayed children, collapsing their own children', (): void => {
            const grandchild: SidenavLink = { label: 'gc', displayed: true, expanded: true, authorized: (): boolean => true, spoil: false };
            const child: SidenavLink = {
                label: 'c', displayed: true, expanded: false, authorized: (): boolean => true, spoil: false,
                children: [grandchild]
            };
            const route: SidenavLink = { label: 'r', displayed: true, expanded: true, authorized: (): boolean => true, spoil: false, children: [child] };

            testable.toggleDisplayChildren(route);
            jasmine.clock().tick(1);

            expect(child.displayed).toBe(true);
            expect(grandchild.displayed).toBe(false);
            expect(grandchild.expanded).toBe(false);
        });

        it('does nothing when the route has no children', (): void => {
            const route: SidenavLink = { label: 'r', displayed: true, authorized: (): boolean => true, spoil: false, children: [] };

            expect((): void => testable.toggleDisplayChildren(route)).not.toThrow();
        });
    });

    describe('resolvePath', (): void => {
        it('returns the town-relative path for a townSuffix route, prefixed by "my-town" outside observer mode', (): void => {
            spyOn(townContext, 'observedTown').and.returnValue(null);
            const route: SidenavLink = { label: 'Banque', townSuffix: 'bank', displayed: true, authorized: (): boolean => true, spoil: false };

            expect(testable.resolvePath(route)).toBe('my-town/bank');
        });

        it('returns the plain path for a route with no townSuffix/returnHome', (): void => {
            const route: SidenavLink = { label: 'Camping', path: 'tools/camping', displayed: true, authorized: (): boolean => true, spoil: false };

            expect(testable.resolvePath(route)).toBe('tools/camping');
        });
    });

    describe('resolveLabel', (): void => {
        it('returns the plain label when not observing a town', (): void => {
            spyOn(townContext, 'isReadonly').and.returnValue(false);
            const route: SidenavLink = { label: 'Ma ville', isTownRoot: true, displayed: true, authorized: (): boolean => true, spoil: false };

            expect(testable.resolveLabel(route)).toBe('Ma ville');
        });

        it('returns the observed town name when in observer mode for the town-root route', (): void => {
            spyOn(townContext, 'isReadonly').and.returnValue(true);
            spyOn(townContext, 'observedTownName').and.returnValue('Ville-Test');
            const route: SidenavLink = { label: 'Ma ville', isTownRoot: true, displayed: true, authorized: (): boolean => true, spoil: false };

            expect(testable.resolveLabel(route)).toBe('Ville-Test');
        });
    });
});
