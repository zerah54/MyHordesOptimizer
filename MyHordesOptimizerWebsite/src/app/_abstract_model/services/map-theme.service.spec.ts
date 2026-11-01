import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { BYPASS_ERROR, BYPASS_LOADING } from '../../_core/services/http-context-tokens';
import { MapThemeDTO, MapThemesDTO } from '../dto/map-theme.dto';
import { MapThemeService } from './map-theme.service';

describe('MapThemeService', (): void => {
    let service: MapThemeService;
    let http_mock: HttpTestingController;
    const theme: MapThemeDTO = { id: 3, name: 'A', colors: { 'map-l0': '#112233' }, updatedAt: '2026-10-30T00:00:00Z' };

    beforeEach((): void => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(withXhr()), provideHttpClientTesting()] });
        service = TestBed.inject(MapThemeService);
        http_mock = TestBed.inject(HttpTestingController);
    });

    afterEach((): void => http_mock.verify());

    it('getMine GET /MapTheme silencieux', (): void => {
        let result: MapThemesDTO | undefined;
        service.getMine().subscribe((r: MapThemesDTO): void => { result = r; });
        const req: TestRequest = http_mock.expectOne(`${environment.api_url}/MapTheme`);
        expect(req.request.method).toBe('GET');
        expect(req.request.context.get(BYPASS_ERROR)).toBe(true);
        expect(req.request.context.get(BYPASS_LOADING)).toBe(true);
        req.flush({ themes: [theme], active: { themeId: 3 } });
        expect(result?.themes[0].id).toBe(3);
    });

    it('create POST /MapTheme avec name et colors', (): void => {
        let result: MapThemeDTO | undefined;
        service.create('A', theme.colors).subscribe((r: MapThemeDTO): void => { result = r; });
        const req: TestRequest = http_mock.expectOne(`${environment.api_url}/MapTheme`);
        expect(req.request.method).toBe('POST');
        expect(JSON.parse(req.request.body)).toEqual({ name: 'A', colors: theme.colors });
        req.flush(theme);
        expect(result?.id).toBe(3);
    });

    it('update PUT /MapTheme/:id sans message d erreur global', (): void => {
        service.update(3, 'A', theme.colors).subscribe();
        const req: TestRequest = http_mock.expectOne(`${environment.api_url}/MapTheme/3`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({ name: 'A', colors: theme.colors });
        expect(req.request.context.get(BYPASS_ERROR)).toBe(true);
        req.flush(theme);
    });

    it('remove DELETE /MapTheme/:id', (): void => {
        service.remove(3).subscribe();
        const req: TestRequest = http_mock.expectOne(`${environment.api_url}/MapTheme/3`);
        expect(req.request.method).toBe('DELETE');
        req.flush(null);
    });

    it('setActive PUT /MapTheme/active', (): void => {
        service.setActive({ themeId: 4 }).subscribe();
        const req: TestRequest = http_mock.expectOne(`${environment.api_url}/MapTheme/active`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({ themeId: 4 });
        req.flush(null);
    });
});
