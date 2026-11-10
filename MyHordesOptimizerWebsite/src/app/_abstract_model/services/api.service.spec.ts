import { HttpRequest, provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ItemEmotesDTO } from '../dto/item.dto';
import { ApiService } from './api.service';

describe('ApiService - emotes des objets', (): void => {
    let http: HttpTestingController;
    let result: ItemEmotesDTO | undefined;

    beforeEach((): void => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(withXhr()), provideHttpClientTesting()] });
        http = TestBed.inject(HttpTestingController);
        result = undefined;
        TestBed.inject(ApiService).getItemEmotes().subscribe((emotes: ItemEmotesDTO): void => {
            result = emotes;
        });
    });

    /**
     * Requête en attente vers le référentiel des emotes.
     * @returns {ReturnType<HttpTestingController['expectOne']>} Requête.
     */
    function pending(): ReturnType<HttpTestingController['expectOne']> {
        return http.expectOne((request: HttpRequest<unknown>): boolean => request.url.endsWith('/Fetcher/ItemEmotes'));
    }

    it('renvoie les balises par uid', (): void => {
        pending().flush({ 'wire_#00': ':item_wire:' });

        expect(result).toEqual({ 'wire_#00': ':item_wire:' });
    });

    it('renvoie un référentiel vide si l\'API ne le fournit pas : les posts restent sans emote', (): void => {
        pending().flush('', { status: 404, statusText: 'Not Found' });

        expect(result).toEqual({});
    });
});
