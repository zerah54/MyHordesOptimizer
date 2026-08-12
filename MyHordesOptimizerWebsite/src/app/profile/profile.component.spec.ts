import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { NoteDTO } from '../_abstract_model/dto/note.dto';
import { UserAccountPublicDTO } from '../_abstract_model/dto/user-account.dto';
import { NoteService } from '../_abstract_model/services/note.service';
import { UserAccountService } from '../_abstract_model/services/user-account.service';
import { ProfileComponent } from './profile.component';

interface TestableComponent {
    note: { (): string | null };
}

describe('ProfileComponent notes', (): void => {
    let fixture: ComponentFixture<ProfileComponent>;
    let noteService: jasmine.SpyObj<NoteService>;

    beforeEach(async (): Promise<void> => {
        noteService = jasmine.createSpyObj<NoteService>('NoteService', ['getUserNote', 'saveUserNote']);
        noteService.getUserNote.and.returnValue(of({ note: '<p>global</p>' } as NoteDTO));
        const userAccountService: jasmine.SpyObj<UserAccountService> = jasmine.createSpyObj<UserAccountService>('UserAccountService', ['getPublicProfile']);
        userAccountService.getPublicProfile.and.returnValue(of({ id: 5, userName: 'Zerah', avatar: null } as UserAccountPublicDTO));

        await TestBed.configureTestingModule({
            imports: [ProfileComponent],
            providers: [
                provideHttpClient(), provideHttpClientTesting(),
                { provide: NoteService, useValue: noteService },
                { provide: UserAccountService, useValue: userAccountService },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: (): string => '5' } } } },
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
