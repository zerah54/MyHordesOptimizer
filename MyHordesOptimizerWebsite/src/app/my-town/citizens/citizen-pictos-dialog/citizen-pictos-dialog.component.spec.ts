import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MAT_ICON_DEFAULT_OPTIONS, MatIconDefaultOptions } from '@angular/material/icon';
import { Observable, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';

import { UserPictosDTO } from '../../../_abstract_model/dto/user-picto.dto';
import { UserAccountService } from '../../../_abstract_model/services/user-account.service';
import { Me } from '../../../_abstract_model/types/me.class';
import { UserPicto } from '../../../_abstract_model/types/user-picto.class';
import { setUser } from '../../../_core/utilities/localstorage.util';
import { CitizenPictosDialogComponent, CitizenPictosDialogData } from './citizen-pictos-dialog.component';

interface TestableComponent {
    pictos: () => UserPicto[];
    importedAt: () => string | null;
    importing: () => boolean;
    triggerImport(): void;
}

describe('CitizenPictosDialogComponent', (): void => {
    let fixture: ComponentFixture<CitizenPictosDialogComponent>;
    let testable: TestableComponent;
    let getPictosSpy: Mock;
    let importUserDataSpy: Mock;

    const dialogData: CitizenPictosDialogData = { userId: 42, citizenName: 'Bob', townId: 7 };

    function configure(initial: UserPictosDTO): void {
        getPictosSpy = vi.fn().mockReturnValue(of(initial));
        importUserDataSpy = vi.fn();

        TestBed.configureTestingModule({
            imports: [CitizenPictosDialogComponent],
            providers: [
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                { provide: MAT_DIALOG_DATA, useValue: dialogData },
                {
                    provide: UserAccountService,
                    useValue: { getPictos: getPictosSpy, importUserData: importUserDataSpy }
                },
                {
                    provide: MAT_ICON_DEFAULT_OPTIONS,
                    useValue: { fontSet: 'material-symbols-rounded' } as MatIconDefaultOptions
                },
            ]
        });

        fixture = TestBed.createComponent(CitizenPictosDialogComponent);
        testable = fixture.componentInstance as unknown as TestableComponent;
        fixture.detectChanges();
    }

    afterEach((): void => {
        setUser(null);
    });

    it('hides the import button for a visitor who is not logged in', (): void => {
        setUser(null);
        configure({ historyImportedAt: null, pictos: [] });

        expect(fixture.nativeElement.querySelector('.citizen-pictos__import')).toBeNull();
    });

    it('shows the import button for a logged-in visitor', (): void => {
        setUser(null);
        setUser(Object.assign(new Me(), { id: 1 }));
        configure({ historyImportedAt: null, pictos: [] });

        expect(fixture.nativeElement.querySelector('.citizen-pictos__import')).not.toBeNull();
    });

    it('uses the material-symbols-rounded font for the refresh icon (the only font loaded by the app)', (): void => {
        setUser(null);
        setUser(Object.assign(new Me(), { id: 1 }));
        configure({ historyImportedAt: null, pictos: [] });

        const icon: Element | null = fixture.nativeElement.querySelector('.citizen-pictos__import mat-icon');
        expect(icon?.classList.contains('material-symbols-rounded')).toBe(true);
    });

    it('loads pictos and the last import date on init', (): void => {
        setUser(null);
        setUser(Object.assign(new Me(), { id: 1 }));
        configure({ historyImportedAt: '2026-08-01T00:00:00Z', pictos: [{ id: 1, rare: false, count: 3 }] });

        expect(testable.pictos().length).toBe(1);
        expect(testable.importedAt()).toBe('2026-08-01T00:00:00Z');
    });

    it('reloads pictos and the import date after a successful import', (): void => {
        setUser(null);
        setUser(Object.assign(new Me(), { id: 1 }));
        configure({ historyImportedAt: null, pictos: [] });
        const refreshed: UserPictosDTO = {
            historyImportedAt: '2026-08-11T12:00:00Z',
            pictos: [{ id: 1, rare: false, count: 5, countInTown: 5 }]
        };
        importUserDataSpy.mockReturnValue(of({ historyImportedAt: '2026-08-11T12:00:00Z', pictos: [] }));
        getPictosSpy.mockReturnValue(of(refreshed));

        testable.triggerImport();

        expect(importUserDataSpy).toHaveBeenCalledWith(dialogData.userId);
        expect(getPictosSpy).toHaveBeenCalledWith(dialogData.userId, dialogData.townId);
        expect(testable.importing()).toBe(false);
        expect(testable.pictos().length).toBe(1);
        expect(testable.importedAt()).toBe('2026-08-11T12:00:00Z');
    });

    it('stops the spinner without changing data when the import fails (e.g. 429)', (): void => {
        setUser(null);
        setUser(Object.assign(new Me(), { id: 1 }));
        configure({ historyImportedAt: null, pictos: [] });
        importUserDataSpy.mockReturnValue(throwError((): Error => new Error('429')));

        testable.triggerImport();

        expect(testable.importing()).toBe(false);
        expect(testable.pictos().length).toBe(0);
        expect(testable.importedAt()).toBeNull();
    });

    it('ignores a second triggerImport call while one is already in flight', (): void => {
        setUser(null);
        setUser(Object.assign(new Me(), { id: 1 }));
        configure({ historyImportedAt: null, pictos: [] });
        importUserDataSpy.mockReturnValue(new Observable<UserPictosDTO>());

        testable.triggerImport();
        testable.triggerImport();

        expect(importUserDataSpy).toHaveBeenCalledTimes(1);
    });
});
