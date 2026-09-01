import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { provideRouter, Router } from '@angular/router';
import { Observable, of, Subject } from 'rxjs';

import { CitizenListQuery } from '../../_abstract_model/dto/citizen-list-page.dto';
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
    citizens: { (): CitizenListItem[] };
    loading: { (): boolean };
    onRowClick(citizen: CitizenListItem): void;
    onPageChange(event: PageEvent): void;
    openUserNote(userId: number): void;
}

const emptyPage: CitizenListPageResult = { items: [], totalCount: 0 };
const sampleCitizens: CitizenListItem[] = [
    { id: 1, name: 'Alice', nbTownsPlayed: 3, bestSurvival: 12, lastTownId: 7, lastTownName: 'Berville', lastTownSeason: 4 },
    { id: 2, name: 'Bob', nbTownsPlayed: 1, bestSurvival: undefined, lastTownId: undefined },
];

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

        it('n\'appelle pas l\'endpoint de notes (authentifié)', (): void => {
            expect(noteService.getMyUserNotes).not.toHaveBeenCalled();
        });

        it('masque la colonne note', (): void => {
            expect(testable.displayedColumns()).not.toContain('note');
        });
    });

    describe('rendu du tableau', (): void => {
        it('charge avec le tri par défaut (nbTownsPlayed desc, page 1)', async (): Promise<void> => {
            await setup();

            expect(userAccountService.getCitizensPaged).toHaveBeenCalledWith(jasmine.objectContaining({
                page: 1, pageSize: 50, sortColumn: 'nbTownsPlayed', sortDirection: 'desc', name: undefined
            } as Partial<CitizenListQuery>));
        });

        it('affiche une ligne par citoyen renvoyé', async (): Promise<void> => {
            userAccountService = jasmine.createSpyObj<UserAccountService>('UserAccountService', ['getCitizensPaged']);
            userAccountService.getCitizensPaged.and.returnValue(of({ items: sampleCitizens, totalCount: 2 }));
            noteService = jasmine.createSpyObj<NoteService>('NoteService', ['getMyUserNotes', 'saveUserNote']);
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
            fixture.detectChanges();

            const nameElements: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.citizen-name');
            const names: string[] = Array.from(nameElements)
                .map((el: HTMLElement): string => el.textContent?.trim() ?? '');
            expect(names).toEqual(['Alice', 'Bob']);
            expect(fixture.nativeElement.querySelector('.citizen-list__empty')).toBeNull();
        });

        it('affiche l\'état vide quand aucun citoyen et chargement terminé', async (): Promise<void> => {
            await setup();

            expect(fixture.nativeElement.querySelector('.citizen-list__empty')).not.toBeNull();
            expect(fixture.nativeElement.querySelector('.citizen-list__loading')).toBeNull();
        });

        it('affiche le spinner de chargement pendant la requête puis le masque', (): void => {
            const pending: Subject<CitizenListPageResult> = new Subject<CitizenListPageResult>();
            userAccountService = jasmine.createSpyObj<UserAccountService>('UserAccountService', ['getCitizensPaged']);
            userAccountService.getCitizensPaged.and.returnValue(pending);
            noteService = jasmine.createSpyObj<NoteService>('NoteService', ['getMyUserNotes', 'saveUserNote']);
            TestBed.configureTestingModule({
                imports: [CitizenListComponent],
                providers: [
                    provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
                    { provide: UserAccountService, useValue: userAccountService },
                    { provide: NoteService, useValue: noteService },
                ]
            }).compileComponents();
            fixture = TestBed.createComponent(CitizenListComponent);
            testable = fixture.componentInstance as unknown as TestableComponent;
            fixture.detectChanges();

            expect(testable.loading()).toBeTrue();
            expect(fixture.nativeElement.querySelector('.citizen-list__loading')).not.toBeNull();

            pending.next(emptyPage);
            pending.complete();
            fixture.detectChanges();

            expect(testable.loading()).toBeFalse();
            expect(fixture.nativeElement.querySelector('.citizen-list__loading')).toBeNull();
        });
    });

    describe('pagination, filtre et tri', (): void => {
        beforeEach(async (): Promise<void> => await setup());

        it('un changement de page recharge avec les nouveaux paramètres', (): void => {
            userAccountService.getCitizensPaged.calls.reset();

            testable.onPageChange({ pageIndex: 2, pageSize: 100 } as PageEvent);

            expect(userAccountService.getCitizensPaged).toHaveBeenCalledWith(jasmine.objectContaining({
                page: 3, pageSize: 100
            } as Partial<CitizenListQuery>));
        });

        it('la saisie du filtre nom (débouncée) réinitialise la page et filtre par nom', fakeAsync((): void => {
            testable.onPageChange({ pageIndex: 2, pageSize: 50 } as PageEvent);
            userAccountService.getCitizensPaged.calls.reset();

            (fixture.componentInstance as unknown as { filtersForm: { controls: { name: { setValue(v: string): void } } } })
                .filtersForm.controls['name'].setValue('lice');
            tick(300);

            expect(userAccountService.getCitizensPaged).toHaveBeenCalledWith(jasmine.objectContaining({
                page: 1, name: 'lice'
            } as Partial<CitizenListQuery>));
        }));

        it('trier sur une nouvelle colonne réinitialise la page et recharge avec ce tri', (): void => {
            testable.onPageChange({ pageIndex: 2, pageSize: 50 } as PageEvent);
            userAccountService.getCitizensPaged.calls.reset();

            const nameHeader: HTMLElement = fixture.nativeElement.querySelector('th[mat-sort-header="name"]');
            nameHeader.click();
            fixture.detectChanges();

            expect(userAccountService.getCitizensPaged).toHaveBeenCalledWith(jasmine.objectContaining({
                page: 1, sortColumn: 'name', sortDirection: 'asc'
            } as Partial<CitizenListQuery>));
        });
    });

    describe('note privée', (): void => {
        beforeEach(async (): Promise<void> => {
            localStorage.setItem('user', JSON.stringify({ id: 5 }));
            await setup();
        });

        afterEach((): void => localStorage.removeItem('user'));

        it('sauvegarde la note saisie dans le dialogue et met à jour le signal', (): void => {
            const dialog: MatDialog = fixture.debugElement.injector.get(MatDialog);
            const content$: Observable<string> = of('<p>note</p>');
            spyOn(dialog, 'open').and.returnValue({ afterClosed: () => content$ } as unknown as MatDialogRef<unknown>);
            noteService.saveUserNote.and.returnValue(of(void 0));

            testable.openUserNote(7);

            expect(noteService.saveUserNote).toHaveBeenCalledWith(7, '<p>note</p>');
            expect(testable.userNotes()[7].note).toBe('<p>note</p>');
        });

        it('ne sauvegarde rien si le dialogue est fermé sans valeur', (): void => {
            const dialog: MatDialog = fixture.debugElement.injector.get(MatDialog);
            const content$: Observable<undefined> = of(undefined);
            spyOn(dialog, 'open').and.returnValue({ afterClosed: () => content$ } as unknown as MatDialogRef<unknown>);

            testable.openUserNote(7);

            expect(noteService.saveUserNote).not.toHaveBeenCalled();
        });
    });
});
