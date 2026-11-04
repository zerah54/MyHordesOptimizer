import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, computed, input, InputSignal, Signal, signal, WritableSignal } from '@angular/core';

import { Imports } from '../../_abstract_model/types/_types';
import { Town } from '../../_abstract_model/types/town.class';
import { ItemSpot, spotsByItem } from './item-spots.util';

const angular_common: Imports = [CdkConnectedOverlay, CdkOverlayOrigin];

/** Case de la mini-carte. */
interface MiniCell {
    key: string;
    town: boolean;
    /** Exemplaires de l'objet au sol, 0 sans objet. */
    count: number;
    broken: boolean;
}

/** Contenu fourni (le nombre d'objets au sol) qui affiche au survol la carte entière, avec les cases où l'objet est au sol et leur nombre. */
@Component({
    selector: 'mho-item-map',
    templateUrl: './item-map.component.html',
    styleUrls: ['./item-map.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common]
})
export class ItemMapComponent {
    /** Carte de la ville, nulle tant qu'elle n'est pas chargée. */
    public readonly map: InputSignal<Town | null> = input.required<Town | null>();
    public readonly itemId: InputSignal<number> = input.required<number>();

    protected readonly open: WritableSignal<boolean> = signal(false);
    /** Au-dessus, en dessous, puis sur les côtés ; si rien ne tient, l'overlay est poussé dans la page. */
    protected readonly positions: ConnectedPosition[] = [
        { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -4 },
        { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 4 },
        { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -4 },
        { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: 4 }
    ];

    /** Cases de la carte entière, ligne par ligne ; calculées seulement à l'ouverture. */
    protected readonly cells: Signal<MiniCell[]> = computed((): MiniCell[] => {
        const town: Town | null = this.map();
        if (town === null) {
            return [];
        }
        const spots: Map<string, ItemSpot> = new Map<string, ItemSpot>(
            (spotsByItem(town.cells ?? []).get(this.itemId()) ?? []).map((spot: ItemSpot): [string, ItemSpot] => [`${spot.x}:${spot.y}`, spot]));
        const cells: MiniCell[] = [];
        for (let y: number = 0; y < town.map_height; y++) {
            for (let x: number = 0; x < town.map_width; x++) {
                const key: string = `${x}:${y}`;
                const spot: ItemSpot | undefined = spots.get(key);
                cells.push({ key, town: x === town.town_x && y === town.town_y, count: spot?.count ?? 0, broken: spot?.broken ?? false });
            }
        }
        return cells;
    });

    /** Au moins une case porte un exemplaire cassé : la légende s'affiche. */
    protected readonly has_broken: Signal<boolean> = computed((): boolean => this.cells().some((cell: MiniCell): boolean => cell.broken));
}
