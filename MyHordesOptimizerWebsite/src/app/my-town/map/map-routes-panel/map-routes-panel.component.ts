import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, InputSignal, output, OutputEmitterRef, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import moment from 'moment';

import { Imports } from '../../../_abstract_model/types/_types';
import { Cell } from '../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { MAP_ROUTE_COLORS, MapRoute, MapRouteColor, mapRouteColorVar } from '../../../_abstract_model/types/map-route.class';
import { MapRouteGame } from '../../../_abstract_model/types/map-route-game.class';
import { MapRouteAccess } from '../../../_abstract_model/types/map-routes.class';
import { Ruin } from '../../../_abstract_model/types/ruin.class';
import { Town } from '../../../_abstract_model/types/town.class';
import { orderCountLabel } from '../../expeditions/expedition-orders/order-labels';
import { RouteOrderCount } from '../map-orders/map-cell-orders';
import { buildRouteDetail, cellsByCoordinates, citizenName, MapRouteDetail, routeSubtitle } from '../map-routes/map-route-detail';
import { MapRouteGroup, MapRouteView } from '../map-routes/map-route-views';
import { MapRoutesStatus } from '../map-routes/map-routes.store';
import { MapRouteKey } from '../map-routes/map-routes-display';

const angular_common: Imports = [NgTemplateOutlet, RouterLink];
const material_modules: Imports = [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule];

/** Couleur « pour moi seulement » choisie pour un tracé ; `null` rend la couleur commune. */
export interface MapRoutePersonalColor {
    readonly key: MapRouteKey;
    readonly color: MapRouteColor | null;
}

/** Couleur commune choisie pour un tracé (« Changer pour tous »). */
export interface MapRouteCommonColor {
    readonly route: MapRoute;
    readonly color: MapRouteColor;
}

/** Ligne de la liste : la vue et ce qu'il faut pour l'afficher. */
interface MapRouteItem {
    readonly view: MapRouteView;
    readonly color_var: string;
    readonly common_color_var: string;
    readonly author: string;
    readonly subtitle: string;
    /** Citoyens autorisés d'un tracé privé, pour l'infobulle du cadenas ; vide sinon. */
    readonly shared_names: string;
    readonly shared_count: number;
    readonly read_only: boolean;
}

interface MapRouteColorOption {
    readonly color: MapRouteColor;
    readonly color_var: string;
    readonly label: string;
}

const COLOR_LABELS: Readonly<Record<MapRouteColor, string>> = {
    blue: $localize`Bleu`,
    violet: $localize`Violet`,
    magenta: $localize`Magenta`,
    teal: $localize`Bleu canard`,
    brown: $localize`Brun`,
    indigo: $localize`Indigo`,
    pink: $localize`Rose`,
    cyan: $localize`Cyan`,
    slate: $localize`Ardoise`,
    plum: $localize`Prune`
};

/**
 * Onglet « Tracés » du panneau de la carte : tracés de la ville par groupe, œil, fiche du tracé choisi,
 * couleur « pour moi seulement » ou commune, et accès à la saisie. Composant de présentation : les réglages
 * vivent dans les options de la carte, les données dans `MapRoutesStore`, les écritures dans la carte.
 */
@Component({
    selector: 'mho-map-routes-panel',
    templateUrl: './map-routes-panel.component.html',
    styleUrls: ['./map-routes-panel.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...material_modules]
})
export class MapRoutesPanelComponent {
    public readonly views: InputSignal<readonly MapRouteView[]> = input.required();
    public readonly status: InputSignal<MapRoutesStatus> = input.required();
    public readonly access: InputSignal<MapRouteAccess | null> = input.required();
    public readonly selectedKey: InputSignal<MapRouteKey | null> = input.required();
    public readonly showPreviousDays: InputSignal<boolean> = input.required();
    public readonly map: InputSignal<Town | undefined> = input.required();
    public readonly allRuins: InputSignal<readonly Ruin[] | undefined> = input.required();
    public readonly allCitizens: InputSignal<readonly Citizen[] | undefined> = input.required();
    /** Consignes par case des expéditions du jour, par tracé lié. */
    public readonly orderCounts: InputSignal<ReadonlyMap<number, RouteOrderCount>> = input<ReadonlyMap<number, RouteOrderCount>>(new Map());

    public readonly selectedKeyChange: OutputEmitterRef<MapRouteKey | null> = output();
    public readonly visibilityToggled: OutputEmitterRef<MapRouteKey> = output();
    public readonly showAllRequested: OutputEmitterRef<void> = output();
    public readonly showPreviousDaysChange: OutputEmitterRef<boolean> = output();
    public readonly personalColorChange: OutputEmitterRef<MapRoutePersonalColor> = output();
    public readonly createRequested: OutputEmitterRef<void> = output();
    public readonly editRequested: OutputEmitterRef<MapRoute> = output();
    public readonly deleteRequested: OutputEmitterRef<MapRoute> = output();
    public readonly commonColorChange: OutputEmitterRef<MapRouteCommonColor> = output();
    /** « Copier dans MHO » sur un itinéraire du jeu. */
    public readonly copyRequested: OutputEmitterRef<MapRouteGame> = output();

    protected readonly color_options: readonly MapRouteColorOption[] = MAP_ROUTE_COLORS.map((color: MapRouteColor): MapRouteColorOption => ({
        color,
        color_var: mapRouteColorVar(color),
        label: COLOR_LABELS[color]
    }));

    protected readonly show_label: string = $localize`Afficher`;
    protected readonly hide_label: string = $localize`Masquer`;

    private readonly locale: string = moment.locale();

    private readonly town_day: Signal<number> = computed((): number => this.map()?.day ?? 1);
    private readonly citizens: Signal<readonly Citizen[]> = computed((): readonly Citizen[] => this.allCitizens() ?? []);
    private readonly cells: Signal<Map<string, Cell>> = computed((): Map<string, Cell> => cellsByCoordinates(this.map()));

    protected readonly items: Signal<MapRouteItem[]> = computed((): MapRouteItem[] => {
        const citizens: readonly Citizen[] = this.citizens();
        const town_day: number = this.town_day();
        return this.views().map((view: MapRouteView): MapRouteItem => {
            const shared_ids: number[] = view.route?.is_private ? view.route.shared_user_ids : [];
            return {
                view,
                color_var: mapRouteColorVar(view.color),
                common_color_var: mapRouteColorVar(view.common_color),
                author: view.route
                    ? citizenName(citizens, view.route.author_id, view.route.author_name)
                    : citizenName(citizens, view.game_route?.author_id ?? null),
                subtitle: routeSubtitle(view, town_day),
                shared_names: shared_ids.map((user_id: number): string => citizenName(citizens, user_id)).join(', '),
                shared_count: shared_ids.length,
                read_only: view.route !== null && !view.route.can_edit
            };
        });
    });

    protected readonly today: Signal<MapRouteItem[]> = computed((): MapRouteItem[] => this.inGroup('today'));
    protected readonly free: Signal<MapRouteItem[]> = computed((): MapRouteItem[] => this.inGroup('free'));
    protected readonly previous: Signal<MapRouteItem[]> = computed((): MapRouteItem[] => this.inGroup('previous'));
    protected readonly game: Signal<MapRouteItem[]> = computed((): MapRouteItem[] => this.inGroup('game'));

    protected readonly has_hidden: Signal<boolean> = computed((): boolean => this.views().some((view: MapRouteView): boolean => view.hidden));

    protected readonly selected: Signal<MapRouteItem | null> = computed((): MapRouteItem | null => {
        const key: MapRouteKey | null = this.selectedKey();
        return key === null ? null : this.items().find((item: MapRouteItem): boolean => item.view.key === key) ?? null;
    });

    protected readonly detail: Signal<MapRouteDetail | null> = computed((): MapRouteDetail | null => {
        const selected: MapRouteItem | null = this.selected();
        if (!selected) return null;
        return buildRouteDetail(selected.view, this.cells(), {
            town: this.map(),
            ruins: this.allRuins() ?? [],
            citizens: this.citizens(),
            locale: this.locale
        });
    });

    /** Consignes du jour sur le tracé choisi ; `null` sans partie liée du jour. */
    protected readonly detail_orders: Signal<string | null> = computed((): string | null => {
        const route_id: number | undefined = this.selected()?.view.route?.id;
        if (route_id === undefined) return null;
        const counts: RouteOrderCount | undefined = this.orderCounts().get(route_id);
        return counts ? orderCountLabel(counts.orders, counts.cells) : null;
    });

    protected select(key: MapRouteKey): void {
        this.selectedKeyChange.emit(this.selectedKey() === key ? null : key);
    }

    private inGroup(group: MapRouteGroup): MapRouteItem[] {
        return this.items().filter((item: MapRouteItem): boolean => item.view.group === group);
    }
}
