import { HttpErrorResponse, provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRouteSnapshot, convertToParamMap, Router, UrlTree } from '@angular/router';
import { Observable, of, Subject, throwError } from 'rxjs';
import type { Mock } from 'vitest';

import { environment } from '../../../environments/environment';
import { TOKEN_KEY } from '../../_abstract_model/const';
import { MapThemeActiveDTO, MapThemeDTO, MapThemesDTO } from '../../_abstract_model/dto/map-theme.dto';
import { AuthenticationService } from '../../_abstract_model/services/authentication.service';
import { MAP_THEME_TOKENS, MapThemeColors } from '../../_abstract_model/types/map-theme.class';
import { Me } from '../../_abstract_model/types/me.class';
import { errorInterceptor } from '../../_core/services/errors-interceptor.service';
import { MapThemeStateService } from '../../_core/services/map-theme-state.service';
import { SnackbarService } from '../../_core/services/snackbar.service';
import { ThemeService } from '../../_core/services/theme.service';
import { setUser } from '../../_core/utilities/localstorage.util';
import { profileSelfOnlyGuard } from '../profile.routes';
import { ProfileMapThemeComponent } from './profile-map-theme.component';

describe('profileSelfOnlyGuard', (): void => {
    afterEach((): void => setUser(null));

    function run(route_user_id: string): boolean | UrlTree {
        const route: ActivatedRouteSnapshot = { parent: { paramMap: convertToParamMap({ userId: route_user_id }) } } as unknown as ActivatedRouteSnapshot;
        return TestBed.runInInjectionContext((): boolean | UrlTree => profileSelfOnlyGuard(route, undefined as never) as boolean | UrlTree);
    }

    it('la garde renvoie vers towns sur le profil d\'un autre', (): void => {
        setUser({ id: 5 } as Me);
        const result: boolean | UrlTree = run('7');
        expect(result instanceof UrlTree).toBe(true);
        expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/profile/7/towns');
    });

    it('la garde laisse passer sur son propre profil', (): void => {
        setUser({ id: 5 } as Me);
        expect(run('5')).toBe(true);
    });

    describe('utilisateur non résolu (rechargement)', (): void => {
        function storeSession(id: number): void {
            const valid_to: string = new Date(Date.now() + 3600_000).toISOString();
            const element: unknown = { token: { accessToken: 'x', validFrom: valid_to, validTo: valid_to }, simpleMe: { id } };
            localStorage.setItem(TOKEN_KEY, JSON.stringify({ element }));
        }
        afterEach((): void => localStorage.removeItem(TOKEN_KEY));

        it('la session stockée du même id laisse passer', (): void => {
            storeSession(5);
            expect(run('5')).toBe(true);
        });

        it('la session stockée d\'un autre id redirige', (): void => {
            storeSession(5);
            expect(run('7') instanceof UrlTree).toBe(true);
        });
    });
});

describe('ProfileMapThemeComponent', (): void => {
    const mine_a: MapThemeDTO = { id: 1, name: 'Rose', colors: { 'map-l0': '#112233' }, updatedAt: '' };
    const mine_b: MapThemeDTO = { id: 2, name: 'Bleu', colors: {}, updatedAt: '' };
    let themes: WritableSignal<MapThemeDTO[]>;
    let active: WritableSignal<MapThemeActiveDTO>;
    let is_dark: WritableSignal<boolean>;
    let confirm_answer: Subject<boolean | undefined>;
    let dialog: { open: Mock };
    let state: {
        themes: WritableSignal<MapThemeDTO[]>;
        active: WritableSignal<MapThemeActiveDTO>;
        setActive: Mock;
        createTheme: Mock;
        saveTheme: Mock;
        deleteTheme: Mock;
        previewVariables: Mock;
    };
    let fixture: ComponentFixture<ProfileMapThemeComponent>;

    function el(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }
    function rows(): HTMLElement[] {
        return Array.from(el().querySelectorAll<HTMLElement>('.theme-row'));
    }
    function click(selector: string, root: ParentNode = el()): void {
        root.querySelector<HTMLElement>(selector)?.click();
        fixture.detectChanges();
    }
    function openEditor(row_index: number = 1): void {
        click('.edit', rows()[row_index]);
    }
    function setColor(index: number, value: string): void {
        const input: HTMLInputElement = el().querySelectorAll<HTMLInputElement>('input[type=color]')[index];
        input.value = value;
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
    }

    beforeEach(async (): Promise<void> => {
        vi.useFakeTimers();
        themes = signal<MapThemeDTO[]>([mine_a, mine_b]);
        active = signal<MapThemeActiveDTO>({ themeId: null });
        is_dark = signal(false);
        confirm_answer = new Subject<boolean | undefined>();
        dialog = { open: vi.fn((): { afterClosed: () => Observable<boolean | undefined> } => ({ afterClosed: (): Observable<boolean | undefined> => confirm_answer })) };
        state = {
            themes,
            active,
            setActive: vi.fn(),
            createTheme: vi.fn((name: string, colors: MapThemeColors): Observable<MapThemeDTO> => of({ id: 9, name, colors, updatedAt: '' })),
            saveTheme: vi.fn((id: number, name: string, colors: MapThemeColors): Observable<MapThemeDTO> => of({ id, name, colors, updatedAt: '' })),
            deleteTheme: vi.fn((): Observable<void> => of(undefined)),
            previewVariables: vi.fn()
        };
        await TestBed.configureTestingModule({
            imports: [ProfileMapThemeComponent],
            providers: [
                { provide: MapThemeStateService, useValue: state },
                { provide: ThemeService, useValue: { is_dark, family: signal('default') } },
                { provide: MatDialog, useValue: dialog }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(ProfileMapThemeComponent);
        fixture.detectChanges();
    });

    afterEach((): void => {
        vi.useRealTimers();
    });

    it('supprimer demande confirmation avant tout appel', (): void => {
        confirm_answer = new Subject<boolean | undefined>();
        click('.delete', rows()[1]);
        expect(dialog.open).toHaveBeenCalledTimes(1);
        expect(state.deleteTheme).not.toHaveBeenCalled();
    });

    it('supprimer confirmé appelle deleteTheme', (): void => {
        click('.delete', rows()[1]);
        confirm_answer.next(true);
        expect(state.deleteTheme).toHaveBeenCalledWith(1);
    });

    it('supprimer refusé ou fermé ne supprime rien et garde l\'éditeur ouvert', (): void => {
        openEditor();
        click('.delete', rows()[1]);
        confirm_answer.next(false);
        click('.delete', rows()[1]);
        confirm_answer.next(undefined);
        fixture.detectChanges();
        expect(state.deleteTheme).not.toHaveBeenCalled();
        expect(el().querySelectorAll('input[type=color]').length).toBe(MAP_THEME_TOKENS.length);
    });

    it('liste Par défaut puis les thèmes personnels, sans échelle fournie', (): void => {
        const names: string[] = rows().map((r: HTMLElement): string => r.querySelector('.theme-name')?.textContent?.trim() ?? '');
        expect(names).toEqual(['Par défaut', 'Rose', 'Bleu']);
    });

    it('activer un thème appelle setActive', (): void => {
        click('.activate', rows()[2]);
        expect(state.setActive).toHaveBeenCalledWith({ themeId: 2 });
        active.set({ themeId: 2 });
        fixture.detectChanges();
        click('.activate', rows()[0]);
        expect(state.setActive).toHaveBeenCalledWith({ themeId: null });
    });

    it('Par défaut n\'offre ni renommer ni supprimer, et rien n\'est dupliquable', (): void => {
        expect(rows()[0].querySelector('.edit')).toBeNull();
        expect(rows()[0].querySelector('.delete')).toBeNull();
        expect(el().querySelector('.duplicate')).toBeNull();
        expect(el().querySelector('.editor')).toBeNull();
    });

    it('créer un nouveau thème part de toutes les valeurs par défaut et ouvre l\'éditeur', (): void => {
        click('.create');
        expect(state.createTheme).toHaveBeenCalledWith('Nouveau thème', {});
        expect(el().querySelector('.editor')).not.toBeNull();
        expect(el().querySelector<HTMLInputElement>('.name-input')?.value).toBe('Nouveau thème');
    });

    it('créer un nouveau thème évite les noms pris, sans tenir compte de la casse', (): void => {
        themes.set([{ id: 1, name: 'NOUVEAU THÈME', colors: {}, updatedAt: '' }, { id: 2, name: 'Nouveau thème 2', colors: {}, updatedAt: '' }]);
        fixture.detectChanges();
        click('.create');
        expect(state.createTheme).toHaveBeenCalledWith('Nouveau thème 3', {});
    });

    it('l\'éditeur montre 16 sélecteurs, groupés comme la spec', (): void => {
        openEditor();
        expect(el().querySelectorAll('input[type=color]').length).toBe(16);
        const sizes: number[] = Array.from(el().querySelectorAll('.editor .group')).map((g: Element): number => g.querySelectorAll('input[type=color]').length);
        expect(sizes).toEqual([5, 1, 1, 2, 3, 4]);
    });

    it('les couleurs de plans, fixées par le jeu, ne sont pas modifiables', (): void => {
        expect(MAP_THEME_TOKENS.some((token: string): boolean => token.startsWith('bp-'))).toBe(false);
    });

    it('nomme la zone épuisée comme le jeu', (): void => {
        openEditor();
        expect(el().textContent).toContain('Zones épuisées');
        expect(el().textContent).toContain('Épuisée');
        expect(el().textContent).not.toMatch(/ass[ée]ch/i);
    });

    it('modifier une couleur met à jour l\'aperçu sans attendre', (): void => {
        openEditor();
        state.previewVariables.mockClear();
        setColor(0, '#aabbcc');
        expect(state.previewVariables).toHaveBeenCalled();
        expect(state.previewVariables.mock.lastCall?.[0]).toEqual(expect.objectContaining({ '--mho-map-l0': '#aabbcc' }));
        expect(state.saveTheme).not.toHaveBeenCalled();
    });

    it('plusieurs modifications en rafale : un seul PUT après l\'anti-rebond', (): void => {
        openEditor();
        setColor(0, '#000001');
        vi.advanceTimersByTime(300);
        setColor(1, '#000002');
        vi.advanceTimersByTime(300);
        setColor(2, '#000003');
        expect(state.saveTheme).not.toHaveBeenCalled();
        vi.advanceTimersByTime(500);
        expect(state.saveTheme).toHaveBeenCalledTimes(1);
        expect(state.saveTheme).toHaveBeenCalledWith(1, 'Rose', expect.objectContaining({ 'map-l0': '#000001', 'map-l1': '#000002', 'map-l2': '#000003' }));
    });

    it('les PUT partent dans l\'ordre, sans chevauchement', (): void => {
        const first: Subject<MapThemeDTO> = new Subject<MapThemeDTO>();
        state.saveTheme.mockReturnValueOnce(first);
        openEditor();
        setColor(0, '#000001');
        vi.advanceTimersByTime(500);
        setColor(0, '#000002');
        vi.advanceTimersByTime(500);
        expect(state.saveTheme).toHaveBeenCalledTimes(1);
        first.next(mine_a);
        first.complete();
        expect(state.saveTheme).toHaveBeenCalledTimes(2);
    });

    it('quitter la page pendant l\'attente envoie le dernier état', (): void => {
        openEditor();
        setColor(0, '#00ff00');
        fixture.destroy();
        expect(state.saveTheme).toHaveBeenCalledTimes(1);
        expect(state.saveTheme).toHaveBeenCalledWith(1, 'Rose', expect.objectContaining({ 'map-l0': '#00ff00' }));
    });

    it('quitter la page appelle previewVariables(null)', (): void => {
        fixture.destroy();
        expect(state.previewVariables).toHaveBeenLastCalledWith(null);
    });

    it('« revenir à la valeur du site » retire la clé du brouillon', (): void => {
        openEditor();
        click('.reset');
        vi.advanceTimersByTime(500);
        const colors: MapThemeColors = state.saveTheme.mock.lastCall?.[2];
        expect('map-l0' in colors).toBe(false);
    });

    function conflictOnBleu(): void {
        state.saveTheme.mockImplementation((id: number, name: string, colors: MapThemeColors): Observable<MapThemeDTO> =>
            name === 'Bleu'
                ? throwError((): HttpErrorResponse => new HttpErrorResponse({ status: 409 }))
                : of({ id, name, colors, updatedAt: '' }));
    }
    function setName(value: string): void {
        const input: HTMLInputElement = el().querySelector<HTMLInputElement>('.name-input') as HTMLInputElement;
        input.value = value;
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        fixture.detectChanges();
    }
    function errorText(): string {
        return el().querySelector('mat-error')?.textContent?.trim() ?? '';
    }

    it('nom déjà pris (409) : la liste garde l\'ancien nom, la saisie reste', (): void => {
        conflictOnBleu();
        openEditor();
        setName('Bleu');
        vi.advanceTimersByTime(500);
        fixture.detectChanges();
        expect(state.saveTheme).toHaveBeenCalledWith(1, 'Bleu', expect.anything());
        expect(rows()[1].querySelector('.theme-name')?.textContent?.trim()).toBe('Rose');
        expect((el().querySelector('.name-input') as HTMLInputElement).value).toBe('Bleu');
    });

    it('après un 409 sur le nom, une couleur modifiée part sous le dernier nom accepté', (): void => {
        conflictOnBleu();
        openEditor();
        setName('Bleu');
        vi.advanceTimersByTime(500);
        setColor(0, '#abcdef');
        vi.advanceTimersByTime(500);
        expect(state.saveTheme.mock.lastCall).toEqual([1, 'Rose', expect.objectContaining({ 'map-l0': '#abcdef' })]);
        expect(state.saveTheme.mock.calls.filter((c: unknown[]): boolean => c[1] === 'Bleu').length).toBe(1);
    });

    it('après un 409 sur le nom, une erreur est affichée sur le champ et la saisie reste', (): void => {
        conflictOnBleu();
        openEditor();
        setName('Bleu');
        vi.advanceTimersByTime(500);
        fixture.detectChanges();
        fixture.detectChanges();
        expect(errorText()).toBe('Ce nom est déjà pris.');
        expect((el().querySelector('.name-input') as HTMLInputElement).value).toBe('Bleu');
    });

    it('nom vide : une couleur modifiée part sous le dernier nom accepté, et une erreur est affichée', (): void => {
        openEditor();
        setName('  ');
        setColor(0, '#abcdef');
        vi.advanceTimersByTime(500);
        expect(state.saveTheme).toHaveBeenCalledTimes(1);
        expect(state.saveTheme).toHaveBeenCalledWith(1, 'Rose', expect.objectContaining({ 'map-l0': '#abcdef' }));
        expect(errorText()).toBe('Le nom est obligatoire.');
    });

    it('nom vide puis quitter la page : le dernier état des couleurs est envoyé', (): void => {
        openEditor();
        setName('');
        setColor(0, '#abcdef');
        fixture.destroy();
        expect(state.saveTheme).toHaveBeenCalledTimes(1);
        expect(state.saveTheme).toHaveBeenCalledWith(1, 'Rose', expect.objectContaining({ 'map-l0': '#abcdef' }));
    });

    it('corriger le nom après un refus : l\'erreur disparaît et le nouveau nom part', (): void => {
        conflictOnBleu();
        openEditor();
        setName('Bleu');
        vi.advanceTimersByTime(500);
        fixture.detectChanges();
        setName('Vert');
        expect(errorText()).toBe('');
        vi.advanceTimersByTime(500);
        expect(state.saveTheme.mock.lastCall).toEqual([1, 'Vert', expect.anything()]);
    });

    it('un 409 périmé (nom retapé entre-temps) ne pose pas l\'erreur de nom', (): void => {
        const first: Subject<MapThemeDTO> = new Subject<MapThemeDTO>();
        state.saveTheme.mockReturnValueOnce(first);
        openEditor();
        setName('Bleu');
        vi.advanceTimersByTime(500);
        setName('Vert');
        first.error(new HttpErrorResponse({ status: 409 }));
        fixture.detectChanges();
        expect(errorText()).toBe('');
    });

    it('création au-delà de 20 thèmes : l\'erreur remonte, la liste ne change pas', (): void => {
        state.createTheme.mockReturnValue(throwError((): Error => new Error('400')));
        click('.create');
        expect(rows().length).toBe(3);
        expect(el().querySelector('.editor')).toBeNull();
    });
});

describe('ProfileMapThemeComponent avec le vrai service et l\'intercepteur', (): void => {
    const url: string = `${environment.api_url}/MapTheme`;
    const theme: MapThemeDTO = { id: 1, name: 'Rose', colors: { 'map-l0': '#112233' }, updatedAt: '' };
    let http_mock: HttpTestingController;
    let snackbar: { errorSnackbar: Mock };
    let fixture: ComponentFixture<ProfileMapThemeComponent>;

    function el(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }
    function openFirst(): void {
        const rows: HTMLElement[] = Array.from(el().querySelectorAll<HTMLElement>('.theme-row'));
        rows[1].querySelector<HTMLElement>('.edit')?.click();
        fixture.detectChanges();
    }
    function setName(value: string): void {
        const input: HTMLInputElement = el().querySelector<HTMLInputElement>('.name-input') as HTMLInputElement;
        input.value = value;
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
    }
    function setColor(value: string): void {
        const input: HTMLInputElement = el().querySelector<HTMLInputElement>('input[type=color]') as HTMLInputElement;
        input.value = value;
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
    }
    function putRequest(): TestRequest {
        return http_mock.expectOne((r: { method: string; url: string }): boolean => r.method === 'PUT' && r.url === `${url}/1`);
    }
    function conflict(req: TestRequest): void {
        req.flush('conflit', { status: 409, statusText: 'Conflict' });
        fixture.detectChanges();
    }

    beforeEach(async (): Promise<void> => {
        vi.useFakeTimers();
        localStorage.removeItem(TOKEN_KEY);
        snackbar = { errorSnackbar: vi.fn() };
        setUser({ id: 5 } as Me);
        await TestBed.configureTestingModule({
            imports: [ProfileMapThemeComponent],
            providers: [
                provideHttpClient(withXhr(), withInterceptors([errorInterceptor])),
                provideHttpClientTesting(),
                { provide: SnackbarService, useValue: snackbar },
                { provide: AuthenticationService, useValue: { getMe: (): Observable<null> => of(null) } },
                { provide: ThemeService, useValue: { is_dark: signal(false), family: signal('default') } }
            ]
        }).compileComponents();
        http_mock = TestBed.inject(HttpTestingController);
        TestBed.inject(MapThemeStateService);
        TestBed.tick();
        http_mock.expectOne(url).flush(<MapThemesDTO>{ themes: [theme], active: { themeId: null } });
        fixture = TestBed.createComponent(ProfileMapThemeComponent);
        fixture.detectChanges();
    });

    afterEach((): void => {
        vi.useRealTimers();
        setUser(null);
        TestBed.tick();
    });

    it('409 sur le nom : mat-error affichée, couleurs renvoyées sous le dernier nom accepté', (): void => {
        openFirst();
        setName('Bleu');
        setColor('#abcdef');
        vi.advanceTimersByTime(500);
        const first: TestRequest = putRequest();
        expect(first.request.body.name).toBe('Bleu');
        conflict(first);
        const retry: TestRequest = putRequest();
        expect(retry.request.body).toEqual({ name: 'Rose', colors: expect.objectContaining({ 'map-l0': '#abcdef' }) });
        retry.flush({ ...theme, colors: retry.request.body.colors });
        fixture.detectChanges();
        expect(el().querySelector('mat-error')?.textContent?.trim()).toBe('Ce nom est déjà pris.');
        expect(snackbar.errorSnackbar).not.toHaveBeenCalled();
    });

    it('409 reçu après fermeture de l\'éditeur : les couleurs repartent sous le nom accepté', (): void => {
        openFirst();
        setName('Bleu');
        setColor('#abcdef');
        vi.advanceTimersByTime(500);
        const first: TestRequest = putRequest();
        el().querySelector<HTMLElement>('.close')?.click();
        fixture.detectChanges();
        conflict(first);
        const retry: TestRequest = putRequest();
        expect(retry.request.body).toEqual({ name: 'Rose', colors: expect.objectContaining({ 'map-l0': '#abcdef' }) });
        retry.flush(theme);
    });

    it('409 reçu après destruction du composant : les couleurs repartent sous le nom accepté', (): void => {
        openFirst();
        setName('Bleu');
        setColor('#abcdef');
        vi.advanceTimersByTime(500);
        const first: TestRequest = putRequest();
        fixture.destroy();
        first.flush('conflit', { status: 409, statusText: 'Conflict' });
        const retry: TestRequest = putRequest();
        expect(retry.request.body).toEqual({ name: 'Rose', colors: expect.objectContaining({ 'map-l0': '#abcdef' }) });
        retry.flush(theme);
    });

    it('autre erreur : snackbar avec le texte de l\'intercepteur, sauf 401', (): void => {
        openFirst();
        setColor('#abcdef');
        vi.advanceTimersByTime(500);
        putRequest().flush(null, { status: 500, statusText: 'Err' });
        expect(snackbar.errorSnackbar).toHaveBeenCalledWith('Une erreur s\'est produite lors de l\'appel (Erreur 500)');
        snackbar.errorSnackbar.mockClear();
        setColor('#abcdee');
        vi.advanceTimersByTime(500);
        putRequest().flush(null, { status: 401, statusText: 'Unauthorized' });
        expect(snackbar.errorSnackbar).not.toHaveBeenCalled();
    });
});
