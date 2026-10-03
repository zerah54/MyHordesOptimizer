import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import type { MockedObject } from 'vitest';

import { MINESWEEPER_THEME_KEY } from '../../_abstract_model/const';
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
    board: {
        (): Cell[][];
    };
    game_over: {
        (): boolean;
    };
    remaining_mines: {
        (): number;
    };
    is_fullscreen: {
        (): boolean;
    };
    selected_theme: {
        (): 'legacy' | 'myhordes';
        set(value: 'legacy' | 'myhordes'): void;
    };
    selected_size: {
        (): {
            id: string;
            label: string;
        };
    };
    game_mode: {
        (): 'normal' | 'daily';
    };
    daily_challenge_pending_start: {
        (): boolean;
    };
    leaderboard_size_id: {
        (): string;
    };
    leaderboard_mode: {
        (): 'normal' | 'daily';
    };
    revealCell(i: number, j: number): void;
    cycleMarker(i: number, j: number): void;
    onCellMouseDown(i: number, j: number, event: MouseEvent): void;
    onCellMouseEnter(i: number, j: number): void;
    switchMode(mode: 'normal' | 'daily'): void;
    startDailyChallenge(): void;
    isAlreadyPlayedToday(sizeId: string): boolean;
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
    let minesweeperService: MockedObject<MinesweeperService>;

    async function setup(): Promise<void> {
        minesweeperService = {
            createGame: vi.fn().mockName('MinesweeperService.createGame'),
            startGame: vi.fn().mockName('MinesweeperService.startGame'),
            completeGame: vi.fn().mockName('MinesweeperService.completeGame'),
            getChallengesToday: vi.fn().mockName('MinesweeperService.getChallengesToday')
        } as unknown as MockedObject<MinesweeperService>;
        minesweeperService.getChallengesToday.mockReturnValue(of([]));
        minesweeperService.completeGame.mockReturnValue(of({ outcome: 'won', elapsedMs: null } as MinesweeperGameCompleted));

        await TestBed.configureTestingModule({
            imports: [MinesweeperComponent],
            providers: [
                provideHttpClient(withXhr()), provideHttpClientTesting(),
                { provide: MinesweeperService, useValue: minesweeperService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(MinesweeperComponent);
        testable = fixture.componentInstance as unknown as TestableComponent;
        fixture.detectChanges();
    }

    afterEach((): void => {
        setUser(null);
        localStorage.removeItem(MINESWEEPER_THEME_KEY);
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

    describe('thème', (): void => {
        function texts(selector: string): string {
            return Array.from(fixture.nativeElement.querySelectorAll(selector) as NodeListOf<HTMLElement>)
                .map((el: HTMLElement) => el.textContent ?? '').join('');
        }

        function count(selector: string): number {
            return fixture.nativeElement.querySelectorAll(selector).length;
        }

        it('utilise le thème Hordes par défaut', async (): Promise<void> => {
            await setup();
            expect(testable.selected_theme()).toBe('myhordes');
            expect(fixture.nativeElement.querySelector('.game-container').classList.contains('myhordes')).toBe(true);
        });

        it('restaure le thème mémorisé', async (): Promise<void> => {
            localStorage.setItem(MINESWEEPER_THEME_KEY, 'legacy');
            await setup();
            expect(testable.selected_theme()).toBe('legacy');
        });

        it('ignore une valeur mémorisée inconnue', async (): Promise<void> => {
            localStorage.setItem(MINESWEEPER_THEME_KEY, 'inconnu');
            await setup();
            expect(testable.selected_theme()).toBe('myhordes');
        });

        it('mémorise le choix fait avec la bascule "Thème Windows"', async (): Promise<void> => {
            await setup();
            const toggle: HTMLButtonElement | null = fixture.nativeElement.querySelector('mat-slide-toggle button[role="switch"]');
            expect(toggle).not.toBeNull();

            toggle?.click();
            fixture.detectChanges();
            expect(testable.selected_theme()).toBe('legacy');
            expect(localStorage.getItem(MINESWEEPER_THEME_KEY)).toBe('legacy');

            toggle?.click();
            fixture.detectChanges();
            expect(testable.selected_theme()).toBe('myhordes');
            expect(localStorage.getItem(MINESWEEPER_THEME_KEY)).toBe('myhordes');
        });

        it('thème Hordes : les cases n\'ont aucune <img>, les icônes viennent du CSS', async (): Promise<void> => {
            await setup();
            testable.cycleMarker(0, 0);
            testable.cycleMarker(0, 1);
            testable.cycleMarker(0, 1);
            fixture.detectChanges();

            expect(count('.game-board .cell.flagged')).toBe(1);
            expect(count('.game-board .cell.questioned')).toBe(1);
            expect(count('.game-board img')).toBe(0);
        });

        it('thème Hordes : les compteurs sont du texte, sans <img>', async (): Promise<void> => {
            await setup();
            expect(count('.remain-mines img, .timer img')).toBe(0);
            expect(texts('.remain-mines .digit')).toBe('40');
            expect(texts('.timer .digit')).toBe('000');
        });

        it('signale le plateau terminé, pour que le CSS masque les « ? » restants', async (): Promise<void> => {
            await setup();
            minesweeperService.createGame.mockReturnValue(of(startedBoard([1, 0, 0, 0])));
            expect(count('.game-container.game-ended')).toBe(0);

            testable.revealCell(0, 0);
            fixture.detectChanges();

            expect(testable.game_over()).toBe(true);
            expect(count('.game-container.game-ended')).toBe(1);
        });

        it('thème Windows : les cases gardent leurs <img>', async (): Promise<void> => {
            localStorage.setItem(MINESWEEPER_THEME_KEY, 'legacy');
            await setup();
            testable.cycleMarker(0, 0);
            fixture.detectChanges();

            expect(count('.game-board .cell.flagged img[src$="bombflagged.png"]')).toBe(1);
        });

        it('thème Windows : les compteurs gardent leurs <img>', async (): Promise<void> => {
            localStorage.setItem(MINESWEEPER_THEME_KEY, 'legacy');
            await setup();

            expect(count('.remain-mines img')).toBe(2);
            expect(count('.timer img')).toBe(3);
            expect(count('.remain-mines .digit, .timer .digit')).toBe(0);
        });
    });

    describe('déroulement de la partie', (): void => {
        beforeEach(async (): Promise<void> => await setup());

        it('démarre une partie serveur au premier clic puis révèle la cellule', (): void => {
            minesweeperService.createGame.mockReturnValue(of(startedBoard([0, 0, 0, 0])));

            testable.revealCell(0, 0);

            expect(minesweeperService.createGame).toHaveBeenCalledWith(expect.objectContaining({
                sizeId: 'medium', mode: 'normal', firstClickX: 0, firstClickY: 0
            }));
            expect(testable.board().length).toBe(2);
            expect(testable.board()[0][0].is_revealed).toBe(true);
        });

        it('perd la partie et la signale au serveur en cliquant sur une mine', (): void => {
            minesweeperService.createGame.mockReturnValue(of(startedBoard([1, 0, 0, 0])));

            testable.revealCell(0, 0);

            expect(testable.game_over()).toBe(true);
            expect(minesweeperService.completeGame).toHaveBeenCalledWith(1, 'lost');
        });

        it('gagne la partie en révélant toutes les cases sans mine', (): void => {
            minesweeperService.createGame.mockReturnValue(of(startedBoard([0, 0, 0, 0])));

            testable.revealCell(0, 0);

            expect(testable.game_over()).toBe(true);
            expect(testable.remaining_mines()).toBe(0);
            expect(minesweeperService.completeGame).toHaveBeenCalledWith(1, 'won');
        });

        it('bascule en mode défi du jour sans démarrer de partie tant que le joueur n\'a pas confirmé', (): void => {
            minesweeperService.createGame.mockReturnValue(of(startedBoard([0, 0, 0, 0])));

            testable.switchMode('daily');

            expect(testable.game_mode()).toBe('daily');
            expect(testable.daily_challenge_pending_start()).toBe(true);
            expect(minesweeperService.createGame).not.toHaveBeenCalled();
        });

        it('démarre la partie serveur du défi du jour uniquement après confirmation explicite', (): void => {
            minesweeperService.createGame.mockReturnValue(of(startedBoard([0, 0, 0, 0])));
            testable.switchMode('daily');

            testable.startDailyChallenge();

            expect(testable.daily_challenge_pending_start()).toBe(false);
            expect(minesweeperService.createGame).toHaveBeenCalledWith(expect.objectContaining({ mode: 'daily' }));
        });

        it('empêche de refaire le défi du jour déjà tenté à cette difficulté', (): void => {
            minesweeperService.getChallengesToday.mockReturnValue(of([{ sizeId: 'medium', alreadyPlayedToday: true }]));
            minesweeperService.createGame.mockReturnValue(of(startedBoard([0, 0, 0, 0])));

            testable.switchMode('daily');

            expect(testable.isAlreadyPlayedToday('medium')).toBe(true);
            expect(testable.daily_challenge_pending_start()).toBe(true);
            expect(minesweeperService.createGame).not.toHaveBeenCalled();
        });
    });

    describe('marquage des cases', (): void => {
        beforeEach(async (): Promise<void> => await setup());

        it('marque puis interroge puis démarque une case, en ajustant le compteur de mines restantes', (): void => {
            expect(testable.remaining_mines()).toBe(40);

            testable.cycleMarker(0, 0);
            expect(testable.board()[0][0].is_flagged).toBe(true);
            expect(testable.remaining_mines()).toBe(39);

            testable.cycleMarker(0, 0);
            expect(testable.board()[0][0].is_flagged).toBe(false);
            expect(testable.board()[0][0].is_questioned).toBe(true);
            expect(testable.remaining_mines()).toBe(40);

            testable.cycleMarker(0, 0);
            expect(testable.board()[0][0].is_questioned).toBe(false);
        });
    });

    describe('HostListener window:keydown.escape', (): void => {
        beforeEach(async (): Promise<void> => await setup());

        it('quitte le plein écran sur Échap', (): void => {
            testable.openFullscreen();
            expect(testable.is_fullscreen()).toBe(true);

            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

            expect(testable.is_fullscreen()).toBe(false);
        });

        it('n\'a aucun effet hors plein écran', (): void => {
            expect(testable.is_fullscreen()).toBe(false);

            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

            expect(testable.is_fullscreen()).toBe(false);
        });
    });

    describe('HostListener window:mouseup', (): void => {
        beforeEach(async (): Promise<void> => await setup());

        it('arrête le survol-appui en cours dès le relâchement du bouton, où que ce soit sur la fenêtre', (): void => {
            testable.onCellMouseDown(0, 0, { button: 0 } as MouseEvent);
            testable.onCellMouseEnter(0, 1);
            expect(testable.board()[0][1].is_highlighted).toBe(true);

            window.dispatchEvent(new MouseEvent('mouseup'));

            testable.onCellMouseEnter(1, 1);
            expect(testable.board()[1][1].is_highlighted).toBe(false);
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
            const openSpy = vi.spyOn(dialog, 'open').mockReturnValue({} as MatDialogRef<unknown>);

            testable.openLeaderboard();

            expect(openSpy).toHaveBeenCalledWith(MinesweeperLeaderboardDialogComponent, expect.objectContaining({
                data: expect.objectContaining({ template: expect.anything() })
            }));
            expect(testable.leaderboard_size_id()).toBe(testable.selected_size().id);
            expect(testable.leaderboard_mode()).toBe(testable.game_mode());
        });
    });
});
