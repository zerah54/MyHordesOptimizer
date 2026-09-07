import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { MinesweeperGameCompleted, MinesweeperGameStarted, MinesweeperService } from '../../_abstract_model/services/minesweeper.service';

import { Me } from '../../_abstract_model/types/me.class';
import { setUser } from '../../_core/utilities/localstorage.util';
import { MinesweeperLeaderboardDialogComponent } from './leaderboard-dialog/minesweeper-leaderboard-dialog.component';
import { MinesweeperComponent } from './minesweeper.component';

interface Cell {
    is_mine: boolean;
    is_revealed: boolean;
    is_flagged: boolean;
    is_questioned: boolean;
    is_highlighted: boolean;
}

interface TestableComponent {
    board: { (): Cell[][] };
    game_over: { (): boolean };
    remaining_mines: { (): number };
    is_fullscreen: { (): boolean };
    selected_size: { (): { id: string; label: string } };
    game_mode: { (): 'normal' | 'daily' };
    leaderboard_size_id: { (): string };
    leaderboard_mode: { (): 'normal' | 'daily' };
    revealCell(i: number, j: number): void;
    cycleMarker(i: number, j: number): void;
    onCellMouseDown(i: number, j: number, event: MouseEvent): void;
    onCellMouseEnter(i: number, j: number): void;
    switchMode(mode: 'normal' | 'daily'): void;
    openFullscreen(): void;
    closeFullscreen(): void;
    openLeaderboard(): void;
}

function startedBoard(mines: number[]): MinesweeperGameStarted {
    return {
        gameId: 1,
        width: 2,
        height: 2,
        mineCount: mines.filter((m: number) => m === 1).length,
        mines,
        adjacentCounts: [0, 0, 0, 0],
        timerStarted: true,
        firstClickX: 0,
        firstClickY: 0,
        startedAt: '2026-01-01T00:00:00Z'
    };
}

describe('MinesweeperComponent', (): void => {
    let fixture: ComponentFixture<MinesweeperComponent>;
    let testable: TestableComponent;
    let minesweeperService: jasmine.SpyObj<MinesweeperService>;

    async function setup(): Promise<void> {
        minesweeperService = jasmine.createSpyObj<MinesweeperService>(
            'MinesweeperService', ['createGame', 'startGame', 'completeGame', 'getChallengesToday']
        );
        minesweeperService.getChallengesToday.and.returnValue(of([]));
        minesweeperService.completeGame.and.returnValue(of({ outcome: 'won', elapsedMs: null } as MinesweeperGameCompleted));

        await TestBed.configureTestingModule({
            imports: [MinesweeperComponent],
            providers: [
                provideHttpClient(), provideHttpClientTesting(),
                { provide: MinesweeperService, useValue: minesweeperService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(MinesweeperComponent);
        testable = fixture.componentInstance as unknown as TestableComponent;
        fixture.detectChanges();
    }

    afterEach((): void => {
        setUser(null);
        document.querySelectorAll('.cdk-overlay-container').forEach((el: Element) => el.remove());
    });

    describe('rendu', (): void => {
        it('affiche l\'avertissement invité quand personne n\'est connecté', async (): Promise<void> => {
            setUser(null);
            await setup();
            expect(fixture.nativeElement.querySelector('.guest-warning')).not.toBeNull();
        });

        it('masque l\'avertissement invité une fois connecté', async (): Promise<void> => {
            setUser(Object.assign(new Me(), { id: 1 }));
            await setup();
            expect(fixture.nativeElement.querySelector('.guest-warning')).toBeNull();
        });

        it('sélectionne la taille "Moyen" par défaut avec 40 mines à découvrir', async (): Promise<void> => {
            await setup();
            expect(testable.selected_size().id).toBe('medium');
            expect(testable.remaining_mines()).toBe(40);
            expect(testable.board().length).toBe(16);
            expect(testable.board()[0].length).toBe(16);
        });
    });

    describe('déroulement de la partie', (): void => {
        beforeEach(async (): Promise<void> => await setup());

        it('démarre une partie serveur au premier clic puis révèle la cellule', (): void => {
            minesweeperService.createGame.and.returnValue(of(startedBoard([0, 0, 0, 0])));

            testable.revealCell(0, 0);

            expect(minesweeperService.createGame).toHaveBeenCalledWith(jasmine.objectContaining({
                sizeId: 'medium', mode: 'normal', firstClickX: 0, firstClickY: 0
            }));
            expect(testable.board().length).toBe(2);
            expect(testable.board()[0][0].is_revealed).toBeTrue();
        });

        it('perd la partie et la signale au serveur en cliquant sur une mine', (): void => {
            minesweeperService.createGame.and.returnValue(of(startedBoard([1, 0, 0, 0])));

            testable.revealCell(0, 0);

            expect(testable.game_over()).toBeTrue();
            expect(minesweeperService.completeGame).toHaveBeenCalledWith(1, 'lost');
        });

        it('gagne la partie en révélant toutes les cases sans mine', (): void => {
            minesweeperService.createGame.and.returnValue(of(startedBoard([0, 0, 0, 0])));

            testable.revealCell(0, 0);

            expect(testable.game_over()).toBeTrue();
            expect(testable.remaining_mines()).toBe(0);
            expect(minesweeperService.completeGame).toHaveBeenCalledWith(1, 'won');
        });

        it('bascule en mode défi du jour et démarre une partie serveur dédiée', (): void => {
            minesweeperService.createGame.and.returnValue(of(startedBoard([0, 0, 0, 0])));

            testable.switchMode('daily');

            expect(testable.game_mode()).toBe('daily');
            expect(minesweeperService.createGame).toHaveBeenCalledWith(jasmine.objectContaining({ mode: 'daily' }));
        });
    });

    describe('marquage des cases', (): void => {
        beforeEach(async (): Promise<void> => await setup());

        it('marque puis interroge puis démarque une case, en ajustant le compteur de mines restantes', (): void => {
            expect(testable.remaining_mines()).toBe(40);

            testable.cycleMarker(0, 0);
            expect(testable.board()[0][0].is_flagged).toBeTrue();
            expect(testable.remaining_mines()).toBe(39);

            testable.cycleMarker(0, 0);
            expect(testable.board()[0][0].is_flagged).toBeFalse();
            expect(testable.board()[0][0].is_questioned).toBeTrue();
            expect(testable.remaining_mines()).toBe(40);

            testable.cycleMarker(0, 0);
            expect(testable.board()[0][0].is_questioned).toBeFalse();
        });
    });

    describe('HostListener window:keydown.escape', (): void => {
        beforeEach(async (): Promise<void> => await setup());

        it('quitte le plein écran sur Échap', (): void => {
            testable.openFullscreen();
            expect(testable.is_fullscreen()).toBeTrue();

            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

            expect(testable.is_fullscreen()).toBeFalse();
        });

        it('n\'a aucun effet hors plein écran', (): void => {
            expect(testable.is_fullscreen()).toBeFalse();

            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

            expect(testable.is_fullscreen()).toBeFalse();
        });
    });

    describe('HostListener window:mouseup', (): void => {
        beforeEach(async (): Promise<void> => await setup());

        it('arrête le survol-appui en cours dès le relâchement du bouton, où que ce soit sur la fenêtre', (): void => {
            testable.onCellMouseDown(0, 0, { button: 0 } as MouseEvent);
            testable.onCellMouseEnter(0, 1);
            expect(testable.board()[0][1].is_highlighted).toBeTrue();

            window.dispatchEvent(new MouseEvent('mouseup'));

            testable.onCellMouseEnter(1, 1);
            expect(testable.board()[1][1].is_highlighted).toBeFalse();
        });
    });

    describe('ViewChild #boardAndControlsTemplate (plein écran)', (): void => {
        beforeEach(async (): Promise<void> => await setup());

        it('attache le template du plateau à un overlay CDK en plein écran', (): void => {
            testable.openFullscreen();

            const overlayPane: Element | null = document.querySelector('.mho-minesweeper-fullscreen-overlay .game-container');
            expect(overlayPane).not.toBeNull();

            testable.closeFullscreen();

            expect(document.querySelector('.mho-minesweeper-fullscreen-overlay')).toBeNull();
        });
    });

    describe('ViewChild #leaderboardTemplate (classement)', (): void => {
        beforeEach(async (): Promise<void> => await setup());

        it('ouvre la modale de classement avec le template et la difficulté courante', (): void => {
            const dialog: MatDialog = fixture.debugElement.injector.get(MatDialog);
            const openSpy: jasmine.Spy = spyOn(dialog, 'open').and.returnValue({} as MatDialogRef<unknown>);

            testable.openLeaderboard();

            expect(openSpy).toHaveBeenCalledWith(MinesweeperLeaderboardDialogComponent, jasmine.objectContaining({
                data: jasmine.objectContaining({ template: jasmine.anything() })
            }));
            expect(testable.leaderboard_size_id()).toBe(testable.selected_size().id);
            expect(testable.leaderboard_mode()).toBe(testable.game_mode());
        });
    });
});
