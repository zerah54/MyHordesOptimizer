import { Pipe, PipeTransform } from '@angular/core';

/**
 * Libellé des places en camping d'un bâtiment.
 * Une capacité négative est illimitée (règle de `CampingService.CanHideInsideBuilding` côté API),
 * une capacité absente est inconnue.
 */
@Pipe({
    name: 'ruinCapacity'
})
export class RuinCapacityPipe implements PipeTransform {
    public transform(capacity: number | null | undefined): string {
        if (capacity === null || capacity === undefined) return '?';
        if (capacity < 0) return '∞';
        return String(capacity);
    }
}
