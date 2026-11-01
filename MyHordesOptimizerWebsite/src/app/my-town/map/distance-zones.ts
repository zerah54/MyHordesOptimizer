import { Pipe, PipeTransform } from '@angular/core';

import { Cell } from '../../_abstract_model/types/cell.class';
import { ItemCountShort } from '../../_abstract_model/types/item-count-short.class';
import { Item } from '../../_abstract_model/types/item.class';
import { Distance, DistanceBorderStyle } from './map.component';

export interface DistanceColorOption {
    value: string;
    label: string;
}

export interface DistanceBorderStyleOption {
    value: DistanceBorderStyle;
    label: string;
}

/** Apparence d'origine des zones : tiretée, pour ne pas être confondue avec les filets du scrutateur. */
const DEFAULT_COLOR: string = 'var(--mho-map-fg)';
const DEFAULT_BORDER_STYLE: DistanceBorderStyle = 'dashed';

export const DISTANCE_COLORS: readonly DistanceColorOption[] = [
    { value: DEFAULT_COLOR, label: $localize`Par défaut` },
    { value: '#e0483d', label: $localize`Rouge` },
    { value: '#ee8f2e', label: $localize`Orange` },
    { value: '#e8c63a', label: $localize`Jaune` },
    { value: '#3fa35b', label: $localize`Vert` },
    { value: '#3b7fd6', label: $localize`Bleu` },
    { value: '#9a5fd0', label: $localize`Violet` }
];

export const DISTANCE_BORDER_STYLES: readonly DistanceBorderStyleOption[] = [
    { value: 'dashed', label: $localize`Tirets` },
    { value: 'dotted', label: $localize`Pointillés` },
    { value: 'solid', label: $localize`Plein` }
];

/** Copie modifiable d'une zone pour le formulaire, ou zone vierge ; complète les zones enregistrées sans apparence. */
export function distanceFormValue(distance?: Distance): Distance {
    return {
        value: 1,
        unit: 'km',
        color: DEFAULT_COLOR,
        border_style: DEFAULT_BORDER_STYLE,
        ...distance
    };
}

/** Une couleur hors palette a été choisie comme couleur précise. */
export function isCustomDistanceColor(color: string | undefined): boolean {
    return !DISTANCE_COLORS.some((option: DistanceColorOption): boolean => option.value === color);
}

/** Valeur CSS de la bordure d'une zone. */
export function distanceBorder(distance: Distance): string {
    return `2px ${distance.border_style ?? DEFAULT_BORDER_STYLE} ${distance.color ?? DEFAULT_COLOR}`;
}

/** La case est-elle dans la zone ? La ville (0 km, 0 PA) n'en fait jamais partie. */
function isInZone(cell: Cell, distance: Distance): boolean {
    if (distance.unit === 'km') {
        return cell.nb_km >= 1 && cell.nb_km <= distance.value;
    }
    /** Aller/retour : le budget utile à l'aller est la moitié du total. */
    const max_pa: number = distance.round_trip ? distance.value / 2 : distance.value;
    return cell.nb_pa >= 1 && cell.nb_pa <= max_pa;
}

/** Objets du référentiel désignés par leur uid ; un objet disparu du référentiel est ignoré. */
export function itemsWithUids(uids: string[] | undefined, items: Item[] | undefined): Item[] {
    const searched: Set<string> = new Set<string>(uids);
    return (items ?? []).filter((item: Item): boolean => searched.has(item.uid));
}

/** Quantité totale au sol, objets cassés compris, des objets sélectionnés sur les cases de la zone. */
export function countItemsInZone(distance: Distance, cells: Cell[] | undefined, items: Item[] | undefined): number {
    if (!cells) return 0;

    const ids: Set<number> = new Set<number>(itemsWithUids(distance.item_uids, items).map((item: Item): number => item.id));

    return cells
        .filter((cell: Cell): boolean => isInZone(cell, distance))
        .flatMap((cell: Cell): ItemCountShort[] => cell.items)
        .filter((item: ItemCountShort): boolean => ids.has(item.item_id))
        .reduce((total: number, item: ItemCountShort): number => total + item.count, 0);
}

@Pipe({
    name: 'distanceBorder'
})
export class DistanceBorderPipe implements PipeTransform {
    public transform(distance: Distance): string {
        return distanceBorder(distance);
    }
}

@Pipe({
    name: 'zoneItems'
})
export class ZoneItemsPipe implements PipeTransform {
    public transform(distance: Distance, items: Item[] | undefined): Item[] {
        return itemsWithUids(distance.item_uids, items);
    }
}

@Pipe({
    name: 'zoneItemCount'
})
export class ZoneItemCountPipe implements PipeTransform {
    public transform(distance: Distance, cells: Cell[] | undefined, items: Item[] | undefined): number {
        return countItemsInZone(distance, cells, items);
    }
}
