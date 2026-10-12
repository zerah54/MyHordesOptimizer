import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { MockInstance } from 'vitest';

import { ClipboardService } from '../../_core/services/clipboard.service';
import { SnackbarService } from '../../_core/services/snackbar.service';
import { ToolPreset, ToolPresetsService } from '../../_core/services/tool-presets.service';
import { decodeSnapshot, TOOL_SNAPSHOT_PARAM } from '../../_core/utilities/tool-snapshot.util';
import { ToolPresetsComponent } from './tool-presets.component';

describe('ToolPresetsComponent', (): void => {
    let fixture: ComponentFixture<ToolPresetsComponent>;
    let component: ToolPresetsComponent;
    let presets: ToolPresetsService;
    let success: MockInstance;
    let failure: MockInstance;

    function create(): void {
        fixture = TestBed.createComponent(ToolPresetsComponent);
        fixture.componentRef.setInput('tool', 'overflow');
        fixture.componentRef.setInput('snapshot', (): Record<string, unknown> => ({ v: 1, attack: 7 }));
        component = fixture.componentInstance;
        fixture.detectChanges();
    }

    beforeEach((): void => {
        localStorage.clear();
        TestBed.configureTestingModule({ imports: [ToolPresetsComponent] });
        presets = TestBed.inject(ToolPresetsService);
        const snackbar: SnackbarService = TestBed.inject(SnackbarService);
        success = vi.spyOn(snackbar, 'successSnackbar').mockImplementation((): void => undefined);
        failure = vi.spyOn(snackbar, 'errorSnackbar').mockImplementation((): void => undefined);
    });

    afterEach((): void => {
        vi.restoreAllMocks();
    });

    it('propose les presets déjà enregistrés pour son outil, et eux seuls', (): void => {
        presets.save('overflow', 'A', { v: 1 });
        presets.save('probabilities', 'B', { v: 1 });

        create();

        expect(component['presets']().map((preset: ToolPreset): string => preset.name)).toEqual(['A']);
    });

    it('enregistre la configuration courante sous le nom saisi, sans espaces autour, puis vide le champ', (): void => {
        create();
        component['preset_name'] = '  Ma config ';

        component['save']();

        expect(presets.list('overflow')).toEqual([{ name: 'Ma config', snapshot: { v: 1, attack: 7 } }]);
        expect(component['presets']().map((preset: ToolPreset): string => preset.name)).toEqual(['Ma config']);
        expect(component['preset_name']).toBe('');
        expect(success).toHaveBeenCalledTimes(1);
    });

    it('signale une erreur et garde le nom saisi quand le stockage refuse l\'écriture', (): void => {
        create();
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation((): void => {
            throw new DOMException('quota', 'QuotaExceededError');
        });
        component['preset_name'] = 'Ma config';

        component['save']();

        expect(failure).toHaveBeenCalledTimes(1);
        expect(success).not.toHaveBeenCalled();
        expect(component['preset_name']).toBe('Ma config');
    });

    it('émet le snapshot du preset choisi', (): void => {
        create();
        const emitted: Record<string, unknown>[] = [];
        component.apply.subscribe((snapshot: Record<string, unknown>): void => {
            emitted.push(snapshot);
        });

        component['load']({ name: 'A', snapshot: { v: 1, attack: 9 } });

        expect(emitted).toEqual([{ v: 1, attack: 9 }]);
    });

    it('supprime le preset et met la liste à jour', (): void => {
        presets.save('overflow', 'A', { v: 1 });
        presets.save('overflow', 'B', { v: 1 });
        create();

        component['remove']({ name: 'A', snapshot: { v: 1 } });

        expect(presets.list('overflow').map((preset: ToolPreset): string => preset.name)).toEqual(['B']);
        expect(component['presets']().map((preset: ToolPreset): string => preset.name)).toEqual(['B']);
    });

    it('copie un lien qui porte la configuration courante', (): void => {
        create();
        const copy: MockInstance = vi.spyOn(TestBed.inject(ClipboardService), 'copy').mockImplementation((): void => undefined);

        fixture.debugElement.query(By.css('button.share')).nativeElement.click();

        expect(copy).toHaveBeenCalledTimes(1);
        const url: URL = new URL(<string>copy.mock.calls[0][0]);
        expect(decodeSnapshot(url.searchParams.get(TOOL_SNAPSHOT_PARAM) ?? '')).toEqual({ v: 1, attack: 7 });
    });
});
