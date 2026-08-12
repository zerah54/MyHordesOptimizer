import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { NoteDTO } from '../dto/note.dto';
import { NoteService } from './note.service';

describe('NoteService', (): void => {
    let service: NoteService;
    let httpMock: HttpTestingController;

    beforeEach((): void => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });
        service = TestBed.inject(NoteService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach((): void => {
        httpMock.verify();
    });

    it('getMyTownNotes GET /Note/town/mine', (): void => {
        service.getMyTownNotes().subscribe((notes) => {
            expect(notes[12]?.note).toBe('<p>hello</p>');
        });

        const req = httpMock.expectOne(`${environment.api_url}/Note/town/mine`);
        expect(req.request.method).toBe('GET');
        req.flush({ 12: { note: '<p>hello</p>', updatedAt: '2026-08-11T00:00:00Z' } as NoteDTO });
    });

    it('saveTownNote PUT /Note/town/:mapId with note body', (): void => {
        service.saveTownNote(12, '<p>hi</p>').subscribe();

        const req = httpMock.expectOne(`${environment.api_url}/Note/town/12`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({ note: '<p>hi</p>' });
        req.flush(null);
    });

    it('getMyUserNotes GET /Note/user/mine', (): void => {
        service.getMyUserNotes().subscribe((notes) => {
            expect(notes[5]?.note).toBe('<p>global</p>');
        });

        const req = httpMock.expectOne(`${environment.api_url}/Note/user/mine`);
        expect(req.request.method).toBe('GET');
        req.flush({ 5: { note: '<p>global</p>' } as NoteDTO });
    });

    it('getUserNote GET /Note/user/:userId', (): void => {
        service.getUserNote(5).subscribe((note) => {
            expect(note.note).toBe('<p>global</p>');
        });

        const req = httpMock.expectOne(`${environment.api_url}/Note/user/5`);
        expect(req.request.method).toBe('GET');
        req.flush({ note: '<p>global</p>' } as NoteDTO);
    });

    it('saveUserNote PUT /Note/user/:userId', (): void => {
        service.saveUserNote(5, '<p>hi</p>').subscribe();

        const req = httpMock.expectOne(`${environment.api_url}/Note/user/5`);
        expect(req.request.method).toBe('PUT');
        req.flush(null);
    });

    it('getMyCitizenNotes GET /Note/citizen/mine?townId=', (): void => {
        service.getMyCitizenNotes(12).subscribe((notes) => {
            expect(notes[7]?.note).toBe('<p>citizen</p>');
        });

        const req = httpMock.expectOne((r) => r.url === `${environment.api_url}/Note/citizen/mine` && r.params.get('townId') === '12');
        expect(req.request.method).toBe('GET');
        req.flush({ 7: { note: '<p>citizen</p>' } as NoteDTO });
    });

    it('saveCitizenNote PUT /Note/citizen/:userId?townId=', (): void => {
        service.saveCitizenNote(7, 12, '<p>hi</p>').subscribe();

        const req = httpMock.expectOne((r) => r.url === `${environment.api_url}/Note/citizen/7` && r.params.get('townId') === '12');
        expect(req.request.method).toBe('PUT');
        req.flush(null);
    });

    it('getMyCitizenNotesForUser GET /Note/citizen/:userId/mine', (): void => {
        service.getMyCitizenNotesForUser(7).subscribe((notes) => {
            expect(notes[12]?.note).toBe('<p>dans cette ville</p>');
        });

        const req = httpMock.expectOne(`${environment.api_url}/Note/citizen/7/mine`);
        expect(req.request.method).toBe('GET');
        req.flush({ 12: { note: '<p>dans cette ville</p>' } as NoteDTO });
    });
});
