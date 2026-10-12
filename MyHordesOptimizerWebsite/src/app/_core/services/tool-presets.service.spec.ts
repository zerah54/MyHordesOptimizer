import { TestBed } from '@angular/core/testing';

import { TOOL_PRESETS_KEY_PREFIX } from '../../_abstract_model/const';
import { ToolPreset, ToolPresetsService } from './tool-presets.service';

describe('ToolPresetsService', (): void => {
    let service: ToolPresetsService;

    beforeEach((): void => {
        localStorage.clear();
        TestBed.configureTestingModule({});
        service = TestBed.inject(ToolPresetsService);
    });

    afterEach((): void => {
        vi.restoreAllMocks();
    });

    it('ne renvoie aucun preset quand rien n\'est enregistré', (): void => {
        expect(service.list('overflow')).toEqual([]);
    });

    it('relit un preset enregistré', (): void => {
        service.save('overflow', 'Attaque 1200', { v: 1, attack: 1200 });

        expect(service.list('overflow')).toEqual([{ name: 'Attaque 1200', snapshot: { v: 1, attack: 1200 } }]);
    });

    it('remplace le preset de même nom sans le dupliquer ni le déplacer', (): void => {
        service.save('overflow', 'A', { v: 1, attack: 1 });
        service.save('overflow', 'B', { v: 1, attack: 2 });
        service.save('overflow', 'A', { v: 1, attack: 3 });

        expect(service.list('overflow')).toEqual([
            { name: 'A', snapshot: { v: 1, attack: 3 } },
            { name: 'B', snapshot: { v: 1, attack: 2 } }
        ]);
    });

    it('garde les presets de chaque outil séparés', (): void => {
        service.save('overflow', 'A', { v: 1 });
        service.save('probabilities', 'B', { v: 1 });

        expect(service.list('overflow').map((preset: ToolPreset): string => preset.name)).toEqual(['A']);
        expect(service.list('probabilities').map((preset: ToolPreset): string => preset.name)).toEqual(['B']);
    });

    it('supprime uniquement le preset nommé', (): void => {
        service.save('overflow', 'A', { v: 1 });
        service.save('overflow', 'B', { v: 1 });

        service.delete('overflow', 'A');

        expect(service.list('overflow').map((preset: ToolPreset): string => preset.name)).toEqual(['B']);
    });

    it('refuse un nom vide ou blanc', (): void => {
        expect(service.save('overflow', '   ', { v: 1 })).toBe(false);
        expect(service.list('overflow')).toEqual([]);
    });

    it('ne renvoie aucun preset quand le contenu stocké est corrompu', (): void => {
        localStorage.setItem(TOOL_PRESETS_KEY_PREFIX + 'overflow', '{pas du json');

        expect(service.list('overflow')).toEqual([]);
    });

    it('ignore les entrées stockées qui n\'ont pas la forme d\'un preset', (): void => {
        localStorage.setItem(TOOL_PRESETS_KEY_PREFIX + 'overflow', JSON.stringify([
            { name: 'ok', snapshot: { v: 1 } },
            { name: 12, snapshot: { v: 1 } },
            { name: 'sans snapshot' },
            null
        ]));

        expect(service.list('overflow')).toEqual([{ name: 'ok', snapshot: { v: 1 } }]);
    });

    it('renvoie false quand le stockage est plein', (): void => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation((): void => {
            throw new DOMException('quota', 'QuotaExceededError');
        });

        expect(service.save('overflow', 'A', { v: 1 })).toBe(false);
    });
});
