import { BreakpointObserver } from '@angular/cdk/layout';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuthenticationService } from '../../_abstract_model/services/authentication.service';
import { Me } from '../../_abstract_model/types/me.class';
import { setUser } from '../../_core/utilities/localstorage.util';
import { HeaderComponent } from './header.component';
import { HeaderService } from './header.service';

interface TestableComponent {
    is_gt_xs: { (): boolean };
    me: { (): Me | null };
    external_app_id_field_value: { (): string | null; set(value: string | null): void };
    saved_external_app_id: { (): string | null };
    is_in_town: { (): boolean };
    onResize(): void;
    saveExternalAppId(): void;
    disconnect(): void;
    reloadPage(): void;
}

describe('HeaderComponent', (): void => {
    let component: HeaderComponent;
    let fixture: ComponentFixture<HeaderComponent>;
    let testable: TestableComponent;
    let headerService: HeaderService;
    let authenticationService: AuthenticationService;
    let reloadSpy: jasmine.Spy;

    beforeEach(async (): Promise<void> => {
        localStorage.clear();
        await TestBed.configureTestingModule({
            imports: [HeaderComponent],
            providers: [provideHttpClient(), provideHttpClientTesting()]
        }).compileComponents();

        fixture = TestBed.createComponent(HeaderComponent);
        component = fixture.componentInstance;
        testable = component as unknown as TestableComponent;
        headerService = TestBed.inject(HeaderService);
        authenticationService = TestBed.inject(AuthenticationService);
        reloadSpy = spyOn(testable, 'reloadPage' as never);
    });

    afterEach((): void => {
        localStorage.clear();
    });

    it('onResize updates is_gt_xs from the breakpoint observer', (): void => {
        const before: boolean = testable.is_gt_xs();
        // Discriminant : isMatched() renvoie systématiquement la même valeur en environnement de
        // test (pas de simulation de changement de viewport) — sans cet espion, l'assertion serait
        // vraie même si onResize() ne faisait rien.
        spyOn(TestBed.inject(BreakpointObserver), 'isMatched').and.returnValue(!before);

        testable.onResize();

        expect(testable.is_gt_xs()).toBe(!before);
    });

    describe('ngOnInit / header_service.token_obs', (): void => {
        // saveExternalAppId() persiste le token PUIS déclenche aussitôt updateMe(), qui réinitialise
        // le champ à null (synchronement ici, of() émettant immédiatement) : c'est le comportement
        // existant, pas une régression — on vérifie donc la persistance et le déclenchement du refresh.
        it('persists a token pushed after the initial value and refreshes "me"', (): void => {
            spyOn(authenticationService, 'getMe').and.returnValue(of(null));
            fixture.detectChanges();

            headerService.setToken('EXTERNAL-ID');

            expect(localStorage.getItem('external_app_id')).toBe('EXTERNAL-ID');
            expect(authenticationService.getMe).toHaveBeenCalled();
        });

        it('ignores a token identical to the current field value', (): void => {
            spyOn(authenticationService, 'getMe').and.returnValue(of(null));
            fixture.detectChanges();
            testable.external_app_id_field_value.set('SAME');

            headerService.setToken('SAME');

            expect(authenticationService.getMe).not.toHaveBeenCalled();
        });
    });

    describe('saveExternalAppId', (): void => {
        it('persists the field value and refreshes "me" once the server responds', (): void => {
            const me: Me = new Me();
            me.username = 'Alice';
            // La vraie AuthenticationService.getMe() écrit l'utilisateur en localStorage avant d'émettre
            // (voir getUser() appelé par updateMe()) : le mock doit reproduire cet effet de bord.
            spyOn(authenticationService, 'getMe').and.callFake(() => {
                setUser(me);
                return of(me);
            });
            testable.external_app_id_field_value.set('NEW-ID');

            testable.saveExternalAppId();

            expect(localStorage.getItem('external_app_id')).toBe('NEW-ID');
            expect(testable.me()?.username).toBe('Alice');
            expect(reloadSpy).toHaveBeenCalled();
        });

        it('resets the field value once "me" is refreshed', (): void => {
            spyOn(authenticationService, 'getMe').and.returnValue(of(null));
            testable.external_app_id_field_value.set('NEW-ID');

            testable.saveExternalAppId();

            expect(testable.external_app_id_field_value()).toBeNull();
        });
    });

    describe('disconnect', (): void => {
        it('clears the stored external app id and token, then reloads', (): void => {
            localStorage.setItem('external_app_id', 'SOME-ID');

            testable.disconnect();

            expect(localStorage.getItem('external_app_id')).toBe('');
            expect(reloadSpy).toHaveBeenCalled();
        });
    });
});
