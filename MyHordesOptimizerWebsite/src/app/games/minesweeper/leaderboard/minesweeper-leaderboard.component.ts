import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, InputSignal, OnChanges, signal, SimpleChanges, WritableSignal } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';

import { MinesweeperLeaderboardEntry, MinesweeperLeaderboardPage, MinesweeperService } from '../../../_abstract_model/services/minesweeper.service';
import { Imports } from '../../../_abstract_model/types/_types';
import { ElapsedSecondsPipe } from '../../../_core/utilities/date.util';
import { createDelayedLoadingController, DelayedLoadingController } from '../../../_core/utilities/delayed-loading.util';
import { AvatarComponent } from '../../../_shared/avatar/avatar.component';

const angular_common: Imports = [CommonModule];
const components: Imports = [AvatarComponent];
const pipes: Imports = [ElapsedSecondsPipe];
const material_modules: Imports = [MatPaginatorModule, MatProgressSpinnerModule];

@Component({
    selector: 'mho-minesweeper-leaderboard',
    templateUrl: 'minesweeper-leaderboard.component.html',
    styleUrls: ['minesweeper-leaderboard.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...components, ...pipes, ...material_modules]
})
export class MinesweeperLeaderboardComponent implements OnChanges {
    public sizeId: InputSignal<string> = input.required();
    public mode: InputSignal<'normal' | 'daily'> = input.required();
    // Une vue par onglet parent (Meilleurs scores / Classement des joueurs) : chaque onglet instancie
    // ce composant séparément avec une valeur fixe, plus de bascule interne entre les deux.
    public view: InputSignal<'top' | 'players'> = input.required();

    private readonly minesweeperService: MinesweeperService = inject(MinesweeperService);

    protected readonly items: WritableSignal<MinesweeperLeaderboardEntry[]> = signal([]);
    protected readonly totalCount: WritableSignal<number> = signal(0);
    protected readonly pageIndex: WritableSignal<number> = signal(0);
    protected readonly pageSize: number = 20;
    protected readonly loading: WritableSignal<boolean> = signal(false);
    private readonly loadingController: DelayedLoadingController = createDelayedLoadingController((loading: boolean) => this.loading.set(loading));
    protected readonly myRank: WritableSignal<MinesweeperLeaderboardEntry | null | undefined> = signal(undefined);

    public ngOnChanges(changes: SimpleChanges): void {
        // `sizeId`/`mode`/`view` sont des inputs requis : ngOnChanges se déclenche toujours dès la
        // création du composant (firstChange = true), pas besoin d'un ngOnInit séparé pour le chargement
        // initial. "custom" n'a pas de classement public (rejeté 400 par le serveur) : ne pas appeler l'API.
        if ((changes['sizeId'] || changes['mode']) && this.sizeId() !== 'custom') {
            this.pageIndex.set(0);
            this.reload();
            this.reloadMyRank();
        }
    }

    protected isCustomSize(): boolean {
        return this.sizeId() === 'custom';
    }

    protected onPageChange(event: PageEvent): void {
        this.pageIndex.set(event.pageIndex);
        this.reload();
    }

    /** La ligne du joueur courant est-elle déjà affichée dans la page en cours ? */
    protected isMyRow(entry: MinesweeperLeaderboardEntry): boolean {
        return this.myRank()?.userId === entry.userId;
    }

    /** Faut-il ajouter une ligne "en plus" pour le joueur courant, absent de la page affichée ? */
    protected showMyRankRow(): boolean {
        const rank: MinesweeperLeaderboardEntry | null | undefined = this.myRank();
        return !!rank && !this.items().some((entry: MinesweeperLeaderboardEntry) => entry.userId === rank.userId);
    }

    private reload(): void {
        this.loadingController.start();
        this.minesweeperService.getLeaderboard(this.sizeId(), this.mode(), this.view(), this.pageIndex() + 1, this.pageSize)
            .pipe(finalize(() => this.loadingController.stop()))
            .subscribe((page: MinesweeperLeaderboardPage) => {
                this.items.set(page.items);
                this.totalCount.set(page.totalCount);
            });
    }

    private reloadMyRank(): void {
        // Toujours remettre à zéro avant de recharger : sans ça, si le mode/la taille change pendant
        // qu'une requête précédente est encore en vol (ou échoue silencieusement), le pied de tableau
        // continue d'afficher le rang de l'ANCIEN mode/taille au lieu de se mettre à jour.
        this.myRank.set(undefined);
        this.minesweeperService.getMyRank(this.sizeId(), this.mode())
            .subscribe({
                next: (rank: MinesweeperLeaderboardEntry | null) => this.myRank.set(rank),
                error: () => this.myRank.set(null)
            });
    }
}
