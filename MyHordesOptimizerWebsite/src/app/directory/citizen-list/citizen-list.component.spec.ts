import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { provideRouter, Router } from '@angular/router';
import { Observable, of, Subject } from 'rxjs';
import type { MockedObject } from 'vitest';

import { CitizenListQuery } from '../../_abstract_model/dto/citizen-list-page.dto';
import { NoteDTO } from '../../_abstract_model/dto/note.dto';
import { NoteService } from '../../_abstract_model/services/note.service';
import { UserAccountService } from '../../_abstract_model/services/user-account.service';
import { Dictionary } from '../../_abstract_model/types/_types';
import { CitizenListItem, CitizenListPageResult } from '../../_abstract_model/types/citizen-list-item.model';
import { Me } from '../../_abstract_model/types/me.class';
import { setUser } from '../../_core/utilities/localstorage.util';
import { CitizenListComponent } from './citizen-list.component';

interface TestableComponent {
    myUserId: number | null;
    displayedColumns: {
        (): string[];
    };
    userNotes: {
        (): Dictionary<NoteDTO>;
    };
    citizens: {
        (): CitizenListItem[];
    };
    loading: {
        (): boolean;
    };
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
    let userAccountService: MockedObject<UserAccountService>;
    let noteService: MockedObject<NoteService>;
    let router: Router;

    async function setup(): Promise<void> {
        userAccountService = {
            getCitizensPaged: vi.fn().mockName('UserAccountService.getCitizensPaged')
        } as unknown as MockedObject<UserAccountService>;
        userAccountService.getCitizensPaged.mockReturnValue(of(emptyPage));
        noteService = {
            getMyUserNotes: vi.fn().mockName('NoteService.getMyUserNotes'),
            saveUserNote: vi.fn().mockName('NoteService.saveUserNote')
        } as unknown as MockedObject<NoteService>;
        noteService.getMyUserNotes.mockReturnValue(of({ 5: { note: '<p>hello</p>' } as NoteDTO }));

        await TestBed.configureTestingModule({
            imports: [CitizenListComponent],
            providers: [
                provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([]),
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
            setUser(Object.assign(new Me(), { id: 5 }));
            await setup();
        });

        afterEach((): void => setUser(null));

        it('navigue vers /profile/:id au clic sur une ligne', (): void => {
            const navigateSpy = vi.spyOn(router, 'navigate');
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
            setUser(null);
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

            expect(userAccountService.getCitizensPaged).toHaveBeenCalledWith(expect.objectContaining({
                page: 1, pageSize: 50, sortColumn: 'nbTownsPlayed', sortDirection: 'desc', name: undefined
            } as Partial<CitizenListQuery>));
        });

        it('affiche une ligne par citoyen renvoyé', async (): Promise<void> => {
            userAccountService = {
                getCitizensPaged: vi.fn().mockName('UserAccountService.getCitizensPaged')
            } as unknown as MockedObject<UserAccountService>;
            userAccountService.getCitizensPaged.mockReturnValue(of({ items: sampleCitizens, totalCount: 2 }));
            noteService = {
                getMyUserNotes: vi.fn().mockName('NoteService.getMyUserNotes'),
                saveUserNote: vi.fn().mockName('NoteService.saveUserNote')
            } as unknown as MockedObject<NoteService>;
            await TestBed.configureTestingModule({
                imports: [CitizenListComponent],
                providers: [
                    provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([]),
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
            userAccountService = {
                getCitizensPaged: vi.fn().mockName('UserAccountService.getCitizensPaged')
            } as unknown as MockedObject<UserAccountService>;
            userAccountService.getCitizensPaged.mockReturnValue(pending);
            noteService = {
                getMyUserNotes: vi.fn().mockName('NoteService.getMyUserNotes'),
                saveUserNote: vi.fn().mockName('NoteService.saveUserNote')
            } as unknown as MockedObject<NoteService>;
            TestBed.configureTestingModule({
                imports: [CitizenListComponent],
                providers: [
                    provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([]),
                    { provide: UserAccountService, useValue: userAccountService },
                    { provide: NoteService, useValue: noteService },
                ]
            }).compileComponents();
            fixture = TestBed.createComponent(CitizenListComponent);
            testable = fixture.componentInstance as unknown as TestableComponent;
            fixture.detectChanges();

            expect(testable.loading()).toBe(true);
            expect(fixture.nativeElement.querySelector('.citizen-list__loading')).not.toBeNull();

            pending.next(emptyPage);
            pending.complete();
            fixture.detectChanges();

            expect(testable.loading()).toBe(false);
            expect(fixture.nativeElement.querySelector('.citizen-list__loading')).toBeNull();
        });
    });

    describe('pagination, filtre et tri', (): void => {
        beforeEach(async (): Promise<void> => {
            await setup();
            vi.useFakeTimers();
        });

        afterEach((): void => {
            vi.useRealTimers();
        });

        it('un changement de page recharge avec les nouveaux paramètres', (): void => {
            userAccountService.getCitizensPaged.mockClear();

            testable.onPageChange({ pageIndex: 2, pageSize: 100 } as PageEvent);

            expect(userAccountService.getCitizensPaged).toHaveBeenCalledWith(expect.objectContaining({
                page: 3, pageSize: 100
            } as Partial<CitizenListQuery>));
        });

        it('la saisie du filtre nom (débouncée) réinitialise la page et filtre par nom', async (): Promise<void> => {
            testable.onPageChange({ pageIndex: 2, pageSize: 50 } as PageEvent);
            userAccountService.getCitizensPaged.mockClear();

            (fixture.componentInstance as unknown as {
                filtersForm: {
                    controls: {
                        name: {
                            setValue(v: string): void;
                        };
                    };
                };
            })
                .filtersForm.controls['name'].setValue('lice');
            await vi.advanceTimersByTimeAsync(300);

            expect(userAccountService.getCitizensPaged).toHaveBeenCalledWith(expect.objectContaining({
                page: 1, name: 'lice'
            } as Partial<CitizenListQuery>));
        });

        it('trier sur une nouvelle colonne réinitialise la page et recharge avec ce tri', (): void => {
            testable.onPageChange({ pageIndex: 2, pageSize: 50 } as PageEvent);
            userAccountService.getCitizensPaged.mockClear();

            const nameHeader: HTMLElement = fixture.nativeElement.querySelector('th[mat-sort-header="name"]');
            nameHeader.click();
            fixture.detectChanges();

            expect(userAccountService.getCitizensPaged).toHaveBeenCalledWith(expect.objectContaining({
                page: 1, sortColumn: 'name', sortDirection: 'asc'
            } as Partial<CitizenListQuery>));
        });
    });

    describe('note privée', (): void => {
        beforeEach(async (): Promise<void> => {
            setUser(Object.assign(new Me(), { id: 5 }));
            await setup();
        });

        afterEach((): void => setUser(null));

        it('sauvegarde la note saisie dans le dialogue et met à jour le signal', (): void => {
            const dialog: MatDialog = fixture.debugElement.injector.get(MatDialog);
            const content$: Observable<string> = of('<p>note</p>');
            vi.spyOn(dialog, 'open').mockReturnValue({ afterClosed: () => content$ } as unknown as MatDialogRef<unknown>);
            noteService.saveUserNote.mockReturnValue(of(void 0));

            testable.openUserNote(7);

            expect(noteService.saveUserNote).toHaveBeenCalledWith(7, '<p>note</p>');
            expect(testable.userNotes()[7].note).toBe('<p>note</p>');
        });

        it('ne sauvegarde rien si le dialogue est fermé sans valeur', (): void => {
            const dialog: MatDialog = fixture.debugElement.injector.get(MatDialog);
            const content$: Observable<undefined> = of(undefined);
            vi.spyOn(dialog, 'open').mockReturnValue({ afterClosed: () => content$ } as unknown as MatDialogRef<unknown>);

            testable.openUserNote(7);

            expect(noteService.saveUserNote).not.toHaveBeenCalled();
        });
    });
});
