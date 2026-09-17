import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_ICON_DEFAULT_OPTIONS, MatIconDefaultOptions } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import type { MockedObject } from 'vitest';

import { NoteDTO } from '../_abstract_model/dto/note.dto';
import { UserAccountPublicDTO } from '../_abstract_model/dto/user-account.dto';
import { NoteService } from '../_abstract_model/services/note.service';
import { UserAccountService } from '../_abstract_model/services/user-account.service';
import { ProfileComponent } from './profile.component';

interface TestableComponent {
    note: {
        (): string | null;
    };
}

describe('ProfileComponent notes', (): void => {
    let fixture: ComponentFixture<ProfileComponent>;
    let noteService: MockedObject<NoteService>;

    beforeEach(async (): Promise<void> => {
        noteService = {
            getUserNote: vi.fn().mockName('NoteService.getUserNote'),
            saveUserNote: vi.fn().mockName('NoteService.saveUserNote')
        } as unknown as MockedObject<NoteService>;
        noteService.getUserNote.mockReturnValue(of({ note: '<p>global</p>' } as NoteDTO));
        const userAccountService: MockedObject<UserAccountService> = {
            getPublicProfile: vi.fn().mockName('UserAccountService.getPublicProfile')
        } as unknown as MockedObject<UserAccountService>;
        userAccountService.getPublicProfile.mockReturnValue(of({ id: 5, userName: 'Zerah', avatar: null } as UserAccountPublicDTO));

        await TestBed.configureTestingModule({
            imports: [ProfileComponent],
            providers: [
                provideHttpClient(withXhr()), provideHttpClientTesting(),
                { provide: NoteService, useValue: noteService },
                { provide: UserAccountService, useValue: userAccountService },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: (): string => '5' } } } },
                {
                    provide: MAT_ICON_DEFAULT_OPTIONS,
                    useValue: { fontSet: 'material-symbols-outlined' } as MatIconDefaultOptions
                },
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ProfileComponent);
        fixture.detectChanges();
    });

    it('loads the global note for the viewed user', (): void => {
        expect(noteService.getUserNote).toHaveBeenCalledWith(5);
        expect((fixture.componentInstance as unknown as TestableComponent).note()).toBe('<p>global</p>');
    });

    it('uses the material-symbols-outlined font for the refresh icon (the only font loaded by the app)', (): void => {
        const icon: Element | null = fixture.nativeElement.querySelector('.mho-profile__import mat-icon');
        expect(icon?.classList.contains('material-symbols-outlined')).toBe(true);
    });
});
