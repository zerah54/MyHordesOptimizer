import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { MinesweeperLeaderboardEntry, MinesweeperLeaderboardPage, MinesweeperService } from '../../../_abstract_model/services/minesweeper.service';
import { MinesweeperLeaderboardComponent } from './minesweeper-leaderboard.component';

interface TestableComponent {
    items: { (): MinesweeperLeaderboardEntry[] };
    totalCount: { (): number };
    pageIndex: { (): number };
    myRank: { (): MinesweeperLeaderboardEntry | null | undefined };
    onPageChange(event: { pageIndex: number; pageSize: number }): void;
    isMyRow(entry: MinesweeperLeaderboardEntry): boolean;
    showMyRankRow(): boolean;
}

function entry(rank: number, userId: number): MinesweeperLeaderboardEntry {
    return { rank, userId, userName: `Player${userId}`, avatar: null, elapsedMs: 1000 * rank, achievedAt: '2026-01-01T00:00:00Z' };
}

const emptyPage: MinesweeperLeaderboardPage = { items: [], totalCount: 0 };

describe('MinesweeperLeaderboardComponent', (): void => {
    let fixture: ComponentFixture<MinesweeperLeaderboardComponent>;
    let testable: TestableComponent;
    let minesweeperService: jasmine.SpyObj<MinesweeperService>;

    async function setup(sizeId: string = 'medium', mode: 'normal' | 'daily' = 'normal', view: 'top' | 'players' = 'players'): Promise<void> {
        minesweeperService = jasmine.createSpyObj<MinesweeperService>('MinesweeperService', ['getLeaderboard', 'getMyRank']);
        minesweeperService.getLeaderboard.and.returnValue(of(emptyPage));
        minesweeperService.getMyRank.and.returnValue(of(null));

        await TestBed.configureTestingModule({
            imports: [MinesweeperLeaderboardComponent],
            providers: [
                provideHttpClient(), provideHttpClientTesting(),
                { provide: MinesweeperService, useValue: minesweeperService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(MinesweeperLeaderboardComponent);
        testable = fixture.componentInstance as unknown as TestableComponent;
        fixture.componentRef.setInput('sizeId', sizeId);
        fixture.componentRef.setInput('mode', mode);
        fixture.componentRef.setInput('view', view);
        fixture.detectChanges();
    }

    describe('taille personnalisée', (): void => {
        it('n\'appelle jamais l\'API et affiche le message dédié', async (): Promise<void> => {
            await setup('custom');

            expect(minesweeperService.getLeaderboard).not.toHaveBeenCalled();
            expect(minesweeperService.getMyRank).not.toHaveBeenCalled();
            expect(fixture.nativeElement.textContent).toContain('Personnalisée');
            expect(fixture.nativeElement.querySelector('.leaderboard-table')).toBeNull();
        });

        it('charge le classement en quittant "custom" pour une taille normale', async (): Promise<void> => {
            await setup('custom');

            fixture.componentRef.setInput('sizeId', 'medium');
            fixture.detectChanges();

            expect(minesweeperService.getLeaderboard).toHaveBeenCalledOnceWith('medium', 'normal', 'players', 1, 20);
            expect(minesweeperService.getMyRank).toHaveBeenCalledOnceWith('medium', 'normal');
        });
    });

    describe('chargement initial', (): void => {
        it('charge le classement et le rang du joueur dès la création (firstChange)', async (): Promise<void> => {
            await setup('medium', 'normal', 'players');

            expect(minesweeperService.getLeaderboard).toHaveBeenCalledOnceWith('medium', 'normal', 'players', 1, 20);
            expect(minesweeperService.getMyRank).toHaveBeenCalledOnceWith('medium', 'normal');
        });

        it('affiche les entrées reçues', async (): Promise<void> => {
            minesweeperService = jasmine.createSpyObj<MinesweeperService>('MinesweeperService', ['getLeaderboard', 'getMyRank']);
            minesweeperService.getLeaderboard.and.returnValue(of({ items: [entry(1, 10), entry(2, 11)], totalCount: 2 }));
            minesweeperService.getMyRank.and.returnValue(of(null));
            await TestBed.configureTestingModule({
                imports: [MinesweeperLeaderboardComponent],
                providers: [
                    provideHttpClient(), provideHttpClientTesting(),
                    { provide: MinesweeperService, useValue: minesweeperService }
                ]
            }).compileComponents();
            fixture = TestBed.createComponent(MinesweeperLeaderboardComponent);
            testable = fixture.componentInstance as unknown as TestableComponent;
            fixture.componentRef.setInput('sizeId', 'medium');
            fixture.componentRef.setInput('mode', 'normal');
            fixture.componentRef.setInput('view', 'players');
            fixture.detectChanges();

            const nameElements: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('tbody tr td:nth-child(2) span');
            const names: string[] = Array.from(nameElements)
                .map((el: HTMLElement): string => el.textContent?.trim() ?? '');
            expect(names).toEqual(['Player10', 'Player11']);
        });
    });

    describe('changement de sizeId ou mode', (): void => {
        beforeEach(async (): Promise<void> => await setup('medium', 'normal', 'players'));

        it('recharge le classement et le rang, et repart page 1, quand sizeId change', (): void => {
            testable.onPageChange({ pageIndex: 2, pageSize: 20 });
            minesweeperService.getLeaderboard.calls.reset();
            minesweeperService.getMyRank.calls.reset();

            fixture.componentRef.setInput('sizeId', 'large');
            fixture.detectChanges();

            expect(testable.pageIndex()).toBe(0);
            expect(minesweeperService.getLeaderboard).toHaveBeenCalledOnceWith('large', 'normal', 'players', 1, 20);
            expect(minesweeperService.getMyRank).toHaveBeenCalledOnceWith('large', 'normal');
        });

        it('recharge le classement et le rang, et repart page 1, quand mode change', (): void => {
            testable.onPageChange({ pageIndex: 2, pageSize: 20 });
            minesweeperService.getLeaderboard.calls.reset();
            minesweeperService.getMyRank.calls.reset();

            fixture.componentRef.setInput('mode', 'daily');
            fixture.detectChanges();

            expect(testable.pageIndex()).toBe(0);
            expect(minesweeperService.getLeaderboard).toHaveBeenCalledOnceWith('medium', 'daily', 'players', 1, 20);
            expect(minesweeperService.getMyRank).toHaveBeenCalledOnceWith('medium', 'daily');
        });

        it('ne recharge rien quand seul view change', (): void => {
            minesweeperService.getLeaderboard.calls.reset();
            minesweeperService.getMyRank.calls.reset();

            fixture.componentRef.setInput('view', 'top');
            fixture.detectChanges();

            expect(minesweeperService.getLeaderboard).not.toHaveBeenCalled();
            expect(minesweeperService.getMyRank).not.toHaveBeenCalled();
        });
    });

    describe('pagination', (): void => {
        beforeEach(async (): Promise<void> => await setup('medium', 'normal', 'players'));

        it('charge la page demandée sans réinitialiser sizeId/mode ni re-solliciter le rang', (): void => {
            minesweeperService.getLeaderboard.calls.reset();
            minesweeperService.getMyRank.calls.reset();

            testable.onPageChange({ pageIndex: 2, pageSize: 20 });

            expect(testable.pageIndex()).toBe(2);
            expect(minesweeperService.getLeaderboard).toHaveBeenCalledOnceWith('medium', 'normal', 'players', 3, 20);
            expect(minesweeperService.getMyRank).not.toHaveBeenCalled();
        });

        it('ne revient pas sur la page 1 après un nouveau cycle de détection de changement (non-régression effect)', (): void => {
            testable.onPageChange({ pageIndex: 2, pageSize: 20 });
            minesweeperService.getLeaderboard.calls.reset();

            fixture.detectChanges();
            fixture.detectChanges();

            expect(testable.pageIndex()).toBe(2);
            expect(minesweeperService.getLeaderboard).not.toHaveBeenCalled();
        });
    });

    describe('rang du joueur courant', (): void => {
        it('n\'ajoute pas de ligne supplémentaire quand le joueur est déjà dans la page affichée', async (): Promise<void> => {
            minesweeperService = jasmine.createSpyObj<MinesweeperService>('MinesweeperService', ['getLeaderboard', 'getMyRank']);
            minesweeperService.getLeaderboard.and.returnValue(of({ items: [entry(1, 10)], totalCount: 1 }));
            minesweeperService.getMyRank.and.returnValue(of(entry(1, 10)));
            await TestBed.configureTestingModule({
                imports: [MinesweeperLeaderboardComponent],
                providers: [
                    provideHttpClient(), provideHttpClientTesting(),
                    { provide: MinesweeperService, useValue: minesweeperService }
                ]
            }).compileComponents();
            fixture = TestBed.createComponent(MinesweeperLeaderboardComponent);
            testable = fixture.componentInstance as unknown as TestableComponent;
            fixture.componentRef.setInput('sizeId', 'medium');
            fixture.componentRef.setInput('mode', 'normal');
            fixture.componentRef.setInput('view', 'players');
            fixture.detectChanges();

            expect(testable.showMyRankRow()).toBeFalse();
            expect(testable.isMyRow(entry(1, 10))).toBeTrue();
            expect(fixture.nativeElement.querySelector('.my-row--extra')).toBeNull();
        });

        it('ajoute une ligne supplémentaire quand le joueur n\'est pas dans la page affichée', async (): Promise<void> => {
            minesweeperService = jasmine.createSpyObj<MinesweeperService>('MinesweeperService', ['getLeaderboard', 'getMyRank']);
            minesweeperService.getLeaderboard.and.returnValue(of({ items: [entry(1, 10)], totalCount: 50 }));
            minesweeperService.getMyRank.and.returnValue(of(entry(42, 99)));
            await TestBed.configureTestingModule({
                imports: [MinesweeperLeaderboardComponent],
                providers: [
                    provideHttpClient(), provideHttpClientTesting(),
                    { provide: MinesweeperService, useValue: minesweeperService }
                ]
            }).compileComponents();
            fixture = TestBed.createComponent(MinesweeperLeaderboardComponent);
            testable = fixture.componentInstance as unknown as TestableComponent;
            fixture.componentRef.setInput('sizeId', 'medium');
            fixture.componentRef.setInput('mode', 'normal');
            fixture.componentRef.setInput('view', 'players');
            fixture.detectChanges();

            expect(testable.showMyRankRow()).toBeTrue();
            expect(fixture.nativeElement.querySelector('.my-row--extra')).not.toBeNull();
        });
    });

    describe('vue "top" (sans pagination)', (): void => {
        it('n\'affiche pas le paginateur', async (): Promise<void> => {
            await setup('medium', 'normal', 'top');

            expect(fixture.nativeElement.querySelector('mat-paginator')).toBeNull();
        });
    });
});
