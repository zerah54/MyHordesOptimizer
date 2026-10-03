import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { of } from 'rxjs';
import type { MockedObject } from 'vitest';

import { LogViewerService } from '../../_abstract_model/services/log-viewer.service';
import { LogEntry, LogPageResult } from '../../_abstract_model/types/log-viewer.model';
import { LogRow, LogViewerComponent, toLogRow } from './log-viewer.component';

describe('LogViewerComponent', (): void => {
    let fixture: ComponentFixture<LogViewerComponent>;
    let service: MockedObject<LogViewerService>;

    function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
        return {
            timestamp: '2026-10-03T01:56:04.169Z', processId: 1, threadId: 1, correlationId: '', level: 'Debug',
            sourceContext: 'MyHordesOptimizerApi.Repository.Impl.MyHordesApiRepository', eventId: '',
            message: 'GET call initiated', mhoOrigin: '', requestPath: '', query: '', ...overrides
        };
    }

    function makePage(items: LogEntry[]): LogPageResult {
        return { items, totalCount: items.length, page: 1, pageSize: 200 };
    }

    async function render(items: LogEntry[]): Promise<HTMLElement> {
        service.getLogs.mockReturnValue(of(makePage(items)));
        fixture = TestBed.createComponent(LogViewerComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        return fixture.nativeElement;
    }

    beforeEach(async (): Promise<void> => {
        service = {
            getLogs: vi.fn().mockName('LogViewerService.getLogs'),
            getAvailableDates: vi.fn().mockName('LogViewerService.getAvailableDates').mockReturnValue(of([]))
        } as unknown as MockedObject<LogViewerService>;

        await TestBed.configureTestingModule({
            imports: [LogViewerComponent],
            providers: [provideMomentDateAdapter(), { provide: LogViewerService, useValue: service }]
        }).compileComponents();
    });

    describe('toLogRow', (): void => {
        it('derives the short source, the origin and what the row shows', (): void => {
            const row: LogRow = toLogRow(makeEntry({ mhoOrigin: 'website', mhoAddonVersion: '8.2.0', correlationId: 'abc' }));

            expect(row.source).toBe('MyHordesApiRepository');
            expect(row.origin).toBe('website 8.2.0');
            expect(row.level).toEqual({ css_class: 'level--debug', label: 'DEBUG' });
            expect(row.alert).toBe(false);
            expect(row.has_meta).toBe(true);
            expect(row.expandable).toBe(false);
        });

        it('flags warnings and above, and rows with something to unfold', (): void => {
            expect(toLogRow(makeEntry({ level: 'Warning' })).alert).toBe(true);
            expect(toLogRow(makeEntry({ level: 'Fatal' })).alert).toBe(true);
            expect(toLogRow(makeEntry({ level: 'Information' })).alert).toBe(false);
            expect(toLogRow(makeEntry({ stackTrace: 'at X' })).expandable).toBe(true);
            expect(toLogRow(makeEntry({ body: '{}' })).expandable).toBe(true);
        });

        it('has no meta line for a row without origin, request, correlation or action', (): void => {
            const row: LogRow = toLogRow(makeEntry({ sourceContext: 'DiscordStartupHostedService' }));

            expect(row.source).toBe('DiscordStartupHostedService');
            expect(row.origin).toBeNull();
            expect(row.has_meta).toBe(false);
        });
    });

    it('shows the message in full and the meta line only when there is something to put in it', async (): Promise<void> => {
        const element: HTMLElement = await render([
            makeEntry({ message: 'Gateway Connected' }),
            makeEntry({ mhoOrigin: 'website', requestPath: '/Authentication/Token', query: '?userKey=x', correlationId: '197590e3-8a80', actionId: '3817274d' })
        ]);

        const rows: NodeListOf<HTMLElement> = element.querySelectorAll('tr.log-row');
        expect(rows.length).toBe(2);
        expect(rows[0].querySelector('.message')?.textContent).toBe('Gateway Connected');
        expect(rows[0].querySelector('.meta')).toBeNull();

        const items: string[] = Array.from(rows[1].querySelectorAll('.meta-item'))
            .map((item: Element): string => item.textContent?.replace(/\s+/g, ' ').trim() ?? '');
        expect(items).toEqual(['website', '/Authentication/Token?userKey=x', 'corrélation197590e3-8a80', 'action3817274d']);
        // Plus aucun filtre ni colonne secondaire dans l'en-tête.
        expect(element.querySelector('th mat-form-field')).toBeNull();
    });

    it('filters on a correlation id when it is clicked', async (): Promise<void> => {
        const element: HTMLElement = await render([makeEntry({ correlationId: '197590e3-8a80' })]);

        (element.querySelector('.meta-link') as HTMLButtonElement).click();
        fixture.detectChanges();

        expect((element.querySelector('.field--correlation input') as HTMLInputElement).value).toBe('197590e3-8a80');
    });

    it('filters on a level when its badge is clicked', async (): Promise<void> => {
        const element: HTMLElement = await render([makeEntry({ level: 'Warning' })]);

        (element.querySelector('tr.log-row button.level') as HTMLButtonElement).click();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(element.querySelector('.field--level .level-trigger .level')?.textContent).toBe('WARN');
    });

    it('marks warnings with a stripe and unfolds the stack trace of a row', async (): Promise<void> => {
        const element: HTMLElement = await render([makeEntry({ level: 'Error', stackTrace: 'at Foo.Bar()' })]);
        const row: HTMLElement = element.querySelector('tr.log-row') as HTMLElement;

        expect(row.classList).toContain('log-row--alert');
        expect(row.classList).toContain('level--error');
        expect(element.querySelector('.stacktrace')).toBeNull();

        row.click();
        fixture.detectChanges();

        expect(element.querySelector('.stacktrace pre')?.textContent).toBe('at Foo.Bar()');
        expect(row.querySelector('.expand-toggle')?.getAttribute('aria-expanded')).toBe('true');
    });
});
