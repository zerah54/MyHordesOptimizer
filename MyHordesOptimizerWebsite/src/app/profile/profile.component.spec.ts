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
                    useValue: { fontSet: 'material-symbols-rounded' } as MatIconDefaultOptions
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

    it('uses the material-symbols-rounded font for the refresh icon (the only font loaded by the app)', (): void => {
        const icon: Element | null = fixture.nativeElement.querySelector('.mho-profile__import mat-icon');
        expect(icon?.classList.contains('material-symbols-rounded')).toBe(true);
    });
});

describe('ProfileComponent avatar', (): void => {
    async function createWithAvatar(avatar: string | null): Promise<ComponentFixture<ProfileComponent>> {
        const noteService: MockedObject<NoteService> = {
            getUserNote: vi.fn().mockName('NoteService.getUserNote').mockReturnValue(of({ note: null } as NoteDTO))
        } as unknown as MockedObject<NoteService>;
        const userAccountService: MockedObject<UserAccountService> = {
            getPublicProfile: vi.fn().mockName('UserAccountService.getPublicProfile')
                .mockReturnValue(of({ id: 93, userName: 'Zerah', avatar } as UserAccountPublicDTO))
        } as unknown as MockedObject<UserAccountService>;

        await TestBed.configureTestingModule({
            imports: [ProfileComponent],
            providers: [
                provideHttpClient(withXhr()), provideHttpClientTesting(),
                { provide: NoteService, useValue: noteService },
                { provide: UserAccountService, useValue: userAccountService },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: (): string => '93' } } } },
                { provide: MAT_ICON_DEFAULT_OPTIONS, useValue: { fontSet: 'material-symbols-rounded' } as MatIconDefaultOptions },
            ]
        }).compileComponents();

        const fixture: ComponentFixture<ProfileComponent> = TestBed.createComponent(ProfileComponent);
        fixture.detectChanges();
        return fixture;
    }

    it('shows the avatar through the shared component', async (): Promise<void> => {
        const fixture: ComponentFixture<ProfileComponent> = await createWithAvatar('/storage/zerah.png');

        expect(fixture.nativeElement.querySelector('.mho-profile__header mho-avatar img')).not.toBeNull();
    });

    it('does not repeat the user name in place of an avatar that fails to load', async (): Promise<void> => {
        const fixture: ComponentFixture<ProfileComponent> = await createWithAvatar('https://staging.example.com/cdn/avatars/93.webp');

        fixture.nativeElement.querySelector('.mho-profile__header img')?.dispatchEvent(new Event('error'));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.mho-profile__header img')).toBeNull();
    });

    it('shows no image for the "False" value returned by the API for a player without an avatar', async (): Promise<void> => {
        const fixture: ComponentFixture<ProfileComponent> = await createWithAvatar('False');

        expect(fixture.nativeElement.querySelector('.mho-profile__header img')).toBeNull();
    });
});
