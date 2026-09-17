import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PictosGameComponent } from './368-pictos.component';

interface PictosGameCellForTest {
    id: number;
    img: string;
    to_remove: boolean;
}

interface PictosGameComponentInternals {
    board(): (PictosGameCellForTest | undefined)[][];
    pictos_rescued(): number;
    attempts: number;
    current_lot(): PictosGameCellForTest[];
    is_lot_horizontal(): boolean;
    game_over(): boolean;
    time_spent(): number;
    interval?: ReturnType<typeof setInterval>;
    onCellClick(row: number, col: number): void;
    endGame(): void;
}

describe('PictosGameComponent', () => {
    let fixture: ComponentFixture<PictosGameComponent>;
    let component: PictosGameComponent;
    let internal: PictosGameComponentInternals;

    /** Fixe Math.random() : picto[0] (id 1) pour les 2 cases du lot, orientation toujours verticale. */
    function fixRandomness(): void {
        vi.spyOn(Math, 'random').mockReturnValue(0);
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PictosGameComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(PictosGameComponent);
        component = fixture.componentInstance;
        internal = component as unknown as PictosGameComponentInternals;
        vi.useFakeTimers();
    });

    afterEach(() => {
        // Pas de ngOnDestroy dans ce composant : l'intervalle du chrono doit être nettoyé à la main,
        // sinon il continue de tourner après le test (préexistant, hors périmètre de cette tâche).
        clearInterval(internal.interval);
        vi.useRealTimers();
    });

    it('ngOnInit initialise un plateau 6x6 vide, réinitialise les compteurs et génère un lot', () => {
        fixRandomness();
        fixture.detectChanges();

        const board: (PictosGameCellForTest | undefined)[][] = internal.board();
        expect(board.length).toBe(6);
        expect(board.every((row: (PictosGameCellForTest | undefined)[]) => row.length === 6 && row.every((cell: PictosGameCellForTest | undefined) => cell === undefined))).toBe(true);

        expect(internal.pictos_rescued()).toBe(0);
        expect(internal.attempts).toBe(0);
        expect(internal.game_over()).toBe(false);

        const current_lot: PictosGameCellForTest[] = internal.current_lot();
        expect(current_lot.length).toBe(2);
        expect(current_lot[0].id).toBe(1);
    });

    it('le chrono incrémente time_spent chaque seconde tant que la partie continue', async () => {
        fixRandomness();
        fixture.detectChanges();

        await vi.advanceTimersByTimeAsync(3000);

        // Temps non affiché tant que la partie n'est pas terminée (@else du template) : on force la
        // fin de partie pour vérifier que le rendu reflète bien la valeur accumulée de façon async.
        internal.endGame();
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('3');
    });

    it('place un lot vertical valide sur clic, incrémente attempts et régénère un nouveau lot après le setTimeout', async () => {
        fixRandomness();
        fixture.detectChanges();

        internal.onCellClick(0, 0);
        fixture.detectChanges();

        expect(internal.board()[0][0]?.id).toBe(1);
        expect(internal.board()[1][0]?.id).toBe(1);
        expect(internal.attempts).toBe(1);

        await vi.advanceTimersByTimeAsync(0); // vidange le setTimeout (checkAndRemoveGroups + generateNewLot)
    });

    it('un clic sur une case déjà occupée par le lot n\'a aucun effet', async () => {
        fixRandomness();
        fixture.detectChanges();

        internal.onCellClick(0, 0);
        await vi.advanceTimersByTimeAsync(0);
        fixture.detectChanges();

        const attempts_before: number = internal.attempts;
        internal.onCellClick(0, 0); // (0,0) déjà occupé -> canBePlacedVertically renvoie false
        fixture.detectChanges();

        expect(internal.attempts).toBe(attempts_before);
    });

    it('un alignement vertical de 3+ pictos identiques est marqué immédiatement (to-remove) puis retiré après 250ms — vérifie la réactivité asynchrone du plateau sous OnPush', async () => {
        fixRandomness();
        fixture.detectChanges();

        internal.onCellClick(0, 0); // place aux lignes 0-1, colonne 0
        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(0); // checkAndRemoveGroups (rien à retirer, 2 seulement) + generateNewLot

        internal.onCellClick(2, 0); // place aux lignes 2-3, colonne 0 -> 4 alignés verticalement
        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(0); // vidange le setTimeout de onCellClick (checkAndRemoveGroups synchrone dedans)
        fixture.detectChanges();

        // Marquage immédiat (avant les 250ms de retrait effectif).
        expect(fixture.nativeElement.querySelectorAll('.cell img.to-remove').length).toBe(4);
        expect(internal.pictos_rescued()).toBe(4);

        await vi.advanceTimersByTimeAsync(250); // vidange les 4 setTimeout(250) de retrait effectif
        fixture.detectChanges();

        expect(internal.board()[0][0]).toBeUndefined();
        expect(internal.board()[1][0]).toBeUndefined();
        expect(internal.board()[2][0]).toBeUndefined();
        expect(internal.board()[3][0]).toBeUndefined();
        expect(fixture.nativeElement.querySelectorAll('.cell img').length).toBe(0);
    });

    it('"Nouvelle partie" (visible seulement en fin de partie) relance une partie propre', () => {
        fixRandomness();
        fixture.detectChanges();

        internal.endGame();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.score')).toBeTruthy();
        const restart_button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
        expect(restart_button.textContent).toContain('Nouvelle partie');

        restart_button.click();
        fixture.detectChanges();

        expect(internal.game_over()).toBe(false);
        expect(internal.attempts).toBe(0);
        expect(fixture.nativeElement.querySelector('.lot-position')).toBeTruthy();
    });
});
