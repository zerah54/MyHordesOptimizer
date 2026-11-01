import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { EXTERNAL_APP_ID_KEY, MAP_THEME_CACHE_KEY, TOKEN_KEY } from '../../_abstract_model/const';
import { MapThemeDTO, MapThemesDTO } from '../../_abstract_model/dto/map-theme.dto';
import { Me } from '../../_abstract_model/types/me.class';
import { setExternalAppId, setUser } from '../utilities/localstorage.util';
import { MapThemeStateService } from './map-theme-state.service';

describe('MapThemeStateService', (): void => {
    let http_mock: HttpTestingController;
    const root: HTMLElement = document.documentElement;
    const theme_a: MapThemeDTO = { id: 1, name: 'A', colors: { 'map-l0': '#112233' }, updatedAt: '' };
    const theme_b: MapThemeDTO = { id: 2, name: 'B', colors: { 'map-l1': '#445566' }, updatedAt: '' };
    const url: string = `${environment.api_url}/MapTheme`;

    function login(id: number | null): void {
        setUser(id === null ? null : ({ id } as Me));
    }
    function create(): MapThemeStateService {
        const service: MapThemeStateService = TestBed.inject(MapThemeStateService);
        TestBed.tick();
        return service;
    }
    function respond(themes: MapThemeDTO[], themeId: number | null): void {
        http_mock.expectOne(url).flush(<MapThemesDTO>{ themes, active: { themeId } });
    }
    function session(id: number): void {
        setExternalAppId('abc');
        const valid_to: string = new Date(Date.now() + 3600_000).toISOString();
        const element: unknown = { token: { accessToken: 'x', validFrom: valid_to, validTo: valid_to }, simpleMe: { id } };
        localStorage.setItem(TOKEN_KEY, JSON.stringify({ element }));
    }
    function expiredSession(id: number): void {
        const past: string = new Date(Date.now() - 3600_000).toISOString();
        const element: unknown = { token: { accessToken: 'x', validFrom: past, validTo: past }, simpleMe: { id } };
        localStorage.setItem(TOKEN_KEY, JSON.stringify({ element }));
    }
    function seedCache(user_id: number, variables: Record<string, string>): void {
        localStorage.setItem(MAP_THEME_CACHE_KEY, JSON.stringify({ user_id, variables }));
    }

    beforeEach((): void => {
        localStorage.removeItem(MAP_THEME_CACHE_KEY);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EXTERNAL_APP_ID_KEY);
        root.removeAttribute('style');
        TestBed.configureTestingModule({ providers: [provideHttpClient(withXhr()), provideHttpClientTesting()] });
        http_mock = TestBed.inject(HttpTestingController);
    });

    afterEach((): void => {
        login(null);
        TestBed.tick();
        http_mock.verify();
        localStorage.removeItem(MAP_THEME_CACHE_KEY);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EXTERNAL_APP_ID_KEY);
    });

    it('no stored session: copy removed, no variables, no GET', (): void => {
        seedCache(5, { '--mho-map-l0': '#000000' });
        create();
        expect(root.style.getPropertyValue('--mho-map-l0')).toBe('');
        expect(localStorage.getItem(MAP_THEME_CACHE_KEY)).toBeNull();
        http_mock.expectNone(url);
    });

    it('normal load: copy applied at construction, before user resolves and before the GET', (): void => {
        session(5);
        seedCache(5, { '--mho-map-l0': '#abcdef' });
        TestBed.inject(MapThemeStateService);
        expect(root.style.getPropertyValue('--mho-map-l0')).toBe('#abcdef');
        TestBed.tick();
        http_mock.expectNone(url);
        login(5);
        TestBed.tick();
        respond([], null);
    });

    it('normal load: copy still in localStorage while user is null', (): void => {
        session(5);
        seedCache(5, { '--mho-map-l0': '#abcdef' });
        create();
        expect(localStorage.getItem(MAP_THEME_CACHE_KEY)).not.toBeNull();
        expect(root.style.getPropertyValue('--mho-map-l0')).toBe('#abcdef');
    });

    it('user resolves to another id than the copy: copy dropped, variables removed', (): void => {
        session(5);
        seedCache(5, { '--mho-map-l0': '#abcdef' });
        create();
        login(6);
        TestBed.tick();
        expect(root.style.getPropertyValue('--mho-map-l0')).toBe('');
        expect(localStorage.getItem(MAP_THEME_CACHE_KEY)).toBeNull();
        respond([], null);
    });

    it('jeton expiré mais connexion mémorisée : la copie est appliquée sans flash', (): void => {
        expiredSession(5);
        setExternalAppId('abc');
        seedCache(5, { '--mho-map-l0': '#abcdef' });
        TestBed.inject(MapThemeStateService);
        expect(root.style.getPropertyValue('--mho-map-l0')).toBe('#abcdef');
        expect(localStorage.getItem(MAP_THEME_CACHE_KEY)).not.toBeNull();
    });

    it('jeton expiré, connexion mémorisée, autre compte au retour : copie retirée', (): void => {
        expiredSession(5);
        setExternalAppId('abc');
        seedCache(5, { '--mho-map-l0': '#abcdef' });
        create();
        login(6);
        TestBed.tick();
        expect(root.style.getPropertyValue('--mho-map-l0')).toBe('');
        respond([], null);
    });

    it('déconnecté (identifiant externe vide) : copie supprimée', (): void => {
        expiredSession(5);
        setExternalAppId(null);
        seedCache(5, { '--mho-map-l0': '#abcdef' });
        create();
        expect(root.style.getPropertyValue('--mho-map-l0')).toBe('');
        expect(localStorage.getItem(MAP_THEME_CACHE_KEY)).toBeNull();
    });

    it('même utilisateur, GET en erreur : thèmes, actif et variables conservés', (): void => {
        login(5);
        const service: MapThemeStateService = create();
        respond([theme_a], 1);
        login(null);
        TestBed.tick();
        login(5);
        TestBed.tick();
        http_mock.expectOne(url).flush(null, { status: 500, statusText: 'Err' });
        expect(service.themes().length).toBe(1);
        expect(service.active().themeId).toBe(1);
        expect(root.style.getPropertyValue('--mho-map-l0')).toBe('#112233');
    });

    it('setActive en erreur : rétablit l’actif précédent, ses variables et la copie', (): void => {
        login(5);
        const service: MapThemeStateService = create();
        respond([theme_a, theme_b], 1);
        service.setActive({ themeId: 2 });
        http_mock.expectOne(`${url}/active`).flush(null, { status: 500, statusText: 'Err' });
        expect(service.active().themeId).toBe(1);
        expect(root.style.getPropertyValue('--mho-map-l0')).toBe('#112233');
        expect(root.style.getPropertyValue('--mho-map-l1')).toBe('');
        expect(JSON.parse(localStorage.getItem(MAP_THEME_CACHE_KEY) as string).variables['--mho-map-l0']).toBe('#112233');
    });

    it('setActive : un échec périmé ne remplace pas un choix plus récent', (): void => {
        login(5);
        const service: MapThemeStateService = create();
        respond([theme_a, theme_b], null);
        service.setActive({ themeId: 1 });
        service.setActive({ themeId: 2 });
        const [first, second]: TestRequest[] = http_mock.match(`${url}/active`);
        first.flush(null, { status: 500, statusText: 'Err' });
        second.flush(null);
        expect(service.active().themeId).toBe(2);
        expect(root.style.getPropertyValue('--mho-map-l1')).toBe('#445566');
        expect(root.style.getPropertyValue('--mho-map-l0')).toBe('');
    });

    it('au démarrage, applique la copie avant la réponse du GET', (): void => {
        session(5);
        seedCache(5, { '--mho-map-l0': '#abcdef' });
        login(5);
        create();
        expect(root.style.getPropertyValue('--mho-map-l0')).toBe('#abcdef');
        respond([], null);
    });

    it('la réponse du GET remplace la copie et l\'affichage', (): void => {
        session(5);
        seedCache(5, { '--mho-map-l0': '#abcdef' });
        login(5);
        const service: MapThemeStateService = create();
        respond([theme_a], 1);
        expect(root.style.getPropertyValue('--mho-map-l0')).toBe('#112233');
        expect(service.themes().length).toBe(1);
        expect(service.active().themeId).toBe(1);
        expect(JSON.parse(localStorage.getItem(MAP_THEME_CACHE_KEY) as string).variables['--mho-map-l0']).toBe('#112233');
    });

    it('GET en erreur : garde la copie', (): void => {
        session(5);
        seedCache(5, { '--mho-map-l0': '#abcdef' });
        login(5);
        create();
        http_mock.expectOne(url).flush(null, { status: 500, statusText: 'Err' });
        expect(root.style.getPropertyValue('--mho-map-l0')).toBe('#abcdef');
    });

    it('copie en JSON invalide : ignorée, sans exception', (): void => {
        localStorage.setItem(MAP_THEME_CACHE_KEY, '{oops');
        login(5);
        expect((): void => { create(); }).not.toThrow();
        respond([], null);
    });

    it('copie d\'un autre user_id : ignorée', (): void => {
        seedCache(9, { '--mho-map-l0': '#abcdef' });
        login(5);
        create();
        expect(root.style.getPropertyValue('--mho-map-l0')).toBe('');
        respond([], null);
    });

    it('actif devenu vide au GET : variables retirées et copie mise à jour', (): void => {
        session(5);
        seedCache(5, { '--mho-map-l0': '#abcdef' });
        login(5);
        create();
        respond([], null);
        expect(root.style.getPropertyValue('--mho-map-l0')).toBe('');
        expect(JSON.parse(localStorage.getItem(MAP_THEME_CACHE_KEY) as string).variables).toEqual({});
    });

    it('changer d\'actif retire les variables de l\'ancien thème', (): void => {
        login(5);
        const service: MapThemeStateService = create();
        respond([theme_a, theme_b], 1);
        service.setActive({ themeId: 2 });
        http_mock.expectOne(`${url}/active`).flush(null);
        expect(root.style.getPropertyValue('--mho-map-l0')).toBe('');
        expect(root.style.getPropertyValue('--mho-map-l1')).toBe('#445566');
    });

    it('setActive appelle PUT /MapTheme/active et applique sans attendre', (): void => {
        login(5);
        const service: MapThemeStateService = create();
        respond([theme_a], null);
        service.setActive({ themeId: 1 });
        expect(root.style.getPropertyValue('--mho-map-l0')).toBe('#112233');
        const req: TestRequest = http_mock.expectOne(`${url}/active`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({ themeId: 1 });
        req.flush(null);
    });

    it('deleteTheme du thème actif : variables retirées', (): void => {
        login(5);
        const service: MapThemeStateService = create();
        respond([theme_a], 1);
        service.deleteTheme(1).subscribe();
        http_mock.expectOne(`${url}/1`).flush(null);
        expect(root.style.getPropertyValue('--mho-map-l0')).toBe('');
        expect(service.themes().length).toBe(0);
        expect(service.active().themeId).toBeNull();
    });

    it('saveTheme du thème actif : variables mises à jour', (): void => {
        login(5);
        const service: MapThemeStateService = create();
        respond([theme_a], 1);
        service.saveTheme(1, 'A', { 'map-l0': '#aaaaaa' }).subscribe();
        http_mock.expectOne(`${url}/1`).flush({ ...theme_a, colors: { 'map-l0': '#aaaaaa' } });
        expect(root.style.getPropertyValue('--mho-map-l0')).toBe('#aaaaaa');
        expect(service.themes()[0].colors['map-l0']).toBe('#aaaaaa');
    });

    it('createTheme ajoute le thème à la liste', (): void => {
        login(5);
        const service: MapThemeStateService = create();
        respond([], null);
        service.createTheme('B', theme_b.colors).subscribe();
        http_mock.expectOne(url).flush(theme_b);
        expect(service.themes()[0].id).toBe(2);
    });

    it('previewVariables(x) remplace le thème actif, previewVariables(null) le rétablit', (): void => {
        login(5);
        const service: MapThemeStateService = create();
        respond([theme_a], 1);
        service.previewVariables({ '--mho-map-l2': '#777777' });
        expect(root.style.getPropertyValue('--mho-map-l0')).toBe('');
        expect(root.style.getPropertyValue('--mho-map-l2')).toBe('#777777');
        service.previewVariables(null);
        expect(root.style.getPropertyValue('--mho-map-l2')).toBe('');
        expect(root.style.getPropertyValue('--mho-map-l0')).toBe('#112233');
    });

    it('pendant un aperçu, la réponse du GET ne l\'écrase pas', (): void => {
        login(5);
        const service: MapThemeStateService = create();
        service.previewVariables({ '--mho-map-l2': '#777777' });
        respond([theme_a], 1);
        expect(root.style.getPropertyValue('--mho-map-l2')).toBe('#777777');
        expect(root.style.getPropertyValue('--mho-map-l0')).toBe('');
        service.previewVariables(null);
        expect(root.style.getPropertyValue('--mho-map-l0')).toBe('#112233');
    });
});
