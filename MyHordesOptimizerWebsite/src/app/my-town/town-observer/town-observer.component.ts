import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal,WritableSignal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap, Router, RouterOutlet } from '@angular/router';
import { forkJoin, Subscription, take } from 'rxjs';

import { TownService } from '../../_abstract_model/services/town.service';
import { Imports } from '../../_abstract_model/types/_types';
import { Town } from '../../_abstract_model/types/town.class';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { TownListItem, TownListPageResult } from '../../_abstract_model/types/town-list-item.model';
import { SnackbarService } from '../../_core/services/snackbar.service';
import { TownContextService } from '../../_core/services/town-context.service';

const angular_common: Imports = [CommonModule, RouterOutlet];
const material_modules: Imports = [MatIconModule, MatProgressSpinnerModule];

@Component({
    selector: 'mho-town-observer',
    templateUrl: './town-observer.component.html',
    styleUrls: ['./town-observer.component.scss'],
    imports: [...angular_common, ...material_modules]
})
export class TownObserverComponent implements OnInit, OnDestroy {

    private readonly router: Router = inject(Router);

    private readonly route: ActivatedRoute = inject(ActivatedRoute);
    private readonly town_service: TownService = inject(TownService);
    private readonly town_context: TownContextService = inject(TownContextService);
    private readonly snackbar: SnackbarService = inject(SnackbarService);
    private readonly title_service: Title = inject(Title);

    /** Le contenu (router-outlet) n'est rendu qu'une fois le contexte complet chargé, pour que chaque page observe un TownDetails complet (dont le jour). */
    protected readonly context_ready: WritableSignal<boolean> = signal<boolean>(false);
    protected readonly town_name: WritableSignal<string | null> = signal<string | null>(null);
    protected readonly town_day: WritableSignal<number | null> = signal<number | null>(null);

    private param_subscription?: Subscription;
    /** mapId déjà chargé : le paramMap réémet à chaque navigation entre pages enfants (params hérités), on ignore les répétitions. */
    private loaded_map_id: number | null = null;

    public ngOnInit(): void {
        this.param_subscription = this.route.paramMap.subscribe((params: ParamMap) => {
            const raw_map_id: string | null = params.get('mapId');
            const map_id: number = Number(raw_map_id);
            if (!raw_map_id || Number.isNaN(map_id)) {
                this.redirectToTownList();
                return;
            }
            if (map_id === this.loaded_map_id) {
                return;
            }
            this.loadTown(map_id);
        });
    }

    public ngOnDestroy(): void {
        this.param_subscription?.unsubscribe();
        this.town_context.clear();
    }

    private loadTown(map_id: number): void {
        this.loaded_map_id = map_id;
        this.context_ready.set(false);
        // Contexte partiel : suffit à getMap() (qui lit getTown()?.town_id) le temps de résoudre le reste.
        const partial: TownDetails = new TownDetails();
        partial.town_id = map_id;
        this.town_context.setObservedTown(partial);

        // take(1) est indispensable : getMap() (Observable fait main dans town.service) émet mais
        // n'appelle jamais complete(), or forkJoin n'émet que quand toutes ses sources sont complétées.
        forkJoin({
            map: this.town_service.getMap().pipe(take(1)),
            page: this.town_service.getTownsPaged({ id: String(map_id), page: 1, pageSize: 100 }).pipe(take(1))
        }).subscribe({
            next: ({ map, page }: { map: Town; page: TownListPageResult }) => {
                const item: TownListItem | undefined = page.items.find((town: TownListItem) => town.mapId === map_id);
                if (!item) {
                    this.redirectToTownList();
                    return;
                }
                const details: TownDetails = new TownDetails();
                details.town_id = map_id;
                details.town_x = map.town_x;
                details.town_y = map.town_y;
                details.town_max_x = map.map_width;
                details.town_max_y = map.map_height;
                details.is_chaos = map.is_chaos;
                details.is_devaste = map.is_devasted;
                details.day = map.day;
                if (item.townType) {
                    details.town_type = item.townType;
                }
                this.town_context.setObservedTown(details, item.name);
                this.town_name.set(item.name);
                this.town_day.set(map.day);
                this.title_service.setTitle('MyHordes Optimizer' + ' - ' + $localize`Observation` + ' - ' + (item.name ?? String(map_id)));
                this.context_ready.set(true);
            },
            error: () => {
                this.redirectToTownList();
            }
        });
    }

    private redirectToTownList(): void {
        this.town_context.clear();
        this.snackbar.errorSnackbar($localize`Impossible de charger cette ville`);
        this.router.navigate(['/directory/towns']);
    }
}
