import { CommonModule, formatNumber, NgOptimizedImage } from '@angular/common';
import {
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    computed,
    ElementRef,
    input,
    InputSignal,
    InputSignalWithTransform,
    output,
    OutputEmitterRef,
    Signal,
    viewChild
} from '@angular/core';
import moment, { Moment } from 'moment';

import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import { Imports } from '../../../../_abstract_model/types/_types';
import { Cell } from '../../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { Item } from '../../../../_abstract_model/types/item.class';
import { ItemCountShort } from '../../../../_abstract_model/types/item-count-short.class';
import { Ruin } from '../../../../_abstract_model/types/ruin.class';
import { MapCellTooltipDirective } from '../../../../_core/directives/map-cell-tooltip.directive';
import { getUserId } from '../../../../_core/utilities/localstorage.util';
import { MapOptions } from '../../map.component';
import { CORNER_POSITIONS, cornerIcon, CornerInfo, CornerLayout, CornerPosition } from '../../map-corners';
import { digLevel, remainingDigs } from './pipes/dig-level.pipe';
import { DistBorderBottom, DistBorderLeft, DistBorderRight, DistBorderTop } from './pipes/dist-borders.pipe';
import { ScrutBorderBottom, ScrutBorderLeft, ScrutBorderRight, ScrutBorderTop } from './pipes/scrut-borders.pipe';
import { trashLevel } from './pipes/trash-level.pipe';
import { trashValue } from './pipes/trash-value.pipe';

const angular_common: Imports = [CommonModule, NgOptimizedImage];
const components: Imports = [
    DistBorderBottom, DistBorderLeft, DistBorderRight, DistBorderTop,
    ScrutBorderBottom, ScrutBorderLeft, ScrutBorderRight, ScrutBorderTop];
const pipes: Imports = [];
const material_modules: Imports = [];

/** Clé de la ruine sentinelle « Bâtiment non déterré », créée par MHO (voir
 *  `MyHordesImportService` côté API) : tant qu'elle est posée, le bâtiment est enseveli. */
const BURIED_RUIN_ID: number = -1;

/** Un plan de moins de 10 km est un plan peu commun, au-delà un plan rare — règle du jeu
 *  (`NightlyHandler::getZoneKm() < 10 ? bplan_u : bplan_r`). */
const UNCOMMON_BLUEPRINT_KM: number = 10;

const CORNER_CLASSES: Readonly<Record<CornerPosition, string>> = {
    top_left: 'corner-top-left',
    top_right: 'corner-top-right',
    bottom_left: 'corner-bottom-left',
    bottom_right: 'corner-bottom-right'
};

export type RuinMarker = 'buried' | 'explorable' | 'building';
export type BlueprintBadge = 'uncommon' | 'rare';

/** Ce qu'une case remonte quand on la choisit : le panneau de détail a besoin de l'élément
 *  pour se placer à côté d'elle. */
export interface MapCellSelection {
    cell: Cell;
    element: HTMLElement;
}

/** Contenu d'un coin, prêt à afficher : le gabarit n'a plus rien à calculer. */
export interface CellCorner {
    position: CornerPosition;
    css_class: string;
    info: CornerInfo;
    /** Icône du jeu, relative à HORDES_IMG_REPO. */
    icon: string | null;
    value: string | null;
    /** Valeur approximative (radar d'un éclaireur) : en italique. */
    estimation: boolean;
    title: string | null;
}

@Component({
    selector: 'mho-map-cell',
    templateUrl: './map-cell.component.html',
    styleUrls: ['./map-cell.component.scss', '../draw-map.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...components, ...material_modules, ...pipes, MapCellTooltipDirective]
})
export class MapCellComponent {

    public cell: InputSignal<Cell> = input.required();
    public drawedMap: InputSignal<Cell[][]> = input.required();
    public allRuins: InputSignal<Ruin[]> = input.required();
    public allCitizens: InputSignal<Citizen[]> = input.required();
    public allItems: InputSignal<Item[]> = input.required();
    public options: InputSignal<MapOptions> = input.required();
    public selected: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });
    /** Sur la ligne ou la colonne de la case choisie : croix de repérage. */
    public crossed: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });
    /** Palier de zoom « détail » : la case a la place de montrer l'illustration du bâtiment.
     *  Une entrée plutôt qu'un `:host-context` : sans elle, les ~900 cases porteraient chacune
     *  une image masquée. Elle ne change qu'au franchissement du seuil. */
    public detailed: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    public cellSelected: OutputEmitterRef<MapCellSelection> = output();
    public currentHoveredCellChange: OutputEmitterRef<Cell | undefined> = output();

    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    protected readonly locale: string = moment.locale();

    /** Classes de fond de la case. Un `computed` plutôt qu'un gabarit de chaîne dans le gabarit :
     *  celui-ci était reconstruit à chaque vérification de la vue, pour chacune des ~900 cases. */
    protected readonly background_classes: Signal<string> = computed((): string => {
        const cell: Cell = this.cell();
        const options: MapOptions = this.options();
        const classes: string[] = [];

        switch (options.map_type) {
            case 'danger':
                classes.push('alert', `danger-${cell.danger_level}`);
                break;
            case 'digs':
                classes.push('digs', `dig-${digLevel(cell, options)}`);
                break;
            case 'trash':
                classes.push('trash', `trash-${trashLevel(trashValue(cell, options, this.allItems()))}`);
                break;
            case 'scout':
                classes.push('scout');
                // Niveau relevé par un éclaireur seulement : sans relevé, le fond « inconnu »
                // plutôt qu'une case vide.
                if (cell.scout_zone_level !== null && cell.scout_zone_level !== undefined) {
                    classes.push(`scout-${cell.scout_zone_level}`);
                } else {
                    classes.push('scout-unknown');
                }
                break;
        }

        if (cell.is_town) classes.push('town');
        if (cell.is_never_visited) classes.push('never-visited');
        if (cell.is_visited_today) classes.push('visited-today');

        const zone_regen_class: string | undefined = cell.zone_regen?.value?.class;
        if (zone_regen_class) classes.push(zone_regen_class);

        return classes.join(' ');
    });

    protected readonly is_my_cell: Signal<boolean> = computed((): boolean => {
        return this.cell().citizens?.some((citizen: Citizen): boolean => citizen.id === getUserId()) ?? false;
    });

    /** Trois états exclusifs pour le marqueur central : bâtiment enseveli, ruine explorable,
     *  bâtiment ordinaire. */
    protected readonly ruin_marker: Signal<RuinMarker> = computed((): RuinMarker => {
        const cell: Cell = this.cell();
        if (cell.ruin_id === BURIED_RUIN_ID) return 'buried';
        const ruin: Ruin | undefined = this.allRuins()?.find((candidate: Ruin): boolean => candidate.id === cell.ruin_id);
        return ruin?.explorable ? 'explorable' : 'building';
    });

    /** Pastille de plan, tant qu'il n'a pas été récupéré. L'information n'est connue que pour les
     *  cases déjà visitées : `undefined` vaut « peut-être », donc la pastille est affichée. */
    protected readonly blueprint_badge: Signal<BlueprintBadge | null> = computed((): BlueprintBadge | null => {
        if (this.ruin_marker() !== 'building') return null;
        const cell: Cell = this.cell();
        if (cell.is_blueprint_found) return null;
        return cell.nb_km < UNCOMMON_BLUEPRINT_KM ? 'uncommon' : 'rare';
    });

    /** Tas restant à déblayer d'un bâtiment enseveli, affichés en bas à droite de son icône ; `null` sinon. */
    protected readonly ruin_digs: Signal<string | null> = computed((): string | null => {
        const cell: Cell = this.cell();
        if (cell.ruin_id !== BURIED_RUIN_ID || !(cell.nb_ruin_dig > 0)) return null;
        return this.format(cell.nb_ruin_dig);
    });

    /** Illustration native du bâtiment, au palier « détail » seulement. */
    protected readonly ruin_illustration: Signal<string | null> = computed((): string | null => {
        if (!this.detailed() || this.ruin_marker() !== 'building') return null;
        const cell: Cell = this.cell();
        const ruin: Ruin | undefined = this.allRuins()?.find((candidate: Ruin): boolean => candidate.id === cell.ruin_id);
        return ruin?.formatted_img ?? null;
    });

    /**
     * Coins de la case, selon la disposition réglée pour le type de carte affiché. Un coin sans
     * rien à montrer (pas de note, personne sur la case…) n'est pas rendu du tout.
     */
    protected readonly corners: Signal<CellCorner[]> = computed((): CellCorner[] => {
        const options: MapOptions = this.options();
        const layout: CornerLayout = options.corners[options.map_type];
        const corners: CellCorner[] = [];
        for (const position of CORNER_POSITIONS) {
            const corner: CellCorner | null = this.buildCorner(position, layout[position], options);
            if (corner) corners.push(corner);
        }
        return corners;
    });

    private readonly cell_element: Signal<ElementRef<HTMLElement>> = viewChild.required('cellHtml');

    protected selectCell(): void {
        this.cellSelected.emit({ cell: this.cell(), element: this.cell_element().nativeElement });
    }

    protected changeCurrentCell(cell?: Cell): void {
        this.currentHoveredCellChange.emit(cell);
    }

    private buildCorner(position: CornerPosition, info: CornerInfo, options: MapOptions): CellCorner | null {
        const cell: Cell = this.cell();
        const corner: CellCorner = {
            position,
            css_class: CORNER_CLASSES[position],
            info,
            icon: cornerIcon(info, this.locale),
            value: null,
            estimation: false,
            title: null
        };

        switch (info) {
            case 'none':
                return null;
            case 'note':
                return cell.note ? corner : null;
            case 'citizens': {
                const count: number = cell.citizens?.length ?? 0;
                if (count === 0) return null;
                corner.value = this.format(count);
                return corner;
            }
            case 'control_points':
                // `nb_hero` est le champ `h` de MyHordes : la somme des points de contrôle des
                // citoyens de la case. Souvent inconnue (non transmise, ville en chaos) et alors
                // ramenée à 0 : un 0 n'est pas affiché, il ne dirait rien de sûr.
                if (!(cell.nb_hero > 0)) return null;
                corner.value = this.format(cell.nb_hero);
                return corner;
            case 'zombies':
                if (cell.hasFresherScoutEstimation()) {
                    corner.value = `≈${cell.scout_estimation_zombie}`;
                    corner.estimation = true;
                    corner.title = $localize`Estimation d'un éclaireur : entre ${cell.scout_estimation_min}:min: et ${cell.scout_estimation_max}:max: zombies`;
                } else {
                    corner.value = this.format(cell.nb_zombie || 0);
                }
                return corner;
            case 'zombies_killed':
                corner.value = this.format(cell.nb_zombie_killed || 0);
                return corner;
            case 'digs_remaining':
                corner.value = this.format(remainingDigs(cell, options));
                return corner;
            case 'digs_success':
                if (!(cell.total_success > 0)) return null;
                corner.value = this.format(cell.total_success);
                return corner;
            case 'excavated':
                // Icône seule : un état, pas une quantité.
                if (cell.is_excavated !== true) return null;
                corner.title = $localize`Zone excavée`;
                return corner;
            case 'items': {
                const count: number = (cell.items ?? []).reduce((total: number, item: ItemCountShort): number => total + (item.count ?? 0), 0);
                if (count === 0) return null;
                corner.value = this.format(count);
                return corner;
            }
            case 'distance_km':
                corner.value = this.format(cell.nb_km);
                return corner;
            case 'distance_pa':
                corner.value = this.format(cell.nb_pa);
                return corner;
            case 'update_age': {
                const age: string | null = MapCellComponent.ageLabel(cell.update_info?.update_time);
                if (age === null) return null;
                corner.value = age;
                return corner;
            }
            case 'trash':
                corner.value = String(trashValue(cell, options, this.allItems()));
                return corner;
        }
    }

    private format(value: number): string {
        return formatNumber(value, this.locale, '1.0-0');
    }

    /** Ancienneté de la dernière mise à jour, au plus court pour tenir dans un coin : « 12m », « 5h », « 3j ». */
    private static ageLabel(update_time: Moment | undefined): string | null {
        if (!update_time?.isValid()) return null;
        const minutes: number = Math.max(0, moment().diff(update_time, 'minutes'));
        if (minutes < 60) return $localize`${minutes}:minutes:m`;
        const hours: number = Math.floor(minutes / 60);
        if (hours < 24) return $localize`${hours}:hours:h`;
        return $localize`${Math.floor(hours / 24)}:days:j`;
    }
}
