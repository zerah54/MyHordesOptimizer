import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
    name: 'cellDetailsTop',
    standalone: true,
})
export class CellDetailsTopPipe implements PipeTransform {
    transform(cell_html: HTMLTableCellElement): string | undefined {
        const offset_parent: HTMLTableElement = <HTMLTableElement>cell_html.offsetParent;
        return (cell_html.offsetTop < offset_parent.clientHeight / 2) ? cell_html.offsetTop + cell_html.clientHeight + 'px' : undefined;
    }
}

@Pipe({
    name: 'cellDetailsBottom',
    standalone: true,
})
export class CellDetailsBottomPipe implements PipeTransform {
    transform(cell_html: HTMLTableCellElement): string | undefined {
        const offset_parent: HTMLTableElement = <HTMLTableElement>cell_html.offsetParent;
        return (cell_html.offsetTop >= offset_parent.clientHeight / 2) ? offset_parent.clientHeight - cell_html.offsetTop + 'px' : undefined;
    }
}

@Pipe({
    name: 'cellDetailsLeft',
    standalone: true,
})
export class CellDetailsLeftPipe implements PipeTransform {
    transform(cell_html: HTMLTableCellElement): string | undefined {
        const offset_parent: HTMLTableElement = <HTMLTableElement>cell_html.offsetParent;
        return (cell_html.offsetLeft < offset_parent.clientWidth / 2) ? cell_html.offsetLeft + 'px' : undefined;
    }
}

@Pipe({
    name: 'cellDetailsRight',
    standalone: true,
})
export class CellDetailsRightPipe implements PipeTransform {
    transform(cell_html: HTMLTableCellElement): string | undefined {
        const offset_parent: HTMLTableElement = <HTMLTableElement>cell_html.offsetParent;
        return (cell_html.offsetLeft >= offset_parent.clientWidth / 2) ? offset_parent.clientWidth - cell_html.offsetLeft - cell_html.clientWidth - 2 + 'px' : undefined;
    }
}
