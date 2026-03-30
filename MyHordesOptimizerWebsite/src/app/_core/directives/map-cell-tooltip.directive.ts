import { FlexibleConnectedPositionStrategy, Overlay, OverlayPositionBuilder, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ComponentRef, Directive, ElementRef, inject, input, InputSignal, OnDestroy } from '@angular/core';
import { Cell } from '../../_abstract_model/types/cell.class';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { Item } from '../../_abstract_model/types/item.class';
import { Ruin } from '../../_abstract_model/types/ruin.class';
import { MapCellTooltipComponent } from '../../my-town/map/draw-map/map-cell-tooltip/map-cell-tooltip.component';

@Directive({
    selector: '[mapCellTooltip]',
    host: {
        '(mouseenter)': 'show()',
        '(mouseleave)': 'hide()',
    },
})
export class MapCellTooltipDirective implements OnDestroy {
    public mapCellTooltip: InputSignal<Cell> = input.required();
    public mapCellTooltipAllRuins: InputSignal<Ruin[]> = input.required();
    public mapCellTooltipAllCitizens: InputSignal<Citizen[]> = input.required();
    public mapCellTooltipAllItems: InputSignal<Item[]> = input.required();

    private overlayRef: OverlayRef | null = null;

    private overlay: Overlay = inject(Overlay);
    private overlayPositionBuilder: OverlayPositionBuilder = inject(OverlayPositionBuilder);
    private elementRef: ElementRef = inject(ElementRef);

    protected show(): void {
        const positionStrategy: FlexibleConnectedPositionStrategy = this.overlayPositionBuilder
            .flexibleConnectedTo(this.elementRef)
            .withPositions([
                // 1. Droite, aligné en haut
                {
                    originX: 'end',
                    originY: 'top',
                    overlayX: 'start',
                    overlayY: 'top',
                },
                // 2. Droite, aligné en bas (si le bas de l'élément est trop proche du bord)
                {
                    originX: 'end',
                    originY: 'bottom',
                    overlayX: 'start',
                    overlayY: 'bottom',
                },
                // 3. Gauche, aligné en haut
                {
                    originX: 'start',
                    originY: 'top',
                    overlayX: 'end',
                    overlayY: 'top',
                },
                // 4. Gauche, aligné en bas
                {
                    originX: 'start',
                    originY: 'bottom',
                    overlayX: 'end',
                    overlayY: 'bottom',
                },
            ]);

        this.overlayRef = this.overlay.create({positionStrategy});

        const portal: ComponentPortal<MapCellTooltipComponent> = new ComponentPortal(MapCellTooltipComponent);
        const componentRef: ComponentRef<MapCellTooltipComponent> = this.overlayRef.attach(portal);
        componentRef.instance.cell.set(this.mapCellTooltip());
        componentRef.instance.allCitizens.set(this.mapCellTooltipAllCitizens());
        componentRef.instance.allItems.set(this.mapCellTooltipAllItems());
        componentRef.instance.allRuins.set(this.mapCellTooltipAllRuins());
    }

    protected hide(): void {
        this.overlayRef?.detach();
        this.overlayRef?.dispose();
        this.overlayRef = null;
    }

    public ngOnDestroy(): void {
        this.hide();
    }
}
