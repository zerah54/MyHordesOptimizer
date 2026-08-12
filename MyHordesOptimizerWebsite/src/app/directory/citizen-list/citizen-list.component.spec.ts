import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { NoteDTO } from '../../_abstract_model/dto/note.dto';
import { NoteService } from '../../_abstract_model/services/note.service';
import { UserAccountService } from '../../_abstract_model/services/user-account.service';
import { Dictionary } from '../../_abstract_model/types/_types';
import { CitizenListItem, CitizenListPageResult } from '../../_abstract_model/types/citizen-list-item.model';
import { CitizenListComponent } from './citizen-list.component';

interface TestableComponent {
    myUserId: number | null;
    displayedColumns: { (): string[] };
    userNotes: { (): Dictionary<NoteDTO> };
    onRowClick(citizen: CitizenListItem): void;
}

const emptyPage: CitizenListPageResult = { items: [], totalCount: 0 };

describe('CitizenListComponent', (): void => {
    let fixture: ComponentFixture<CitizenListComponent>;
    let testable: TestableComponent;
    let userAccountService: jasmine.SpyObj<UserAccountService>;
    let noteService: jasmine.SpyObj<NoteService>;
    let router: Router;

    async function setup(): Promise<void> {
        userAccountService = jasmine.createSpyObj<UserAccountService>('UserAccountService', ['getCitizensPaged']);
        userAccountService.getCitizensPaged.and.returnValue(of(emptyPage));
        noteService = jasmine.createSpyObj<NoteService>('NoteService', ['getMyUserNotes', 'saveUserNote']);
        noteService.getMyUserNotes.and.returnValue(of({ 5: { note: '<p>hello</p>' } as NoteDTO }));

        await TestBed.configureTestingModule({
            imports: [CitizenListComponent],
            providers: [
                provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
                { provide: UserAccountService, useValue: userAccountService },
                { provide: NoteService, useValue: noteService },
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CitizenListComponent);
        testable = fixture.componentInstance as unknown as TestableComponent;
        router = TestBed.inject(Router);
        fixture.detectChanges();
    }

    describe('connecté', (): void => {
        beforeEach(async (): Promise<void> => {
            localStorage.setItem('user', JSON.stringify({ id: 5 }));
            await setup();
        });

        afterEach((): void => localStorage.removeItem('user'));

        it('navigue vers /profile/:id au clic sur une ligne', (): void => {
            const navigateSpy = spyOn(router, 'navigate');
            testable.onRowClick({ id: 42 } as CitizenListItem);
            expect(navigateSpy).toHaveBeenCalledWith(['/profile', 42]);
        });

        it('charge les notes globales une seule fois au chargement', (): void => {
            expect(noteService.getMyUserNotes).toHaveBeenCalledTimes(1);
            expect(testable.userNotes()[5].note).toBe('<p>hello</p>');
        });

        it('affiche la colonne note', (): void => {
            expect(testable.displayedColumns()).toContain('note');
        });
    });

    describe('non connecté', (): void => {
        beforeEach(async (): Promise<void> => {
            localStorage.removeItem('user');
            await setup();
        });

        it("n'appelle pas l'endpoint de notes (authentifié)", (): void => {
            expect(noteService.getMyUserNotes).not.toHaveBeenCalled();
        });

        it("masque la colonne note", (): void => {
            expect(testable.displayedColumns()).not.toContain('note');
        });
    });
});
