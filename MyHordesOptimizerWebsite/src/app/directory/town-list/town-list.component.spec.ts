import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { USER_KEY } from '../../_abstract_model/const';
import { NoteDTO } from '../../_abstract_model/dto/note.dto';
import { NoteService } from '../../_abstract_model/services/note.service';
import { Dictionary } from '../../_abstract_model/types/_types';
import { TownListItem, TownPublicCitizen } from '../../_abstract_model/types/town-list-item.model';
import { TownListComponent } from './town-list.component';

interface TestableComponent {
    townNotes: { (): Dictionary<NoteDTO> };
    citizenNotes: { (): Dictionary<NoteDTO> };
    hasParticipated(row: TownListItem): boolean;
}

function town(citizens: TownPublicCitizen[]): TownListItem {
    return {
        id: 1, mapId: 12, name: 'Test', width: null, height: null, townType: null,
        season: null, phase: null, language: null, score: null,
        isChaos: false, isDevasted: false, isFinished: false, citizens
    };
}

describe('TownListComponent notes', (): void => {
    let fixture: ComponentFixture<TownListComponent>;
    let testable: TestableComponent;
    let noteService: jasmine.SpyObj<NoteService>;

    beforeEach(async (): Promise<void> => {
        noteService = jasmine.createSpyObj<NoteService>(
            'NoteService', ['getMyTownNotes', 'saveTownNote', 'getMyCitizenNotesForUser', 'saveCitizenNote']
        );
        noteService.getMyTownNotes.and.returnValue(of({ 12: { note: '<p>hello</p>' } as NoteDTO }));
        noteService.getMyCitizenNotesForUser.and.returnValue(of({ 12: { note: '<p>citizen note</p>' } as NoteDTO }));

        await TestBed.configureTestingModule({
            imports: [TownListComponent],
            providers: [provideHttpClient(), provideHttpClientTesting(), { provide: NoteService, useValue: noteService }]
        }).compileComponents();
    });

    afterEach((): void => {
        localStorage.removeItem(USER_KEY);
    });

    // myUserId est lu depuis localStorage à la construction du composant : le login doit être posé
    // AVANT createComponent, pas avant detectChanges.
    function createComponent(): void {
        fixture = TestBed.createComponent(TownListComponent);
        testable = fixture.componentInstance as unknown as TestableComponent;
    }

    it('loads only town notes when browsing the general directory (no playerId)', (): void => {
        createComponent();
        fixture.detectChanges();

        expect(noteService.getMyTownNotes).toHaveBeenCalledTimes(1);
        expect(noteService.getMyCitizenNotesForUser).not.toHaveBeenCalled();
        expect(testable.townNotes()[12].note).toBe('<p>hello</p>');
    });

    it('loads only town notes (not citizen notes) on one\'s own profile', (): void => {
        localStorage.setItem(USER_KEY, JSON.stringify({ id: 42 }));
        createComponent();
        fixture.componentRef.setInput('playerId', 42);

        fixture.detectChanges();

        expect(noteService.getMyTownNotes).toHaveBeenCalledTimes(1);
        expect(noteService.getMyCitizenNotesForUser).not.toHaveBeenCalled();
        expect(testable.townNotes()[12].note).toBe('<p>hello</p>');
    });

    it('loads both town notes and citizen notes on another player\'s profile', (): void => {
        localStorage.setItem(USER_KEY, JSON.stringify({ id: 1 }));
        createComponent();
        fixture.componentRef.setInput('playerId', 42);

        fixture.detectChanges();

        expect(noteService.getMyTownNotes).toHaveBeenCalledTimes(1);
        expect(noteService.getMyCitizenNotesForUser).toHaveBeenCalledOnceWith(42);
        expect(testable.townNotes()[12].note).toBe('<p>hello</p>');
        expect(testable.citizenNotes()[12].note).toBe('<p>citizen note</p>');
    });

    it('flags a town as participated only when the logged-in user is among its citizens', (): void => {
        localStorage.setItem(USER_KEY, JSON.stringify({ id: 1 }));
        createComponent();
        fixture.detectChanges();

        expect(testable.hasParticipated(town([{ id: 1, name: 'Me', deathTypeId: null }]))).toBeTrue();
        expect(testable.hasParticipated(town([{ id: 2, name: 'Other', deathTypeId: null }]))).toBeFalse();
        expect(testable.hasParticipated(town([]))).toBeFalse();
    });
});
