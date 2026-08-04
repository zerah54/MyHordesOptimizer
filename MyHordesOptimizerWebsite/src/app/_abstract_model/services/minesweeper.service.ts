import { HttpErrorResponse, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';

import { GlobalService } from './_global.service';

export interface CreateMinesweeperGameRequest {
    sizeId: string;
    mode: 'normal' | 'daily';
    width?: number;
    height?: number;
    mineCount?: number;
    firstClickX?: number;
    firstClickY?: number;
}

export interface MinesweeperGameStarted {
    gameId: number;
    width: number;
    height: number;
    mineCount: number;
    mines: number[];
    adjacentCounts: number[];
    timerStarted: boolean;
    firstClickX: number;
    firstClickY: number;
    startedAt: string | null;
}

export interface MinesweeperGameCompleted {
    outcome: 'won' | 'lost';
    elapsedMs: number | null;
    scored: boolean;
}

export interface MinesweeperLeaderboardEntry {
    rank: number;
    userId: number;
    userName: string;
    avatar: string | null;
    elapsedMs: number;
    achievedAt: string;
}

export interface MinesweeperLeaderboardPage {
    items: MinesweeperLeaderboardEntry[];
    totalCount: number;
}

export interface MinesweeperChallengeStatus {
    sizeId: string;
    alreadyPlayedToday: boolean;
}

export interface MinesweeperGameHistoryEntry {
    gameId: number;
    sizeId: string;
    width: number;
    height: number;
    mineCount: number;
    mode: 'normal' | 'daily';
    status: 'in_progress' | 'won' | 'lost';
    elapsedMs: number | null;
    createdAt: string;
}

export interface MinesweeperGameHistoryPage {
    items: MinesweeperGameHistoryEntry[];
    totalCount: number;
}

@Injectable({ providedIn: 'root' })
export class MinesweeperService extends GlobalService {

    public createGame(request: CreateMinesweeperGameRequest): Observable<MinesweeperGameStarted> {
        return new Observable((sub: Subscriber<MinesweeperGameStarted>) => {
            super.post<MinesweeperGameStarted>(this.API_URL + '/Minesweeper', JSON.stringify(request))
                .subscribe({
                    next: (started: MinesweeperGameStarted) => { sub.next(started); sub.complete(); },
                    error: (error: HttpErrorResponse) => sub.error(error)
                });
        });
    }

    public startGame(gameId: number): Observable<void> {
        return new Observable((sub: Subscriber<void>) => {
            super.post(this.API_URL + `/Minesweeper/${gameId}/Start`, undefined)
                .subscribe({
                    next: () => { sub.next(); sub.complete(); },
                    error: (error: HttpErrorResponse) => sub.error(error)
                });
        });
    }

    public completeGame(gameId: number, outcome: 'won' | 'lost'): Observable<MinesweeperGameCompleted> {
        return new Observable((sub: Subscriber<MinesweeperGameCompleted>) => {
            super.post<MinesweeperGameCompleted>(this.API_URL + `/Minesweeper/${gameId}/Complete`, JSON.stringify({ outcome }))
                .subscribe({
                    next: (completed: MinesweeperGameCompleted) => { sub.next(completed); sub.complete(); },
                    error: (error: HttpErrorResponse) => sub.error(error)
                });
        });
    }

    public getLeaderboard(sizeId: string, mode: 'normal' | 'daily', view: 'top' | 'players', page: number, pageSize: number): Observable<MinesweeperLeaderboardPage> {
        const params: HttpParams = new HttpParams()
            .set('sizeId', sizeId)
            .set('mode', mode)
            .set('view', view)
            .set('page', String(page))
            .set('pageSize', String(pageSize));

        return new Observable((sub: Subscriber<MinesweeperLeaderboardPage>) => {
            super.get<MinesweeperLeaderboardPage>(this.API_URL + '/Minesweeper/Leaderboard', false, params)
                .subscribe({
                    next: (response: HttpResponse<MinesweeperLeaderboardPage>) => {
                        sub.next(response.body ?? { items: [], totalCount: 0 });
                        sub.complete();
                    },
                    error: (error: HttpErrorResponse) => sub.error(error)
                });
        });
    }

    public getMyRank(sizeId: string, mode: 'normal' | 'daily'): Observable<MinesweeperLeaderboardEntry | null> {
        const params: HttpParams = new HttpParams().set('sizeId', sizeId).set('mode', mode);

        return new Observable((sub: Subscriber<MinesweeperLeaderboardEntry | null>) => {
            super.get<MinesweeperLeaderboardEntry | null>(this.API_URL + '/Minesweeper/Leaderboard/Me', false, params)
                .subscribe({
                    next: (response: HttpResponse<MinesweeperLeaderboardEntry | null>) => {
                        sub.next(response.body ?? null);
                        sub.complete();
                    },
                    error: (error: HttpErrorResponse) => sub.error(error)
                });
        });
    }

    public getChallengesToday(): Observable<MinesweeperChallengeStatus[]> {
        return new Observable((sub: Subscriber<MinesweeperChallengeStatus[]>) => {
            super.get<MinesweeperChallengeStatus[]>(this.API_URL + '/Minesweeper/Challenges/Today')
                .subscribe({
                    next: (response: HttpResponse<MinesweeperChallengeStatus[]>) => { sub.next(response.body ?? []); sub.complete(); },
                    error: (error: HttpErrorResponse) => sub.error(error)
                });
        });
    }

    public getMyHistory(page: number, pageSize: number): Observable<MinesweeperGameHistoryPage> {
        const params: HttpParams = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));

        return new Observable((sub: Subscriber<MinesweeperGameHistoryPage>) => {
            super.get<MinesweeperGameHistoryPage>(this.API_URL + '/Minesweeper/Me', false, params)
                .subscribe({
                    next: (response: HttpResponse<MinesweeperGameHistoryPage>) => {
                        sub.next(response.body ?? { items: [], totalCount: 0 });
                        sub.complete();
                    },
                    error: (error: HttpErrorResponse) => sub.error(error)
                });
        });
    }
}
