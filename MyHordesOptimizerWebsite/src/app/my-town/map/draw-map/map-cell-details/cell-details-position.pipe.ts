import { Pipe, PipeTransform } from '@angular/core';

/* Les quatre pipes placent le panneau du côté opposé à la moitié de carte où se trouve la case,
   pour qu'il ne sorte jamais de la zone de défilement. `offsetParent` est le conteneur de la
   grille (`.mho-draw-map`, en `position: relative`) : il couvre toute la carte, pas seulement la
   partie visible. */

/** Nul quand la case n'est pas rendue (masquée, ou sans mise en page comme sous jsdom) : le
    panneau garde alors la position de sa feuille de style au lieu de lever une erreur. */
function offsetParentOf(cell_html: HTMLElement): HTMLElement | null {
    return cell_html.offsetParent instanceof HTMLElement ? cell_html.offsetParent : null;
}


@Pipe({
    name: 'cellDetailsTop'
})
export class CellDetailsTopPipe implements PipeTransform {
    public transform(cell_html: HTMLElement): string | undefined {
        const offset_parent: HTMLElement | null = offsetParentOf(cell_html);
        if (!offset_parent) return undefined;
        return (cell_html.offsetTop < offset_parent.clientHeight / 2) ? cell_html.offsetTop + cell_html.clientHeight + 'px' : undefined;
    }
}

@Pipe({
    name: 'cellDetailsBottom'
})
export class CellDetailsBottomPipe implements PipeTransform {
    public transform(cell_html: HTMLElement): string | undefined {
        const offset_parent: HTMLElement | null = offsetParentOf(cell_html);
        if (!offset_parent) return undefined;
        return (cell_html.offsetTop >= offset_parent.clientHeight / 2) ? offset_parent.clientHeight - cell_html.offsetTop + 'px' : undefined;
    }
}

@Pipe({
    name: 'cellDetailsLeft'
})
export class CellDetailsLeftPipe implements PipeTransform {
    public transform(cell_html: HTMLElement): string | undefined {
        const offset_parent: HTMLElement | null = offsetParentOf(cell_html);
        if (!offset_parent) return undefined;
        return (cell_html.offsetLeft < offset_parent.clientWidth / 2) ? cell_html.offsetLeft + 'px' : undefined;
    }
}

@Pipe({
    name: 'cellDetailsRight'
})
export class CellDetailsRightPipe implements PipeTransform {
    public transform(cell_html: HTMLElement): string | undefined {
        const offset_parent: HTMLElement | null = offsetParentOf(cell_html);
        if (!offset_parent) return undefined;
        return (cell_html.offsetLeft >= offset_parent.clientWidth / 2) ? offset_parent.clientWidth - cell_html.offsetLeft - cell_html.clientWidth - 2 + 'px' : undefined;
    }
}
