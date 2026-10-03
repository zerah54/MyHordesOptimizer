import { BreakpointObserver } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import {
    afterNextRender,
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    ElementRef,
    inject,
    Injector,
    NgZone,
    OnInit,
    Signal,
    signal,
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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';

import { environment } from '../../../environments/environment';
import { BREAKPOINTS, HORDES_IMG_REPO } from '../../_abstract_model/const';
import { ApiService } from '../../_abstract_model/services/api.service';
import { TownService } from '../../_abstract_model/services/town.service';
import { Dictionary, Imports } from '../../_abstract_model/types/_types';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { CitizenInfo } from '../../_abstract_model/types/citizen-info.class';
import { Item } from '../../_abstract_model/types/item.class';
import { Ruin } from '../../_abstract_model/types/ruin.class';
import { Town } from '../../_abstract_model/types/town.class';
import { ScrollAuraDirective } from '../../_core/directives/scroll-aura.directive';
import { CompassRoseComponent } from '../../_shared/compass-rose/compass-rose.component';
import { DrawMapComponent } from './draw-map/draw-map.component';
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

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [CompassRoseComponent, DrawMapComponent];
const directives: Imports = [ScrollAuraDirective];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatButtonToggleModule, MatCardModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, MatListModule, MatMenuModule, MatOptionModule, MatSelectModule, MatSidenavModule, MatTooltipModule];

@Component({
    selector: 'mho-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
    host: {
        '(window:resize)': 'onResize()'
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
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
        corners_version: CORNERS_VERSION
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

    private readonly map_container: Signal<ElementRef<HTMLElement>> = viewChild.required('mapContainer', { read: ElementRef });
    /** Non requis : les tests remplacent mho-draw-map par une doublure, et la carte doit alors
     *  simplement ne rien faire plutôt que de lever. */
    private readonly draw_map: Signal<DrawMapComponent | undefined> = viewChild(DrawMapComponent);

    private readonly api_service: ApiService = inject(ApiService);
    private readonly town_service: TownService = inject(TownService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);
    private readonly zone: NgZone = inject(NgZone);
    private readonly injector: Injector = inject(Injector);

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

    /** Migré depuis `@HostListener('window:resize')` vers `host: {}` (voir décorateur ci-dessus). */
    protected onResize(): void {
        this.is_gt_xs.set(this.breakpoint_observer.isMatched(BREAKPOINTS['gt-xs']));
    }

    public ngOnInit(): void {
        this.options.set(this.readStoredOptions());

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
}

export interface Distance {
    value: number;
    unit: 'km' | 'pa';
    round_trip?: boolean;
}
