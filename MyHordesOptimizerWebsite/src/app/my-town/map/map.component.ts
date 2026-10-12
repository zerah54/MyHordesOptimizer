import { BreakpointObserver } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import {
    afterNextRender,
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    Injector,
    NgZone,
    OnInit,
    Signal,
    signal,
    untracked,
    viewChild,
    WritableSignal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import moment from 'moment';

import { environment } from '../../../environments/environment';
import { BREAKPOINTS, HORDES_IMG_REPO } from '../../_abstract_model/const';
import { isHubConflictError } from '../../_abstract_model/realtime-services/realtime-expeditions.service';
import { ApiService } from '../../_abstract_model/services/api.service';
import { TownService } from '../../_abstract_model/services/town.service';
import { Dictionary, Imports } from '../../_abstract_model/types/_types';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { CitizenInfo } from '../../_abstract_model/types/citizen-info.class';
import { Item } from '../../_abstract_model/types/item.class';
import { MapRoute, MapRoutePoint } from '../../_abstract_model/types/map-route.class';
import { MapRouteGame } from '../../_abstract_model/types/map-route-game.class';
import { Ruin } from '../../_abstract_model/types/ruin.class';
import { Town } from '../../_abstract_model/types/town.class';
import { ScrollAuraDirective } from '../../_core/directives/scroll-aura.directive';
import { SnackbarService } from '../../_core/services/snackbar.service';
import { TownContextService } from '../../_core/services/town-context.service';
import { getTown } from '../../_core/utilities/localstorage.util';
import { CompassRoseComponent } from '../../_shared/compass-rose/compass-rose.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../_shared/confirm-dialog/confirm-dialog.component';
import { DrawMapComponent, MapCellPick } from './draw-map/draw-map.component';
import {
    CORNER_INFO_OPTIONS,
    CornerInfo,
    CornerInfoOption,
    CornerInfoView,
    cornerInfoViews,
    CornerLayout,
    CornerLayouts,
    CornerPosition,
    CORNERS_VERSION,
    DEFAULT_CORNERS,
    MapType,
    sanitizeCorners
} from './map-corners';
import { MAP_LEGENDS, MapLegendEntry } from './map-legends';
import { DayExpeditionsStore } from './map-orders/day-expeditions.store';
import { RouteOrderCount, routeOrderCounts } from './map-orders/map-cell-orders';
import { buildOrderBadges, MapOrderBadge } from './map-orders/map-order-badges';
import { MapRouteEditorComponent } from './map-route-editor/map-route-editor.component';
import { MapRouteEditor } from './map-routes/map-route-editor';
import { buildRouteDrawings, buildRouteViews, MapRouteDrawing, MapRouteView } from './map-routes/map-route-views';
import { MapRoutesStatus, MapRoutesStore } from './map-routes/map-routes.store';
import {
    DEFAULT_ROUTES_DISPLAY,
    MapRouteKey,
    mapRouteKey,
    MapRoutesDisplay,
    pruneRoutesDisplay,
    sanitizeRoutesDisplay,
    setPersonalColor,
    toggleHidden
} from './map-routes/map-routes-display';
import { MapRouteCommonColor, MapRoutePersonalColor, MapRoutesPanelComponent } from './map-routes-panel/map-routes-panel.component';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [CompassRoseComponent, DrawMapComponent, MapRouteEditorComponent, MapRoutesPanelComponent];
const directives: Imports = [ScrollAuraDirective];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatButtonToggleModule, MatCardModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, MatListModule, MatMenuModule, MatOptionModule, MatSelectModule, MatSidenavModule, MatTooltipModule];

@Component({
    selector: 'mho-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
    host: {
        '(window:resize)': 'onResize()',
        '(document:keydown.escape)': 'onEscape($event)'
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
    // Saisie d'un tracé : son état vit le temps de la page.
    providers: [MapRouteEditor],
    imports: [...angular_common, ...components, ...directives, ...material_modules, ...pipes]
})
export class MapComponent implements OnInit, AfterViewInit {

    /** Côté d'une case, en pixels. En dessous de MIN les repères de couleur ne se distinguent
     *  plus, au-delà de MAX une ville standard ne tient plus dans aucun écran. */
    public static readonly ZOOM_MIN: number = 16;
    public static readonly ZOOM_MAX: number = 72;
    public static readonly ZOOM_DEFAULT: number = 30;
    private static readonly ZOOM_STEP: number = 4;
    /** Marge laissée par « Ajuster » : le retrait de 14 px autour de la grille (deux côtés) plus
     *  la barre de défilement éventuelle. */
    private static readonly FIT_MARGIN: number = 44;
    private static readonly STORAGE_KEY: string = 'MAP_OPTIONS';
    /** La rafale de molette ne doit pas écrire dans localStorage à chaque cran. */
    private static readonly ZOOM_PERSIST_DELAY: number = 250;
    /** En deçà, le geste reste un clic : on ne déplace pas la carte pour trois pixels de tremblement. */
    private static readonly DRAG_THRESHOLD: number = 4;

    private readonly breakpoint_observer: BreakpointObserver = inject(BreakpointObserver);

    // Signaux (pas de simples champs) : réassignés depuis les subscribe() asynchrones de ngOnInit et
    // lus par le propre template (passés à mho-draw-map) — un champ simple ne marquerait pas la vue.
    /** La carte de la ville */
    protected readonly map: WritableSignal<Town | undefined> = signal(undefined);
    protected readonly all_ruins: WritableSignal<Ruin[] | undefined> = signal(undefined);
    protected readonly all_items: WritableSignal<Item[] | undefined> = signal(undefined);
    protected readonly all_citizens: WritableSignal<Citizen[] | undefined> = signal(undefined);

    protected readonly is_dev: boolean = !environment.production;

    protected readonly zoom_min: number = MapComponent.ZOOM_MIN;
    protected readonly zoom_max: number = MapComponent.ZOOM_MAX;

    protected new_distance_option: Distance = {
        value: 1,
        unit: 'km'
    };

    /** Signal : réassigné depuis onResize() (HostListener migré), lu par le propre template. */
    protected readonly is_gt_xs: WritableSignal<boolean> = signal(this.breakpoint_observer.isMatched(BREAKPOINTS['gt-xs']));

    private readonly default_options: MapOptions = {
        map_type: 'digs',
        dig_mode: 'average',
        trash_mode: 'nb',
        displayed_scrut_zone: {},
        distances: [],
        zoom: MapComponent.ZOOM_DEFAULT,
        corners: sanitizeCorners(undefined),
        corners_version: CORNERS_VERSION,
        routes: DEFAULT_ROUTES_DISPLAY
    };

    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** Choix des coins, indexés par information : libellé, icône du jeu ou exemple de valeur. */
    protected readonly corner_views: Readonly<Record<CornerInfo, CornerInfoView>> = cornerInfoViews(moment.locale());
    /** Les mêmes, dans l'ordre du menu. */
    protected readonly corner_menu: readonly CornerInfoView[] = CORNER_INFO_OPTIONS.map((option: CornerInfoOption): CornerInfoView => this.corner_views[option.value]);
    /** Coin dont le menu est ouvert : posé au clic sur le quart de case, avant que le menu ne s'affiche. */
    protected readonly editing_corner: WritableSignal<CornerPosition> = signal('top_left');
    /** Les quatre coins du réglage, dans l'ordre de la case en quatre quarts du panneau. */
    protected readonly corner_fields: readonly CornerField[] = [
        { position: 'top_left', label: $localize`Haut gauche`, css_class: 'top-left' },
        { position: 'top_right', label: $localize`Haut droite`, css_class: 'top-right' },
        { position: 'bottom_left', label: $localize`Bas gauche`, css_class: 'bottom-left' },
        { position: 'bottom_right', label: $localize`Bas droite`, css_class: 'bottom-right' }
    ];

    /** Toujours défini (contrairement à map/all_ruins/all_items/all_citizens) : initialisé de façon
     * synchrone dans ngOnInit, avant le premier rendu — pas besoin d'un type `| undefined`. */
    protected readonly options: WritableSignal<MapOptions> = signal(this.default_options);

    /** Vue des options destinée aux cases. Elle ne change de référence que si une option qui
     *  modifie leur CONTENU a changé : sans cela, chaque cran de zoom marquerait les ~900
     *  mho-map-cell comme sales et rejouerait tous leurs pipes. */
    protected readonly cell_options: Signal<MapOptions> = computed((): MapOptions => this.options(), {
        equal: (previous: MapOptions, next: MapOptions): boolean => {
            return previous.map_type === next.map_type
                && previous.dig_mode === next.dig_mode
                && previous.trash_mode === next.trash_mode
                && previous.displayed_scrut_zone === next.displayed_scrut_zone
                && previous.distances === next.distances
                && previous.corners === next.corners;
        }
    });

    /** Légende du type de carte affiché : paliers et libellés du jeu, `null` sans légende. */
    protected readonly legend: Signal<readonly MapLegendEntry[] | null> = computed((): readonly MapLegendEntry[] | null => MAP_LEGENDS[this.options().map_type]);

    /** Disposition des coins pour le type de carte affiché, celle que le panneau modifie. */
    protected readonly current_corners: Signal<CornerLayout> = computed((): CornerLayout => this.options().corners[this.options().map_type]);

    /** La disposition du type affiché diffère-t-elle de celle d'origine ? Sinon, rien à réinitialiser. */
    protected readonly corners_are_custom: Signal<boolean> = computed((): boolean => {
        const map_type: MapType = this.options().map_type;
        const layout: CornerLayout = this.current_corners();
        return this.corner_fields.some((field: CornerField): boolean => layout[field.position] !== DEFAULT_CORNERS[map_type][field.position]);
    });

    protected readonly zoom_percent: Signal<number> = computed((): number => {
        return Math.round(this.options().zoom / MapComponent.ZOOM_DEFAULT * 100);
    });

    /** Onglet ouvert dans le panneau latéral. */
    protected readonly side_panel: WritableSignal<SidePanel> = signal('display');
    /** Panneau latéral ouvert, pour l'état pressé des boutons : posé aussitôt par les boutons, puis par
     *  `openedChange` (fermeture par la croix, le fond ou Échap). */
    protected readonly side_panel_opened: WritableSignal<boolean> = signal(false);
    /** Tracé dont la fiche est ouverte, mis en avant sur la carte. */
    protected readonly selected_route: WritableSignal<MapRouteKey | null> = signal(null);

    protected readonly routes_store: MapRoutesStore = inject(MapRoutesStore);
    protected readonly routes_status: Signal<MapRoutesStatus> = this.routes_store.status;
    /** Tracés réservés aux citoyens, vivants ou morts : un simple observateur n'a ni bouton ni onglet. */
    protected readonly routes_available: Signal<boolean> = inject(TownContextService).isCitizen;
    protected readonly route_editor: MapRouteEditor = inject(MapRouteEditor);
    /** Mode tracé : un clic sur la carte choisit une destination. */
    protected readonly route_editing: Signal<boolean> = this.route_editor.editing;

    /** Réglages des tracés seuls : `changeOptions` garde leur référence quand une autre option change, ce
     *  signal ne prévient donc personne à chaque cran de zoom et le calque ne recalcule rien. */
    private readonly routes_display: Signal<MapRoutesDisplay> = computed((): MapRoutesDisplay => this.options().routes);

    /** Tracés et itinéraires du jeu, groupés et colorés selon les réglages d'affichage. */
    protected readonly route_views: Signal<MapRouteView[]> = computed((): MapRouteView[] => {
        return buildRouteViews(this.routes_store.routes(), this.routes_store.game_routes(), this.map()?.day ?? 1, this.routes_display());
    });

    /** Tracés enregistrés à dessiner. En saisie, le tracé modifié est retiré (le brouillon le remplace) et les
     *  autres sont atténués. Ne dépend ni du zoom ni de la case survolée. */
    private readonly saved_route_drawings: Signal<readonly MapRouteDrawing[]> = computed((): readonly MapRouteDrawing[] => {
        if (!this.route_editing()) {
            return buildRouteDrawings(this.route_views(), this.selected_route());
        }
        const editing_key: MapRouteKey | null = this.route_editor.editing_key();
        const others: MapRouteView[] = this.route_views().filter((view: MapRouteView): boolean => view.key !== editing_key);
        return buildRouteDrawings(others, null).map((drawing: MapRouteDrawing): MapRouteDrawing => ({ ...drawing, dimmed: true }));
    });

    /** Ce que dessine le calque : ne dépend ni du zoom ni des autres options de la carte. */
    protected readonly route_drawings: Signal<readonly MapRouteDrawing[]> = computed((): readonly MapRouteDrawing[] => {
        const editor_drawings: MapRouteDrawing[] = this.route_editor.drawings();
        return editor_drawings.length ? [...this.saved_route_drawings(), ...editor_drawings] : this.saved_route_drawings();
    });

    /** Expéditions du jour : consignes par case (infobulle, détail, pastilles), réservées aux citoyens. */
    private readonly day_store: DayExpeditionsStore = inject(DayExpeditionsStore);

    /** Pastilles des cases à consignes, avec la voie et la couleur de leur tracé (cachées avec lui). */
    protected readonly order_badges: Signal<readonly MapOrderBadge[]> = computed((): readonly MapOrderBadge[] => {
        return buildOrderBadges(this.day_store.cell_orders(), this.route_drawings(), this.route_editor.draft()?.id ?? null);
    });

    /** Consignes du jour par tracé, pour sa fiche. */
    protected readonly route_order_counts: Signal<ReadonlyMap<number, RouteOrderCount>> = computed((): ReadonlyMap<number, RouteOrderCount> => {
        return routeOrderCounts(this.day_store.cell_orders());
    });

    private readonly map_container: Signal<ElementRef<HTMLElement>> = viewChild.required('mapContainer', { read: ElementRef });
    /** Non requis : les tests remplacent mho-draw-map par une doublure, et la carte doit alors
     *  simplement ne rien faire plutôt que de lever. */
    private readonly draw_map: Signal<DrawMapComponent | undefined> = viewChild(DrawMapComponent);
    private readonly sidenav: Signal<MatSidenav | undefined> = viewChild<MatSidenav>('sidenav');
    /** Lien venu de la page Expéditions : fiche d'un tracé (`?route=<id>`) ou saisie d'un nouveau (`?route=new`). */
    private readonly route_request: WritableSignal<number | 'new' | null> = signal(null);

    private readonly api_service: ApiService = inject(ApiService);
    private readonly town_service: TownService = inject(TownService);
    private readonly dialog: MatDialog = inject(MatDialog);
    private readonly snackbar: SnackbarService = inject(SnackbarService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);
    private readonly zone: NgZone = inject(NgZone);
    private readonly injector: Injector = inject(Injector);
    private readonly router: Router = inject(Router);
    private readonly activated_route: ActivatedRoute = inject(ActivatedRoute);

    private zoom_persist_handle: ReturnType<typeof setTimeout> | undefined;
    private drag_origin: DragOrigin | null = null;
    private dragging: boolean = false;

    /** Zoom à la molette : `passive: false` est indispensable pour neutraliser le zoom navigateur,
     *  et l'écoute reste hors d'Angular pour ne pas déclencher une détection à chaque cran inutile.
     *  Les navigateurs traduisant le pincement du pavé tactile en `ctrlKey + wheel`, le pincement
     *  est couvert par la même ligne. */
    private readonly onWheel: (event: WheelEvent) => void = (event: WheelEvent): void => {
        if (!event.ctrlKey) return;
        event.preventDefault();
        const direction: number = event.deltaY > 0 ? -1 : 1;
        const container: HTMLElement = this.map_container().nativeElement;
        const bounds: DOMRect = container.getBoundingClientRect();
        this.zone.run((): void => {
            this.setZoom(this.options().zoom + direction * MapComponent.ZOOM_STEP, {
                x: event.clientX - bounds.left,
                y: event.clientY - bounds.top
            });
        });
    };

    /** Glisser pour se déplacer. Le tactile est exclu : le défilement natif y est meilleur
     *  (inertie, rebond) et cohabite mal avec une capture de pointeur. */
    private readonly onPointerDown: (event: PointerEvent) => void = (event: PointerEvent): void => {
        // Remis à plat quoi qu'il arrive : un glisser terminé hors du conteneur n'a pas reçu son
        // `click`, et l'indicateur resté armé aurait étouffé le clic suivant.
        this.dragging = false;
        this.drag_origin = null;
        if (event.button !== 0 || event.pointerType === 'touch') return;
        const container: HTMLElement = this.map_container().nativeElement;
        this.drag_origin = {
            x: event.clientX,
            y: event.clientY,
            scroll_left: container.scrollLeft,
            scroll_top: container.scrollTop,
            pointer_id: event.pointerId
        };
        this.dragging = false;
    };

    private readonly onPointerMove: (event: PointerEvent) => void = (event: PointerEvent): void => {
        const origin: DragOrigin | null = this.drag_origin;
        if (!origin) return;

        const delta_x: number = event.clientX - origin.x;
        const delta_y: number = event.clientY - origin.y;
        if (!this.dragging && Math.hypot(delta_x, delta_y) < MapComponent.DRAG_THRESHOLD) return;

        const container: HTMLElement = this.map_container().nativeElement;
        if (!this.dragging) {
            this.dragging = true;
            container.classList.add('dragging');
            container.setPointerCapture(origin.pointer_id);
        }
        container.scrollLeft = origin.scroll_left - delta_x;
        container.scrollTop = origin.scroll_top - delta_y;
    };

    private readonly onPointerUp: () => void = (): void => {
        const container: HTMLElement = this.map_container().nativeElement;
        if (this.drag_origin && container.hasPointerCapture(this.drag_origin.pointer_id)) {
            container.releasePointerCapture(this.drag_origin.pointer_id);
        }
        this.drag_origin = null;
        container.classList.remove('dragging');
    };

    /** Un glisser se termine par un `click` sur la case de départ : on l'étouffe en capture pour
     *  ne pas ouvrir le détail d'une zone que personne ne visait. */
    private readonly onClickCapture: (event: MouseEvent) => void = (event: MouseEvent): void => {
        if (!this.dragging) return;
        this.dragging = false;
        event.stopPropagation();
        event.preventDefault();
    };

    public constructor() {
        // Potentiel des cases et position de la ville, pour la saisie des tracés.
        effect((): void => {
            this.route_editor.setMap(this.map());
        });

        // Expéditions du jour de la ville affichée, une fois sa carte et les droits connus : réservées aux citoyens.
        effect((): void => {
            const map: Town | undefined = this.map();
            const map_id: number | null = this.routes_store.map_id();
            if (!map || map_id === null || this.routes_store.status() !== 'loaded' || !this.routes_store.access()?.is_citizen) return;
            untracked((): void => this.day_store.load(map_id, map.day));
        });

        // Lien vers un tracé : appliqué une fois la carte, les tracés et le panneau prêts.
        effect((): void => {
            const request: number | 'new' | null = this.route_request();
            const sidenav: MatSidenav | undefined = this.sidenav();
            if (request === null || !sidenav || this.routes_store.status() !== 'loaded' || !this.map()) return;
            untracked((): void => this.applyRouteRequest(request, sidenav));
        });

        // Réglages des tracés disparus (supprimés, itinéraires du jeu effacés chaque nuit) : retirés une fois
        // les tracés de SA ville chargés. Une ville observée ne dit rien des tracés de la sienne.
        effect((): void => {
            if (this.routes_store.status() !== 'loaded' || !this.routes_store.access()?.is_current_town) return;
            const existing: Set<MapRouteKey> = new Set<MapRouteKey>(this.route_views().map((view: MapRouteView): MapRouteKey => view.key));
            const pruned: MapRoutesDisplay | null = pruneRoutesDisplay(this.routes_display(), existing);
            if (pruned) {
                this.changeOptions('routes', pruned);
            }
        });
    }

    /** Migré depuis `@HostListener('window:resize')` vers `host: {}` (voir décorateur ci-dessus). */
    protected onResize(): void {
        this.is_gt_xs.set(this.breakpoint_observer.isMatched(BREAKPOINTS['gt-xs']));
    }

    /** Échap en saisie de tracé : retire la dernière destination. Sauf si un menu, une fenêtre ou un champ
     *  l'a déjà pris pour lui. */
    protected onEscape(event: Event): void {
        if (!this.route_editing() || event.defaultPrevented) return;
        const target: EventTarget | null = event.target;
        if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
        this.route_editor.undo();
    }

    public ngOnInit(): void {
        this.options.set(this.readStoredOptions());

        const requested: string | null = this.activated_route.snapshot.queryParamMap.get('route');
        if (requested === 'new') {
            this.route_request.set('new');
        } else if (requested && /^\d+$/.test(requested)) {
            this.route_request.set(Number(requested));
        }

        // mapId de la ville affichée : la sienne, ou celle observée (getTown() suit le contexte).
        const map_id: number | undefined = getTown()?.town_id;
        if (map_id) {
            this.routes_store.load(map_id);
        }

        this.town_service
            .getMap()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (map: Town) => {
                    this.map.set(map);
                }
            });
        this.api_service
            .getRuins()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (ruins: Ruin[]) => {
                    this.all_ruins.set(ruins);
                }
            });
        this.api_service
            .getItems()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (items: Item[]) => {
                    this.all_items.set(items);
                }
            });
        this.town_service
            .getCitizens()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (citizens: CitizenInfo): void => {
                    this.all_citizens.set(citizens.citizens);
                }
            });
    }

    public ngAfterViewInit(): void {
        const container: HTMLElement = this.map_container().nativeElement;
        this.zone.runOutsideAngular((): void => {
            container.addEventListener('wheel', this.onWheel, { passive: false });
            container.addEventListener('pointerdown', this.onPointerDown);
            container.addEventListener('pointermove', this.onPointerMove);
            container.addEventListener('pointerup', this.onPointerUp);
            container.addEventListener('pointercancel', this.onPointerUp);
            container.addEventListener('click', this.onClickCapture, { capture: true });
        });
        this.destroy_ref.onDestroy((): void => {
            container.removeEventListener('wheel', this.onWheel);
            container.removeEventListener('pointerdown', this.onPointerDown);
            container.removeEventListener('pointermove', this.onPointerMove);
            container.removeEventListener('pointerup', this.onPointerUp);
            container.removeEventListener('pointercancel', this.onPointerUp);
            container.removeEventListener('click', this.onClickCapture, { capture: true });
            clearTimeout(this.zoom_persist_handle);
        });
    }

    /** Zoom au bouton : ancré au centre de la zone visible, pour ne pas perdre ce qu'on regarde. */
    protected zoomBy(steps: number): void {
        const container: HTMLElement = this.map_container().nativeElement;
        this.setZoom(this.options().zoom + steps * MapComponent.ZOOM_STEP, {
            x: container.clientWidth / 2,
            y: container.clientHeight / 2
        });
    }

    /** Plus grande taille de case qui fasse tenir la ville entière dans la zone visible. */
    protected fitZoom(): void {
        const town: Town | undefined = this.map();
        if (!town) return;

        const container: HTMLElement = this.map_container().nativeElement;
        const available_width: number = container.clientWidth - MapComponent.FIT_MARGIN;
        const available_height: number = container.clientHeight - MapComponent.FIT_MARGIN;

        for (let size: number = MapComponent.ZOOM_MAX; size > MapComponent.ZOOM_MIN; size -= 1) {
            const axis: number = 2 * MapComponent.axisSize(size);
            if (town.map_width * size + axis <= available_width && town.map_height * size + axis <= available_height) {
                this.setZoom(size);
                return;
            }
        }
        this.setZoom(MapComponent.ZOOM_MIN);
    }

    /** Ramène la case où l'on se trouve en jeu au centre de la zone visible. */
    protected goToMyPosition(): void {
        this.draw_map()?.scrollToMyCell();
    }

    protected addDistanceToList(): void {

        this.new_distance_option.value = +this.new_distance_option.value;
        /** On nettoie les options impossibles */
        if (this.new_distance_option.unit === 'km') {
            this.new_distance_option.round_trip = undefined;
        }

        const current_distances: Distance[] = [...this.options().distances];

        const already_exists: boolean = [...current_distances].some((distance: Distance) => {
            return distance.unit === this.new_distance_option.unit
                && +distance.value === +this.new_distance_option.value
                && distance.round_trip === this.new_distance_option.round_trip;
        });

        /** Si il existe une option absolument identique, alors on n'ajoute rien */
        if (already_exists && current_distances.length > 0) return;

        /** Sinon, on ajoute à la liste */
        current_distances.push({ ...this.new_distance_option });

        this.changeOptions('distances', [...current_distances]);
    }


    protected removeDistanceFromList(distance_to_remove: Distance): void {

        const current_distances: Distance[] = [...this.options().distances];

        const index: number = current_distances.findIndex((distance: Distance) => {
            return distance.unit === distance_to_remove.unit
                && +distance.value === +distance_to_remove.value
                && distance.round_trip === distance_to_remove.round_trip;
        });

        /** Si il n'existe pas d'option absolument identique, alors on ne retire rien */
        if (index < 0) return;

        /** Sinon, on retire de la liste */
        current_distances.splice(index, 1);

        this.changeOptions('distances', current_distances);
    }

    /** Remplace l'objet d'options au lieu de le muter : `cell_options` compare les champs de
     *  l'ancienne et de la nouvelle valeur, une mutation sur place les rendrait identiques et
     *  les cases ne seraient jamais rafraîchies. */
    protected changeOptions<K extends keyof MapOptions>(key: K, value: MapOptions[K]): void {
        const next: MapOptions = { ...this.options(), [key]: value };
        this.options.set(next);
        localStorage.setItem(MapComponent.STORAGE_KEY, JSON.stringify(next));
    }

    /** Change l'information d'un coin, pour le type de carte affiché seulement. */
    protected changeCorner(position: CornerPosition, info: CornerInfo): void {
        const map_type: MapType = this.options().map_type;
        const layout: CornerLayout = { ...this.options().corners[map_type], [position]: info };
        this.changeOptions('corners', { ...this.options().corners, [map_type]: layout });
    }

    /** Rend au type de carte affiché sa disposition d'origine. */
    protected resetCorners(): void {
        const map_type: MapType = this.options().map_type;
        this.changeOptions('corners', { ...this.options().corners, [map_type]: { ...DEFAULT_CORNERS[map_type] } });
    }

    /** Bouton de la barre d'outils : ouvre le panneau sur cet onglet, ou le ferme s'il y est déjà. */
    protected toggleSidePanel(sidenav: MatSidenav, panel: SidePanel): void {
        if (sidenav.opened && this.side_panel() === panel) {
            sidenav.close();
            this.onSidePanelOpenedChange(false);
            return;
        }
        this.showSidePanel(panel);
        sidenav.open();
        this.side_panel_opened.set(true);
    }

    /** Hors de l'onglet « Tracés », plus de fiche ouverte : le tracé choisi cesse d'être mis en avant. */
    protected showSidePanel(panel: SidePanel): void {
        this.side_panel.set(panel);
        if (panel !== 'routes') {
            this.selected_route.set(null);
        }
    }

    protected onSidePanelOpenedChange(opened: boolean): void {
        this.side_panel_opened.set(opened);
        if (!opened) {
            this.selected_route.set(null);
        }
    }

    protected toggleRouteVisibility(key: MapRouteKey): void {
        this.changeOptions('routes', toggleHidden(this.options().routes, key));
    }

    protected showAllRoutes(): void {
        this.changeOptions('routes', { ...this.options().routes, hidden: [] });
    }

    protected changeShowPreviousDays(show_previous_days: boolean): void {
        this.changeOptions('routes', { ...this.options().routes, show_previous_days });
    }

    protected changePersonalColor(change: MapRoutePersonalColor): void {
        this.changeOptions('routes', setPersonalColor(this.options().routes, change.key, change.color));
    }

    protected startNewRoute(sidenav: MatSidenav): void {
        this.route_editor.startNew();
        this.enterRouteEditing(sidenav);
    }

    protected editRoute(route: MapRoute, sidenav: MatSidenav): void {
        this.route_editor.startEdit(route);
        this.enterRouteEditing(sidenav);
    }

    /** Saisie terminée : le tracé enregistré est mis en avant, sa fiche ouverte. */
    protected onRouteEditorClosed(key: MapRouteKey | null): void {
        this.selected_route.set(key);
    }

    /** Bandeau de saisie : rouvre le panneau sur l'éditeur (sur mobile, il couvre la carte pendant la saisie). */
    protected openRouteEditor(sidenav: MatSidenav): void {
        this.showSidePanel('routes');
        sidenav.open();
        this.side_panel_opened.set(true);
    }

    protected onCellPicked(pick: MapCellPick): void {
        this.route_editor.pick(pick, pick.touch);
    }

    protected onCellHovered(point: MapRoutePoint | null): void {
        this.route_editor.hover(point);
    }

    protected deleteRoute(route: MapRoute): void {
        this.dialog
            .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
                data: {
                    title: $localize`Supprimer le tracé`,
                    text: route.linked_parts.length
                        ? $localize`Le tracé « ${route.label}:label: » sera supprimé. Les expéditions qui le suivent le perdront, leurs consignes restent.`
                        : $localize`Le tracé « ${route.label}:label: » sera supprimé.`
                }
            })
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe(async (confirm: boolean | undefined): Promise<void> => {
                if (!confirm) return;
                try {
                    await this.routes_store.deleteRoute(route.id);
                    if (this.selected_route() === mapRouteKey('mho', route.id)) {
                        this.selected_route.set(null);
                    }
                } catch {
                    this.snackbar.errorSnackbar($localize`Le tracé n'a pas pu être supprimé.`);
                }
            });
    }

    /** « Copier dans MHO » : le tracé créé est mis en avant, sa fiche ouverte. */
    protected async copyGameRoute(game_route: MapRouteGame): Promise<void> {
        try {
            const route: MapRoute = await this.routes_store.copyGameRoute(game_route.id);
            this.selected_route.set(mapRouteKey('mho', route.id));
        } catch {
            this.snackbar.errorSnackbar($localize`L'itinéraire n'a pas pu être copié.`);
        }
    }

    /** « Changer pour tous » : la couleur commune est enregistrée avec le tracé. */
    protected async changeCommonColor(change: MapRouteCommonColor): Promise<void> {
        if (change.route.color === change.color) return;
        try {
            await this.routes_store.saveRoute({ ...change.route.toRequestDto(), color: change.color });
        } catch (error: unknown) {
            this.snackbar.errorSnackbar(isHubConflictError(error)
                ? $localize`Le tracé vient d'être modifié par quelqu'un d'autre : réessayez.`
                : $localize`La couleur n'a pas pu être changée.`);
        }
    }

    /**
     * Lien venu de la page Expéditions, appliqué une seule fois puis retiré de l'adresse : fiche du tracé (affiché
     * s'il était masqué), ou saisie d'un nouveau tracé. Sur mobile, le panneau, qui couvrirait la carte, reste fermé.
     */
    private applyRouteRequest(request: number | 'new', sidenav: MatSidenav): void {
        this.route_request.set(null);
        void this.router.navigate([], { relativeTo: this.activated_route, queryParams: { route: null }, queryParamsHandling: 'merge', replaceUrl: true });
        if (request === 'new') {
            if (!this.routes_store.access()?.can_create) return;
            this.openRoutesPanel(sidenav);
            this.startNewRoute(sidenav);
            return;
        }
        if (!this.routes_store.routes().some((route: MapRoute): boolean => route.id === request)) return;
        const key: MapRouteKey = mapRouteKey('mho', request);
        if (this.options().routes.hidden.includes(key)) {
            this.toggleRouteVisibility(key);
        }
        this.openRoutesPanel(sidenav);
        this.selected_route.set(key);
    }

    private openRoutesPanel(sidenav: MatSidenav): void {
        this.showSidePanel('routes');
        if (this.is_gt_xs()) {
            sidenav.open();
            this.side_panel_opened.set(true);
        }
    }

    /** Sur mobile, le panneau couvrirait la carte : il se ferme, le bandeau de saisie permet d'y revenir. */
    private enterRouteEditing(sidenav: MatSidenav): void {
        this.selected_route.set(null);
        if (!this.is_gt_xs()) {
            sidenav.close();
            this.side_panel_opened.set(false);
        }
    }

    /**
     * @param value taille de case visée, bornée
     * @param anchor point de la zone visible à garder sous le curseur ; le centre par défaut
     */
    private setZoom(value: number, anchor?: ZoomAnchor): void {
        const previous: number = this.options().zoom;
        const zoom: number = MapComponent.clampZoom(value);
        if (zoom === previous) return;

        this.options.set({ ...this.options(), zoom });

        if (anchor) {
            const container: HTMLElement = this.map_container().nativeElement;
            const ratio: number = zoom / previous;
            const next_left: number = (container.scrollLeft + anchor.x) * ratio - anchor.x;
            const next_top: number = (container.scrollTop + anchor.y) * ratio - anchor.y;
            // La grille n'a sa nouvelle taille qu'une fois la vue rendue : corriger le
            // défilement tout de suite le ferait contre l'ancienne hauteur.
            afterNextRender((): void => {
                container.scrollLeft = next_left;
                container.scrollTop = next_top;
            }, { injector: this.injector });
        }

        clearTimeout(this.zoom_persist_handle);
        this.zoom_persist_handle = setTimeout((): void => {
            localStorage.setItem(MapComponent.STORAGE_KEY, JSON.stringify(this.options()));
        }, MapComponent.ZOOM_PERSIST_DELAY);
    }

    /** Fusionne les options stockées avec les valeurs par défaut : une option ajoutée après coup
     *  est ainsi rétro-remplie, et une entrée corrompue ne casse plus la page. */
    private readStoredOptions(): MapOptions {
        let stored: Partial<MapOptions>;
        try {
            stored = <Partial<MapOptions>>JSON.parse(localStorage.getItem(MapComponent.STORAGE_KEY) ?? '{}');
        } catch {
            stored = {};
        }
        const merged: MapOptions = { ...this.default_options, ...stored };
        merged.zoom = MapComponent.clampZoom(merged.zoom);
        // Sans version enregistrée, les dispositions datent de la version 1.
        merged.corners = sanitizeCorners(stored.corners, stored.corners_version ?? 1);
        merged.corners_version = CORNERS_VERSION;
        merged.routes = sanitizeRoutesDisplay(stored.routes);
        return merged;
    }

    private static clampZoom(value: number): number {
        if (!Number.isFinite(value)) return MapComponent.ZOOM_DEFAULT;
        return Math.min(MapComponent.ZOOM_MAX, Math.max(MapComponent.ZOOM_MIN, Math.round(value)));
    }

    /** Doit rester le pendant exact du `clamp()` posé sur `--mho-axis` dans draw-map.component.scss. */
    private static axisSize(cell: number): number {
        return Math.min(28, Math.max(16, cell * 0.6));
    }
}

interface DragOrigin {
    x: number;
    y: number;
    scroll_left: number;
    scroll_top: number;
    pointer_id: number;
}

interface ZoomAnchor {
    x: number;
    y: number;
}

interface CornerField {
    position: CornerPosition;
    label: string;
    /** Classe du quart de case : elle l'aligne vers son coin. */
    css_class: string;
}

type SidePanel = 'display' | 'routes';

export interface MapOptions {
    map_type: MapType;
    dig_mode: 'max' | 'average';
    trash_mode: 'nb' | 'def';
    displayed_scrut_zone: Dictionary<boolean>;
    distances: Distance[];
    /** Côté d'une case, en pixels. */
    zoom: number;
    /** Information affichée dans chaque coin des cases, par type de carte. */
    corners: CornerLayouts;
    /** Version des dispositions par défaut sous laquelle `corners` a été enregistré (voir CORNERS_VERSION). */
    corners_version: number;
    /** Tracés masqués, couleurs « pour moi seulement », jours précédents. */
    routes: MapRoutesDisplay;
}

export interface Distance {
    value: number;
    unit: 'km' | 'pa';
    round_trip?: boolean;
}
