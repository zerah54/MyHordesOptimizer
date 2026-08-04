import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    HostListener,
    inject,
    OnDestroy,
    OnInit,
    Signal,
    signal,
    TemplateRef,
    ViewChild,
    ViewContainerRef,
    WritableSignal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment, { Moment } from 'moment';

import { MINESWEEPER_ZOOM_KEY } from '../../_abstract_model/const';
import { MinesweeperChallengeStatus, MinesweeperGameStarted, MinesweeperService } from '../../_abstract_model/services/minesweeper.service';
import { Imports } from '../../_abstract_model/types/_types';
import { CounterFromDatePipe, DiffBetweenDatesPipe } from '../../_core/utilities/date.util';
import { createDelayedLoadingController, DelayedLoadingController } from '../../_core/utilities/delayed-loading.util';
import { getUser } from '../../_core/utilities/localstorage.util';
import { MinesweeperHistoryComponent } from './game-history/minesweeper-history.component';
import { MinesweeperLeaderboardComponent } from './leaderboard/minesweeper-leaderboard.component';
import { MinesweeperLeaderboardDialogComponent, MinesweeperLeaderboardDialogData } from './leaderboard-dialog/minesweeper-leaderboard-dialog.component';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [MinesweeperLeaderboardComponent, MinesweeperHistoryComponent];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatButtonToggleModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule, MatMenuModule, MatIconModule, MatTabsModule, MatTooltipModule];

@Component({
    selector: 'mho-minesweeper',
    templateUrl: 'minesweeper.component.html',
    styleUrls: ['minesweeper.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...components, ...material_modules, ...pipes, CounterFromDatePipe, DiffBetweenDatesPipe]
})
export class MinesweeperComponent implements OnInit, OnDestroy {
    protected board: WritableSignal<Cell[][]> = signal([]);
    protected remaining_mines: WritableSignal<number> = signal(0);
    protected game_over: WritableSignal<boolean> = signal(false);
    protected start_time: WritableSignal<Moment | undefined> = signal(undefined);
    protected end_time: WritableSignal<Moment | undefined> = signal(undefined);
    private board_initialized: WritableSignal<boolean> = signal(false);

    private readonly minesweeperService: MinesweeperService = inject(MinesweeperService);
    protected readonly board_loading: WritableSignal<boolean> = signal(false);
    private readonly board_loading_controller: DelayedLoadingController = createDelayedLoadingController((loading: boolean) => this.board_loading.set(loading));
    protected readonly board_error: WritableSignal<boolean> = signal(false);
    private current_game_id: WritableSignal<number | undefined> = signal(undefined);

    protected readonly game_mode: WritableSignal<'normal' | 'daily'> = signal('normal');
    protected readonly is_guest: Signal<boolean> = signal(!getUser());
    protected readonly challenges_today: WritableSignal<MinesweeperChallengeStatus[]> = signal([]);
    private timer_started_by_server: WritableSignal<boolean> = signal(true);
    private long_press_timeout: ReturnType<typeof setTimeout> | undefined;
    private long_press_origin: { x: number; y: number } | undefined;
    private long_press_fired: boolean = false;
    private is_mouse_button_down: boolean = false;

    protected readonly Math: Math = Math;

    protected sizes_list: Signal<MinesweeperSize[]> = signal([
        { id: 'small', label: $localize`Facile`, height: 9, width: 9, mines: 10 },
        { id: 'medium', label: $localize`Moyen`, height: 16, width: 16, mines: 40, default: true },
        { id: 'large', label: $localize`Difficile`, height: 16, width: 30, mines: 99 },
        { id: 'expert', label: $localize`Expert`, height: 50, width: 50, mines: 500 },
        { id: 'impossible', label: $localize`Impossible`, height: 100, width: 100, mines: 2000 },
        { id: 'custom', label: $localize`Personnalisé`, height: 16, width: 30, mines: 120 }
    ]);
    protected selected_size: WritableSignal<MinesweeperSize> = signal(this.sizes_list().find((size: MinesweeperSize) => size.default) ?? this.sizes_list()[0]);
    /** Nombre de chiffres du compteur de mines pour la partie en cours (calculé une fois par partie, jamais recalculé en cours de jeu). */
    protected readonly mine_counter_digits: WritableSignal<number> = signal(this.selected_size().mines.toString().length);

    protected selected_theme: WritableSignal<'legacy' | 'myhordes'> = signal('legacy');
    private preloadLinks: WritableSignal<HTMLLinkElement[]> = signal([]);

    /** Niveau de zoom des cellules, en pourcentage (100 = taille normale, pas de plafond). Persisté en localStorage. */
    protected readonly zoom_level: WritableSignal<number> = signal(
        Math.max(100, Number(localStorage.getItem(MINESWEEPER_ZOOM_KEY)) || 100)
    );

    @ViewChild('boardAndControlsTemplate') private boardAndControlsTemplate!: TemplateRef<unknown>;
    @ViewChild('leaderboardTemplate') private leaderboardTemplate!: TemplateRef<unknown>;
    private readonly dialog: MatDialog = inject(MatDialog);
    private readonly overlay: Overlay = inject(Overlay);
    private readonly viewContainerRef: ViewContainerRef = inject(ViewContainerRef);
    private fullscreenOverlayRef: OverlayRef | undefined;
    protected readonly is_fullscreen: WritableSignal<boolean> = signal(false);

    // Filtre propre à la modale de classement : n'a aucun lien avec la partie en cours (selected_size/
    // game_mode) une fois ouverte — seulement initialisé sur la difficulté/le mode courants à l'ouverture.
    protected readonly leaderboard_size_id: WritableSignal<string> = signal(this.selected_size().id);
    protected readonly leaderboard_mode: WritableSignal<'normal' | 'daily'> = signal(this.game_mode());

    public ngOnInit(): void {
        this.resetGame();
        this.refreshChallengesToday();

        const images: string[] = [
            'img/minesweeper/bomb.png', 'img/minesweeper/bombflagged.png', 'img/minesweeper/bombquestion.png', 'img/minesweeper/nobomb.png',
            'img/minesweeper/smile.png', 'img/minesweeper/lose.png', 'img/minesweeper/win.png',
            ...Array.from({ length: 8 }, (_: unknown, i: number) => `img/minesweeper/adjacent_${i + 1}.png`),
            ...Array.from({ length: 10 }, (_: unknown, i: number) => `img/minesweeper/timer_${i}.png`),
        ];

        this.preloadLinks.set(images.map((name: string) => {
            const link: HTMLLinkElement = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = name;
            document.head.appendChild(link);
            return link;
        }));
    }

    public ngOnDestroy(): void {
        this.clearLongPressTimer();
        this.fullscreenOverlayRef?.dispose();
        this.preloadLinks.update((links: HTMLLinkElement[]) => {
            links.forEach((link: HTMLLinkElement) => link.remove());
            return links;
        });
    }

    private refreshChallengesToday(): void {
        this.minesweeperService.getChallengesToday().subscribe({
            next: (statuses: MinesweeperChallengeStatus[]) => this.challenges_today.set(statuses)
        });
    }

    protected switchMode(mode: 'normal' | 'daily'): void {
        this.game_mode.set(mode);
        // Le défi du jour n'existe pas en taille Personnalisée (rejeté par le serveur) : si le joueur
        // y bascule alors que "Personnalisé" était sélectionné, revenir sur la taille par défaut évite
        // une erreur immédiate et bloquante.
        if (mode === 'daily' && this.selected_size().id === 'custom') {
            this.resetGame(this.sizes_list().find((size: MinesweeperSize) => size.default) ?? this.sizes_list()[0]);
        } else {
            this.resetGame();
        }
    }

    protected increaseZoom(): void {
        this.zoom_level.update((zoom: number) => zoom + 10);
        localStorage.setItem(MINESWEEPER_ZOOM_KEY, this.zoom_level().toString());
    }

    protected decreaseZoom(): void {
        this.zoom_level.update((zoom: number) => Math.max(100, zoom - 10));
        localStorage.setItem(MINESWEEPER_ZOOM_KEY, this.zoom_level().toString());
    }

    protected openFullscreen(): void {
        this.is_fullscreen.set(true);
        // Un simple `position: fixed` reste piégé dans le contexte d'empilement de ses ancêtres (le
        // conteneur de la sidenav, la carte de la page...) : son z-index, même très élevé, ne bat alors
        // jamais des éléments EXTÉRIEURS à cet ancêtre, comme la barre d'outils de l'application. Le
        // CDK Overlay s'attache à sa place sous <body> (comme le fait MatDialog), hors de tout contexte
        // d'empilement de la page — sans le "chrome" (coins arrondis, tailles contraintes) d'une MatDialog.
        this.fullscreenOverlayRef = this.overlay.create({
            positionStrategy: this.overlay.position().global().top('0').left('0'),
            hasBackdrop: false,
            panelClass: 'mho-minesweeper-fullscreen-overlay',
            width: '100vw',
            height: '100vh'
        });
        this.fullscreenOverlayRef.attach(new TemplatePortal(this.boardAndControlsTemplate, this.viewContainerRef));
    }

    protected closeFullscreen(): void {
        this.fullscreenOverlayRef?.dispose();
        this.fullscreenOverlayRef = undefined;
        this.is_fullscreen.set(false);
    }

    @HostListener('window:keydown.escape')
    protected onEscapeKey(): void {
        if (this.is_fullscreen()) {
            this.closeFullscreen();
        }
    }

    protected openLeaderboard(): void {
        this.leaderboard_size_id.set(this.selected_size().id);
        this.leaderboard_mode.set(this.game_mode());
        this.dialog.open<MinesweeperLeaderboardDialogComponent, MinesweeperLeaderboardDialogData>(MinesweeperLeaderboardDialogComponent, {
            data: { template: this.leaderboardTemplate },
            width: '700px',
            maxWidth: '95vw'
        });
    }

    protected isAlreadyPlayedToday(sizeId: string): boolean {
        return this.game_mode() === 'daily' && (this.challenges_today().find((c: MinesweeperChallengeStatus) => c.sizeId === sizeId)?.alreadyPlayedToday ?? false);
    }

    protected leaderboardSizeLabel(): string {
        return this.sizes_list().find((size: MinesweeperSize) => size.id === this.leaderboard_size_id())?.label ?? '';
    }

    /** Formate une valeur en tableau de chiffres, complétés par des zéros de tête jusqu'à `minDigits` (jamais tronqué au-delà). */
    protected formatDigits(value: number, minDigits: number): string[] {
        return Math.max(0, value).toString().padStart(minDigits, '0').split('');
    }

    protected revealCell(i: number, j: number): void {
        if (this.game_over() || this.board()[i][j].is_flagged || this.board()[i][j].is_questioned || this.board_loading()) return;

        if (!this.board_initialized()) {
            this.startServerGame(j, i);
            return;
        }

        if (!this.timer_started_by_server()) {
            this.timer_started_by_server.set(true);
            this.start_time.set(moment());
            this.end_time.set(undefined);
            this.minesweeperService.startGame(this.current_game_id() as number).subscribe();
        }

        if (this.board()[i][j].is_revealed) {
            this.revealAdjacentIfSafe(i, j);
            return;
        }

        this.board.update((board: Cell[][]) => {
            board[i][j].is_revealed = true;
            return board;
        });

        if (this.board()[i][j].is_mine) {
            this.board.update((board: Cell[][]) => {
                board[i][j].is_game_over = true;
                return board;
            });
            this.game_over.set(true);
            this.end_time.set(moment());
            this.revealAllMines();
            this.completeCurrentGame('lost');
        } else if (this.board()[i][j].adjacent_mines === 0) {
            this.revealAdjacentCells(i, j);
        }

        this.checkWinCondition();
    }

    private startServerGame(clickX: number, clickY: number): void {
        this.board_loading_controller.start();
        this.board_error.set(false);

        this.minesweeperService.createGame({
            sizeId: this.selected_size().id,
            mode: 'normal',
            width: this.selected_size().id === 'custom' ? this.selected_size().width : undefined,
            height: this.selected_size().id === 'custom' ? this.selected_size().height : undefined,
            mineCount: this.selected_size().id === 'custom' ? this.selected_size().mines : undefined,
            firstClickX: clickX,
            firstClickY: clickY
        }).subscribe({
            next: (started: MinesweeperGameStarted) => {
                this.current_game_id.set(started.gameId);
                this.applyServerBoard(started);
                // La taille/nombre de mines vus par le serveur font foi (source unique de vérité pour
                // les tailles prédéfinies) : si jamais le preset local divergeait de celui du serveur,
                // le compteur affiché doit refléter la vraie grille reçue, pas la config locale.
                this.remaining_mines.set(started.mineCount);
                this.mine_counter_digits.set(started.mineCount.toString().length);
                this.board_initialized.set(true);
                this.board_loading_controller.stop();
                this.start_time.set(moment());
                this.end_time.set(undefined);
                this.revealCell(clickY, clickX);
            },
            error: () => {
                this.board_loading_controller.stop();
                this.board_error.set(true);
            }
        });
    }

    private applyServerBoard(started: MinesweeperGameStarted): void {
        this.resetLocalBoardOnly(started.width, started.height);
        for (let y: number = 0; y < started.height; y++) {
            for (let x: number = 0; x < started.width; x++) {
                const idx: number = y * started.width + x;
                this.board.update((board: Cell[][]) => {
                    board[y][x].is_mine = started.mines[idx] === 1;
                    board[y][x].adjacent_mines = started.adjacentCounts[idx];
                    return board;
                });
            }
        }
    }

    private completeCurrentGame(outcome: 'won' | 'lost'): void {
        const game_id: number | undefined = this.current_game_id();
        if (!game_id) return;
        this.minesweeperService.completeGame(game_id, outcome).subscribe();
    }

    protected resetGame(new_selected_size?: Partial<MinesweeperSize>): void {
        if (new_selected_size) {
            this.selected_size.update((selected_size: MinesweeperSize) => {
                if (new_selected_size.id) {
                    selected_size = new_selected_size as MinesweeperSize;
                } else {
                    if (new_selected_size.width) selected_size.width = new_selected_size.width;
                    if (new_selected_size.height) selected_size.height = new_selected_size.height;
                    if (new_selected_size.mines) selected_size.mines = new_selected_size.mines;
                }
                return selected_size;
            });
        }
        if (this.selected_size().id === 'custom') {
            this.selected_size.update((selected_size: MinesweeperSize) => {
                selected_size.width = Math.max(1, selected_size.width);
                selected_size.height = Math.max(1, selected_size.height);
                selected_size.mines = Math.min(Math.max(1, selected_size.height), selected_size.width * selected_size.height);
                return selected_size;
            });
        }
        this.resetLocalBoardOnly(this.selected_size().width, this.selected_size().height);
        this.board_initialized.set(false);
        this.board_error.set(false);
        this.current_game_id.set(undefined);
        this.game_over.set(false);
        this.remaining_mines.set(this.selected_size().mines);
        this.mine_counter_digits.set(this.selected_size().mines.toString().length);
        this.start_time.set(undefined);
        this.end_time.set(undefined);
        this.timer_started_by_server.set(true);

        if (this.game_mode() === 'daily') {
            this.loadDailyBoard();
        }
    }

    private loadDailyBoard(): void {
        this.board_loading_controller.start();
        this.board_error.set(false);

        this.minesweeperService.createGame({
            sizeId: this.selected_size().id,
            mode: 'daily'
        }).subscribe({
            next: (started: MinesweeperGameStarted) => {
                this.current_game_id.set(started.gameId);
                this.applyServerBoard(started);
                this.remaining_mines.set(started.mineCount);
                this.mine_counter_digits.set(started.mineCount.toString().length);
                this.board_initialized.set(true);
                this.board_loading_controller.stop();

                if (started.timerStarted && started.startedAt) {
                    // Reprise d'une partie déjà démarrée (rafraîchissement en cours de défi) : le
                    // chrono affiché doit repartir de l'horodatage serveur d'origine, pas de zéro.
                    this.start_time.set(moment(started.startedAt));
                    this.end_time.set(undefined);
                }

                // La case centrale révélée automatiquement doit se propager comme un vrai clic
                // (zone de départ garantie sans mine adjacente) sans pour autant démarrer le chrono :
                // on force temporairement timer_started_by_server à true le temps de rejouer la
                // révélation via revealCell (qui gère nativement la cascade), puis on restaure l'état
                // réel pour que le PROCHAIN clic (le vrai premier clic du joueur) démarre bien le chrono.
                this.timer_started_by_server.set(true);
                this.revealCell(started.firstClickY, started.firstClickX);
                this.timer_started_by_server.set(started.timerStarted);
            },
            error: () => {
                this.board_loading_controller.stop();
                this.board_error.set(true);
            }
        });
    }

    protected cycleMarker(i: number, j: number, event?: Event): void {
        event?.preventDefault();
        if (this.game_over() || this.board()[i][j].is_revealed) return;

        this.board.update((board: Cell[][]) => {
            const cell: Cell = board[i][j];
            if (!cell.is_flagged && !cell.is_questioned) {
                cell.is_flagged = true;
                this.remaining_mines.update((remaining_mines: number) => {
                    remaining_mines--;
                    return remaining_mines;
                });
            } else if (cell.is_flagged) {
                cell.is_flagged = false;
                cell.is_questioned = true;
                this.remaining_mines.update((remaining_mines: number) => {
                    remaining_mines++;
                    return remaining_mines;
                });
            } else {
                cell.is_questioned = false;
            }
            return board;
        });

        this.checkWinCondition();
    }

    protected onCellTouchStart(i: number, j: number, event: TouchEvent): void {
        this.clearLongPressTimer();
        this.long_press_fired = false;
        this.long_press_origin = { x: event.touches[0].clientX, y: event.touches[0].clientY };
        this.long_press_timeout = setTimeout(() => {
            this.long_press_fired = true;
            this.triggerLongPress(i, j);
        }, 500);
    }

    protected onCellTouchMove(event: TouchEvent): void {
        if (!this.long_press_origin || this.long_press_timeout === undefined) return;
        const touch: Touch = event.touches[0];
        const dx: number = touch.clientX - this.long_press_origin.x;
        const dy: number = touch.clientY - this.long_press_origin.y;
        if (Math.sqrt(dx * dx + dy * dy) > 10) {
            this.clearLongPressTimer();
        }
    }

    protected onCellTouchEnd(event: TouchEvent): void {
        const fired: boolean = this.long_press_fired;
        this.clearLongPressTimer();
        if (fired) {
            event.preventDefault();
        }
    }

    protected onCellTouchCancel(): void {
        this.clearLongPressTimer();
    }

    private triggerLongPress(i: number, j: number): void {
        if (this.game_over() || this.board_loading()) return;
        if (this.board()[i][j].is_revealed) {
            this.revealAdjacentIfSafe(i, j);
        } else {
            this.cycleMarker(i, j);
        }
    }

    private clearLongPressTimer(): void {
        if (this.long_press_timeout !== undefined) {
            clearTimeout(this.long_press_timeout);
            this.long_press_timeout = undefined;
        }
        this.long_press_origin = undefined;
    }

    protected onCellMouseDown(i: number, j: number, event: MouseEvent): void {
        if (event.button !== 0 || this.game_over()) return;
        this.is_mouse_button_down = true;
        this.pressCell(i, j);
    }

    /** Glisser la souris (bouton maintenu) sur une autre case doit prolonger l'effet "enfoncé" dessus. */
    protected onCellMouseEnter(i: number, j: number): void {
        if (!this.is_mouse_button_down || this.game_over()) return;
        this.pressCell(i, j);
    }

    @HostListener('window:mouseup')
    protected onWindowMouseUp(): void {
        // Écouteur global plutôt que sur chaque case : le relâchement peut survenir n'importe où
        // (hors du plateau) si la souris a été déplacée pendant l'appui.
        this.is_mouse_button_down = false;
    }

    /**
     * Case révélée avec un chiffre : reprend l'aperçu de "chord" existant (elle + ses voisines non
     * révélées). Case non révélée : simple effet "enfoncé" sur elle seule, via `is_highlighted`, qui
     * réutilise déjà le rendu à plat des cases révélées (aucune image, juste la bordure sans relief).
     */
    private pressCell(i: number, j: number): void {
        const cell: Cell = this.board()[i][j];
        if (cell.is_flagged || cell.is_questioned) return;

        if (cell.is_revealed) {
            if (cell.adjacent_mines === 0) return;
            this.highlightAdjacentCells(i, j);
        } else {
            this.board.update((board: Cell[][]) => {
                board[i][j].is_highlighted = true;
                return board;
            });
        }
    }

    private highlightAdjacentCells(i: number, j: number): void {
        this.board.update((board: Cell[][]) => {
            board[i][j].is_highlighted = true;
            return board;
        });

        for (let x: number = -1; x <= 1; x++) {
            for (let y: number = -1; y <= 1; y++) {
                const new_i: number = i + x;
                const new_j: number = j + y;
                if (this.isValidCell(new_i, new_j) && !this.board()[new_i][new_j].is_revealed && !this.board()[new_i][new_j].is_flagged && !this.board()[new_i][new_j].is_questioned) {
                    this.board.update((board: Cell[][]) => {
                        board[new_i][new_j].is_highlighted = true;
                        return board;
                    });
                }
            }
        }
    }

    protected unhighlightCells(): void {
        this.board.update((board: Cell[][]) => {
            board.forEach((row: Cell[]) => {
                row.forEach((cell: Cell) => {
                    cell.is_highlighted = false;
                });
            });
            return board;
        });
    }

    private resetLocalBoardOnly(width: number, height: number): void {
        this.board.set(Array(height).fill(null).map(() =>
            Array(width).fill(null).map(() => ({
                is_mine: false,
                is_revealed: false,
                is_flagged: false,
                is_questioned: false,
                is_highlighted: false,
                is_game_over: false,
                adjacent_mines: 0
            }))
        ));
    }

    private revealAdjacentIfSafe(i: number, j: number): void {
        let flagged_count: number = 0;
        for (let x: number = -1; x <= 1; x++) {
            for (let y: number = -1; y <= 1; y++) {
                const new_i: number = i + x;
                const new_j: number = j + y;
                if (this.isValidCell(new_i, new_j) && (this.board()[new_i][new_j].is_flagged)) {
                    flagged_count++;
                }
            }
        }

        if (flagged_count === this.board()[i][j].adjacent_mines) {
            for (let x: number = -1; x <= 1; x++) {
                for (let y: number = -1; y <= 1; y++) {
                    const new_i: number = i + x;
                    const new_j: number = j + y;
                    if (this.isValidCell(new_i, new_j) && !this.board()[new_i][new_j].is_revealed && !this.board()[new_i][new_j].is_flagged && !this.board()[new_i][new_j].is_questioned) {
                        this.revealCell(new_i, new_j);
                    }
                }
            }
        }
    }

    private revealAdjacentCells(i: number, j: number): void {
        for (let x: number = -1; x <= 1; x++) {
            for (let y: number = -1; y <= 1; y++) {
                const new_i: number = i + x;
                const new_j: number = j + y;
                if (new_i >= 0 && new_i < this.board().length && new_j >= 0 && new_j < this.board()[0].length) {
                    if (!this.board()[new_i][new_j].is_revealed && !this.board()[new_i][new_j].is_flagged && !this.board()[new_i][new_j].is_questioned) {
                        this.revealCell(new_i, new_j);
                    }
                }
            }
        }
    }

    private revealAllMines(): void {
        this.board.update((board: Cell[][]) => {
            board.forEach((row: Cell[]) => {
                row.forEach((cell: Cell) => {
                    if (cell.is_mine) cell.is_revealed = true;
                });
            });
            return board;
        });
    }

    private checkWinCondition(): void {
        const all_non_mines_revealed: boolean = this.board().every((row: Cell[]) =>
            row.every((cell: Cell) => cell.is_revealed || cell.is_mine)
        );

        if (all_non_mines_revealed && !this.game_over()) {
            // Toutes les cases sûres sont révélées : la partie est gagnée même si les mines
            // restantes n'ont pas été marquées une à une — on les marque comme si elles l'avaient été.
            this.board.update((board: Cell[][]) => {
                board.forEach((row: Cell[]) => {
                    row.forEach((cell: Cell) => {
                        if (cell.is_mine) {
                            cell.is_flagged = true;
                            cell.is_questioned = false;
                        }
                    });
                });
                return board;
            });
            this.remaining_mines.set(0);
            this.game_over.set(true);
            this.end_time.set(moment());
            this.completeCurrentGame('won');
        }
    }

    private isValidCell(i: number, j: number): boolean {
        return i >= 0 && i < this.board().length && j >= 0 && j < this.board()[0].length;
    }

}

interface Cell {
    is_mine: boolean;
    is_revealed: boolean;
    is_flagged: boolean;
    adjacent_mines: number;
    is_questioned: boolean;
    is_highlighted: boolean;
    is_game_over: boolean;
}

interface MinesweeperSize {
    id: string;
    label: string;
    height: number;
    width: number;
    mines: number;
    default?: boolean;
}

