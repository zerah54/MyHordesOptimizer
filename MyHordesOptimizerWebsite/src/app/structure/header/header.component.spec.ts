import { BreakpointObserver } from '@angular/cdk/layout';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import type { MockInstance } from 'vitest';

import { environment } from '../../../environments/environment';
import { environment as dev_environment } from '../../../environments/environment.dev';
import { environment as prod_environment } from '../../../environments/environment.prod';
import { AuthenticationService } from '../../_abstract_model/services/authentication.service';
import { PreTownService } from '../../_abstract_model/services/pre-town.service';
import { Me } from '../../_abstract_model/types/me.class';
import { setExternalAppId, setTown, setUser } from '../../_core/utilities/localstorage.util';
import { HeaderComponent } from './header.component';
import { HeaderService } from './header.service';

interface TestableComponent {
    is_gt_sm: {
        (): boolean;
    };
    is_gt_md: {
        (): boolean;
    };
    me: {
        (): Me | null;
    };
    external_app_id_field_value: {
        (): string | null;
        set(value: string | null): void;
    };
    saved_external_app_id: {
        (): string | null;
    };
    is_in_town: {
        (): boolean;
    };
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
    let reloadSpy: MockInstance<() => void>;

    beforeEach(async (): Promise<void> => {
        localStorage.clear();
        setUser(null);
        setTown(null);
        await TestBed.configureTestingModule({
            imports: [HeaderComponent],
            providers: [provideHttpClient(withXhr()), provideHttpClientTesting()]
        }).compileComponents();

        fixture = TestBed.createComponent(HeaderComponent);
        component = fixture.componentInstance;
        testable = component as unknown as TestableComponent;
        headerService = TestBed.inject(HeaderService);
        authenticationService = TestBed.inject(AuthenticationService);
        reloadSpy = vi.spyOn(testable, 'reloadPage' as never);
    });

    afterEach((): void => {
        localStorage.clear();
        setUser(null);
        setTown(null);
    });

    it('onResize updates is_gt_sm and is_gt_md from the breakpoint observer', (): void => {
        const before: boolean = testable.is_gt_sm();
        // Discriminant : isMatched() renvoie systématiquement la même valeur en environnement de
        // test (pas de simulation de changement de viewport) — sans cet espion, l'assertion serait
        // vraie même si onResize() ne faisait rien.
        vi.spyOn(TestBed.inject(BreakpointObserver), 'isMatched').mockReturnValue(!before);

        testable.onResize();

        expect(testable.is_gt_sm()).toBe(!before);
        expect(testable.is_gt_md()).toBe(!before);
    });

    describe('ngOnInit / header_service.token_obs', (): void => {
        // saveExternalAppId() persiste le token PUIS déclenche aussitôt updateMe(), qui réinitialise
        // le champ à null (synchronement ici, of() émettant immédiatement) : c'est le comportement
        // existant, pas une régression — on vérifie donc la persistance et le déclenchement du refresh.
        it('persists a token pushed after the initial value and refreshes "me"', (): void => {
            vi.spyOn(authenticationService, 'getMe').mockReturnValue(of(null));
            fixture.detectChanges();

            headerService.setToken('EXTERNAL-ID');

            expect(localStorage.getItem('external_app_id')).toBe('EXTERNAL-ID');
            expect(authenticationService.getMe).toHaveBeenCalled();
        });

        it('ignores a token identical to the current field value', (): void => {
            vi.spyOn(authenticationService, 'getMe').mockReturnValue(of(null));
            fixture.detectChanges();
            testable.external_app_id_field_value.set('SAME');

            headerService.setToken('SAME');

            expect(authenticationService.getMe).not.toHaveBeenCalled();
        });
    });

    describe('mise à jour externe de "me"', (): void => {
        // Reproduit AppComponent.ngOnInit() : son propre appel à getMe() résout après la
        // construction du header et appelle setUser() en dehors de tout flux du header
        // (saveExternalAppId/disconnect). Le header doit refléter ce changement sans action locale.
        it('reflète un utilisateur défini après la construction, sans passer par saveExternalAppId', (): void => {
            fixture.detectChanges();
            const me: Me = new Me();
            me.username = 'Bob';

            setUser(me);

            expect(testable.me()?.username).toBe('Bob');
        });
    });

    describe('mode de connexion', (): void => {
        const initial_login_mode: 'Native' | 'Key' = environment.login_mode;

        /** Crée l'en-tête pour ce mode : le composant lit l'environnement à sa construction. */
        const renderWith = (mode: 'Native' | 'Key'): ComponentFixture<HeaderComponent> => {
            environment.login_mode = mode;
            const mode_fixture: ComponentFixture<HeaderComponent> = TestBed.createComponent(HeaderComponent);
            mode_fixture.detectChanges();
            return mode_fixture;
        };

        afterEach((): void => {
            environment.login_mode = initial_login_mode;
        });

        it('propose le lien MyHordes en mode Native', (): void => {
            const element: HTMLElement = renderWith('Native').nativeElement;

            expect(element.querySelector('a.profil-button')?.getAttribute('href')).toContain(`jx/disclaimer/${environment.myhordes_app_id}`);
            expect(element.querySelector('button.profil-button')).toBeNull();
        });

        it('propose le champ d\'identifiant en mode Key', (): void => {
            const element: HTMLElement = renderWith('Key').nativeElement;

            expect(element.querySelector('button.profil-button')).not.toBeNull();
            expect(element.querySelector('a.profil-button')).toBeNull();
        });

        it('garde le lien MyHordes en prod et le champ sur l\'instance de test', (): void => {
            expect(prod_environment.login_mode).toBe('Native');
            expect(dev_environment.login_mode).toBe('Key');
        });
    });

    describe('saveExternalAppId', (): void => {
        it('persists the field value and refreshes "me" once the server responds', (): void => {
            const me: Me = new Me();
            me.username = 'Alice';
            // La vraie AuthenticationService.getMe() écrit l'utilisateur en localStorage avant d'émettre
            // (voir getUser() appelé par updateMe()) : le mock doit reproduire cet effet de bord.
            vi.spyOn(authenticationService, 'getMe').mockImplementation(() => {
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
            vi.spyOn(authenticationService, 'getMe').mockReturnValue(of(null));
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

describe('HeaderComponent - pré-villes', (): void => {
    let unseen: WritableSignal<number>;
    let refresh: ReturnType<typeof vi.fn>;
    let fixture: ComponentFixture<HeaderComponent>;

    function login(): void {
        setExternalAppId('KEY');
        setUser({ id: 7, username: 'Bob', town_details: {} } as unknown as Me);
    }

    async function render(): Promise<void> {
        await TestBed.configureTestingModule({
            imports: [HeaderComponent],
            providers: [
                provideHttpClient(withXhr()),
                provideHttpClientTesting(),
                provideRouter([]),
                { provide: PreTownService, useValue: { unseenPreTownCount: unseen.asReadonly(), refreshUnseenCount: refresh } }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(HeaderComponent);
        fixture.detectChanges();
    }

    function openMenu(): void {
        (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('button.profil-button')?.click();
        fixture.detectChanges();
    }

    function preTownItem(): HTMLElement | null {
        return document.querySelector<HTMLElement>('a[mat-menu-item][href="/pre-town"]');
    }

    function visibleBadges(root: ParentNode): HTMLElement[] {
        return Array.from(root.querySelectorAll<HTMLElement>('.mat-badge-content')).filter((badge: HTMLElement): boolean => !badge.closest('.mat-badge-hidden'));
    }

    beforeEach((): void => {
        localStorage.clear();
        setUser(null);
        setTown(null);
        unseen = signal<number>(0);
        refresh = vi.fn();
    });

    afterEach((): void => {
        document.querySelectorAll('.cdk-overlay-container').forEach((overlay: Element): void => overlay.replaceChildren());
        localStorage.clear();
        setUser(null);
        setTown(null);
    });

    it('propose « Mes pré-villes » dans le menu utilisateur, vers /pre-town', async (): Promise<void> => {
        login();
        await render();

        openMenu();

        expect(preTownItem()?.textContent).toContain('Mes pré-villes');
    });

    it('affiche le compteur sur l\'entrée et sur le bouton de profil, et le masque à 0', async (): Promise<void> => {
        login();
        unseen.set(3);
        await render();
        openMenu();

        expect(visibleBadges(fixture.nativeElement as HTMLElement).map((badge: HTMLElement): string | undefined => badge.textContent?.trim())).toEqual(['3']);
        expect(visibleBadges(preTownItem() as HTMLElement).map((badge: HTMLElement): string | undefined => badge.textContent?.trim())).toEqual(['3']);

        unseen.set(0);
        fixture.detectChanges();

        expect(visibleBadges(fixture.nativeElement as HTMLElement).length).toBe(0);
        expect(visibleBadges(preTownItem() as HTMLElement).length).toBe(0);
    });

    it('demande le compteur une fois pour un utilisateur connecté', async (): Promise<void> => {
        login();
        await render();

        expect(refresh).toHaveBeenCalledTimes(1);
    });

    it('ne demande pas le compteur sans utilisateur connecté', async (): Promise<void> => {
        await render();

        expect(refresh).not.toHaveBeenCalled();
    });
});
